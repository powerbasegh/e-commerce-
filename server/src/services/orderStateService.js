const { releaseItems } = require('./stockService');

// ---------------------------------------------------------------------------
// The relationship between a PowerBase order and its vendor orders.
//
//   orders.status         customer-facing. PowerBase owns it. Only the
//                         delivery-fee flow, payment confirmation and admin
//                         fulfilment actions write it directly.
//   vendor_orders.status  internal per-vendor fulfilment state. A vendor
//                         writes only this, and only within the narrow set of
//                         transitions below.
//
// A vendor action never writes orders.status directly; it writes its own
// vendor_orders row and then deriveOrderStatus() recomputes the customer
// order from the full set of vendor orders. That is what keeps the two from
// drifting into an inconsistent pair.
// ---------------------------------------------------------------------------

// What a VENDOR may do. Deliberately narrower than the vendor_orders enum:
//
//   OUT_FOR_DELIVERY / DELIVERED are PowerBase's to set. PowerBase, not the
//   vendor, runs last-mile delivery and confirms receipt, and DELIVERED is
//   the gate on settlement payout — letting a vendor set it would let a
//   vendor unlock their own payout.
//
//   CANCELLED is allowed only from PENDING, i.e. before the vendor has begun
//   fulfilment, and releases that vendor's stock reservation.
const VENDOR_ALLOWED_TRANSITIONS = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_FOR_DELIVERY'],
  READY_FOR_DELIVERY: [],
  OUT_FOR_DELIVERY: [],
  DELIVERED: [],
  CANCELLED: [],
};

// Order states from which a vendor may act at all. Before payment is
// confirmed the stock is only reserved and PowerBase has not been paid, so
// there is nothing for a vendor to fulfil yet.
const VENDOR_ACTIONABLE_ORDER_STATUSES = ['CONFIRMED', 'PROCESSING', 'READY_FOR_DELIVERY'];

// Customer-order states that a vendor action must never overwrite — these are
// set by PowerBase and sit downstream of vendor fulfilment.
const POWERBASE_OWNED_STATUSES = ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

function vendorAllowedNext(currentStatus) {
  return VENDOR_ALLOWED_TRANSITIONS[currentStatus] || [];
}

/**
 * Recompute orders.status from the current set of vendor_orders rows, and
 * write it if it changed. Returns the resulting order status.
 *
 * Called inside the same transaction as the vendor_orders update.
 */
async function deriveOrderStatus(conn, orderId) {
  const [orderRows] = await conn.execute('SELECT id, user_id, status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
  if (!orderRows.length) return null;
  const order = orderRows[0];

  // Never walk an order backwards out of a state PowerBase owns.
  if (POWERBASE_OWNED_STATUSES.includes(order.status)) return order.status;
  if (!VENDOR_ACTIONABLE_ORDER_STATUSES.includes(order.status)) return order.status;

  const [vendorOrders] = await conn.execute('SELECT status FROM vendor_orders WHERE order_id = ?', [orderId]);
  if (!vendorOrders.length) return order.status;

  const active = vendorOrders.filter((v) => v.status !== 'CANCELLED');

  let next;
  if (!active.length) {
    // Every vendor withdrew — the customer order can no longer be fulfilled.
    next = 'CANCELLED';
  } else if (active.every((v) => ['READY_FOR_DELIVERY'].includes(v.status))) {
    next = 'READY_FOR_DELIVERY';
  } else if (active.some((v) => ['PROCESSING', 'READY_FOR_DELIVERY'].includes(v.status))) {
    next = 'PROCESSING';
  } else {
    next = 'CONFIRMED';
  }

  if (next === order.status) return order.status;

  await conn.execute('UPDATE orders SET status = ? WHERE id = ?', [next, orderId]);
  await conn.execute(
    'INSERT INTO order_events (order_id,status,title,description) VALUES (?,?,?,?)',
    [orderId, next, customerEventTitle(next), customerEventDescription(next)],
  );

  if (next === 'CANCELLED') {
    // Nothing left to fulfil: hand any still-reserved stock back and void the
    // internal settlement liabilities for this order.
    await releaseItems(conn, { orderId });
    await conn.execute(
      `UPDATE vendor_settlements SET status = 'CANCELLED' WHERE order_id = ? AND status NOT IN ('PAID','PROCESSING')`,
      [orderId],
    );
    await conn.execute('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)', [
      order.user_id,
      'ORDER_UPDATE',
      'Order cancelled',
      'Your PowerBase order could not be fulfilled and has been cancelled. Our team will be in touch.',
    ]);
  }

  return next;
}

// Customer-facing wording only. Vendors are never named or hinted at here —
// the customer's relationship is with PowerBase.
function customerEventTitle(status) {
  return {
    CONFIRMED: 'Order Confirmed',
    PROCESSING: 'Order Being Prepared',
    READY_FOR_DELIVERY: 'Ready for Delivery',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    CANCELLED: 'Order Cancelled',
  }[status] || 'Order Updated';
}

function customerEventDescription(status) {
  return {
    CONFIRMED: 'PowerBase has confirmed your order and payment.',
    PROCESSING: 'Your items are being prepared for delivery.',
    READY_FOR_DELIVERY: 'Your order is packed and ready to go out for delivery.',
    OUT_FOR_DELIVERY: 'Your order is on its way to you.',
    DELIVERED: 'Your order has been delivered. Thank you for shopping with PowerBase.',
    CANCELLED: 'Your PowerBase order has been cancelled.',
  }[status] || 'Your order status has been updated.';
}

/**
 * Read-only readiness check for the READY_FOR_DELIVERY -> OUT_FOR_DELIVERY
 * transition. Shares the same "all active vendor_orders are
 * READY_FOR_DELIVERY" rule deriveOrderStatus() uses, so the two can never
 * disagree, but — unlike deriveOrderStatus — never writes orders.status,
 * order_events or notifications. It exists purely so admin's OUT_FOR_DELIVERY
 * guard can ask "is this order genuinely ready?" without the side effect of
 * mutating state as a byproduct of a permission check.
 *
 * Call within the same transaction as the write it is guarding, after the
 * caller has already taken FOR UPDATE on the orders row, so the answer is
 * consistent with the write that follows it.
 */
async function isReadyForDelivery(conn, orderId) {
  const [vendorOrders] = await conn.execute('SELECT status FROM vendor_orders WHERE order_id = ?', [orderId]);
  if (!vendorOrders.length) return false;
  const active = vendorOrders.filter((v) => v.status !== 'CANCELLED');
  if (!active.length) return false; // every vendor withdrew — nothing to deliver
  return active.every((v) => v.status === 'READY_FOR_DELIVERY');
}

module.exports = {
  VENDOR_ALLOWED_TRANSITIONS,
  VENDOR_ACTIONABLE_ORDER_STATUSES,
  vendorAllowedNext,
  deriveOrderStatus,
  isReadyForDelivery,
  customerEventTitle,
  customerEventDescription,
};
