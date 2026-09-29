-- Migration 006: Paystack payment provider support.
--
-- Existing databases may already have the additive payment fields from the
-- previous payment migration. Fresh databases need the same fields, so this
-- migration safely adds them when absent.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_reference VARCHAR(64) NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_id VARCHAR(160) NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_url VARCHAR(500) NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(8) NOT NULL DEFAULT 'GHS';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMP NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(255) NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_metadata JSON NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_client_reference ON payments(client_reference);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_id ON payments(checkout_id);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT UNSIGNED NULL,
  provider VARCHAR(40) NOT NULL,
  checkout_id VARCHAR(160) NULL,
  client_reference VARCHAR(64) NULL,
  reported_status VARCHAR(40) NULL,
  reported_amount DECIMAL(12,2) NULL,
  outcome VARCHAR(40) NOT NULL,
  detail VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_checkout ON payment_webhook_events(checkout_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment ON payment_webhook_events(payment_id);
