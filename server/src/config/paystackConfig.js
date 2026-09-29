function value(name) {
  return (process.env[name] || '').trim();
}

function isEnabled() {
  return Boolean(value('PAYSTACK_SECRET_KEY') && value('CLIENT_URL'));
}

function config() {
  return {
    secretKey: value('PAYSTACK_SECRET_KEY'),
    publicKey: value('PAYSTACK_PUBLIC_KEY'),
    apiBaseUrl: value('PAYSTACK_API_BASE_URL') || 'https://api.paystack.co',
    clientUrl: (value('CLIENT_URL').split(',')[0] || '').trim(),
  };
}

module.exports = { isEnabled, config };
