import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

// PATCH /api/cards/[cardId]/comments/[commentId] — toggle resolved
export async function PATCH(
  req: NextRequest,
  { params }: { params: { cardId: string; commentId: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  // Only team members can resolve comments
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) {
    return NextResponse.json(
      { error: "Only team members can resolve comments" },
      { status: 403 }
    );
  }

  const { resolved } = await req.json();
  if (typeof resolved !== "boolean") {
    return NextResponse.json(
      { error: "resolved (boolean) is required" },
      { status: 400 }
    );
  }

  const { data, error } = await admin
    .from("card_comments")
    .update({ resolved })
    .eq("id", params.commentId)
    .eq("card_id", params.cardId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
