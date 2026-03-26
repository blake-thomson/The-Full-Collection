import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendClientWelcome } from "@/lib/resend";

export async function GET() {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
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

  const { name, email, password, createdBy } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const emailLower = email.trim().toLowerCase();

  // Check duplicate
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("email", emailLower)
    .single();

  if (existing) {
    return NextResponse.json({ error: "A client with this email already exists." }, { status: 400 });
  }

  // Create Supabase auth user (use admin to skip email confirmation)
  const { error: authError } = await supabase.auth.admin.createUser({
    email: emailLower,
    password,
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

  // Send welcome email
  try {
    await sendClientWelcome({
      to: emailLower,
      name: name.trim(),
      email: emailLower,
      password,
    });
  } catch {
    // Don't block on email failure
  }

  return NextResponse.json(client);
}
