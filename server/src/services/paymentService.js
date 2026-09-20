const db = require('../config/db');
const crypto = require('crypto');
const { commitItems, releaseItems } = require('./stockService');
const { customerEventTitle, customerEventDescription } = require('./orderStateService');
const hubtelConfig = require('../config/hubtelConfig');

// ---------------------------------------------------------------------------
// applyPaymentOutcome — the ONE place allowed to move payments.status to
// PAID/FAILED/CANCELLED and cascade the rest of the PowerBase lifecycle
// (stock commit/release, order status, settlement eligibility, order_events,
// notifications). Both adminController.confirmPayment (an operator manually
// recording what a provider told them, e.g. over the phone or from a
// provider dashboard) and paymentController.hubtelCallback (an
// automatically *verified* provider notification) call this function —
// neither has its own copy of the state-transition logic. That is what
// "clearly distinguish provider-verified payment from Admin manual
// confirmation" (Phase 1E) means here: the two entry points differ in how
// they establish trust that the outcome is real, not in what happens once
// they have. This is a lift of what was previously inline in
// adminController.confirmPayment — behaviour is unchanged, only extracted.
//
// The amount actually written is always the order's own grand_total, never
// a value passed in by any caller — a caller that wants to *validate* a
// provider-reported amount (e.g. the Hubtel webhook) does that itself,
// before calling this function, and simply doesn't call it at all on a
// mismatch (see hubtelCallback).
// ---------------------------------------------------------------------------
async function applyPaymentOutcome(conn, { orderId, status, provider, transactionReference, checkoutId, failureReason, metadata }) {
  if (!['PAID', 'FAILED', 'CANCELLED'].includes(status)) {
    return { ok: false, code: 400, message: 'Payment status must be PAID, FAILED or CANCELLED' };
  }
  if (status === 'PAID' && (!transactionReference || !provider)) {
    return { ok: false, code: 400, message: 'A provider and transaction reference are required when confirming a payment as PAID' };
  }

  const [orders] = await conn.execute('SELECT id,user_id,order_number,status,grand_total FROM orders WHERE id=? FOR UPDATE', [orderId]);
  if (!orders.length) return { ok: false, code: 404, message: 'Order not found' };
  const order = orders[0];
  const [payments] = await conn.execute('SELECT id,status FROM payments WHERE order_id=? FOR UPDATE', [orderId]);
  if (!payments.length) return { ok: false, code: 404, message: 'No payment record exists for this order' };
  const payment = payments[0];

  // Terminal and idempotent: replaying a confirmation cannot deduct stock
  // twice or resurrect a cancelled order. This is the entire idempotency
  // guarantee for Phase 1D — a duplicate Hubtel webhook for an
  // already-PAID payment lands here and does nothing further.
  if (payment.status === status) return { ok: true, code: 200, idempotent: true, message: 'Payment already in this state', status, order };
  if (payment.status === 'PAID' && status !== 'PAID') return { ok: false, code: 409, message: 'A confirmed payment cannot be reversed here — record a refund instead' };
  if (order.status === 'CANCELLED') return { ok: false, code: 409, message: 'This order has been cancelled' };

  if (status === 'PAID') {
    await conn.execute(
      `UPDATE payments SET status='PAID',provider=?,transaction_reference=?,amount=?,paid_at=NOW(),
              checkout_id=COALESCE(?,checkout_id), provider_metadata=? WHERE id=?`,
      [provider, transactionReference, order.grand_total, checkoutId || null, metadata ? JSON.stringify(metadata) : null, payment.id],
    );
    // Reservation -> real deduction, atomically with the payment record.
    await commitItems(conn, { orderId });
    // A settlement becomes payable only now. It still cannot be marked PAID
    // until the order is delivered — see adminController.updateSettlement.
    await conn.execute(
      `UPDATE vendor_settlements SET status='ELIGIBLE',eligible_at=NOW() WHERE order_id=? AND status='PENDING'`, [orderId],
    );
    await conn.execute(`UPDATE orders SET status='CONFIRMED' WHERE id=?`, [orderId]);
    await conn.execute('INSERT INTO order_events (order_id,status,title,description) VALUES (?,?,?,?)',
      [orderId, 'CONFIRMED', customerEventTitle('CONFIRMED'), customerEventDescription('CONFIRMED')]);
    await conn.execute('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)',
      [order.user_id, 'ORDER_UPDATE', `Order ${order.order_number} confirmed`, `PowerBase has received your payment for order ${order.order_number}.`]);
  } else {
    await conn.execute(
      `UPDATE payments SET status=?,provider=?,transaction_reference=?,failure_reason=?,
              checkout_id=COALESCE(?,checkout_id) WHERE id=?`,
      [status, provider || 'PENDING', transactionReference || null, failureReason || null, checkoutId || null, payment.id],
    );
    // Nothing was ever deducted, so releasing simply returns the held units
    // to sellable stock.
    await releaseItems(conn, { orderId });
    await conn.execute(`UPDATE vendor_settlements SET status='CANCELLED' WHERE order_id=? AND status NOT IN ('PAID','PROCESSING')`, [orderId]);
    if (status === 'CANCELLED') {
      await conn.execute(`UPDATE orders SET status='CANCELLED' WHERE id=?`, [orderId]);
      await conn.execute(`UPDATE vendor_orders SET status='CANCELLED' WHERE order_id=? AND status NOT IN ('DELIVERED','CANCELLED')`, [orderId]);
      await conn.execute('INSERT INTO order_events (order_id,status,title,description) VALUES (?,?,?,?)',
        [orderId, 'CANCELLED', customerEventTitle('CANCELLED'), customerEventDescription('CANCELLED')]);
    } else {
      await conn.execute('INSERT INTO order_events (order_id,status,title,description) VALUES (?,?,?,?)',
        [orderId, order.status, 'Payment Not Completed', 'We could not confirm payment for this order. Your items are no longer being held.']);
    }
    await conn.execute('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)',
      [order.user_id, 'ORDER_UPDATE', `Order ${order.order_number}`, `Payment for order ${order.order_number} was not completed.`]);
  }

  return { ok: true, code: 200, status, order, transactionReference: transactionReference || null };
}

