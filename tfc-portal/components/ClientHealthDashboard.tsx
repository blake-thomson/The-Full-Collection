"use client";

import { useMemo } from "react";

interface Client {
  id: string;
  name: string;
  email: string;
  onboarding_complete: boolean;
  last_seen_at?: string;
  created_at: string;
  kanbanCards?: KanbanCard[];
}

interface KanbanCard {
  id: string;
  column_id: string;
  assigned_editor?: string;
  title: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface Props {
  clients: Client[];
  teamMembers: TeamMember[];
}

function daysSince(iso?: string): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function HealthBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-3 text-text-3">Never logged in</span>;
  if (days === 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981]">Active today</span>;
  if (days <= 3) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981]">{days}d ago</span>;
  if (days <= 14) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B]">{days}d ago</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EF4444]/12 text-[#EF4444]">{days}d ago</span>;
}

const ROLE_COLOR: Record<string, string> = {
  owner: "#F59E0B", admin: "#FF3B3B", project_manager: "#3B82F6",
  editor: "#10B981", social_media_manager: "#8B5CF6", smm: "#8B5CF6",
};

export function ClientHealthDashboard({ clients, teamMembers }: Props) {
  /* ── Client health rows ── */
  const clientHealth = useMemo(() =>
    clients.map((c) => {
      const days = daysSince(c.last_seen_at);
      const totalCards = c.kanbanCards?.length ?? 0;
      const published = c.kanbanCards?.filter((k) => k.column_id === "published").length ?? 0;
      const pendingReview = c.kanbanCards?.filter((k) => k.column_id === "ready_review").length ?? 0;
      const inRevisions = c.kanbanCards?.filter((k) => k.column_id === "revise").length ?? 0;
      const atRisk = days !== null && days > 14;
      return { ...c, days, totalCards, published, pendingReview, inRevisions, atRisk };
    }).sort((a, b) => {
      // Sort: at-risk first, then by days inactive desc
      if (a.atRisk && !b.atRisk) return -1;
      if (!a.atRisk && b.atRisk) return 1;
      return (b.days ?? 9999) - (a.days ?? 9999);
    }),
  [clients]);

  /* ── Team workload ── */
  const editorWorkload = useMemo(() => {
    const allCards = clients.flatMap((c) => c.kanbanCards ?? []);
    const activeCards = allCards.filter((k) => !["published", "approved"].includes(k.column_id));
    const map = new Map<string, { cards: KanbanCard[]; member?: TeamMember }>();

    // Initialize all editors/SMMs
    teamMembers
      .filter((m) => ["editor", "social_media_manager", "smm", "project_manager"].includes(m.role))
      .forEach((m) => map.set(m.email, { cards: [], member: m }));

    // Count assigned cards
    activeCards.forEach((card) => {
      if (card.assigned_editor) {
        if (!map.has(card.assigned_editor)) {
          map.set(card.assigned_editor, { cards: [], member: teamMembers.find((m) => m.email === card.assigned_editor || m.name === card.assigned_editor) });
        }
        map.get(card.assigned_editor)!.cards.push(card);
      }
    });

    return Array.from(map.entries())
      .map(([email, { cards, member }]) => ({ email, cards, member, count: cards.length }))
      .sort((a, b) => b.count - a.count);
  }, [clients, teamMembers]);

  const atRiskCount = clientHealth.filter((c) => c.atRisk).length;

  return (
    <div className="px-5 sm:px-8 pb-8 space-y-8">
      {/* Client Health */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-text font-heading text-base font-bold m-0">Client Health</h3>
          {atRiskCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EF4444]/12 text-[#EF4444]">
              {atRiskCount} at risk
            </span>
          )}
        </div>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="hidden sm:grid px-5 py-2.5 border-b border-border text-text-3 text-[11px] font-bold tracking-[0.08em] uppercase"
            style={{ gridTemplateColumns: "1fr 120px 60px 60px 60px 80px" }}>
            <span>Client</span>
            <span>Last Seen</span>
            <span className="text-center">Cards</span>
            <span className="text-center">Review</span>
            <span className="text-center">Revise</span>
            <span className="text-center">Published</span>
          </div>
          {clientHealth.length === 0 && (
            <div className="p-8 text-text-3 text-[13px] text-center">No clients yet.</div>
          )}
          {clientHealth.map((c) => (
            <div
              key={c.id}
              className={`flex flex-col sm:grid px-5 py-3 border-b border-border last:border-0 items-start sm:items-center gap-1 sm:gap-0 ${c.atRisk ? "bg-[#EF4444]/[0.03]" : ""}`}
              style={{ gridTemplateColumns: "1fr 120px 60px 60px 60px 80px" }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-text text-[13px] font-medium">{c.name}</span>
                  {!c.onboarding_complete && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-3 text-text-3">Pending</span>
                  )}
                  {c.atRisk && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#EF4444]/12 text-[#EF4444]">⚠ At Risk</span>
                  )}
                </div>
                <span className="text-text-3 text-[11px]">{c.email}</span>
              </div>
              <div><HealthBadge days={c.days} /></div>
              <div className="text-center text-text-2 text-[13px]">{c.totalCards || "—"}</div>
              <div className="text-center">
                {c.pendingReview > 0
                  ? <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#EC4899]/12 text-[#EC4899]">{c.pendingReview}</span>
                  : <span className="text-text-3 text-[12px]">—</span>}
              </div>
              <div className="text-center">
                {c.inRevisions > 0
                  ? <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#EF4444]/12 text-[#EF4444]">{c.inRevisions}</span>
                  : <span className="text-text-3 text-[12px]">—</span>}
              </div>
              <div className="text-center">
                {c.published > 0
                  ? <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#10B981]/12 text-[#10B981]">{c.published}</span>
                  : <span className="text-text-3 text-[12px]">—</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Workload */}
      {editorWorkload.length > 0 && (
        <div>
          <h3 className="text-text font-heading text-base font-bold m-0 mb-4">Team Workload</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {editorWorkload.map(({ email, cards, member, count }) => {
              const name = member?.name ?? email;
              const role = member?.role ?? "";
              const maxLoad = 10;
              const pct = Math.min((count / maxLoad) * 100, 100);
              const color = pct >= 80 ? "#EF4444" : pct >= 50 ? "#F59E0B" : "#10B981";
              return (
                <div key={email} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: ROLE_COLOR[role] || "#A8A49C" }}>
                      {name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-text text-[13px] font-semibold truncate">{name}</div>
                      <span className="text-[9px] font-bold tracking-[0.08em] uppercase"
                        style={{ color: ROLE_COLOR[role] || "#A8A49C" }}>
                        {role === "smm" ? "SMM" : role === "social_media_manager" ? "SMM" : role === "project_manager" ? "PM" : role}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-text font-bold text-[18px] leading-none">{count}</div>
                      <div className="text-text-3 text-[10px]">active</div>
                    </div>
                  </div>
                  {/* Load bar */}
                  <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  {count === 0 && (
                    <div className="text-text-3 text-[11px] mt-2">No active cards assigned</div>
                  )}
                  {count > 0 && (
                    <div className="mt-2 space-y-1 max-h-[80px] overflow-y-auto">
                      {cards.slice(0, 4).map((card) => (
                        <div key={card.id} className="text-text-3 text-[11px] truncate">· {card.title}</div>
                      ))}
                      {cards.length > 4 && (
                        <div className="text-text-3 text-[10px]">+{cards.length - 4} more</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
