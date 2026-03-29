import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

// POST /api/library/create-from-suggestion — Create kanban card from repurpose suggestion
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) return teamCheck.response;

  const body = await req.json();
  const { clientId, title, description, platform, contentType, hook } = body;

  if (!clientId || !title) {
    return NextResponse.json({ error: "clientId and title are required" }, { status: 400 });
  }

  // Get next position in idea column
  const { data: existing } = await admin
    .from("kanban_cards")
    .select("position")
    .eq("client_id", clientId)
    .eq("column_id", "idea")
    .is("deleted_at", null)
    .order("position", { ascending: false })
    .limit(1);

  const nextPos = (existing?.[0]?.position ?? -1) + 1;

  // Build description with hook
  const fullDescription = hook
    ? `Hook: ${hook}\n\n${description || ""}`
    : description || "";

  const { data: card, error } = await admin
    .from("kanban_cards")
    .insert({
      client_id: clientId,
      column_id: "idea",
      title,
      description: fullDescription,
      platform: platform?.toLowerCase() || null,
      content_type: contentType || null,
      position: nextPos,
      is_evergreen: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(card);
}
