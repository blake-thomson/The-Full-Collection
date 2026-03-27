-- ============================================================
-- Migration 001: Proper Row Level Security + unique constraints
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Unique constraint on clients.email (prevents duplicate clients) ──────────
ALTER TABLE clients ADD CONSTRAINT clients_email_unique UNIQUE (email);

-- ── Helper functions ──────────────────────────────────────────────────────────

-- Returns true if the current auth user is a team member
CREATE OR REPLACE FUNCTION is_team_member()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members WHERE email = auth.email()
  );
$$;

-- Returns true if the current auth user owns the given client id
CREATE OR REPLACE FUNCTION owns_client(cid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM clients WHERE id = cid AND email = auth.email()
  );
$$;

-- ── Drop old wide-open policies ───────────────────────────────────────────────

-- clients
DROP POLICY IF EXISTS "Authenticated users can read clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

-- team_members
DROP POLICY IF EXISTS "Authenticated users can read team_members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can insert team_members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can update team_members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can delete team_members" ON team_members;

-- team_invites
DROP POLICY IF EXISTS "Authenticated users can read team_invites" ON team_invites;
DROP POLICY IF EXISTS "Authenticated users can insert team_invites" ON team_invites;
DROP POLICY IF EXISTS "Authenticated users can update team_invites" ON team_invites;
DROP POLICY IF EXISTS "Authenticated users can delete team_invites" ON team_invites;
DROP POLICY IF EXISTS "Anyone can read team_invites by code" ON team_invites;
DROP POLICY IF EXISTS "Anyone can update team_invites" ON team_invites;
DROP POLICY IF EXISTS "Anyone can insert team_members via invite" ON team_members;

-- kanban_cards
DROP POLICY IF EXISTS "Authenticated users can read kanban_cards" ON kanban_cards;
DROP POLICY IF EXISTS "Authenticated users can insert kanban_cards" ON kanban_cards;
DROP POLICY IF EXISTS "Authenticated users can update kanban_cards" ON kanban_cards;
DROP POLICY IF EXISTS "Authenticated users can delete kanban_cards" ON kanban_cards;

-- card_comments
DROP POLICY IF EXISTS "Authenticated users can read card_comments" ON card_comments;
DROP POLICY IF EXISTS "Authenticated users can insert card_comments" ON card_comments;

-- messages
DROP POLICY IF EXISTS "Authenticated users can read messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;
DROP POLICY IF EXISTS "Clients can delete own messages" ON messages;

-- notifications
DROP POLICY IF EXISTS "Authenticated users can read notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can update notifications" ON notifications;

-- resources
DROP POLICY IF EXISTS "Authenticated users can read resources" ON resources;
DROP POLICY IF EXISTS "Authenticated users can insert resources" ON resources;
DROP POLICY IF EXISTS "Authenticated users can delete resources" ON resources;

-- invoices
DROP POLICY IF EXISTS "Authenticated users can read invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Authenticated users can update invoices" ON invoices;

-- activity_log
DROP POLICY IF EXISTS "Authenticated users can read activity_log" ON activity_log;
DROP POLICY IF EXISTS "Authenticated users can insert activity_log" ON activity_log;

-- ── clients ───────────────────────────────────────────────────────────────────
-- Clients see only their own record. Team members see all.
CREATE POLICY "clients_select"
  ON clients FOR SELECT TO authenticated
  USING (email = auth.email() OR is_team_member());

-- Only team members can create client records (webhook uses service role, bypasses this)
CREATE POLICY "clients_insert"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (is_team_member());

-- Clients can update their own record (e.g. onboarding). Team members can update any.
CREATE POLICY "clients_update"
  ON clients FOR UPDATE TO authenticated
  USING (email = auth.email() OR is_team_member())
  WITH CHECK (email = auth.email() OR is_team_member());

-- Only team members can delete client records
CREATE POLICY "clients_delete"
  ON clients FOR DELETE TO authenticated
  USING (is_team_member());

-- ── team_members ──────────────────────────────────────────────────────────────
-- Anyone authenticated can read (needed to look up roles)
CREATE POLICY "team_members_select"
  ON team_members FOR SELECT TO authenticated
  USING (true);

-- Only existing team members can add new team members
CREATE POLICY "team_members_insert_auth"
  ON team_members FOR INSERT TO authenticated
  WITH CHECK (is_team_member());

-- Anonymous insert for invite acceptance flow
CREATE POLICY "team_members_insert_anon"
  ON team_members FOR INSERT TO anon
  WITH CHECK (true);

-- Team members can update team member records
CREATE POLICY "team_members_update"
  ON team_members FOR UPDATE TO authenticated
  USING (is_team_member())
  WITH CHECK (is_team_member());

-- Only team members can remove team members
CREATE POLICY "team_members_delete"
  ON team_members FOR DELETE TO authenticated
  USING (is_team_member());

