import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerSupabase } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { encryptJson, decryptJson, isEncrypted, type EncryptedValue } from "@/lib/crypto";

interface DriveToken {
  access_token: string;
  refresh_token: string;
  expiry_date?: number;
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
}

// GET — list files using per-user OAuth token
export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data: client } = await admin
    .from("clients")
    .select("google_drive_token")
    .eq("email", user.email)
    .single();

  if (!client?.google_drive_token) {
    return NextResponse.json({ connected: false });
  }

  // Decrypt token — handle both encrypted (new) and legacy plaintext (old) values
  let token: DriveToken | null;
  if (isEncrypted(client.google_drive_token)) {
    token = decryptJson<DriveToken>(client.google_drive_token as EncryptedValue);
  } else {
    // Legacy plaintext — decrypt on next write, use as-is for now
    token = client.google_drive_token as DriveToken;
  }

  if (!token?.access_token) {
    return NextResponse.json({ connected: false });
  }

  const oauth2 = getOAuth2Client();
  oauth2.setCredentials(token);

  // Persist refreshed access tokens (encrypted)
  oauth2.on("tokens", async (newTokens) => {
    const merged = { ...token, ...newTokens };
    const encrypted = encryptJson(merged);
    await admin
      .from("clients")
      .update({ google_drive_token: encrypted })
      .eq("email", user.email);
  });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folder_id") || "root";
  const search = searchParams.get("search");
  const pageToken = searchParams.get("page_token");

  try {
    const drive = google.drive({ version: "v3", auth: oauth2 });

    let query = `'${folderId}' in parents and trashed = false`;
    if (search) {
      // Safely escape single quotes in the search term
      const escaped = search.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      query = `name contains '${escaped}' and trashed = false`;
    }

    const response = await drive.files.list({
      q: query,
      fields:
        "nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents, owners)",
      orderBy: "modifiedTime desc",
      pageSize: 50,
      pageToken: pageToken || undefined,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = (response.data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size ? parseInt(f.size) : 0,
      createdTime: f.createdTime,
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink,
      webContentLink: f.webContentLink,
      iconLink: f.iconLink,
      thumbnailLink: f.thumbnailLink,
      isFolder: f.mimeType === "application/vnd.google-apps.folder",
      parents: f.parents,
      owner: f.owners?.[0]?.displayName || "",
    }));

    return NextResponse.json({
      connected: true,
      files,
      nextPageToken: response.data.nextPageToken || null,
      folderId,
    });
  } catch (err: unknown) {
    console.error("Drive API error:", err);
    if (
      err instanceof Error &&
      (err.message.includes("invalid_grant") ||
        err.message.includes("Token has been expired or revoked"))
    ) {
      await admin
        .from("clients")
        .update({ google_drive_token: null })
        .eq("email", user.email);
      return NextResponse.json({ connected: false });
    }
    const message = err instanceof Error ? err.message : "Failed to access Google Drive";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — disconnect Google Drive (clear stored token)
export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("clients")
    .update({ google_drive_token: null })
    .eq("email", user.email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
