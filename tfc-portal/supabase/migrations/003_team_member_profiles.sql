-- Migration 003: Team member profile fields
-- Adds bio and avatar_url to team_members

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text;
