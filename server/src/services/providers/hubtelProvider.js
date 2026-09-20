// Hubtel adapter — the only file in PowerBase that knows Hubtel's specific
// request/response shapes. Everything else talks to paymentService, which
// talks to this through the small interface paymentProviderService exposes
// (initiateCheckout / normalizeCallbackPayload), so adding a second provider
// later (e.g. Paystack) means writing one more file like this one, not
// touching order/stock/settlement logic.
//
// Endpoint, request fields and response shape below are taken from Hubtel's
// published Online Checkout API reference (businessdocs-developers.hubtel.com,
// "API Reference - Online Checkout" and "Checkout Callback" pages), reviewed
// at integration time:
//
//   POST https://payproxyapi.hubtel.com/items/initiate
//   Authorization: Basic base64(clientId:clientSecret)
//   { totalAmount, description, callbackUrl, returnUrl, cancellationUrl,
//     merchantAccountNumber, clientReference, payeeName?, payeeMobileNumber?,
//     payeeEmail? }
//   -> { responseCode: "0000", status: "Success",
//        data: { checkoutUrl, checkoutId, clientReference, checkoutDirectUrl } }
//
//   Callback POSTed to callbackUrl:
//   { ResponseCode, Status, Data: { CheckoutId, SalesInvoiceId,
//     ClientReference, Status, Amount, CustomerPhoneNumber, PaymentDetails,
//     Description } }
//
// NOT implemented here: a Hubtel "Transaction Status Check" verification
// call for the Online Checkout product. Investigated twice now (Phase 1 and
// Phase 2) without finding a confirmable contract:
//
//   - businessdocs-developers.hubtel.com (Hubtel's own docs site) states a
//     "Status Check API" exists and is mandatory to call as a fallback when
//     no callback arrives within 5 minutes — but the reference page for it
//     returns ROBOTS_DISALLOWED to automated fetching, and no search result
//     surfaced its endpoint/method/fields for the Online Checkout product
//     specifically (payproxyapi.hubtel.com, the product this integration
//     uses).
//   - The only concrete "transaction status" endpoint found anywhere —
//     GET /v1/merchantaccount/merchants/{accountNumber}/transactions/status
//     — comes from a 2017 third-party, unofficial, seemingly unmaintained
//     PHP package (github.com/jowusu837/laravel-hubtel-merchant-account) for
//     Hubtel's older, separate "Merchant Account" (Receive Money) product,
//     not Online Checkout. Its request fields (invoiceToken,
//     networkTransactionId, hubtelTransactionId) don't map cleanly onto what
//     Online Checkout gives us (checkoutId, clientReference), and nothing
//     confirms it still exists, is unchanged, or ever applied to this
//     product. Implementing verifyPayment against it would be exactly the
//     "guess an endpoint to make tests pass" the integration instructions
//     rule out.
//
// So this stays a stub that fails loudly rather than a function that would
// silently do the wrong thing. See the Phase 2 final report for what's
// needed from Hubtel directly to close this out properly.

const HUBTEL_STATUS_TO_INTERNAL = {
  Success: 'PAID',
  Successful: 'PAID',
  Paid: 'PAID',
  Failed: 'FAILED',
  Unsuccessful: 'FAILED',
  Cancelled: 'CANCELLED',
  Canceled: 'CANCELLED',
};

function authHeader(cfg) {
  return `Basic ${Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64')}`;
}

/**
 * Ask Hubtel to create a checkout for this payment. Throws on any failure —
 * callers must not treat a thrown error as "payment failed", only as
 * "we could not even start a checkout" (the payment record is left PENDING).
 */
async function initiateCheckout(cfg, { amount, description, clientReference, callbackUrl, returnUrl, cancellationUrl, payeeName, payeeMobileNumber, payeeEmail }) {
  const body = {
    totalAmount: amount,
    description,
    callbackUrl,
    returnUrl,
    cancellationUrl,
    merchantAccountNumber: cfg.merchantAccountNumber,
    clientReference,
  };
  if (payeeName) body.payeeName = payeeName;
  if (payeeMobileNumber) body.payeeMobileNumber = payeeMobileNumber;
  if (payeeEmail) body.payeeEmail = payeeEmail;

  let res;
  try {
    res = await fetch(cfg.checkoutInitiateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: authHeader(cfg) },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw Object.assign(new Error('Could not reach the payment provider'), { status: 502, cause: e });
  }
  let json;
  try { json = await res.json(); } catch { json = null; }
  const ok = res.ok && json && (json.responseCode === '0000' || String(json.status || '').toLowerCase() === 'success');
  if (!ok) {
    throw Object.assign(new Error((json && (json.message || json.status)) || 'Payment provider rejected the checkout request'), { status: 502 });
  }
  const data = json.data || {};
  if (!data.checkoutUrl || !data.checkoutId) {
    throw Object.assign(new Error('Payment provider response was missing the checkout details'), { status: 502 });
  }
  return {
    checkoutUrl: data.checkoutUrl,
    checkoutId: String(data.checkoutId),
    clientReference: data.clientReference || clientReference,
  };
}

/**
 * Turn Hubtel's callback body into the provider-agnostic shape
 * paymentService expects. Returns null if the payload doesn't even look
 * like a Hubtel checkout callback, so the caller can reject it outright.
 */
function normalizeCallbackPayload(body) {
  const data = body && body.Data;
  if (!data || !data.ClientReference || !data.CheckoutId) return null;
  const rawStatus = String(data.Status || body.Status || '').trim();
  const internalStatus = HUBTEL_STATUS_TO_INTERNAL[rawStatus] || null;
  return {
    clientReference: String(data.ClientReference),
    checkoutId: String(data.CheckoutId),
    // SalesInvoiceId is Hubtel's reference for the completed transaction
    // itself, distinct from CheckoutId (the checkout attempt) — this is
    // what gets stored as payments.transaction_reference once PAID.
    transactionReference: data.SalesInvoiceId ? String(data.SalesInvoiceId) : String(data.CheckoutId),
    status: internalStatus,
    rawStatus,
    amount: data.Amount == null ? null : Number(data.Amount),
    // Safe, non-secret extras for Admin's payment page. Never the full raw
    // body (which could theoretically grow to include more than we've
    // reviewed) and never anything resembling a credential.
    metadata: {
      paymentType: data.PaymentDetails?.PaymentType || null,
      channel: data.PaymentDetails?.Channel || null,
      description: data.Description || null,
    },
  };
}

// Deliberate stub — see the file header. Never called by paymentService in
// Phase 1; kept as the documented seam for Phase 2 once the exact Hubtel
// Transaction Status Check contract for this account/product is confirmed.
async function verifyPayment() {
  throw Object.assign(
    new Error('Hubtel transaction status verification is not implemented — the official endpoint/contract was not confirmed for this integration. See hubtelProvider.js.'),
    { status: 501 },
  );
}

module.exports = { initiateCheckout, normalizeCallbackPayload, verifyPayment };
