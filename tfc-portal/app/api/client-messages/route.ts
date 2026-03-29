import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

type Actor = {
  email: string;
  name: string;
  actor_type: "client" | "team";
  role?: string;
};

async function resolveActor(): Promise<Actor | null> {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user?.email) return null;
  const admin = createSupabaseAdmin();

  const { data: teamMember } = await admin
    .from("team_members")
    .select("email, name, role")
    .eq("email", user.email)
    .single();
  if (teamMember) return { ...teamMember, actor_type: "team" as const };

  const { data: client } = await admin
    .from("clients")
    .select("email, name")
    .eq("email", user.email)
    .single();
  if (client) return { email: client.email, name: client.name, actor_type: "client" as const };

  return null;
}

// GET /api/client-messages?conversation_id=xxx&limit=80
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversation_id");
  const before = searchParams.get("before");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "80"), 100);

  if (!conversationId) return NextResponse.json({ error: "conversation_id required" }, { status: 400 });

  const admin = createSupabaseAdmin();

  // Verify membership
  const { data: membership } = await admin
    .from("client_conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("member_email", actor.email)
    .single();

  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Get hidden message IDs
  const { data: hiddenRows } = await admin
    .from("client_message_hides")
    .select("message_id")
    .eq("user_email", actor.email);
  const hiddenIds = hiddenRows?.map((r: { message_id: string }) => r.message_id) ?? [];

  let query = admin
    .from("client_messages")
    .select("id, conversation_id, sender_email, sender_name, sender_type, content, reply_to_id, edited, created_at, updated_at")
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

// POST /api/client-messages
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversation_id, content, reply_to_id } = await req.json();
  if (!conversation_id || !content?.trim()) {
    return NextResponse.json({ error: "conversation_id and content required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  const { data: membership } = await admin
    .from("client_conversation_members")
    .select("id")
    .eq("conversation_id", conversation_id)
    .eq("member_email", actor.email)
    .single();

  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data: message, error } = await admin
    .from("client_messages")
    .insert({
      conversation_id,
      sender_email: actor.email,
      sender_name: actor.name,
      sender_type: actor.actor_type,
      content: content.trim(),
      reply_to_id: reply_to_id ?? null,
    })
    .select("id, conversation_id, sender_email, sender_name, sender_type, content, reply_to_id, edited, created_at, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark sender as read
  await admin
    .from("client_conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversation_id)
    .eq("member_email", actor.email);

  return NextResponse.json(message);
}

// PATCH /api/client-messages — edit or hide
export async function PATCH(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, content, action } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createSupabaseAdmin();

  if (action === "hide") {
    await admin
      .from("client_message_hides")
      .upsert({ user_email: actor.email, message_id: id }, { onConflict: "user_email,message_id" });
    return NextResponse.json({ ok: true });
  }

  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  const { data: msg } = await admin
    .from("client_messages")
    .select("sender_email")
    .eq("id", id)
    .single();

  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.sender_email !== actor.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data } = await admin
    .from("client_messages")
    .update({ content: content.trim(), edited: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, conversation_id, sender_email, sender_name, sender_type, content, reply_to_id, edited, created_at, updated_at")
    .single();

  return NextResponse.json(data);
}

// DELETE /api/client-messages?id=xxx
export async function DELETE(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createSupabaseAdmin();

  const { data: msg } = await admin
    .from("client_messages")
    .select("sender_email")
    .eq("id", id)
    .single();

  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only sender can delete their own messages; team owner/admin can delete any
  if (msg.sender_email !== actor.email) {
    if (actor.actor_type !== "team" || !["owner", "admin"].includes(actor.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await admin
    .from("client_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
