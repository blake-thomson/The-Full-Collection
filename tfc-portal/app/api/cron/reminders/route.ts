import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/cron/reminders
 *
 * Automated reminder system that runs daily:
 * 1. Overdue content — cards past due_date that aren't published
 * 2. Stale cards — cards in "editing" for 5+ days with no update
 * 3. Pending review — cards in "ready_review" for 3+ days (remind client)
 *
 * Creates in-app notifications for the relevant users.
 * Intended to be called by a cron job.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret — Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const secret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const notifications: Array<{
    recipient_email: string;
    recipient_type: string;
    title: string;
    message: string;
    type: string;
    link?: string;
  }> = [];

  // 1. Overdue content: cards past due_date not in published/scheduled
  const { data: overdueCards } = await supabase
    .from("kanban_cards")
    .select("id, title, client_id, due_date, assigned_editor")
    .lt("due_date", today)
    .not("column_id", "in", '("published","scheduled")')
    .is("deleted_at", null);

  if (overdueCards && overdueCards.length > 0) {
    // Get assigned team members for each client
    const clientIds = [...new Set(overdueCards.map((c) => c.client_id))];
    const { data: assignments } = await supabase
      .from("client_assignments")
      .select("client_id, team_member_email")
      .in("client_id", clientIds);

    const assignmentMap = new Map<string, string[]>();
    assignments?.forEach((a) => {
      const list = assignmentMap.get(a.client_id) || [];
      list.push(a.team_member_email);
      assignmentMap.set(a.client_id, list);
    });

    for (const card of overdueCards) {
      const teamEmails = assignmentMap.get(card.client_id) || [];
      // Notify assigned editor first, then all assigned team members
      const recipients = card.assigned_editor
        ? [card.assigned_editor, ...teamEmails.filter((e) => e !== card.assigned_editor)]
        : teamEmails;

      for (const email of [...new Set(recipients)]) {
        notifications.push({
          recipient_email: email,
          recipient_type: "team",
          title: "Overdue Content",
          message: `"${card.title}" was due ${card.due_date} and is not yet published.`,
          type: "content_update",
        });
      }
    }
  }

  // 2. Stale editing cards: in "editing" column with no update for 5+ days
  const { data: staleCards } = await supabase
    .from("kanban_cards")
    .select("id, title, client_id, assigned_editor, updated_at")
    .eq("column_id", "editing")
    .lt("updated_at", fiveDaysAgo)
    .is("deleted_at", null);

  if (staleCards) {
    for (const card of staleCards) {
      if (card.assigned_editor) {
        notifications.push({
          recipient_email: card.assigned_editor,
          recipient_type: "team",
          title: "Stale Edit",
          message: `"${card.title}" has been in Editing for 5+ days with no updates.`,
          type: "content_update",
        });
      }
    }
  }

  // 3. Pending review for 3+ days: nudge the client
  const { data: pendingReview } = await supabase
    .from("kanban_cards")
    .select("id, title, client_id, updated_at")
    .eq("column_id", "ready_review")
    .lt("updated_at", threeDaysAgo)
    .is("deleted_at", null);

  if (pendingReview) {
    const clientIds = [...new Set(pendingReview.map((c) => c.client_id))];
    const { data: clients } = await supabase
      .from("clients")
      .select("id, email")
      .in("id", clientIds);

    const clientEmailMap = new Map<string, string>();
    clients?.forEach((c) => clientEmailMap.set(c.id, c.email));

    for (const card of pendingReview) {
      const clientEmail = clientEmailMap.get(card.client_id);
      if (clientEmail) {
        notifications.push({
          recipient_email: clientEmail,
          recipient_type: "client",
          title: "Review Reminder",
          message: `"${card.title}" has been waiting for your review for 3+ days. Please check and approve or request revisions.`,
          type: "content_update",
        });
      }
    }
  }

  // Batch insert all notifications
  let created = 0;
  if (notifications.length > 0) {
    const { data } = await supabase
      .from("notifications")
      .insert(notifications)
      .select("id");
    created = data?.length || 0;
  }

  return NextResponse.json({
    success: true,
    reminders_created: created,
    breakdown: {
      overdue: overdueCards?.length || 0,
      stale_editing: staleCards?.length || 0,
      pending_review: pendingReview?.length || 0,
    },
  });
}
