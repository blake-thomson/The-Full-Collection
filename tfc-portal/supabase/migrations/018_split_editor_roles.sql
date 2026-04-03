-- Split the single "editor" role into "youtube_editor" and "short_form_editor"

ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_role_check CHECK (role IN ('owner', 'admin', 'project_manager', 'youtube_editor', 'short_form_editor', 'videographer', 'social_media_manager', 'smm'));

ALTER TABLE team_invites DROP CONSTRAINT IF EXISTS team_invites_role_check;
ALTER TABLE team_invites ADD CONSTRAINT team_invites_role_check CHECK (role IN ('owner', 'admin', 'project_manager', 'youtube_editor', 'short_form_editor', 'videographer', 'social_media_manager', 'smm'));

-- Update any existing team members with role 'editor' to 'short_form_editor' as default
UPDATE team_members SET role = 'short_form_editor' WHERE role = 'editor';
UPDATE team_invites SET role = 'short_form_editor' WHERE role = 'editor';
