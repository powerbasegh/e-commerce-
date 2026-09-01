const db = require('../config/db');

function normalizeBoolean(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

exports.listMine = async (req, res) => {
  const [rows] = await db.execute(
    `SELECT id, label, full_address, city, area, landmark, delivery_instructions,
            latitude, longitude, is_default, created_at
     FROM addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, created_at DESC`,
    [req.user.id],
  );
  res.json({ addresses: rows });
};

exports.create = async (req, res) => {
  const userId = req.user.id;
  const { label, full_address, city, area, landmark, delivery_instructions, latitude, longitude, is_default } = req.body || {};
  if (!full_address || !city || !area) {
    return res.status(400).json({ message: 'Full address, city and area are required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const makeDefault = normalizeBoolean(is_default);
    if (makeDefault) {
      await conn.execute('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
    }
    const [result] = await conn.execute(
      `INSERT INTO addresses
        (user_id, label, full_address, city, area, landmark, delivery_instructions, latitude, longitude, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, label || 'Home', full_address, city, area, landmark || '', delivery_instructions || '', latitude ?? null, longitude ?? null, makeDefault],
    );
    await conn.commit();
    res.status(201).json({ message: 'Address created successfully', addressId: result.insertId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to create address' });
  } finally {
    conn.release();
  }
};

exports.update = async (req, res) => {
  const userId = req.user.id;
  const addressId = Number(req.params.id);
  if (!Number.isInteger(addressId) || addressId < 1) return res.status(400).json({ message: 'Invalid address ID' });

  const { label, full_address, city, area, landmark, delivery_instructions, latitude, longitude, is_default } = req.body || {};
  if (!full_address || !city || !area) {
    return res.status(400).json({ message: 'Full address, city and area are required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.execute('SELECT id FROM addresses WHERE id = ? AND user_id = ? LIMIT 1', [addressId, userId]);
    if (!existing.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Address not found' });
    }

    const makeDefault = normalizeBoolean(is_default);
    if (makeDefault) {
      await conn.execute('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
    }
    await conn.execute(
      `UPDATE addresses
       SET label = ?, full_address = ?, city = ?, area = ?, landmark = ?,
           delivery_instructions = ?, latitude = ?, longitude = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      [label || 'Home', full_address, city, area, landmark || '', delivery_instructions || '', latitude ?? null, longitude ?? null, makeDefault, addressId, userId],
    );
    await conn.commit();
    res.json({ message: 'Address updated successfully' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to update address' });
  } finally {
    conn.release();
  }
};

exports.setDefault = async (req, res) => {
  const userId = req.user.id;
  const addressId = Number(req.params.id);
  if (!Number.isInteger(addressId) || addressId < 1) return res.status(400).json({ message: 'Invalid address ID' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.execute('SELECT id FROM addresses WHERE id = ? AND user_id = ? LIMIT 1', [addressId, userId]);
    if (!existing.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Address not found' });
    }
    await conn.execute('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
    await conn.execute('UPDATE addresses SET is_default = TRUE WHERE id = ? AND user_id = ?', [addressId, userId]);
    await conn.commit();
    res.json({ message: 'Default address updated successfully' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to set default address' });
  } finally {
    conn.release();
  }
};

exports.remove = async (req, res) => {
  const addressId = Number(req.params.id);
  if (!Number.isInteger(addressId) || addressId < 1) return res.status(400).json({ message: 'Invalid address ID' });
  const [result] = await db.execute('DELETE FROM addresses WHERE id = ? AND user_id = ?', [addressId, req.user.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Address not found' });
  res.json({ message: 'Address deleted successfully' });
};
