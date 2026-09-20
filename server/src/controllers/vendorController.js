const db = require('../config/db');
const crypto = require('crypto');
const imageService = require('../services/imageService');

// ---------------------------------------------------------------------------
// Vendor-facing product, inventory, profile, dashboard and earnings endpoints.
//
// Security rule: the vendor is never taken from the request body or params.
// requireActiveVendor (middleware/auth.js) resolves it from the JWT
// (req.user.id -> vendors.user_id) and attaches req.vendor; every query below
// is scoped with "WHERE vendor_id = ?" using that server-resolved id. A
// vendor_id, product id or order id supplied by the client can therefore
// never reach another vendor's rows — it only ever fails to match.
//
// Business rule: a vendor sees their own retail price and their own
// vendor_gross ("vendor share"), never powerbase_margin and never another
// vendor's data. Nothing in this file selects powerbase_margin.
// ---------------------------------------------------------------------------

const LOW_STOCK_THRESHOLD = 5;

function newProductId(vendorId) {
  return `p-${vendorId}-${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;
}

function toVendorProduct(row, defaultSharePercent) {
  const price = Number(row.price);
  const sharePercent = row.vendor_share_percent == null ? Number(defaultSharePercent) : Number(row.vendor_share_percent);
  const stock = Number(row.stock_quantity || 0);
  const reserved = Number(row.reserved_quantity || 0);
  return {
    id: row.id,
    name: row.name,
    sku: row.sku || null,
    price,
    oldPrice: row.old_price == null ? null : Number(row.old_price),
    stock,
    // Units held for orders that are placed but not yet paid for. Physical
    // stock is only deducted on payment confirmation (see stockService.js).
    reserved,
    available: Math.max(stock - reserved, 0),
    lowStock: Math.max(stock - reserved, 0) <= LOW_STOCK_THRESHOLD,
    image: row.image_url,
    category: row.category_id ? { id: row.category_id, name: row.category_name || null } : null,
    isActive: !!row.is_active,
    // The vendor's own settlement rate and resulting gross payout for this
    // product — never PowerBase's margin (customer price minus this).
    sharePercent,
    vendorGross: Number(((price * sharePercent) / 100).toFixed(2)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

exports.dashboard = async (req, res) => {
  const vendor = req.vendor;

  const [productRows] = await db.execute(
    `SELECT COUNT(*) total,
            SUM(is_active = 1) active,
            SUM(is_active = 1 AND (CAST(stock_quantity AS SIGNED) - CAST(reserved_quantity AS SIGNED)) <= ?) low_stock,
            SUM(is_active = 1 AND (CAST(stock_quantity AS SIGNED) - CAST(reserved_quantity AS SIGNED)) <= 0) out_of_stock
     FROM products WHERE vendor_id = ?`,
    [LOW_STOCK_THRESHOLD, vendor.id],
  );
  // "Needs action" counts only orders the vendor can actually act on right
  // now — i.e. where PowerBase has confirmed payment and the vendor order is
  // still awaiting a fulfilment step.
  const [orderRows] = await db.execute(
    `SELECT SUM(vo.status = 'PENDING') pending,
            SUM(vo.status = 'PROCESSING') processing,
            SUM(vo.status = 'READY_FOR_DELIVERY') ready_for_delivery,
            SUM(vo.status = 'OUT_FOR_DELIVERY') out_for_delivery,
            SUM(vo.status = 'DELIVERED') delivered,
            SUM(vo.status = 'CANCELLED') cancelled,
            SUM(vo.status IN ('PENDING','PROCESSING')
                AND o.status IN ('CONFIRMED','PROCESSING','READY_FOR_DELIVERY')) needs_action
     FROM vendor_orders vo JOIN orders o ON o.id = vo.order_id
     WHERE vo.vendor_id = ?`,
    [vendor.id],
  );
  const [earningsRows] = await db.execute(
    `SELECT SUM(CASE WHEN status <> 'CANCELLED' THEN vendor_gross ELSE 0 END) total_gross,
            SUM(CASE WHEN status = 'PENDING' THEN vendor_gross ELSE 0 END) pending,
            SUM(CASE WHEN status IN ('ELIGIBLE','PROCESSING') THEN vendor_gross ELSE 0 END) available,
            SUM(CASE WHEN status = 'PAID' THEN vendor_gross ELSE 0 END) paid
     FROM vendor_settlements WHERE vendor_id = ?`,
    [vendor.id],
  );

  const p = productRows[0];
  const o = orderRows[0];
  const e = earningsRows[0];

  res.json({
    vendor: { id: vendor.id, storeName: vendor.store_name, verified: !!vendor.verified, isActive: !!vendor.is_active },
    products: {
      total: Number(p.total || 0),
      active: Number(p.active || 0),
      lowStock: Number(p.low_stock || 0),
      outOfStock: Number(p.out_of_stock || 0),
    },
    orders: {
      pending: Number(o.pending || 0),
      processing: Number(o.processing || 0),
      readyForDelivery: Number(o.ready_for_delivery || 0),
      outForDelivery: Number(o.out_for_delivery || 0),
      delivered: Number(o.delivered || 0),
      cancelled: Number(o.cancelled || 0),
      needsAction: Number(o.needs_action || 0),
    },
    earnings: {
      totalGross: Number(e.total_gross || 0),
      pending: Number(e.pending || 0),
      available: Number(e.available || 0),
      paid: Number(e.paid || 0),
    },
  });
};

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

function toVendorProfile(vendor) {
  return {
    id: vendor.id,
    storeName: vendor.store_name,
    location: vendor.location,
    contactEmail: vendor.contact_email,
    contactPhone: vendor.contact_phone,
    description: vendor.description,
    payout: {
      method: vendor.payout_method || '',
      accountName: vendor.payout_account_name || '',
      accountNumber: vendor.payout_account_number || '',
      bankName: vendor.payout_bank_name || '',
    },
    // Read-only, admin-controlled. Returned so the vendor can see their
    // standing, but updateProfile below never writes any of them.
    rating: Number(vendor.rating),
    verified: !!vendor.verified,
    isActive: !!vendor.is_active,
    defaultSharePercent: Number(vendor.default_share_percent),
    createdAt: vendor.created_at,
  };
}

exports.getProfile = async (req, res) => {
  res.json({ vendor: toVendorProfile(req.vendor) });
};

const PAYOUT_METHODS = ['MOMO_MTN', 'MOMO_TELECEL', 'MOMO_AT', 'BANK'];

exports.updateProfile = async (req, res) => {
  const vendor = req.vendor;
  const { storeName, location, contactEmail, contactPhone, description, payout } = req.body || {};
  if (!storeName || !String(storeName).trim()) return res.status(400).json({ message: 'Store name is required' });

  const payoutMethod = payout?.method ? String(payout.method).toUpperCase() : null;
  if (payoutMethod && !PAYOUT_METHODS.includes(payoutMethod)) {
    return res.status(400).json({ message: 'Select a valid payout method' });
  }
  if (payoutMethod && !String(payout?.accountNumber || '').trim()) {
    return res.status(400).json({ message: 'A payout account or mobile money number is required' });
  }
  if (payoutMethod === 'BANK' && !String(payout?.bankName || '').trim()) {
    return res.status(400).json({ message: 'A bank name is required for bank payouts' });
  }

  // An explicit allow-list of columns. role, vendor_id, verified, is_active,
  // default_share_percent, rating and every settlement field are absent by
  // design — a vendor cannot verify themselves, reactivate a suspended
  // account, or raise their own settlement share through this endpoint.
  await db.execute(
    `UPDATE vendors
        SET store_name = ?, location = ?, contact_email = ?, contact_phone = ?, description = ?,
            payout_method = ?, payout_account_name = ?, payout_account_number = ?, payout_bank_name = ?
      WHERE id = ?`,
    [
      String(storeName).trim(),
      location || '',
      contactEmail || null,
      contactPhone || null,
      description || null,
      payoutMethod,
      payoutMethod ? String(payout?.accountName || '').trim() || null : null,
      payoutMethod ? String(payout?.accountNumber || '').trim() || null : null,
      payoutMethod === 'BANK' ? String(payout?.bankName || '').trim() || null : null,
      vendor.id,
    ],
  );

  const [rows] = await db.execute('SELECT * FROM vendors WHERE id = ? LIMIT 1', [vendor.id]);
  res.json({ message: 'Profile updated successfully', vendor: toVendorProfile(rows[0]) });
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

exports.listProducts = async (req, res) => {
  const vendor = req.vendor;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  // vendor_id is always the first predicate and always the server-resolved
  // value; the filters below can only ever narrow within this vendor's rows.
  const where = ['p.vendor_id = ?'];
  const params = [vendor.id];

  if (req.query.q) {
    where.push('(p.name LIKE ? OR p.sku LIKE ?)');
    const term = `%${String(req.query.q).trim()}%`;
    params.push(term, term);
  }
  if (req.query.status === 'active') where.push('p.is_active = 1');
  if (req.query.status === 'inactive') where.push('p.is_active = 0');
  if (req.query.category) {
    where.push('p.category_id = ?');
    params.push(String(req.query.category));
  }
  if (req.query.stock === 'low') {
    where.push('(CAST(p.stock_quantity AS SIGNED) - CAST(p.reserved_quantity AS SIGNED)) <= ?');
    params.push(LOW_STOCK_THRESHOLD);
  }
  if (req.query.stock === 'out') {
    where.push('(CAST(p.stock_quantity AS SIGNED) - CAST(p.reserved_quantity AS SIGNED)) <= 0');
  }

  const SORTS = {
    newest: 'p.created_at DESC',
    oldest: 'p.created_at ASC',
    name_asc: 'p.name ASC',
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    stock_asc: 'p.stock_quantity ASC',
  };
  // Whitelisted: the sort key selects a fixed fragment, it is never
  // interpolated from the query string.
  const orderBy = SORTS[req.query.sort] || SORTS.newest;
  const whereSql = `WHERE ${where.join(' AND ')}`;

  const [rows] = await db.execute(
    `SELECT p.id,p.name,p.sku,p.price,p.old_price,p.stock_quantity,p.reserved_quantity,p.image_url,
            p.category_id,c.name AS category_name,p.is_active,p.vendor_share_percent,p.created_at,p.updated_at
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );
  const [countRows] = await db.execute(`SELECT COUNT(*) total FROM products p ${whereSql}`, params);
  const total = Number(countRows[0].total || 0);

  res.json({
    products: rows.map((r) => toVendorProduct(r, vendor.default_share_percent)),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
};

exports.getProduct = async (req, res) => {
  const vendor = req.vendor;
  // Ownership enforced server-side: a vendor can never fetch another
  // vendor's product by guessing or editing an id.
  const [rows] = await db.execute(
    `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ? AND p.vendor_id = ? LIMIT 1`,
    [req.params.id, vendor.id],
  );
  if (!rows.length) return res.status(404).json({ message: 'Product not found' });
  const [specs] = await db.execute('SELECT id,label,value FROM product_specs WHERE product_id = ? ORDER BY id ASC', [req.params.id]);
  res.json({ product: { ...toVendorProduct(rows[0], vendor.default_share_percent), description: rows[0].description || '', specs } });
};

// Product images are currently referenced by URL only — there is no upload
// pipeline in this project yet (see the final report / PROJECT_NOTES.md).
// This validates what a vendor supplies instead of storing it blindly:
// site-relative paths and http(s) URLs only, which keeps javascript: and
// data: URLs out of customer-facing product pages. When a real
// Cloudinary/S3 upload endpoint is added it should write into this same
// image_url column, so nothing downstream needs to change.
function normalizeImageUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return { value: null };
  if (raw.length > 500) return { error: 'Image URL is too long' };
  if (raw.startsWith('/')) return { value: raw };
  if (/^https?:\/\//i.test(raw)) return { value: raw };
  return { error: 'Image URL must start with http://, https:// or /' };
}

function validateProductInput(body) {
  const { name, price, oldPrice, stock, sku } = body || {};
  if (!name || !String(name).trim()) return 'Product name is required';
  if (String(name).trim().length > 200) return 'Product name is too long';
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) return 'A valid price is required';
  if (oldPrice !== undefined && oldPrice !== null && oldPrice !== '') {
    const oldPriceNum = Number(oldPrice);
    if (!Number.isFinite(oldPriceNum) || oldPriceNum < 0) return 'Old price must be a valid non-negative number';
  }
  const stockNum = Number(stock);
  if (!Number.isInteger(stockNum) || stockNum < 0) return 'Stock quantity must be a non-negative whole number';
  if (sku !== undefined && sku !== null && String(sku).trim().length > 64) return 'SKU must be 64 characters or fewer';
  return null;
}

