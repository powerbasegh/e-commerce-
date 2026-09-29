// PowerBase migration runner.
//
// Usage (from server/):
//   node scripts/runMigrations.js            apply anything still pending
//   node scripts/runMigrations.js --status   read-only: show applied / pending, change nothing
//   node scripts/runMigrations.js --seed     also run seed.sql (demo data) even on an existing database
//
// How it decides what to do
// -------------------------
// Every file that has been applied is recorded in the `schema_migrations`
// table (name, sha256 checksum, when it ran). A file is only recorded AFTER
// it ran without error, and anything already recorded is skipped.
//
// schema.sql (the base schema) is treated as a one-time baseline:
//   * database has no tables at all         -> genuinely new: run schema.sql, then seed.sql once
//   * every table schema.sql creates exists -> already initialized: schema.sql is NOT executed,
//                                              it is only recorded as the baseline
//   * anything in between                   -> refuse to run and explain; nothing is guessed
//
// Numbered migrations (migrations/NNN_name.sql) then run in numeric order,
// each exactly once. SQL errors are never swallowed: the first failure stops
// the run, that file is NOT recorded, and the process exits non-zero.
//
// Nothing here ever drops, truncates or deletes anything.
//
// Note: MySQL/TiDB DDL is not transactional, so a multi-statement file that
// fails half way leaves its earlier statements applied. That is why every
// migration must be re-runnable (IF NOT EXISTS) — see the guard in
// tests/migrations.unit.test.js.

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_SCHEMA_DIR = path.join(__dirname, '../src/schema');
const TRACKING_TABLE = 'schema_migrations';
const BASELINE = 'schema.sql';
const SEED = 'seed.sql';
const MIGRATION_FILE_RE = /^(\d+)_[A-Za-z0-9_-]+\.sql$/;

class MigrationError extends Error {
  constructor(message, { file, cause } = {}) {
    super(message);
    this.name = 'MigrationError';
    this.file = file;
    this.cause = cause;
  }
}

// CRLF -> LF first so a Windows checkout and a Linux checkout hash the same.
function checksum(sql) {
  return crypto.createHash('sha256').update(sql.replace(/\r\n/g, '\n'), 'utf8').digest('hex');
}

function readSql(fullPath, name) {
  const sql = fs.readFileSync(fullPath, 'utf8');
  return { name, fullPath, sql, checksum: checksum(sql) };
}

function listMigrations(schemaDir) {
  const dir = path.join(schemaDir, 'migrations');
  const byVersion = new Map();
  for (const file of fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.sql'))) {
    const match = MIGRATION_FILE_RE.exec(file);
    if (!match) {
      throw new MigrationError(
        `Migration file "${file}" does not match the NNN_name.sql naming pattern, so its order cannot be determined. Rename it or move it out of migrations/.`,
        { file },
      );
    }
    const version = Number(match[1]);
    if (byVersion.has(version)) {
      throw new MigrationError(
        `Two migrations share number ${match[1]}: "${byVersion.get(version).name}" and "${file}". Renumber one of them.`,
        { file },
      );
    }
    byVersion.set(version, { version, ...readSql(path.join(dir, file), file) });
  }
  return [...byVersion.values()].sort((a, b) => a.version - b.version);
}

// Tables the base schema creates, read from schema.sql itself so the list can't drift.
function baselineTables(schemaSql) {
  const re = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+`?([A-Za-z0-9_]+)`?/gi;
  const tables = [];
  let m;
  while ((m = re.exec(schemaSql)) !== null) tables.push(m[1].toLowerCase());
  return tables;
}

function classifyDatabase(existingTables, expectedTables) {
  const others = [...existingTables].filter((t) => t !== TRACKING_TABLE);
  const present = expectedTables.filter((t) => existingTables.has(t));
  const missing = expectedTables.filter((t) => !existingTables.has(t));
  if (others.length === 0) return { state: 'EMPTY', present, missing };
  if (missing.length === 0) return { state: 'INITIALIZED', present, missing };
  return { state: 'PARTIAL', present, missing };
}

