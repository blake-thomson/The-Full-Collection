import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { sendPasswordReset } from "@/lib/resend";
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT, rateLimitResponse } from "@/lib/rate-limit";

// POST /api/auth/reset-password — send a password reset email
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`reset-password:${ip}`, AUTH_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const emailLower = email.trim().toLowerCase();

  // Use Supabase Auth to generate a password reset link
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: emailLower,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The generated link contains hashed_token etc. Build the reset URL.
  const resetLink = data?.properties?.action_link;

  if (!resetLink) {
    return NextResponse.json(
      { error: "Failed to generate reset link" },
      { status: 500 }
    );
  }

  // Send the reset email via Resend (best-effort)
  let emailSent = false;
  try {
    await sendPasswordReset({
      to: emailLower,
      resetLink,
    });
    emailSent = true;
  } catch {
    // Email send failed — return the link directly so the user can still reset
  }

  return NextResponse.json({
    success: true,
    message: emailSent ? "Password reset email sent" : "Email send failed — use the link below to reset your password.",
    resetLink: emailSent ? undefined : resetLink,
  });
}
