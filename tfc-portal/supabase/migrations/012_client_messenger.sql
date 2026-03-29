-- ============================================================
-- Migration 012: Client Messenger
-- DMs and group chats between clients and team members
-- ============================================================

-- client_conversations: only DMs and groups (no channels)
CREATE TABLE IF NOT EXISTS public.client_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  type text NOT NULL CHECK (type IN ('dm', 'group')),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- members: can be client or team
CREATE TABLE IF NOT EXISTS public.client_conversation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.client_conversations(id) ON DELETE CASCADE,
  member_email text NOT NULL,
  member_name text,
  member_type text NOT NULL DEFAULT 'team' CHECK (member_type IN ('client', 'team')),
  last_read_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, member_email)
);

-- messages
CREATE TABLE IF NOT EXISTS public.client_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.client_conversations(id) ON DELETE CASCADE,
  sender_email text NOT NULL,
  sender_name text,
  sender_type text NOT NULL DEFAULT 'team' CHECK (sender_type IN ('client', 'team')),
  content text NOT NULL,
  reply_to_id uuid REFERENCES public.client_messages(id) ON DELETE SET NULL,
  edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- per-user message hiding
CREATE TABLE IF NOT EXISTS public.client_message_hides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  message_id uuid NOT NULL REFERENCES public.client_messages(id) ON DELETE CASCADE,
  hidden_at timestamptz DEFAULT now(),
  UNIQUE(user_email, message_id)
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_client_conversations_client ON public.client_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_conv_members_email ON public.client_conversation_members(member_email);
CREATE INDEX IF NOT EXISTS idx_client_conv_members_conv ON public.client_conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_conv ON public.client_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_deleted ON public.client_messages(deleted_at) WHERE deleted_at IS NOT NULL;

-- enable RLS (admin client bypasses these, but set them for safety)
ALTER TABLE public.client_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_message_hides ENABLE ROW LEVEL SECURITY;