exports.createProduct = async (req, res) => {
  const vendor = req.vendor;
  const error = validateProductInput(req.body);
  if (error) return res.status(400).json({ message: error });
  const image = normalizeImageUrl(req.body.imageUrl);
  if (image.error) return res.status(400).json({ message: image.error });

  const { name, categoryId, price, oldPrice, stock, description, specs, isActive, sku } = req.body;
  const oldPriceNum = oldPrice === undefined || oldPrice === null || oldPrice === '' ? null : Number(oldPrice);
  const id = newProductId(vendor.id);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // vendor_share_percent is intentionally left NULL: the vendor sets their
    // retail price but never their own settlement share — it falls back to
    // vendors.default_share_percent, which only admin controls. Same rule as
    // orderController.createOrder.
    await conn.execute(
      `INSERT INTO products (id,vendor_id,category_id,name,sku,price,old_price,stock_quantity,reserved_quantity,image_url,description,is_active)
       VALUES (?,?,?,?,?,?,?,?,0,?,?,?)`,
      [
        id, vendor.id, categoryId || null, String(name).trim(), String(sku || '').trim() || null,
        Number(price), oldPriceNum, Number(stock), image.value, description || '', isActive === false ? 0 : 1,
      ],
    );
    if (Array.isArray(specs)) {
      for (const s of specs) {
        if (!s?.label || !s?.value) continue;
        await conn.execute('INSERT INTO product_specs (product_id,label,value) VALUES (?,?,?)', [id, String(s.label).trim(), String(s.value).trim()]);
      }
    }
    await conn.commit();
    res.status(201).json({ message: 'Product created successfully', productId: id });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'You already have a product with this SKU' });
    res.status(500).json({ message: 'Failed to create product' });
  } finally {
    conn.release();
  }
};

