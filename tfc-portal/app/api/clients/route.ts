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

    // Update last_seen_at when a client fetches their own record
    if (emailParam.toLowerCase() === user.email!.toLowerCase()) {
      await supabase
        .from("clients")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("email", emailParam.toLowerCase());
    }

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

  // Create auth user without a password — client will set their own via reset link
  const { error: authError } = await supabase.auth.admin.createUser({
    email: emailLower,
    email_confirm: true,
  });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Insert client record
  const { data: client, error: insertError } = await supabase
    .from("clients")
    .insert({
      name: name.trim(),
      email: emailLower,
      created_by: createdBy || null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Generate a secure password-set link (recovery flow)
  let resetLink: string | undefined;
  try {
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: emailLower,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      },
    });
    resetLink = linkData?.properties?.action_link ?? undefined;
  } catch {
    // Don't block on link generation failure
  }

  // Send welcome email with reset link (never send plaintext passwords)
  try {
    await sendClientWelcome({
      to: emailLower,
      name: name.trim(),
      email: emailLower,
      resetLink,
    });
  } catch {
    // Don't block on email failure
  }

  return NextResponse.json(client);
}
