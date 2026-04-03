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
  myAssignedClientIds: string[];
  onNavigateToClient: (clientId: string, cardId?: string) => void;
}

const COL_META: Record<string, { label: string; color: string }> = Object.fromEntries(
  COLUMNS.map((c) => [c.id, { label: c.label, color: c.color }])
);

/* ── Pipeline bucket definitions ── */
const PIPELINE_BUCKETS = [
  { key: "ideas", label: "Ideas", columns: ["idea"], color: "#6B7280" },
  { key: "production", label: "In Production", columns: ["filmed", "ready_to_edit", "editing", "edited_qcc"], color: "#3B82F6" },
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

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Focus card row component ── */
function FocusCard({ item, isLast, onNavigate }: {
  item: { card: KanbanCard; clientName: string; clientId: string; reason: string; tag?: string; tagColor?: string };
  isLast: boolean;
  onNavigate: (clientId: string, cardId?: string) => void;
}) {
  const col = COL_META[item.card.column_id];
  const isOverdue = item.reason === "Overdue";
  return (
    <button
      onClick={() => onNavigate(item.clientId, item.card.id)}
      className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left font-body transition-colors hover:bg-surface-2"
      style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)" }}
    >
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
        {(item.card.due_date || item.card.shoot_date || item.card.publish_date) && (
          <div className="text-text-3 text-[10px] mt-0.5">
            {formatDate(item.card.due_date || item.card.shoot_date || item.card.publish_date || "")}
          </div>
        )}
      </div>
    </button>
  );
}

