const db = require('../config/db');
const crypto = require('crypto');

const STATUSES = new Set(['PENDING_QUOTE','QUOTED','PAYMENT_PENDING','PAID','ASSIGNED','PICKED_UP','IN_TRANSIT','DELIVERED','CANCELLED']);

function clean(v, max=500) { return String(v ?? '').trim().slice(0, max); }
function requireText(v, label, max=500) { const s=clean(v,max); if(!s) { const e=new Error(`${label} is required`); e.status=400; throw e; } return s; }
function money(v) { const n=Number(v); return Number.isFinite(n) && n >= 0 ? Number(n.toFixed(2)) : null; }

exports.create = async (req,res) => {
  const b=req.body||{};
  const pickupName=requireText(b.pickupName,'Pickup name',160), pickupPhone=requireText(b.pickupPhone,'Pickup phone',40), pickupAddress=requireText(b.pickupAddress,'Pickup address');
  const destinationName=requireText(b.destinationName,'Destination name',160), destinationPhone=requireText(b.destinationPhone,'Destination phone',40), destinationAddress=requireText(b.destinationAddress,'Destination address');
  const packageDescription=requireText(b.packageDescription,'Package description');
  const packageSize=['SMALL','MEDIUM','LARGE'].includes(b.packageSize)?b.packageSize:'MEDIUM';
  const deliveryType=['STANDARD','SCHEDULED','INTERCITY'].includes(b.deliveryType)?b.deliveryType:'STANDARD';
  let scheduledAt=b.scheduledAt?new Date(b.scheduledAt):null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) { const e=new Error('Invalid scheduled time'); e.status=400; throw e; }
  if (deliveryType==='SCHEDULED' && !scheduledAt) { const e=new Error('Scheduled delivery requires a scheduled time'); e.status=400; throw e; }
  const [r]=await db.query(`INSERT INTO delivery_requests (customer_id,pickup_name,pickup_phone,pickup_address,destination_name,destination_phone,destination_address,package_description,package_size,delivery_type,scheduled_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,[req.user.id,pickupName,pickupPhone,pickupAddress,destinationName,destinationPhone,destinationAddress,packageDescription,packageSize,deliveryType,scheduledAt]);
  res.status(201).json({id:r.insertId,status:'PENDING_QUOTE'});
};

exports.mine = async (req,res) => { const [rows]=await db.query(`SELECT id,pickup_name AS pickupName,pickup_phone AS pickupPhone,pickup_address AS pickupAddress,destination_name AS destinationName,destination_phone AS destinationPhone,destination_address AS destinationAddress,package_description AS packageDescription,package_size AS packageSize,delivery_type AS deliveryType,scheduled_at AS scheduledAt,quoted_fee AS quotedFee,currency,status,payment_reference AS paymentReference,rider_name AS riderName,rider_phone AS riderPhone,rider_vehicle AS riderVehicle,tracking_note AS trackingNote,created_at AS createdAt,updated_at AS updatedAt FROM delivery_requests WHERE customer_id=? ORDER BY created_at DESC`,[req.user.id]); res.json(rows); };

exports.getMine = async (req,res) => { const [rows]=await db.query(`SELECT * FROM delivery_requests WHERE id=? AND customer_id=? LIMIT 1`,[req.params.id,req.user.id]); if(!rows.length) return res.status(404).json({message:'Delivery request not found'}); const r=rows[0]; delete r.customer_id; res.json(r); };

exports.adminList = async (req,res) => { const status=clean(req.query.status,40); const params=[]; let where=''; if(status && STATUSES.has(status)){where='WHERE d.status=?';params.push(status);} const [rows]=await db.query(`SELECT d.*,u.full_name AS customer_name,u.email AS customer_email FROM delivery_requests d JOIN users u ON u.id=d.customer_id ${where} ORDER BY d.created_at DESC`,params); res.json(rows); };

exports.adminQuote = async (req,res) => { const fee=money(req.body?.quotedFee); if(fee===null){return res.status(400).json({message:'A valid quoted fee is required'});} const [r]=await db.query(`UPDATE delivery_requests SET quoted_fee=?,currency='GHS',status='QUOTED' WHERE id=? AND status IN ('PENDING_QUOTE','QUOTED')`,[fee,req.params.id]); if(!r.affectedRows) return res.status(409).json({message:'Delivery request cannot be quoted in its current state'}); res.json({message:'Delivery fee quoted',quotedFee:fee,status:'QUOTED'}); };

exports.adminAssign = async (req,res) => { const name=requireText(req.body?.riderName,'Rider name',160), phone=requireText(req.body?.riderPhone,'Rider phone',40), vehicle=clean(req.body?.riderVehicle,160); const [r]=await db.query(`UPDATE delivery_requests SET rider_name=?,rider_phone=?,rider_vehicle=?,status=CASE WHEN status IN ('PAID','QUOTED','ASSIGNED') THEN 'ASSIGNED' ELSE status END WHERE id=? AND status IN ('PAID','QUOTED','ASSIGNED')`,[name,phone,vehicle,req.params.id]); if(!r.affectedRows)return res.status(409).json({message:'Delivery must be quoted or paid before assignment'}); res.json({message:'Rider assigned',status:'ASSIGNED'}); };

exports.adminStatus = async (req,res) => { const status=clean(req.body?.status,40); if(!STATUSES.has(status))return res.status(400).json({message:'Invalid delivery status'}); const allowed={QUOTED:['PAYMENT_PENDING','CANCELLED'],PAYMENT_PENDING:['PAID','CANCELLED'],PAID:['ASSIGNED','CANCELLED'],ASSIGNED:['PICKED_UP','CANCELLED'],PICKED_UP:['IN_TRANSIT'],IN_TRANSIT:['DELIVERED']}; const [cur]=await db.query('SELECT status FROM delivery_requests WHERE id=? LIMIT 1',[req.params.id]); if(!cur.length)return res.status(404).json({message:'Delivery request not found'}); const current=cur[0].status; if(status!==current && !(allowed[current]||[]).includes(status))return res.status(409).json({message:`Cannot move delivery from ${current} to ${status}`}); await db.query('UPDATE delivery_requests SET status=? WHERE id=?',[status,req.params.id]); res.json({status}); };

exports.adminAnalytics = async (req,res) => { const [[counts]]=await db.query(`SELECT COUNT(*) total, SUM(status='PENDING_QUOTE') pendingQuotes,SUM(status IN ('QUOTED','PAYMENT_PENDING')) awaitingPayment,SUM(status IN ('ASSIGNED','PICKED_UP','IN_TRANSIT')) activeDeliveries,SUM(status='DELIVERED') delivered,SUM(COALESCE(quoted_fee,0)) quotedValue FROM delivery_requests`); res.json(counts); };
