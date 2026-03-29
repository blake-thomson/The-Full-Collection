import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

// GET /api/team-members — list all team members (team members or clients)
export async function GET() {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Allow team members
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) {
    // Also allow authenticated clients
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("email", user.email!)
      .single();
    if (!client) return access.response;
  }

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

// DELETE /api/team-members — remove a team member (owner/admin only)
export async function DELETE(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  // Only owner/admin can remove team members
  const { data: actor } = await supabase
    .from("team_members")
    .select("role")
    .eq("email", user.email!)
    .single();

  if (!actor || !["owner", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only owners and admins can remove team members" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing member id" }, { status: 400 });

  // Fetch the member to remove
  const { data: target } = await supabase
    .from("team_members")
    .select("id, email, role")
    .eq("id", id)
    .single();

  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  // Prevent removing yourself
  if (target.email === user.email) {
    return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
  }

  // Prevent non-owners from removing admins/owners
  if (["owner", "admin"].includes(target.role) && actor.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can remove admins" }, { status: 403 });
  }

  // 1. Remove client assignments
  await supabase
    .from("client_assignments")
    .delete()
    .eq("team_member_email", target.email);

  // 2. Remove team member record
  const { error: deleteError } = await supabase
    .from("team_members")
    .delete()
    .eq("id", id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  // 3. Disable their auth account (ban so they can't log in)
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const authUser = authUsers?.users?.find((u) => u.email === target.email);
  if (authUser) {
    await supabase.auth.admin.updateUserById(authUser.id, { ban_duration: "876600h" }); // ~100 years
  }

  return NextResponse.json({ success: true });
}
