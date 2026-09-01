const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

exports.register = async (req, res) => {
  const { fullName, email, phone = '', password } = req.body || {};
  if (!fullName || !email || !password || password.length < 8) return res.status(400).json({ message: 'Full name, email and a password of at least 8 characters are required' });
  const normalized = String(email).trim().toLowerCase();
  const [existing] = await db.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [normalized]);
  if (existing.length) return res.status(409).json({ message: 'An account with this email already exists' });
  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await db.execute('INSERT INTO users (full_name,email,phone,password_hash,role) VALUES (?,?,?,?,\'CUSTOMER\')', [String(fullName).trim(), normalized, String(phone).trim(), passwordHash]);
  const user = { id: result.insertId, fullName: String(fullName).trim(), email: normalized, phone: String(phone).trim(), role: 'CUSTOMER' };
  res.status(201).json({ user, token: sign({ id: user.id, email: user.email, role: user.role }) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  const normalized = String(email || '').trim().toLowerCase();
  const [rows] = await db.execute('SELECT id,full_name,email,phone,password_hash,role,is_active FROM users WHERE email = ? LIMIT 1', [normalized]);
  const user = rows[0];
  if (!user || !user.is_active || !(await bcrypt.compare(String(password || ''), user.password_hash))) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone, role: user.role }, token: sign(user) });
};

exports.profile = async (req, res) => {
  const [rows] = await db.execute('SELECT id,full_name,email,phone,avatar_url,role,created_at,updated_at FROM users WHERE id = ? LIMIT 1', [req.user.id]);
  if (!rows.length) return res.status(404).json({ message: 'User not found' });
  const u = rows[0];
  res.json({ user: { id: u.id, fullName: u.full_name, email: u.email, phone: u.phone, avatar: u.avatar_url, role: u.role, createdAt: u.created_at, updatedAt: u.updated_at } });
};
