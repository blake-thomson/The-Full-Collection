import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// GET /api/kanban?client_id=...
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) {
    return NextResponse.json({ error: "client_id required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("kanban_cards")
    .select("*")
    .eq("client_id", clientId)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST /api/kanban — add a card
export async function POST(req: NextRequest) {
  const {
    client_id,
    column_id,
    title,
    platform,
    description,
    due_date,
    priority,
    created_by,
  } = await req.json();

  if (!client_id || !column_id || !title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Get next position
  const { data: existing } = await supabase
    .from("kanban_cards")
    .select("position")
    .eq("client_id", client_id)
    .eq("column_id", column_id)
    .order("position", { ascending: false })
    .limit(1);

  const nextPos = (existing?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("kanban_cards")
    .insert({
      client_id,
      column_id,
      title,
      platform: platform || null,
      position: nextPos,
      description: description || null,
      due_date: due_date || null,
      priority: priority || null,
      created_by: created_by || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// PATCH /api/kanban — update a card
export async function PATCH(req: NextRequest) {
  const { id, column_id, position, title, description, due_date, priority } =
    await req.json();

  if (!id) {
    return NextResponse.json({ error: "Card id required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const updates: Record<string, any> = {};
  if (column_id !== undefined) updates.column_id = column_id;
  if (position !== undefined) updates.position = position;
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (due_date !== undefined) updates.due_date = due_date;
  if (priority !== undefined) updates.priority = priority;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("kanban_cards")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// DELETE /api/kanban?id=...
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Card id required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("kanban_cards").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
