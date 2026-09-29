-- Migration 009: notification query indexes.
-- Safe to run repeatedly; does not alter or delete existing notification data.

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created
  ON notifications(user_id, is_read, created_at);
