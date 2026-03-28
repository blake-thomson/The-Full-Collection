import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendClientWelcome } from "@/lib/resend";
import { requireTeamMember } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const emailParam = req.nextUrl.searchParams.get("email");

  // Self-lookup: a client fetching their own record by email
  if (emailParam) {
    if (emailParam.toLowerCase() !== user.email!.toLowerCase()) {
      // Querying someone else's record — must be a team member
      const access = await requireTeamMember(user.email!, supabase);
      if (!access.ok) return access.response;
    }

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("email", emailParam.toLowerCase());

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // List all clients — team members only
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// PATCH /api/clients — client updates own profile (bio, industry, profile_complete)
export async function PATCH(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.bio !== undefined) updates.bio = body.bio;
  if (body.industry !== undefined) updates.industry = body.industry;
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
  if (body.profile_complete !== undefined) updates.profile_complete = body.profile_complete;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Clients can only update their own record
  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("email", user.email!)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Only owner/admin can create clients
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const { data: actor } = await supabase
    .from("team_members")
    .select("role")
    .eq("email", user.email!)
    .single();

  if (!actor || !["owner", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only owners and admins can create clients" }, { status: 403 });
  }

  const { name, email, createdBy } = await req.json();
  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  const emailLower = email.trim().toLowerCase();

  // Check duplicate
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("email", emailLower)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "A client with this email already exists." }, { status: 400 });
  }

  // Generate a one-time setup code
  const setupCode = generateSetupCode();

  // Insert client record (no auth user yet — created when they activate)
  const { data: client, error: insertError } = await supabase
    .from("clients")
    .insert({
      name: name.trim(),
      email: emailLower,
      created_by: createdBy || null,
      setup_code: setupCode,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Send welcome email with setup code
  try {
    await sendClientWelcome({
      to: emailLower,
      name: name.trim(),
      email: emailLower,
      code: setupCode,
      appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    });
  } catch {
    // Don't block on email failure
  }

  return NextResponse.json(client);
}

function generateSetupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
