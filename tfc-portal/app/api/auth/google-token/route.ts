import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerSupabase } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { decryptJson, encryptJson, isEncrypted, type EncryptedValue } from "@/lib/crypto";

interface DriveToken {
  access_token: string;
  refresh_token: string;
  expiry_date?: number;
}

export async function GET() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();

  // Check team_members first, then clients
  const { data: member } = await admin
    .from("team_members")
    .select("google_drive_token")
    .eq("email", user.email!)
    .maybeSingle();

  let raw = member?.google_drive_token;
  let table: "team_members" | "clients" = "team_members";

  if (!raw) {
    const { data: client } = await admin
      .from("clients")
      .select("google_drive_token")
      .eq("email", user.email!)
      .maybeSingle();

    raw = client?.google_drive_token;
    table = "clients";
  }

  if (!raw) {
    return NextResponse.json({ error: "not_connected" }, { status: 200 });
  }

  // Decrypt — handle both encrypted and legacy plaintext
  let token: DriveToken | null;
  if (isEncrypted(raw)) {
    token = decryptJson<DriveToken>(raw as EncryptedValue);
  } else {
    token = raw as DriveToken;
  }

  if (!token?.access_token) {
    return NextResponse.json({ error: "not_connected" }, { status: 200 });
  }

  // Check if token is expired (with 5 min buffer)
  const isExpired = token.expiry_date && token.expiry_date < Date.now() + 5 * 60 * 1000;

  if (isExpired && token.refresh_token) {
    try {
      const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2.setCredentials({ refresh_token: token.refresh_token });
      const { credentials } = await oauth2.refreshAccessToken();

      const merged: DriveToken = {
        access_token: credentials.access_token!,
        refresh_token: token.refresh_token,
        expiry_date: credentials.expiry_date ?? undefined,
      };

      const encrypted = encryptJson(merged);
      await admin
        .from(table)
        .update({ google_drive_token: encrypted })
        .eq("email", user.email!);

      return NextResponse.json({ accessToken: merged.access_token });
    } catch (err) {
      console.error("Token refresh failed:", err);
      return NextResponse.json({ error: "not_connected" }, { status: 200 });
    }
  }

  return NextResponse.json({ accessToken: token.access_token });
}
