const db = require('../config/db');
const { releaseItems } = require('./stockService');

// ---------------------------------------------------------------------------
// Reservation expiry.
//
// An order that is created but never paid for holds its stock reservation
// forever, which quietly removes sellable units from a vendor's inventory.
// This sweeps those reservations back.
//
// Only orders that are genuinely still awaiting payment are touched:
//   - payment row is PENDING (never PAID, FAILED or CANCELLED)
//   - order is in a pre-confirmation state
//   - order is older than the configured window
//
// A confirmed payment is never reversed here. Once stock is COMMITTED,
// releaseItems() finds nothing in 'RESERVED' and does nothing, so even a
// mistimed sweep cannot claw back stock from a paid order.
//
// The window is deliberately generous: PowerBase quotes a delivery fee
// manually, so a customer may legitimately wait a while before paying.
// ---------------------------------------------------------------------------

const DEFAULT_WINDOW_HOURS = 48;

// Order states from which an unpaid order may still be expired. CONFIRMED and
// anything past it are excluded — those have been paid for.
const EXPIRABLE_ORDER_STATUSES = [
  'PENDING',
  'DELIVERY_FEE_PENDING',
  'DELIVERY_FEE_QUOTED',
  'AWAITING_DELIVERY_PAYMENT',
];

function windowHours() {
  const configured = Number(process.env.RESERVATION_EXPIRY_HOURS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_WINDOW_HOURS;
}

/**
 * Find and release expired reservations.
 *
 * Each order is handled in its own transaction so one failure cannot roll back
 * the rest of the sweep.
 *
 * @returns {{ scanned: number, released: number, orderIds: number[] }}
 */
async function releaseExpiredReservations({ hours = windowHours() } = {}) {
  const placeholders = EXPIRABLE_ORDER_STATUSES.map(() => '?').join(',');

  // DISTINCT because an order has one order_items row per line.
  const [candidates] = await db.execute(
    `SELECT DISTINCT o.id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id AND oi.stock_state = 'RESERVED'
       LEFT JOIN payments pay ON pay.order_id = o.id
      WHERE o.status IN (${placeholders})
        AND (pay.status IS NULL OR pay.status = 'PENDING')
        AND o.created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
    [...EXPIRABLE_ORDER_STATUSES, hours],
  );

  const releasedOrderIds = [];

  for (const { id: orderId } of candidates) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Re-check under a lock. Between the scan above and here the customer
      // may have paid, so the payment state is verified again rather than
      // trusted from the earlier read.
      const [rows] = await conn.execute(
        `SELECT o.id, o.user_id, o.order_number, o.status, pay.status payment_status
           FROM orders o LEFT JOIN payments pay ON pay.order_id = o.id
          WHERE o.id = ? FOR UPDATE`,
        [orderId],
      );
      if (!rows.length) { await conn.rollback(); conn.release(); continue; }
      const order = rows[0];

      const stillExpirable =
        EXPIRABLE_ORDER_STATUSES.includes(order.status) &&
        (order.payment_status === null || order.payment_status === 'PENDING');

      if (!stillExpirable) { await conn.rollback(); conn.release(); continue; }

      const released = await releaseItems(conn, { orderId });
      if (!released) { await conn.rollback(); conn.release(); continue; }

      await conn.execute(`UPDATE orders SET status = 'CANCELLED' WHERE id = ?`, [orderId]);
      await conn.execute(
        `UPDATE vendor_orders SET status = 'CANCELLED' WHERE order_id = ? AND status NOT IN ('DELIVERED','CANCELLED')`,
        [orderId],
      );
      await conn.execute(
        `UPDATE vendor_settlements SET status = 'CANCELLED' WHERE order_id = ? AND status NOT IN ('PAID','PROCESSING')`,
        [orderId],
      );
      await conn.execute('UPDATE payments SET status = ? WHERE order_id = ? AND status = ?', ['CANCELLED', orderId, 'PENDING']);
      await conn.execute(
        'INSERT INTO order_events (order_id,status,title,description) VALUES (?,?,?,?)',
        [orderId, 'CANCELLED', 'Order Cancelled', 'This order was cancelled because payment was not completed in time. The items are no longer being held.'],
      );
      await conn.execute(
        'INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)',
        [order.user_id, 'ORDER_UPDATE', `Order ${order.order_number} cancelled`,
          `We could not confirm payment for order ${order.order_number}, so it has been cancelled. You're welcome to place it again.`],
      );

      await conn.commit();
      releasedOrderIds.push(orderId);
    } catch (err) {
      await conn.rollback();
      console.error(`[reservations] failed to expire order ${orderId}:`, err.message);
    } finally {
      conn.release();
    }
  }

  return { scanned: candidates.length, released: releasedOrderIds.length, orderIds: releasedOrderIds };
}

/**
 * Run the sweep on an interval for the life of the process.
 *
 * In-process rather than a separate worker, because PowerBase runs as a single
 * Render service. If the backend is ever scaled past one instance this should
 * move to a scheduled job so two instances don't sweep concurrently — the
 * per-order locking makes that safe, but it is wasted work.
 *
 * Disabled by setting RESERVATION_SWEEP_MINUTES=0.
 */
function startReservationSweeper() {
  const minutes = Number(process.env.RESERVATION_SWEEP_MINUTES);
  const interval = Number.isFinite(minutes) ? minutes : 30;
  if (interval <= 0) return null;

  const timer = setInterval(async () => {
    try {
      const result = await releaseExpiredReservations();
      if (result.released) {
        console.log(`[reservations] released ${result.released} expired reservation(s): ${result.orderIds.join(', ')}`);
      }
    } catch (err) {
      console.error('[reservations] sweep failed:', err.message);
    }
  }, interval * 60 * 1000);

  timer.unref?.();
  return timer;
}

module.exports = { releaseExpiredReservations, startReservationSweeper, EXPIRABLE_ORDER_STATUSES };
