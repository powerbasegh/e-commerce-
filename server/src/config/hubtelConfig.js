// Reads Hubtel's configuration from the environment, following the same
// "optional feature, blank env vars disable it" convention as
// services/imageService.js (Cloudinary) — see .env.example.
//
// PowerBase's own webhook path secret (HUBTEL_WEBHOOK_SECRET) is generated
// and owned by PowerBase, not Hubtel — it is appended to the callbackUrl we
// hand Hubtel at checkout time, so a request to that URL without the right
// path segment is rejected before any payment logic runs. This exists
// because the official Hubtel checkout-callback documentation available at
// integration time did not surface a documented request-signing/HMAC
// mechanism for this product; see PHASE1G note in paymentService.js.

function required(name) {
  return (process.env[name] || '').trim();
}

function isEnabled() {
  return Boolean(
    required('HUBTEL_CLIENT_ID') &&
    required('HUBTEL_CLIENT_SECRET') &&
    required('HUBTEL_MERCHANT_ACCOUNT_NUMBER') &&
    required('HUBTEL_WEBHOOK_SECRET') &&
    required('PUBLIC_API_BASE_URL') &&
    required('CLIENT_URL'),
  );
}

function config() {
  return {
    clientId: required('HUBTEL_CLIENT_ID'),
    clientSecret: required('HUBTEL_CLIENT_SECRET'),
    merchantAccountNumber: required('HUBTEL_MERCHANT_ACCOUNT_NUMBER'),
    webhookSecret: required('HUBTEL_WEBHOOK_SECRET'),
    // https://payproxyapi.hubtel.com/items/initiate — the Hubtel Online
    // Checkout initiation endpoint. Overridable so tests / a future sandbox
    // base URL never require a code change.
    checkoutInitiateUrl: required('HUBTEL_CHECKOUT_INITIATE_URL') || 'https://payproxyapi.hubtel.com/items/initiate',
    // Where PowerBase itself is reachable from the internet, for building
    // the callbackUrl handed to Hubtel. Distinct from CLIENT_URL, which is
    // the customer-facing site Hubtel redirects the browser back to.
    apiBaseUrl: required('PUBLIC_API_BASE_URL'),
    clientUrl: (required('CLIENT_URL').split(',')[0] || '').trim(),
    // How long a previously-issued checkout link is reused instead of
    // calling Hubtel again for a repeated "Pay now" click (Phase 1D). No
    // official TTL for a Hubtel checkout link was found in the documentation
    // reviewed for this integration, so this is a PowerBase-side, tunable,
    // conservative default — not a Hubtel-documented value.
    checkoutReuseMinutes: Number(process.env.HUBTEL_CHECKOUT_REUSE_MINUTES || 30),
  };
}

module.exports = { isEnabled, config };
