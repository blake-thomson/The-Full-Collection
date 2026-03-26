import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// GET /api/kanban/comments?card_id=...
export async function GET(req: NextRequest) {
  const cardId = req.nextUrl.searchParams.get("card_id");
  if (!cardId) {
    return NextResponse.json({ error: "card_id required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
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
  const { card_id, author_email, author_name, author_type, content } =
    await req.json();

  if (!card_id || !author_email || !content) {
    return NextResponse.json(
      { error: "card_id, author_email, and content are required" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("card_comments")
    .insert({
      card_id,
      author_email,
      author_name: author_name || null,
      author_type: author_type || "team",
      content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
