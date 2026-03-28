import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/cron/purge-trash
 *
 * Permanently deletes soft-deleted items older than 30 days.
 * Intended to be called by a cron job (e.g., Vercel Cron, external scheduler).
 *
 * Requires a CRON_SECRET header for authorization.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret — Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const secret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const results = {
    kanban_cards: 0,
    messages: 0,
    resources: 0,
  };

  // Purge old soft-deleted kanban cards
  const { data: cards } = await supabase
    .from("kanban_cards")
    .delete()
    .lt("deleted_at", cutoff)
    .not("deleted_at", "is", null)
    .select("id");
  results.kanban_cards = cards?.length || 0;

  // Purge old soft-deleted messages
  const { data: msgs } = await supabase
    .from("messages")
    .delete()
    .lt("deleted_at", cutoff)
    .not("deleted_at", "is", null)
    .select("id");
  results.messages = msgs?.length || 0;

  // Purge old soft-deleted resources
  const { data: res } = await supabase
    .from("resources")
    .delete()
    .lt("deleted_at", cutoff)
    .not("deleted_at", "is", null)
    .select("id");
  results.resources = res?.length || 0;

  const total = results.kanban_cards + results.messages + results.resources;

  return NextResponse.json({
    success: true,
    purged: total,
    details: results,
    cutoff,
  });
}
