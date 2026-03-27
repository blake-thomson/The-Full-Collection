-- Migration 004: Client profile fields
-- Adds bio, avatar_url, industry, and profile_complete to clients

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS profile_complete boolean DEFAULT false;
