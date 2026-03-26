import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendTeamInvite } from "@/lib/resend";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, role, inviterName } = await req.json();
  if (!name || !email || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!["admin", "editor"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  const supabase = createSupabaseAdmin();

  const { error } = await supabase.from("team_invites").insert({
    code,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    role,
    invited_by: inviterName || "Owner",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send invite email
  try {
    await sendTeamInvite({
      to: email.trim().toLowerCase(),
      name: name.trim(),
      inviterName: inviterName || "The Full Collection",
      role,
      code,
    });
  } catch {
    // Email send failure shouldn't block invite creation
  }

  return NextResponse.json({ code, name, email, role });
}
