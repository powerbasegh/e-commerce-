-- Migration 004: stock reservation model, product SKU, vendor payout details.
--
-- Additive only: adds columns and indexes, never drops or alters an existing
-- column's type, never deletes data. Safe to re-run against an existing
-- database (every statement is IF NOT EXISTS or idempotent).
--
-- Run this once, after 001-003, against your TiDB Cloud database:
--   mysql --host ... --port 4000 -u ... -p your_db < 004_stock_reservations_sku_payout.sql
--
-- ---------------------------------------------------------------------------
-- 1. Stock reservations
-- ---------------------------------------------------------------------------
-- Before this migration, orderController.createOrder permanently decremented
-- products.stock_quantity the moment an order row was written — i.e. stock was
-- deducted before PowerBase had confirmed any payment, and was never returned
-- if that payment failed or the order was cancelled.
--
-- The model after this migration:
--   products.stock_quantity    = physical stock the vendor holds
--   products.reserved_quantity = units held for orders awaiting payment
--   available to sell          = stock_quantity - reserved_quantity
--
-- Each order_items row carries its own stock_state so a reservation can be
-- committed or released for a single vendor's part of a multi-vendor order
-- without touching another vendor's items, and so commit/release are
-- idempotent (a second call finds no rows still in 'RESERVED').

ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_quantity INT UNSIGNED NOT NULL DEFAULT 0;

-- Added with DEFAULT 'COMMITTED' so that every pre-existing order_items row —
-- whose stock was already permanently deducted under the old behaviour — is
-- backfilled to the state that is actually true of it. The default is then
-- switched to 'RESERVED' for rows created from here on. This ordering is what
-- makes the migration safe to re-run: no UPDATE ever rewrites live rows.
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS stock_state ENUM('RESERVED','COMMITTED','RELEASED') NOT NULL DEFAULT 'COMMITTED';

ALTER TABLE order_items
  MODIFY COLUMN stock_state ENUM('RESERVED','COMMITTED','RELEASED') NOT NULL DEFAULT 'RESERVED';

CREATE INDEX IF NOT EXISTS idx_order_items_stock_state ON order_items(stock_state);

-- ---------------------------------------------------------------------------
-- 2. Product SKU
-- ---------------------------------------------------------------------------
-- Optional vendor-assigned stock code. Uniqueness is scoped per vendor (two
-- different vendors may legitimately use the same internal code), and NULLs
-- are allowed and not treated as duplicates by MySQL/TiDB unique indexes, so
-- existing products are unaffected.

ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(64) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_products_vendor_sku ON products(vendor_id, sku);

-- ---------------------------------------------------------------------------
-- 3. Vendor payout details
-- ---------------------------------------------------------------------------
-- Where PowerBase sends this vendor's settlement payouts. Vendor-editable
-- (vendorController.updateProfile); never exposed on any customer-facing
-- response.

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payout_method ENUM('MOMO_MTN','MOMO_TELECEL','MOMO_AT','BANK') NULL;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payout_account_name VARCHAR(160) NULL;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payout_account_number VARCHAR(64) NULL;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payout_bank_name VARCHAR(160) NULL;

-- ---------------------------------------------------------------------------
-- 4. Indexes for the vendor product list (search/filter/pagination)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_vendor_active ON products(vendor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_vendor_created ON products(vendor_id, created_at);
