import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, getClientIp, INVITE_RATE_LIMIT, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`invite-validate:${ip}`, INVITE_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);

  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: invite, error } = await supabase
    .from("team_invites")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: "Invalid invite code. Check your email and try again." }, { status: 404 });
  }
  if (invite.used) {
    return NextResponse.json({ error: "This invite has already been used." }, { status: 400 });
  }

  return NextResponse.json({ email: invite.email, name: invite.name, role: invite.role });
}
