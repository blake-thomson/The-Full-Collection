import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

type Actor = {
  email: string;
  name: string;
  actor_type: "client" | "team";
  role?: string;
  client_id?: string; // only for clients
};

async function resolveActor(): Promise<Actor | null> {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user?.email) return null;
  const admin = createSupabaseAdmin();

  // Check team member first
  const { data: teamMember } = await admin
    .from("team_members")
    .select("email, name, role")
    .eq("email", user.email)
    .single();
  if (teamMember) return { ...teamMember, actor_type: "team" as const };

  // Check client
  const { data: client } = await admin
    .from("clients")
    .select("id, email, name")
    .eq("email", user.email)
    .single();
  if (client) return { email: client.email, name: client.name, actor_type: "client" as const, client_id: client.id };

  return null;
}

// GET /api/client-conversations?client_id=xxx  (or no client_id for team members — returns all their conversations)
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = new URL(req.url).searchParams.get("client_id");

  // Clients must provide their own client_id
  if (actor.actor_type === "client") {
    if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });
    if (actor.client_id !== clientId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();

  // Get all memberships for the current user (optionally scoped to a client_id)
  const membershipQuery = admin
    .from("client_conversation_members")
    .select("conversation_id, last_read_at")
    .eq("member_email", actor.email);

  const { data: memberships } = await membershipQuery;
  if (!memberships?.length) return NextResponse.json([]);

  // Filter conversations by client_id scope if provided
  let convQuery = admin
    .from("client_conversations")
    .select("id")
    .in("id", memberships.map((m: { conversation_id: string }) => m.conversation_id))
    .is("deleted_at", null);

  if (clientId) convQuery = convQuery.eq("client_id", clientId);

  const { data: allConvs } = await convQuery;
  if (!allConvs?.length) return NextResponse.json([]);

  const convIds = allConvs.map((c: { id: string }) => c.id);
  const filteredMemberships = memberships.filter((m: { conversation_id: string }) => convIds.includes(m.conversation_id));
  if (!filteredMemberships.length) return NextResponse.json([]);

  const membershipMap = new Map(
    filteredMemberships.map((m: { conversation_id: string; last_read_at: string }) => [m.conversation_id, m.last_read_at])
  );
  const myConvIds = filteredMemberships.map((m: { conversation_id: string }) => m.conversation_id);

  const { data: conversations } = await admin
    .from("client_conversations")
    .select("*")
    .in("id", myConvIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const enriched = await Promise.all(
    (conversations ?? []).map(async (conv: Record<string, unknown>) => {
      const lastReadAt = membershipMap.get(conv.id as string) ?? "1970-01-01";

      const [{ data: members }, { data: lastMsg }, { count: unread }] = await Promise.all([
        admin
          .from("client_conversation_members")
          .select("member_email, member_name, member_type")
          .eq("conversation_id", conv.id as string),
        admin
          .from("client_messages")
          .select("id, content, sender_email, sender_name, created_at")
          .eq("conversation_id", conv.id as string)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1),
        admin
          .from("client_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id as string)
          .is("deleted_at", null)
          .gt("created_at", lastReadAt),
      ]);

      return {
        ...conv,
        members: members ?? [],
        last_message: lastMsg?.[0] ?? null,
        unread_count: unread ?? 0,
        last_read_at: lastReadAt,
      };
    })
  );

  return NextResponse.json(enriched);
}

// POST /api/client-conversations — create DM or group
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, name, client_id, member_emails = [] } = body;

  if (!type || !["dm", "group"].includes(type)) {
    return NextResponse.json({ error: "type must be dm or group" }, { status: 400 });
  }
  if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  // Clients can only create in their own scope
  if (actor.actor_type === "client" && actor.client_id !== client_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();

  // For DMs: find or create
  if (type === "dm") {
    const otherEmail = member_emails[0];
    if (!otherEmail) return NextResponse.json({ error: "DM requires a recipient" }, { status: 400 });

    // Look for existing DM between these two in this client scope
    const { data: actorConvs } = await admin
      .from("client_conversation_members")
      .select("conversation_id")
      .eq("member_email", actor.email);

    if (actorConvs?.length) {
      const { data: otherConvs } = await admin
        .from("client_conversation_members")
        .select("conversation_id")
        .eq("member_email", otherEmail)
        .in("conversation_id", actorConvs.map((c: { conversation_id: string }) => c.conversation_id));

      if (otherConvs?.length) {
        const sharedIds = otherConvs.map((c: { conversation_id: string }) => c.conversation_id);
        const { data: existing } = await admin
          .from("client_conversations")
          .select("*")
          .in("id", sharedIds)
          .eq("type", "dm")
          .eq("client_id", client_id)
          .is("deleted_at", null)
          .limit(1);

        if (existing?.[0]) {
          const { data: members } = await admin
            .from("client_conversation_members")
            .select("member_email, member_name, member_type")
            .eq("conversation_id", existing[0].id);
          const { data: lastMsg } = await admin
            .from("client_messages")
            .select("id, content, sender_email, sender_name, created_at")
            .eq("conversation_id", existing[0].id)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(1);
          return NextResponse.json({ ...existing[0], members: members ?? [], last_message: lastMsg?.[0] ?? null, unread_count: 0 });
        }
      }
    }
  }

  const { data: conv, error } = await admin
    .from("client_conversations")
    .insert({ type, name: name || null, client_id, created_by: actor.email })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve names for all members
  const allEmails: string[] = Array.from(new Set([actor.email, ...member_emails]));

  const memberRows = await Promise.all(
    allEmails.map(async (email: string) => {
      // Try team_members first
      const { data: tm } = await admin.from("team_members").select("name").eq("email", email).single();
      if (tm) return { conversation_id: conv.id, member_email: email, member_name: tm.name, member_type: "team" };
      // Try clients
      const { data: cl } = await admin.from("clients").select("name").eq("email", email).single();
      return { conversation_id: conv.id, member_email: email, member_name: cl?.name ?? email, member_type: "client" };
    })
  );

  await admin.from("client_conversation_members").insert(memberRows);

  const { data: members } = await admin
    .from("client_conversation_members")
    .select("member_email, member_name, member_type")
    .eq("conversation_id", conv.id);

  return NextResponse.json({ ...conv, members: members ?? [], last_message: null, unread_count: 0 });
}

// DELETE /api/client-conversations?id=xxx — soft-delete conversation
export async function DELETE(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createSupabaseAdmin();

  // Verify the actor is a member of this conversation
  const { data: membership } = await admin
    .from("client_conversation_members")
    .select("id")
    .eq("conversation_id", id)
    .eq("member_email", actor.email)
    .single();

  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date().toISOString();
  await admin.from("client_messages").update({ deleted_at: now, deleted_by: actor.email }).eq("conversation_id", id).is("deleted_at", null);
  await admin.from("client_conversations").update({ deleted_at: now, deleted_by: actor.email }).eq("id", id);

  return NextResponse.json({ ok: true });
}

// PATCH /api/client-conversations — mark as read
export async function PATCH(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversation_id, action } = await req.json();
  if (action !== "read") return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const admin = createSupabaseAdmin();
  await admin
    .from("client_conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversation_id)
    .eq("member_email", actor.email);

  return NextResponse.json({ ok: true });
}
