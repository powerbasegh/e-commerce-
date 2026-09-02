const db = require('../config/db');

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
    const eligibleAt = ['ELIGIBLE','PROCESSING','PAID'].includes(status) ? 'NOW()' : 'NULL';
    const paidAt = status==='PAID' ? 'NOW()' : 'NULL';
    await conn.execute(`UPDATE vendor_settlements SET status=?,payout_reference=?,eligible_at=${eligibleAt},paid_at=${paidAt} WHERE id=?`,[status,String(payout_reference||'').trim()||null,id]);
    await conn.commit(); res.json({settlement:{id,status,payoutReference:String(payout_reference||'').trim()||null}});
  }catch(e){await conn.rollback();console.error(e);res.status(500).json({message:'Failed to update settlement'});}finally{conn.release();}
};
