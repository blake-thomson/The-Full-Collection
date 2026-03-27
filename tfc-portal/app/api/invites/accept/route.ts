import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { code, name } = await req.json();
  if (!code || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Atomically claim the invite: update WHERE used=false, returns nothing if already used
  const { data: invite, error: claimErr } = await supabase
    .from("team_invites")
    .update({ used: true })
    .eq("code", code.trim().toUpperCase())
    .eq("used", false)
    .select()
    .maybeSingle();

  if (claimErr) {
    return NextResponse.json({ error: "Failed to validate invite." }, { status: 500 });
  }

  if (!invite) {
    // Either code doesn't exist or was already used — don't distinguish to prevent enumeration
    return NextResponse.json({ error: "Invalid or already used invite code." }, { status: 400 });
  }

  // Insert team member (invite is now atomically marked as used)
  const { error: insertErr } = await supabase.from("team_members").insert({
    name: name.trim(),
    email: invite.email,
    role: invite.role,
    invited_by: invite.invited_by,
  });

  if (insertErr) {
    // Roll back: un-claim the invite so it can be retried
    await supabase
      .from("team_invites")
      .update({ used: false })
      .eq("id", invite.id);
    return NextResponse.json({ error: "Failed to create team member." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
