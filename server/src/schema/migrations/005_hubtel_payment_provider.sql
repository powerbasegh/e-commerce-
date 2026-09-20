-- Migration 005: Hubtel payment provider support.
--
-- Additive only: adds columns/tables/indexes, never drops or alters an
-- existing column's type, never deletes data. Safe to re-run (every
-- statement is IF NOT EXISTS or idempotent).
--
-- Run this once, after 001-004, against your TiDB Cloud database:
--   mysql --host ... --port 4000 -u ... -p your_db < 005_hubtel_payment_provider.sql
--
-- ---------------------------------------------------------------------------
-- Why these columns and not others
-- ---------------------------------------------------------------------------
-- payments.provider and payments.transaction_reference already existed
-- (migration 002) and keep their existing meaning: provider stays the name
-- of whoever confirmed the payment ('HUBTEL' once this migration's code
-- lands, or an admin-entered string for a manual confirmation), and
-- transaction_reference stays "the provider's own reference for the
-- completed transaction" (Hubtel's SalesInvoiceId once PAID). Everything
-- below is genuinely new information the existing schema had no column for:
--
--   client_reference    the reference *we* generate and hand to Hubtel when
--                        initiating a checkout (Hubtel's "clientReference").
--                        This is what lets a webhook be matched back to the
--                        right payments row, and what makes re-initiating a
--                        payment for the same order idempotent.
--   checkout_id          Hubtel's own id for the checkout attempt itself
--                        (their "CheckoutId"), returned from initiation and
--                        echoed back on the callback. Distinct from
--                        transaction_reference: a checkout can exist before
--                        any transaction has succeeded.
--   currency              stored explicitly rather than assumed, per Phase 1
--                        instructions; PowerBase only operates in GHS today.
--   initiated_at          when we successfully obtained a checkout URL from
--                        Hubtel — distinct from created_at (when the
--                        payments row itself was first written, at order
--                        creation, before any provider was involved).
--   failure_reason        provider-supplied failure detail, kept short and
--                        free of anything sensitive, shown to Admin only.
--   provider_metadata     small non-secret extras from the provider response
--                        (payment channel, mobile network) for Admin's
--                        payment page. Never credentials, never full webhook
--                        bodies.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_reference VARCHAR(64) NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_id VARCHAR(160) NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_url VARCHAR(500) NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(8) NOT NULL DEFAULT 'GHS';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMP NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(255) NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_metadata JSON NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_client_reference ON payments(client_reference);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_id ON payments(checkout_id);

-- ---------------------------------------------------------------------------
-- Webhook event log — observability/audit only, NOT the idempotency
-- mechanism. Idempotency itself still comes from the same guard the existing
-- admin confirmPayment flow already used (payments.status transition checked
-- and locked inside one transaction, see paymentService.applyPaymentOutcome)
-- — this table exists so a duplicate/replayed webhook is visible after the
-- fact and every callback PowerBase received is auditable, per Phase 1K.
-- ---------------------------------------------------------------------------
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
