import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServerSupabase } from "@/lib/supabase-server";

function getDriveClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentials) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");
  }

  const parsed = JSON.parse(credentials);
  const auth = new google.auth.GoogleAuth({
    credentials: parsed,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

// GET — list files in a folder or search
export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folder_id") || process.env.GOOGLE_DRIVE_ROOT_FOLDER || "root";
  const search = searchParams.get("search");
  const pageToken = searchParams.get("page_token");

  try {
    const drive = getDriveClient();

    let query = `'${folderId}' in parents and trashed = false`;
    if (search) {
      query = `name contains '${search.replace(/'/g, "\\'")}' and trashed = false`;
    }

    const response = await drive.files.list({
      q: query,
      fields: "nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents, owners)",
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
      files,
      nextPageToken: response.data.nextPageToken || null,
      folderId,
    });
  } catch (err: unknown) {
    console.error("Drive API error:", err);
    const message = err instanceof Error ? err.message : "Failed to access Google Drive";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
