import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess } from "@/lib/auth-helpers";

// GET /api/cards/[cardId]/comments
export async function GET(
  req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const { cardId } = params;

  // Fetch the card to get client_id
  const { data: card } = await admin
    .from("kanban_cards")
    .select("client_id")
    .eq("id", cardId)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const access = await requireClientAccess(user.email!, card.client_id, admin);
  if (!access.ok) return access.response;

  const { data, error } = await admin
    .from("card_comments")
    .select("*")
    .eq("card_id", cardId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST /api/cards/[cardId]/comments
export async function POST(
  req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { body, timestampSeconds } = await req.json();

  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json(
      { error: "Comment body is required" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdmin();
  const { cardId } = params;

  // Fetch the card to get client_id
  const { data: card } = await admin
    .from("kanban_cards")
    .select("client_id")
    .eq("id", cardId)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const access = await requireClientAccess(user.email!, card.client_id, admin);
  if (!access.ok) return access.response;

  // Determine author info
  let authorName = user.email!;
  let authorType = "client";

  if (access.isTeam) {
    authorType = "team";
    const { data: member } = await admin
      .from("team_members")
      .select("name")
      .eq("email", user.email!)
      .maybeSingle();
    if (member?.name) authorName = member.name;
  } else {
    const { data: client } = await admin
      .from("clients")
      .select("name")
      .eq("email", user.email!)
      .maybeSingle();
    if (client?.name) authorName = client.name;
  }

  const { data, error } = await admin
    .from("card_comments")
    .insert({
      card_id: cardId,
      author_email: user.email!,
      author_name: authorName,
      author_type: authorType,
      content: body.trim(),
      timestamp_seconds:
        timestampSeconds !== undefined && timestampSeconds !== null
          ? Number(timestampSeconds)
          : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
