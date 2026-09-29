// Unit tests for scripts/runMigrations.js. No database needed: the runner is
// driven through a small in-memory fake connection that behaves like the
// tracking table + information_schema, and records every SQL file it is asked
// to execute. Run: node tests/migrations.unit.test.js
'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runMigrations, listMigrations, baselineTables, checksum, MigrationError, TRACKING_TABLE } = require('../scripts/runMigrations');

const REAL_SCHEMA_DIR = path.join(__dirname, '../src/schema');
const silent = { log: () => {}, warn: () => {} };

// ---- fixtures --------------------------------------------------------------
function makeSchemaDir(migrations, { seed = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-mig-'));
  fs.mkdirSync(path.join(dir, 'migrations'));
  fs.writeFileSync(path.join(dir, 'schema.sql'), 'CREATE TABLE IF NOT EXISTS users (id INT);\nCREATE TABLE IF NOT EXISTS orders (id INT);\nCREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(id);\n');
  if (seed) fs.writeFileSync(path.join(dir, 'seed.sql'), 'INSERT IGNORE INTO users VALUES (1);');
  for (const [name, sql] of Object.entries(migrations)) fs.writeFileSync(path.join(dir, 'migrations', name), sql);
  return dir;
}

// tables: tables that already exist; failOn: SQL substring -> error to throw
function fakeConn({ tables = [], tracking = null, failOn = {} } = {}) {
  const state = { tables: new Set(tables), tracking: tracking ? new Map(Object.entries(tracking)) : null, executed: [], writes: 0 };
  return {
    state,
    async query(sql, params) {
      const s = sql.trim();
      if (s.startsWith('SELECT table_name')) {
        const all = [...state.tables]; if (state.tracking) all.push(TRACKING_TABLE);
        return [all.map((name) => ({ name })), []];
      }
      if (s.startsWith(`CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE}`)) { state.writes++; state.tracking = state.tracking || new Map(); return [{}, []]; }
      if (s.startsWith(`SELECT name, checksum, kind, applied_at FROM ${TRACKING_TABLE}`)) {
        return [[...state.tracking].map(([name, v]) => ({ name, ...v, applied_at: new Date('2026-01-01') })), []];
      }
      if (s.startsWith(`INSERT INTO ${TRACKING_TABLE}`)) {
        state.writes++;
        if (state.tracking.has(params[0])) throw Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY', errno: 1062 });
        state.tracking.set(params[0], { checksum: params[1], kind: params[2] });
        return [{}, []];
      }
      for (const [needle, err] of Object.entries(failOn)) if (sql.includes(needle)) throw Object.assign(new Error(err), { sqlMessage: err, code: 'ER_X', errno: 1 });
      state.writes++;
      state.executed.push(sql);
      return [{}, []];
    },
  };
}
const recorded = (c) => [...c.state.tracking.keys()];

const M = {
  '001_a.sql': 'CREATE TABLE IF NOT EXISTS a (id INT); -- m1',
  '002_b.sql': 'CREATE TABLE IF NOT EXISTS b (id INT); -- m2',
  '003_c.sql': 'CREATE TABLE IF NOT EXISTS c (id INT); -- m3',
};

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// ---- behaviour -------------------------------------------------------------
test('already-initialized DB: schema.sql is NOT executed, only adopted; migrations run in order; seed not run', async () => {
  const dir = makeSchemaDir(M);
  const conn = fakeConn({ tables: ['users', 'orders', 'payments'] });
  const out = await runMigrations({ conn, schemaDir: dir, ...silent });
  assert.deepEqual(out.adopted, ['schema.sql']);
  assert.deepEqual(out.applied, ['001_a.sql', '002_b.sql', '003_c.sql']);
  assert.ok(!conn.state.executed.some((s) => s.includes('idx_orders_user_created')), 'schema.sql must not run');
  assert.ok(!conn.state.executed.some((s) => s.includes('INSERT IGNORE')), 'seed must not run on existing DB');
  assert.deepEqual(conn.state.executed.map((s) => s.slice(-2)), ['m1', 'm2', 'm3']);
});

test('second run is a no-op: nothing executed, nothing written', async () => {
  const dir = makeSchemaDir(M);
  const conn = fakeConn({ tables: ['users', 'orders'] });
  await runMigrations({ conn, schemaDir: dir, ...silent });
  const executedBefore = conn.state.executed.length, writesBefore = conn.state.writes;
  const out = await runMigrations({ conn, schemaDir: dir, ...silent });
  assert.equal(conn.state.executed.length, executedBefore);
  assert.equal(conn.state.writes, writesBefore);
  assert.deepEqual(out.applied, []);
  assert.deepEqual(out.adopted, []);
});

test('empty DB: schema.sql first, then migrations in order, then seed exactly once; rerun is a no-op', async () => {
  const dir = makeSchemaDir(M);
  const conn = fakeConn();
  const out = await runMigrations({ conn, schemaDir: dir, ...silent });
  assert.deepEqual(out.applied, ['schema.sql', '001_a.sql', '002_b.sql', '003_c.sql', 'seed.sql']);
  assert.deepEqual(recorded(conn), out.applied);
  const n = conn.state.executed.length;
  await runMigrations({ conn, schemaDir: dir, ...silent });
  assert.equal(conn.state.executed.length, n);
});

test('partly-initialized DB is refused: nothing executed, nothing recorded, tracking table not created', async () => {
  const dir = makeSchemaDir(M);
  const conn = fakeConn({ tables: ['users'] });
  await assert.rejects(runMigrations({ conn, schemaDir: dir, ...silent }), (e) => e instanceof MigrationError && /partly initialized/.test(e.message) && /orders/.test(e.message));
  assert.equal(conn.state.executed.length, 0);
  assert.equal(conn.state.tracking, null);
});

test('DB with unrelated tables but no base tables is refused, not treated as empty', async () => {
  const conn = fakeConn({ tables: ['something_else'] });
  await assert.rejects(runMigrations({ conn, schemaDir: makeSchemaDir(M), ...silent }), MigrationError);
  assert.equal(conn.state.executed.length, 0);
});

test('failing migration: error is thrown (not swallowed), it is NOT recorded, later ones do not run; fixing it resumes correctly', async () => {
  const dir = makeSchemaDir(M);
  const conn = fakeConn({ tables: ['users', 'orders'], failOn: { 'm2': 'Boom: duplicate thing' } });
  await assert.rejects(runMigrations({ conn, schemaDir: dir, ...silent }), (e) => e instanceof MigrationError && e.file === '002_b.sql' && /Boom/.test(e.message) && /NOT recorded/.test(e.message));
  assert.deepEqual(recorded(conn), ['schema.sql', '001_a.sql']);
  assert.deepEqual(conn.state.executed.map((s) => s.slice(-2)), ['m1']);
  // Same state, failure removed (the file is fixed):
  const healed = fakeConn({ tables: ['users', 'orders'], tracking: Object.fromEntries(conn.state.tracking) });
  const out = await runMigrations({ conn: healed, schemaDir: dir, ...silent });
  assert.deepEqual(out.applied, ['002_b.sql', '003_c.sql']);
});

test('a migration added later is detected as pending and only that one runs', async () => {
  const dir = makeSchemaDir(M);
  const conn = fakeConn({ tables: ['users', 'orders'] });
  await runMigrations({ conn, schemaDir: dir, ...silent });
  fs.writeFileSync(path.join(dir, 'migrations', '004_d.sql'), 'CREATE TABLE IF NOT EXISTS d (id INT); -- m4');
  const out = await runMigrations({ conn, schemaDir: dir, ...silent });
  assert.deepEqual(out.applied, ['004_d.sql']);
});

test('--status is strictly read-only and reports pending items', async () => {
  const dir = makeSchemaDir(M);
  const conn = fakeConn({ tables: ['users', 'orders'] });
  const lines = [];
  const out = await runMigrations({ conn, schemaDir: dir, statusOnly: true, log: (l) => lines.push(l), warn: () => {} });
  assert.equal(conn.state.writes, 0);
  assert.equal(conn.state.tracking, null, 'status must not create the tracking table');
  assert.deepEqual(out.pending, ['schema.sql', '001_a.sql', '002_b.sql', '003_c.sql']);
  assert.ok(lines.some((l) => /already initialized/.test(l)));
});

test('--seed runs seed.sql on an existing DB only when explicitly requested', async () => {
  const dir = makeSchemaDir(M);
  const conn = fakeConn({ tables: ['users', 'orders'] });
  const out = await runMigrations({ conn, schemaDir: dir, seedRequested: true, ...silent });
  assert.deepEqual(out.applied.at(-1), 'seed.sql');
});

test('edited already-applied migration: warns, does not re-run it', async () => {
  const dir = makeSchemaDir(M);
  const conn = fakeConn({ tables: ['users', 'orders'] });
  await runMigrations({ conn, schemaDir: dir, ...silent });
  fs.appendFileSync(path.join(dir, 'migrations', '001_a.sql'), '\n-- edited');
  const warnings = [];
  const n = conn.state.executed.length;
  await runMigrations({ conn, schemaDir: dir, log: () => {}, warn: (w) => warnings.push(w) });
  assert.equal(conn.state.executed.length, n);
  assert.ok(warnings.some((w) => /001_a\.sql has changed/.test(w)));
});

test('checksum ignores CRLF vs LF (Windows checkout)', () => {
  assert.equal(checksum('a\r\nb\r\n'), checksum('a\nb\n'));
});

test('bad migration file names / duplicate numbers are rejected instead of silently skipped', () => {
  assert.throws(() => listMigrations(makeSchemaDir({ 'notes.sql': 'x' })), /NNN_name\.sql/);
  assert.throws(() => listMigrations(makeSchemaDir({ '001_a.sql': 'x', '001_b.sql': 'y' })), /share number/);
});

// ---- the real repository files --------------------------------------------
test('real repo: migrations are discovered in numeric order and include 008 (reviews) and 010 (delivery)', () => {
  const names = listMigrations(REAL_SCHEMA_DIR).map((m) => m.name);
  assert.deepEqual(names, [...names].sort());
  for (const must of ['001_add_status_and_fk_indexes.sql', '007_support_tickets.sql', '008_product_reviews.sql', '009_notification_indexes.sql', '010_powerbase_delivery.sql']) {
    assert.ok(names.includes(must), `${must} missing`);
  }
  assert.ok(names.indexOf('008_product_reviews.sql') < names.indexOf('010_powerbase_delivery.sql'));
});

test('real repo: baseline table list is parsed from schema.sql', () => {
  const t = baselineTables(fs.readFileSync(path.join(REAL_SCHEMA_DIR, 'schema.sql'), 'utf8'));
  for (const must of ['users', 'vendors', 'products', 'orders', 'order_items', 'notifications']) assert.ok(t.includes(must), must);
  assert.equal(t.length, 12);
});

test('real repo guard: every CREATE INDEX / ADD COLUMN in schema.sql and migrations is re-runnable (IF NOT EXISTS)', () => {
  const files = [path.join(REAL_SCHEMA_DIR, 'schema.sql'), ...listMigrations(REAL_SCHEMA_DIR).map((m) => m.fullPath)];
  const offenders = [];
  for (const f of files) {
    const sql = fs.readFileSync(f, 'utf8').replace(/--.*$/gm, '');
    for (const m of sql.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?!IF\s+NOT\s+EXISTS)\S+/gi)) offenders.push(`${path.basename(f)}: ${m[0]}`);
    for (const m of sql.matchAll(/ADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)\S+/gi)) offenders.push(`${path.basename(f)}: ${m[0]}`);
    for (const m of sql.matchAll(/\b(DROP|TRUNCATE|DELETE\s+FROM)\b/gi)) offenders.push(`${path.basename(f)}: destructive keyword ${m[0]}`);
  }
  assert.deepEqual(offenders, []);
});

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { await fn(); console.log(`  ok   ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}\n       ${e.message.split('\n').join('\n       ')}`); }
  }
  console.log(`\n${tests.length - failed}/${tests.length} passed`);
  process.exit(failed ? 1 : 0);
})();
