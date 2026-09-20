/* eslint-disable no-console */
// ---------------------------------------------------------------------------
// PowerBase vendor integration tests.
//
// Runs the real Express app against a real MySQL-compatible database, over
// HTTP, with real JWTs. No mocking of the controllers or the database, so a
// pass here means the authorization and stock logic actually holds end to end.
//
//   node tests/vendor.integration.test.js
//
// Requires DB_* env vars pointing at a scratch database (see tests/run.sh).
// ---------------------------------------------------------------------------

const assert = require('assert');
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// --- fixtures --------------------------------------------------------------

const ctx = {};

async function seed() {
  const hash = await bcrypt.hash('password123', 4);

  async function makeUser(name, email, role) {
    const [r] = await db.execute(
      'INSERT INTO users (full_name,email,phone,password_hash,role) VALUES (?,?,?,?,?)',
      [name, email, '0200000000', hash, role],
    );
    return { id: r.insertId, email, role };
  }
  async function makeVendor(userId, storeName, share) {
    const [r] = await db.execute(
      'INSERT INTO vendors (user_id,store_name,location,default_share_percent,is_active,verified) VALUES (?,?,?,?,1,1)',
      [userId, storeName, 'Kumasi', share],
    );
    return r.insertId;
  }
  async function makeProduct(id, vendorId, name, price, stock, sku) {
    await db.execute(
      'INSERT INTO products (id,vendor_id,category_id,name,sku,price,stock_quantity,reserved_quantity,is_active) VALUES (?,?,?,?,?,?,?,0,1)',
      [id, vendorId, 'electronics', name, sku, price, stock],
    );
    return id;
  }

  await db.execute("INSERT INTO categories (id,name) VALUES ('electronics','Electronics')");

  ctx.customer = await makeUser('Ama Customer', 'customer@test.gh', 'CUSTOMER');
  ctx.admin = await makeUser('PowerBase Admin', 'admin@test.gh', 'ADMIN');
  ctx.userA = await makeUser('Vendor A', 'vendora@test.gh', 'VENDOR');
  ctx.userB = await makeUser('Vendor B', 'vendorb@test.gh', 'VENDOR');
  ctx.userSuspended = await makeUser('Vendor S', 'vendors@test.gh', 'VENDOR');

  ctx.vendorA = await makeVendor(ctx.userA.id, 'Alpha Traders', 80);
  ctx.vendorB = await makeVendor(ctx.userB.id, 'Beta Supplies', 80);
  ctx.vendorS = await makeVendor(ctx.userSuspended.id, 'Suspended Traders', 80);
  await db.execute('UPDATE vendors SET is_active=0 WHERE id=?', [ctx.vendorS]);

  ctx.productA = await makeProduct('p-a-1', ctx.vendorA, 'Alpha Speaker', 1000, 10, 'SKU-A-1');
  ctx.productB = await makeProduct('p-b-1', ctx.vendorB, 'Beta Lamp', 500, 10, 'SKU-B-1');

  ctx.tokens = {
    customer: tokenFor(ctx.customer),
    admin: tokenFor(ctx.admin),
    a: tokenFor(ctx.userA),
    b: tokenFor(ctx.userB),
    suspended: tokenFor(ctx.userSuspended),
  };
}

async function stockOf(productId) {
  const [rows] = await db.execute('SELECT stock_quantity, reserved_quantity FROM products WHERE id=?', [productId]);
  return { stock: Number(rows[0].stock_quantity), reserved: Number(rows[0].reserved_quantity) };
}

// Helpers for the OUT_FOR_DELIVERY readiness tests below: place + pay an
// order without dragging in every other section's fixtures, and resolve a
// vendor's row for it the same way the app itself would (by order number,
// scoped to that vendor's own token).
async function placeOrder(items) {
  const res = await call('POST', '/api/orders', {
    token: ctx.tokens.customer,
    body: {
      items,
      delivery: { address: '12 Test St', city: 'Kumasi', area: 'Asokwa' },
      customer: { fullName: 'Ama Customer', email: 'customer@test.gh', phone: '0200000000' },
    },
  });
  assert.strictEqual(res.status, 201, JSON.stringify(res.body));
  return res.body.order;
}

async function payOrder(orderId) {
  const quote = await call('PUT', `/api/admin/orders/${orderId}/delivery-fee`, {
    token: ctx.tokens.admin, body: { delivery_fee: 10, quote_status: 'SET' },
  });
  assert.strictEqual(quote.status, 200, JSON.stringify(quote.body));
  const paid = await call('PUT', `/api/admin/orders/${orderId}/payment`, {
    token: ctx.tokens.admin, body: { status: 'PAID', provider: 'TEST', transactionReference: `TXN-${orderId}` },
  });
  assert.strictEqual(paid.status, 200, JSON.stringify(paid.body));
}

async function vendorOrderIdFor(token, orderNumber) {
  const res = await call('GET', '/api/orders/vendor/my-orders', { token });
  const row = res.body.orders.find((o) => o.order_number === orderNumber);
  assert.ok(row, `vendor order row not found for ${orderNumber}`);
  return row.id;
}

async function orderStatus(orderId) {
  const [rows] = await db.execute('SELECT status FROM orders WHERE id=?', [orderId]);
  return rows[0].status;
}

async function vendorOrderStatus(vendorOrderId) {
  const [rows] = await db.execute('SELECT status FROM vendor_orders WHERE id=?', [vendorOrderId]);
  return rows[0].status;
}

