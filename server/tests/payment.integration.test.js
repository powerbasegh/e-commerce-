/* eslint-disable no-console */
// PowerBase Paystack payment integration tests.
// Uses the real Express app and MySQL-compatible DB; only outbound Paystack
// HTTP is mocked. No real Paystack credentials are used.
const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

process.env.PAYSTACK_SECRET_KEY = 'sk_test_powerbase';
process.env.PAYSTACK_PUBLIC_KEY = 'pk_test_powerbase';
process.env.PAYSTACK_API_BASE_URL = 'https://paystack-mock.test';
process.env.CLIENT_URL = 'http://localhost:5173';

const db = require('../src/config/db');
const app = require('../src/app');

const realFetch = global.fetch;
let paystackCallCount = 0;
let paystackShouldFail = false;
const paystackTransactions = new Map();

global.fetch = async (url, opts = {}) => {
  if (!String(url).startsWith(process.env.PAYSTACK_API_BASE_URL)) return realFetch(url, opts);
  paystackCallCount += 1;
  if (paystackShouldFail) return { ok: false, json: async () => ({ status: false, message: 'mock provider failure' }) };
  const path = new URL(url).pathname;
  if (path === '/transaction/initialize') {
    const body = JSON.parse(opts.body);
    const ref = body.reference;
    paystackTransactions.set(ref, { amount: Number(body.amount), currency: body.currency, status: 'success', channel: 'mobile_money' });
    return { ok: true, json: async () => ({ status: true, message: 'Authorization URL created', data: { authorization_url: `https://checkout.paystack.mock/${ref}`, access_code: `access-${ref}`, reference: ref } }) };
  }
  const match = path.match(/^\/transaction\/verify\/(.+)$/);
  if (match) {
    const ref = decodeURIComponent(match[1]);
    const tx = paystackTransactions.get(ref);
    if (!tx) return { ok: true, json: async () => ({ status: false, message: 'Transaction not found' }) };
    return { ok: true, json: async () => ({ status: true, message: 'Verification successful', data: { id: 123456789, status: tx.status, reference: ref, amount: tx.amount, currency: tx.currency, channel: tx.channel, gateway_response: 'Successful', paid_at: new Date().toISOString() } }) };
  }
  return { ok: false, json: async () => ({ status: false, message: 'Unhandled mock URL' }) };
};

let server; let baseUrl; const results = { passed: 0, failed: 0, failures: [] };
async function test(name, fn) { try { await fn(); results.passed += 1; console.log(`  PASS  ${name}`); } catch (e) { results.failed += 1; results.failures.push({name,e}); console.log(`  FAIL  ${name}`); console.log(`        ${e.message}`); } }
async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${baseUrl}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await res.text(); let json = {}; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { status: res.status, body: json };
}
function tokenFor(user) { return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' }); }
function signWebhook(payload) { return crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(payload)).digest('hex'); }
async function sendWebhook(payload, signature = signWebhook(payload)) {
  const res = await fetch(`${baseUrl}/api/webhooks/paystack`, { method:'POST', headers:{'Content-Type':'application/json','x-paystack-signature':signature}, body:JSON.stringify(payload) });
  const text=await res.text(); let json={}; try{json=text?JSON.parse(text):{}}catch{json={raw:text}} return {status:res.status,body:json};
}

const ctx={};
async function seed(){
  const hash=await bcrypt.hash('password123',4);
  async function user(name,email,role){const [r]=await db.execute('INSERT INTO users (full_name,email,phone,password_hash,role) VALUES (?,?,?,?,?)',[name,email,'0200000000',hash,role]);return{id:r.insertId,email,role};}
  const admin=await user('Pay Admin','payadmin@test.gh','ADMIN'); const customer=await user('Pay Customer','paycustomer@test.gh','CUSTOMER'); const vendorUser=await user('Pay Vendor','payvendor@test.gh','VENDOR');
  const [v]=await db.execute('INSERT INTO vendors (user_id,store_name,location,default_share_percent,is_active,verified) VALUES (?,?,?,?,1,1)',[vendorUser.id,'Pay Traders','Kumasi',80]);
  await db.execute("INSERT INTO categories (id,name) VALUES ('pay-cat','Electronics')");
  await db.execute('INSERT INTO products (id,vendor_id,category_id,name,sku,price,stock_quantity,reserved_quantity,is_active) VALUES (?,?,?,?,?,?,?,0,1)', ['pay-product',v.insertId,'pay-cat','Pay Speaker','PAY-SKU',200,50]);
  ctx.customer=customer;ctx.admin=admin;ctx.product='pay-product';ctx.tokens={customer:tokenFor(customer),admin:tokenFor(admin)};
}
async function payment(orderId){const[r]=await db.execute('SELECT * FROM payments WHERE order_id=?',[orderId]);return r[0];}
async function stock(){const[r]=await db.execute('SELECT stock_quantity,reserved_quantity FROM products WHERE id=?',[ctx.product]);return{stock:Number(r[0].stock_quantity),reserved:Number(r[0].reserved_quantity)};}
async function place(){
  const placed=await call('POST','/api/orders',{token:ctx.tokens.customer,body:{items:[{productId:ctx.product,quantity:1}],delivery:{address:'1 Pay St',city:'Kumasi',area:'Asokwa'},customer:{fullName:'Pay Customer',email:'paycustomer@test.gh',phone:'0200000000'}}});
  assert.strictEqual(placed.status,201,JSON.stringify(placed.body)); const orderId=placed.body.order.id; const orderNumber=placed.body.order.orderNumber;
  const quote=await call('PUT',`/api/admin/orders/${orderId}/delivery-fee`,{token:ctx.tokens.admin,body:{delivery_fee:15,quote_status:'SET'}});
  assert.strictEqual(quote.status,200,JSON.stringify(quote.body)); return{orderId,orderNumber,total:Number(quote.body.order.grandTotal)};
}

