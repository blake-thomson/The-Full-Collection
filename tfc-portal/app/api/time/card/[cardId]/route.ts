import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, admin);
  if (!access.ok) return access.response;

  const { cardId } = params;

  const { data: entries, error } = await admin
    .from("time_entries")
    .select("*")
    .eq("card_id", cardId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totalSeconds = (entries || [])
    .filter((e: any) => e.duration_seconds != null)
    .reduce((sum: number, e: any) => sum + e.duration_seconds, 0);

  return NextResponse.json({ entries: entries || [], totalSeconds });
}