exports.updateProduct = async (req, res) => {
  const vendor = req.vendor;
  const error = validateProductInput(req.body);
  if (error) return res.status(400).json({ message: error });
  const image = normalizeImageUrl(req.body.imageUrl);
  if (image.error) return res.status(400).json({ message: image.error });

  const { name, categoryId, price, oldPrice, stock, description, specs, sku } = req.body;
  const oldPriceNum = oldPrice === undefined || oldPrice === null || oldPrice === '' ? null : Number(oldPrice);
  const stockNum = Number(stock);
  const productId = req.params.id;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.execute(
      'SELECT id, reserved_quantity FROM products WHERE id = ? AND vendor_id = ? LIMIT 1 FOR UPDATE',
      [productId, vendor.id],
    );
    if (!existing.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }
    // Physical stock can never be set below what is already committed to
    // unpaid orders, or those reservations could not be honoured.
    const reserved = Number(existing[0].reserved_quantity || 0);
    if (stockNum < reserved) {
      await conn.rollback();
      return res.status(409).json({
        message: `${reserved} unit(s) are reserved for orders awaiting payment, so stock cannot be set below ${reserved}`,
      });
    }
    await conn.execute(
      `UPDATE products SET category_id = ?, name = ?, sku = ?, price = ?, old_price = ?, stock_quantity = ?, image_url = ?, description = ?
       WHERE id = ? AND vendor_id = ?`,
      [
        categoryId || null, String(name).trim(), String(sku || '').trim() || null, Number(price), oldPriceNum,
        stockNum, image.value, description || '', productId, vendor.id,
      ],
    );
    if (Array.isArray(specs)) {
      await conn.execute('DELETE FROM product_specs WHERE product_id = ?', [productId]);
      for (const s of specs) {
        if (!s?.label || !s?.value) continue;
        await conn.execute('INSERT INTO product_specs (product_id,label,value) VALUES (?,?,?)', [productId, String(s.label).trim(), String(s.value).trim()]);
      }
    }
    await conn.commit();
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'You already have a product with this SKU' });
    res.status(500).json({ message: 'Failed to update product' });
  } finally {
    conn.release();
  }
};

