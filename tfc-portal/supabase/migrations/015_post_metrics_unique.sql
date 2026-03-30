-- ============================================================
-- Migration 015: Add unique constraint on post_metrics.scheduled_post_id
-- Enables upsert when pulling metrics daily so we update existing
-- rows instead of creating duplicates.
-- ============================================================

-- Remove any duplicate rows first (keep the most recent per scheduled_post_id)
DELETE FROM post_metrics a
USING post_metrics b
WHERE a.scheduled_post_id = b.scheduled_post_id
  AND a.pulled_at < b.pulled_at;

-- Add unique constraint
ALTER TABLE post_metrics
  ADD CONSTRAINT post_metrics_scheduled_post_unique UNIQUE (scheduled_post_id);
