const db = require('../config/db');
const crypto = require('crypto');

const VALID_STATUSES = ['PENDING','DELIVERY_FEE_PENDING','DELIVERY_FEE_QUOTED','AWAITING_DELIVERY_PAYMENT','CONFIRMED','PROCESSING','READY_FOR_DELIVERY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];
function reference() { const d = new Date(); const ymd = d.toISOString().slice(0,10).replaceAll('-',''); return `PB-${ymd}-${crypto.randomInt(1000,10000)}`; }

exports.createOrder = async (req, res) => {
  const { items, delivery, customer } = req.body || {};
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'At least one cart item is required' });
  if (!delivery?.address || !delivery?.city || !delivery?.area) return res.status(400).json({ message: 'Complete delivery address, city and area are required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const ids = items.map(x => String(x.productId));
    const placeholders = ids.map(() => '?').join(',');
    const [products] = await conn.execute(`SELECT p.id,p.name,p.price,p.stock_quantity,p.vendor_id,v.store_name FROM products p JOIN vendors v ON v.id=p.vendor_id WHERE p.id IN (${placeholders}) AND p.is_active=1 FOR UPDATE`, ids);
    const byId = new Map(products.map(p => [String(p.id), p]));
    if (products.length !== new Set(ids).size) throw Object.assign(new Error('One or more products are unavailable'), { status: 409 });

    let subtotal = 0;
    const normalized = [];
    for (const item of items) {
      const p = byId.get(String(item.productId));
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > p.stock_quantity) throw Object.assign(new Error(`Invalid quantity for ${p.name}`), { status: 409 });
      const line = Number(p.price) * qty; subtotal += line;
      normalized.push({ product: p, qty, line });
    }
    const platformFee = 0; // Keep fee policy explicit; configure when platform pricing is finalized.
    const orderRef = reference();
    const [orderResult] = await conn.execute(`INSERT INTO orders (order_number,user_id,customer_name,customer_email,customer_phone,subtotal,platform_fee,delivery_fee,grand_total,status) VALUES (?,?,?,?,?,?,?,NULL,?,?)`, [orderRef, req.user.id, customer?.fullName || '', customer?.email || '', customer?.phone || '', subtotal, platformFee, subtotal + platformFee, 'DELIVERY_FEE_PENDING']);
    const orderId = orderResult.insertId;

    const groups = new Map();
    for (const x of normalized) { if (!groups.has(x.product.vendor_id)) groups.set(x.product.vendor_id, []); groups.get(x.product.vendor_id).push(x); }
    for (const [vendorId, group] of groups) {
      const vendorTotal = group.reduce((s,x)=>s+x.line,0);
      const [vr] = await conn.execute('INSERT INTO vendor_orders (order_id,vendor_id,subtotal,status) VALUES (?,?,?,?)',[orderId,vendorId,vendorTotal,'PENDING']);
      for (const x of group) await conn.execute('INSERT INTO order_items (order_id,vendor_order_id,product_id,product_name,unit_price,quantity,line_total) VALUES (?,?,?,?,?,?,?)',[orderId,vr.insertId,x.product.id,x.product.name,x.product.price,x.qty,x.line]);
    }
    await conn.execute(`INSERT INTO delivery_quotes (order_id,recipient_name,recipient_phone,address,city,area,landmark,latitude,longitude,instructions,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [orderId, customer?.fullName || '', customer?.phone || '', delivery.address, delivery.city, delivery.area, delivery.landmark || '', delivery.latitude ?? null, delivery.longitude ?? null, delivery.instructions || '', 'PENDING']);
    await conn.execute('INSERT INTO order_events (order_id,status,title,description) VALUES (?,?,?,?)',[orderId,'PENDING','Order Placed','Your order was received by PowerBase.']);
    await conn.execute('INSERT INTO order_events (order_id,status,title,description) VALUES (?,?,?,?)',[orderId,'DELIVERY_FEE_PENDING','Delivery Location Submitted','PowerBase is reviewing your delivery location to confirm the delivery fee.']);
    for (const x of normalized) await conn.execute('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [x.qty, x.product.id]);
    // Real event (order placed) -> real in-app notification, mirroring what
    // the frontend's local-storage checkout flow already does via
    // AccountContext.addNotification(). Never fabricated/random.
    await conn.execute('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)', [req.user.id, 'ORDER_UPDATE', `Order ${orderRef}`, `Your order ${orderRef} has been received.`]);
    await conn.commit();
    res.status(201).json({ order: { id: orderId, orderNumber: orderRef, subtotal, platformFee, deliveryFee: null, grandTotal: subtotal + platformFee, status: 'DELIVERY_FEE_PENDING' } });
  } catch (err) { await conn.rollback(); res.status(err.status || 500).json({ message: err.message || 'Could not create order' }); }
  finally { conn.release(); }
};

// Order history list: adds item_count/vendor_count so the customer-facing
// Order History card (item/vendor counts) doesn't need a second round trip
// per order just to render a summary.
exports.listMine = async (req,res)=>{ const [rows]=await db.execute(`SELECT o.id,o.order_number,o.subtotal,o.platform_fee,o.delivery_fee,o.grand_total,o.status,o.created_at, (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id=o.id) AS item_count, (SELECT COUNT(*) FROM vendor_orders vo WHERE vo.order_id=o.id) AS vendor_count FROM orders o WHERE o.user_id=? ORDER BY o.created_at DESC`,[req.user.id]); res.json({orders:rows}); };
// Looked up by the customer-facing order_number (e.g. "PB-20260830-4821"),
// not the internal numeric id — that's what the frontend route
// (/orders/:orderNumber) and every link to this endpoint actually has.
exports.getMine = async (req,res)=>{ const [rows]=await db.execute('SELECT * FROM orders WHERE order_number=? AND user_id=? LIMIT 1',[req.params.orderNumber,req.user.id]); if(!rows.length)return res.status(404).json({message:'Order not found'}); const order=rows[0]; const [items]=await db.execute('SELECT oi.id,oi.product_id,oi.product_name,oi.unit_price,oi.quantity,oi.line_total,vo.vendor_id,v.store_name,p.image_url FROM order_items oi JOIN vendor_orders vo ON vo.id=oi.vendor_order_id JOIN vendors v ON v.id=vo.vendor_id LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?',[order.id]); const [events]=await db.execute('SELECT status,title,description,created_at FROM order_events WHERE order_id=? ORDER BY created_at ASC',[order.id]); const [delivery]=await db.execute('SELECT recipient_name,recipient_phone,address,city,area,landmark,latitude,longitude,instructions,status,delivery_fee,quoted_at FROM delivery_quotes WHERE order_id=? LIMIT 1',[order.id]); res.json({order,items,events,delivery: delivery[0]||null}); };
exports.track = async (req, res) => {
  const ref = String(req.params.reference || '').trim().toUpperCase();
  const [rows] = await db.execute(
    `SELECT o.id, o.order_number, o.status, o.created_at, o.delivery_fee,
            o.grand_total, d.status AS quote_status, d.city, d.area
     FROM orders o
     LEFT JOIN delivery_quotes d ON d.order_id = o.id
     WHERE o.order_number = ?
     LIMIT 1`,
    [ref],
  );
  if (!rows.length) return res.status(404).json({ message: 'Order not found' });

  const [events] = await db.execute(
    `SELECT status, title, description, created_at
     FROM order_events WHERE order_id = ? ORDER BY created_at ASC`,
    [rows[0].id],
  );

  // Public tracking deliberately excludes recipient phone, full address,
  // exact GPS coordinates, payment details, and internal vendor/admin data.
  const order = {
    order_number: rows[0].order_number,
    status: rows[0].status,
    quote_status: rows[0].quote_status || 'PENDING',
    city: rows[0].city || '',
    area: rows[0].area || '',
    created_at: rows[0].created_at,
    delivery_fee: rows[0].delivery_fee,
    grand_total: rows[0].grand_total,
  };
  res.json({ order, events });
};
exports.vendorOrders = async(req,res)=>{ const [vendor]=await db.execute('SELECT id FROM vendors WHERE user_id=? LIMIT 1',[req.user.id]); if(!vendor.length)return res.status(404).json({message:'Vendor profile not found'}); const [rows]=await db.execute(`SELECT vo.id,vo.order_id,vo.subtotal,vo.status,o.order_number,o.created_at FROM vendor_orders vo JOIN orders o ON o.id=vo.order_id WHERE vo.vendor_id=? ORDER BY o.created_at DESC`,[vendor[0].id]); res.json({orders:rows}); };