// Pure: decides what to do from facts already gathered. No I/O.
function buildPlan({ baseline, migrations, seed, applied, classification, seedRequested }) {
  const steps = [];
  const warnings = [];
  let freshInit = false;

  if (applied.has(BASELINE)) {
    steps.push({ name: BASELINE, kind: 'BASELINE', action: 'skip', note: 'already recorded' });
  } else if (classification.state === 'INITIALIZED') {
    steps.push({
      name: BASELINE, kind: 'BASELINE_ADOPTED', action: 'adopt', checksum: baseline.checksum,
      note: 'database already initialized - NOT executed, recorded as baseline',
    });
  } else if (classification.state === 'EMPTY') {
    freshInit = true;
    steps.push({ name: BASELINE, kind: 'BASELINE', action: 'apply', sql: baseline.sql, checksum: baseline.checksum, note: 'empty database - applying base schema' });
  } else {
    throw new MigrationError(
      `The database is only partly initialized, so it is unsafe to guess what to run.\n` +
      `  base tables present (${classification.present.length}): ${classification.present.join(', ') || '(none)'}\n` +
      `  base tables missing (${classification.missing.length}): ${classification.missing.join(', ')}\n` +
      `Nothing was executed and nothing was recorded. Inspect the database, then either restore the missing tables ` +
      `or point DB_NAME at the correct database. Do not drop anything to "fix" this.`,
      { file: BASELINE },
    );
  }

  for (const m of migrations) {
    const rec = applied.get(m.name);
    if (rec) {
      const drift = rec.checksum && rec.checksum !== m.checksum;
      if (drift) warnings.push(`${m.name} has changed on disk since it was applied on ${rec.applied_at instanceof Date ? rec.applied_at.toISOString() : rec.applied_at}. It was NOT re-run. If the change matters, add a new numbered migration.`);
      steps.push({ name: m.name, kind: 'MIGRATION', action: 'skip', note: 'already applied' });
    } else {
      steps.push({ name: m.name, kind: 'MIGRATION', action: 'apply', sql: m.sql, checksum: m.checksum, note: 'pending' });
    }
  }

  for (const name of applied.keys()) {
    if (name !== BASELINE && name !== SEED && !migrations.some((m) => m.name === name)) {
      warnings.push(`${name} is recorded as applied but no such file exists in migrations/.`);
    }
  }

  if (seedRequested && !seed) throw new MigrationError('--seed was requested but seed.sql does not exist.', { file: SEED });
  if (seed && (seedRequested || (freshInit && !applied.has(SEED)))) {
    steps.push({ name: SEED, kind: 'SEED', action: 'apply', sql: seed.sql, checksum: seed.checksum, note: freshInit ? 'new database - loading demo data once' : '--seed requested' });
  } else {
    steps.push({ name: SEED, kind: 'SEED', action: 'skip', note: applied.has(SEED) ? 'already loaded' : 'not run on an existing database (use --seed to force)' });
  }

  return { steps, warnings };
}

async function listTables(conn) {
  const [rows] = await conn.query('SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE()');
  return new Set(rows.map((r) => String(r.name).toLowerCase()));
}

async function ensureTrackingTable(conn) {
  await conn.query(
    `CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
       name VARCHAR(190) NOT NULL PRIMARY KEY,
       checksum CHAR(64) NOT NULL,
       kind VARCHAR(24) NOT NULL,
       applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       execution_ms INT UNSIGNED NULL
     )`,
  );
}

async function loadApplied(conn) {
  const [rows] = await conn.query(`SELECT name, checksum, kind, applied_at FROM ${TRACKING_TABLE}`);
  return new Map(rows.map((r) => [r.name, r]));
}

