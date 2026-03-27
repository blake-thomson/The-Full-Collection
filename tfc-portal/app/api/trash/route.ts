import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

// GET /api/trash?client_id=...
// Returns all soft-deleted items across kanban_cards, messages, resources
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) {
    return NextResponse.json({ error: "client_id required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const [cardsRes, messagesRes, resourcesRes] = await Promise.all([
    supabase
      .from("kanban_cards")
      .select("*")
      .eq("client_id", clientId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("messages")
      .select("*")
      .eq("client_id", clientId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("resources")
      .select("*")
      .eq("client_id", clientId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
  ]);

  return NextResponse.json({
    cards: cardsRes.data || [],
    messages: messagesRes.data || [],
    resources: resourcesRes.data || [],
  });
}

// PATCH /api/trash — restore an item
// Body: { id, type: "card" | "message" | "resource" }
export async function PATCH(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, type } = await req.json();
  if (!id || !type) {
    return NextResponse.json({ error: "id and type required" }, { status: 400 });
  }

  const table = type === "card" ? "kanban_cards" : type === "message" ? "messages" : "resources";
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

// DELETE /api/trash?id=...&type=card|message|resource
// Permanently deletes an item
export async function DELETE(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  const type = req.nextUrl.searchParams.get("type");
  if (!id || !type) {
    return NextResponse.json({ error: "id and type required" }, { status: 400 });
  }

  const table = type === "card" ? "kanban_cards" : type === "message" ? "messages" : "resources";
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
