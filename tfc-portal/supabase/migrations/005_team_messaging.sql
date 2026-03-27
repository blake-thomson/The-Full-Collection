-- Team Conversations (channels, DMs, group chats)
CREATE TABLE IF NOT EXISTS team_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  type text NOT NULL CHECK (type IN ('channel', 'dm', 'group')),
  description text,
  created_by text REFERENCES team_members(email) ON DELETE SET NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Conversation membership
CREATE TABLE IF NOT EXISTS team_conversation_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES team_conversations(id) ON DELETE CASCADE,
  member_email text REFERENCES team_members(email) ON DELETE CASCADE,
  last_read_at timestamptz DEFAULT now(),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, member_email)
);

-- Messages
CREATE TABLE IF NOT EXISTS team_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES team_conversations(id) ON DELETE CASCADE,
  sender_email text REFERENCES team_members(email) ON DELETE SET NULL,
  content text NOT NULL,
  reply_to_id uuid REFERENCES team_messages(id) ON DELETE SET NULL,
  edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_conv_members_email ON team_conversation_members(member_email);
CREATE INDEX IF NOT EXISTS idx_team_conv_members_conv ON team_conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_conv ON team_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created ON team_messages(created_at);

-- RLS
ALTER TABLE team_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;

-- Team members can view conversations they're in
CREATE POLICY "team_conversations_select" ON team_conversations
  FOR SELECT USING (is_team_member());

CREATE POLICY "team_conversations_insert" ON team_conversations
  FOR INSERT WITH CHECK (is_team_member());

CREATE POLICY "team_conversations_update" ON team_conversations
  FOR UPDATE USING (is_team_member());

-- Conversation members
CREATE POLICY "team_conv_members_select" ON team_conversation_members
  FOR SELECT USING (is_team_member());

CREATE POLICY "team_conv_members_insert" ON team_conversation_members
  FOR INSERT WITH CHECK (is_team_member());

CREATE POLICY "team_conv_members_delete" ON team_conversation_members
  FOR DELETE USING (is_team_member());

-- Messages
CREATE POLICY "team_messages_select" ON team_messages
  FOR SELECT USING (is_team_member());

CREATE POLICY "team_messages_insert" ON team_messages
  FOR INSERT WITH CHECK (is_team_member());

CREATE POLICY "team_messages_update" ON team_messages
  FOR UPDATE USING (sender_email = current_setting('request.jwt.claims', true)::json->>'email' OR is_team_member());

CREATE POLICY "team_messages_delete" ON team_messages
  FOR DELETE USING (sender_email = current_setting('request.jwt.claims', true)::json->>'email' OR is_team_member());

-- Seed default #general channel
INSERT INTO team_conversations (name, type, description, is_default)
VALUES ('general', 'channel', 'Company-wide announcements and updates', true)
ON CONFLICT DO NOTHING;
