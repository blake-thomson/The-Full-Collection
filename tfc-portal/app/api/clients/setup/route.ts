import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const SETUP_RATE_LIMIT = { maxRequests: 10, windowMs: 15 * 60 * 1000 };

// POST /api/clients/setup — validate setup code (returns email, does not create user)
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`setup:${ip}`, SETUP_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);

  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "Setup code is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: client, error } = await supabase
    .from("clients")
    .select("id, email, name, setup_code")
    .eq("setup_code", code.trim().toUpperCase())
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!client) return NextResponse.json({ error: "Invalid or already used setup code." }, { status: 400 });

  return NextResponse.json({ email: client.email, name: client.name });
}

// PATCH /api/clients/setup — activate: create auth user, sign in, clear code
export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`setup-activate:${ip}`, SETUP_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);

  const { code, password } = await req.json();
  if (!code || !password) {
    return NextResponse.json({ error: "Code and password are required." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Look up the client by code
  const { data: client, error: lookupError } = await supabase
    .from("clients")
    .select("id, email, name, setup_code")
    .eq("setup_code", code.trim().toUpperCase())
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!client) return NextResponse.json({ error: "Invalid or already used setup code." }, { status: 400 });

  // Create the Supabase auth user
  const { error: signUpError } = await supabase.auth.admin.createUser({
    email: client.email,
    password,
    email_confirm: true,
  });

  if (signUpError && !signUpError.message.includes("already registered")) {
    return NextResponse.json({ error: signUpError.message }, { status: 500 });
  }

  // Clear the setup code so it can't be reused
  await supabase
    .from("clients")
    .update({ setup_code: null })
    .eq("id", client.id);

  return NextResponse.json({ email: client.email });
}
