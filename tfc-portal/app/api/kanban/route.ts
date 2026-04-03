import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess } from "@/lib/auth-helpers";
import { triggerKanbanNotifications, triggerShootDateNotifications } from "@/lib/kanban-notifications";
import { executeTriggersForColumn } from "@/lib/execute-triggers";
import { logActivity, ACTIONS } from "@/lib/activity-logger";
import type { ColumnId } from "@/lib/constants";

// GET /api/kanban?client_id=...
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, clientId, supabase);
  if (!access.ok) return access.response;

  const { data, error } = await supabase
    .from("kanban_cards")
    .select("*")
    .eq("client_id", clientId)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/kanban — add a card
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { client_id, column_id, title } = body;

  if (!client_id || !column_id || !title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Validate optional enum fields
  const validPlatforms = ["instagram", "tiktok", "youtube", "linkedin", "twitter", "facebook", "podcast", "blog", "other"];
  if (body.platform && !validPlatforms.includes(String(body.platform).toLowerCase())) {
    return NextResponse.json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}` }, { status: 400 });
  }
  if (body.platform) body.platform = String(body.platform).toLowerCase();

  const validPriorities = ["low", "medium", "high"];
  if (body.priority && !validPriorities.includes(body.priority)) {
    return NextResponse.json({ error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}` }, { status: 400 });
  }

  const validContentTypes = ["short_form", "long_form", "carousel", "story", "live", "podcast", "blog", "other"];
  if (body.content_type && !validContentTypes.includes(body.content_type)) {
    return NextResponse.json({ error: `Invalid content_type. Must be one of: ${validContentTypes.join(", ")}` }, { status: 400 });
  }

  const dateFields = ["due_date", "shoot_date", "edit_deadline", "publish_date"] as const;
  for (const df of dateFields) {
    if (body[df]) {
      if (isNaN(Date.parse(body[df]))) {
        return NextResponse.json({ error: `Invalid ${df}. Must be a valid date string.` }, { status: 400 });
      }
      // DB columns are date type — strip time if datetime-local sends "2024-04-02T11:00"
      body[df] = String(body[df]).slice(0, 10);
    }
  }

  const supabase = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, client_id, supabase);
  if (!access.ok) return access.response;

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logActivity(supabase, {
    client_id,
    actor_email: user.email!,
    actor_type: "team",
    action: ACTIONS.CARD_CREATED,
    metadata: { card_id: data.id, title, column_id },
  });

  return NextResponse.json(data);
}

// PATCH /api/kanban — update a card
export async function PATCH(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "Card id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  // Verify card ownership before updating
  const { data: card } = await supabase
    .from("kanban_cards")
    .select("client_id, column_id, title, shoot_date")
    .eq("id", id)
    .single();
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const access = await requireClientAccess(user.email!, card.client_id, supabase);
  if (!access.ok) return access.response;

  // Validate optional enum fields
  const validPlatforms = ["instagram", "tiktok", "youtube", "linkedin", "twitter", "facebook", "podcast", "blog", "other"];
  if (body.platform !== undefined && body.platform && !validPlatforms.includes(String(body.platform).toLowerCase())) {
    return NextResponse.json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}` }, { status: 400 });
  }
  if (body.platform) body.platform = String(body.platform).toLowerCase();

  const validPriorities = ["low", "medium", "high"];
  if (body.priority !== undefined && body.priority && !validPriorities.includes(body.priority)) {
    return NextResponse.json({ error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}` }, { status: 400 });
  }

  const validContentTypes = ["short_form", "long_form", "carousel", "story", "live", "podcast", "blog", "other"];
  if (body.content_type !== undefined && body.content_type && !validContentTypes.includes(body.content_type)) {
    return NextResponse.json({ error: `Invalid content_type. Must be one of: ${validContentTypes.join(", ")}` }, { status: 400 });
  }

  const dateFields = ["due_date", "shoot_date", "edit_deadline", "publish_date"] as const;
  for (const df of dateFields) {
    if (body[df] !== undefined && body[df]) {
      if (isNaN(Date.parse(body[df]))) {
        return NextResponse.json({ error: `Invalid ${df}. Must be a valid date string.` }, { status: 400 });
      }
      // DB columns are date type — strip time if datetime-local sends "2024-04-02T11:00"
      body[df] = String(body[df]).slice(0, 10);
    }
  }

  const updates: Record<string, unknown> = {};
  const fields = [
    "column_id", "position", "title", "description", "platform",
    "due_date", "priority", "content_style", "content_type",
    "reference_url", "unedited_url", "edited_video_url",
    "assigned_editor", "shoot_date", "edit_deadline", "publish_date",
    "shoot_location", "revision_notes", "caption",
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log activity
  const newColumnId = body.column_id as ColumnId | undefined;
  if (newColumnId && newColumnId !== card.column_id) {
    logActivity(supabase, {
      client_id: card.client_id,
      actor_email: user.email!,
      actor_type: access.isTeam ? "team" : "client",
      action: ACTIONS.CARD_MOVED,
      metadata: { card_id: id, title: card.title, from: card.column_id, to: newColumnId },
    });
  } else if (Object.keys(updates).length > 1) {
    logActivity(supabase, {
      client_id: card.client_id,
      actor_email: user.email!,
      actor_type: access.isTeam ? "team" : "client",
      action: ACTIONS.CARD_UPDATED,
      metadata: { card_id: id, title: card.title, fields: Object.keys(updates).filter(k => k !== "updated_at") },
    });
  }

  // Fire notifications when a card moves to a new column (best-effort, non-blocking)
  if (newColumnId && newColumnId !== card.column_id) {
    const cardTitle = (body.title as string | undefined) || card.title;
    triggerKanbanNotifications(card.client_id, cardTitle, newColumnId, id);
    // Execute workflow automation triggers (best-effort, non-blocking)
    executeTriggersForColumn(id, newColumnId, supabase).catch((err) =>
      console.error("[kanban] trigger execution failed:", err)
    );
  }

  // Fire shoot date notifications when shoot_date is newly set or changed
  if (body.shoot_date && body.shoot_date !== card.shoot_date) {
    const cardTitle = (body.title as string | undefined) || card.title;
    triggerShootDateNotifications(supabase, card.client_id, cardTitle, body.shoot_date, id);
  }

  return NextResponse.json(data);
}

// DELETE /api/kanban?id=...
export async function DELETE(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Card id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  const { data: card } = await supabase
    .from("kanban_cards")
    .select("client_id")
    .eq("id", id)
    .single();
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const access = await requireClientAccess(user.email!, card.client_id, supabase);
  if (!access.ok) return access.response;

  const { error } = await supabase
    .from("kanban_cards")
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.email })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logActivity(supabase, {
    client_id: card.client_id,
    actor_email: user.email!,
    actor_type: "team",
    action: ACTIONS.CARD_DELETED,
    metadata: { card_id: id },
  });

  return NextResponse.json({ success: true });
}
