import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

const VALID_ROLES = ["admin", "project_manager", "youtube_editor", "short_form_editor", "videographer", "social_media_manager", "smm"];

// PATCH /api/team-members/[id] — update a member's role (owner/admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();

  const { data: actor } = await supabase
    .from("team_members")
    .select("role")
    .eq("email", user.email!)
    .single();

  if (!actor || !["owner", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only owners and admins can change roles" }, { status: 403 });
  }

  const { role } = await req.json();
  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const { data: target } = await supabase
    .from("team_members")
    .select("role, email")
    .eq("id", params.id)
    .single();

  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "owner") return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 403 });
  if (target.email === user.email!) return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });

  const { data, error } = await supabase
    .from("team_members")
    .update({ role })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// GET /api/team-members/[id] — fetch a single member's profile + work data
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  // Fetch the member
  const { data: member, error: memberError } = await supabase
    .from("team_members")
    .select("id, name, email, role, bio, avatar_url, created_at")
    .eq("id", params.id)
    .single();

  if (memberError || !member) {
    return NextResponse.json({ error: "Team member not found" }, { status: 404 });
  }

  // Fetch assigned clients
  const { data: assignments } = await supabase
    .from("client_assignments")
    .select("client_id, created_at")
    .eq("team_member_email", member.email);

  const clientIds = (assignments || []).map((a) => a.client_id);

  let clients: { id: string; name: string; email: string }[] = [];
  if (clientIds.length > 0) {
    const { data: clientData } = await supabase
      .from("clients")
      .select("id, name, email")
      .in("id", clientIds);
    clients = clientData || [];
  }

  // Fetch relevant kanban cards based on role
  let cards: Record<string, unknown>[] = [];

  if (["youtube_editor", "short_form_editor"].includes(member.role)) {
    // Cards directly assigned to this editor
    const { data: editorCards } = await supabase
      .from("kanban_cards")
      .select("id, title, column_id, platform, priority, due_date, client_id, created_at, updated_at")
      .eq("assigned_editor", member.email)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    cards = editorCards || [];
  } else if (member.role === "social_media_manager" || member.role === "smm") {
    // Cards in publish pipeline for their assigned clients
    if (clientIds.length > 0) {
      const { data: smmCards } = await supabase
        .from("kanban_cards")
        .select("id, title, column_id, platform, priority, due_date, client_id, created_at, updated_at")
        .in("client_id", clientIds)
        .in("column_id", ["approved", "scheduled", "published"])
        .is("deleted_at", null)
        .order("updated_at", { ascending: false });
      cards = smmCards || [];
    }
  } else {
    // Admin/owner: all active cards across assigned clients
    if (clientIds.length > 0) {
      const { data: allCards } = await supabase
        .from("kanban_cards")
        .select("id, title, column_id, platform, priority, due_date, client_id, created_at, updated_at")
        .in("client_id", clientIds)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(100);
      cards = allCards || [];
    }
  }

  // Enrich cards with client name
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const enrichedCards = cards.map((card) => ({
    ...card,
    client_name: clientMap[card.client_id as string]?.name ?? "Unknown",
  }));

  return NextResponse.json({
    member,
    clients,
    cards: enrichedCards,
  });
}
