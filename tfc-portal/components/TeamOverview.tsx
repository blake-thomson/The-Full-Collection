"use client";

import { useMemo, useState } from "react";
import { COLUMNS } from "@/lib/constants";
import type { KanbanCard, TeamMember } from "@/lib/types";

interface Client {
  id: string;
  name: string;
  email: string;
  onboarding_complete: boolean;
  created_at: string;
  last_seen_at?: string;
  kanbanCards?: KanbanCard[];
}

interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
  type?: string;
}

interface Props {
  teamUser: TeamMember;
  clients: Client[];
  allCards: KanbanCard[];
  allActivity: ActivityItem[];
  allTeamMembers: TeamMember[];
  onNavigateToClient: (clientId: string, cardId?: string) => void;
}

const COL_META: Record<string, { label: string; color: string }> = Object.fromEntries(
  COLUMNS.map((c) => [c.id, { label: c.label, color: c.color }])
);

/* ── Pipeline bucket definitions ── */
const PIPELINE_BUCKETS = [
  { key: "ideas", label: "Ideas", columns: ["idea"], color: "#6B7280" },
  { key: "production", label: "In Production", columns: ["filmed", "editing", "edited_qcc"], color: "#3B82F6" },
  { key: "action", label: "Needs Action", columns: ["ready_review", "revise"], color: "#F59E0B" },
  { key: "ship", label: "Ready to Ship", columns: ["approved", "scheduled"], color: "#10B981" },
  { key: "published", label: "Published", columns: ["published"], color: "var(--color-red)" },
];

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysSince(iso?: string): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export function TeamOverview({ teamUser, clients, allCards, allActivity, allTeamMembers, onNavigateToClient }: Props) {
  const [pulseTab, setPulseTab] = useState<"activity" | "health">("activity");
  const isAdmin = ["owner", "admin"].includes(teamUser.role);
  const isEditor = teamUser.role === "editor";
  const isSMM = ["smm", "social_media_manager"].includes(teamUser.role);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";

  /* ── Find which client owns a card ── */
  const cardClientMap = useMemo(() => {
    const map: Record<string, { clientId: string; clientName: string }> = {};
    clients.forEach((c) => {
      c.kanbanCards?.forEach((card) => {
        map[card.id] = { clientId: c.id, clientName: c.name };
      });
    });
    return map;
  }, [clients]);

  /* ── Section 1: Focus items ── */
  const focusItems = useMemo(() => {
    const items: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];
    const now = new Date();

    for (const card of allCards) {
      const owner = cardClientMap[card.id];
      if (!owner) continue;

      const col = card.column_id;
      const isAssignedToMe = card.assigned_editor === teamUser.email || card.assigned_editor === teamUser.name;
      const isOverdue = (card.due_date && card.due_date < todayStr) || (card.edit_deadline && card.edit_deadline < todayStr);
      const publishingSoon = card.publish_date && card.publish_date >= todayStr &&
        (new Date(card.publish_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 3;

      if (isEditor) {
        if (["filmed", "editing", "edited_qcc", "revise"].includes(col) && isAssignedToMe) {
          items.push({ card, ...owner, reason: isOverdue ? "Overdue" : col === "revise" ? "Revision requested" : "In your queue" });
        }
      } else if (isSMM) {
        if (["approved", "scheduled"].includes(col)) {
          items.push({ card, ...owner, reason: publishingSoon ? "Publishing soon" : "Ready to schedule" });
        }
      }

      if (isAdmin) {
        if (col === "revise") {
          items.push({ card, ...owner, reason: "Revision requested" });
        } else if (col === "ready_review") {
          items.push({ card, ...owner, reason: "Waiting on client" });
        } else if (isOverdue && !["published", "idea"].includes(col)) {
          items.push({ card, ...owner, reason: "Overdue" });
        } else if (publishingSoon && col === "scheduled") {
          items.push({ card, ...owner, reason: "Publishing soon" });
        }
      }
    }

    // Deduplicate by card id
    const seen = new Set<string>();
    const unique = items.filter((item) => {
      if (seen.has(item.card.id)) return false;
      seen.add(item.card.id);
      return true;
    });

    // Sort: overdue first, then by priority, then by due date
    return unique.sort((a, b) => {
      const aOverdue = a.reason === "Overdue" ? 0 : 1;
      const bOverdue = b.reason === "Overdue" ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;

      const priOrder = { high: 0, medium: 1, low: 2 };
      const aPri = priOrder[a.card.priority || "medium"] ?? 1;
      const bPri = priOrder[b.card.priority || "medium"] ?? 1;
      if (aPri !== bPri) return aPri - bPri;

      return (a.card.due_date || "z").localeCompare(b.card.due_date || "z");
    }).slice(0, 7);
  }, [allCards, cardClientMap, teamUser, todayStr, isEditor, isSMM, isAdmin]);

  /* ── Section 2: Pipeline counts ── */
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const pipelineCounts = useMemo(() => {
    return PIPELINE_BUCKETS.map((bucket) => {
      let count: number;
      if (bucket.key === "published") {
        count = allCards.filter((c) => bucket.columns.includes(c.column_id) && c.created_at && new Date(c.created_at) >= startOfMonth).length;
      } else {
        count = allCards.filter((c) => bucket.columns.includes(c.column_id)).length;
      }
      const emphasized = (isEditor && bucket.key === "production") || (isSMM && bucket.key === "ship") || (isAdmin && bucket.key === "action");
      return { ...bucket, count, emphasized };
    });
  }, [allCards, isEditor, isSMM, isAdmin, startOfMonth]);

  /* ── Section 3: Client health ── */
  const clientHealth = useMemo(() => {
    return clients.map((c) => {
      const days = daysSince(c.last_seen_at);
      const reviewCount = c.kanbanCards?.filter((k) => k.column_id === "ready_review").length ?? 0;
      const reviseCount = c.kanbanCards?.filter((k) => k.column_id === "revise").length ?? 0;
      const atRisk = days !== null && days > 14;
      return { id: c.id, name: c.name, days, reviewCount, reviseCount, atRisk, totalCards: c.kanbanCards?.length ?? 0 };
    }).sort((a, b) => {
      if (a.atRisk && !b.atRisk) return -1;
      if (!a.atRisk && b.atRisk) return 1;
      return (b.days ?? 9999) - (a.days ?? 9999);
    });
  }, [clients]);

  const focusCount = focusItems.length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-5 sm:py-8">

          {/* ── Greeting ── */}
          <div className="mb-6">
            <h1 className="text-text font-heading text-[22px] sm:text-[26px] font-[800] m-0 leading-tight">
              {greeting}, {teamUser.name.split(" ")[0]}
            </h1>
            <p className="text-text-3 text-[13px] m-0 mt-1">
              {focusCount > 0
                ? `${focusCount} item${focusCount !== 1 ? "s" : ""} need${focusCount === 1 ? "s" : ""} your attention`
                : "All clear — nothing urgent today"}
            </p>
          </div>

          {/* ── Section 1: Your Focus ── */}
          <div className="mb-6">
            <h2 className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mb-3">Your Focus</h2>
            {focusItems.length === 0 ? (
              <div className="bg-surface border border-border rounded-xl p-6 text-center">
                <div className="text-[28px] mb-2">✓</div>
                <p className="text-text-2 text-[13px] m-0">Nothing needs your attention right now</p>
                <p className="text-text-3 text-[11px] m-0 mt-1">Your pipeline is on track</p>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                {focusItems.map((item, i) => {
                  const col = COL_META[item.card.column_id];
                  const isOverdue = item.reason === "Overdue";
                  return (
                    <button
                      key={item.card.id}
                      onClick={() => onNavigateToClient(item.clientId, item.card.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left font-body transition-colors hover:bg-surface-2"
                      style={{ borderBottom: i < focusItems.length - 1 ? "1px solid var(--color-border)" : "none" }}
                    >
                      {/* Stage color bar */}
                      <div className="w-[4px] self-stretch rounded-full shrink-0" style={{ background: isOverdue ? "#EF4444" : col?.color || "#6B7280" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-text text-[13px] font-medium m-0 truncate">{item.card.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-text-3 text-[11px]">{item.clientName}</span>
                          <span className="text-[9px] font-bold py-[1px] px-1.5 rounded" style={{ background: `${col?.color || "#6B7280"}18`, color: col?.color || "#6B7280" }}>
                            {col?.label || item.card.column_id}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`text-[11px] font-semibold ${isOverdue ? "text-[#EF4444]" : "text-text-3"}`}>
                          {item.reason}
                        </span>
                        {item.card.due_date && (
                          <div className="text-text-3 text-[10px] mt-0.5">
                            {new Date(item.card.due_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Section 2: Pipeline Pills ── */}
          <div className="mb-6">
            <h2 className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mb-3">Pipeline</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pipelineCounts.map((bucket) => (
                <div
                  key={bucket.key}
                  className={`flex-1 min-w-[64px] bg-surface border rounded-xl p-3 text-center transition-all ${
                    bucket.emphasized ? "border-border-2 ring-1 ring-border-2" : "border-border"
                  }`}
                >
                  <div className="text-[22px] sm:text-[26px] font-heading font-[800] leading-none" style={{ color: bucket.count > 0 ? bucket.color : "var(--color-text-3)" }}>
                    {bucket.count}
                  </div>
                  <div className="text-text-3 text-[9px] sm:text-[10px] font-bold tracking-[0.06em] uppercase mt-1.5 leading-tight">
                    {bucket.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 3: Pulse ── */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase m-0">Pulse</h2>
              {isAdmin && (
                <div className="flex gap-1 bg-surface-2 rounded-lg p-0.5">
                  <button
                    onClick={() => setPulseTab("activity")}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-md border-none cursor-pointer font-body transition-colors ${
                      pulseTab === "activity" ? "bg-surface text-text" : "bg-transparent text-text-3 hover:text-text-2"
                    }`}
                  >
                    Activity
                  </button>
                  <button
                    onClick={() => setPulseTab("health")}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-md border-none cursor-pointer font-body transition-colors ${
                      pulseTab === "health" ? "bg-surface text-text" : "bg-transparent text-text-3 hover:text-text-2"
                    }`}
                  >
                    Client Health
                  </button>
                </div>
              )}
            </div>

            {/* Activity Feed */}
            {pulseTab === "activity" && (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                {allActivity.length === 0 ? (
                  <div className="p-6 text-text-3 text-[13px] text-center">No recent activity</div>
                ) : (
                  allActivity.slice(0, 10).map((a, i) => (
                    <div
                      key={a.id + "-" + i}
                      className="flex items-start gap-3 px-4 py-2.5"
                      style={{ borderBottom: i < Math.min(allActivity.length, 10) - 1 ? "1px solid var(--color-border)" : "none" }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{
                        background: a.type === "create" || a.type === "team" ? "#10B981" : a.type === "delete" ? "#EF4444" : "#3B82F6",
                      }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-text-2 text-[12px] m-0 leading-[1.5] truncate">{a.description}</p>
                      </div>
                      <span className="text-text-3 text-[10px] shrink-0">{formatRelative(a.timestamp)}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Client Health */}
            {pulseTab === "health" && isAdmin && (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                {clientHealth.length === 0 ? (
                  <div className="p-6 text-text-3 text-[13px] text-center">No clients yet</div>
                ) : (
                  clientHealth.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => onNavigateToClient(c.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left font-body transition-colors hover:bg-surface-2"
                      style={{ borderBottom: i < clientHealth.length - 1 ? "1px solid var(--color-border)" : "none" }}
                    >
                      {/* Health dot */}
                      <div className="w-2 h-2 rounded-full shrink-0" style={{
                        background: c.days === null ? "#6B7280" : c.days <= 3 ? "#10B981" : c.days <= 14 ? "#F59E0B" : "#EF4444",
                      }} />
                      <span className="text-text text-[13px] font-medium flex-1 truncate">{c.name}</span>
                      {c.reviewCount > 0 && (
                        <span className="text-[10px] font-bold py-[1px] px-2 rounded-full bg-[#EC4899]/12 text-[#EC4899]">
                          {c.reviewCount} in review
                        </span>
                      )}
                      {c.reviseCount > 0 && (
                        <span className="text-[10px] font-bold py-[1px] px-2 rounded-full bg-[#EF4444]/12 text-[#EF4444]">
                          {c.reviseCount} revision{c.reviseCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="text-text-3 text-[11px] shrink-0">
                        {c.days === null ? "Never" : c.days === 0 ? "Today" : `${c.days}d ago`}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
