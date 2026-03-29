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

  // 4. Approaching shoot dates: shoot_date is tomorrow or in 2 days
  const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const twoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: upcomingShoots } = await supabase
    .from("kanban_cards")
    .select("id, title, client_id, shoot_date, assigned_editor")
    .in("shoot_date", [tomorrow, twoDays])
    .is("deleted_at", null);

  if (upcomingShoots) {
    const clientIds = [...new Set(upcomingShoots.map((c) => c.client_id))];
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

    for (const card of upcomingShoots) {
      const isT = card.shoot_date === tomorrow;
      const teamEmails = assignmentMap.get(card.client_id) || [];
      const recipients = card.assigned_editor
        ? [card.assigned_editor, ...teamEmails.filter((e: string) => e !== card.assigned_editor)]
        : teamEmails;

      for (const email of [...new Set(recipients)]) {
        notifications.push({
          recipient_email: email,
          recipient_type: "team",
          title: isT ? "Shoot Tomorrow" : "Shoot in 2 Days",
          message: `"${card.title}" has a shoot scheduled for ${card.shoot_date}.`,
          type: "shoot_date",
          link: `/team/portal?card=${card.id}`,
        });
      }
    }
  }

  // 5. Approaching edit deadlines: edit_deadline is tomorrow
  const { data: upcomingEdits } = await supabase
    .from("kanban_cards")
    .select("id, title, client_id, edit_deadline, assigned_editor")
    .eq("edit_deadline", tomorrow)
    .not("column_id", "in", '("published","scheduled","approved","ready_review")')
    .is("deleted_at", null);

  if (upcomingEdits) {
    for (const card of upcomingEdits) {
      if (card.assigned_editor) {
        notifications.push({
          recipient_email: card.assigned_editor,
          recipient_type: "team",
          title: "Edit Deadline Tomorrow",
          message: `"${card.title}" has an edit deadline of ${card.edit_deadline}. Please submit for review.`,
          type: "content_update",
          link: `/team/portal?card=${card.id}`,
        });
      }
    }
  }

  // 6. Approaching publish dates: publish_date is tomorrow — notify social media manager + admins
  const { data: upcomingPublish } = await supabase
    .from("kanban_cards")
    .select("id, title, client_id, publish_date")
    .eq("publish_date", tomorrow)
    .not("column_id", "eq", "published")
    .is("deleted_at", null);

  if (upcomingPublish && upcomingPublish.length > 0) {
    const { data: managers } = await supabase
      .from("team_members")
      .select("email")
      .in("role", ["social_media_manager", "admin", "owner"]);

    if (managers) {
      for (const card of upcomingPublish) {
        for (const m of managers) {
          notifications.push({
            recipient_email: m.email,
            recipient_type: "team",
            title: "Publish Date Tomorrow",
            message: `"${card.title}" is scheduled to publish ${card.publish_date}.`,
            type: "content_update",
            link: `/team/portal?card=${card.id}`,
          });
        }
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
      upcoming_shoots: upcomingShoots?.length || 0,
      upcoming_edit_deadlines: upcomingEdits?.length || 0,
      upcoming_publish: upcomingPublish?.length || 0,
    },
  });
}
