const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { releaseItems } = require('../services/stockService');
const { customerEventTitle, customerEventDescription, isReadyForDelivery } = require('../services/orderStateService');
const paymentService = require('../services/paymentService');
const { releaseExpiredReservations } = require('../services/reservationService');

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

exports.dashboard = async (req,res)=>{
  const [orderRows] = await db.execute(
    `SELECT COUNT(*) total,
            SUM(status IN ('PENDING','DELIVERY_FEE_PENDING','DELIVERY_FEE_QUOTED','AWAITING_DELIVERY_PAYMENT')) pending,
            SUM(status IN ('CONFIRMED','PROCESSING','READY_FOR_DELIVERY','OUT_FOR_DELIVERY')) processing,
            SUM(status='DELIVERED') delivered,
            SUM(status='CANCELLED') cancelled
     FROM orders`);
  const [customerRows] = await db.execute(`SELECT COUNT(*) total FROM users WHERE role='CUSTOMER'`);
  const [vendorRows] = await db.execute(`SELECT COUNT(*) total, SUM(is_active=1) active, SUM(verified=1) verified FROM vendors`);
  const [productRows] = await db.execute(`SELECT COUNT(*) total, SUM(is_active=1) active FROM products`);
  const [deliveryRows] = await db.execute(`SELECT COUNT(*) pending FROM delivery_quotes WHERE status='PENDING'`);
  const [settlementRows] = await db.execute(
    `SELECT SUM(status='PENDING') pending, SUM(status='PAID') paid,
            SUM(vendor_gross) total_vendor_gross, SUM(powerbase_margin) total_margin
     FROM vendor_settlements`);
  const [paymentRows] = await db.execute(
    `SELECT SUM(status='PAID') paid_count, SUM(CASE WHEN status='PAID' THEN amount ELSE 0 END) paid_amount FROM payments`);

  const o = orderRows[0], v = vendorRows[0], p = productRows[0], s = settlementRows[0], pay = paymentRows[0];
  res.json({
    orders: { total: Number(o.total||0), pending: Number(o.pending||0), processing: Number(o.processing||0), delivered: Number(o.delivered||0), cancelled: Number(o.cancelled||0) },
    customers: { total: Number(customerRows[0].total||0) },
    vendors: { total: Number(v.total||0), active: Number(v.active||0), verified: Number(v.verified||0) },
    products: { total: Number(p.total||0), active: Number(p.active||0) },
    delivery: { pendingQuotes: Number(deliveryRows[0].pending||0) },
    settlements: { pending: Number(s.pending||0), paid: Number(s.paid||0), totalVendorGross: Number(s.total_vendor_gross||0), totalMargin: Number(s.total_margin||0) },
    payments: { paidCount: Number(pay.paid_count||0), paidAmount: Number(pay.paid_amount||0) },
  });
};

exports.listOrders = async (req,res)=>{
  const [rows]=await db.execute(`SELECT o.id,o.order_number,o.customer_name,o.customer_phone,o.subtotal,o.platform_fee,o.delivery_fee,o.grand_total,o.status,o.created_at,d.city,d.area,d.landmark,d.latitude,d.longitude,d.status delivery_status FROM orders o JOIN delivery_quotes d ON d.order_id=o.id WHERE d.status='PENDING' ORDER BY o.created_at DESC`);
  res.json({orders:rows});
};

