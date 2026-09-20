/* eslint-disable no-console */
// ---------------------------------------------------------------------------
// PowerBase Hubtel payment integration tests.
//
// Runs the real Express app against a real MySQL-compatible database, over
// HTTP, with real JWTs — same harness as vendor.integration.test.js. The one
// thing that is mocked is the actual outbound HTTP call to Hubtel
// (global.fetch, intercepted only for HUBTEL_CHECKOUT_INITIATE_URL): no real
// Hubtel credentials or network access exist in this environment, and the
// Phase 1 instructions are explicit that controlled test doubles — not real
// production credentials — are what belongs in an automated suite. Every
// webhook in these tests is a real HTTP POST to the real
// /api/webhooks/hubtel/callback/:token route, processed by the real
// webhookController.js and paymentService.js — nothing about the
// verification/idempotency/state-machine logic itself is mocked.
//
//   node tests/payment.integration.test.js
//
// Requires DB_* env vars pointing at a scratch database (see tests/run.sh).
// ---------------------------------------------------------------------------

const assert = require('assert');
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Hubtel config is read lazily (see server/src/config/hubtelConfig.js), so
// these can be set before the app ever handles a request.
process.env.HUBTEL_CLIENT_ID = 'test-client-id';
process.env.HUBTEL_CLIENT_SECRET = 'test-client-secret';
process.env.HUBTEL_MERCHANT_ACCOUNT_NUMBER = 'TEST-MERCHANT-1';
process.env.HUBTEL_WEBHOOK_SECRET = 'test-webhook-secret-abc123';
process.env.PUBLIC_API_BASE_URL = 'http://127.0.0.1:9999';
process.env.HUBTEL_CHECKOUT_INITIATE_URL = 'https://hubtel-mock.test/items/initiate';
process.env.HUBTEL_CHECKOUT_REUSE_MINUTES = '30';

const db = require('../src/config/db');
const app = require('../src/app');

let server;
let baseUrl;
const results = { passed: 0, failed: 0, failures: [] };

