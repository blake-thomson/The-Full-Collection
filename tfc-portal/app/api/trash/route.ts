import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

const ALLOWED_TYPES = {
  card: "kanban_cards",
  message: "messages",
  resource: "resources",
} as const;

type ItemType = keyof typeof ALLOWED_TYPES;

function resolveTable(type: string): string | null {
  return ALLOWED_TYPES[type as ItemType] ?? null;
}

// GET /api/trash?client_id=...
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  // Verify the requesting user has access to this client
  const access = await verifyClientAccess(user.email!, clientId, supabase);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [cardsRes, messagesRes, resourcesRes] = await Promise.all([
    supabase.from("kanban_cards").select("*").eq("client_id", clientId).not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
    supabase.from("messages").select("*").eq("client_id", clientId).not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
    supabase.from("resources").select("*").eq("client_id", clientId).not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
  ]);

  return NextResponse.json({
    cards: cardsRes.data || [],
    messages: messagesRes.data || [],
    resources: resourcesRes.data || [],
  });
}

// PATCH /api/trash — restore an item
// Body: { id, type: "card" | "message" | "resource" }
export async function PATCH(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, type } = await req.json();
  if (!id || !type) return NextResponse.json({ error: "id and type required" }, { status: 400 });

  const table = resolveTable(type);
  if (!table) return NextResponse.json({ error: "Invalid type. Must be card, message, or resource." }, { status: 400 });

  const supabase = createSupabaseAdmin();

  // Verify the item belongs to a client the user can access
  const item = await supabase.from(table).select("client_id").eq("id", id).single();
  if (!item.data) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const access = await verifyClientAccess(user.email!, item.data.client_id, supabase);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from(table).update({ deleted_at: null }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE /api/trash?id=...&type=card|message|resource — permanent delete
export async function DELETE(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  const type = req.nextUrl.searchParams.get("type");
  if (!id || !type) return NextResponse.json({ error: "id and type required" }, { status: 400 });

  const table = resolveTable(type);
  if (!table) return NextResponse.json({ error: "Invalid type. Must be card, message, or resource." }, { status: 400 });

  const supabase = createSupabaseAdmin();

  // Verify the item belongs to a client the user can access
  const item = await supabase.from(table).select("client_id").eq("id", id).single();
  if (!item.data) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const access = await verifyClientAccess(user.email!, item.data.client_id, supabase);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// ─── Helper ──────────────────────────────────────────────────────────────────
// Returns true if the user is a team member OR a client whose id matches clientId
async function verifyClientAccess(
  email: string,
  clientId: string,
  supabase: ReturnType<typeof createSupabaseAdmin>
): Promise<boolean> {
  const [teamRes, clientRes] = await Promise.all([
    supabase.from("team_members").select("id").eq("email", email).maybeSingle(),
    supabase.from("clients").select("id").eq("email", email).eq("id", clientId).maybeSingle(),
  ]);
  return !!(teamRes.data || clientRes.data);
}
