/**
 * Notification routing rules for kanban column transitions.
 *
 * When a card moves into a column, this module fires in-app notifications
 * to the right people based on who is assigned to the client.
 *
 * Team targeting uses client_assignments + team_members.role.
 * Client targeting uses the clients.email field directly.
 */

import { createSupabaseAdmin } from "./supabase";
import { sendStatusNotification } from "./resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ColumnId } from "./constants";

type NotificationRule = {
  /** Team member roles to notify (from client_assignments + team_members.role) */
  targetRoles?: string[];
  /** Whether to also notify the client directly */
  notifyClient?: boolean;
  /** When true, filter target roles based on the card's content_type */
  contentTypeAware?: boolean;
  title: (cardTitle: string) => string;
  message: (cardTitle: string) => string;
};

/**
 * Rules are only defined for columns where a transition is meaningful.
 * Columns without a rule (idea, editing) produce no notifications.
 */
const COLUMN_RULES: Partial<Record<ColumnId, NotificationRule>> = {
  filmed: {
    targetRoles: ["project_manager"],
    title: (t) => `Content Filmed`,
    message: (t) => `"${t}" has been filmed and is ready for the next step.`,
  },
  ready_to_edit: {
    targetRoles: ["youtube_editor", "short_form_editor"],
    contentTypeAware: true,
    title: (t) => `Ready for Editing`,
    message: (t) => `"${t}" is ready for editing.`,
  },
  edited_qcc: {
    targetRoles: ["admin", "owner"],
    title: (t) => `Ready for QC Review`,
    message: (t) => `"${t}" has been edited and is ready for quality review.`,
  },
  ready_review: {
    notifyClient: true,
    title: () => `Content Ready for Your Review`,
    message: (t) => `Your content "${t}" is ready for your review. Log in to approve or request changes.`,
  },
  approved: {
    targetRoles: ["social_media_manager"],
    title: (t) => `Approved for Publishing`,
    message: (t) => `"${t}" has been approved and is ready to schedule.`,
  },
  revise: {
    targetRoles: ["youtube_editor", "short_form_editor"],
    contentTypeAware: true,
    title: () => `Revision Requested`,
    message: (t) => `"${t}" has been sent back for revisions.`,
  },
  scheduled: {
    notifyClient: true,
    title: () => `Content Scheduled`,
    message: (t) => `Your content "${t}" has been scheduled for posting.`,
  },
  published: {
    notifyClient: true,
    title: () => `Content is Live!`,
    message: (t) => `"${t}" is now published and live!`,
  },
};

/**
 * Given a card's content_type, return only the editor roles that should
 * receive notifications. Returns both editor types for null / unknown types.
 */
function filterEditorRolesByContentType(
  contentType: string | null
): string[] {
  if (contentType === "long_form") return ["youtube_editor"];
  if (contentType === "short_form" || contentType === "carousel" || contentType === "story")
    return ["short_form_editor"];
  // null, "other", or anything unexpected → notify both
  return ["youtube_editor", "short_form_editor"];
}

/**
 * Fires in-app notifications when a kanban card moves to a new column.
 * Called from the kanban PATCH handler whenever column_id changes.
 * Errors are swallowed — notifications are best-effort and must never
 * block the card update from completing.
 */
