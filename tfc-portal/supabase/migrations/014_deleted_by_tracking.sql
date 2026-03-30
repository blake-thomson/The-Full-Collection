-- Track who deleted items in soft-delete tables
-- Stores the email of the user who performed the deletion

ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS deleted_by text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS deleted_by text;

-- Add to team-level tables too
ALTER TABLE team_conversations ADD COLUMN IF NOT EXISTS deleted_by text;
ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS deleted_by text;
ALTER TABLE client_conversations ADD COLUMN IF NOT EXISTS deleted_by text;
ALTER TABLE client_messages ADD COLUMN IF NOT EXISTS deleted_by text;
