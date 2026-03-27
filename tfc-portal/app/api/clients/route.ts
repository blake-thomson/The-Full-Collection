import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendClientWelcome } from "@/lib/resend";
import { requireTeamMember } from "@/lib/auth-helpers";

export async function GET() {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Only team members can list all clients
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

export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Only team members can create clients
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

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
