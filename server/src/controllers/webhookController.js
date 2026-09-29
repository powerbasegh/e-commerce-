const db = require('../config/db');
const paymentService = require('../services/paymentService');
const paymentProviderService = require('../services/paymentProviderService');
const paystackConfig = require('../config/paystackConfig');

async function logWebhookEvent(fields) {
  try {
    await db.execute(
      `INSERT INTO payment_webhook_events (payment_id,provider,checkout_id,client_reference,reported_status,reported_amount,outcome,detail)
       VALUES (?,?,?,?,?,?,?,?)`,
      [fields.paymentId || null, fields.provider || 'PAYSTACK', fields.checkoutId || null, fields.clientReference || null,
        fields.reportedStatus || null, fields.reportedAmount == null ? null : fields.reportedAmount, fields.outcome, fields.detail || null],
    );
  } catch (e) {
    console.error('Failed to record payment_webhook_events row:', e.message);
  }
}

exports.paystackWebhook = async (req, res) => {
  const provider = paymentProviderService.getProvider('PAYSTACK');
  const signature = req.headers['x-paystack-signature'];
  if (!provider.verifyWebhookSignature(req.rawBody, signature)) {
    return res.status(401).json({ message: 'Invalid webhook signature' });
  }

  const normalized = provider.normalizeWebhookPayload(req.body);
  if (!normalized) {
    await logWebhookEvent({ outcome: 'IGNORED_EVENT', detail: `Unsupported or malformed Paystack event: ${req.body?.event || 'unknown'}` });
    return res.status(200).json({ received: true });
  }

  const [paymentRows] = await db.execute(
    `SELECT p.id,p.order_id,p.status,p.amount,p.currency,p.client_reference,p.checkout_id
       FROM payments p WHERE p.client_reference=? LIMIT 1`,
    [normalized.clientReference],
  );
  if (!paymentRows.length) {
    await logWebhookEvent({ provider:'PAYSTACK', checkoutId:normalized.checkoutId, clientReference:normalized.clientReference,
      reportedStatus:normalized.rawStatus, reportedAmount:normalized.amount, outcome:'UNKNOWN_REFERENCE', detail:'No payment row for this Paystack reference' });
    return res.status(200).json({ received: true });
  }
  const payment = paymentRows[0];

  if (payment.status === 'PAID') {
    await logWebhookEvent({ paymentId:payment.id, provider:'PAYSTACK', checkoutId:normalized.checkoutId, clientReference:normalized.clientReference,
      reportedStatus:normalized.rawStatus, reportedAmount:normalized.amount, outcome:'DUPLICATE_IGNORED' });
    return res.status(200).json({ received: true });
  }

  if (normalized.amount == null || Math.round(Number(payment.amount) * 100) !== Number(normalized.amountSubunit)) {
    await logWebhookEvent({ paymentId:payment.id, provider:'PAYSTACK', checkoutId:normalized.checkoutId, clientReference:normalized.clientReference,
      reportedStatus:normalized.rawStatus, reportedAmount:normalized.amount, outcome:'AMOUNT_MISMATCH', detail:`Expected ${payment.amount} GHS` });
    return res.status(200).json({ received: true });
  }
  if (normalized.currency && normalized.currency !== 'GHS') {
    await logWebhookEvent({ paymentId:payment.id, provider:'PAYSTACK', checkoutId:normalized.checkoutId, clientReference:normalized.clientReference,
      reportedStatus:normalized.rawStatus, reportedAmount:normalized.amount, outcome:'CURRENCY_MISMATCH', detail:`Expected GHS, received ${normalized.currency}` });
    return res.status(200).json({ received: true });
  }

  // Re-verify the transaction server-to-server before applying value. The
  // webhook signature proves origin; the Verify API confirms transaction data.
  let verified;
  try {
    verified = await provider.verifyPayment(normalized.clientReference);
  } catch (e) {
    await logWebhookEvent({ paymentId:payment.id, provider:'PAYSTACK', checkoutId:normalized.checkoutId, clientReference:normalized.clientReference,
      reportedStatus:normalized.rawStatus, reportedAmount:normalized.amount, outcome:'VERIFICATION_FAILED', detail:e.message });
    return res.status(500).json({ received: false });
  }
  if (verified.status !== 'PAID' || verified.reference !== normalized.clientReference || verified.amountSubunit !== Number(normalized.amountSubunit) || (verified.currency && verified.currency !== 'GHS')) {
    await logWebhookEvent({ paymentId:payment.id, provider:'PAYSTACK', checkoutId:normalized.checkoutId, clientReference:normalized.clientReference,
      reportedStatus:normalized.rawStatus, reportedAmount:normalized.amount, outcome:'VERIFICATION_REJECTED', detail:'Verified transaction did not match the PowerBase payment' });
    return res.status(200).json({ received: true });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await paymentService.applyPaymentOutcome(conn, {
      orderId: payment.order_id,
      status: 'PAID',
      provider: 'PAYSTACK',
      transactionReference: verified.transactionReference,
      checkoutId: payment.checkout_id || normalized.checkoutId,
      metadata: verified.metadata,
    });
    if (!result.ok) {
      await conn.rollback();
      await logWebhookEvent({ paymentId:payment.id, provider:'PAYSTACK', checkoutId:normalized.checkoutId, clientReference:normalized.clientReference,
        reportedStatus:normalized.rawStatus, reportedAmount:normalized.amount, outcome:'REJECTED', detail:result.message });
      return res.status(200).json({ received: true });
    }
    await conn.commit();
    await logWebhookEvent({ paymentId:payment.id, provider:'PAYSTACK', checkoutId:normalized.checkoutId, clientReference:normalized.clientReference,
      reportedStatus:normalized.rawStatus, reportedAmount:normalized.amount, outcome:result.idempotent?'DUPLICATE_IGNORED':'APPLIED' });
    return res.status(200).json({ received: true });
  } catch (e) {
    await conn.rollback();
    console.error('Paystack webhook processing failed:', e);
    return res.status(500).json({ received: false });
  } finally {
    conn.release();
  }
};
