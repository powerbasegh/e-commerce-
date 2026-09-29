// Creates (or resets the password of) a small set of demo login accounts so
// you can actually sign in to each side of PowerBase locally: there is no
// public sign-up for VENDOR or ADMIN (POST /api/auth/register always
// creates a CUSTOMER — see server/src/controllers/authController.js), and
// schema/seed.sql's vendor rows were never linked to a users row, so none of
// them can log in as shipped. This script fixes that without touching
// anything else seed.sql already put in the database.
//
// Usage (from server/):
//   node scripts/seedDemoAccounts.js
//
// Safe to re-run: it upserts by email, so running it again just resets
// these three accounts' passwords back to the ones printed below rather than
// creating duplicates or erroring.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

const PASSWORD = 'Demo12345!';

const ACCOUNTS = [
  { fullName: 'PowerBase Admin', email: 'admin@demo.powerbase.test', role: 'ADMIN' },
  { fullName: 'TechNova Vendor', email: 'vendor@demo.powerbase.test', role: 'VENDOR' },
  { fullName: 'Demo Customer', email: 'customer@demo.powerbase.test', role: 'CUSTOMER' },
];

async function upsertUser({ fullName, email, role }) {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const [existing] = await db.execute('SELECT id FROM users WHERE email=? LIMIT 1', [email]);
  if (existing.length) {
    const id = existing[0].id;
    await db.execute('UPDATE users SET full_name=?, password_hash=?, role=?, is_active=1 WHERE id=?', [fullName, passwordHash, role, id]);
    return id;
  }
  const [result] = await db.execute(
    'INSERT INTO users (full_name,email,phone,password_hash,role) VALUES (?,?,?,?,?)',
    [fullName, email, '0200000000', passwordHash, role],
  );
  return result.insertId;
}

async function linkVendorRecord(userId) {
  // schema/seed.sql's vendor id 1 ("TechNova Store") already has products,
  // categories and a rating — linking the demo vendor account to it means
  // logging in immediately shows a populated dashboard instead of an empty
  // one. If that row is already linked to a different user (e.g. you've run
  // this before against a database that also had real signups), this backs
  // off rather than stealing it.
  const [rows] = await db.execute('SELECT id,user_id FROM vendors WHERE id=1 LIMIT 1');
  if (!rows.length) {
    console.log('  (no vendor id=1 found — run schema/seed.sql first if you want seeded products attached)');
    return;
  }
  if (rows[0].user_id && rows[0].user_id !== userId) {
    console.log(`  (vendors.id=1 already linked to a different user_id=${rows[0].user_id} — left as-is)`);
    return;
  }
  await db.execute('UPDATE vendors SET user_id=?, is_active=1, verified=1 WHERE id=1', [userId]);
}

(async () => {
  console.log('Seeding demo accounts...\n');
  for (const account of ACCOUNTS) {
    const id = await upsertUser(account);
    if (account.role === 'VENDOR') await linkVendorRecord(id);
    console.log(`  ${account.role.padEnd(8)} ${account.email}`);
  }
  console.log(`\nPassword for all three: ${PASSWORD}`);
  console.log('Change or remove these before deploying anywhere real.');
  await db.end();
  process.exit(0);
})().catch((e) => {
  console.error('Failed to seed demo accounts:', e);
  process.exit(1);
});
