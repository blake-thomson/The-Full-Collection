import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerSupabase } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";

// GET — handle OAuth callback, exchange code for tokens, store in DB
export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(new URL("/dashboard?tab=files&drive_error=consent_denied", req.url));
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/drive/callback`;

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  try {
    const { tokens } = await oauth2.getToken(code);

    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    };

    const admin = createSupabaseAdmin();
    await admin
      .from("clients")
      .update({ google_drive_token: tokenData })
      .eq("email", user.email);

    return NextResponse.redirect(new URL("/dashboard?tab=files", req.url));
  } catch (err) {
    console.error("Google OAuth token exchange error:", err);
    return NextResponse.redirect(new URL("/dashboard?tab=files&drive_error=token_exchange_failed", req.url));
  }
}
