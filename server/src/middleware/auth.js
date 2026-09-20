const jwt = require('jsonwebtoken');
const db = require('../config/db');

function authenticate(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource' });
    }
    return next();
  };
}

/**
 * Resolve the authenticated user to their vendor record and attach it as
 * req.vendor.
 *
 * This is the single place a vendor identity is established. Everything
 * downstream scopes its queries with req.vendor.id, so a vendor_id, product
 * id or order id sent by the client can never be used to reach another
 * vendor's rows.
 *
 * It also re-checks live account state on every request: a JWT stays valid
 * for days, so without this an admin deactivating a vendor (or the vendor's
 * user account) would have no effect until that token expired.
 */
async function requireActiveVendor(req, res, next) {
  const [rows] = await db.execute(
    `SELECT v.*, u.is_active AS user_is_active, u.role AS user_role
       FROM vendors v JOIN users u ON u.id = v.user_id
      WHERE v.user_id = ? LIMIT 1`,
    [req.user.id],
  );
  if (!rows.length) return res.status(404).json({ message: 'Vendor profile not found' });
  const vendor = rows[0];
  if (vendor.user_role !== 'VENDOR' || !vendor.user_is_active) {
    return res.status(403).json({ message: 'This vendor account is no longer active' });
  }
  if (!vendor.is_active) {
    return res.status(403).json({ message: 'Your vendor account has been deactivated by PowerBase. Please contact support.' });
  }
  req.vendor = vendor;
  return next();
}

module.exports = { authenticate, authorize, requireActiveVendor };
