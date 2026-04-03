import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  // Only owner/admin can update deliverables
  const { data: teamMember } = await admin
    .from("team_members")
    .select("id, role")
    .eq("email", user.email)
    .maybeSingle();
  if (!teamMember || !["owner", "admin"].includes(teamMember.role)) {
    return NextResponse.json({ error: "Forbidden — owner or admin only" }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.short_form_count !== undefined) {
    updates.short_form_count = body.short_form_count;
  }
  if (body.youtube_count !== undefined) {
    updates.youtube_count = body.youtube_count;
  }
  if (body.smm_included !== undefined) {
    updates.smm_included = body.smm_included;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await admin
    .from("clients")
    .update(updates)
    .eq("id", params.clientId);

  if (error) {
    console.error("Failed to update deliverables:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
