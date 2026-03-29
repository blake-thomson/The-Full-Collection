import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();

  const { entryId } = await req.json();
  if (!entryId) return NextResponse.json({ error: "entryId required" }, { status: 400 });

  // Fetch the entry — only the owner can stop it
  const { data: entry } = await admin
    .from("time_entries")
    .select("*")
    .eq("id", entryId)
    .single();

  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  if (entry.team_member_email !== user.email) {
    return NextResponse.json({ error: "Only the entry owner can stop it" }, { status: 403 });
  }
  if (entry.ended_at) {
    return NextResponse.json({ error: "Timer already stopped" }, { status: 400 });
  }

  const now = new Date();
  const startedAt = new Date(entry.started_at);
  const durationSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000);

  const { data: updated, error } = await admin
    .from("time_entries")
    .update({ ended_at: now.toISOString(), duration_seconds: durationSeconds })
    .eq("id", entryId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(updated);
}
