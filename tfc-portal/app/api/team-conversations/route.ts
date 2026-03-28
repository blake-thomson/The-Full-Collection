import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

type AdminClient = ReturnType<typeof createSupabaseAdmin>;

async function resolveActor() {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user?.email) return null;
  const admin = createSupabaseAdmin();
  const { data: member } = await admin.from("team_members").select("*").eq("email", user.email).single();
  return member ?? null;
}

// GET /api/team-conversations — list conversations the current user is in
export async function GET() {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();

  const { data: memberships } = await admin
    .from("team_conversation_members")
    .select("conversation_id, last_read_at")
    .eq("member_email", actor.email);

  if (!memberships?.length) {
    await autoJoinDefaults(admin, actor.email);
    const { data: fresh } = await admin
      .from("team_conversation_members")
      .select("conversation_id, last_read_at")
      .eq("member_email", actor.email);
    return buildResponse(admin, actor.email, fresh ?? []);
  }

  return buildResponse(admin, actor.email, memberships);
}

async function autoJoinDefaults(admin: AdminClient, email: string) {
  const { data: defaults } = await admin
    .from("team_conversations")
    .select("id")
    .eq("is_default", true);
  if (!defaults?.length) return;
  const rows = defaults.map((c: { id: string }) => ({ conversation_id: c.id, member_email: email }));
  await admin.from("team_conversation_members").upsert(rows, { onConflict: "conversation_id,member_email" });
}

async function buildResponse(
  admin: AdminClient,
  email: string,
  memberships: { conversation_id: string; last_read_at: string }[]
) {
  const convIds = memberships.map((m) => m.conversation_id);
  if (!convIds.length) return NextResponse.json([]);

  const { data: conversations } = await admin
    .from("team_conversations")
    .select("*")
    .in("id", convIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const enriched = await Promise.all(
    (conversations ?? []).map(async (conv: Record<string, unknown>) => {
      const membership = memberships.find((m) => m.conversation_id === conv.id);

      const [{ data: members }, { data: lastMsg }, { count: unread }] = await Promise.all([
        admin
          .from("team_conversation_members")
          .select("member_email, team_members!inner(name, avatar_url, role)")
          .eq("conversation_id", conv.id),
        admin
          .from("team_messages")
          .select("id, content, sender_email, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1),
        admin
          .from("team_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .gt("created_at", membership?.last_read_at ?? "1970-01-01"),
      ]);

      return {
        ...conv,
        members: members ?? [],
        last_message: lastMsg?.[0] ?? null,
        unread_count: unread ?? 0,
        last_read_at: membership?.last_read_at,
      };
    })
  );

  return NextResponse.json(enriched);
}

// POST /api/team-conversations — create channel, group, or DM
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, name, description, member_emails = [] } = body;

  if (!type || !["channel", "dm", "group"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // For DMs: check if one already exists between these two users
  if (type === "dm") {
    const otherEmail = member_emails[0];
    if (!otherEmail) return NextResponse.json({ error: "DM requires a recipient" }, { status: 400 });

    const { data: existing } = await admin
      .from("team_conversation_members")
      .select("conversation_id")
      .eq("member_email", actor.email);

    if (existing?.length) {
      const { data: otherMemberships } = await admin
        .from("team_conversation_members")
        .select("conversation_id")
        .eq("member_email", otherEmail)
        .in("conversation_id", existing.map((e: { conversation_id: string }) => e.conversation_id));

      if (otherMemberships?.length) {
        const sharedIds = otherMemberships.map((m: { conversation_id: string }) => m.conversation_id);
        const { data: dmConv } = await admin
          .from("team_conversations")
          .select("*")
          .in("id", sharedIds)
          .eq("type", "dm")
          .limit(1);

        if (dmConv?.[0]) {
          const [{ data: members }, { data: lastMsg }] = await Promise.all([
            admin.from("team_conversation_members").select("member_email, team_members!inner(name, avatar_url, role)").eq("conversation_id", dmConv[0].id),
            admin.from("team_messages").select("id, content, sender_email, created_at").eq("conversation_id", dmConv[0].id).order("created_at", { ascending: false }).limit(1),
          ]);
          return NextResponse.json({ ...dmConv[0], members: members ?? [], last_message: lastMsg?.[0] ?? null, unread_count: 0 });
        }
      }
    }
  }

  const { data: conv, error } = await admin
    .from("team_conversations")
    .insert({ type, name: name || null, description: description || null, created_by: actor.email })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allEmails: string[] = Array.from(new Set([actor.email, ...member_emails]));
  await admin.from("team_conversation_members").insert(
    allEmails.map((email: string) => ({ conversation_id: conv.id, member_email: email }))
  );

  const { data: members } = await admin
    .from("team_conversation_members")
    .select("member_email, team_members!inner(name, avatar_url, role)")
    .eq("conversation_id", conv.id);

  return NextResponse.json({ ...conv, members: members ?? [], last_message: null, unread_count: 0 });
}

// PATCH /api/team-conversations — mark as read or update metadata
export async function PATCH(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { conversation_id, action, name, description } = body;

  const admin = createSupabaseAdmin();

  if (action === "read") {
    await admin
      .from("team_conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversation_id)
      .eq("member_email", actor.email);
    return NextResponse.json({ ok: true });
  }

  if (action === "update") {
    const { data } = await admin
      .from("team_conversations")
      .update({ name, description })
      .eq("id", conversation_id)
      .select()
      .single();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE /api/team-conversations?id=xxx — soft-delete a conversation (owner/admin only)
export async function DELETE(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(actor.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const now = new Date().toISOString();

  // Soft-delete all messages in the conversation
  await admin.from("team_messages").update({ deleted_at: now }).eq("conversation_id", id).is("deleted_at", null);
  // Soft-delete the conversation
  await admin.from("team_conversations").update({ deleted_at: now }).eq("id", id);

  return NextResponse.json({ ok: true });
}