exports.updateDeliveryFee = async (req,res)=>{
  const orderId=Number(req.params.orderId); const rawFee=req.body.delivery_fee; const fee=Number(rawFee); const status=req.body.quote_status||'SET';
  if(!Number.isInteger(orderId)||!['SET','WAIVED','CANCELLED'].includes(status)) return res.status(400).json({message:'Invalid order or quote status'});
  if(status==='SET' && (!Number.isFinite(fee)||fee<0)) return res.status(400).json({message:'A valid non-negative delivery fee is required when setting a quote'});
  const conn=await db.getConnection();
  try{
    await conn.beginTransaction();
    const [orders]=await conn.execute('SELECT id,user_id,subtotal,platform_fee,status FROM orders WHERE id=? FOR UPDATE',[orderId]);
    if(!orders.length)return res.status(404).json({message:'Order not found'});
    const order=orders[0]; const actualFee=status==='WAIVED'?0:(status==='CANCELLED'?null:fee);
    const newStatus=status==='SET'?'DELIVERY_FEE_QUOTED':status==='WAIVED'?'DELIVERY_FEE_QUOTED':'CANCELLED';
    const grand=actualFee == null ? Number(order.subtotal)+Number(order.platform_fee) : Number(order.subtotal)+Number(order.platform_fee)+actualFee;
    await conn.execute('UPDATE delivery_quotes SET delivery_fee=?,status=?,quoted_at=NOW(),quoted_by=? WHERE order_id=?',[actualFee,status,req.user.id,orderId]);
    await conn.execute('UPDATE orders SET delivery_fee=?,grand_total=?,status=? WHERE id=?',[actualFee,grand,newStatus,orderId]);
    const feeMessage = actualFee == null ? 'Your delivery fee quote was cancelled. PowerBase will contact you with the next steps.' : `Your delivery fee is GHS ${actualFee.toFixed(2)}.`;
    await conn.execute('INSERT INTO order_events (order_id,status,title,description) VALUES (?,?,?,?)',[orderId,newStatus,'Delivery Fee Updated',feeMessage]);
    await conn.execute('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)',[order.user_id,'DELIVERY_FEE_UPDATE',`Order #${orderId} delivery fee`,feeMessage]);
    await conn.commit(); res.json({order:{id:orderId,deliveryFee:actualFee,grandTotal:grand,status:newStatus}});
  }catch(e){await conn.rollback();console.error(e);res.status(500).json({message:'Failed to update delivery fee'});}finally{conn.release();}
};

exports.listSettlements = async (req,res)=>{
  const [rows] = await db.execute(`SELECT vs.id,vs.order_id,vs.vendor_order_id,vs.vendor_id,v.store_name,o.order_number,o.status order_status,o.created_at,vs.vendor_gross,vs.powerbase_margin,vs.status,vs.payout_reference,vs.eligible_at,vs.paid_at FROM vendor_settlements vs JOIN vendors v ON v.id=vs.vendor_id JOIN orders o ON o.id=vs.order_id ORDER BY vs.created_at DESC`);
  res.json({settlements:rows});
};

exports.updateSettlement = async (req,res)=>{
  const id=Number(req.params.settlementId); const {status,payout_reference}=req.body||{};
  const allowed=['PENDING','ELIGIBLE','PROCESSING','PAID','HELD','CANCELLED'];
  if(!Number.isInteger(id)||!allowed.includes(status)) return res.status(400).json({message:'Invalid settlement status'});
  if(status==='PAID' && !String(payout_reference||'').trim()) return res.status(400).json({message:'A payout reference is required when marking a settlement paid'});
  const conn=await db.getConnection();
  try{
    await conn.beginTransaction();
    const [rows]=await conn.execute(`SELECT vs.id,vs.order_id,o.status order_status,p.status payment_status FROM vendor_settlements vs JOIN orders o ON o.id=vs.order_id LEFT JOIN payments p ON p.order_id=o.id WHERE vs.id=? FOR UPDATE`,[id]);
    if(!rows.length)return res.status(404).json({message:'Settlement not found'});
    const row=rows[0];
    if(['ELIGIBLE','PROCESSING','PAID'].includes(status) && row.payment_status !== 'PAID') return res.status(409).json({message:'Settlement cannot become payout-eligible until the PowerBase payment is confirmed as PAID'});
    if(status==='PAID' && !['DELIVERED'].includes(row.order_status)) return res.status(409).json({message:'Settlement cannot be marked PAID until the order is delivered'});
    // Preserve the original eligibility timestamp instead of resetting it on
    // every subsequent transition — it is the audit trail for when this
    // payout became owed.
    const eligibleAt = ['ELIGIBLE','PROCESSING','PAID'].includes(status) ? 'COALESCE(eligible_at, NOW())' : 'NULL';
    const paidAt = status==='PAID' ? 'NOW()' : 'NULL';
    await conn.execute(`UPDATE vendor_settlements SET status=?,payout_reference=?,eligible_at=${eligibleAt},paid_at=${paidAt} WHERE id=?`,[status,String(payout_reference||'').trim()||null,id]);
    await conn.commit(); res.json({settlement:{id,status,payoutReference:String(payout_reference||'').trim()||null}});
  }catch(e){await conn.rollback();console.error(e);res.status(500).json({message:'Failed to update settlement'});}finally{conn.release();}
};


