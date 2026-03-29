import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerSupabase } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { encryptJson } from "@/lib/crypto";

// GET — handle OAuth callback, exchange code for tokens, encrypt and store in DB
export async function GET(req: NextRequest) {
  try {
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

    const origin = req.headers.get("x-forwarded-host")
      ? `https://${req.headers.get("x-forwarded-host")}`
      : new URL(req.url).origin;
    const redirectUri = `${origin}/api/drive/callback`;

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2.getToken(code);

    const tokenData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    };

    const encrypted = encryptJson(tokenData);
    const admin = createSupabaseAdmin();

    // Try to store in clients table first, then team_members
    const { data: clientRow } = await admin
      .from("clients")
      .select("id")
      .eq("email", user.email!)
      .single();

    if (clientRow) {
      await admin
        .from("clients")
        .update({ google_drive_token: encrypted })
        .eq("email", user.email!);
      return NextResponse.redirect(new URL("/dashboard?tab=files", req.url));
    }

    // Must be a team member
    await admin
      .from("team_members")
      .update({ google_drive_token: encrypted })
      .eq("email", user.email!);
    return NextResponse.redirect(new URL("/team/portal?tab=files", req.url));
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard?tab=files&drive_error=token_exchange_failed", req.url)
    );
  }
}