// ---------------------------------------------------------------------------
// initiatePayment — customer-triggered. Creates (or safely reuses) a Hubtel
// checkout for this order's payments row.
//
// Idempotency (Phase 1D): a double-click, page refresh, or repeated request
// while a checkout is already INITIATED and still within the reuse window
// returns the *same* checkoutUrl rather than opening a second Hubtel
// checkout for the same order. Every fresh attempt (first try, or retrying
// after FAILED/CANCELLED/expired) gets its own new client_reference — that
// column is UNIQUE, so two concurrent attempts for the same order can never
// collide into the same Hubtel checkout by accident.
// ---------------------------------------------------------------------------
async function initiatePayment(conn, { orderId, userId }) {
  const [orders] = await conn.execute('SELECT id,user_id,order_number,status,grand_total,customer_name,customer_email,customer_phone FROM orders WHERE id=? FOR UPDATE', [orderId]);
  if (!orders.length) return { ok: false, code: 404, message: 'Order not found' };
  const order = orders[0];
  if (order.user_id !== userId) return { ok: false, code: 404, message: 'Order not found' };
  if (!['DELIVERY_FEE_QUOTED', 'AWAITING_DELIVERY_PAYMENT'].includes(order.status)) {
    return { ok: false, code: 409, message: 'This order is not ready for payment yet' };
  }

  const [payments] = await conn.execute('SELECT * FROM payments WHERE order_id=? FOR UPDATE', [orderId]);
  if (!payments.length) return { ok: false, code: 404, message: 'No payment record exists for this order' };
  const payment = payments[0];
  if (payment.status === 'PAID') return { ok: false, code: 409, message: 'This order has already been paid for' };

  const reuseWindowMs = hubtelConfig.config().checkoutReuseMinutes * 60 * 1000;
  const stillFresh = payment.status === 'INITIATED' && payment.checkout_url
    && payment.initiated_at && (Date.now() - new Date(payment.initiated_at).getTime()) < reuseWindowMs;
  if (stillFresh) {
    return { ok: true, code: 200, reused: true, checkoutUrl: payment.checkout_url };
  }

  if (!hubtelConfig.isEnabled()) {
    return { ok: false, code: 503, message: 'Online payment is not configured yet. Please contact PowaBase support.' };
  }

  const cfg = hubtelConfig.config();
  const clientReference = `PB${orderId}-${crypto.randomBytes(5).toString('hex')}`.slice(0, 32);
  const provider = require('./paymentProviderService').getProvider('HUBTEL');

  let checkout;
  try {
    checkout = await provider.initiateCheckout({
      amount: Number(order.grand_total),
      description: `PowerBase order ${order.order_number}`,
      clientReference,
      callbackUrl: `${cfg.apiBaseUrl.replace(/\/$/, '')}/api/webhooks/hubtel/callback/${cfg.webhookSecret}`,
      returnUrl: `${cfg.clientUrl.replace(/\/$/, '')}/order-details/${order.order_number}`,
      cancellationUrl: `${cfg.clientUrl.replace(/\/$/, '')}/order-details/${order.order_number}`,
      payeeName: order.customer_name || undefined,
      payeeMobileNumber: order.customer_phone || undefined,
      payeeEmail: order.customer_email || undefined,
    });
  } catch (e) {
    // Nothing written yet — the payment row is left exactly as it was
    // (PENDING, or the previous FAILED/CANCELLED), safe to retry.
    return { ok: false, code: e.status || 502, message: e.message || 'Could not start the payment' };
  }

  await conn.execute(
    `UPDATE payments SET status='INITIATED', provider='HUBTEL', amount=?, currency='GHS',
            client_reference=?, checkout_id=?, checkout_url=?, initiated_at=NOW() WHERE id=?`,
    [order.grand_total, checkout.clientReference, checkout.checkoutId, checkout.checkoutUrl, payment.id],
  );

  return { ok: true, code: 200, reused: false, checkoutUrl: checkout.checkoutUrl };
}

module.exports = { applyPaymentOutcome, initiatePayment };
