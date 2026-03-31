import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Log an activity to the activity_log table.
 * Fire-and-forget — never throws, never blocks the caller.
 */
export function logActivity(
  supabase: SupabaseClient,
  params: {
    client_id: string;
    actor_email: string;
    actor_name?: string;
    actor_type?: "team" | "client" | "system";
    action: string;
    metadata?: Record<string, unknown>;
  }
) {
  supabase
    .from("activity_log")
    .insert({
      client_id: params.client_id,
      actor_email: params.actor_email,
      actor_name: params.actor_name || null,
      actor_type: params.actor_type || "system",
      action: params.action,
      metadata: params.metadata || null,
    })
    .then(({ error }) => {
      if (error) console.error("[activity-logger]", error.message);
    });
}

/** Pre-defined action types for consistency */
export const ACTIONS = {
  // Cards
  CARD_CREATED: "card_created",
  CARD_MOVED: "card_moved",
  CARD_UPDATED: "card_updated",
  CARD_DELETED: "card_deleted",
  CARD_RESTORED: "card_restored",
  CARD_APPROVED: "card_approved",
  CARD_REVISION_REQUESTED: "card_revision_requested",

  // Comments
  COMMENT_ADDED: "comment_added",

  // Attachments
  ATTACHMENT_ADDED: "attachment_added",
  ATTACHMENT_DELETED: "attachment_deleted",

  // Team
  TEAM_MEMBER_ADDED: "team_member_added",
  TEAM_MEMBER_REMOVED: "team_member_removed",
  TEAM_MEMBER_ROLE_CHANGED: "team_member_role_changed",

  // Client
  CLIENT_CREATED: "client_created",
  CLIENT_UPDATED: "client_updated",
  CLIENT_ASSIGNMENT_ADDED: "client_assignment_added",
  CLIENT_ASSIGNMENT_REMOVED: "client_assignment_removed",

  // Login
  LOGIN: "login",

  // Billing
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_UPDATED: "subscription_updated",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_FAILED: "payment_failed",

  // Publishing
  POST_SCHEDULED: "post_scheduled",
  POST_PUBLISHED: "post_published",
  POST_FAILED: "post_failed",

  // Reports
  REPORT_GENERATED: "report_generated",
  REPORT_SENT: "report_sent",

  // Resources
  RESOURCE_ADDED: "resource_added",
  RESOURCE_DELETED: "resource_deleted",
} as const;