exports.setProductStatus = async (req, res) => {
  const vendor = req.vendor;
  const isActive = Boolean(req.body?.isActive);
  const [result] = await db.execute('UPDATE products SET is_active = ? WHERE id = ? AND vendor_id = ?', [isActive ? 1 : 0, req.params.id, vendor.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: isActive ? 'Product activated' : 'Product deactivated' });
};

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

exports.listInventory = async (req, res) => {
  const vendor = req.vendor;
  const where = ['p.vendor_id = ?'];
  const params = [vendor.id];
  if (req.query.q) {
    where.push('(p.name LIKE ? OR p.sku LIKE ?)');
    const term = `%${String(req.query.q).trim()}%`;
    params.push(term, term);
  }
  if (req.query.stock === 'low') {
    where.push('(CAST(p.stock_quantity AS SIGNED) - CAST(p.reserved_quantity AS SIGNED)) <= ?');
    params.push(LOW_STOCK_THRESHOLD);
  }
  if (req.query.stock === 'out') {
    where.push('(CAST(p.stock_quantity AS SIGNED) - CAST(p.reserved_quantity AS SIGNED)) <= 0');
  }
  const [rows] = await db.execute(
    `SELECT p.id,p.name,p.sku,p.price,p.old_price,p.stock_quantity,p.reserved_quantity,p.image_url,
            p.category_id,c.name AS category_name,p.is_active,p.vendor_share_percent,p.created_at,p.updated_at
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${where.join(' AND ')}
     ORDER BY (CAST(p.stock_quantity AS SIGNED) - CAST(p.reserved_quantity AS SIGNED)) ASC, p.name ASC`,
    params,
  );
  res.json({
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    products: rows.map((r) => toVendorProduct(r, vendor.default_share_percent)),
  });
};

