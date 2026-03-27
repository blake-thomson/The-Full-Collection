import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

// GET /api/kanban?client_id=...
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
  const { data, error } = await supabase
    .from("kanban_cards")
    .select("*")
    .eq("client_id", clientId)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST /api/kanban — add a card
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { client_id, column_id, title } = body;

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
      platform: body.platform || null,
      position: nextPos,
      description: body.description || null,
      due_date: body.due_date || null,
      priority: body.priority || null,
      created_by: body.created_by || null,
      content_style: body.content_style || null,
      content_type: body.content_type || null,
      reference_url: body.reference_url || null,
      assigned_editor: body.assigned_editor || null,
      shoot_date: body.shoot_date || null,
      edit_deadline: body.edit_deadline || null,
      publish_date: body.publish_date || null,
      unedited_url: body.unedited_url || null,
      edited_video_url: body.edited_video_url || null,
      shoot_location: body.shoot_location || null,
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
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Card id required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const updates: Record<string, any> = {};
  const fields = [
    "column_id", "position", "title", "description", "platform",
    "due_date", "priority", "content_style", "content_type",
    "reference_url", "unedited_url", "edited_video_url",
    "assigned_editor", "shoot_date", "edit_deadline", "publish_date", "shoot_location",
    "revision_notes",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
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
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Card id required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("kanban_cards")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
