import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

// GET /api/client-assignments/mine
// Returns all client IDs the current team member is assigned to.
export async function GET() {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, admin);
  if (!access.ok) return access.response;

  const { data, error } = await admin
    .from("client_assignments")
    .select("client_id")
    .eq("team_member_email", user.email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data || []).map((a) => a.client_id));
}