// ---------------------------------------------------------------------------
// Payment confirmation and order fulfilment
// ---------------------------------------------------------------------------
// These two endpoints close the loop that the vendor side depends on. Before
// them, nothing in the system could ever set payments.status='PAID' or move
// an order to DELIVERED, which meant a settlement could never legitimately
// become ELIGIBLE or PAID and a vendor could never be cleared to fulfil.
//
// They are backend-only for now (no admin UI in this pass, per scope) and are
// ADMIN-authenticated. A real payment-provider webhook should eventually call
// the same transaction body for the PAID case; the important property is that
// this is the *only* path to PAID, and it is never reachable from a customer
// or vendor session or from a frontend "payment success" page.

exports.listAllOrders = async (req,res)=>{
  const where = []; const params = [];
  if (req.query.status) { where.push('o.status=?'); params.push(String(req.query.status).toUpperCase()); }
  if (req.query.paymentStatus) { where.push('pay.status=?'); params.push(String(req.query.paymentStatus).toUpperCase()); }
  if (req.query.q) { where.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ?)'); const t=`%${String(req.query.q).trim()}%`; params.push(t,t,t); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const page = Math.max(1, Number(req.query.page)||1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit)||50));
  const offset = (page-1)*limit;
  const [rows]=await db.execute(
    `SELECT o.id,o.order_number,o.customer_name,o.customer_phone,o.subtotal,o.platform_fee,o.delivery_fee,
            o.grand_total,o.status,o.created_at,
            pay.status payment_status, pay.transaction_reference, pay.provider,
            d.status delivery_status,d.city,d.area,
            (SELECT COUNT(*) FROM vendor_orders vo WHERE vo.order_id=o.id) vendor_order_count
     FROM orders o
     LEFT JOIN payments pay ON pay.order_id=o.id
     LEFT JOIN delivery_quotes d ON d.order_id=o.id
     ${whereSql} ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`, params);
  const [countRows]=await db.execute(`SELECT COUNT(*) total FROM orders o LEFT JOIN payments pay ON pay.order_id=o.id ${whereSql}`, params);
  const total=Number(countRows[0].total||0);
  res.json({orders:rows, pagination:{page,limit,total,totalPages:Math.max(1,Math.ceil(total/limit))}});
};

