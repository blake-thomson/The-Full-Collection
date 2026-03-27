-- ============================================================
-- Migration 002: Client Assignments
-- Maps team members to specific clients for notification routing.
-- ============================================================

CREATE TABLE IF NOT EXISTS client_assignments (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  team_member_email text NOT NULL,
  created_at   timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT client_assignments_unique UNIQUE (client_id, team_member_email)
);

-- Index for fast lookup by client
CREATE INDEX IF NOT EXISTS client_assignments_client_idx ON client_assignments (client_id);

-- Index for fast lookup by team member (e.g. "show all clients I'm assigned to")
CREATE INDEX IF NOT EXISTS client_assignments_email_idx ON client_assignments (team_member_email);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;

-- Team members can view all assignments
CREATE POLICY "client_assignments_select"
  ON client_assignments FOR SELECT TO authenticated
  USING (is_team_member());

-- Team members can create assignments
CREATE POLICY "client_assignments_insert"
  ON client_assignments FOR INSERT TO authenticated
  WITH CHECK (is_team_member());

-- Team members can remove assignments
CREATE POLICY "client_assignments_delete"
  ON client_assignments FOR DELETE TO authenticated
  USING (is_team_member());
