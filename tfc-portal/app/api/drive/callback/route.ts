import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerSupabase } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { encryptJson } from "@/lib/crypto";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  "https://portal.thefullcollection.com",
].filter(Boolean);

// GET — handle OAuth callback, exchange code for tokens, encrypt and store in DB
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

  // Validate the origin is one of our known domains
  if (!ALLOWED_ORIGINS.includes(origin)) {
    console.error("OAuth callback from unexpected origin:", origin);
    return NextResponse.redirect(new URL("/dashboard?tab=files&drive_error=invalid_origin", req.url));
  }

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

    // Encrypt before storing — never write plaintext OAuth tokens to the DB
    const encrypted = encryptJson(tokenData);

    const admin = createSupabaseAdmin();
    await admin
      .from("clients")
      .update({ google_drive_token: encrypted })
      .eq("email", user.email);

    return NextResponse.redirect(new URL("/dashboard?tab=files", req.url));
  } catch (err) {
    console.error("Google OAuth token exchange error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?tab=files&drive_error=token_exchange_failed", req.url)
    );
  }
}
