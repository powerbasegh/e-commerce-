const crypto = require('crypto');
const { commitItems, releaseItems } = require('./stockService');
const { customerEventTitle, customerEventDescription } = require('./orderStateService');
const paymentProviderService = require('./paymentProviderService');
const paystackConfig = require('../config/paystackConfig');

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

  if (payment.status === status) return { ok: true, code: 200, idempotent: true, message: 'Payment already in this state', status, order };
  if (payment.status === 'PAID' && status !== 'PAID') return { ok: false, code: 409, message: 'A confirmed payment cannot be reversed here — record a refund instead' };
  if (order.status === 'CANCELLED') return { ok: false, code: 409, message: 'This order has been cancelled' };

  if (status === 'PAID') {
    await conn.execute(
      `UPDATE payments SET status='PAID',provider=?,transaction_reference=?,amount=?,paid_at=NOW(),
              checkout_id=COALESCE(?,checkout_id), provider_metadata=? WHERE id=?`,
      [provider, transactionReference, order.grand_total, checkoutId || null, metadata ? JSON.stringify(metadata) : null, payment.id],
    );
    await commitItems(conn, { orderId });
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
              checkout_id=COALESCE(?,checkout_id), provider_metadata=? WHERE id=?`,
      [status, provider || 'PAYSTACK', transactionReference || null, failureReason || null, checkoutId || null, metadata ? JSON.stringify(metadata) : null, payment.id],
    );
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

  if (!paystackConfig.isEnabled()) {
    return { ok: false, code: 503, message: 'Online payment is not configured yet. Please contact PowerBase support.' };
  }

  const stillFresh = payment.status === 'INITIATED' && payment.checkout_url
    && payment.initiated_at && (Date.now() - new Date(payment.initiated_at).getTime()) < 30 * 60 * 1000;
  if (stillFresh) return { ok: true, code: 200, reused: true, checkoutUrl: payment.checkout_url };

  const provider = paymentProviderService.getProvider('PAYSTACK');
  const clientReference = `PB-${order.order_number}-${crypto.randomBytes(6).toString('hex')}`;
  let checkout;
  try {
    checkout = await provider.initiateCheckout({
      amount: order.grand_total,
      description: `PowerBase order ${order.order_number}`,
      clientReference,
      email: order.customer_email,
      callbackUrl: `${paystackConfig.config().clientUrl.replace(/\/$/, '')}/orders/${encodeURIComponent(order.order_number)}`,
      metadata: { orderNumber: order.order_number, orderId: String(order.id), customerId: String(order.user_id) },
    });
  } catch (e) {
    return { ok: false, code: e.status || 502, message: e.message || 'Could not start the payment' };
  }

  // Paystack callback_url is the customer-facing React order route. The
  // returned reference is verified by the frontend/backend payment status
  // flow; the webhook remains the independent fulfillment source of truth.
  await conn.execute(
    `UPDATE payments SET status='INITIATED', provider='PAYSTACK', amount=?, currency='GHS',
            client_reference=?, checkout_id=?, checkout_url=?, initiated_at=NOW() WHERE id=?`,
    [order.grand_total, checkout.clientReference, checkout.checkoutId, checkout.checkoutUrl, payment.id],
  );

  return { ok: true, code: 200, reused: false, checkoutUrl: checkout.checkoutUrl };
}

async function verifyAndApplyPayment(conn, { orderId, reference }) {
  const [rows] = await conn.execute(
    `SELECT p.id,p.order_id,p.status,p.amount,p.currency,p.client_reference,p.checkout_id,o.user_id,o.order_number
       FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.order_id=? FOR UPDATE`,
    [orderId],
  );
  if (!rows.length) return { ok: false, code: 404, message: 'Payment not found' };
  const payment = rows[0];
  if (!reference || String(reference) !== String(payment.client_reference)) {
    return { ok: false, code: 400, message: 'Payment reference does not match this order' };
  }
  if (payment.status === 'PAID') return { ok: true, code: 200, status: 'PAID', idempotent: true };

  const provider = paymentProviderService.getProvider('PAYSTACK');
  const verified = await provider.verifyPayment(reference);
  if (verified.reference !== String(payment.client_reference)) return { ok: false, code: 409, message: 'Payment reference mismatch' };
  if (verified.currency && verified.currency !== 'GHS') return { ok: false, code:409, message:'Payment currency mismatch' };
  if (verified.amountSubunit != null) {
    const expectedMinor = Math.round(Number(payment.amount) * 100);
    if (verified.amountSubunit !== expectedMinor) return { ok: false, code:409, message:'Payment amount mismatch' };
  }
  if (!verified.status) return { ok: true, code: 200, status: verified.rawStatus || 'PENDING', pending: true };

  const result = await applyPaymentOutcome(conn, {
    orderId,
    status: verified.status,
    provider: 'PAYSTACK',
    transactionReference: verified.transactionReference,
    checkoutId: payment.checkout_id,
    failureReason: verified.status !== 'PAID' ? verified.rawStatus : null,
    metadata: verified.metadata,
  });
  return result;
}

module.exports = { applyPaymentOutcome, initiatePayment, verifyAndApplyPayment };