exports.getOrder = async (req,res)=>{
  const orderId=Number(req.params.orderId);
  if(!Number.isInteger(orderId)) return res.status(400).json({message:'Invalid order ID'});
  const [rows]=await db.execute(
    `SELECT o.*, pay.status payment_status, pay.transaction_reference, pay.provider, pay.paid_at
       FROM orders o LEFT JOIN payments pay ON pay.order_id=o.id WHERE o.id=? LIMIT 1`,[orderId]);
  if(!rows.length) return res.status(404).json({message:'Order not found'});
  const [vendorOrders]=await db.execute(
    `SELECT vo.id,vo.vendor_id,v.store_name,vo.subtotal,vo.status,vs.vendor_gross,vs.powerbase_margin,vs.status settlement_status
       FROM vendor_orders vo JOIN vendors v ON v.id=vo.vendor_id
       LEFT JOIN vendor_settlements vs ON vs.vendor_order_id=vo.id WHERE vo.order_id=?`,[orderId]);
  const [items]=await db.execute(
    `SELECT id,vendor_order_id,product_id,product_name,unit_price,quantity,line_total,stock_state FROM order_items WHERE order_id=?`,[orderId]);
  const [events]=await db.execute('SELECT status,title,description,created_at FROM order_events WHERE order_id=? ORDER BY created_at ASC',[orderId]);
  // Admin is not customer-restricted, so the full delivery quote (recipient,
  // address, GPS, fee) is included here — unlike the vendor-facing
  // vendorOrderDetail, which deliberately exposes only city/area/landmark.
  const [deliveryRows] = await db.execute(
    `SELECT recipient_name,recipient_phone,address,city,area,landmark,latitude,longitude,instructions,status,delivery_fee,quoted_at
       FROM delivery_quotes WHERE order_id=? LIMIT 1`,[orderId]);
  res.json({order:rows[0], vendorOrders, items, events, delivery: deliveryRows[0] || null});
};

/**
 * Record the outcome of a PowerBase payment.
 *
 *   PAID      -> reservations become real stock deductions, settlements for
 *                the order become ELIGIBLE, order moves to CONFIRMED.
 *   FAILED    -> reservations are released back to sellable stock.
 *   CANCELLED -> reservations released, order and settlements cancelled.
 */
exports.confirmPayment = async (req,res)=>{
  const orderId=Number(req.params.orderId);
  const status=String(req.body?.status||'').toUpperCase();
  const provider=String(req.body?.provider||'').trim();
  const transactionReference=String(req.body?.transactionReference||'').trim();
  if(!Number.isInteger(orderId)) return res.status(400).json({message:'Invalid order ID'});
  if(!['PAID','FAILED','CANCELLED'].includes(status)) return res.status(400).json({message:'Payment status must be PAID, FAILED or CANCELLED'});
  if(status==='PAID' && !transactionReference) return res.status(400).json({message:'A provider transaction reference is required when confirming a payment as PAID'});
  if(status==='PAID' && !provider) return res.status(400).json({message:'A payment provider is required when confirming a payment as PAID'});

  // This is the manually-operated twin of paymentController.hubtelCallback:
  // both ultimately call the same paymentService.applyPaymentOutcome, so the
  // stock/order/settlement/event/notification cascade can never drift
  // between "an operator told PowerBase a payment succeeded" and "a
  // verified provider webhook told PowerBase a payment succeeded". What
  // differs is how each establishes trust — this endpoint trusts the
  // authenticated Admin's word for it (e.g. reading a provider dashboard or
  // a phone confirmation); the webhook independently verifies the caller,
  // reference and amount before ever reaching applyPaymentOutcome.
  const conn=await db.getConnection();
  try{
    await conn.beginTransaction();
    const result = await paymentService.applyPaymentOutcome(conn, { orderId, status, provider, transactionReference });
    if(!result.ok){ await conn.rollback(); return res.status(result.code).json({message:result.message}); }
    if(result.idempotent){ await conn.rollback(); return res.status(200).json({message:'Payment already in this state', payment:{status:result.status}}); }
    await conn.commit();
    res.json({payment:{orderId,status,transactionReference:transactionReference||null}});
  }catch(e){ await conn.rollback(); console.error(e); res.status(500).json({message:'Failed to record the payment outcome'}); }
  finally{ conn.release(); }
};

