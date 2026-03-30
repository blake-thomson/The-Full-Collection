-- ============================================================
-- Migration 016: Make card_id nullable on scheduled_posts
-- Synced external content (from Instagram, YouTube, TikTok) doesn't
-- have a kanban card — it goes straight to analytics.
-- ============================================================

ALTER TABLE scheduled_posts ALTER COLUMN card_id DROP NOT NULL;