// --- tests -----------------------------------------------------------------

async function run() {
  await seed();

  section('Section 15 — Authentication and role enforcement');

  await test('unauthenticated vendor request is rejected', async () => {
    const res = await call('GET', '/api/vendor/dashboard');
    assert.strictEqual(res.status, 401);
  });

  await test('customer token cannot reach vendor endpoints', async () => {
    const res = await call('GET', '/api/vendor/dashboard', { token: ctx.tokens.customer });
    assert.strictEqual(res.status, 403);
  });

  await test('vendor token cannot reach admin endpoints', async () => {
    const res = await call('GET', '/api/admin/dashboard', { token: ctx.tokens.a });
    assert.strictEqual(res.status, 403);
  });

  await test('vendor token cannot reach admin settlement mutation', async () => {
    const res = await call('PUT', '/api/admin/settlements/1', {
      token: ctx.tokens.a, body: { status: 'PAID', payout_reference: 'FAKE-1' },
    });
    assert.strictEqual(res.status, 403);
  });

  await test('deactivated vendor is rejected even with a valid token', async () => {
    const res = await call('GET', '/api/vendor/dashboard', { token: ctx.tokens.suspended });
    assert.strictEqual(res.status, 403);
    assert.match(res.body.message, /deactivated/i);
  });

  section('Section 5/15 — Vendor product ownership isolation');

  await test('Vendor A sees only their own products', async () => {
    const res = await call('GET', '/api/vendor/products', { token: ctx.tokens.a });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.products.length, 1);
    assert.strictEqual(res.body.products[0].id, ctx.productA);
  });

  await test("Vendor A cannot READ Vendor B's product", async () => {
    const res = await call('GET', `/api/vendor/products/${ctx.productB}`, { token: ctx.tokens.a });
    assert.strictEqual(res.status, 404);
  });

  await test("Vendor A cannot EDIT Vendor B's product", async () => {
    const res = await call('PUT', `/api/vendor/products/${ctx.productB}`, {
      token: ctx.tokens.a,
      body: { name: 'Hijacked', price: 1, stock: 0 },
    });
    assert.strictEqual(res.status, 404);
    const [rows] = await db.execute('SELECT name, price FROM products WHERE id=?', [ctx.productB]);
    assert.strictEqual(rows[0].name, 'Beta Lamp');
    assert.strictEqual(Number(rows[0].price), 500);
  });

  await test("Vendor A cannot change Vendor B's inventory", async () => {
    const before = await stockOf(ctx.productB);
    const res = await call('PATCH', `/api/vendor/products/${ctx.productB}/stock`, {
      token: ctx.tokens.a, body: { stock: 9999 },
    });
    assert.strictEqual(res.status, 404);
    const after = await stockOf(ctx.productB);
    assert.strictEqual(after.stock, before.stock);
  });

  await test("Vendor A cannot deactivate Vendor B's product", async () => {
    const res = await call('PATCH', `/api/vendor/products/${ctx.productB}/status`, {
      token: ctx.tokens.a, body: { isActive: false },
    });
    assert.strictEqual(res.status, 404);
    const [rows] = await db.execute('SELECT is_active FROM products WHERE id=?', [ctx.productB]);
    assert.strictEqual(Number(rows[0].is_active), 1);
  });

  await test('a client-supplied vendorId in the body is ignored', async () => {
    const res = await call('POST', '/api/vendor/products', {
      token: ctx.tokens.a,
      body: { name: 'Ownership probe', price: 50, stock: 1, vendorId: ctx.vendorB, vendor_id: ctx.vendorB },
    });
    assert.strictEqual(res.status, 201);
    const [rows] = await db.execute('SELECT vendor_id FROM products WHERE id=?', [res.body.productId]);
    assert.strictEqual(Number(rows[0].vendor_id), ctx.vendorA, 'product was assigned to the vendor from the JWT');
    await db.execute('DELETE FROM products WHERE id=?', [res.body.productId]);
  });

  section('Section 14 — Vendor profile privilege escalation');

  await test('vendor cannot self-verify, self-activate or raise their own share', async () => {
    const res = await call('PUT', '/api/vendor/profile', {
      token: ctx.tokens.a,
      body: {
        storeName: 'Alpha Traders',
        verified: true,
        isActive: true,
        defaultSharePercent: 100,
        default_share_percent: 100,
        rating: 5,
        id: ctx.vendorB,
      },
    });
    assert.strictEqual(res.status, 200);
    const [rows] = await db.execute('SELECT verified, is_active, default_share_percent, rating FROM vendors WHERE id=?', [ctx.vendorA]);
    assert.strictEqual(Number(rows[0].default_share_percent), 80, 'share percent unchanged');
    assert.strictEqual(Number(rows[0].rating), 0, 'rating unchanged');
  });

  await test('vendor cannot escalate their user role', async () => {
    await call('PUT', '/api/vendor/profile', {
      token: ctx.tokens.a, body: { storeName: 'Alpha Traders', role: 'ADMIN' },
    });
    const [rows] = await db.execute('SELECT role FROM users WHERE id=?', [ctx.userA.id]);
    assert.strictEqual(rows[0].role, 'VENDOR');
  });

  section('Section 8 — Stock reservation lifecycle');

  await test('placing an order RESERVES stock rather than deducting it', async () => {
    const res = await call('POST', '/api/orders', {
      token: ctx.tokens.customer,
      body: {
        items: [{ productId: ctx.productA, quantity: 2 }, { productId: ctx.productB, quantity: 3 }],
        delivery: { address: '12 Test St', city: 'Kumasi', area: 'Asokwa' },
        customer: { fullName: 'Ama Customer', email: 'customer@test.gh', phone: '0200000000' },
      },
    });
    assert.strictEqual(res.status, 201, JSON.stringify(res.body));
    ctx.order = res.body.order;

    const a = await stockOf(ctx.productA);
    assert.strictEqual(a.stock, 10, 'physical stock untouched before payment');
    assert.strictEqual(a.reserved, 2, 'units reserved');
  });

  await test('reserved units are not sellable to the next customer', async () => {
    // 10 physical, 2 reserved -> 8 available. Asking for 9 must fail.
    const res = await call('POST', '/api/orders', {
      token: ctx.tokens.customer,
      body: {
        items: [{ productId: ctx.productA, quantity: 9 }],
        delivery: { address: '12 Test St', city: 'Kumasi', area: 'Asokwa' },
        customer: { fullName: 'Ama Customer', email: 'customer@test.gh', phone: '0200000000' },
      },
    });
    assert.strictEqual(res.status, 409);
    assert.match(res.body.message, /left in stock/i);
  });

  await test('vendor cannot set stock below what is reserved', async () => {
    const res = await call('PATCH', `/api/vendor/products/${ctx.productA}/stock`, {
      token: ctx.tokens.a, body: { stock: 1 },
    });
    assert.strictEqual(res.status, 409);
    assert.match(res.body.message, /reserved/i);
  });

  await test('a failed payment RELEASES the reservation back to sellable stock', async () => {
    const res = await call('POST', '/api/orders', {
      token: ctx.tokens.customer,
      body: {
        items: [{ productId: ctx.productA, quantity: 4 }],
        delivery: { address: '12 Test St', city: 'Kumasi', area: 'Asokwa' },
        customer: { fullName: 'Ama Customer', email: 'customer@test.gh', phone: '0200000000' },
      },
    });
    assert.strictEqual(res.status, 201);
    const mid = await stockOf(ctx.productA);
    assert.strictEqual(mid.reserved, 6, '2 + 4 reserved');

    const fail = await call('PUT', `/api/admin/orders/${res.body.order.id}/payment`, {
      token: ctx.tokens.admin, body: { status: 'FAILED', provider: 'TEST' },
    });
    assert.strictEqual(fail.status, 200, JSON.stringify(fail.body));

    const after = await stockOf(ctx.productA);
    assert.strictEqual(after.stock, 10, 'physical stock never moved');
    assert.strictEqual(after.reserved, 2, 'the 4 held units were released');
  });

  section('Section 10/13 — Vendor order status and payment gating');

  await test("Vendor A sees only their own vendor order", async () => {
    const res = await call('GET', '/api/orders/vendor/my-orders', { token: ctx.tokens.a });
    assert.strictEqual(res.status, 200);
    ctx.vendorOrderA = res.body.orders.find((o) => o.order_number === ctx.order.orderNumber);
    assert.ok(ctx.vendorOrderA, 'vendor A has a row for the multi-vendor order');
    const resB = await call('GET', '/api/orders/vendor/my-orders', { token: ctx.tokens.b });
    ctx.vendorOrderB = resB.body.orders.find((o) => o.order_number === ctx.order.orderNumber);
    assert.ok(ctx.vendorOrderB);
    assert.notStrictEqual(ctx.vendorOrderA.id, ctx.vendorOrderB.id);
  });

  await test("Vendor A cannot open Vendor B's vendor order", async () => {
    const res = await call('GET', `/api/orders/vendor/my-orders/${ctx.vendorOrderB.id}`, { token: ctx.tokens.a });
    assert.strictEqual(res.status, 404);
  });

  await test("Vendor A cannot change the status of Vendor B's vendor order", async () => {
    const res = await call('PATCH', `/api/orders/vendor/my-orders/${ctx.vendorOrderB.id}/status`, {
      token: ctx.tokens.a, body: { status: 'PROCESSING' },
    });
    assert.strictEqual(res.status, 404);
    const [rows] = await db.execute('SELECT status FROM vendor_orders WHERE id=?', [ctx.vendorOrderB.id]);
    assert.strictEqual(rows[0].status, 'PENDING');
  });

  await test('vendor cannot start fulfilment before PowerBase confirms payment', async () => {
    const res = await call('PATCH', `/api/orders/vendor/my-orders/${ctx.vendorOrderA.id}/status`, {
      token: ctx.tokens.a, body: { status: 'PROCESSING' },
    });
    assert.strictEqual(res.status, 409);
    assert.match(res.body.message, /payment/i);
  });

  await test('confirming payment commits stock and makes settlements ELIGIBLE', async () => {
    const quote = await call('PUT', `/api/admin/orders/${ctx.order.id}/delivery-fee`, {
      token: ctx.tokens.admin, body: { delivery_fee: 30, quote_status: 'SET' },
    });
    assert.strictEqual(quote.status, 200, JSON.stringify(quote.body));

    const paid = await call('PUT', `/api/admin/orders/${ctx.order.id}/payment`, {
      token: ctx.tokens.admin,
      body: { status: 'PAID', provider: 'TEST_MOMO', transactionReference: 'TXN-001' },
    });
    assert.strictEqual(paid.status, 200, JSON.stringify(paid.body));

    const a = await stockOf(ctx.productA);
    assert.strictEqual(a.stock, 8, 'physical stock deducted on payment');
    assert.strictEqual(a.reserved, 0, 'reservation consumed');

    const [settlements] = await db.execute('SELECT status, eligible_at FROM vendor_settlements WHERE order_id=?', [ctx.order.id]);
    assert.strictEqual(settlements.length, 2);
    assert.ok(settlements.every((s) => s.status === 'ELIGIBLE'), 'both vendor settlements became eligible');
    assert.ok(settlements.every((s) => s.eligible_at), 'eligibility timestamped');
  });

  await test('confirming the same payment twice does not double-deduct stock', async () => {
    const before = await stockOf(ctx.productA);
    const again = await call('PUT', `/api/admin/orders/${ctx.order.id}/payment`, {
      token: ctx.tokens.admin,
      body: { status: 'PAID', provider: 'TEST_MOMO', transactionReference: 'TXN-001' },
    });
    assert.strictEqual(again.status, 200);
    const after = await stockOf(ctx.productA);
    assert.deepStrictEqual(after, before);
  });

  await test('vendor may move PENDING -> PROCESSING once paid', async () => {
    const res = await call('PATCH', `/api/orders/vendor/my-orders/${ctx.vendorOrderA.id}/status`, {
      token: ctx.tokens.a, body: { status: 'PROCESSING' },
    });
    assert.strictEqual(res.status, 200, JSON.stringify(res.body));
    assert.strictEqual(res.body.vendorOrder.status, 'PROCESSING');
  });

  await test('the customer order follows its vendor orders (-> PROCESSING)', async () => {
    const [rows] = await db.execute('SELECT status FROM orders WHERE id=?', [ctx.order.id]);
    assert.strictEqual(rows[0].status, 'PROCESSING');
  });

  await test('vendor may move PROCESSING -> READY_FOR_DELIVERY', async () => {
    const res = await call('PATCH', `/api/orders/vendor/my-orders/${ctx.vendorOrderA.id}/status`, {
      token: ctx.tokens.a, body: { status: 'READY_FOR_DELIVERY' },
    });
    assert.strictEqual(res.status, 200, JSON.stringify(res.body));
  });

  await test('vendor CANNOT mark an order OUT_FOR_DELIVERY', async () => {
    const res = await call('PATCH', `/api/orders/vendor/my-orders/${ctx.vendorOrderA.id}/status`, {
      token: ctx.tokens.a, body: { status: 'OUT_FOR_DELIVERY' },
    });
    assert.strictEqual(res.status, 409);
    const [rows] = await db.execute('SELECT status FROM vendor_orders WHERE id=?', [ctx.vendorOrderA.id]);
    assert.strictEqual(rows[0].status, 'READY_FOR_DELIVERY');
  });

  await test('vendor CANNOT mark an order DELIVERED', async () => {
    const res = await call('PATCH', `/api/orders/vendor/my-orders/${ctx.vendorOrderA.id}/status`, {
      token: ctx.tokens.a, body: { status: 'DELIVERED' },
    });
    assert.strictEqual(res.status, 409);
    const [rows] = await db.execute('SELECT status FROM vendor_orders WHERE id=?', [ctx.vendorOrderA.id]);
    assert.strictEqual(rows[0].status, 'READY_FOR_DELIVERY');
  });

  await test('the PowerBase order is not marked ready while a vendor is still working', async () => {
    const [rows] = await db.execute('SELECT status FROM orders WHERE id=?', [ctx.order.id]);
    assert.strictEqual(rows[0].status, 'PROCESSING', 'Vendor B has not finished yet');
  });

  await test('the order becomes READY_FOR_DELIVERY only when every vendor is ready', async () => {
    await call('PATCH', `/api/orders/vendor/my-orders/${ctx.vendorOrderB.id}/status`, {
      token: ctx.tokens.b, body: { status: 'PROCESSING' },
    });
    const res = await call('PATCH', `/api/orders/vendor/my-orders/${ctx.vendorOrderB.id}/status`, {
      token: ctx.tokens.b, body: { status: 'READY_FOR_DELIVERY' },
    });
    assert.strictEqual(res.status, 200);
    const [rows] = await db.execute('SELECT status FROM orders WHERE id=?', [ctx.order.id]);
    assert.strictEqual(rows[0].status, 'READY_FOR_DELIVERY');
  });

  section('OUT_FOR_DELIVERY requires every vendor to actually be READY_FOR_DELIVERY');

  await test('CONFIRMED -> OUT_FOR_DELIVERY is rejected', async () => {
    const order = await placeOrder([{ productId: ctx.productA, quantity: 1 }]);
    await payOrder(order.id);
    assert.strictEqual(await orderStatus(order.id), 'CONFIRMED', 'vendor has not started fulfilment yet');

    const res = await call('PATCH', `/api/admin/orders/${order.id}/status`, {
      token: ctx.tokens.admin, body: { status: 'OUT_FOR_DELIVERY' },
    });
    assert.strictEqual(res.status, 409);
    assert.match(res.body.message, /READY_FOR_DELIVERY/);
    assert.strictEqual(await orderStatus(order.id), 'CONFIRMED', 'rejected transition left the order untouched');
  });

  await test('PROCESSING -> OUT_FOR_DELIVERY is rejected', async () => {
    const order = await placeOrder([{ productId: ctx.productA, quantity: 1 }]);
    await payOrder(order.id);
    const vendorOrderId = await vendorOrderIdFor(ctx.tokens.a, order.orderNumber);
    await call('PATCH', `/api/orders/vendor/my-orders/${vendorOrderId}/status`, {
      token: ctx.tokens.a, body: { status: 'PROCESSING' },
    });
    assert.strictEqual(await orderStatus(order.id), 'PROCESSING');

    const res = await call('PATCH', `/api/admin/orders/${order.id}/status`, {
      token: ctx.tokens.admin, body: { status: 'OUT_FOR_DELIVERY' },
    });
    assert.strictEqual(res.status, 409);
    assert.match(res.body.message, /READY_FOR_DELIVERY/);
    assert.strictEqual(await orderStatus(order.id), 'PROCESSING', 'rejected transition left the order untouched');
  });

  await test('READY_FOR_DELIVERY -> OUT_FOR_DELIVERY -> DELIVERED remains allowed, and DELIVERED is then terminal', async () => {
    const order = await placeOrder([{ productId: ctx.productA, quantity: 1 }]);
    await payOrder(order.id);
    const vendorOrderId = await vendorOrderIdFor(ctx.tokens.a, order.orderNumber);
    await call('PATCH', `/api/orders/vendor/my-orders/${vendorOrderId}/status`, { token: ctx.tokens.a, body: { status: 'PROCESSING' } });
    await call('PATCH', `/api/orders/vendor/my-orders/${vendorOrderId}/status`, { token: ctx.tokens.a, body: { status: 'READY_FOR_DELIVERY' } });
    assert.strictEqual(await orderStatus(order.id), 'READY_FOR_DELIVERY');

    const out = await call('PATCH', `/api/admin/orders/${order.id}/status`, {
      token: ctx.tokens.admin, body: { status: 'OUT_FOR_DELIVERY' },
    });
    assert.strictEqual(out.status, 200, JSON.stringify(out.body));
    assert.strictEqual(await orderStatus(order.id), 'OUT_FOR_DELIVERY');
    assert.strictEqual(await vendorOrderStatus(vendorOrderId), 'OUT_FOR_DELIVERY', 'vendor order synced forward');

    const delivered = await call('PATCH', `/api/admin/orders/${order.id}/status`, {
      token: ctx.tokens.admin, body: { status: 'DELIVERED' },
    });
    assert.strictEqual(delivered.status, 200, JSON.stringify(delivered.body));
    assert.strictEqual(await orderStatus(order.id), 'DELIVERED');

    // DELIVERED -> OUT_FOR_DELIVERY must be rejected: DELIVERED is terminal.
    const backwards = await call('PATCH', `/api/admin/orders/${order.id}/status`, {
      token: ctx.tokens.admin, body: { status: 'OUT_FOR_DELIVERY' },
    });
    assert.strictEqual(backwards.status, 409);
    assert.match(backwards.body.message, /already DELIVERED/);
    assert.strictEqual(await orderStatus(order.id), 'DELIVERED', 'still delivered, not moved backwards');
  });

  await test('CANCELLED -> OUT_FOR_DELIVERY is rejected', async () => {
    // ctx.expiredOrderId was cancelled by the reservation sweep earlier in
    // this suite and is still CANCELLED — reuse it rather than cancelling a
    // fresh order, since cancellation itself isn't what this test covers.
    const res = await call('PATCH', `/api/admin/orders/${ctx.expiredOrderId}/status`, {
      token: ctx.tokens.admin, body: { status: 'OUT_FOR_DELIVERY' },
    });
    assert.strictEqual(res.status, 409);
    assert.match(res.body.message, /already CANCELLED/);
    assert.strictEqual(await orderStatus(ctx.expiredOrderId), 'CANCELLED');
  });

  await test('multi-vendor: one vendor not yet READY_FOR_DELIVERY blocks OUT_FOR_DELIVERY', async () => {
    const order = await placeOrder([
      { productId: ctx.productA, quantity: 1 },
      { productId: ctx.productB, quantity: 1 },
    ]);
    await payOrder(order.id);
    const vA = await vendorOrderIdFor(ctx.tokens.a, order.orderNumber);
    const vB = await vendorOrderIdFor(ctx.tokens.b, order.orderNumber);

    // Vendor A finishes; Vendor B has not even started.
    await call('PATCH', `/api/orders/vendor/my-orders/${vA}/status`, { token: ctx.tokens.a, body: { status: 'PROCESSING' } });
    await call('PATCH', `/api/orders/vendor/my-orders/${vA}/status`, { token: ctx.tokens.a, body: { status: 'READY_FOR_DELIVERY' } });
    assert.strictEqual(await vendorOrderStatus(vA), 'READY_FOR_DELIVERY');
    assert.strictEqual(await vendorOrderStatus(vB), 'PENDING');
    assert.strictEqual(await orderStatus(order.id), 'PROCESSING', 'not every vendor is ready yet');

    const res = await call('PATCH', `/api/admin/orders/${order.id}/status`, {
      token: ctx.tokens.admin, body: { status: 'OUT_FOR_DELIVERY' },
    });
    assert.strictEqual(res.status, 409);
    assert.match(res.body.message, /READY_FOR_DELIVERY/);
    // Rejected admin action must not have touched either vendor's row.
    assert.strictEqual(await vendorOrderStatus(vA), 'READY_FOR_DELIVERY');
    assert.strictEqual(await vendorOrderStatus(vB), 'PENDING');
    assert.strictEqual(await orderStatus(order.id), 'PROCESSING');

    // Now finish Vendor B too and confirm OUT_FOR_DELIVERY is allowed and
    // both vendor orders are synced forward together.
    await call('PATCH', `/api/orders/vendor/my-orders/${vB}/status`, { token: ctx.tokens.b, body: { status: 'PROCESSING' } });
    await call('PATCH', `/api/orders/vendor/my-orders/${vB}/status`, { token: ctx.tokens.b, body: { status: 'READY_FOR_DELIVERY' } });
    assert.strictEqual(await orderStatus(order.id), 'READY_FOR_DELIVERY', 'now every vendor is ready');

    const out = await call('PATCH', `/api/admin/orders/${order.id}/status`, {
      token: ctx.tokens.admin, body: { status: 'OUT_FOR_DELIVERY' },
    });
    assert.strictEqual(out.status, 200, JSON.stringify(out.body));
    assert.strictEqual(await orderStatus(order.id), 'OUT_FOR_DELIVERY');
    assert.strictEqual(await vendorOrderStatus(vA), 'OUT_FOR_DELIVERY');
    assert.strictEqual(await vendorOrderStatus(vB), 'OUT_FOR_DELIVERY');
  });

  section('Section 13 — Settlement integrity');

  await test('vendor cannot mark their own settlement PAID', async () => {
    const [rows] = await db.execute('SELECT id FROM vendor_settlements WHERE vendor_id=? LIMIT 1', [ctx.vendorA]);
    const res = await call('PUT', `/api/admin/settlements/${rows[0].id}`, {
      token: ctx.tokens.a, body: { status: 'PAID', payout_reference: 'SELF-PAY-1' },
    });
    assert.strictEqual(res.status, 403);
    const [after] = await db.execute('SELECT status, payout_reference FROM vendor_settlements WHERE id=?', [rows[0].id]);
    assert.notStrictEqual(after[0].status, 'PAID');
    assert.strictEqual(after[0].payout_reference, null);
  });

  await test('settlement cannot be marked PAID before the order is delivered', async () => {
    const [rows] = await db.execute('SELECT id FROM vendor_settlements WHERE vendor_id=? LIMIT 1', [ctx.vendorA]);
    const res = await call('PUT', `/api/admin/settlements/${rows[0].id}`, {
      token: ctx.tokens.admin, body: { status: 'PAID', payout_reference: 'PAYOUT-1' },
    });
    assert.strictEqual(res.status, 409);
    assert.match(res.body.message, /delivered/i);
  });

  await test('admin can deliver, and only then can a settlement be paid', async () => {
    const out = await call('PATCH', `/api/admin/orders/${ctx.order.id}/status`, {
      token: ctx.tokens.admin, body: { status: 'OUT_FOR_DELIVERY' },
    });
    assert.strictEqual(out.status, 200, JSON.stringify(out.body));
    const delivered = await call('PATCH', `/api/admin/orders/${ctx.order.id}/status`, {
      token: ctx.tokens.admin, body: { status: 'DELIVERED' },
    });
    assert.strictEqual(delivered.status, 200, JSON.stringify(delivered.body));

    const [rows] = await db.execute('SELECT id FROM vendor_settlements WHERE vendor_id=? LIMIT 1', [ctx.vendorA]);
    const paid = await call('PUT', `/api/admin/settlements/${rows[0].id}`, {
      token: ctx.tokens.admin, body: { status: 'PAID', payout_reference: 'PAYOUT-1' },
    });
    assert.strictEqual(paid.status, 200, JSON.stringify(paid.body));
  });

  section('Section 12/16 — PowerBase margin never reaches the vendor');

  await test('vendor earnings equal 80% of their own subtotal', async () => {
    const res = await call('GET', '/api/vendor/earnings', { token: ctx.tokens.a });
    assert.strictEqual(res.status, 200);
    // Vendor A sold 2 x GH1000 = GH2000 -> 80% = GH1600
    assert.strictEqual(res.body.totalGross, 1600);
  });

  await test('no vendor response contains powerbase_margin or another vendor', async () => {
    const paths = [
      '/api/vendor/dashboard', '/api/vendor/earnings', '/api/vendor/products',
      '/api/vendor/inventory', '/api/vendor/profile',
      '/api/orders/vendor/my-orders', '/api/orders/vendor/my-settlements',
      `/api/orders/vendor/my-orders/${ctx.vendorOrderA.id}`,
    ];
    for (const path of paths) {
      const res = await call('GET', path, { token: ctx.tokens.a });
      const text = JSON.stringify(res.body);
      assert.ok(!/powerbase_margin/i.test(text), `${path} leaked powerbase_margin`);
      assert.ok(!/Beta Supplies/.test(text), `${path} leaked another vendor's store`);
      assert.ok(!/Beta Lamp/.test(text), `${path} leaked another vendor's product`);
    }
  });

  await test('vendor order detail exposes no customer identity or exact address', async () => {
    const res = await call('GET', `/api/orders/vendor/my-orders/${ctx.vendorOrderA.id}`, { token: ctx.tokens.a });
    const text = JSON.stringify(res.body);
    assert.ok(!/Ama Customer/.test(text), 'customer name leaked');
    assert.ok(!/customer@test\.gh/.test(text), 'customer email leaked');
    assert.ok(!/0200000000/.test(text), 'customer phone leaked');
    assert.ok(!/12 Test St/.test(text), 'exact street address leaked');
    assert.ok(!/grand_total/.test(text), 'PowerBase order total leaked');
    assert.ok(/Asokwa/.test(text), 'fulfilment area still available to the vendor');
  });

  section('Section 2/18 — Customer side shows no vendor information');

  await test('public product list exposes no vendor identity', async () => {
    const res = await call('GET', '/api/products');
    assert.strictEqual(res.status, 200);
    const text = JSON.stringify(res.body);
    assert.ok(!/vendor/i.test(text), 'vendor field leaked to the customer catalogue');
    assert.ok(res.body.products.length > 0, 'catalogue still returns products');
  });

  await test('public product detail exposes no vendor identity', async () => {
    const res = await call('GET', `/api/products/${ctx.productA}`);
    assert.strictEqual(res.status, 200);
    assert.ok(!/vendor/i.test(JSON.stringify(res.body)));
  });

  await test('customer order detail exposes no vendor or settlement information', async () => {
    const res = await call('GET', `/api/orders/${ctx.order.orderNumber}`, { token: ctx.tokens.customer });
    assert.strictEqual(res.status, 200);
    const text = JSON.stringify(res.body);
    assert.ok(!/vendor/i.test(text), 'vendor information leaked into the customer order');
    assert.ok(!/margin|settlement|share_percent/i.test(text), 'internal financials leaked');
    for (const item of res.body.items) {
      assert.ok(!('vendor_order_id' in item), 'internal vendor order id leaked to the customer');
    }
    assert.strictEqual(res.body.items.length, 2, 'customer still sees one order with all items');
  });

  await test('public order tracking exposes no vendor information', async () => {
    const res = await call('GET', `/api/orders/track/${ctx.order.orderNumber}`);
    assert.strictEqual(res.status, 200);
    assert.ok(!/vendor/i.test(JSON.stringify(res.body)));
  });

  section('Section 18 — Customer regression');

  await test('customer registration and login still work', async () => {
    const reg = await call('POST', '/api/auth/register', {
      body: { fullName: 'New Buyer', email: 'newbuyer@test.gh', password: 'password123', phone: '0244000000' },
    });
    assert.ok([200, 201].includes(reg.status), JSON.stringify(reg.body));
    const login = await call('POST', '/api/auth/login', {
      body: { email: 'newbuyer@test.gh', password: 'password123' },
    });
    assert.strictEqual(login.status, 200, JSON.stringify(login.body));
    assert.ok(login.body.token, 'login returns a token');
  });

  await test('categories, search and order history still work', async () => {
    const cats = await call('GET', '/api/products/categories');
    assert.strictEqual(cats.status, 200);
    assert.ok(cats.body.categories.length > 0);

    const search = await call('GET', '/api/products?q=Speaker');
    assert.strictEqual(search.status, 200);
    assert.ok(search.body.products.length > 0);

    const history = await call('GET', '/api/orders', { token: ctx.tokens.customer });
    assert.strictEqual(history.status, 200);
    assert.ok(history.body.orders.length > 0);
  });

  section('Reservation expiry — unpaid orders must not hold stock forever');

  await test('an unpaid order older than the window has its stock released', async () => {
    const before = await stockOf(ctx.productA);
    const res = await call('POST', '/api/orders', {
      token: ctx.tokens.customer,
      body: {
        items: [{ productId: ctx.productA, quantity: 3 }],
        delivery: { address: '12 Test St', city: 'Kumasi', area: 'Asokwa' },
        customer: { fullName: 'Ama Customer', email: 'customer@test.gh', phone: '0200000000' },
      },
    });
    assert.strictEqual(res.status, 201, JSON.stringify(res.body));
    const held = await stockOf(ctx.productA);
    assert.strictEqual(held.reserved, before.reserved + 3, 'stock is held');

    // Age the order past the expiry window.
    await db.execute('UPDATE orders SET created_at = DATE_SUB(NOW(), INTERVAL 72 HOUR) WHERE id=?', [res.body.order.id]);

    const sweep = await call('POST', '/api/admin/reservations/expire', { token: ctx.tokens.admin });
    assert.strictEqual(sweep.status, 200, JSON.stringify(sweep.body));
    assert.ok(sweep.body.orderIds.includes(res.body.order.id), 'the stale order was swept');

    const after = await stockOf(ctx.productA);
    assert.strictEqual(after.reserved, before.reserved, 'held units returned');
    assert.strictEqual(after.stock, before.stock, 'physical stock never moved');

    const [rows] = await db.execute('SELECT status FROM orders WHERE id=?', [res.body.order.id]);
    assert.strictEqual(rows[0].status, 'CANCELLED');
    ctx.expiredOrderId = res.body.order.id;
  });

  await test('a recent unpaid order is left alone', async () => {
    const res = await call('POST', '/api/orders', {
      token: ctx.tokens.customer,
      body: {
        items: [{ productId: ctx.productA, quantity: 1 }],
        delivery: { address: '12 Test St', city: 'Kumasi', area: 'Asokwa' },
        customer: { fullName: 'Ama Customer', email: 'customer@test.gh', phone: '0200000000' },
      },
    });
    assert.strictEqual(res.status, 201);
    const sweep = await call('POST', '/api/admin/reservations/expire', { token: ctx.tokens.admin });
    assert.ok(!sweep.body.orderIds.includes(res.body.order.id), 'a fresh order is not swept');
    const [rows] = await db.execute('SELECT status FROM orders WHERE id=?', [res.body.order.id]);
    assert.notStrictEqual(rows[0].status, 'CANCELLED');
    ctx.freshOrderId = res.body.order.id;
  });

  await test('a PAID order is never swept, however old', async () => {
    const stockBefore = await stockOf(ctx.productA);
    // ctx.order was paid and delivered earlier in this suite.
    await db.execute('UPDATE orders SET created_at = DATE_SUB(NOW(), INTERVAL 500 HOUR) WHERE id=?', [ctx.order.id]);
    const sweep = await call('POST', '/api/admin/reservations/expire', { token: ctx.tokens.admin });
    assert.strictEqual(sweep.status, 200);
    assert.ok(!sweep.body.orderIds.includes(ctx.order.id), 'paid order untouched');
    const [rows] = await db.execute('SELECT status FROM orders WHERE id=?', [ctx.order.id]);
    assert.strictEqual(rows[0].status, 'DELIVERED', 'delivered order still delivered');
    const stockAfter = await stockOf(ctx.productA);
    assert.strictEqual(stockAfter.stock, stockBefore.stock, 'committed stock not clawed back');
  });

  await test('sweeping twice does not double-release', async () => {
    const before = await stockOf(ctx.productA);
    const sweep = await call('POST', '/api/admin/reservations/expire', { token: ctx.tokens.admin });
    assert.ok(!sweep.body.orderIds.includes(ctx.expiredOrderId), 'already-expired order not swept again');
    const after = await stockOf(ctx.productA);
    assert.strictEqual(after.stock, before.stock);
  });

  await test('a vendor cannot trigger the reservation sweep', async () => {
    const res = await call('POST', '/api/admin/reservations/expire', { token: ctx.tokens.a });
    assert.strictEqual(res.status, 403);
  });

  await test('the fresh order is swept once it too ages past the window', async () => {
    await db.execute('UPDATE orders SET created_at = DATE_SUB(NOW(), INTERVAL 72 HOUR) WHERE id=?', [ctx.freshOrderId]);
    const sweep = await call('POST', '/api/admin/reservations/expire', { token: ctx.tokens.admin });
    assert.ok(sweep.body.orderIds.includes(ctx.freshOrderId));
    const after = await stockOf(ctx.productA);
    assert.strictEqual(after.reserved, 0, 'no stock left held by unpaid orders');
  });

  section('Section 7 — Inventory and SKU');

  await test('inventory reports stock, reserved and available separately', async () => {
    const res = await call('GET', '/api/vendor/inventory', { token: ctx.tokens.a });
    assert.strictEqual(res.status, 200);
    const p = res.body.products.find((x) => x.id === ctx.productA);
    assert.strictEqual(p.stock, 8);
    assert.strictEqual(p.reserved, 0);
    assert.strictEqual(p.available, 8);
    assert.strictEqual(p.sku, 'SKU-A-1');
  });

  await test('duplicate SKU within the same vendor is rejected', async () => {
    const res = await call('POST', '/api/vendor/products', {
      token: ctx.tokens.a, body: { name: 'Dup', price: 10, stock: 1, sku: 'SKU-A-1' },
    });
    assert.strictEqual(res.status, 409);
  });

  await test('the same SKU is allowed for a different vendor', async () => {
    const res = await call('POST', '/api/vendor/products', {
      token: ctx.tokens.b, body: { name: 'B same sku', price: 10, stock: 1, sku: 'SKU-A-1' },
    });
    assert.strictEqual(res.status, 201, JSON.stringify(res.body));
  });

  await test('upload status reports unavailable when Cloudinary is not configured', async () => {
    const res = await call('GET', '/api/vendor/uploads/status', { token: ctx.tokens.a });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.available, false, 'no credentials set in this environment');
  });

  await test('upload endpoint returns 503 rather than faking success when unconfigured', async () => {
    const form = new FormData();
    form.append('image', new Blob([Buffer.from('fake-png-bytes')], { type: 'image/png' }), 'x.png');
    const res = await fetch(`${baseUrl}/api/vendor/uploads/product-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ctx.tokens.a}` },
      body: form,
    });
    assert.strictEqual(res.status, 503);
  });

  await test('a customer cannot reach the vendor upload endpoint', async () => {
    const res = await call('POST', '/api/vendor/uploads/product-image', { token: ctx.tokens.customer });
    assert.strictEqual(res.status, 403);
  });

  await test('unsafe image URLs are rejected', async () => {
    const res = await call('POST', '/api/vendor/products', {
      token: ctx.tokens.a,
      body: { name: 'XSS probe', price: 10, stock: 1, imageUrl: 'javascript:alert(1)' },
    });
    assert.strictEqual(res.status, 400);
  });

  await test('vendor product search and pagination are applied server-side', async () => {
    const res = await call('GET', '/api/vendor/products?q=Speaker&page=1&limit=10', { token: ctx.tokens.a });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.pagination, 'pagination metadata returned');
    assert.ok(res.body.products.every((p) => /speaker/i.test(p.name)));
  });
}

// --- bootstrap -------------------------------------------------------------

(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  console.log('PowerBase vendor integration tests');
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

  server.close();
  await db.end();
  process.exit(results.failed ? 1 : 0);
})();
