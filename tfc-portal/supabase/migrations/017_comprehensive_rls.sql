-- Migration 017: Comprehensive RLS policies for all unprotected tables
-- Adds defense-in-depth policies for 16 tables that had RLS enabled but no policies
-- Tightens overly permissive policies on feature_requests, message_hides, team_members, team_invites

-- ============================================================
-- Helper: reuse is_team_member() from migration 001
-- ============================================================

-- ============================================================
-- 1. client_social_accounts — CRITICAL: contains OAuth tokens
-- ============================================================
CREATE POLICY "team_select_social_accounts" ON client_social_accounts
  FOR SELECT TO authenticated USING (is_team_member());

CREATE POLICY "team_insert_social_accounts" ON client_social_accounts
  FOR INSERT TO authenticated WITH CHECK (is_team_member());

CREATE POLICY "team_update_social_accounts" ON client_social_accounts
  FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());

CREATE POLICY "team_delete_social_accounts" ON client_social_accounts
  FOR DELETE TO authenticated USING (is_team_member());

-- ============================================================
-- 2. scheduled_posts
-- ============================================================
CREATE POLICY "team_select_scheduled_posts" ON scheduled_posts
  FOR SELECT TO authenticated
  USING (is_team_member() OR EXISTS (
    SELECT 1 FROM clients WHERE clients.id = scheduled_posts.client_id AND clients.email = auth.email()
  ));

CREATE POLICY "team_insert_scheduled_posts" ON scheduled_posts
  FOR INSERT TO authenticated WITH CHECK (is_team_member());

CREATE POLICY "team_update_scheduled_posts" ON scheduled_posts
  FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());

CREATE POLICY "team_delete_scheduled_posts" ON scheduled_posts
  FOR DELETE TO authenticated USING (is_team_member());

-- ============================================================
-- 3. post_metrics
-- ============================================================
CREATE POLICY "team_select_post_metrics" ON post_metrics
  FOR SELECT TO authenticated
  USING (is_team_member() OR EXISTS (
    SELECT 1 FROM clients WHERE clients.id = post_metrics.client_id AND clients.email = auth.email()
  ));

CREATE POLICY "team_insert_post_metrics" ON post_metrics
  FOR INSERT TO authenticated WITH CHECK (is_team_member());

CREATE POLICY "team_update_post_metrics" ON post_metrics
  FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());

-- ============================================================
-- 4. client_conversations
-- ============================================================
CREATE POLICY "access_client_conversations" ON client_conversations
  FOR SELECT TO authenticated
  USING (is_team_member() OR EXISTS (
    SELECT 1 FROM client_conversation_members
    WHERE client_conversation_members.conversation_id = client_conversations.id
    AND client_conversation_members.email = auth.email()
  ));

CREATE POLICY "insert_client_conversations" ON client_conversations
  FOR INSERT TO authenticated WITH CHECK (is_team_member() OR auth.email() IS NOT NULL);

CREATE POLICY "update_client_conversations" ON client_conversations
  FOR UPDATE TO authenticated USING (is_team_member());

CREATE POLICY "delete_client_conversations" ON client_conversations
  FOR DELETE TO authenticated USING (is_team_member());

-- ============================================================
-- 5. client_conversation_members
-- ============================================================
CREATE POLICY "access_client_conv_members" ON client_conversation_members
  FOR SELECT TO authenticated
  USING (is_team_member() OR client_conversation_members.email = auth.email());

CREATE POLICY "insert_client_conv_members" ON client_conversation_members
  FOR INSERT TO authenticated WITH CHECK (is_team_member() OR auth.email() IS NOT NULL);

CREATE POLICY "delete_client_conv_members" ON client_conversation_members
  FOR DELETE TO authenticated USING (is_team_member());

-- ============================================================
-- 6. client_messages
-- ============================================================
CREATE POLICY "select_client_messages" ON client_messages
  FOR SELECT TO authenticated
  USING (is_team_member() OR EXISTS (
    SELECT 1 FROM client_conversation_members
    WHERE client_conversation_members.conversation_id = client_messages.conversation_id
    AND client_conversation_members.email = auth.email()
  ));

