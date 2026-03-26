import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { code, name } = await req.json();
  if (!code || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Get the invite
  const { data: invite, error: fetchErr } = await supabase
    .from("team_invites")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (fetchErr || !invite) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 404 });
  }
  if (invite.used) {
    return NextResponse.json({ error: "Invite already used." }, { status: 400 });
  }

  // Create team member
  const { error: insertErr } = await supabase.from("team_members").insert({
    name: name.trim(),
    email: invite.email,
    role: invite.role,
    invited_by: invite.invited_by,
  });
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Mark invite as used
  await supabase
    .from("team_invites")
    .update({ used: true })
    .eq("id", invite.id);

  return NextResponse.json({ success: true });
}
