-- Migration 003: vendor profile contact fields + indexes for the new
-- vendor/admin management endpoints (vendorController.js, adminController.js
-- vendor/customer/product listing and search).
--
-- Additive only: adds columns/indexes, never drops or alters existing ones,
-- never touches existing data. Safe to re-run against an existing database.
--
-- Run this once, after 001 and 002, against your TiDB Cloud database:
--   mysql --host ... --port 4000 -u ... -p your_db < 003_vendor_profile_and_admin_indexes.sql

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_email VARCHAR(190) NULL;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(40) NULL;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS description VARCHAR(1000) NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_verified ON vendors(verified);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
