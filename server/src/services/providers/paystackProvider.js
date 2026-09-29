const crypto = require('crypto');

const STATUS_MAP = {
  success: 'PAID',
  failed: 'FAILED',
  abandoned: 'FAILED',
};

function toSubunit(amount) {
  const raw = String(amount ?? '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw Object.assign(new Error('Invalid payment amount'), { status: 400 });
  const [whole, fraction = ''] = raw.split('.');
  return Number(`${whole}${fraction.padEnd(2, '0')}`);
}

function fromSubunit(amount) {
  return Number(amount) / 100;
}

function authHeaders(cfg) {
  return {
    Authorization: `Bearer ${cfg.secretKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function paystackRequest(cfg, path, options = {}) {
  let response;
  try {
    response = await fetch(`${cfg.apiBaseUrl.replace(/\/$/, '')}${path}`, {
      ...options,
      headers: { ...authHeaders(cfg), ...(options.headers || {}) },
    });
  } catch (error) {
    throw Object.assign(new Error('Could not reach the payment provider'), { status: 502, cause: error });
  }

  let json = null;
  try { json = await response.json(); } catch { /* handled below */ }
  if (!response.ok || !json?.status) {
    throw Object.assign(
      new Error(json?.message || 'Payment provider request failed'),
      { status: 502 },
    );
  }
  return json;
}

async function initiateCheckout(cfg, { amount, description, clientReference, callbackUrl, email, metadata }) {
  if (!cfg.secretKey) throw Object.assign(new Error('Online payment is not configured yet'), { status: 503 });
  const minorAmount = toSubunit(amount);
  const body = {
    email,
    amount: String(minorAmount),
    currency: 'GHS',
    reference: clientReference,
    callback_url: callbackUrl,
    metadata: JSON.stringify(metadata || {}),
    channels: ['card', 'mobile_money', 'bank', 'bank_transfer', 'ussd', 'qr'],
  };
  if (description) body.metadata = JSON.stringify({ ...(metadata || {}), description });

  const json = await paystackRequest(cfg, '/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const data = json.data || {};
  if (!data.authorization_url || !data.reference) {
    throw Object.assign(new Error('Payment provider response was missing checkout details'), { status: 502 });
  }
  return {
    checkoutUrl: String(data.authorization_url),
    checkoutId: data.access_code ? String(data.access_code) : null,
    clientReference: String(data.reference),
  };
}

async function verifyPayment(cfg, reference) {
  if (!reference) throw Object.assign(new Error('A payment reference is required'), { status: 400 });
  const json = await paystackRequest(cfg, `/transaction/verify/${encodeURIComponent(reference)}`, { method: 'GET' });
  const data = json.data || {};
  return {
    status: STATUS_MAP[String(data.status || '').toLowerCase()] || null,
    rawStatus: String(data.status || ''),
    reference: data.reference ? String(data.reference) : String(reference),
    transactionReference: data.reference ? String(data.reference) : String(reference),
    transactionId: data.id == null ? null : String(data.id),
    amount: data.amount == null ? null : fromSubunit(data.amount),
    amountSubunit: data.amount == null ? null : Number(data.amount),
    currency: data.currency ? String(data.currency).toUpperCase() : null,
    channel: data.channel || null,
    gatewayResponse: data.gateway_response || null,
    metadata: {
      channel: data.channel || null,
      gatewayResponse: data.gateway_response || null,
      transactionId: data.id == null ? null : String(data.id),
      paidAt: data.paid_at || null,
    },
  };
}

function normalizeWebhookPayload(body) {
  if (!body || body.event !== 'charge.success' || !body.data) return null;
  const data = body.data;
  if (!data.reference) return null;
  return {
    clientReference: String(data.reference),
    checkoutId: data.access_code ? String(data.access_code) : null,
    transactionReference: String(data.reference),
    status: String(data.status || '').toLowerCase() === 'success' ? 'PAID' : null,
    rawStatus: String(data.status || ''),
    amount: data.amount == null ? null : fromSubunit(data.amount),
    amountSubunit: data.amount == null ? null : Number(data.amount),
    currency: data.currency ? String(data.currency).toUpperCase() : null,
    metadata: {
      channel: data.channel || null,
      gatewayResponse: data.gateway_response || null,
      transactionId: data.id == null ? null : String(data.id),
      paidAt: data.paid_at || null,
    },
  };
}

function verifyWebhookSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const supplied = String(signature);
  return supplied.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

module.exports = {
  initiateCheckout,
  verifyPayment,
  normalizeWebhookPayload,
  verifyWebhookSignature,
  toSubunit,
};
