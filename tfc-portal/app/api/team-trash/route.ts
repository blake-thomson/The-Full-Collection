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

// GET /api/team-trash — list soft-deleted conversations and messages (owner/admin only)
export async function GET() {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(actor.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createSupabaseAdmin();

  const [{ data: conversations }, { data: messages }] = await Promise.all([
    admin
      .from("team_conversations")
      .select("id, name, type, description, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    admin
      .from("team_messages")
      .select("id, conversation_id, sender_email, content, deleted_at, team_members!team_messages_sender_email_fkey(name)")
      .not("deleted_at", "is", null)
      // Only messages whose conversation is NOT itself deleted (standalone deleted messages)
      .order("deleted_at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({ conversations: conversations ?? [], messages: messages ?? [] });
}

// PATCH /api/team-trash — restore an item
export async function PATCH(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(actor.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, type } = await req.json();
  if (!id || !["conversation", "message"].includes(type)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  if (type === "conversation") {
    // Restore conversation and its soft-deleted messages
    await admin.from("team_conversations").update({ deleted_at: null }).eq("id", id);
    await admin.from("team_messages").update({ deleted_at: null }).eq("conversation_id", id).not("deleted_at", "is", null);
  } else {
    await admin.from("team_messages").update({ deleted_at: null }).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/team-trash?id=xxx&type=conversation|message — permanently delete
export async function DELETE(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(actor.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!id || !["conversation", "message"].includes(type ?? "")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  if (type === "conversation") {
    await admin.from("team_conversations").delete().eq("id", id);
  } else {
    await admin.from("team_messages").delete().eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
