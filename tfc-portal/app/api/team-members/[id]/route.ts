import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

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

  if (member.role === "editor") {
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
