import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, getClientIp, INVITE_RATE_LIMIT, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`invite-accept:${ip}`, INVITE_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);

  const { code, name, password } = await req.json();
  if (!code || !name?.trim() || !password) {
    return NextResponse.json({ error: "Code, name, and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Atomically claim the invite: update WHERE used=false
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
    return NextResponse.json({ error: "Invalid or already used invite code." }, { status: 400 });
  }

  // Create the Supabase auth user server-side (bypasses email confirmation requirement)
  const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
  });

  if (signUpError && !signUpError.message.includes("already registered")) {
    // Roll back: un-claim the invite
    await supabase.from("team_invites").update({ used: false }).eq("id", invite.id);
    return NextResponse.json({ error: signUpError.message }, { status: 500 });
  }

  // Insert team member record
  const { error: insertErr } = await supabase.from("team_members").insert({
    name: name.trim(),
    email: invite.email,
    role: invite.role,
    invited_by: invite.invited_by,
  });

  if (insertErr) {
    // Roll back: un-claim invite and delete auth user
    await supabase.from("team_invites").update({ used: false }).eq("id", invite.id);
    if (authData?.user?.id) {
      await supabase.auth.admin.deleteUser(authData.user.id);
    }
    return NextResponse.json({ error: "Failed to create team member." }, { status: 500 });
  }

  return NextResponse.json({ email: invite.email });
}
