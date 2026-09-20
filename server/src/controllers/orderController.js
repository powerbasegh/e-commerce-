const db = require('../config/db');
const crypto = require('crypto');
const { reserveItems, releaseItems } = require('../services/stockService');
const {
  vendorAllowedNext,
  VENDOR_ACTIONABLE_ORDER_STATUSES,
  deriveOrderStatus,
} = require('../services/orderStateService');

// vendor_orders.status is a separate fulfillment state machine from
// orders.status (the customer-facing PowerBase order). A vendor action here
// never writes orders.status directly — it updates its own vendor_orders row
// and then deriveOrderStatus() recomputes the customer order from the full
// set of vendor orders. The transition table itself lives in
// services/orderStateService.js so admin and vendor code share one authority.
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
    const [products] = await conn.execute(`
      SELECT p.id,p.name,p.price,p.stock_quantity,p.reserved_quantity,p.vendor_id,p.vendor_share_percent,
             v.default_share_percent
      FROM products p
      JOIN vendors v ON v.id=p.vendor_id
      WHERE p.id IN (${placeholders}) AND p.is_active=1 AND v.is_active=1
      FOR UPDATE`, ids);
    const byId = new Map(products.map(p => [String(p.id), p]));
    if (products.length !== new Set(ids).size) throw Object.assign(new Error('One or more products are unavailable'), { status: 409 });

    let subtotal = 0;
    const normalized = [];
    for (const item of items) {
      const p = byId.get(String(item.productId));
      const qty = Number(item.quantity);
      // Sellable stock is physical stock minus units already reserved for
      // other orders that are still awaiting payment.
      const available = Number(p.stock_quantity) - Number(p.reserved_quantity || 0);
      if (!Number.isInteger(qty) || qty < 1) throw Object.assign(new Error(`Invalid quantity for ${p.name}`), { status: 409 });
      if (qty > available) throw Object.assign(new Error(`Only ${Math.max(available, 0)} left in stock for ${p.name}`), { status: 409 });
      const sharePercent = p.vendor_share_percent == null ? Number(p.default_share_percent) : Number(p.vendor_share_percent);
      if (!Number.isFinite(sharePercent) || sharePercent < 0 || sharePercent > 100) throw Object.assign(new Error(`Invalid vendor settlement configuration for ${p.name}`), { status: 500 });
      const line = Number(p.price) * qty;
      subtotal += line;
      normalized.push({ product: p, qty, line, sharePercent });
    }

    // Customer pricing is PowerBase-controlled. The browser never determines
    // vendor payouts, PowerBase margin, or the authoritative order total.
    const platformFee = 0;
    const orderRef = reference();
    const [orderResult] = await conn.execute(
      `INSERT INTO orders (order_number,user_id,customer_name,customer_email,customer_phone,subtotal,platform_fee,delivery_fee,grand_total,status)
       VALUES (?,?,?,?,?,?,?,NULL,?,?)`,
      [orderRef, req.user.id, customer?.fullName || '', customer?.email || '', customer?.phone || '', subtotal, platformFee, subtotal + platformFee, 'DELIVERY_FEE_PENDING']
    );
    const orderId = orderResult.insertId;

    const groups = new Map();
    for (const x of normalized) {
      if (!groups.has(x.product.vendor_id)) groups.set(x.product.vendor_id, []);
      groups.get(x.product.vendor_id).push(x);
    }

    for (const [vendorId, group] of groups) {
      const vendorTotal = group.reduce((s,x)=>s+x.line,0);
      const vendorShare = group.reduce((s,x)=>s + (x.line * x.sharePercent / 100), 0);
      const powerbaseMargin = vendorTotal - vendorShare;
      const [vr] = await conn.execute(
        'INSERT INTO vendor_orders (order_id,vendor_id,subtotal,status) VALUES (?,?,?,?)',
        [orderId,vendorId,vendorTotal,'PENDING']
      );
      for (const x of group) {
        await conn.execute(
          `INSERT INTO order_items (order_id,vendor_order_id,product_id,product_name,unit_price,quantity,line_total,stock_state)
           VALUES (?,?,?,?,?,?,?,'RESERVED')`,
          [orderId,vr.insertId,x.product.id,x.product.name,x.product.price,x.qty,x.line]
        );
      }
      // Settlement is an internal liability. It becomes eligible only after
      // PowerBase confirms payment and the order reaches the business's
      // payout-ready state; the customer never sees these values.
      await conn.execute(
        `INSERT INTO vendor_settlements (order_id,vendor_order_id,vendor_id,vendor_gross,powerbase_margin,status)
         VALUES (?,?,?,?,?,'PENDING')`,
        [orderId,vr.insertId,vendorId,vendorShare,powerbaseMargin]
      );
    }

    // Payment belongs to PowerBase, not the individual vendors. A real
    // provider integration/webhook will update this record later; the
    // browser must never be allowed to mark an order paid by itself.
    await conn.execute(
      `INSERT INTO payments (order_id,provider,amount,status) VALUES (?,?,?,'PENDING')`,
      [orderId,'PENDING',subtotal + platformFee]
    );

    await conn.execute(
      `INSERT INTO delivery_quotes (order_id,recipient_name,recipient_phone,address,city,area,landmark,latitude,longitude,instructions,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [orderId, customer?.fullName || '', customer?.phone || '', delivery.address, delivery.city, delivery.area, delivery.landmark || '', delivery.latitude ?? null, delivery.longitude ?? null, delivery.instructions || '', 'PENDING']
    );
    await conn.execute('INSERT INTO order_events (order_id,status,title,description) VALUES (?,?,?,?)',[orderId,'PENDING','Order Placed','Your order was received by PowerBase.']);
    await conn.execute('INSERT INTO order_events (order_id,status,title,description) VALUES (?,?,?,?)',[orderId,'DELIVERY_FEE_PENDING','Delivery Location Submitted','PowerBase is reviewing your delivery location to confirm the delivery fee.']);
    // Stock is RESERVED here, not deducted. It becomes a real deduction only
    // when PowerBase confirms payment (adminController.confirmPayment ->
    // stockService.commitItems), and is released again if that payment fails
    // or the order is cancelled before fulfilment. Before migration 004 this
    // line permanently decremented stock at checkout, so an abandoned or
    // failed payment destroyed the vendor's inventory.
    await reserveItems(conn, normalized.map((x) => ({ productId: x.product.id, qty: x.qty })));
    await conn.execute('INSERT INTO notifications (user_id,type,title,message) VALUES (?,?,?,?)', [req.user.id, 'ORDER_UPDATE', `Order ${orderRef}`, `Your order ${orderRef} has been received.`]);
    await conn.commit();
    res.status(201).json({ order: { id: orderId, orderNumber: orderRef, subtotal, platformFee, deliveryFee: null, grandTotal: subtotal + platformFee, status: 'DELIVERY_FEE_PENDING' } });
  } catch (err) {
    await conn.rollback();
    res.status(err.status || 500).json({ message: err.message || 'Could not create order' });
  } finally { conn.release(); }
};

exports.listMine = async (req,res)=>{
  const [rows]=await db.execute(`SELECT o.id,o.order_number,o.subtotal,o.platform_fee,o.delivery_fee,o.grand_total,o.status,o.created_at,
    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id=o.id) AS item_count
    FROM orders o WHERE o.user_id=? ORDER BY o.created_at DESC`,[req.user.id]);
  res.json({orders:rows});
};

exports.getMine = async (req,res)=>{
  const [rows]=await db.execute('SELECT * FROM orders WHERE order_number=? AND user_id=? LIMIT 1',[req.params.orderNumber,req.user.id]);
  if(!rows.length)return res.status(404).json({message:'Order not found'});
  const order=rows[0];
  // Customer order details are intentionally PowerBase-branded. Vendor IDs,
  // store names, shares, margins and internal fulfillment records never cross
  // this boundary.
  const [items]=await db.execute(`SELECT oi.id,oi.product_id,oi.product_name,oi.unit_price,oi.quantity,oi.line_total,p.image_url
    FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?`,[order.id]);
  const [events]=await db.execute('SELECT status,title,description,created_at FROM order_events WHERE order_id=? ORDER BY created_at ASC',[order.id]);
  const [delivery]=await db.execute('SELECT recipient_name,recipient_phone,address,city,area,landmark,latitude,longitude,instructions,status,delivery_fee,quoted_at FROM delivery_quotes WHERE order_id=? LIMIT 1',[order.id]);
  res.json({order,items,events,delivery: delivery[0]||null});
};

exports.track = async (req, res) => {
  const ref = String(req.params.reference || '').trim().toUpperCase();
  const [rows] = await db.execute(`SELECT o.id, o.order_number, o.status, o.created_at, o.delivery_fee, o.grand_total, d.status AS quote_status, d.city, d.area FROM orders o LEFT JOIN delivery_quotes d ON d.order_id = o.id WHERE o.order_number = ? LIMIT 1`,[ref]);
  if (!rows.length) return res.status(404).json({ message: 'Order not found' });
  const [events] = await db.execute('SELECT status, title, description, created_at FROM order_events WHERE order_id = ? ORDER BY created_at ASC',[rows[0].id]);
  const order = { order_number: rows[0].order_number, status: rows[0].status, quote_status: rows[0].quote_status || 'PENDING', city: rows[0].city || '', area: rows[0].area || '', created_at: rows[0].created_at, delivery_fee: rows[0].delivery_fee, grand_total: rows[0].grand_total };
  res.json({ order, events });
};

exports.vendorOrders = async(req,res)=>{
  const vendorId = req.vendor.id;
  const where = ['vo.vendor_id = ?'];
  const params = [vendorId];
  if (req.query.status && req.query.status !== 'all') {
    where.push('vo.status = ?');
    params.push(String(req.query.status).toUpperCase());
  }
  if (req.query.q) {
    where.push('o.order_number LIKE ?');
    params.push(`%${String(req.query.q).trim()}%`);
  }
  // powerbase_margin is PowerBase's internal business information and must
  // never be selected here — only the vendor's own gross earnings and
  // settlement status are vendor-facing. Nor is any customer identity
  // (name/email/phone) selected: the vendor's relationship is with
  // PowerBase, not the customer.
  const [rows]=await db.execute(
    `SELECT vo.id,vo.order_id,vo.subtotal,vo.status,o.order_number,o.created_at,
            o.status order_status,
            vs.vendor_gross,vs.status settlement_status,
            pay.status payment_status,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.vendor_order_id=vo.id) item_count,
            (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.vendor_order_id=vo.id) unit_count
     FROM vendor_orders vo
     JOIN orders o ON o.id=vo.order_id
     LEFT JOIN vendor_settlements vs ON vs.vendor_order_id=vo.id
     LEFT JOIN payments pay ON pay.order_id=o.id
     WHERE ${where.join(' AND ')}
     ORDER BY o.created_at DESC`, params);
  res.json({orders:rows.map(toVendorOrderRow)});
};

// Shapes a vendor_orders row for the vendor UI and, just as importantly,
// decides server-side which actions that vendor may take on it — the browser
// is told what it may do, it does not decide.
function toVendorOrderRow(row) {
  const paymentConfirmed = row.payment_status === 'PAID';
  const orderActionable = VENDOR_ACTIONABLE_ORDER_STATUSES.includes(row.order_status);
  return {
    ...row,
    // Whether PowerBase has been paid — a plain boolean, never the amount
    // the customer paid, the delivery fee, or PowerBase's margin.
    paymentConfirmed,
    availableTransitions: paymentConfirmed && orderActionable ? vendorAllowedNext(row.status) : [],
    // Left deliberately unset for the vendor: powerbase_margin, customer
    // name/email/phone, grand_total, delivery_fee, other vendors' rows.
  };
}

exports.vendorSettlements = async(req,res)=>{
  const vendorId = req.vendor.id;
  // Same rule as vendorOrders above: vendor_gross/payout fields only, never
  // powerbase_margin.
  const [rows]=await db.execute(`SELECT vs.id,vs.order_id,vs.vendor_order_id,vs.vendor_gross,vs.status,vs.payout_reference,vs.eligible_at,vs.paid_at,o.order_number,o.created_at,o.status order_status FROM vendor_settlements vs JOIN orders o ON o.id=vs.order_id WHERE vs.vendor_id=? ORDER BY vs.created_at DESC`,[vendorId]);
  const totals = rows.reduce((acc,r)=>{ acc[r.status]=(acc[r.status]||0)+Number(r.vendor_gross||0); return acc; },{});
  res.json({settlements:rows, totals});
};

exports.vendorOrderDetail = async(req,res)=>{
  const vendorId = req.vendor.id;
  // Ownership enforced server-side via "AND vo.vendor_id=?" — a vendor can
  // never open another vendor's order by guessing or editing an id. It
  // 404s rather than 403s so the endpoint does not confirm that some other
  // vendor's order id exists.
  const [rows]=await db.execute(
    `SELECT vo.id,vo.order_id,vo.subtotal,vo.status,o.order_number,o.created_at,
            o.status order_status,
            vs.vendor_gross,vs.status settlement_status,
            pay.status payment_status,
            d.city,d.area,d.landmark,d.instructions
     FROM vendor_orders vo
     JOIN orders o ON o.id=vo.order_id
     LEFT JOIN vendor_settlements vs ON vs.vendor_order_id=vo.id
     LEFT JOIN payments pay ON pay.order_id=o.id
     LEFT JOIN delivery_quotes d ON d.order_id=o.id
     WHERE vo.id=? AND vo.vendor_id=? LIMIT 1`,
    [req.params.vendorOrderId, vendorId],
  );
  if(!rows.length) return res.status(404).json({message:'Order not found'});
  // Only city/area/landmark/instructions are exposed, and only because they
  // are what a vendor needs to pack and hand off an order. The exact street
  // address, GPS coordinates and the customer's name, phone and email stay
  // with PowerBase, which runs the last mile.
  //
  // Scoped to vendor_order_id, so a multi-vendor PowerBase order shows this
  // vendor only their own lines.
  const [items]=await db.execute(
    `SELECT oi.id,oi.product_id,oi.product_name,oi.unit_price,oi.quantity,oi.line_total,oi.stock_state,
            p.sku,p.image_url
     FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id
     WHERE oi.vendor_order_id=?`,
    [rows[0].id],
  );
  res.json({ vendorOrder: toVendorOrderRow(rows[0]), items });
};

exports.updateVendorOrderStatus = async(req,res)=>{
  const vendorId = req.vendor.id;
  const nextStatus = String(req.body?.status || '').toUpperCase();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      `SELECT vo.id,vo.status,vo.order_id,o.status order_status,pay.status payment_status
         FROM vendor_orders vo
         JOIN orders o ON o.id=vo.order_id
         LEFT JOIN payments pay ON pay.order_id=o.id
        WHERE vo.id=? AND vo.vendor_id=? LIMIT 1 FOR UPDATE`,
      [req.params.vendorOrderId, vendorId]);
    if (!rows.length) { await conn.rollback(); return res.status(404).json({message:'Order not found'}); }
    const current = rows[0];

    // Gate 1 — PowerBase must actually have been paid before a vendor
    // fulfils anything. Until then the stock is only reserved.
    if (current.payment_status !== 'PAID') {
      await conn.rollback();
      return res.status(409).json({ message: 'PowerBase has not confirmed payment for this order yet' });
    }
    // Gate 2 — the customer order must be in a state where vendor
    // fulfilment is meaningful (not cancelled, not already out for delivery
    // or delivered).
    if (!VENDOR_ACTIONABLE_ORDER_STATUSES.includes(current.order_status)) {
      await conn.rollback();
      return res.status(409).json({ message: 'This order is no longer open for vendor fulfilment' });
    }
    // Gate 3 — the transition itself. The backend, not the vendor's
    // browser, decides which moves are legal from the current state, and the
    // vendor table excludes OUT_FOR_DELIVERY and DELIVERED entirely: those
    // belong to PowerBase, and DELIVERED is what unlocks settlement payout.
    const allowed = vendorAllowedNext(current.status);
    if (!allowed.includes(nextStatus)) {
      await conn.rollback();
      return res.status(409).json({message:`You cannot move an order from ${current.status} to ${nextStatus}`});
    }

    await conn.execute('UPDATE vendor_orders SET status=? WHERE id=?',[nextStatus, current.id]);

    if (nextStatus === 'CANCELLED') {
      // Cancelled before fulfilment began: hand this vendor's reserved units
      // back, and void this vendor's settlement. Scoped to this vendor_order,
      // so other vendors on the same PowerBase order are untouched.
      await releaseItems(conn, { vendorOrderId: current.id });
      await conn.execute(
        `UPDATE vendor_settlements SET status='CANCELLED' WHERE vendor_order_id=? AND status NOT IN ('PAID','PROCESSING')`,
        [current.id]);
    }

    // Recompute the customer-facing order from all of its vendor orders so
    // the two can never drift apart.
    const orderStatus = await deriveOrderStatus(conn, current.order_id);

    await conn.commit();
    res.json({ vendorOrder: { id: current.id, status: nextStatus, availableTransitions: vendorAllowedNext(nextStatus) }, orderStatus });
  } catch(e) {
    await conn.rollback();
    res.status(500).json({message:'Failed to update order status'});
  } finally {
    conn.release();
  }
};
