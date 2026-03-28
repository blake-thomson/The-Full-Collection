ALTER TABLE team_conversations ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE team_messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_team_conversations_deleted ON team_conversations(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_team_messages_deleted ON team_messages(deleted_at) WHERE deleted_at IS NOT NULL;
