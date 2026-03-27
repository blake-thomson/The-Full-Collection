import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendTeamInvite } from "@/lib/resend";
import { requireTeamMember } from "@/lib/auth-helpers";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Only team members can send invites
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const { name, email, role, inviterName } = await req.json();
  if (!name || !email || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!["admin", "editor", "social_media_manager"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // 8 bytes = 64-bit entropy — brute force infeasible even without rate limiting
  const code = crypto.randomBytes(8).toString("hex").toUpperCase();

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
