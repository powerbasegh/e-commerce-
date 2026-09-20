// The provider registry. paymentService talks only to this file, never to
// server/src/services/providers/hubtelProvider.js directly — adding a
// second provider (e.g. Paystack) means adding one more entry here and one
// more file under providers/, not touching paymentService, orderController,
// stockService, orderStateService or settlement logic.
const hubtelProvider = require('./providers/hubtelProvider');
const hubtelConfig = require('../config/hubtelConfig');

const PROVIDERS = {
  HUBTEL: {
    isEnabled: hubtelConfig.isEnabled,
    initiateCheckout: (args) => hubtelProvider.initiateCheckout(hubtelConfig.config(), args),
    normalizeCallbackPayload: hubtelProvider.normalizeCallbackPayload,
    verifyPayment: hubtelProvider.verifyPayment,
  },
};

function getProvider(name) {
  const provider = PROVIDERS[String(name || '').toUpperCase()];
  if (!provider) throw Object.assign(new Error(`Unknown payment provider: ${name}`), { status: 400 });
  return provider;
}

module.exports = { getProvider };
