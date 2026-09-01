-- Migration 001: additional indexes for query patterns not covered by the
-- base schema.sql (which only indexes user_id/vendor_id combos).
-- Safe to run against an existing database: only adds indexes, never drops
-- or alters columns, and never touches data.
--
-- Run this once, after schema.sql, against your TiDB Cloud database:
--   mysql --host ... --port 4000 -u ... -p your_db < 001_add_status_and_fk_indexes.sql
--
-- TiDB supports "CREATE INDEX IF NOT EXISTS", so this is safe to re-run.

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_vendor_orders_order_id ON vendor_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_vendor_orders_status ON vendor_orders(status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_order_id ON order_items(vendor_order_id);

CREATE INDEX IF NOT EXISTS idx_delivery_quotes_status ON delivery_quotes(status);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);

CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
