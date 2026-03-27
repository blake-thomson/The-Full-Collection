import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

// GET /api/client-assignments?client_id=xxx
// Returns all team members assigned to a client, enriched with their name and role.
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const admin = createSupabaseAdmin();

  const access = await requireTeamMember(user.email!, admin);
  if (!access.ok) return access.response;

  // Get assigned emails
  const { data: assignments, error } = await admin
    .from("client_assignments")
    .select("id, team_member_email, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!assignments || assignments.length === 0) {
    return NextResponse.json([]);
  }

  // Enrich with name and role from team_members
  const emails = assignments.map((a) => a.team_member_email);
  const { data: members } = await admin
    .from("team_members")
    .select("email, name, role")
    .in("email", emails);

  const memberMap = Object.fromEntries((members || []).map((m) => [m.email, m]));

  const enriched = assignments.map((a) => ({
    id: a.id,
    team_member_email: a.team_member_email,
    name: memberMap[a.team_member_email]?.name ?? a.team_member_email,
    role: memberMap[a.team_member_email]?.role ?? "unknown",
    created_at: a.created_at,
  }));

  return NextResponse.json(enriched);
}

// POST /api/client-assignments — assign a team member to a client
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();

  const access = await requireTeamMember(user.email!, admin);
  if (!access.ok) return access.response;

  const { client_id, team_member_email } = await req.json();
  if (!client_id || !team_member_email) {
    return NextResponse.json({ error: "client_id and team_member_email are required" }, { status: 400 });
  }

  // Verify the team member actually exists
  const { data: member } = await admin
    .from("team_members")
    .select("email, name, role")
    .eq("email", team_member_email)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Team member not found" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("client_assignments")
    .insert({ client_id, team_member_email })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "This team member is already assigned to this client." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    team_member_email: data.team_member_email,
    name: member.name,
    role: member.role,
    created_at: data.created_at,
  });
}

// DELETE /api/client-assignments?id=xxx
export async function DELETE(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createSupabaseAdmin();

  const access = await requireTeamMember(user.email!, admin);
  if (!access.ok) return access.response;

  const { error } = await admin
    .from("client_assignments")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
