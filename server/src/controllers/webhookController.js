const db = require('../config/db');
const crypto = require('crypto');
const paymentService = require('../services/paymentService');
const paymentProviderService = require('../services/paymentProviderService');
const hubtelConfig = require('../config/hubtelConfig');

// ---------------------------------------------------------------------------
// The only unauthenticated endpoint in this file (Hubtel calls it server to
// server — there is no PowerBase user session to authenticate as). Trust is
// established by everything below, all independent of what the request body
// merely claims:
//
//   1. Path secret  — the URL itself contains HUBTEL_WEBHOOK_SECRET, which
//      PowerBase generated and handed to Hubtel as part of the callbackUrl
//      at checkout-initiation time (see paymentService.initiatePayment). A
//      request to any other path segment is rejected before the body is
//      even parsed for meaning. This exists because the official Hubtel
//      checkout-callback documentation reviewed for this integration did
//      not surface a documented request-signing/HMAC scheme for this
//      product — see the note in hubtelProvider.js.
//   2. Known reference — ClientReference must match a payment PowerBase
//      itself created and is still expecting an outcome for (status
//      INITIATED). A reference we never issued, or one we've already
//      resolved, is logged and ignored rather than acted on.
//   3. Matching checkout — CheckoutId must match the one Hubtel gave
//      PowerBase for that same client_reference at initiation, so a
//      callback can't be redirected at a different in-flight payment.
//   4. Matching amount — the amount Hubtel reports must equal the amount
//      PowerBase itself calculated and stored for this order
//      (payments.amount, set from orders.grand_total at initiation — never
//      from anything the browser or Hubtel sends). A mismatch is logged and
//      the payment is left exactly as it was; PAID is never applied to a
//      different amount than PowerBase's own order total.
//
// Only once all four hold does this call paymentService.applyPaymentOutcome
// — the same function adminController.confirmPayment calls — so the actual
// stock/order/settlement cascade is identical either way (Phase 1E).
// ---------------------------------------------------------------------------

async function logWebhookEvent(fields) {
  try {
    await db.execute(
      `INSERT INTO payment_webhook_events (payment_id,provider,checkout_id,client_reference,reported_status,reported_amount,outcome,detail)
       VALUES (?,?,?,?,?,?,?,?)`,
      [fields.paymentId || null, fields.provider || 'HUBTEL', fields.checkoutId || null, fields.clientReference || null,
        fields.reportedStatus || null, fields.reportedAmount == null ? null : fields.reportedAmount, fields.outcome, fields.detail || null],
    );
  } catch (e) {
    // Logging must never be why a webhook fails to process — this is
    // observability, not the authority (see migration 005's comment).
    console.error('Failed to record payment_webhook_events row:', e.message);
  }
}

exports.hubtelCallback = async (req, res) => {
  const suppliedToken = String(req.params.token || '');
  const expectedToken = hubtelConfig.config().webhookSecret;
  // Constant-time comparison so response timing can't be used to guess the
  // secret one character at a time.
  const tokenOk = suppliedToken.length === expectedToken.length
    && expectedToken.length > 0
    && crypto.timingSafeEqual(Buffer.from(suppliedToken), Buffer.from(expectedToken));
  if (!tokenOk) {
    // Deliberately generic — this path is public by necessity, so it says
    // nothing that would help someone find the right token by guessing.
    return res.status(404).end();
  }

  const provider = paymentProviderService.getProvider('HUBTEL');
  const normalized = provider.normalizeCallbackPayload(req.body);
  if (!normalized) {
    await logWebhookEvent({ outcome: 'UNRECOGNIZED_PAYLOAD', detail: 'Body did not match the expected Hubtel checkout callback shape' });
    // 200: acknowledge receipt so Hubtel does not retry a payload PowerBase
    // will never be able to interpret differently on a later attempt.
    return res.status(200).json({ received: true });
  }

  const [paymentRows] = await db.execute(
    `SELECT p.id,p.order_id,p.status,p.amount,p.checkout_id FROM payments p WHERE p.client_reference=? LIMIT 1`,
    [normalized.clientReference],
  );
  if (!paymentRows.length) {
    await logWebhookEvent({
      provider: 'HUBTEL', checkoutId: normalized.checkoutId, clientReference: normalized.clientReference,
      reportedStatus: normalized.rawStatus, reportedAmount: normalized.amount,
      outcome: 'UNKNOWN_REFERENCE', detail: 'No payment row for this clientReference',
    });
    return res.status(200).json({ received: true });
  }
  const payment = paymentRows[0];

  if (payment.checkout_id && String(payment.checkout_id) !== normalized.checkoutId) {
    await logWebhookEvent({
      paymentId: payment.id, provider: 'HUBTEL', checkoutId: normalized.checkoutId, clientReference: normalized.clientReference,
      reportedStatus: normalized.rawStatus, reportedAmount: normalized.amount,
      outcome: 'CHECKOUT_MISMATCH', detail: `Expected checkoutId ${payment.checkout_id}`,
    });
    return res.status(200).json({ received: true });
  }

  if (normalized.amount != null && Math.abs(Number(payment.amount) - normalized.amount) > 0.01) {
    await logWebhookEvent({
      paymentId: payment.id, provider: 'HUBTEL', checkoutId: normalized.checkoutId, clientReference: normalized.clientReference,
      reportedStatus: normalized.rawStatus, reportedAmount: normalized.amount,
      outcome: 'AMOUNT_MISMATCH', detail: `Expected ${payment.amount}`,
    });
    return res.status(200).json({ received: true });
  }

  if (!normalized.status) {
    await logWebhookEvent({
      paymentId: payment.id, provider: 'HUBTEL', checkoutId: normalized.checkoutId, clientReference: normalized.clientReference,
      reportedStatus: normalized.rawStatus, reportedAmount: normalized.amount,
      outcome: 'UNRECOGNIZED_STATUS', detail: normalized.rawStatus,
    });
    return res.status(200).json({ received: true });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await paymentService.applyPaymentOutcome(conn, {
      orderId: payment.order_id,
      status: normalized.status,
      provider: 'HUBTEL',
      transactionReference: normalized.transactionReference,
      checkoutId: normalized.checkoutId,
      failureReason: normalized.status !== 'PAID' ? normalized.rawStatus : null,
      metadata: normalized.metadata,
    });
    if (!result.ok) {
      await conn.rollback();
      await logWebhookEvent({
        paymentId: payment.id, provider: 'HUBTEL', checkoutId: normalized.checkoutId, clientReference: normalized.clientReference,
        reportedStatus: normalized.rawStatus, reportedAmount: normalized.amount, outcome: 'REJECTED', detail: result.message,
      });
      return res.status(200).json({ received: true });
    }
    await conn.commit();
    await logWebhookEvent({
      paymentId: payment.id, provider: 'HUBTEL', checkoutId: normalized.checkoutId, clientReference: normalized.clientReference,
      reportedStatus: normalized.rawStatus, reportedAmount: normalized.amount,
      outcome: result.idempotent ? 'DUPLICATE_IGNORED' : 'APPLIED',
    });
    return res.status(200).json({ received: true });
  } catch (e) {
    await conn.rollback();
    console.error('Hubtel webhook processing failed:', e);
    // 500 here is deliberate: an unexpected server-side failure (e.g. a
    // dropped DB connection) is exactly the case Hubtel's own retry policy
    // exists for — a non-2xx response asks them to try again later, which is
    // safe because applyPaymentOutcome is idempotent.
    return res.status(500).json({ received: false });
  } finally {
    conn.release();
  }
};
