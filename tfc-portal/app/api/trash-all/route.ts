import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

/**
 * GET /api/trash-all
 *
 * Unified trash endpoint for the team portal.
 * Returns ALL soft-deleted items across ALL tables with
 * who deleted them, when, and which client they belong to.
 * Only accessible by team members (owner/admin).
 */
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) return teamCheck.response;

  // Only owner/admin can see all deleted items
  const { data: member } = await admin
    .from("team_members")
    .select("role")
    .eq("email", user.email!)
    .single();
  if (!member || !["owner", "admin"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all soft-deleted items across all tables in parallel
  const [cards, messages, resources, teamConvos, teamMsgs, clientConvos, clientMsgs] = await Promise.all([
    admin.from("kanban_cards")
      .select("id, title, client_id, deleted_at, deleted_by, platform, column_id")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(100),
    admin.from("messages")
      .select("id, content, client_id, sender_name, sender_type, deleted_at, deleted_by")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(100),
    admin.from("resources")
      .select("id, name, client_id, category, type, deleted_at, deleted_by")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(100),
    admin.from("team_conversations")
      .select("id, name, type, deleted_at, deleted_by")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(50),
    admin.from("team_messages")
      .select("id, content, sender_email, sender_name, conversation_id, deleted_at, deleted_by")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(100),
    admin.from("client_conversations")
      .select("id, client_id, deleted_at, deleted_by")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(50),
    admin.from("client_messages")
      .select("id, content, sender_email, sender_name, conversation_id, deleted_at, deleted_by")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(100),
  ]);

  // Get client names for items that have client_id
  const clientIds = new Set<string>();
  [cards.data, messages.data, resources.data, clientConvos.data].forEach((arr) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    arr?.forEach((item: any) => { if (item.client_id) clientIds.add(item.client_id); });
  });

  let clientMap: Record<string, string> = {};
  if (clientIds.size > 0) {
    const { data: clientsData } = await admin
      .from("clients")
      .select("id, name")
      .in("id", Array.from(clientIds));
    if (clientsData) {
      clientMap = Object.fromEntries(clientsData.map((c) => [c.id, c.name]));
    }
  }

  // Normalize all items into a unified format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = [];

  cards.data?.forEach((c) => items.push({
    id: c.id, type: "card", table: "kanban_cards",
    label: c.title || "Untitled card",
    client_id: c.client_id, client_name: clientMap[c.client_id] || null,
    deleted_at: c.deleted_at, deleted_by: c.deleted_by,
    meta: c.platform ? `${c.platform} · ${c.column_id}` : c.column_id,
  }));

  messages.data?.forEach((m) => items.push({
    id: m.id, type: "message", table: "messages",
    label: (m.content || "").substring(0, 80) || "Empty message",
    client_id: m.client_id, client_name: clientMap[m.client_id] || null,
    deleted_at: m.deleted_at, deleted_by: m.deleted_by,
    meta: `from ${m.sender_name || m.sender_type}`,
  }));

  resources.data?.forEach((r) => items.push({
    id: r.id, type: "resource", table: "resources",
    label: r.name || "Untitled resource",
    client_id: r.client_id, client_name: clientMap[r.client_id] || null,
    deleted_at: r.deleted_at, deleted_by: r.deleted_by,
    meta: r.category || r.type || null,
  }));

  teamConvos.data?.forEach((tc) => items.push({
    id: tc.id, type: "team_conversation", table: "team_conversations",
    label: tc.name || "Team conversation",
    client_id: null, client_name: null,
    deleted_at: tc.deleted_at, deleted_by: tc.deleted_by,
    meta: tc.type || "conversation",
  }));

  teamMsgs.data?.forEach((tm) => items.push({
    id: tm.id, type: "team_message", table: "team_messages",
    label: (tm.content || "").substring(0, 80) || "Empty message",
    client_id: null, client_name: null,
    deleted_at: tm.deleted_at, deleted_by: tm.deleted_by,
    meta: `from ${tm.sender_name || tm.sender_email}`,
  }));

  clientConvos.data?.forEach((cc) => items.push({
    id: cc.id, type: "client_conversation", table: "client_conversations",
    label: "Client conversation",
    client_id: cc.client_id, client_name: clientMap[cc.client_id] || null,
    deleted_at: cc.deleted_at, deleted_by: cc.deleted_by,
    meta: "conversation",
  }));

  clientMsgs.data?.forEach((cm) => items.push({
    id: cm.id, type: "client_message", table: "client_messages",
    label: (cm.content || "").substring(0, 80) || "Empty message",
    client_id: null, client_name: null,
    deleted_at: cm.deleted_at, deleted_by: cm.deleted_by,
    meta: `from ${cm.sender_name || cm.sender_email}`,
  }));

  // Sort all items by deleted_at descending
  items.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

  return NextResponse.json(items);
}
