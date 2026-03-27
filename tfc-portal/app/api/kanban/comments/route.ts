import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess } from "@/lib/auth-helpers";

// GET /api/kanban/comments?card_id=...
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cardId = req.nextUrl.searchParams.get("card_id");
  if (!cardId) {
    return NextResponse.json({ error: "card_id required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Look up the card to get its client_id, then verify access
  const { data: card } = await supabase
    .from("kanban_cards")
    .select("client_id")
    .eq("id", cardId)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const access = await requireClientAccess(user.email!, card.client_id, supabase);
  if (!access.ok) return access.response;

  const { data, error } = await supabase
    .from("card_comments")
    .select("*")
    .eq("card_id", cardId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST /api/kanban/comments — create a comment
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { card_id, author_name, author_type, content } = await req.json();

  if (!card_id || !content) {
    return NextResponse.json(
      { error: "card_id and content are required" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  // Look up the card to get its client_id, then verify access
  const { data: card } = await supabase
    .from("kanban_cards")
    .select("client_id")
    .eq("id", card_id)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const access = await requireClientAccess(user.email!, card.client_id, supabase);
  if (!access.ok) return access.response;

  // Determine author_type from verified team membership (don't trust client input)
  const resolvedAuthorType = access.isTeam ? (author_type || "team") : "client";

  const { data, error } = await supabase
    .from("card_comments")
    .insert({
      card_id,
      author_email: user.email,   // always use the authenticated user's email
      author_name: author_name || null,
      author_type: resolvedAuthorType,
      content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
