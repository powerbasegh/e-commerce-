const db = require('../config/db');

// ---------------------------------------------------------------------------
// Public product catalog
// ---------------------------------------------------------------------------
// The database already has products/categories/vendors tables and seed data
// (see schema/schema.sql, schema/seed.sql) — order creation already reads
// from `products` — but no route ever exposed them for browsing. That's the
// gap that stopped a real customer interface from being possible without
// fake frontend data. This controller is additive: it only ever SELECTs,
// never touches order/vendor/settlement logic, and it deliberately never
// selects vendor_id, vendor_share_percent, or anything else that would
// identify or expose a vendor to a customer (see PROJECT_NOTES.md /
// orderController.getMine for the same rule applied to orders).
//
// No ratings/reviews table exists, so none is selected or returned here —
// the frontend must not invent one.
// ---------------------------------------------------------------------------

const SORTS = {
  newest: 'p.created_at DESC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  name_asc: 'p.name ASC',
};

function toPublicProduct(row) {
  const price = Number(row.price);
  const oldPrice = row.old_price == null ? null : Number(row.old_price);
  return {
    id: row.id,
    name: row.name,
    price,
    oldPrice,
    discountPercent: oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null,
    stock: row.stock_quantity,
    image: row.image_url || '/products/placeholder.svg',
    description: row.description || '',
    category: row.category_id ? { id: row.category_id, name: row.category_name } : null,
    createdAt: row.created_at,
  };
}

exports.list = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 24));
  const offset = (page - 1) * limit;
  const sort = SORTS[req.query.sort] ? req.query.sort : 'newest';

  const where = ['p.is_active = 1'];
  const params = [];

  if (req.query.category) {
    where.push('p.category_id = ?');
    params.push(String(req.query.category));
  }
  if (req.query.q) {
    where.push('(p.name LIKE ? OR p.description LIKE ?)');
    const term = `%${String(req.query.q).trim()}%`;
    params.push(term, term);
  }
  if (req.query.maxPrice) {
    where.push('p.price <= ?');
    params.push(Number(req.query.maxPrice));
  }
  if (req.query.minPrice) {
    where.push('p.price >= ?');
    params.push(Number(req.query.minPrice));
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await db.execute(
    `SELECT p.id,p.name,p.price,p.old_price,p.stock_quantity,p.image_url,p.description,p.category_id,c.name AS category_name,p.created_at
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ${whereSql}
     ORDER BY ${SORTS[sort]}
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM products p ${whereSql}`,
    params,
  );

  res.json({
    products: rows.map(toPublicProduct),
    pagination: {
      page,
      limit,
      total: Number(countRows[0].total),
      totalPages: Math.max(1, Math.ceil(Number(countRows[0].total) / limit)),
    },
  });
};

exports.getById = async (req, res) => {
  const [rows] = await db.execute(
    `SELECT p.id,p.name,p.price,p.old_price,p.stock_quantity,p.image_url,p.description,p.category_id,c.name AS category_name,p.created_at
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ? AND p.is_active = 1
     LIMIT 1`,
    [req.params.id],
  );
  if (!rows.length) return res.status(404).json({ message: 'Product not found' });

  const [specs] = await db.execute(
    'SELECT label, value FROM product_specs WHERE product_id = ? ORDER BY id ASC',
    [req.params.id],
  );

  res.json({ product: { ...toPublicProduct(rows[0]), specs } });
};

exports.listCategories = async (req, res) => {
  const [rows] = await db.execute(
    `SELECT c.id, c.name, COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
     GROUP BY c.id, c.name
     ORDER BY c.name ASC`,
  );
  res.json({ categories: rows.map((r) => ({ id: r.id, name: r.name, productCount: Number(r.product_count) })) });
};
