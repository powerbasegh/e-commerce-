const db = require('../config/db');
const paymentService = require('../services/paymentService');

// This controller is deliberately thin: it authenticates/authorizes the
// caller and shapes the response, and delegates every actual state change to
// paymentService (see that file for why). No endpoint here can write
// payments.status = 'PAID' — that only ever happens inside
// paymentService.applyPaymentOutcome, called from either
// adminController.confirmPayment or the verified Hubtel webhook in
// webhookController.js.

exports.getMine = async (req,res)=>{
  const [rows] = await db.execute(
    `SELECT p.provider,p.transaction_reference,p.amount,p.currency,p.status,p.checkout_url,p.paid_at,p.created_at
       FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.order_number=? AND o.user_id=? LIMIT 1`,
    [req.params.orderNumber,req.user.id]);
  if(!rows.length) return res.status(404).json({message:'Payment not found'});
  const payment = rows[0];
  // checkout_url is only meaningful — and only shown — while a checkout is
  // still open; once paid/failed it's a dead Hubtel link with no further use.
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