CREATE POLICY "insert_client_messages" ON client_messages
  FOR INSERT TO authenticated
  WITH CHECK (is_team_member() OR EXISTS (
    SELECT 1 FROM client_conversation_members
    WHERE client_conversation_members.conversation_id = client_messages.conversation_id
    AND client_conversation_members.email = auth.email()
  ));

CREATE POLICY "update_client_messages" ON client_messages
  FOR UPDATE TO authenticated
  USING (client_messages.sender_email = auth.email() OR is_team_member());

CREATE POLICY "delete_client_messages" ON client_messages
  FOR DELETE TO authenticated USING (is_team_member());

-- ============================================================
-- 7. client_message_hides
-- ============================================================
CREATE POLICY "select_client_message_hides" ON client_message_hides
  FOR SELECT TO authenticated
  USING (client_message_hides.user_email = auth.email() OR is_team_member());

CREATE POLICY "insert_client_message_hides" ON client_message_hides
  FOR INSERT TO authenticated
  WITH CHECK (client_message_hides.user_email = auth.email());

CREATE POLICY "delete_client_message_hides" ON client_message_hides
  FOR DELETE TO authenticated
  USING (client_message_hides.user_email = auth.email());

-- ============================================================
-- 8. card_attachments
-- ============================================================
CREATE POLICY "select_card_attachments" ON card_attachments
  FOR SELECT TO authenticated
  USING (is_team_member() OR EXISTS (
    SELECT 1 FROM kanban_cards
    JOIN clients ON clients.id = kanban_cards.client_id
    WHERE kanban_cards.id = card_attachments.card_id AND clients.email = auth.email()
  ));

CREATE POLICY "insert_card_attachments" ON card_attachments
  FOR INSERT TO authenticated WITH CHECK (is_team_member());

CREATE POLICY "update_card_attachments" ON card_attachments
  FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());

CREATE POLICY "delete_card_attachments" ON card_attachments
  FOR DELETE TO authenticated USING (is_team_member());

-- ============================================================
-- 9. card_versions
-- ============================================================
CREATE POLICY "select_card_versions" ON card_versions
  FOR SELECT TO authenticated
  USING (is_team_member() OR EXISTS (
    SELECT 1 FROM kanban_cards
    JOIN clients ON clients.id = kanban_cards.client_id
    WHERE kanban_cards.id = card_versions.card_id AND clients.email = auth.email()
  ));

CREATE POLICY "insert_card_versions" ON card_versions
  FOR INSERT TO authenticated WITH CHECK (is_team_member());

-- ============================================================
-- 10. client_analytics_rollup
-- ============================================================
CREATE POLICY "select_analytics_rollup" ON client_analytics_rollup
  FOR SELECT TO authenticated
  USING (is_team_member() OR EXISTS (
    SELECT 1 FROM clients WHERE clients.id = client_analytics_rollup.client_id AND clients.email = auth.email()
  ));

CREATE POLICY "insert_analytics_rollup" ON client_analytics_rollup
  FOR INSERT TO authenticated WITH CHECK (is_team_member());

CREATE POLICY "update_analytics_rollup" ON client_analytics_rollup
  FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());

-- ============================================================
-- 11. client_reports
-- ============================================================
CREATE POLICY "select_client_reports" ON client_reports
  FOR SELECT TO authenticated
  USING (is_team_member() OR EXISTS (
    SELECT 1 FROM clients WHERE clients.id = client_reports.client_id AND clients.email = auth.email()
  ));

CREATE POLICY "insert_client_reports" ON client_reports
  FOR INSERT TO authenticated WITH CHECK (is_team_member());

CREATE POLICY "update_client_reports" ON client_reports
  FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());

CREATE POLICY "delete_client_reports" ON client_reports
  FOR DELETE TO authenticated USING (is_team_member());

-- ============================================================
-- 12. research_items
-- ============================================================
CREATE POLICY "select_research_items" ON research_items
  FOR SELECT TO authenticated USING (is_team_member());

CREATE POLICY "insert_research_items" ON research_items
  FOR INSERT TO authenticated WITH CHECK (is_team_member());

CREATE POLICY "update_research_items" ON research_items
  FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());

CREATE POLICY "delete_research_items" ON research_items
  FOR DELETE TO authenticated USING (is_team_member());

