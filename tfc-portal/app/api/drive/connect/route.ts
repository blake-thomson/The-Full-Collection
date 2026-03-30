import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET — redirect user to Google OAuth consent screen
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
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

    const authUrl = oauth2.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("Drive connect error:", err);
    return NextResponse.redirect(new URL("/dashboard?tab=files&drive_error=connect_failed", req.url));
  }
}
