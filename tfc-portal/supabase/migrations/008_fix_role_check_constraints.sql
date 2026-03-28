-- Migration 008: Fix role CHECK constraints on team_invites and team_members
--
-- The existing team_invites_role_check constraint is too narrow — it rejects
-- valid roles like 'project_manager', 'videographer', and 'smm' that the
-- application uses. Drop and recreate with the full set of allowed roles.
-- Apply the same constraint to team_members for consistency.

-- ── team_invites ──
ALTER TABLE team_invites DROP CONSTRAINT IF EXISTS team_invites_role_check;
ALTER TABLE team_invites ADD CONSTRAINT team_invites_role_check
  CHECK (role IN ('owner', 'admin', 'project_manager', 'editor', 'videographer', 'social_media_manager', 'smm'));

-- ── team_members ──
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('owner', 'admin', 'project_manager', 'editor', 'videographer', 'social_media_manager', 'smm'));
