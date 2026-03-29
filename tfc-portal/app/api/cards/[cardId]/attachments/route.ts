import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";

// GET — list attachments for a card
export async function GET(
  _req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { cardId } = params;

  // Verify card exists and user has access
  const { data: card } = await admin
    .from("kanban_cards")
    .select("client_id")
    .eq("id", cardId)
    .is("deleted_at", null)
    .single();

  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  // Check access: team member or matching client
  const [teamRes, clientRes] = await Promise.all([
    admin.from("team_members").select("id").eq("email", user.email!).maybeSingle(),
    admin.from("clients").select("id").eq("email", user.email!).eq("id", card.client_id).maybeSingle(),
  ]);

  if (!teamRes.data && !clientRes.data) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("card_attachments")
    .select("*")
    .eq("card_id", cardId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create a new attachment
export async function POST(
  req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { cardId } = params;

  // Verify card exists
  const { data: card } = await admin
    .from("kanban_cards")
    .select("client_id")
    .eq("id", cardId)
    .is("deleted_at", null)
    .single();

  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  // Check access
  const [teamRes, clientRes] = await Promise.all([
    admin.from("team_members").select("id, name").eq("email", user.email!).maybeSingle(),
    admin.from("clients").select("id, name").eq("email", user.email!).eq("id", card.client_id).maybeSingle(),
  ]);

  if (!teamRes.data && !clientRes.data) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const linkedByName = teamRes.data?.name || clientRes.data?.name || user.email!;
  const linkedByType = teamRes.data ? "team" : "client";

  const body = await req.json();
  const {
    driveFileId,
    driveFileName,
    driveMimeType,
    driveViewLink,
    driveThumbnailLink,
    driveWebContentLink,
    driveModifiedTime,
    fileSize,
    label,
  } = body;

  if (!driveFileId || !driveFileName) {
    return NextResponse.json({ error: "driveFileId and driveFileName required" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("card_attachments")
    .insert({
      card_id: cardId,
      drive_file_id: driveFileId,
      drive_file_name: driveFileName,
      drive_mime_type: driveMimeType || null,
      drive_view_link: driveViewLink || null,
      drive_thumbnail_link: driveThumbnailLink || null,
      drive_web_content_link: driveWebContentLink || null,
      drive_modified_time: driveModifiedTime || null,
      file_size: fileSize ? parseInt(fileSize) : null,
      label: label || null,
      linked_by: user.email!,
      linked_by_name: linkedByName,
      linked_by_type: linkedByType,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