-- ============================================================
-- 13. time_entries
-- ============================================================
CREATE POLICY "select_time_entries" ON time_entries
  FOR SELECT TO authenticated USING (is_team_member());

CREATE POLICY "insert_time_entries" ON time_entries
  FOR INSERT TO authenticated WITH CHECK (is_team_member());

CREATE POLICY "update_time_entries" ON time_entries
  FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());

CREATE POLICY "delete_time_entries" ON time_entries
  FOR DELETE TO authenticated USING (is_team_member());

-- ============================================================
-- 14. workflow_triggers
-- ============================================================
CREATE POLICY "select_workflow_triggers" ON workflow_triggers
  FOR SELECT TO authenticated USING (is_team_member());

CREATE POLICY "insert_workflow_triggers" ON workflow_triggers
  FOR INSERT TO authenticated WITH CHECK (is_team_member());

CREATE POLICY "update_workflow_triggers" ON workflow_triggers
  FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());

CREATE POLICY "delete_workflow_triggers" ON workflow_triggers
  FOR DELETE TO authenticated USING (is_team_member());

-- ============================================================
-- 15. role_permissions
-- ============================================================
CREATE POLICY "select_role_permissions" ON role_permissions
  FOR SELECT TO authenticated USING (is_team_member());

CREATE POLICY "insert_role_permissions" ON role_permissions
  FOR INSERT TO authenticated WITH CHECK (is_team_member());

CREATE POLICY "update_role_permissions" ON role_permissions
  FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());

CREATE POLICY "delete_role_permissions" ON role_permissions
  FOR DELETE TO authenticated USING (is_team_member());

-- ============================================================
-- 16. Tighten message_hides — was "true WITH CHECK true" (wide open)
-- ============================================================
DROP POLICY IF EXISTS "Service role can manage message_hides" ON message_hides;
CREATE POLICY "own_message_hides_select" ON message_hides
  FOR SELECT TO authenticated USING (message_hides.user_email = auth.email() OR is_team_member());
CREATE POLICY "own_message_hides_insert" ON message_hides
  FOR INSERT TO authenticated WITH CHECK (message_hides.user_email = auth.email());
CREATE POLICY "own_message_hides_delete" ON message_hides
  FOR DELETE TO authenticated USING (message_hides.user_email = auth.email());

DROP POLICY IF EXISTS "Service role can manage team_message_hides" ON team_message_hides;
CREATE POLICY "own_team_message_hides_select" ON team_message_hides
  FOR SELECT TO authenticated USING (team_message_hides.user_email = auth.email());
CREATE POLICY "own_team_message_hides_insert" ON team_message_hides
  FOR INSERT TO authenticated WITH CHECK (team_message_hides.user_email = auth.email());
CREATE POLICY "own_team_message_hides_delete" ON team_message_hides
  FOR DELETE TO authenticated USING (team_message_hides.user_email = auth.email());

-- ============================================================
-- 17. Tighten feature_requests — restrict INSERT to team, restrict update
-- ============================================================
-- Existing policies from 009 are fine for SELECT/INSERT (team only)
-- Just ensure UPDATE is team-only too (was service role only, add team)
DROP POLICY IF EXISTS "Service role can update feature requests" ON feature_requests;
CREATE POLICY "team_update_feature_requests" ON feature_requests
  FOR UPDATE TO authenticated USING (is_team_member()) WITH CHECK (is_team_member());

-- ============================================================
-- 18. Tighten team_members anon policies — remove anon insert
-- ============================================================
DROP POLICY IF EXISTS "anon_insert_team_members" ON team_members;
-- Keep authenticated insert for invite acceptance flow, but restrict it
DROP POLICY IF EXISTS "Authenticated users can insert team members" ON team_members;
CREATE POLICY "authenticated_insert_team_members" ON team_members
  FOR INSERT TO authenticated
  WITH CHECK (team_members.email = auth.email());

-- ============================================================
-- 19. Tighten team_invites anon policies
-- ============================================================
-- Anon needs to validate invite codes during acceptance flow
-- But we restrict to SELECT only (for code validation), remove UPDATE for anon
DROP POLICY IF EXISTS "Anon can update team invites" ON team_invites;
-- Keep anon SELECT for invite validation, but make it read-only
-- Authenticated team members can still update (mark as used)
