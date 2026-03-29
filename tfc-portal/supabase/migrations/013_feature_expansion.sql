-- ============================================================
-- Migration 013: Feature Expansion — Phase 1-4
-- Card attachments, approval flow, social publishing,
-- analytics, reports, research, time tracking, workflows,
-- permissions
-- ============================================================

-- ── Kanban card enhancements ─────────────────────────────────
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS caption text;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS approval_status text
  CHECK (approval_status IN ('pending', 'approved', 'revisions_requested')) DEFAULT 'pending';
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS approved_by text;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS revision_notes text;

-- ── Card comments enhancements (table exists, add missing cols) ──
ALTER TABLE card_comments ADD COLUMN IF NOT EXISTS timestamp_seconds integer;
ALTER TABLE card_comments ADD COLUMN IF NOT EXISTS resolved boolean DEFAULT false;

-- ── Card attachments — Drive file references only ────────────
CREATE TABLE IF NOT EXISTS public.card_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  linked_by text NOT NULL,
  linked_by_name text NOT NULL,
  linked_by_type text CHECK (linked_by_type IN ('team', 'client')),
  drive_file_id text NOT NULL,
  drive_file_name text NOT NULL,
  drive_mime_type text NOT NULL,
  drive_view_link text NOT NULL,
  drive_thumbnail_link text,
  drive_web_content_link text,
  drive_modified_time timestamptz,
  file_size bigint,
  version integer DEFAULT 1,
  is_final boolean DEFAULT false,
  label text CHECK (label IN ('raw_footage', 'edited_cut', 'thumbnail', 'caption_file', 'other')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_attachments_card ON card_attachments(card_id);

-- ── Card version history ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.card_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  attachment_id uuid REFERENCES card_attachments(id),
  version_number integer NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ── Social accounts per client ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'linkedin')),
  account_name text,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  platform_user_id text,
  connected boolean DEFAULT true,
  connected_at timestamptz DEFAULT now(),
  UNIQUE(client_id, platform)
);

-- ── Scheduled posts ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  caption text,
  hashtags text[],
  attachment_id uuid REFERENCES card_attachments(id),
  status text CHECK (status IN ('scheduled', 'posted', 'failed', 'cancelled')) DEFAULT 'scheduled',
  platform_post_id text,
  posted_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_card ON scheduled_posts(card_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_client ON scheduled_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);

-- ── Post metrics ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_post_id uuid REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform text NOT NULL,
  pulled_at timestamptz DEFAULT now(),
  views bigint DEFAULT 0,
  likes bigint DEFAULT 0,
  comments bigint DEFAULT 0,
  shares bigint DEFAULT 0,
  saves bigint DEFAULT 0,
  reach bigint DEFAULT 0,
  impressions bigint DEFAULT 0,
  follower_growth integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_post_metrics_post ON post_metrics(scheduled_post_id);
CREATE INDEX IF NOT EXISTS idx_post_metrics_client ON post_metrics(client_id);

-- ── Analytics rollup cache ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_analytics_rollup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month date NOT NULL,
  platform text NOT NULL,
  total_posts integer DEFAULT 0,
  total_views bigint DEFAULT 0,
  total_likes bigint DEFAULT 0,
  total_shares bigint DEFAULT 0,
  avg_engagement_rate numeric(5,2),
  top_post_id uuid REFERENCES scheduled_posts(id),
  follower_count_end integer,
  follower_growth integer,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, month, platform)
);

-- ── Client reports ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month date NOT NULL,
  generated_at timestamptz DEFAULT now(),
  pdf_storage_path text,
  sent_at timestamptz,
  sent_to text,
  metrics_snapshot jsonb,
  UNIQUE(client_id, month)
);

-- ── Research items ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.research_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_by text NOT NULL,
  client_id uuid REFERENCES clients(id),
  url text,
  title text,
  notes text,
  type text CHECK (type IN ('competitor_content', 'trending_audio', 'viral_format', 'reference_video', 'other')),
  platform text,
  tags text[],
  content_pillars text[],
  og_image text,
  og_title text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_client ON research_items(client_id);
CREATE INDEX IF NOT EXISTS idx_research_type ON research_items(type);

-- ── Time tracking ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
  team_member_email text NOT NULL,
  team_member_name text NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  duration_seconds integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_card ON time_entries(card_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_member ON time_entries(team_member_email);

-- ── Workflow triggers ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  trigger_column text NOT NULL,
  conditions jsonb DEFAULT '{}',
  actions jsonb NOT NULL,
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- Seed default workflow triggers
INSERT INTO workflow_triggers (name, trigger_column, actions) VALUES
  ('Notify client when ready for review', 'ready_review', '[{"type":"send_in_app_notification","to":"client","message":"New content is ready for your review"}]'::jsonb),
  ('Notify team when client approves', 'approved', '[{"type":"send_in_app_notification","to":"team","message":"Client has approved the content"}]'::jsonb)
ON CONFLICT DO NOTHING;

-- ── Role permissions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission text NOT NULL,
  granted boolean DEFAULT false,
  UNIQUE(role, permission)
);

-- Seed default permissions
INSERT INTO role_permissions (role, permission, granted) VALUES
  -- Owner gets everything
  ('owner', 'view_billing', true), ('owner', 'edit_billing', true),
  ('owner', 'delete_cards', true), ('owner', 'create_cards', true),
  ('owner', 'move_cards', true), ('owner', 'message_clients_directly', true),
  ('owner', 'view_all_clients', true), ('owner', 'manage_team', true),
  ('owner', 'view_analytics', true), ('owner', 'export_reports', true),
  ('owner', 'manage_triggers', true), ('owner', 'manage_social_accounts', true),
  ('owner', 'view_time_tracking', true), ('owner', 'edit_time_tracking', true),
  ('owner', 'access_research_tab', true),
  -- Admin
  ('admin', 'view_billing', true), ('admin', 'delete_cards', true),
  ('admin', 'create_cards', true), ('admin', 'move_cards', true),
  ('admin', 'message_clients_directly', true), ('admin', 'view_all_clients', true),
  ('admin', 'manage_team', true), ('admin', 'view_analytics', true),
  ('admin', 'export_reports', true), ('admin', 'manage_triggers', true),
  ('admin', 'manage_social_accounts', true), ('admin', 'view_time_tracking', true),
  ('admin', 'edit_time_tracking', true), ('admin', 'access_research_tab', true),
  -- Editor
  ('editor', 'create_cards', true), ('editor', 'move_cards', true),
  ('editor', 'view_all_clients', true), ('editor', 'edit_time_tracking', true),
  ('editor', 'view_time_tracking', true), ('editor', 'access_research_tab', true),
  -- Videographer
  ('videographer', 'create_cards', true), ('videographer', 'view_all_clients', true),
  ('videographer', 'view_time_tracking', true), ('videographer', 'access_research_tab', true),
  -- Social Media Manager
  ('social_media_manager', 'create_cards', true), ('social_media_manager', 'move_cards', true),
  ('social_media_manager', 'message_clients_directly', true), ('social_media_manager', 'view_all_clients', true),
  ('social_media_manager', 'view_analytics', true), ('social_media_manager', 'manage_social_accounts', true),
  ('social_media_manager', 'access_research_tab', true)
ON CONFLICT (role, permission) DO NOTHING;

-- ── Enable RLS on all new tables ─────────────────────────────
ALTER TABLE card_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_analytics_rollup ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
