import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

// GET /api/sessions — list all auth users with session metadata
export async function GET() {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) return teamCheck.response;

  // Only owner/admin can view sessions
  const { data: actor } = await admin
    .from("team_members")
    .select("role")
    .eq("email", user.email!)
    .single();

  if (!actor || !["owner", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only owners and admins can view sessions" }, { status: 403 });
  }

  // Get all auth users
  const { data: authData, error } = await admin.auth.admin.listUsers();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get team members and clients for name mapping
  const { data: teamMembers } = await admin.from("team_members").select("email, name, role");
  const { data: clients } = await admin.from("clients").select("email, name");

  const teamMap = new Map((teamMembers || []).map((m) => [m.email, { name: m.name, role: m.role }]));
  const clientMap = new Map((clients || []).map((c) => [c.email, c.name]));

  const sessions = (authData.users || []).map((u) => {
    const teamInfo = teamMap.get(u.email || "");
    const clientName = clientMap.get(u.email || "");
    return {
      id: u.id,
      email: u.email,
      name: teamInfo?.name || clientName || u.email,
      type: teamInfo ? "team" : clientName ? "client" : "unknown",
      role: teamInfo?.role || null,
      last_sign_in: u.last_sign_in_at,
      created_at: u.created_at,
      confirmed_at: u.confirmed_at,
      banned: u.banned_until ? true : false,
    };
  });

  // Sort by last_sign_in descending
  sessions.sort((a, b) => {
    const aTime = a.last_sign_in ? new Date(a.last_sign_in).getTime() : 0;
    const bTime = b.last_sign_in ? new Date(b.last_sign_in).getTime() : 0;
    return bTime - aTime;
  });

  return NextResponse.json(sessions);
}

// DELETE /api/sessions — force logout (ban) a user
export async function DELETE(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) return teamCheck.response;

  const { data: actor } = await admin
    .from("team_members")
    .select("role")
    .eq("email", user.email!)
    .single();

  if (!actor || !["owner", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only owners and admins can manage sessions" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Don't allow force-logout of yourself
  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot force logout yourself" }, { status: 400 });
  }

  // Sign out the user by invalidating all their refresh tokens
  const { error } = await admin.auth.admin.signOut(userId, "global");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