-- ── team_invites ──────────────────────────────────────────────────────────────
-- Authenticated team members can manage invites
CREATE POLICY "team_invites_select_auth"
  ON team_invites FOR SELECT TO authenticated
  USING (is_team_member());

CREATE POLICY "team_invites_insert_auth"
  ON team_invites FOR INSERT TO authenticated
  WITH CHECK (is_team_member());

CREATE POLICY "team_invites_update_auth"
  ON team_invites FOR UPDATE TO authenticated
  USING (is_team_member())
  WITH CHECK (is_team_member());

CREATE POLICY "team_invites_delete_auth"
  ON team_invites FOR DELETE TO authenticated
  USING (is_team_member());

-- Anonymous users can read/update invites (for the accept-invite flow)
CREATE POLICY "team_invites_select_anon"
  ON team_invites FOR SELECT TO anon
  USING (true);

CREATE POLICY "team_invites_update_anon"
  ON team_invites FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

-- ── kanban_cards ──────────────────────────────────────────────────────────────
CREATE POLICY "kanban_cards_select"
  ON kanban_cards FOR SELECT TO authenticated
  USING (owns_client(client_id) OR is_team_member());

CREATE POLICY "kanban_cards_insert"
  ON kanban_cards FOR INSERT TO authenticated
  WITH CHECK (owns_client(client_id) OR is_team_member());

CREATE POLICY "kanban_cards_update"
  ON kanban_cards FOR UPDATE TO authenticated
  USING (owns_client(client_id) OR is_team_member())
  WITH CHECK (owns_client(client_id) OR is_team_member());

CREATE POLICY "kanban_cards_delete"
  ON kanban_cards FOR DELETE TO authenticated
  USING (owns_client(client_id) OR is_team_member());

-- ── card_comments ─────────────────────────────────────────────────────────────
CREATE POLICY "card_comments_select"
  ON card_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM kanban_cards k
      WHERE k.id = card_id AND (owns_client(k.client_id) OR is_team_member())
    )
  );

CREATE POLICY "card_comments_insert"
  ON card_comments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kanban_cards k
      WHERE k.id = card_id AND (owns_client(k.client_id) OR is_team_member())
    )
  );

-- ── messages ──────────────────────────────────────────────────────────────────
CREATE POLICY "messages_select"
  ON messages FOR SELECT TO authenticated
  USING (owns_client(client_id) OR is_team_member());

CREATE POLICY "messages_insert"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (owns_client(client_id) OR is_team_member());

CREATE POLICY "messages_update"
  ON messages FOR UPDATE TO authenticated
  USING (owns_client(client_id) OR is_team_member())
  WITH CHECK (owns_client(client_id) OR is_team_member());

CREATE POLICY "messages_delete"
  ON messages FOR DELETE TO authenticated
  USING (owns_client(client_id) OR is_team_member());

-- ── notifications ─────────────────────────────────────────────────────────────
-- Users only see notifications sent to their email
CREATE POLICY "notifications_select"
  ON notifications FOR SELECT TO authenticated
  USING (recipient_email = auth.email() OR is_team_member());

CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (is_team_member());

CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE TO authenticated
  USING (recipient_email = auth.email() OR is_team_member())
  WITH CHECK (recipient_email = auth.email() OR is_team_member());

-- ── resources ─────────────────────────────────────────────────────────────────
CREATE POLICY "resources_select"
  ON resources FOR SELECT TO authenticated
  USING (owns_client(client_id) OR is_team_member());

CREATE POLICY "resources_insert"
  ON resources FOR INSERT TO authenticated
  WITH CHECK (owns_client(client_id) OR is_team_member());

CREATE POLICY "resources_update"
  ON resources FOR UPDATE TO authenticated
  USING (owns_client(client_id) OR is_team_member())
  WITH CHECK (owns_client(client_id) OR is_team_member());

CREATE POLICY "resources_delete"
  ON resources FOR DELETE TO authenticated
  USING (owns_client(client_id) OR is_team_member());

-- ── invoices ──────────────────────────────────────────────────────────────────
CREATE POLICY "invoices_select"
  ON invoices FOR SELECT TO authenticated
  USING (owns_client(client_id) OR is_team_member());

CREATE POLICY "invoices_insert"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (is_team_member());

CREATE POLICY "invoices_update"
  ON invoices FOR UPDATE TO authenticated
  USING (is_team_member())
  WITH CHECK (is_team_member());

-- ── activity_log ──────────────────────────────────────────────────────────────
CREATE POLICY "activity_log_select"
  ON activity_log FOR SELECT TO authenticated
  USING (owns_client(client_id) OR is_team_member());

CREATE POLICY "activity_log_insert"
  ON activity_log FOR INSERT TO authenticated
  WITH CHECK (owns_client(client_id) OR is_team_member());
