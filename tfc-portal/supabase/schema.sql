-- ============================================================
-- TFC Client Portal — Complete Database Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. clients
-- ============================================================
CREATE TABLE clients (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  email       text NOT NULL UNIQUE,
  onboarding_complete boolean DEFAULT false,
  onboarding_data     jsonb,
  created_at  timestamptz DEFAULT now(),
  created_by  text
);

CREATE INDEX idx_clients_email ON clients (email);

-- ============================================================
-- 2. team_members
-- ============================================================
CREATE TABLE team_members (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  email       text NOT NULL UNIQUE,
  role        text DEFAULT 'editor',
  created_at  timestamptz DEFAULT now(),
  invited_by  text
);

CREATE INDEX idx_team_members_email ON team_members (email);

-- ============================================================
-- 3. team_invites
-- ============================================================
CREATE TABLE team_invites (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code        text NOT NULL UNIQUE,
  email       text NOT NULL,
  name        text NOT NULL,
  role        text DEFAULT 'editor',
  used        boolean DEFAULT false,
  invited_by  text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_team_invites_code ON team_invites (code);
CREATE INDEX idx_team_invites_email ON team_invites (email);

-- ============================================================
-- 4. kanban_cards
-- ============================================================
CREATE TABLE kanban_cards (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id       uuid NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  column_id       text NOT NULL,
  title           text NOT NULL,
  description     text,
  platform        text,
  position        integer DEFAULT 0,
  due_date        date,
  priority        text DEFAULT 'medium',
  created_by      text,
  content_style     text,
  content_type      text,
  reference_url     text,
  unedited_url      text,
  edited_video_url  text,
  assigned_editor   text,
  shoot_date        date,
  edit_deadline     date,
  publish_date      date,
  shoot_location    text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_kanban_cards_client_id ON kanban_cards (client_id);
CREATE INDEX idx_kanban_cards_column_id ON kanban_cards (column_id);

-- ============================================================
-- 5. card_comments
-- ============================================================
CREATE TABLE card_comments (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id       uuid NOT NULL REFERENCES kanban_cards (id) ON DELETE CASCADE,
  author_email  text NOT NULL,
  author_name   text,
  author_type   text,
  content       text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_card_comments_card_id ON card_comments (card_id);

-- ============================================================
-- 6. messages
-- ============================================================
CREATE TABLE messages (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id     uuid NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  sender_email  text NOT NULL,
  sender_name   text,
  sender_type   text,
  content       text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_client_id ON messages (client_id);

-- ============================================================
-- 7. notifications
-- ============================================================
CREATE TABLE notifications (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email text NOT NULL,
  recipient_type  text,
  title           text NOT NULL,
  message         text,
  link            text,
  type            text,
  read            boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_recipient_email ON notifications (recipient_email);
CREATE INDEX idx_notifications_read ON notifications (read);

-- ============================================================
-- 8. resources
-- ============================================================
CREATE TABLE resources (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   uuid NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  name        text NOT NULL,
  type        text,
  url         text,
  file_path   text,
  category    text,
  description text,
  uploaded_by text,
  file_size   bigint,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_resources_client_id ON resources (client_id);

-- ============================================================
-- 9. invoices
-- ============================================================
CREATE TABLE invoices (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id           uuid NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  title               text NOT NULL,
  amount              decimal NOT NULL,
  currency            text DEFAULT 'USD',
  due_date            date,
  description         text,
  status              text DEFAULT 'pending',
  stripe_invoice_id   text,
  stripe_payment_url  text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_invoices_client_id ON invoices (client_id);
CREATE INDEX idx_invoices_status ON invoices (status);

-- ============================================================
-- 10. activity_log
-- ============================================================
CREATE TABLE activity_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   uuid NOT NULL REFERENCES clients (id) ON DELETE CASCADE,
  actor_email text,
  actor_name  text,
  actor_type  text,
  action      text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_activity_log_client_id ON activity_log (client_id);
CREATE INDEX idx_activity_log_created_at ON activity_log (created_at);

-- ============================================================
-- Row Level Security
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users (to be tightened later)
CREATE POLICY "Authenticated users can read clients"
  ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read team_members"
  ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert team_members"
  ON team_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update team_members"
  ON team_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete team_members"
  ON team_members FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read team_invites"
  ON team_invites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert team_invites"
  ON team_invites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update team_invites"
  ON team_invites FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete team_invites"
  ON team_invites FOR DELETE TO authenticated USING (true);

-- Allow anonymous access to team_invites for invite validation/acceptance
CREATE POLICY "Anyone can read team_invites by code"
  ON team_invites FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can update team_invites"
  ON team_invites FOR UPDATE TO anon USING (true) WITH CHECK (true);
-- Allow anonymous insert into team_members (for invite acceptance)
CREATE POLICY "Anyone can insert team_members via invite"
  ON team_members FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Authenticated users can read kanban_cards"
  ON kanban_cards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert kanban_cards"
  ON kanban_cards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update kanban_cards"
  ON kanban_cards FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete kanban_cards"
  ON kanban_cards FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read card_comments"
  ON card_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert card_comments"
  ON card_comments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read messages"
  ON messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert messages"
  ON messages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read notifications"
  ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update notifications"
  ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read resources"
  ON resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert resources"
  ON resources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete resources"
  ON resources FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read invoices"
  ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert invoices"
  ON invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update invoices"
  ON invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read activity_log"
  ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert activity_log"
  ON activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- Migration: Add new Notion-style fields to kanban_cards
-- ============================================================
-- ============================================================
-- Migration: Add Google Drive OAuth token storage to clients
-- ============================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_drive_token jsonb;

ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS content_style text;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS content_type text;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS reference_url text;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS unedited_url text;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS edited_video_url text;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS assigned_editor text;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS shoot_date date;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS edit_deadline date;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS publish_date date;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS shoot_location text;
