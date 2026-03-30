import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

async function resolveActor() {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user?.email) return null;
  const admin = createSupabaseAdmin();
  const { data: member } = await admin.from("team_members").select("*").eq("email", user.email).single();
  return member ?? null;
}

// GET /api/team-messages?conversation_id=xxx&before=ISO&limit=50
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversation_id");
  const before = searchParams.get("before");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  if (!conversationId) return NextResponse.json({ error: "conversation_id required" }, { status: 400 });

  const admin = createSupabaseAdmin();

  // Verify member is in this conversation
  const { data: membership } = await admin
    .from("team_conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("member_email", actor.email)
    .single();

  if (!membership) return NextResponse.json({ error: "Not a member of this conversation" }, { status: 403 });

  // Get IDs of messages this user has hidden
  const { data: hiddenRows } = await admin
    .from("team_message_hides")
    .select("message_id")
    .eq("user_email", actor.email);
  const hiddenIds = hiddenRows?.map((r) => r.message_id as string) ?? [];

  let query = admin
    .from("team_messages")
    .select(`
      id, conversation_id, sender_email, content, reply_to_id, edited, created_at, updated_at,
      team_members!team_messages_sender_email_fkey(name, avatar_url, role)
    `)
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (hiddenIds.length > 0) query = query.not("id", "in", `(${hiddenIds.join(",")})`);
  if (before) query = query.lt("created_at", before);

  const { data: messages, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((messages ?? []).reverse());
}

// POST /api/team-messages — send a message
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { conversation_id, content, reply_to_id } = body;

  if (!conversation_id || !content?.trim()) {
    return NextResponse.json({ error: "conversation_id and content required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  const { data: membership } = await admin
    .from("team_conversation_members")
    .select("id")
    .eq("conversation_id", conversation_id)
    .eq("member_email", actor.email)
    .single();

  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data: message, error } = await admin
    .from("team_messages")
    .insert({
      conversation_id,
      sender_email: actor.email,
      content: content.trim(),
      reply_to_id: reply_to_id ?? null,
    })
    .select(`
      id, conversation_id, sender_email, content, reply_to_id, edited, created_at, updated_at,
      team_members!team_messages_sender_email_fkey(name, avatar_url, role)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin
    .from("team_conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversation_id)
    .eq("member_email", actor.email);

  return NextResponse.json(message);
}

// PATCH /api/team-messages — edit a message
export async function PATCH(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, content, action } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Hide action — per-user, no ownership check needed
  if (action === "hide") {
    const admin = createSupabaseAdmin();
    await admin.from("team_message_hides").upsert({ user_email: actor.email, message_id: id }, { onConflict: "user_email,message_id" });
    return NextResponse.json({ ok: true });
  }

  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  const admin = createSupabaseAdmin();

  const { data: msg } = await admin.from("team_messages").select("sender_email").eq("id", id).single();
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.sender_email !== actor.email && !["owner", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data } = await admin
    .from("team_messages")
    .update({ content: content.trim(), edited: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return NextResponse.json(data);
}

// DELETE /api/team-messages?id=xxx
export async function DELETE(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createSupabaseAdmin();

  const { data: msg } = await admin.from("team_messages").select("sender_email").eq("id", id).single();
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.sender_email !== actor.email && !["owner", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await admin.from("team_messages").update({ deleted_at: new Date().toISOString(), deleted_by: actor.email }).eq("id", id);
  return NextResponse.json({ ok: true });
}