// Order statuses PowerBase may write directly through this endpoint.
// PENDING/PROCESSING/READY_FOR_DELIVERY are vendor-derived — they come only
// from orderStateService.deriveOrderStatus() as vendor_orders change, never
// from an admin write, or orders.status and vendor_orders.status could
// disagree (e.g. orders.status=READY_FOR_DELIVERY while every vendor_orders
// row is still PENDING). CONFIRMED is likewise not admin-settable here: it
// is set exactly once, by confirmPayment above. OUT_FOR_DELIVERY and
// DELIVERED are PowerBase's to set — PowerBase runs last-mile delivery, and
// DELIVERED is the gate on settlement payout.
const ADMIN_ORDER_STATUSES=['OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];

exports.updateOrderStatus = async (req,res)=>{
  const orderId=Number(req.params.orderId);
  const status=String(req.body?.status||'').toUpperCase();
  if(!Number.isInteger(orderId)) return res.status(400).json({message:'Invalid order ID'});
  if(!ADMIN_ORDER_STATUSES.includes(status)) return res.status(400).json({message:'Invalid order status'});

  const conn=await db.getConnection();
  try{
    await conn.beginTransaction();
    const [orders]=await conn.execute(
      `SELECT o.id,o.user_id,o.order_number,o.status,pay.status payment_status
         FROM orders o LEFT JOIN payments pay ON pay.order_id=o.id WHERE o.id=? FOR UPDATE`,[orderId]);
    if(!orders.length){ await conn.rollback(); return res.status(404).json({message:'Order not found'}); }
    const order=orders[0];
    if(order.status===status){ await conn.rollback(); return res.json({order:{id:orderId,status}}); }
    if(['DELIVERED','CANCELLED'].includes(order.status)){ await conn.rollback(); return res.status(409).json({message:`This order is already ${order.status}`}); }
    if(status!=='CANCELLED' && order.payment_status!=='PAID'){ await conn.rollback(); return res.status(409).json({message:'Payment must be confirmed before an order can be moved through fulfilment'}); }
    if(status==='OUT_FOR_DELIVERY' && !(await isReadyForDelivery(conn,orderId))){
      // orders.status is derived from vendor_orders by orderStateService, but
      // we don't trust the cached column alone for a gate this important —
      // re-check the live vendor_orders rows, in this same transaction,
      // right before allowing PowerBase to hand the order to a rider. This
      // is what stops PENDING/CONFIRMED/PROCESSING (and a partially-ready
      // multi-vendor order) from skipping straight to OUT_FOR_DELIVERY.
      await conn.rollback();
      return res.status(409).json({message:'Every vendor on this order must reach READY_FOR_DELIVERY before it can be sent out for delivery'});
    }

    await conn.execute('UPDATE orders SET status=? WHERE id=?',[status,orderId]);
    if(status==='OUT_FOR_DELIVERY'||status==='DELIVERED'){
      // Keep vendor orders in step so a vendor's view never contradicts the
      // customer's. Vendors cannot set these themselves.
      await conn.execute('UPDATE vendor_orders SET status=? WHERE order_id=? AND status NOT IN (?,?)',[status,orderId,'CANCELLED','DELIVERED']);
    }
    if(status==='CANCELLED'){
      // Only ever a release, never a stock credit: if payment was already
      // confirmed the units are long since deducted and releaseItems finds
      // nothing still reserved. Returning delivered stock is a separate
      // returns/refund flow that does not exist yet.
      await releaseItems(conn,{orderId});
      await conn.execute('UPDATE vendor_orders SET status=? WHERE order_id=? AND status<>?',['CANCELLED',orderId,'DELIVERED']);
      await conn.execute(`UPDATE vendor_settlements SET status='CANCELLED' WHERE order_id=? AND status NOT IN ('PAID','PROCESSING')`,[orderId]);
    }
    await conn.execute('INSERT INTO order_events (order_id,status,title,description) VALUES (?,?,?,?)',
      [orderId,status,customerEventTitle(status),customerEventDescription(status)]);
    await conn.execute('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)',
      [order.user_id,'ORDER_UPDATE',`Order ${order.order_number}`,customerEventDescription(status)]);
    await conn.commit();
    res.json({order:{id:orderId,status}});
  }catch(e){ await conn.rollback(); console.error(e); res.status(500).json({message:'Failed to update the order status'}); }
  finally{ conn.release(); }
};

/**
 * Run the expired-reservation sweep on demand. The same sweep runs on a timer
 * in the live process; this is for operators who want it now, and for
 * verifying the behaviour.
 */
exports.expireReservations = async (req,res)=>{
  const hours = req.body?.hours === undefined ? undefined : Number(req.body.hours);
  if (hours !== undefined && (!Number.isFinite(hours) || hours < 0)) {
    return res.status(400).json({message:'hours must be a non-negative number'});
  }
  const result = await releaseExpiredReservations(hours === undefined ? {} : { hours });
  res.json(result);
};

// ---------------------------------------------------------------------------
// Vendor management
// ---------------------------------------------------------------------------

exports.listVendors = async (req,res)=>{
  const where = []; const params = [];
  if (req.query.q) { where.push('(v.store_name LIKE ? OR u.email LIKE ?)'); const term = `%${String(req.query.q).trim()}%`; params.push(term, term); }
  if (req.query.status === 'active') where.push('v.is_active=1');
  if (req.query.status === 'inactive') where.push('v.is_active=0');
  if (req.query.verified === 'true') where.push('v.verified=1');
  if (req.query.verified === 'false') where.push('v.verified=0');
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.execute(
    `SELECT v.id,v.store_name,v.location,v.rating,v.verified,v.is_active,v.default_share_percent,v.created_at,
            u.email,u.phone,
            (SELECT COUNT(*) FROM products p WHERE p.vendor_id=v.id) product_count,
            (SELECT COUNT(*) FROM vendor_orders vo WHERE vo.vendor_id=v.id) order_count
     FROM vendors v LEFT JOIN users u ON u.id=v.user_id
     ${whereSql} ORDER BY v.created_at DESC`, params);
  res.json({ vendors: rows });
};

exports.getVendor = async (req,res)=>{
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({message:'Invalid vendor ID'});
  const [rows] = await db.execute(
    `SELECT v.*, u.email, u.phone, u.full_name FROM vendors v LEFT JOIN users u ON u.id=v.user_id WHERE v.id=? LIMIT 1`, [id]);
  if (!rows.length) return res.status(404).json({message:'Vendor not found'});
  const [products] = await db.execute('SELECT id,name,price,stock_quantity,is_active FROM products WHERE vendor_id=? ORDER BY created_at DESC LIMIT 50', [id]);
  const [orders] = await db.execute(`SELECT vo.id,vo.subtotal,vo.status,o.order_number,o.created_at FROM vendor_orders vo JOIN orders o ON o.id=vo.order_id WHERE vo.vendor_id=? ORDER BY o.created_at DESC LIMIT 50`, [id]);
  const [earningsRows] = await db.execute(`SELECT SUM(vendor_gross) total_gross, SUM(CASE WHEN status='PAID' THEN vendor_gross ELSE 0 END) paid FROM vendor_settlements WHERE vendor_id=?`, [id]);
  res.json({ vendor: rows[0], products, orders, earnings: { totalGross: Number(earningsRows[0].total_gross||0), paid: Number(earningsRows[0].paid||0) } });
};

exports.createVendor = async (req,res)=>{
  const { storeName, email, phone, password, location, contactEmail, contactPhone, description, defaultSharePercent } = req.body || {};
  if (!storeName || !String(storeName).trim()) return res.status(400).json({message:'Store name is required'});
  if (!email || !password || String(password).length < 8) return res.status(400).json({message:'A vendor login email and a password of at least 8 characters are required'});
  const normalizedEmail = String(email).trim().toLowerCase();
  const share = defaultSharePercent === undefined || defaultSharePercent === null || defaultSharePercent === '' ? 80 : Number(defaultSharePercent);
  if (!Number.isFinite(share) || share < 0 || share > 100) return res.status(400).json({message:'Default share percent must be between 0 and 100'});

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.execute('SELECT id FROM users WHERE email=? LIMIT 1',[normalizedEmail]);
    if (existing.length) { await conn.rollback(); return res.status(409).json({message:'An account with this email already exists'}); }
    // Vendor accounts can only be provisioned by admin — there is no public
    // vendor self-registration endpoint (authController.register always
    // creates role='CUSTOMER'). This is the only place a VENDOR-role user
    // is created.
    const passwordHash = await bcrypt.hash(String(password), 12);
    const [userResult] = await conn.execute(
      `INSERT INTO users (full_name,email,phone,password_hash,role) VALUES (?,?,?,?,'VENDOR')`,
      [String(storeName).trim(), normalizedEmail, String(phone||'').trim(), passwordHash]);
    const [vendorResult] = await conn.execute(
      `INSERT INTO vendors (user_id,store_name,location,default_share_percent,contact_email,contact_phone,description,verified,is_active)
       VALUES (?,?,?,?,?,?,?,0,1)`,
      [userResult.insertId, String(storeName).trim(), location||'', share, contactEmail||null, contactPhone||null, description||null]);
    await conn.commit();
    res.status(201).json({ message: 'Vendor account created successfully', vendorId: vendorResult.insertId, userId: userResult.insertId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({message:'Failed to create vendor account'});
  } finally { conn.release(); }
};

exports.setVendorVerified = async (req,res)=>{
  const id = Number(req.params.id);
  const verified = Boolean(req.body?.verified);
  const [result] = await db.execute('UPDATE vendors SET verified=? WHERE id=?',[verified?1:0, id]);
  if (!result.affectedRows) return res.status(404).json({message:'Vendor not found'});
  res.json({message: verified ? 'Vendor verified' : 'Vendor verification removed'});
};

exports.setVendorStatus = async (req,res)=>{
  const id = Number(req.params.id);
  const isActive = Boolean(req.body?.isActive);
  const [result] = await db.execute('UPDATE vendors SET is_active=? WHERE id=?',[isActive?1:0, id]);
  if (!result.affectedRows) return res.status(404).json({message:'Vendor not found'});
  res.json({message: isActive ? 'Vendor activated' : 'Vendor deactivated'});
};

exports.setVendorShare = async (req,res)=>{
  const id = Number(req.params.id);
  const share = Number(req.body?.defaultSharePercent);
  if (!Number.isFinite(share) || share < 0 || share > 100) return res.status(400).json({message:'Default share percent must be between 0 and 100'});
  const [result] = await db.execute('UPDATE vendors SET default_share_percent=? WHERE id=?',[share, id]);
  if (!result.affectedRows) return res.status(404).json({message:'Vendor not found'});
  res.json({message:'Vendor default settlement share updated'});
};

// ---------------------------------------------------------------------------
// Customer management
// ---------------------------------------------------------------------------

exports.listCustomers = async (req,res)=>{
  const where = [`role='CUSTOMER'`]; const params = [];
  if (req.query.q) { where.push('(full_name LIKE ? OR email LIKE ? OR phone LIKE ?)'); const term = `%${String(req.query.q).trim()}%`; params.push(term,term,term); }
  if (req.query.status === 'active') where.push('is_active=1');
  if (req.query.status === 'inactive') where.push('is_active=0');
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const [rows] = await db.execute(
    `SELECT id,full_name,email,phone,is_active,created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id=users.id) order_count
     FROM users ${whereSql} ORDER BY created_at DESC`, params);
  res.json({ customers: rows });
};

exports.getCustomer = async (req,res)=>{
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({message:'Invalid customer ID'});
  const [rows] = await db.execute(`SELECT id,full_name,email,phone,is_active,created_at FROM users WHERE id=? AND role='CUSTOMER' LIMIT 1`,[id]);
  if (!rows.length) return res.status(404).json({message:'Customer not found'});
  const [orders] = await db.execute('SELECT id,order_number,grand_total,status,created_at FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 50',[id]);
  res.json({ customer: rows[0], orders });
};

exports.setCustomerStatus = async (req,res)=>{
  const id = Number(req.params.id);
  const isActive = Boolean(req.body?.isActive);
  // Scoped to role='CUSTOMER' so this endpoint can never be used to
  // activate/deactivate a vendor or another admin by id.
  const [result] = await db.execute(`UPDATE users SET is_active=? WHERE id=? AND role='CUSTOMER'`,[isActive?1:0, id]);
  if (!result.affectedRows) return res.status(404).json({message:'Customer not found'});
  res.json({message: isActive ? 'Customer account activated' : 'Customer account deactivated'});
};

// ---------------------------------------------------------------------------
// Product management (moderation only — admin does not author vendor
// product content; that stays in vendorController.js)
// ---------------------------------------------------------------------------

exports.listProducts = async (req,res)=>{
  const where = []; const params = [];
  if (req.query.vendorId) { where.push('p.vendor_id=?'); params.push(Number(req.query.vendorId)); }
  if (req.query.category) { where.push('p.category_id=?'); params.push(String(req.query.category)); }
  if (req.query.status === 'active') where.push('p.is_active=1');
  if (req.query.status === 'inactive') where.push('p.is_active=0');
  if (req.query.q) { where.push('p.name LIKE ?'); params.push(`%${String(req.query.q).trim()}%`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await db.execute(
    `SELECT p.id,p.name,p.price,p.stock_quantity,p.is_active,p.created_at,
            v.id vendor_id, v.store_name,
            c.name category_name
     FROM products p JOIN vendors v ON v.id=p.vendor_id LEFT JOIN categories c ON c.id=p.category_id
     ${whereSql} ORDER BY p.created_at DESC LIMIT 200`, params);
  res.json({ products: rows });
};

exports.setProductStatus = async (req,res)=>{
  const isActive = Boolean(req.body?.isActive);
  const [result] = await db.execute('UPDATE products SET is_active=? WHERE id=?',[isActive?1:0, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({message:'Product not found'});
  res.json({message: isActive ? 'Product activated' : 'Product deactivated'});
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

function slugify(name) {
  const slug = String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,74);
  return slug || `cat-${Date.now().toString(36)}`;
}

exports.listCategories = async (req,res)=>{
  const [rows] = await db.execute(`SELECT c.id,c.name,COUNT(p.id) product_count FROM categories c LEFT JOIN products p ON p.category_id=c.id GROUP BY c.id,c.name ORDER BY c.name ASC`);
  res.json({ categories: rows.map(r=>({id:r.id,name:r.name,productCount:Number(r.product_count)})) });
};

exports.createCategory = async (req,res)=>{
  const { name } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({message:'Category name is required'});
  const id = slugify(name);
  try {
    await db.execute('INSERT INTO categories (id,name) VALUES (?,?)',[id, String(name).trim()]);
    res.status(201).json({message:'Category created successfully', categoryId:id});
  } catch(e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({message:'A category with this name already exists'});
    res.status(500).json({message:'Failed to create category'});
  }
};

exports.updateCategory = async (req,res)=>{
  const { name } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({message:'Category name is required'});
  const [result] = await db.execute('UPDATE categories SET name=? WHERE id=?',[String(name).trim(), req.params.id]);
  if (!result.affectedRows) return res.status(404).json({message:'Category not found'});
  res.json({message:'Category updated successfully'});
};

exports.deleteCategory = async (req,res)=>{
  const [inUse] = await db.execute('SELECT COUNT(*) c FROM products WHERE category_id=?',[req.params.id]);
  if (Number(inUse[0].c) > 0) return res.status(409).json({message:'Cannot delete a category that still has products assigned to it'});
  const [result] = await db.execute('DELETE FROM categories WHERE id=?',[req.params.id]);
  if (!result.affectedRows) return res.status(404).json({message:'Category not found'});
  res.json({message:'Category deleted successfully'});
};
