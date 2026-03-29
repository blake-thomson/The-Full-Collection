/**
 * Automated workflow trigger executor.
 * When a kanban card moves to a new column, evaluate and execute
 * any active triggers configured for that column.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

interface TriggerAction {
  type: "send_in_app_notification" | "move_card" | "assign_to";
  to?: "client" | "team";
  message?: string;
  to_column?: string;
  role?: string;
}

interface TriggerCondition {
  field?: string;
  operator?: string;
  value?: string;
}

interface WorkflowTrigger {
  id: string;
  name: string;
  trigger_column: string;
  conditions: TriggerCondition[] | null;
  actions: TriggerAction[];
  is_active: boolean;
}

/**
 * Evaluate trigger conditions against a card.
 * If no conditions are defined, the trigger always fires.
 */
function evaluateConditions(
  conditions: TriggerCondition[] | null,
  card: Record<string, unknown>
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => {
    if (!condition.field || !condition.operator || condition.value === undefined) return true;
    const cardValue = String(card[condition.field] ?? "");
    switch (condition.operator) {
      case "equals":
        return cardValue === condition.value;
      case "not_equals":
        return cardValue !== condition.value;
      case "contains":
        return cardValue.includes(condition.value);
      case "exists":
        return !!card[condition.field];
      default:
        return true;
    }
  });
}

/**
 * Execute all active triggers for the given column after a card moves.
 * Called non-blocking from the kanban PATCH handler.
 */
export async function executeTriggersForColumn(
  cardId: string,
  newColumnId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    // 1. Get active triggers for this column
    const { data: triggers, error: trigErr } = await supabase
      .from("workflow_triggers")
      .select("*")
      .eq("trigger_column", newColumnId)
      .eq("is_active", true);

    if (trigErr || !triggers || triggers.length === 0) return;

    // 2. Fetch the card data
    const { data: card, error: cardErr } = await supabase
      .from("kanban_cards")
      .select("*")
      .eq("id", cardId)
      .single();

    if (cardErr || !card) return;

    // 3. Evaluate and execute each trigger
    for (const trigger of triggers as WorkflowTrigger[]) {
      if (!evaluateConditions(trigger.conditions, card)) {
        console.log(`[trigger] "${trigger.name}" — conditions not met, skipping`);
        continue;
      }

      console.log(`[trigger] Executing "${trigger.name}" for card ${cardId}`);

      for (const action of trigger.actions) {
        try {
          await executeAction(action, card, supabase);
        } catch (actionErr) {
          console.error(`[trigger] Action ${action.type} failed:`, actionErr);
        }
      }
    }
  } catch (err) {
    console.error("[trigger] executeTriggersForColumn failed:", err);
  }
}

async function executeAction(
  action: TriggerAction,
  card: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<void> {
  switch (action.type) {
    case "send_in_app_notification": {
      const message = action.message || `Workflow trigger fired for "${card.title}"`;

      if (action.to === "client") {
        // Notify the client
        const { data: client } = await supabase
          .from("clients")
          .select("email")
          .eq("id", card.client_id)
          .maybeSingle();

        if (client?.email) {
          await supabase.from("notifications").insert({
            recipient_email: client.email,
            recipient_type: "client",
            title: "Workflow Update",
            message,
            link: `/dashboard?tab=kanban&card=${card.id}`,
            type: "workflow_trigger",
          });
          console.log(`[trigger] Notified client: ${client.email}`);
        }
      } else if (action.to === "team") {
        // Notify all team members assigned to this client
        const { data: assignments } = await supabase
          .from("client_assignments")
          .select("team_member_email")
          .eq("client_id", card.client_id);

        if (assignments && assignments.length > 0) {
          const notifications = assignments.map((a: { team_member_email: string }) => ({
            recipient_email: a.team_member_email,
            recipient_type: "team",
            title: "Workflow Update",
            message,
            link: `/team/portal?card=${card.id}`,
            type: "workflow_trigger",
          }));
          await supabase.from("notifications").insert(notifications);
          console.log(`[trigger] Notified ${notifications.length} team members`);
        }
      }
      break;
    }

    case "move_card": {
      if (!action.to_column) break;
      await supabase
        .from("kanban_cards")
        .update({ column_id: action.to_column, updated_at: new Date().toISOString() })
        .eq("id", card.id);
      console.log(`[trigger] Moved card ${card.id} to ${action.to_column}`);
      break;
    }

    case "assign_to": {
      if (!action.role) break;
      // Find a team member with the specified role assigned to this client
      const { data: assignments } = await supabase
        .from("client_assignments")
        .select("team_member_email")
        .eq("client_id", card.client_id);

      if (assignments && assignments.length > 0) {
        const emails = assignments.map((a: { team_member_email: string }) => a.team_member_email);
        const { data: member } = await supabase
          .from("team_members")
          .select("name")
          .in("email", emails)
          .eq("role", action.role)
          .limit(1)
          .maybeSingle();

        if (member) {
          await supabase
            .from("kanban_cards")
            .update({ assigned_editor: member.name, updated_at: new Date().toISOString() })
            .eq("id", card.id);
          console.log(`[trigger] Assigned card ${card.id} to ${member.name} (${action.role})`);
        }
      }
      break;
    }
  }
}
