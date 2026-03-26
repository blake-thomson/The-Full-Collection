import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { sendPasswordReset } from "@/lib/resend";

// POST /api/auth/reset-password — send a password reset email
export async function POST(req: NextRequest) {
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

  // Send the reset email via Resend
  try {
    await sendPasswordReset({
      to: emailLower,
      resetLink,
    });
  } catch (emailError) {
    return NextResponse.json(
      { error: "Failed to send reset email" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Password reset email sent",
  });
}
