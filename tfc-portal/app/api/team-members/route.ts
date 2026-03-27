import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

// GET /api/team-members — list all team members (team members only)
export async function GET() {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const { data, error } = await supabase
    .from("team_members")
    .select("id, name, email, role, bio, avatar_url, created_at")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// PATCH /api/team-members — update own profile (bio, avatar_url, name)
export async function PATCH(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.bio !== undefined) updates.bio = body.bio;
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
  if (body.name !== undefined && typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("team_members")
    .update(updates)
    .eq("email", user.email!)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