export async function triggerKanbanNotifications(
  clientId: string,
  cardTitle: string,
  newColumnId: ColumnId,
  cardId: string
): Promise<void> {
  const rule = COLUMN_RULES[newColumnId];
  if (!rule) return; // No rule defined for this column — nothing to do

  try {
    const admin = createSupabaseAdmin();
    const link = `/dashboard?tab=kanban&card=${cardId}`;
    const title = rule.title(cardTitle);
    const message = rule.message(cardTitle);

    // ── Resolve effective target roles (content-type-aware filtering) ─────────
    let effectiveTargetRoles = rule.targetRoles;
    if (rule.contentTypeAware && effectiveTargetRoles) {
      const { data: card } = await admin
        .from("kanban_cards")
        .select("content_type")
        .eq("id", cardId)
        .maybeSingle();

      effectiveTargetRoles = filterEditorRolesByContentType(card?.content_type ?? null);
    }

    const notifications: Array<{
      recipient_email: string;
      recipient_type: string;
      title: string;
      message: string;
      link: string;
      type: string;
    }> = [];

    // ── Team member notifications ─────────────────────────────────────────────
    if (effectiveTargetRoles && effectiveTargetRoles.length > 0) {
      // Get all team members assigned to this client
      const { data: assignments } = await admin
        .from("client_assignments")
        .select("team_member_email")
        .eq("client_id", clientId);

      if (assignments && assignments.length > 0) {
        const assignedEmails = assignments.map((a) => a.team_member_email);

        // Look up their roles from the team_members table
        const { data: members } = await admin
          .from("team_members")
          .select("email, role")
          .in("email", assignedEmails)
          .in("role", effectiveTargetRoles);

        if (members) {
          for (const member of members) {
            notifications.push({
              recipient_email: member.email,
              recipient_type: "team",
              title,
              message,
              link,
              type: "kanban_move",
            });
          }
        }
      }
    }

    // ── Client notification ───────────────────────────────────────────────────
    if (rule.notifyClient) {
      const { data: client } = await admin
        .from("clients")
        .select("email")
        .eq("id", clientId)
        .maybeSingle();

      if (client?.email) {
        notifications.push({
          recipient_email: client.email,
          recipient_type: "client",
          title,
          message,
          link,
          type: "kanban_move",
        });
      }
    }

    // ── Batch insert all notifications ────────────────────────────────────────
    if (notifications.length > 0) {
      await admin.from("notifications").insert(notifications);
    }

    // ── Email the client for client-facing column transitions ─────────────────
    if (rule.notifyClient) {
      const { data: client } = await admin
        .from("clients")
        .select("email, name")
        .eq("id", clientId)
        .maybeSingle();

      if (client?.email) {
        // Map column IDs to human-readable status labels
        const STATUS_LABELS: Partial<Record<ColumnId, string>> = {
          ready_review: "Ready for Review",
          scheduled: "Scheduled",
          published: "Published",
        };
        const statusLabel = STATUS_LABELS[newColumnId] ?? newColumnId;

        sendStatusNotification({
          to: client.email,
          clientName: client.name ?? client.email,
          contentTitle: cardTitle,
          oldStatus: "",
          newStatus: statusLabel,
        }).catch(() => {}); // Fire-and-forget, never block card update
      }
    }
  } catch (err) {
    // Never block the card update — log and move on
    console.error("kanban-notifications: failed to send notifications", err);
  }
}

/**
 * Fires in-app notifications to videographers and editors assigned to a client
 * when a card's shoot_date is set or updated.
 */
export async function triggerShootDateNotifications(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  clientId: string,
  cardTitle: string,
  shootDate: string,
  cardId: string
): Promise<void> {
  try {
    const formatted = new Date(shootDate).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });

    const { data: assignments } = await supabase
      .from("client_assignments")
      .select("team_member_email")
      .eq("client_id", clientId);

    if (!assignments?.length) return;

    const assignedEmails = assignments.map((a: { team_member_email: string }) => a.team_member_email);

    const { data: members } = await supabase
      .from("team_members")
      .select("email, role")
      .in("email", assignedEmails)
      .in("role", ["videographer"]);

    if (!members?.length) return;

    const notifications = members.map((m: { email: string; role: string }) => ({
      recipient_email: m.email,
      recipient_type: "team",
      title: "Shoot Date Scheduled",
      message: `"${cardTitle}" has a shoot date set for ${formatted}.`,
      link: `/team/portal?card=${cardId}`,
      type: "shoot_date",
    }));

    await supabase.from("notifications").insert(notifications);
  } catch (err) {
    console.error("shoot-date-notifications: failed", err);
  }
}

/**
 * Fires in-app notifications to editors assigned to a client
 * when a card's edit_deadline is set or updated.
 */
export async function triggerEditDeadlineNotifications(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  clientId: string,
  cardTitle: string,
  editDeadline: string,
  cardId: string
): Promise<void> {
  try {
    const formatted = new Date(editDeadline).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });

    const { data: assignments } = await supabase
      .from("client_assignments")
      .select("team_member_email")
      .eq("client_id", clientId);

    if (!assignments?.length) return;

    const assignedEmails = assignments.map((a: { team_member_email: string }) => a.team_member_email);

    // Fetch card content_type for editor role filtering
    const { data: card } = await supabase
      .from("kanban_cards")
      .select("content_type")
      .eq("id", cardId)
      .maybeSingle();

    const editorRoles = filterEditorRolesByContentType(card?.content_type ?? null);

    const { data: members } = await supabase
      .from("team_members")
      .select("email, role")
      .in("email", assignedEmails)
      .in("role", editorRoles);

    if (!members?.length) return;

    const notifications = members.map((m: { email: string; role: string }) => ({
      recipient_email: m.email,
      recipient_type: "team",
      title: "Edit Deadline Set",
      message: `"${cardTitle}" has an edit deadline of ${formatted}.`,
      link: `/team/portal?card=${cardId}`,
      type: "edit_deadline",
    }));

    await supabase.from("notifications").insert(notifications);
  } catch (err) {
    console.error("edit-deadline-notifications: failed", err);
  }
}
