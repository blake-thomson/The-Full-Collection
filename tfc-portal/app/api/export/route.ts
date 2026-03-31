import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { requireClientAccess } from "@/lib/auth-helpers";
import { COLUMNS } from "@/lib/constants";

/**
 * GET /api/export?client_id=xxx&format=csv
 *
 * Export kanban cards as CSV for download.
 */
export async function GET(req: NextRequest) {
  const supabaseServer = createServerSupabase();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("client_id");
  const format = searchParams.get("format") || "csv";

  if (!clientId) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const access = await requireClientAccess(user.email, clientId, admin);
  if (!access.ok) return access.response;

  // Fetch all non-deleted cards
  const { data: cards, error } = await admin
    .from("kanban_cards")
    .select("*")
    .eq("client_id", clientId)
    .is("deleted_at", null)
    .order("column_id")
    .order("position");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }

  const columnMap = new Map(COLUMNS.map((c) => [c.id, c.label]));

  if (format === "csv") {
    const headers = [
      "Title",
      "Status",
      "Platform",
      "Content Style",
      "Content Type",
      "Priority",
      "Assigned Editor",
      "Due Date",
      "Shoot Date",
      "Edit Deadline",
      "Publish Date",
      "Shoot Location",
      "Reference URL",
      "Unedited URL",
      "Edited Video URL",
      "Created",
    ];

    const rows = (cards || []).map((card) => [
      escapeCsv(card.title || ""),
      escapeCsv(columnMap.get(card.column_id) || card.column_id),
      escapeCsv(card.platform || ""),
      escapeCsv(card.content_style || ""),
      escapeCsv(card.content_type || ""),
      escapeCsv(card.priority || ""),
      escapeCsv(card.assigned_editor || ""),
      escapeCsv(card.due_date || ""),
      escapeCsv(card.shoot_date || ""),
      escapeCsv(card.edit_deadline || ""),
      escapeCsv(card.publish_date || ""),
      escapeCsv(card.shoot_location || ""),
      escapeCsv(card.reference_url || ""),
      escapeCsv(card.unedited_url || ""),
      escapeCsv(card.edited_video_url || ""),
      escapeCsv(card.created_at ? new Date(card.created_at).toLocaleDateString() : ""),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="content-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  if (format === "json") {
    // Full data export — all client data as JSON
    const exportData: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      client_id: clientId,
    };

    // Client profile
    const { data: client } = await admin
      .from("clients")
      .select("name, email, phone, address, subscription_tier, subscription_status, onboarding_complete, created_at")
      .eq("id", clientId)
      .single();
    exportData.client = client;

    // Cards
    exportData.cards = cards || [];

    // Comments for all cards
    if (cards && cards.length > 0) {
      const cardIds = cards.map((c: { id: string }) => c.id);
      const { data: comments } = await admin
        .from("card_comments")
        .select("id, card_id, author_name, author_email, content, created_at")
        .in("card_id", cardIds)
        .order("created_at", { ascending: true });
      exportData.comments = comments || [];
    }

    // Activity log
    const { data: activity } = await admin
      .from("activity_log")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(500);
    exportData.activity = activity || [];

    // Resources
    const { data: resources } = await admin
      .from("resources")
      .select("id, name, type, url, description, category, created_at, deleted_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    exportData.resources = resources || [];

    const json = JSON.stringify(exportData, null, 2);
    const clientName = client?.name || "client";
    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${clientName.replace(/[^a-zA-Z0-9]/g, "_")}_export_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  // Fallback: return cards as JSON
  return NextResponse.json(cards);
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