/* ── Focus section wrapper ── */
function FocusSection({ title, items, emptyMessage, onNavigate }: {
  title: string;
  items: { card: KanbanCard; clientName: string; clientId: string; reason: string }[];
  emptyMessage: string;
  onNavigate: (clientId: string, cardId?: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="mb-5">
        <h3 className="text-text-3 text-[10px] font-bold tracking-[0.1em] uppercase mb-2">{title}</h3>
        <div className="bg-surface border border-border rounded-xl p-5 text-center">
          <p className="text-text-3 text-[12px] m-0">{emptyMessage}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-text-3 text-[10px] font-bold tracking-[0.1em] uppercase m-0">{title}</h3>
        <span className="text-text-3 text-[10px] font-medium">{items.length}</span>
      </div>
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {items.map((item, i) => (
          <FocusCard key={item.card.id} item={item} isLast={i === items.length - 1} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

export function TeamOverview({ teamUser, clients, allCards, allActivity, allTeamMembers, myAssignedClientIds, onNavigateToClient }: Props) {
  const [pulseTab, setPulseTab] = useState<"activity" | "health">("activity");
  const isAdmin = ["owner", "admin"].includes(teamUser.role);
  const isEditor = ["youtube_editor", "short_form_editor"].includes(teamUser.role);
  const isSMM = ["smm", "social_media_manager"].includes(teamUser.role);
  const isPM = teamUser.role === "project_manager";
  const isVideographer = teamUser.role === "videographer";

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
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

  /* ── My assigned clients set for fast lookup ── */
  const myClientIds = useMemo(() => new Set(myAssignedClientIds), [myAssignedClientIds]);

  /* ── Helper: is card for one of my assigned clients ── */
  const isMyClient = (cardId: string) => {
    const owner = cardClientMap[cardId];
    return owner ? myClientIds.has(owner.clientId) : false;
  };

  /* ═══ ROLE-SPECIFIC FOCUS ITEMS ═══ */

  /* ── Editor focus: Revisions first, then ready-to-edit ── */
  const editorFocus = useMemo(() => {
    if (!isEditor) return { revisions: [], readyToEdit: [] };
    const revisions: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];
    const readyToEdit: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];

    for (const card of allCards) {
      const owner = cardClientMap[card.id];
      if (!owner) continue;
      const isAssignedToMe = card.assigned_editor === teamUser.email || card.assigned_editor === teamUser.name;
      if (!isAssignedToMe) continue;

      const isOverdue = (card.edit_deadline && card.edit_deadline < todayStr) || (card.due_date && card.due_date < todayStr);

      if (card.column_id === "revise") {
        revisions.push({ card, ...owner, reason: isOverdue ? "Overdue" : "Revision requested" });
      } else if (["ready_to_edit", "editing"].includes(card.column_id)) {
        readyToEdit.push({ card, ...owner, reason: isOverdue ? "Overdue" : card.column_id === "editing" ? "In progress" : "Ready to edit" });
      } else if (card.column_id === "edited_qcc") {
        readyToEdit.push({ card, ...owner, reason: "In QCC" });
      }
    }

    const sortByUrgency = (a: { card: KanbanCard; reason: string }, b: { card: KanbanCard; reason: string }) => {
      const aOverdue = a.reason === "Overdue" ? 0 : 1;
      const bOverdue = b.reason === "Overdue" ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      return (a.card.edit_deadline || a.card.due_date || "z").localeCompare(b.card.edit_deadline || b.card.due_date || "z");
    };

    return { revisions: revisions.sort(sortByUrgency), readyToEdit: readyToEdit.sort(sortByUrgency) };
  }, [isEditor, allCards, cardClientMap, teamUser, todayStr]);

  /* ── Videographer focus: Shoots today + tomorrow ── */
  const videographerFocus = useMemo(() => {
    if (!isVideographer) return { shootsToday: [], shootsTomorrow: [] };
    const shootsToday: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];
    const shootsTomorrow: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];

    for (const card of allCards) {
      const owner = cardClientMap[card.id];
      if (!owner) continue;
      if (!card.shoot_date) continue;
      // Only show shoots for clients I'm assigned to, or all if no assignments yet
      if (myClientIds.size > 0 && !myClientIds.has(owner.clientId)) continue;

      if (card.shoot_date === todayStr) {
        shootsToday.push({
          card, ...owner,
          reason: card.shoot_location ? card.shoot_location : "Shoot today",
        });
      } else if (card.shoot_date === tomorrowStr) {
        shootsTomorrow.push({
          card, ...owner,
          reason: card.shoot_location ? card.shoot_location : "Shoot tomorrow",
        });
      }
    }

    return { shootsToday, shootsTomorrow };
  }, [isVideographer, allCards, cardClientMap, todayStr, tomorrowStr, myClientIds]);

  /* ── Project Manager focus: Filmed + Edited QCC for assigned clients ── */
  const pmFocus = useMemo(() => {
    if (!isPM) return { filmed: [] as { card: KanbanCard; clientName: string; clientId: string; reason: string }[], qcc: [] as { card: KanbanCard; clientName: string; clientId: string; reason: string }[] };
    const filmed: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];
    const qcc: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];

    for (const card of allCards) {
      const owner = cardClientMap[card.id];
      if (!owner) continue;
      if (myClientIds.size > 0 && !myClientIds.has(owner.clientId)) continue;

      if (card.column_id === "filmed") {
        filmed.push({ card, ...owner, reason: "Just filmed" });
      } else if (card.column_id === "edited_qcc") {
        const isOverdue = (card.due_date && card.due_date < todayStr);
        qcc.push({ card, ...owner, reason: isOverdue ? "Overdue" : "Needs QC review" });
      }
    }

    const sortFn = (a: { card: KanbanCard; reason: string }, b: { card: KanbanCard; reason: string }) => {
      const aOverdue = a.reason === "Overdue" ? 0 : 1;
      const bOverdue = b.reason === "Overdue" ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      return (a.card.due_date || "z").localeCompare(b.card.due_date || "z");
    };

    return { filmed: filmed.sort(sortFn), qcc: qcc.sort(sortFn) };
  }, [isPM, allCards, cardClientMap, myClientIds, todayStr]);

  /* ── SMM focus: Approved for Publish for assigned clients ── */
  const smmFocus = useMemo(() => {
    if (!isSMM) return [];
    const items: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];

    for (const card of allCards) {
      const owner = cardClientMap[card.id];
      if (!owner) continue;
      if (myClientIds.size > 0 && !myClientIds.has(owner.clientId)) continue;

      if (card.column_id === "approved") {
        items.push({ card, ...owner, reason: "Approved for publish" });
      }
    }

    return items.sort((a, b) => (a.card.publish_date || "z").localeCompare(b.card.publish_date || "z"));
  }, [isSMM, allCards, cardClientMap, myClientIds]);

  /* ── Admin/Owner focus: Full stack overview ── */
  const adminFocus = useMemo(() => {
    if (!isAdmin) return { overdue: [], revisions: [], waitingOnClient: [], publishingSoon: [], unassigned: [] };
    const overdue: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];
    const revisions: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];
    const waitingOnClient: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];
    const publishingSoon: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];
    const unassigned: { card: KanbanCard; clientName: string; clientId: string; reason: string }[] = [];

    for (const card of allCards) {
      const owner = cardClientMap[card.id];
      if (!owner) continue;

      const isOverdue = (card.due_date && card.due_date < todayStr) || (card.edit_deadline && card.edit_deadline < todayStr);
      const isPublishingSoon = card.publish_date && card.publish_date >= todayStr &&
        (new Date(card.publish_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 3;

      if (card.column_id === "revise") {
        revisions.push({ card, ...owner, reason: isOverdue ? "Overdue" : "Revision requested" });
      } else if (card.column_id === "ready_review") {
        waitingOnClient.push({ card, ...owner, reason: isOverdue ? "Overdue" : "Waiting on client" });
      } else if (isOverdue && !["published", "idea"].includes(card.column_id)) {
        overdue.push({ card, ...owner, reason: "Overdue" });
      } else if (isPublishingSoon && card.column_id === "scheduled") {
        publishingSoon.push({ card, ...owner, reason: "Publishing soon" });
      }

      // Flag cards in production with no assigned editor
      if (["filmed", "ready_to_edit", "editing", "edited_qcc"].includes(card.column_id) && !card.assigned_editor) {
        unassigned.push({ card, ...owner, reason: "No editor assigned" });
      }
    }

    return { overdue, revisions, waitingOnClient, publishingSoon, unassigned };
  }, [isAdmin, allCards, cardClientMap, todayStr, today]);

  /* ── Total focus count for greeting ── */
  const focusCount = useMemo(() => {
    if (isEditor) return editorFocus.revisions.length + editorFocus.readyToEdit.length;
    if (isVideographer) return videographerFocus.shootsToday.length + videographerFocus.shootsTomorrow.length;
    if (isPM) return pmFocus.filmed.length + pmFocus.qcc.length;
    if (isSMM) return smmFocus.length;
    if (isAdmin) return adminFocus.overdue.length + adminFocus.revisions.length + adminFocus.waitingOnClient.length + adminFocus.publishingSoon.length + adminFocus.unassigned.length;
    return 0;
  }, [isEditor, isVideographer, isPM, isSMM, isAdmin, editorFocus, videographerFocus, pmFocus, smmFocus, adminFocus]);

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
      const emphasized = (isEditor && bucket.key === "production") || (isSMM && bucket.key === "ship") || (isAdmin && bucket.key === "action") || (isPM && bucket.key === "production") || (isVideographer && bucket.key === "ideas");
      return { ...bucket, count, emphasized };
    });
  }, [allCards, isEditor, isSMM, isAdmin, isPM, isVideographer, startOfMonth]);

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

  /* ── Role description for subtitle ── */
  const roleSubtitle = useMemo(() => {
    if (isEditor) return focusCount > 0 ? `${focusCount} item${focusCount !== 1 ? "s" : ""} in your editing queue` : "Your editing queue is clear";
    if (isVideographer) {
      const todayCount = videographerFocus.shootsToday.length;
      const tomorrowCount = videographerFocus.shootsTomorrow.length;
      if (todayCount > 0) return `${todayCount} shoot${todayCount !== 1 ? "s" : ""} on the board today`;
      if (tomorrowCount > 0) return `Nothing today — ${tomorrowCount} shoot${tomorrowCount !== 1 ? "s" : ""} tomorrow`;
      return "No shoots scheduled for today or tomorrow";
    }
    if (isPM) {
      const total = pmFocus.filmed.length + pmFocus.qcc.length;
      return total > 0 ? `${total} project${total !== 1 ? "s" : ""} need your attention` : "All projects are moving through the pipeline";
    }
    if (isSMM) {
      return smmFocus.length > 0 ? `${smmFocus.length} project${smmFocus.length !== 1 ? "s" : ""} approved for publish` : "No content waiting to be published";
    }
    if (isAdmin) return focusCount > 0 ? `${focusCount} item${focusCount !== 1 ? "s" : ""} across the pipeline need attention` : "All clear — the team is on track";
    return focusCount > 0 ? `${focusCount} item${focusCount !== 1 ? "s" : ""} need your attention` : "All clear — nothing urgent today";
  }, [isEditor, isVideographer, isPM, isSMM, isAdmin, focusCount, videographerFocus, pmFocus, smmFocus]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-5 sm:py-8">

          {/* ── Greeting ── */}
          <div className="mb-6">
            <h1 className="text-text font-heading text-[22px] sm:text-[26px] font-[800] m-0 leading-tight">
              {greeting}, {teamUser.name.split(" ")[0]}
            </h1>
            <p className="text-text-3 text-[13px] m-0 mt-1">{roleSubtitle}</p>
          </div>

          {/* ═══ ROLE-SPECIFIC FOCUS ═══ */}
          <div className="mb-6">
            <h2 className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mb-3">Your Focus</h2>

            {/* ── EDITOR ── */}
            {isEditor && (
              <>
                <FocusSection
                  title="Revisions — Push These Over the Finish Line"
                  items={editorFocus.revisions}
                  emptyMessage="No revisions right now"
                  onNavigate={onNavigateToClient}
                />
                <FocusSection
                  title="Ready to Edit"
                  items={editorFocus.readyToEdit}
                  emptyMessage="Nothing in your editing queue"
                  onNavigate={onNavigateToClient}
                />
              </>
            )}

            {/* ── VIDEOGRAPHER ── */}
            {isVideographer && (
              <>
                <FocusSection
                  title="Shoots Today"
                  items={videographerFocus.shootsToday}
                  emptyMessage="No shoots scheduled for today"
                  onNavigate={onNavigateToClient}
                />
                <FocusSection
                  title="Coming Up Tomorrow"
                  items={videographerFocus.shootsTomorrow}
                  emptyMessage="No shoots tomorrow"
                  onNavigate={onNavigateToClient}
                />
              </>
            )}

            {/* ── PROJECT MANAGER ── */}
            {isPM && (
              <>
                <FocusSection
                  title="Edited QCC — Needs Your Review"
                  items={pmFocus.qcc}
                  emptyMessage="No projects in QCC right now"
                  onNavigate={onNavigateToClient}
                />
                <FocusSection
                  title="Just Filmed"
                  items={pmFocus.filmed}
                  emptyMessage="Nothing recently filmed"
                  onNavigate={onNavigateToClient}
                />
              </>
            )}

            {/* ── SOCIAL MEDIA MANAGER ── */}
            {isSMM && (
              <FocusSection
                title="Approved for Publish"
                items={smmFocus}
                emptyMessage="No content waiting to be published"
                onNavigate={onNavigateToClient}
              />
            )}

            {/* ── ADMIN / OWNER ── */}
            {isAdmin && (
              <>
                {adminFocus.overdue.length > 0 && (
                  <FocusSection
                    title="Overdue"
                    items={adminFocus.overdue}
                    emptyMessage=""
                    onNavigate={onNavigateToClient}
                  />
                )}
                <FocusSection
                  title="Revisions — Almost Done"
                  items={adminFocus.revisions}
                  emptyMessage="No revisions pending"
                  onNavigate={onNavigateToClient}
                />
                <FocusSection
                  title="Waiting on Client"
                  items={adminFocus.waitingOnClient}
                  emptyMessage="No items waiting on client review"
                  onNavigate={onNavigateToClient}
                />
                <FocusSection
                  title="Publishing Soon"
                  items={adminFocus.publishingSoon}
                  emptyMessage="Nothing publishing in the next 3 days"
                  onNavigate={onNavigateToClient}
                />
                {adminFocus.unassigned.length > 0 && (
                  <FocusSection
                    title="Unassigned — Needs an Editor"
                    items={adminFocus.unassigned}
                    emptyMessage=""
                    onNavigate={onNavigateToClient}
                  />
                )}
              </>
            )}

            {/* Fallback for roles not yet handled */}
            {!isEditor && !isVideographer && !isPM && !isSMM && !isAdmin && (
              <div className="bg-surface border border-border rounded-xl p-6 text-center">
                <div className="text-[28px] mb-2">✓</div>
                <p className="text-text-2 text-[13px] m-0">Nothing needs your attention right now</p>
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
