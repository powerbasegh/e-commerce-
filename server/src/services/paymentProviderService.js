const paystackProvider = require('./providers/paystackProvider');
const paystackConfig = require('../config/paystackConfig');

const PROVIDERS = {
  PAYSTACK: {
    isEnabled: paystackConfig.isEnabled,
    initiateCheckout: (args) => paystackProvider.initiateCheckout(paystackConfig.config(), args),
    verifyPayment: (reference) => paystackProvider.verifyPayment(paystackConfig.config(), reference),
    normalizeWebhookPayload: paystackProvider.normalizeWebhookPayload,
    verifyWebhookSignature: (rawBody, signature) => paystackProvider.verifyWebhookSignature(rawBody, signature, paystackConfig.config().secretKey),
  },
};

function getProvider(name) {
  const provider = PROVIDERS[String(name || '').toUpperCase()];
  if (!provider) throw Object.assign(new Error(`Unknown payment provider: ${name}`), { status: 400 });
  return provider;
}

module.exports = { getProvider };
