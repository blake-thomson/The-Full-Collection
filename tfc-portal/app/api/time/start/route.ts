import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, admin);
  if (!access.ok) return access.response;

  const { cardId } = await req.json();
  if (!cardId) return NextResponse.json({ error: "cardId required" }, { status: 400 });

  // Get team member name
  const { data: member } = await admin
    .from("team_members")
    .select("name")
    .eq("email", user.email!)
    .single();

  if (!member) return NextResponse.json({ error: "Team member not found" }, { status: 404 });

  // Check for any running timer by this user — stop it first
  const { data: running } = await admin
    .from("time_entries")
    .select("id, started_at")
    .eq("team_member_email", user.email!)
    .is("ended_at", null)
    .limit(1)
    .maybeSingle();

  if (running) {
    const now = new Date();
    const startedAt = new Date(running.started_at);
    const durationSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000);

    await admin
      .from("time_entries")
      .update({ ended_at: now.toISOString(), duration_seconds: durationSeconds })
      .eq("id", running.id);
  }

  // Start new timer
  const { data: entry, error } = await admin
    .from("time_entries")
    .insert({
      card_id: cardId,
      team_member_email: user.email!,
      team_member_name: member.name,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(entry);
}
