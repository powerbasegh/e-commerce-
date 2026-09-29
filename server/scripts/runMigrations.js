// Loads schema.sql, every migration in order, and seed.sql into whatever
// database server/.env points at. Exists so you don't have to copy-paste
// seven files one by one into a web SQL console.
//
// Usage (from server/):
//   node scripts/runMigrations.js
//
// Safe to re-run: schema.sql and the migrations all use IF NOT EXISTS /
// additive patterns, and seed.sql uses INSERT IGNORE — running this again
// against a database that already has everything loaded just does nothing
// on the parts that already exist.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const SCHEMA_DIR = path.join(__dirname, '../src/schema');

async function run() {
  const ssl = String(process.env.DB_SSL).toLowerCase() === 'true'
    ? { rejectUnauthorized: true, ca: process.env.DB_CA_CERT || undefined }
    : undefined;

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl,
    multipleStatements: true, // only for this one-off script, never the app's own pool
  });

  console.log(`Connected to ${process.env.DB_HOST}:${process.env.DB_PORT || 4000}/${process.env.DB_NAME}\n`);

  const files = [
    'schema.sql',
    ...fs.readdirSync(path.join(SCHEMA_DIR, 'migrations')).filter((f) => f.endsWith('.sql')).sort().map((f) => path.join('migrations', f)),
    'seed.sql',
  ];

  for (const relPath of files) {
    const fullPath = path.join(SCHEMA_DIR, relPath);
    const sql = fs.readFileSync(fullPath, 'utf8');
    process.stdout.write(`Running ${relPath} ... `);
    try {
      await conn.query(sql);
      console.log('done');
    } catch (e) {
      console.log('FAILED');
      console.error(`\n${relPath} failed:`, e.message);
      await conn.end();
      process.exit(1);
    }
  }

  console.log('\nAll schema files applied successfully.');
  await conn.end();
}

run().catch((e) => {
  console.error('Could not run migrations:', e);
  process.exit(1);
});
