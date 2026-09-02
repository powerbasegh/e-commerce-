const db = require('../config/db');

// Payment-provider webhooks must be implemented per provider. This controller
// deliberately exposes no customer-facing "mark paid" endpoint. The only
// mutation here is an internal/admin reconciliation action.
exports.getMine = async (req,res)=>{
  const [rows] = await db.execute(`SELECT p.provider,p.transaction_reference,p.amount,p.status,p.paid_at,p.created_at FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.order_number=? AND o.user_id=? LIMIT 1`,[req.params.orderNumber,req.user.id]);
  if(!rows.length) return res.status(404).json({message:'Payment not found'});
  res.json({payment:rows[0]});
};