async function run(){
  await seed();
  await test('initializes Paystack with the server-calculated GHS amount and reference',async()=>{
    paystackCallCount=0; const o=await place(); const res=await call('POST',`/api/payments/orders/${o.orderNumber}/initiate`,{token:ctx.tokens.customer,body:{amount:1}});
    assert.strictEqual(res.status,200,JSON.stringify(res.body)); assert.ok(res.body.checkoutUrl); assert.strictEqual(paystackCallCount,1);
    const p=await payment(o.orderId); assert.strictEqual(p.provider,'PAYSTACK'); assert.strictEqual(p.status,'INITIATED'); assert.strictEqual(Number(p.amount),o.total); assert.ok(p.client_reference); assert.ok(p.checkout_id);
  });
  await test('reuses an active checkout instead of creating a second transaction',async()=>{
    paystackCallCount=0; const o=await place(); const a=await call('POST',`/api/payments/orders/${o.orderNumber}/initiate`,{token:ctx.tokens.customer}); const b=await call('POST',`/api/payments/orders/${o.orderNumber}/initiate`,{token:ctx.tokens.customer});
    assert.strictEqual(a.status,200);assert.strictEqual(b.status,200);assert.strictEqual(paystackCallCount,1);assert.strictEqual(b.body.checkoutUrl,a.body.checkoutUrl);assert.strictEqual(b.body.reused,true);
  });
  await test('valid signed charge.success webhook verifies with Paystack and confirms the order',async()=>{
    const o=await place(); await call('POST',`/api/payments/orders/${o.orderNumber}/initiate`,{token:ctx.tokens.customer}); const p=await payment(o.orderId); const before=await stock();
    const payload={event:'charge.success',data:{id:987,status:'success',reference:p.client_reference,amount:Math.round(o.total*100),currency:'GHS',channel:'mobile_money',gateway_response:'Successful',paid_at:new Date().toISOString()}};
    const res=await sendWebhook(payload); assert.strictEqual(res.status,200,JSON.stringify(res.body)); const after=await payment(o.orderId); assert.strictEqual(after.status,'PAID'); const [orders]=await db.execute('SELECT status FROM orders WHERE id=?',[o.orderId]); assert.strictEqual(orders[0].status,'CONFIRMED'); const s=await stock(); assert.strictEqual(s.stock,before.stock-1); assert.strictEqual(s.reserved,before.reserved);
  });
  await test('invalid webhook signature cannot mark payment paid',async()=>{
    const o=await place(); await call('POST',`/api/payments/orders/${o.orderNumber}/initiate`,{token:ctx.tokens.customer}); const p=await payment(o.orderId); const payload={event:'charge.success',data:{status:'success',reference:p.client_reference,amount:Math.round(o.total*100),currency:'GHS'}};
    const res=await sendWebhook(payload,'not-a-valid-signature'); assert.strictEqual(res.status,401); assert.strictEqual((await payment(o.orderId)).status,'INITIATED');
  });
  await test('wrong webhook amount is ignored',async()=>{
    const o=await place(); await call('POST',`/api/payments/orders/${o.orderNumber}/initiate`,{token:ctx.tokens.customer}); const p=await payment(o.orderId); const payload={event:'charge.success',data:{status:'success',reference:p.client_reference,amount:Math.round((o.total+50)*100),currency:'GHS'}};
    const res=await sendWebhook(payload); assert.strictEqual(res.status,200); assert.strictEqual((await payment(o.orderId)).status,'INITIATED');
  });
  await test('customer return verification confirms through the server, not the browser',async()=>{
    const o=await place(); await call('POST',`/api/payments/orders/${o.orderNumber}/initiate`,{token:ctx.tokens.customer}); const p=await payment(o.orderId); const res=await call('GET',`/api/payments/orders/${o.orderNumber}/verify?reference=${encodeURIComponent(p.client_reference)}`,{token:ctx.tokens.customer});
    assert.strictEqual(res.status,200,JSON.stringify(res.body)); assert.strictEqual(res.body.status,'PAID'); assert.strictEqual((await payment(o.orderId)).status,'PAID');
  });
  await test('duplicate success webhook is idempotent',async()=>{
    const o=await place(); await call('POST',`/api/payments/orders/${o.orderNumber}/initiate`,{token:ctx.tokens.customer}); const p=await payment(o.orderId); const payload={event:'charge.success',data:{status:'success',reference:p.client_reference,amount:Math.round(o.total*100),currency:'GHS',channel:'mobile_money'}};
    assert.strictEqual((await sendWebhook(payload)).status,200); const first=await db.execute('SELECT COUNT(*) n FROM order_events WHERE order_id=?',[o.orderId]); const second=await sendWebhook(payload); assert.strictEqual(second.status,200); const secondCount=await db.execute('SELECT COUNT(*) n FROM order_events WHERE order_id=?',[o.orderId]); assert.strictEqual(Number(secondCount[0][0].n),Number(first[0][0].n));
  });
}

(async()=>{server=http.createServer(app);await new Promise(r=>server.listen(0,'127.0.0.1',r));baseUrl=`http://127.0.0.1:${server.address().port}`;console.log('PowerBase Paystack payment integration tests');try{await run()}catch(e){console.error('\nFATAL:',e);results.failed++}console.log(`\n${results.passed} passed, ${results.failed} failed`);if(results.failures.length){for(const f of results.failures)console.log(`  - ${f.name}: ${f.e.message}`)}global.fetch=realFetch;server.close();await db.end();process.exit(results.failed?1:0)})();