async function runMigrations({ conn, schemaDir = DEFAULT_SCHEMA_DIR, statusOnly = false, seedRequested = false, log = console.log, warn = console.warn }) {
  const baseline = readSql(path.join(schemaDir, BASELINE), BASELINE);
  const seedPath = path.join(schemaDir, SEED);
  const seed = fs.existsSync(seedPath) ? readSql(seedPath, SEED) : null;
  const migrations = listMigrations(schemaDir);

  const tables = await listTables(conn);
  const trackingExists = tables.has(TRACKING_TABLE);
  const classification = classifyDatabase(tables, baselineTables(baseline.sql));
  const applied = trackingExists ? await loadApplied(conn) : new Map();

  const { steps, warnings } = buildPlan({ baseline, migrations, seed, applied, classification, seedRequested });
  warnings.forEach((w) => warn(`WARNING: ${w}`));

  const width = Math.max(...steps.map((s) => s.name.length));
  const label = (s) => `${s.name.padEnd(width)}  `;
  const summary = { applied: [], adopted: [], skipped: [], pending: [] };

  if (statusOnly) {
    log(`Database state: ${classification.state}${trackingExists ? '' : ` (no ${TRACKING_TABLE} table yet)`}`);
    for (const s of steps) {
      if (s.action === 'apply') { summary.pending.push(s.name); log(`${label(s)}PENDING  - ${s.note}`); }
      else if (s.action === 'adopt') { summary.pending.push(s.name); log(`${label(s)}WILL ADOPT - ${s.note}`); }
      else log(`${label(s)}ok       - ${s.note}`);
    }
    log(`\n${summary.pending.length} item(s) would change. Read-only: nothing was modified.`);
    return summary;
  }

  if (!trackingExists) await ensureTrackingTable(conn);

  for (const s of steps) {
    if (s.action === 'skip') { summary.skipped.push(s.name); log(`${label(s)}skipped  - ${s.note}`); continue; }

    if (s.action === 'apply') {
      const started = Date.now();
      try {
        await conn.query(s.sql);
      } catch (cause) {
        throw new MigrationError(`${s.name} FAILED and was NOT recorded as applied: ${cause.sqlMessage || cause.message}`, { file: s.name, cause });
      }
      const ms = Date.now() - started;
      await record(conn, s, ms);
      summary.applied.push(s.name);
      log(`${label(s)}applied  (${ms} ms)`);
    } else {
      await record(conn, s, null);
      summary.adopted.push(s.name);
      log(`${label(s)}adopted  - ${s.note}`);
    }
  }

  log(`\nDone. applied: ${summary.applied.length}, adopted: ${summary.adopted.length}, already up to date: ${summary.skipped.length}.`);
  return summary;
}

async function record(conn, step, ms) {
  try {
    await conn.query(`INSERT INTO ${TRACKING_TABLE} (name, checksum, kind, execution_ms) VALUES (?, ?, ?, ?)`, [step.name, step.checksum, step.kind, ms]);
  } catch (cause) {
    throw new MigrationError(
      `${step.name} ran successfully but could not be recorded in ${TRACKING_TABLE}: ${cause.sqlMessage || cause.message}. ` +
      `Its statements are re-runnable, so running the runner again is safe.`,
      { file: step.name, cause },
    );
  }
}

function parseArgs(argv) {
  const opts = { statusOnly: false, seedRequested: false };
  for (const a of argv) {
    if (a === '--status') opts.statusOnly = true;
    else if (a === '--seed') opts.seedRequested = true;
    else throw new Error(`Unknown option "${a}". Supported: --status, --seed`);
  }
  if (opts.statusOnly && opts.seedRequested) throw new Error('--status is read-only and cannot be combined with --seed');
  return opts;
}

async function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(2); }

  require('dotenv').config();
  const missing = ['DB_HOST', 'DB_USER', 'DB_NAME'].filter((k) => !process.env[k]);
  if (missing.length) { console.error(`Missing required environment variable(s): ${missing.join(', ')} (check server/.env)`); process.exit(1); }

  const mysql = require('mysql2/promise');
  const ssl = String(process.env.DB_SSL).toLowerCase() === 'true'
    ? { rejectUnauthorized: true, ca: process.env.DB_CA_CERT || undefined }
    : undefined;

  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 4000),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl,
      multipleStatements: true, // only for this one-off script, never the app's own pool
    });
  } catch (e) {
    console.error('Could not connect to the database:', e.message);
    process.exit(1);
  }

  console.log(`Connected to ${process.env.DB_HOST}:${process.env.DB_PORT || 4000}/${process.env.DB_NAME}${opts.statusOnly ? '  [status only]' : ''}\n`);

  try {
    await runMigrations({ conn, ...opts });
  } catch (e) {
    console.error(`\n${e.message}`);
    if (e.cause) console.error(`  MySQL error ${e.cause.code || ''} (errno ${e.cause.errno ?? '?'})`);
    if (!(e instanceof MigrationError)) console.error(e.stack);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

module.exports = { runMigrations, buildPlan, listMigrations, baselineTables, classifyDatabase, checksum, MigrationError, TRACKING_TABLE };

if (require.main === module) main();
