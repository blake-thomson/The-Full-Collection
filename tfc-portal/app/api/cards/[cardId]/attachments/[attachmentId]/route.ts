import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";

async function verifyAccess(admin: ReturnType<typeof createSupabaseAdmin>, email: string, cardId: string) {
  const { data: card } = await admin
    .from("kanban_cards")
    .select("client_id")
    .eq("id", cardId)
    .is("deleted_at", null)
    .single();

  if (!card) return { ok: false as const, status: 404, error: "Card not found" };

  const [teamRes, clientRes] = await Promise.all([
    admin.from("team_members").select("id").eq("email", email).maybeSingle(),
    admin.from("clients").select("id").eq("email", email).eq("id", card.client_id).maybeSingle(),
  ]);

  if (!teamRes.data && !clientRes.data) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const };
}

// PATCH — update label, is_final, or notes
export async function PATCH(
  req: NextRequest,
  { params }: { params: { cardId: string; attachmentId: string } }
) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { cardId, attachmentId } = params;

  const access = await verifyAccess(admin, user.email!, cardId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.label !== undefined) updates.label = body.label;
  if (body.isFinal !== undefined) updates.is_final = body.isFinal;
  if (body.notes !== undefined) updates.version_notes = body.notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("card_attachments")
    .update(updates)
    .eq("id", attachmentId)
    .eq("card_id", cardId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Attachment not found" }, { status: 404 });

  return NextResponse.json(data);
}

// DELETE — remove attachment record (not the Drive file)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { cardId: string; attachmentId: string } }
) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { cardId, attachmentId } = params;

  const access = await verifyAccess(admin, user.email!, cardId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const { error } = await admin
    .from("card_attachments")
    .delete()
    .eq("id", attachmentId)
    .eq("card_id", cardId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
