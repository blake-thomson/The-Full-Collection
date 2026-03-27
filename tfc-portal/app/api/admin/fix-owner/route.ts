import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

/**
 * ONE-TIME endpoint to create the owner auth account.
 * Protected by a secret token. Delete this file after use.
 *
 * POST /api/admin/fix-owner
 * Body: { secret: "tfc-fix-2024", email: "blake@thefullcollection.com", password: "your-new-password" }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { secret, email, password } = body;

  // Simple secret guard — prevents abuse
  if (secret !== "tfc-fix-2024") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "email and password (min 6 chars) required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Check if auth user already exists
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existingAuth = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let authUserId: string;

  if (existingAuth) {
    // Update password on existing account
    const { error } = await admin.auth.admin.updateUserById(existingAuth.id, {
      password,
      email_confirm: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    authUserId = existingAuth.id;
  } else {
    // Create new auth account
    const { data, error } = await admin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    authUserId = data.user.id;
  }

  // Ensure they exist in team_members as owner
  const { data: existing } = await admin
    .from("team_members")
    .select("id, role")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!existing) {
    await admin.from("team_members").insert({
      name: "Blake",
      email: email.toLowerCase(),
      role: "owner",
    });
  } else if (existing.role !== "owner") {
    await admin.from("team_members").update({ role: "owner" }).eq("email", email.toLowerCase());
  }

  return NextResponse.json({
    success: true,
    message: `Auth account ${existingAuth ? "updated" : "created"} for ${email}. You can now log in at /team/login.`,
    note: "Delete /app/api/admin/fix-owner/route.ts after logging in.",
  });
}
