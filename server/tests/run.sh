#!/usr/bin/env bash
# Boots a scratch MySQL-compatible database, applies the schema + every
# migration in order (exactly as production would), then runs the vendor
# integration suite against the real Express app.
set -euo pipefail

cd "$(dirname "$0")/.."

export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=""
export DB_NAME=pb_test
export DB_SSL=false
export JWT_SECRET=test-secret-not-for-production
export CLIENT_URL=http://localhost:5173

mysql -h 127.0.0.1 -P 3306 -u root -e "DROP DATABASE IF EXISTS pb_test; CREATE DATABASE pb_test;"

echo "== Applying schema.sql =="
mysql -h 127.0.0.1 -P 3306 -u root pb_test < src/schema/schema.sql

echo "== Applying migrations in order =="
for f in src/schema/migrations/*.sql; do
  echo "   $f"
  mysql -h 127.0.0.1 -P 3306 -u root pb_test < "$f"
done

echo "== Re-applying every migration (idempotency check) =="
for f in src/schema/migrations/*.sql; do
  mysql -h 127.0.0.1 -P 3306 -u root pb_test < "$f"
done

echo
node tests/vendor.integration.test.js
echo
node tests/payment.integration.test.js
