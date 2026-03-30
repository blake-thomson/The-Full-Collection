"use client";

import { useState, useEffect, useCallback } from "react";
import { COLUMNS } from "@/lib/constants";

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

interface Trigger {
  id: string;
  name: string;
  trigger_column: string;
  conditions: TriggerCondition[] | null;
  actions: TriggerAction[];
  is_active: boolean;
  created_at: string;
}

interface Props {
  currentUserRole: string;
}

const COLUMN_MAP = Object.fromEntries(COLUMNS.map((c) => [c.id, c.label]));
const ROLES = ["editor", "admin", "smm", "social_media_manager"];

function actionSummary(action: TriggerAction): string {
  switch (action.type) {
    case "send_in_app_notification":
      return action.to === "client" ? "Notify client" : "Notify team";
    case "move_card":
      return `Move to ${COLUMN_MAP[action.to_column || ""] || action.to_column}`;
    case "assign_to":
      return `Assign to ${action.role || "role"}`;
    default:
      return action.type;
  }
}

export function WorkflowTriggers({ currentUserRole }: Props) {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formColumn, setFormColumn] = useState<string>(COLUMNS[0].id);
  const [formConditions, setFormConditions] = useState<TriggerCondition[]>([]);
  const [formActions, setFormActions] = useState<TriggerAction[]>([]);
  const [saving, setSaving] = useState(false);

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const fetchTriggers = useCallback(async () => {
    try {
      const res = await fetch("/api/triggers");
      if (res.ok) {
        const data = await res.json();
        setTriggers(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTriggers();
  }, [fetchTriggers]);

  const resetForm = () => {
    setFormName("");
    setFormColumn(COLUMNS[0].id);
    setFormConditions([]);
    setFormActions([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formName || formActions.length === 0) return;
    setSaving(true);

    const payload = editingId
      ? { id: editingId, name: formName, triggerColumn: formColumn, conditions: formConditions.length > 0 ? formConditions : null, actions: formActions }
      : { name: formName, triggerColumn: formColumn, conditions: formConditions.length > 0 ? formConditions : null, actions: formActions };

    try {
      const res = await fetch("/api/triggers", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetForm();
        fetchTriggers();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (trigger: Trigger) => {
    try {
      await fetch("/api/triggers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trigger.id, isActive: !trigger.is_active }),
      });
      fetchTriggers();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/triggers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchTriggers();
    } catch {
      // ignore
    }
  };

  const handleEdit = (trigger: Trigger) => {
    setFormName(trigger.name);
    setFormColumn(trigger.trigger_column);
    setFormConditions(trigger.conditions || []);
    setFormActions(trigger.actions || []);
    setEditingId(trigger.id);
    setShowForm(true);
  };

  const addAction = (type: TriggerAction["type"]) => {
    const action: TriggerAction = { type };
    if (type === "send_in_app_notification") action.to = "client";
    if (type === "move_card") action.to_column = COLUMNS[0].id;
    if (type === "assign_to") action.role = "editor";
    setFormActions([...formActions, action]);
  };

  const updateAction = (index: number, updates: Partial<TriggerAction>) => {
    const next = [...formActions];
    next[index] = { ...next[index], ...updates };
    setFormActions(next);
  };

  const removeAction = (index: number) => {
    setFormActions(formActions.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-surface-2 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">Workflow Automation</h2>
        {canManage && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 text-sm bg-red text-white rounded-lg hover:bg-[#c41a1a] transition-colors"
          >
            Add Trigger
          </button>
        )}
      </div>

      {/* Trigger list */}
      {triggers.length === 0 && !showForm && (
        <p className="text-text-3 text-sm py-8 text-center">No workflow triggers configured yet.</p>
      )}

      {triggers.map((trigger) => (
        <div
          key={trigger.id}
          className="bg-surface rounded-lg border border-border p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-medium text-text">{trigger.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-2 border border-border">
                {COLUMN_MAP[trigger.trigger_column] || trigger.trigger_column}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {canManage && (
                <>
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(trigger)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      trigger.is_active ? "bg-[#10B981]" : "bg-surface-2"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        trigger.is_active ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleEdit(trigger)}
                    className="text-text-3 hover:text-text-2 text-sm px-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(trigger.id)}
                    className="text-text-3 hover:text-red text-sm px-2"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-text-2">
            {trigger.actions.map(actionSummary).join(" -> ")}
          </p>
        </div>
      ))}

      {/* Add / Edit form */}
      {showForm && canManage && (
        <div className="bg-surface rounded-lg border border-border p-4 space-y-4">
          <h3 className="text-sm font-semibold text-text">
            {editingId ? "Edit Trigger" : "New Trigger"}
          </h3>

          {/* Name */}
          <input
            type="text"
            placeholder="Trigger name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-lg text-text placeholder:text-text-3 focus:outline-none focus:border-red"
          />

          {/* When card moves to */}
          <div>
            <label className="block text-xs text-text-3 mb-1">When card moves to</label>
            <select
              value={formColumn}
              onChange={(e) => setFormColumn(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-red"
            >
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-xs text-text-3 mb-1">Conditions (optional)</label>
            {formConditions.map((cond, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select
                  value={cond.field || ""}
                  onChange={(e) => {
                    const next = [...formConditions];
                    next[i] = { ...next[i], field: e.target.value };
                    setFormConditions(next);
                  }}
                  className="flex-1 px-2 py-1.5 text-sm bg-surface-2 border border-border rounded text-text"
                >
                  <option value="">Field</option>
                  <option value="approval_status">Approval Status</option>
                  <option value="priority">Priority</option>
                  <option value="platform">Platform</option>
                  <option value="content_type">Content Type</option>
                </select>
                <select
                  value={cond.operator || "equals"}
                  onChange={(e) => {
                    const next = [...formConditions];
                    next[i] = { ...next[i], operator: e.target.value };
                    setFormConditions(next);
                  }}
                  className="px-2 py-1.5 text-sm bg-surface-2 border border-border rounded text-text"
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">not equals</option>
                  <option value="contains">contains</option>
                  <option value="exists">exists</option>
                </select>
                <input
                  type="text"
                  placeholder="Value"
                  value={cond.value || ""}
                  onChange={(e) => {
                    const next = [...formConditions];
                    next[i] = { ...next[i], value: e.target.value };
                    setFormConditions(next);
                  }}
                  className="flex-1 px-2 py-1.5 text-sm bg-surface-2 border border-border rounded text-text placeholder:text-text-3"
                />
                <button
                  onClick={() => setFormConditions(formConditions.filter((_, j) => j !== i))}
                  className="text-text-3 hover:text-red text-sm"
                >
                  x
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setFormConditions([...formConditions, { field: "", operator: "equals", value: "" }])
              }
              className="text-xs text-text-3 hover:text-text-2"
            >
              + Add condition
            </button>
          </div>

          {/* Actions */}
          <div>
            <label className="block text-xs text-text-3 mb-1">Actions</label>
            {formActions.map((action, i) => (
              <div key={i} className="flex gap-2 items-center mb-2 bg-surface-2 rounded p-2">
                <span className="text-xs text-text-2 w-32 shrink-0">
                  {action.type === "send_in_app_notification"
                    ? "Notify"
                    : action.type === "move_card"
                    ? "Move Card"
                    : "Assign To"}
                </span>

                {action.type === "send_in_app_notification" && (
                  <>
                    <select
                      value={action.to || "client"}
                      onChange={(e) => updateAction(i, { to: e.target.value as "client" | "team" })}
                      className="px-2 py-1 text-sm bg-surface border border-border rounded text-text"
                    >
                      <option value="client">Client</option>
                      <option value="team">Team</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Message (optional)"
                      value={action.message || ""}
                      onChange={(e) => updateAction(i, { message: e.target.value })}
                      className="flex-1 px-2 py-1 text-sm bg-surface border border-border rounded text-text placeholder:text-text-3"
                    />
                  </>
                )}

                {action.type === "move_card" && (
                  <select
                    value={action.to_column || ""}
                    onChange={(e) => updateAction(i, { to_column: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm bg-surface border border-border rounded text-text"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                )}

                {action.type === "assign_to" && (
                  <select
                    value={action.role || ""}
                    onChange={(e) => updateAction(i, { role: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm bg-surface border border-border rounded text-text"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => removeAction(i)}
                  className="text-text-3 hover:text-red text-sm shrink-0"
                >
                  x
                </button>
              </div>
            ))}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => addAction("send_in_app_notification")}
                className="text-xs px-2 py-1 rounded bg-surface-2 border border-border text-text-2 hover:text-text hover:border-red transition-colors"
              >
                + Notify Client/Team
              </button>
              <button
                onClick={() => addAction("move_card")}
                className="text-xs px-2 py-1 rounded bg-surface-2 border border-border text-text-2 hover:text-text hover:border-red transition-colors"
              >
                + Move Card
              </button>
              <button
                onClick={() => addAction("assign_to")}
                className="text-xs px-2 py-1 rounded bg-surface-2 border border-border text-text-2 hover:text-text hover:border-red transition-colors"
              >
                + Assign To
              </button>
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !formName || formActions.length === 0}
              className="px-4 py-2 text-sm bg-red text-white rounded-lg hover:bg-[#c41a1a] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create Trigger"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm text-text-2 hover:text-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
