// ---------------------------------------------------------------------------
// Stock reservation lifecycle.
//
//   order created            -> reserveItems()   products.reserved_quantity += qty
//   payment confirmed PAID   -> commitItems()    stock_quantity -= qty, reserved -= qty
//   payment FAILED/CANCELLED -> releaseItems()   reserved_quantity -= qty
//   cancelled pre-fulfilment -> releaseItems()   reserved_quantity -= qty
//
// Sellable stock is always (stock_quantity - reserved_quantity). Physical
// stock is only reduced once PowerBase has actually been paid, so an
// abandoned or failed checkout no longer silently destroys a vendor's
// inventory (the behaviour before migration 004).
//
// Every function here takes an existing transaction connection so the stock
// move commits atomically with the payment/order change that caused it. None
// of them ever reads a quantity supplied by a client: quantities always come
// from the order_items rows PowerBase itself wrote at checkout.
//
// commit/release are idempotent by construction — they only act on rows still
// in 'RESERVED', so replaying a payment webhook cannot double-deduct stock.
// ---------------------------------------------------------------------------

/**
 * Reserve stock for a freshly created order.
 *
 * @param conn   an open transaction connection
 * @param items  [{ productId, qty }] — server-normalised, never raw client input
 */
async function reserveItems(conn, items) {
  for (const { productId, qty } of items) {
    // The WHERE clause is the concurrency guard: if a parallel checkout took
    // the last units between our FOR UPDATE read and here, affectedRows is 0
    // and we fail the whole order rather than overselling.
    const [result] = await conn.execute(
      `UPDATE products
          SET reserved_quantity = reserved_quantity + ?
        WHERE id = ? AND (stock_quantity - reserved_quantity) >= ?`,
      [qty, productId, qty],
    );
    if (!result.affectedRows) {
      throw Object.assign(new Error('Not enough stock is available for one or more items'), { status: 409 });
    }
  }
}

/**
 * Turn reservations into real stock deductions. Called only after PowerBase
 * has confirmed the customer's payment.
 *
 * Scope with { orderId } for a whole PowerBase order, or { vendorOrderId }
 * for a single vendor's portion of it.
 */
async function commitItems(conn, { orderId, vendorOrderId }) {
  const rows = await lockReservedItems(conn, { orderId, vendorOrderId });
  for (const row of rows) {
    if (!row.product_id) continue; // product was deleted; nothing to move
    await conn.execute(
      `UPDATE products
          SET stock_quantity    = GREATEST(CAST(stock_quantity AS SIGNED) - ?, 0),
              reserved_quantity = GREATEST(CAST(reserved_quantity AS SIGNED) - ?, 0)
        WHERE id = ?`,
      [row.quantity, row.quantity, row.product_id],
    );
  }
  await markItems(conn, rows, 'COMMITTED');
  return rows.length;
}

/**
 * Give reserved units back to sellable stock — failed/expired payment, or an
 * order cancelled before fulfilment. Physical stock is untouched because it
 * was never deducted.
 */
async function releaseItems(conn, { orderId, vendorOrderId }) {
  const rows = await lockReservedItems(conn, { orderId, vendorOrderId });
  for (const row of rows) {
    if (!row.product_id) continue;
    await conn.execute(
      `UPDATE products
          SET reserved_quantity = GREATEST(CAST(reserved_quantity AS SIGNED) - ?, 0)
        WHERE id = ?`,
      [row.quantity, row.product_id],
    );
  }
  await markItems(conn, rows, 'RELEASED');
  return rows.length;
}

async function lockReservedItems(conn, { orderId, vendorOrderId }) {
  if (vendorOrderId) {
    const [rows] = await conn.execute(
      `SELECT id, product_id, quantity FROM order_items
        WHERE vendor_order_id = ? AND stock_state = 'RESERVED' FOR UPDATE`,
      [vendorOrderId],
    );
    return rows;
  }
  const [rows] = await conn.execute(
    `SELECT id, product_id, quantity FROM order_items
      WHERE order_id = ? AND stock_state = 'RESERVED' FOR UPDATE`,
    [orderId],
  );
  return rows;
}

async function markItems(conn, rows, state) {
  for (const row of rows) {
    await conn.execute('UPDATE order_items SET stock_state = ? WHERE id = ?', [state, row.id]);
  }
}

module.exports = { reserveItems, commitItems, releaseItems };
