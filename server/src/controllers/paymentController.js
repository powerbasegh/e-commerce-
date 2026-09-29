const db = require('../config/db');
const paymentService = require('../services/paymentService');

exports.getMine = async (req,res)=>{
  const [rows] = await db.execute(
    `SELECT p.provider,p.transaction_reference,p.amount,p.currency,p.status,p.checkout_url,p.paid_at,p.created_at
       FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.order_number=? AND o.user_id=? LIMIT 1`,
    [req.params.orderNumber,req.user.id]);
  if(!rows.length) return res.status(404).json({message:'Payment not found'});
  const payment = rows[0];
  if (payment.status !== 'INITIATED') payment.checkout_url = null;
  res.json({payment});
};

exports.initiate = async (req,res)=>{
  const [orders] = await db.execute('SELECT id FROM orders WHERE order_number=? AND user_id=? LIMIT 1',[req.params.orderNumber,req.user.id]);
  if(!orders.length) return res.status(404).json({message:'Order not found'});
  const orderId = orders[0].id;
  const conn = await db.getConnection();
  try{
    await conn.beginTransaction();
    const result = await paymentService.initiatePayment(conn, { orderId, userId: req.user.id });
    if(!result.ok){ await conn.rollback(); return res.status(result.code).json({message:result.message}); }
    await conn.commit();
    res.json({checkoutUrl: result.checkoutUrl, reused: Boolean(result.reused)});
  }catch(e){ await conn.rollback(); console.error(e); res.status(500).json({message:'Could not start payment for this order'}); }
  finally{ conn.release(); }
};

// Paystack returns the customer to the order page with ?reference=...
// The browser never decides payment success. This endpoint asks Paystack to
// verify the reference and then runs the same locked payment outcome logic
// used by the webhook. The webhook remains the independent fallback/source
// of truth if the customer never returns.
exports.verifyReturn = async (req,res)=>{
  const [orders] = await db.execute('SELECT id FROM orders WHERE order_number=? AND user_id=? LIMIT 1',[req.params.orderNumber,req.user.id]);
  if(!orders.length) return res.status(404).json({message:'Order not found'});
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await paymentService.verifyAndApplyPayment(conn, { orderId: orders[0].id, reference: String(req.query.reference || '') });
    if(!result.ok){ await conn.rollback(); return res.status(result.code).json({message:result.message}); }
    await conn.commit();
    res.json({status: result.status || 'PENDING', pending: Boolean(result.pending), idempotent: Boolean(result.idempotent)});
  } catch (e) {
    await conn.rollback();
    console.error('Paystack return verification failed:', e);
    res.status(e.status || 502).json({message:e.message || 'Could not verify payment'});
  } finally { conn.release(); }
};
