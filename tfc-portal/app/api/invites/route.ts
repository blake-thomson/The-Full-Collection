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

  // Only owner/admin can send invites
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const { data: actor } = await supabase
    .from("team_members")
    .select("role")
    .eq("email", user.email!)
    .single();

  if (!actor || !["owner", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only owners and admins can send invites" }, { status: 403 });
  }

  const { name, email, role, inviterName } = await req.json();
  if (!name || !email || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!["admin", "project_manager", "editor", "social_media_manager"].includes(role)) {
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

// DELETE /api/invites — revoke a pending invite (owner/admin only)
export async function DELETE(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  // Only owner/admin can delete invites
  const { data: actor } = await supabase
    .from("team_members")
    .select("role")
    .eq("email", user.email!)
    .single();

  if (!actor || !["owner", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only owners and admins can revoke invites" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing invite id" }, { status: 400 });

  const { error } = await supabase
    .from("team_invites")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