exports.updateStock = async (req, res) => {
  const vendor = req.vendor;
  const body = req.body || {};
  const hasDelta = body.adjustment !== undefined && body.adjustment !== null && body.adjustment !== '';
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // The row is re-read and locked here, and the new value is computed from
    // the stored quantity — never from a stock figure the browser sent back.
    const [rows] = await conn.execute(
      'SELECT id, stock_quantity, reserved_quantity FROM products WHERE id = ? AND vendor_id = ? LIMIT 1 FOR UPDATE',
      [req.params.id, vendor.id],
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }
    const current = Number(rows[0].stock_quantity || 0);
    const reserved = Number(rows[0].reserved_quantity || 0);

    let next;
    if (hasDelta) {
      const delta = Number(body.adjustment);
      if (!Number.isInteger(delta)) {
        await conn.rollback();
        return res.status(400).json({ message: 'Stock adjustment must be a whole number' });
      }
      next = current + delta;
    } else {
      next = Number(body.stock);
    }

    if (!Number.isInteger(next) || next < 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Stock quantity must be a non-negative whole number' });
    }
    if (next < reserved) {
      await conn.rollback();
      return res.status(409).json({
        message: `${reserved} unit(s) are reserved for orders awaiting payment, so stock cannot be set below ${reserved}`,
      });
    }

    await conn.execute('UPDATE products SET stock_quantity = ? WHERE id = ? AND vendor_id = ?', [next, req.params.id, vendor.id]);
    await conn.commit();
    res.json({
      message: 'Stock updated successfully',
      stock: next,
      reserved,
      available: Math.max(next - reserved, 0),
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to update stock' });
  } finally {
    conn.release();
  }
};

// ---------------------------------------------------------------------------
// Earnings
// ---------------------------------------------------------------------------

exports.earnings = async (req, res) => {
  const vendor = req.vendor;
  const [rows] = await db.execute(
    `SELECT status, COUNT(*) count, SUM(vendor_gross) total FROM vendor_settlements WHERE vendor_id = ? GROUP BY status`,
    [vendor.id],
  );
  const byStatus = { PENDING: 0, ELIGIBLE: 0, PROCESSING: 0, PAID: 0, HELD: 0, CANCELLED: 0 };
  const countByStatus = { PENDING: 0, ELIGIBLE: 0, PROCESSING: 0, PAID: 0, HELD: 0, CANCELLED: 0 };
  let totalGross = 0;
  for (const r of rows) {
    byStatus[r.status] = Number(r.total || 0);
    countByStatus[r.status] = Number(r.count || 0);
    // Cancelled settlements (failed payment, cancelled order) are not
    // earnings and must not inflate the vendor's lifetime total — they stay
    // visible in the byStatus breakdown for transparency only.
    if (r.status !== 'CANCELLED') totalGross += Number(r.total || 0);
  }

  // Last 6 months of settled/earned value, for the earnings trend. Grouped
  // in SQL rather than by shipping every settlement row to the browser.
  const [monthly] = await db.execute(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') period,
            SUM(vendor_gross) total,
            SUM(CASE WHEN status = 'PAID' THEN vendor_gross ELSE 0 END) paid
     FROM vendor_settlements
     WHERE vendor_id = ? AND status <> 'CANCELLED' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY period ORDER BY period ASC`,
    [vendor.id],
  );

  res.json({
    totalGross,
    byStatus,
    countByStatus,
    sharePercent: Number(vendor.default_share_percent),
    monthly: monthly.map((m) => ({ period: m.period, total: Number(m.total || 0), paid: Number(m.paid || 0) })),
  });
};

// ---------------------------------------------------------------------------
// Product image upload
// ---------------------------------------------------------------------------

// Lets the vendor UI show an upload control only when the server can actually
// honour it, instead of offering a button that fails.
exports.imageUploadStatus = async (req, res) => {
  res.json({
    available: imageService.isConfigured(),
    maxBytes: imageService.MAX_BYTES,
    acceptedTypes: imageService.ALLOWED_MIME,
  });
};

exports.uploadProductImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image file was received' });
  try {
    // vendorId comes from the authenticated session, so uploads are always
    // filed under the vendor who actually made them.
    const result = await imageService.uploadProductImage(req.file.buffer, {
      vendorId: req.vendor.id,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
    res.status(201).json({ imageUrl: result.url, publicId: result.publicId });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Image upload failed' });
  }
};