async function test(name, fn) {
  try {
    await fn();
    results.passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    results.failed += 1;
    results.failures.push({ name, err });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { status: res.status, body: json };
}

function tokenFor(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// --- Hubtel mock -------------------------------------------------------------
// Intercepts only calls to HUBTEL_CHECKOUT_INITIATE_URL; everything else
// (the test harness's own `call()` above, which uses plain `fetch` against
// the local server) goes through the real, unmocked global fetch.

const realFetch = global.fetch;
let hubtelCallCount = 0;
let hubtelShouldFail = false;
let lastHubtelRequestBody = null;

global.fetch = async (url, opts) => {
  if (String(url) === process.env.HUBTEL_CHECKOUT_INITIATE_URL) {
    hubtelCallCount += 1;
    lastHubtelRequestBody = JSON.parse(opts.body);
    if (hubtelShouldFail) {
      return { ok: true, json: async () => ({ responseCode: '4000', status: 'Failed', message: 'mock provider failure' }) };
    }
    const ref = lastHubtelRequestBody.clientReference;
    return {
      ok: true,
      json: async () => ({
        responseCode: '0000',
        status: 'Success',
        data: { checkoutUrl: `https://pay.hubtel.mock/${ref}`, checkoutId: `checkout-${ref}`, clientReference: ref },
      }),
    };
  }
  return realFetch(url, opts);
};

function hubtelCallbackBody({ checkoutId, clientReference, amount, status = 'Success', salesInvoiceId }) {
  return {
    ResponseCode: '0000',
    Status: status,
    Data: {
      CheckoutId: checkoutId,
      SalesInvoiceId: salesInvoiceId || `INV-${checkoutId}`,
      ClientReference: clientReference,
      Status: status,
      Amount: amount,
      CustomerPhoneNumber: '233200000000',
      PaymentDetails: { MobileMoneyNumber: '233200000000', PaymentType: 'mobilemoney', Channel: 'mtn-gh' },
      Description: 'mock',
    },
  };
}

async function sendWebhook(token, payload) {
  const res = await fetch(`${baseUrl}/api/webhooks/hubtel/callback/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { status: res.status, body: json };
}

// --- fixtures ----------------------------------------------------------------

const ctx = {};

async function seed() {
  const hash = await bcrypt.hash('password123', 4);
  async function makeUser(name, email, role) {
    const [r] = await db.execute('INSERT INTO users (full_name,email,phone,password_hash,role) VALUES (?,?,?,?,?)', [name, email, '0200000000', hash, role]);
    return { id: r.insertId, email, role };
  }
  async function makeVendor(userId, storeName, share) {
    const [r] = await db.execute('INSERT INTO vendors (user_id,store_name,location,default_share_percent,is_active,verified) VALUES (?,?,?,?,1,1)', [userId, storeName, 'Kumasi', share]);
    return r.insertId;
  }
  async function makeProduct(id, vendorId, name, price, stock, sku) {
    await db.execute('INSERT INTO products (id,vendor_id,category_id,name,sku,price,stock_quantity,reserved_quantity,is_active) VALUES (?,?,?,?,?,?,?,0,1)', [id, vendorId, 'electronics-pay', name, sku, price, stock]);
    return id;
  }
  await db.execute("INSERT INTO categories (id,name) VALUES ('electronics-pay','Electronics')");
  ctx.customer = await makeUser('Pay Customer', 'paycustomer@test.gh', 'CUSTOMER');
  ctx.admin = await makeUser('Pay Admin', 'payadmin@test.gh', 'ADMIN');
  ctx.userA = await makeUser('Pay Vendor A', 'payvendora@test.gh', 'VENDOR');
  ctx.vendorA = await makeVendor(ctx.userA.id, 'Pay Traders', 80);
  ctx.productA = await makeProduct('p-pay-1', ctx.vendorA, 'Pay Speaker', 200, 50, 'SKU-PAY-1');
  ctx.tokens = { customer: tokenFor(ctx.customer), admin: tokenFor(ctx.admin), a: tokenFor(ctx.userA) };
}

async function stockOf(productId) {
  const [rows] = await db.execute('SELECT stock_quantity, reserved_quantity FROM products WHERE id=?', [productId]);
  return { stock: Number(rows[0].stock_quantity), reserved: Number(rows[0].reserved_quantity) };
}

// Places an order and gets it to DELIVERY_FEE_QUOTED (payable), the same way
// a real customer would: create -> admin quotes the delivery fee. Returns
// the order plus its authoritative grand_total.
async function placeQuotedOrder(items) {
  const placed = await call('POST', '/api/orders', {
    token: ctx.tokens.customer,
    body: {
      items,
      delivery: { address: '1 Pay St', city: 'Kumasi', area: 'Asokwa' },
      customer: { fullName: 'Pay Customer', email: 'paycustomer@test.gh', phone: '0200000000' },
    },
  });
  assert.strictEqual(placed.status, 201, JSON.stringify(placed.body));
  const orderId = placed.body.order.id;
  const orderNumber = placed.body.order.orderNumber;
  const quote = await call('PUT', `/api/admin/orders/${orderId}/delivery-fee`, {
    token: ctx.tokens.admin, body: { delivery_fee: 15, quote_status: 'SET' },
  });
  assert.strictEqual(quote.status, 200, JSON.stringify(quote.body));
  return { orderId, orderNumber, grandTotal: Number(quote.body.order.grandTotal) };
}

async function paymentRow(orderId) {
  const [rows] = await db.execute('SELECT * FROM payments WHERE order_id=?', [orderId]);
  return rows[0];
}

async function orderStatus(orderId) {
  const [rows] = await db.execute('SELECT status FROM orders WHERE id=?', [orderId]);
  return rows[0].status;
}

async function settlementStatuses(orderId) {
  const [rows] = await db.execute('SELECT status FROM vendor_settlements WHERE order_id=?', [orderId]);
  return rows.map((r) => r.status);
}

async function eventCount(orderId) {
  const [rows] = await db.execute('SELECT COUNT(*) n FROM order_events WHERE order_id=?', [orderId]);
  return Number(rows[0].n);
}

async function notificationCount(userId) {
  const [rows] = await db.execute('SELECT COUNT(*) n FROM notifications WHERE user_id=?', [userId]);
  return Number(rows[0].n);
}

async function run() {
  await seed();

  section('Payment initiation');

  await test('initiation creates an INITIATED payment with the server-calculated amount, ignoring any client body', async () => {
    hubtelCallCount = 0;
    const { orderId, orderNumber, grandTotal } = await placeQuotedOrder([{ productId: ctx.productA, quantity: 2 }]);
    // A tampered/arbitrary amount in the request body — the endpoint takes
    // no amount field at all, so there is nothing for this to influence.
    const res = await call('POST', `/api/payments/orders/${orderNumber}/initiate`, {
      token: ctx.tokens.customer, body: { amount: 1, totalAmount: 1 },
    });
    assert.strictEqual(res.status, 200, JSON.stringify(res.body));
    assert.ok(res.body.checkoutUrl, 'checkout URL returned');
    assert.strictEqual(hubtelCallCount, 1);
    assert.strictEqual(lastHubtelRequestBody.totalAmount, grandTotal, 'Hubtel was sent the real, server-calculated total');

    const payment = await paymentRow(orderId);
    assert.strictEqual(payment.status, 'INITIATED');
    assert.strictEqual(Number(payment.amount), grandTotal);
    assert.strictEqual(payment.provider, 'HUBTEL');
    assert.ok(payment.client_reference, 'client_reference stored');
    assert.ok(payment.checkout_id, 'checkout_id stored');
  });

  await test('a repeated initiate call reuses the same checkout instead of calling Hubtel again', async () => {
    hubtelCallCount = 0;
    const { orderNumber } = await placeQuotedOrder([{ productId: ctx.productA, quantity: 1 }]);
    const first = await call('POST', `/api/payments/orders/${orderNumber}/initiate`, { token: ctx.tokens.customer });
    assert.strictEqual(first.status, 200);
    assert.strictEqual(hubtelCallCount, 1);
    const second = await call('POST', `/api/payments/orders/${orderNumber}/initiate`, { token: ctx.tokens.customer });
    assert.strictEqual(second.status, 200);
    assert.strictEqual(hubtelCallCount, 1, 'Hubtel was not called a second time');
    assert.strictEqual(second.body.checkoutUrl, first.body.checkoutUrl);
    assert.strictEqual(second.body.reused, true);
  });

  section('Webhook: happy path, idempotency, and security checks');

  await test('a verified successful webhook marks the payment PAID, commits stock, confirms the order, and makes the settlement ELIGIBLE', async () => {
    const { orderId, orderNumber, grandTotal } = await placeQuotedOrder([{ productId: ctx.productA, quantity: 3 }]);
    const before = await stockOf(ctx.productA);

    const init = await call('POST', `/api/payments/orders/${orderNumber}/initiate`, { token: ctx.tokens.customer });
    const payment = await paymentRow(orderId);
    assert.strictEqual(await orderStatus(orderId), 'DELIVERY_FEE_QUOTED', 'not confirmed before payment');
    assert.deepStrictEqual(await settlementStatuses(orderId), ['PENDING']);

    const webhook = await sendWebhook(process.env.HUBTEL_WEBHOOK_SECRET, hubtelCallbackBody({
      checkoutId: payment.checkout_id, clientReference: payment.client_reference, amount: grandTotal,
    }));
    assert.strictEqual(webhook.status, 200);

    const after = await paymentRow(orderId);
    assert.strictEqual(after.status, 'PAID');
    assert.strictEqual(await orderStatus(orderId), 'CONFIRMED');
    assert.deepStrictEqual(await settlementStatuses(orderId), ['ELIGIBLE']);
    const stockAfter = await stockOf(ctx.productA);
    assert.strictEqual(stockAfter.stock, before.stock - 3, 'stock committed (deducted) exactly once');
    assert.strictEqual(stockAfter.reserved, before.reserved, 'reservation cleared, not left dangling');
    assert.ok(init.body.checkoutUrl);
  });

  await test('a duplicate success webhook for an already-PAID payment is a no-op: no double stock deduction, no duplicate events/notifications', async () => {
    const { orderId, orderNumber, grandTotal } = await placeQuotedOrder([{ productId: ctx.productA, quantity: 2 }]);
    await call('POST', `/api/payments/orders/${orderNumber}/initiate`, { token: ctx.tokens.customer });
    const payment = await paymentRow(orderId);
    const cb = hubtelCallbackBody({ checkoutId: payment.checkout_id, clientReference: payment.client_reference, amount: grandTotal });

    const first = await sendWebhook(process.env.HUBTEL_WEBHOOK_SECRET, cb);
    assert.strictEqual(first.status, 200);
    const stockAfterFirst = await stockOf(ctx.productA);
    const eventsAfterFirst = await eventCount(orderId);
    const notificationsAfterFirst = await notificationCount(ctx.customer.id);

    // Hubtel replays the exact same callback (their own documented retry
    // behaviour on a slow/ambiguous response) — must be a complete no-op.
    const second = await sendWebhook(process.env.HUBTEL_WEBHOOK_SECRET, cb);
    assert.strictEqual(second.status, 200);

    const stockAfterSecond = await stockOf(ctx.productA);
    assert.strictEqual(stockAfterSecond.stock, stockAfterFirst.stock, 'stock not deducted a second time');
    assert.strictEqual(await eventCount(orderId), eventsAfterFirst, 'no duplicate order_events row');
    assert.strictEqual(await notificationCount(ctx.customer.id), notificationsAfterFirst, 'no duplicate notification row');
    assert.strictEqual((await paymentRow(orderId)).status, 'PAID');
  });

  await test('a failed-payment webhook releases the stock reservation without confirming the order', async () => {
    const { orderId, orderNumber, grandTotal } = await placeQuotedOrder([{ productId: ctx.productA, quantity: 4 }]);
    const before = await stockOf(ctx.productA);
    await call('POST', `/api/payments/orders/${orderNumber}/initiate`, { token: ctx.tokens.customer });
    const payment = await paymentRow(orderId);
    assert.strictEqual((await stockOf(ctx.productA)).reserved, before.reserved + 4, 'reserved while payment is pending');

    const webhook = await sendWebhook(process.env.HUBTEL_WEBHOOK_SECRET, hubtelCallbackBody({
      checkoutId: payment.checkout_id, clientReference: payment.client_reference, amount: grandTotal, status: 'Failed',
    }));
    assert.strictEqual(webhook.status, 200);

    assert.strictEqual((await paymentRow(orderId)).status, 'FAILED');
    assert.strictEqual(await orderStatus(orderId), 'DELIVERY_FEE_QUOTED', 'order not cancelled by a failed payment, just not confirmed');
    const after = await stockOf(ctx.productA);
    assert.strictEqual(after.reserved, before.reserved, 'reservation released back to sellable stock');
    assert.strictEqual(after.stock, before.stock, 'nothing was ever deducted for a payment that never succeeded');
  });

  await test('a webhook with the wrong path token cannot mark anything PAID', async () => {
    const { orderId, orderNumber, grandTotal } = await placeQuotedOrder([{ productId: ctx.productA, quantity: 1 }]);
    await call('POST', `/api/payments/orders/${orderNumber}/initiate`, { token: ctx.tokens.customer });
    const payment = await paymentRow(orderId);

    const res = await sendWebhook('not-the-real-secret', hubtelCallbackBody({
      checkoutId: payment.checkout_id, clientReference: payment.client_reference, amount: grandTotal,
    }));
    assert.strictEqual(res.status, 404);
    assert.strictEqual((await paymentRow(orderId)).status, 'INITIATED', 'unauthenticated callback changed nothing');
  });

  await test('a webhook reporting the wrong amount cannot mark the payment PAID', async () => {
    const { orderId, orderNumber, grandTotal } = await placeQuotedOrder([{ productId: ctx.productA, quantity: 1 }]);
    await call('POST', `/api/payments/orders/${orderNumber}/initiate`, { token: ctx.tokens.customer });
    const payment = await paymentRow(orderId);

    const res = await sendWebhook(process.env.HUBTEL_WEBHOOK_SECRET, hubtelCallbackBody({
      checkoutId: payment.checkout_id, clientReference: payment.client_reference, amount: grandTotal + 500,
    }));
    assert.strictEqual(res.status, 200, 'still acknowledged, so Hubtel does not endlessly retry');
    assert.strictEqual((await paymentRow(orderId)).status, 'INITIATED', 'amount mismatch left unresolved for manual review, not silently accepted');

    const [logged] = await db.execute('SELECT outcome FROM payment_webhook_events WHERE client_reference=? ORDER BY id DESC LIMIT 1', [payment.client_reference]);
    assert.strictEqual(logged[0].outcome, 'AMOUNT_MISMATCH');
  });

  await test('a webhook with an unrecognized clientReference cannot mark any payment PAID', async () => {
    const { orderId, orderNumber, grandTotal } = await placeQuotedOrder([{ productId: ctx.productA, quantity: 1 }]);
    await call('POST', `/api/payments/orders/${orderNumber}/initiate`, { token: ctx.tokens.customer });

    const res = await sendWebhook(process.env.HUBTEL_WEBHOOK_SECRET, hubtelCallbackBody({
      checkoutId: 'checkout-does-not-exist', clientReference: 'REF-DOES-NOT-EXIST', amount: grandTotal,
    }));
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await paymentRow(orderId)).status, 'INITIATED', 'the real order was never touched');
  });

  await test('a webhook whose checkoutId does not match the stored one cannot mark the payment PAID', async () => {
    const { orderId, orderNumber, grandTotal } = await placeQuotedOrder([{ productId: ctx.productA, quantity: 1 }]);
    await call('POST', `/api/payments/orders/${orderNumber}/initiate`, { token: ctx.tokens.customer });
    const payment = await paymentRow(orderId);

    const res = await sendWebhook(process.env.HUBTEL_WEBHOOK_SECRET, hubtelCallbackBody({
      checkoutId: 'a-different-checkout-id', clientReference: payment.client_reference, amount: grandTotal,
    }));
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await paymentRow(orderId)).status, 'INITIATED');
    const [logged] = await db.execute('SELECT outcome FROM payment_webhook_events WHERE client_reference=? ORDER BY id DESC LIMIT 1', [payment.client_reference]);
    assert.strictEqual(logged[0].outcome, 'CHECKOUT_MISMATCH');
  });

  await test('a PAID payment cannot be downgraded by a later failure webhook (replay/ordering protection)', async () => {
    const { orderId, orderNumber, grandTotal } = await placeQuotedOrder([{ productId: ctx.productA, quantity: 1 }]);
    await call('POST', `/api/payments/orders/${orderNumber}/initiate`, { token: ctx.tokens.customer });
    const payment = await paymentRow(orderId);
    await sendWebhook(process.env.HUBTEL_WEBHOOK_SECRET, hubtelCallbackBody({
      checkoutId: payment.checkout_id, clientReference: payment.client_reference, amount: grandTotal,
    }));
    assert.strictEqual((await paymentRow(orderId)).status, 'PAID');

    // A late/out-of-order "Failed" callback for the same checkout must not
    // reverse an already-confirmed payment.
    const res = await sendWebhook(process.env.HUBTEL_WEBHOOK_SECRET, hubtelCallbackBody({
      checkoutId: payment.checkout_id, clientReference: payment.client_reference, amount: grandTotal, status: 'Failed',
    }));
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await paymentRow(orderId)).status, 'PAID', 'still PAID — never reversed by a webhook');
    assert.strictEqual(await orderStatus(orderId), 'CONFIRMED');
  });

  await test('a webhook reporting an unrecognized/pending status is safely ignored, not treated as success or failure', async () => {
    // Online Checkout's documented callback only fires with a final Success
    // or Failed outcome — but the handler must not assume that. Any status
    // string it doesn't recognize (e.g. a future "Pending" value, or one
    // Hubtel adds later) must be logged and left alone, never guessed at.
    const { orderId, orderNumber, grandTotal } = await placeQuotedOrder([{ productId: ctx.productA, quantity: 1 }]);
    await call('POST', `/api/payments/orders/${orderNumber}/initiate`, { token: ctx.tokens.customer });
    const payment = await paymentRow(orderId);

    const res = await sendWebhook(process.env.HUBTEL_WEBHOOK_SECRET, hubtelCallbackBody({
      checkoutId: payment.checkout_id, clientReference: payment.client_reference, amount: grandTotal, status: 'Pending',
    }));
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await paymentRow(orderId)).status, 'INITIATED', 'an unrecognized status changes nothing');
    const [logged] = await db.execute('SELECT outcome FROM payment_webhook_events WHERE client_reference=? ORDER BY id DESC LIMIT 1', [payment.client_reference]);
    assert.strictEqual(logged[0].outcome, 'UNRECOGNIZED_STATUS');
  });

  section('Provider verification stub (Phase 2 finding)');

  await test('hubtelProvider.verifyPayment fails loudly rather than silently approving a payment', async () => {
    // Phase 2 could not confirm Hubtel's real Transaction Status Check
    // contract for the Online Checkout product (see the Phase 2 report and
    // the comment above verifyPayment in hubtelProvider.js) — this locks in
    // that the stub stays a hard failure, never a guessed implementation
    // that could report a false status.
    const hubtelProvider = require('../src/services/providers/hubtelProvider');
    await assert.rejects(() => hubtelProvider.verifyPayment(), /not implemented/i);
  });

  section('Admin manual confirmation still works and shares the same underlying logic');

  await test("admin's manual payment confirmation still confirms the order (unaffected by the Hubtel refactor)", async () => {
    const { orderId, orderNumber, grandTotal } = await placeQuotedOrder([{ productId: ctx.productA, quantity: 1 }]);
    const res = await call('PUT', `/api/admin/orders/${orderId}/payment`, {
      token: ctx.tokens.admin, body: { status: 'PAID', provider: 'MANUAL_MOMO', transactionReference: `MANUAL-${orderNumber}` },
    });
    assert.strictEqual(res.status, 200, JSON.stringify(res.body));
    assert.strictEqual(await orderStatus(orderId), 'CONFIRMED');
    const payment = await paymentRow(orderId);
    assert.strictEqual(payment.status, 'PAID');
    assert.strictEqual(Number(payment.amount), grandTotal);
  });
}

// --- bootstrap ---------------------------------------------------------------

(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  console.log('PowerBase Hubtel payment integration tests');
  try {
    await run();
  } catch (err) {
    console.error('\nFATAL:', err);
    results.failed += 1;
  }

  console.log(`\n${results.passed} passed, ${results.failed} failed`);
  if (results.failures.length) {
    console.log('\nFailures:');
    for (const f of results.failures) console.log(`  - ${f.name}: ${f.err.message}`);
  }

  global.fetch = realFetch;
  server.close();
  await db.end();
  process.exit(results.failed ? 1 : 0);
})();
