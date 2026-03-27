"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Kanban } from "@/components/Kanban";
import { IntakeView } from "@/components/IntakeView";
import { TeamManagement } from "@/components/TeamManagement";
import { NotificationBell } from "@/components/NotificationBell";
import { CardDetailModal } from "@/components/CardDetailModal";
import { ContentCalendar } from "@/components/ContentCalendar";
import { MessageThread } from "@/components/MessageThread";
import { ResourceLibrary } from "@/components/ResourceLibrary";
import { InvoiceSection } from "@/components/InvoiceSection";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { COLUMNS } from "@/lib/constants";
import type { OnboardingData } from "@/lib/constants";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  platform?: string;
  column_id: string;
  position: number;
  due_date?: string;
  priority?: "low" | "medium" | "high";
  created_at?: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  onboarding_complete: boolean;
  onboarding_data: OnboardingData | null;
  created_at: string;
  kanbanCards?: KanbanCard[];
}

interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
  type?: string;
}

export default function TeamPortalClient() {
  const [teamUser, setTeamUser] = useState<TeamMember | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [teamTab, setTeamTab] = useState("clients");
  const [clientTab, setClientTab] = useState("intake");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [clientCards, setClientCards] = useState<KanbanCard[]>([]);
  const [clientActivity, setClientActivity] = useState<ActivityItem[]>([]);
  const [allCards, setAllCards] = useState<KanbanCard[]>([]);
  const [allActivity, setAllActivity] = useState<ActivityItem[]>([]);
  const router = useRouter();
  const supabase = createBrowserSupabase();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/team/login"); return; }

      const { data: member } = await supabase
        .from("team_members")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!member) { router.push("/team/login"); return; }
      setTeamUser(member);
    })();
  }, [supabase, router]);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/clients");
    if (res.ok) {
      const data = await res.json();
      // Load kanban card counts for each client
      const enriched = await Promise.all(
        data.map(async (c: Client) => {
          const kbRes = await fetch(`/api/kanban?client_id=${c.id}`);
          const cards = kbRes.ok ? await kbRes.json() : [];
          return { ...c, kanbanCards: cards };
        })
      );
      setClients(enriched);

      // Aggregate all cards for overview
      const all: KanbanCard[] = [];
      enriched.forEach((c: Client) => {
        if (c.kanbanCards) all.push(...c.kanbanCards);
      });
      setAllCards(all);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (teamUser) loadClients();
  }, [teamUser, loadClients]);

  // Load cards and activity for selected client
  const loadClientDetails = useCallback(async (clientId: string) => {
    try {
      const [cardsRes, activityRes] = await Promise.all([
        fetch(`/api/kanban?client_id=${clientId}`),
        fetch(`/api/activity?client_id=${clientId}&limit=50`),
      ]);
      if (cardsRes.ok) {
        const cards = await cardsRes.json();
        setClientCards(cards);
      }
      if (activityRes.ok) {
        const actData = await activityRes.json();
        const items = (actData.data || []).map((a: { id: string; action: string; created_at: string; actor_type?: string }) => ({
          id: a.id,
          description: a.action,
          timestamp: a.created_at,
          type: a.actor_type || "system",
        }));
        setClientActivity(items);
      }
    } catch (err) {
      console.error("Failed to load client details.");
    }
  }, []);

  // Load aggregated activity for overview
  const loadOverviewActivity = useCallback(async () => {
    try {
      // Gather recent activity from all clients (first few)
      const items: ActivityItem[] = [];
      for (const c of clients.slice(0, 10)) {
        const res = await fetch(`/api/activity?client_id=${c.id}&limit=5`);
        if (res.ok) {
          const actData = await res.json();
          (actData.data || []).forEach((a: { id: string; action: string; created_at: string; actor_type?: string }) => {
            items.push({
              id: a.id,
              description: `${c.name}: ${a.action}`,
              timestamp: a.created_at,
              type: a.actor_type || "system",
            });
          });
        }
      }
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAllActivity(items.slice(0, 30));
    } catch (err) {
      console.error("Failed to load overview activity.");
    }
  }, [clients]);

  useEffect(() => {
    if (selected) {
      loadClientDetails(selected.id);
    }
  }, [selected, loadClientDetails]);

  useEffect(() => {
    if (teamTab === "overview" && clients.length > 0) {
      loadOverviewActivity();
    }
  }, [teamTab, clients, loadOverviewActivity]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/team/login");
  };

  const handleCardUpdate = (updatedCard: KanbanCard) => {
    setClientCards((prev) => prev.map((c) => c.id === updatedCard.id ? updatedCard : c));
    setSelectedCard(null);
  };

  const handleCardDelete = (cardId: string) => {
    setClientCards((prev) => prev.filter((c) => c.id !== cardId));
    setSelectedCard(null);
  };

  if (!teamUser) return null;

  const filtered = clients.filter((c) => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "complete" && c.onboarding_complete) || (filter === "pending" && !c.onboarding_complete);
    return matchSearch && matchFilter;
  });

  const totalClients = clients.length;
  const onboarded = clients.filter((c) => c.onboarding_complete).length;
  const totalContent = clients.reduce((acc, c) => acc + (c.kanbanCards?.length || 0), 0);
  const totalPublished = clients.reduce((acc, c) => acc + (c.kanbanCards?.filter((k) => k.column_id === "published").length || 0), 0);

  const ROLE_COLOR: Record<string, string> = { owner: "#F59E0B", admin: "#FF3B3B", editor: "#10B981" };

  const currentUser = teamUser ? { name: teamUser.name, email: teamUser.email, type: "team" as const } : { name: "", email: "", type: "team" as const };

  const CLIENT_TABS = [
    { id: "intake", label: "Intake" },
    { id: "kanban", label: "Content Board" },
    { id: "calendar", label: "Calendar" },
    { id: "messages", label: "Messages" },
    { id: "resources", label: "Resources" },
    { id: "billing", label: "Billing" },
    { id: "activity", label: "Activity" },
    { id: "info", label: "Account" },
  ];

  return (
    <div className="bg-bg h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 h-[58px] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Logo size={13} sub="Team Portal" />
          <span className="team-badge hidden sm:inline-block">Team</span>
        </div>
        <div className="flex gap-[3px] overflow-x-auto hide-scrollbar">
          {[
            { id: "clients", label: "All Clients" },
            { id: "overview", label: "Overview" },
            ...(["owner", "admin"].includes(teamUser.role) ? [{ id: "team", label: "Team" }] : []),
          ].map((t) => (
            <button
              key={t.id}
              className={`nav-tab whitespace-nowrap${teamTab === t.id ? " active" : ""}`}
              onClick={() => { setTeamTab(t.id); setSelected(null); }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell userEmail={teamUser.email} userType="team" />
          <div className="hidden sm:flex items-center gap-2">
            <Avatar name={teamUser.name} size={28} />
            <span className="text-text text-[13px] font-medium">{teamUser.name}</span>
            <span
              className="text-[10px] font-bold tracking-[0.08em] uppercase py-[2px] px-[7px] rounded-[5px]"
              style={{
                color: ROLE_COLOR[teamUser.role] || "#A8A49C",
                background: `${ROLE_COLOR[teamUser.role] || "#A8A49C"}18`,
                border: `1px solid ${ROLE_COLOR[teamUser.role] || "#A8A49C"}30`,
              }}
            >
              {teamUser.role}
            </span>
          </div>
          <button onClick={logout} className="text-text-3 bg-transparent border-none cursor-pointer text-xs font-body">Sign out</button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* OVERVIEW TAB */}
        {teamTab === "overview" && (
          <div className="flex-1 overflow-y-auto">
            {/* Summary stats */}
            <div className="p-5 sm:p-[36px_32px]">
              <h2 className="text-text font-heading text-[22px] font-[800] m-0 mb-1.5">Overview</h2>
              <p className="text-text-2 text-[13px] m-0 mb-8">A snapshot of all client activity across The Full Collection.</p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-9">
                {[
                  { l: "Total Clients", v: totalClients, accent: false },
                  { l: "Onboarded", v: onboarded, accent: false },
                  { l: "Content Pieces", v: totalContent, accent: false },
                  { l: "Published", v: totalPublished, accent: true },
                ].map((s) => (
                  <div key={s.l} className="bg-surface border border-border rounded-xl p-[18px_20px]">
                    <div className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mb-2">{s.l}</div>
                    <div className={`font-heading text-[28px] sm:text-[32px] font-[800] leading-none ${s.accent ? "text-red" : "text-text"}`}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics Dashboard */}
            <AnalyticsDashboard
              clientId="all"
              cards={allCards}
              activity={allActivity}
            />

            {/* Content by Client table */}
            <div className="px-5 sm:px-8 pb-8">
              <h3 className="text-text font-heading text-base font-bold m-0 mb-4">Content by Client</h3>
              <div className="bg-surface border border-border rounded-xl overflow-hidden overflow-x-auto">
                <div className="grid gap-2 px-5 py-2.5 border-b border-border min-w-[600px]" style={{ gridTemplateColumns: `1fr ${COLUMNS.map(() => "60px").join(" ")}` }}>
                  <span className="text-text-3 text-[11px] font-bold tracking-[0.08em] uppercase">Client</span>
                  {COLUMNS.map((c) => (
                    <span key={c.id} className="text-text-3 text-[10px] font-bold tracking-[0.06em] uppercase text-center">{c.label.split(" ")[0]}</span>
                  ))}
                </div>
                {clients.length === 0 && <div className="p-7 text-text-3 text-[13px]">No clients yet.</div>}
                {clients.map((c) => (
                  <div key={c.id} className="grid gap-2 px-5 py-3 border-b border-border items-center min-w-[600px]" style={{ gridTemplateColumns: `1fr ${COLUMNS.map(() => "60px").join(" ")}` }}>
                    <div>
                      <span className="text-text text-[13px] font-medium">{c.name}</span>
                      <span className="text-text-3 text-[11px] ml-2 hidden sm:inline">{c.email}</span>
                    </div>
                    {COLUMNS.map((col) => {
                      const count = c.kanbanCards?.filter((k) => k.column_id === col.id).length || 0;
                      return (
                        <div key={col.id} className="text-center">
                          {count > 0
                            ? <span className="inline-block rounded-md text-xs font-semibold py-[2px] px-2 min-w-[24px]" style={{ background: `${col.color}22`, color: col.color }}>{count}</span>
                            : <span className="text-text-3 text-xs">—</span>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CLIENTS TAB - LIST */}
        {teamTab === "clients" && !selected && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-[28px_32px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <div>
                <h2 className="text-text font-heading text-[22px] font-[800] m-0 mb-1">All Clients</h2>
                <p className="text-text-2 text-[13px] m-0">{totalClients} client{totalClients !== 1 ? "s" : ""} · {onboarded} onboarded</p>
              </div>
              <button className="tfc-btn-ghost text-xs py-2 px-4 self-start" onClick={loadClients}>↻ Refresh</button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
              <input className="tfc-input max-w-full sm:max-w-[280px]" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." />
              <div className="flex gap-1.5">
                {(["all", "complete", "pending"] as const).map((f) => (
                  <button key={f} className={`tfc-pill${filter === f ? " active" : ""}`} onClick={() => setFilter(f)} style={{ padding: "7px 14px", fontSize: 12 }}>
                    {f === "all" ? "All" : f === "complete" ? "Onboarded" : "Pending"}
                  </button>
                ))}
              </div>
            </div>
            {loading && <div className="text-text-3 text-[13px] py-10 text-center">Loading clients...</div>}
            {!loading && (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="client-row cursor-default border-b border-border-2 hidden sm:grid">
                  {["Client", "Email", "Joined", "Onboarding", ""].map((h, i) => (
                    <span key={i} className="text-text-3 text-[11px] font-bold tracking-[0.08em] uppercase">{h}</span>
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div className="p-10 text-center text-text-3 text-[13px]">
                    {clients.length === 0 ? "No clients have signed up yet." : "No clients match your search."}
                  </div>
                )}
                {filtered.map((c) => (
                  <div key={c.id} className="client-row" onClick={() => { setSelected(c); setClientTab("intake"); }}>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name} />
                      <span className="text-text text-sm font-medium">{c.name}</span>
                    </div>
                    <span className="text-text-2 text-[13px] hidden sm:inline">{c.email}</span>
                    <span className="text-text-2 text-[13px] hidden sm:inline">{c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                    <span
                      className="text-[11px] font-bold tracking-[0.06em] py-[3px] px-2.5 rounded-md inline-block"
                      style={{
                        background: c.onboarding_complete ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                        color: c.onboarding_complete ? "#10B981" : "#F59E0B",
                        border: `1px solid ${c.onboarding_complete ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                      }}
                    >
                      {c.onboarding_complete ? "Complete" : "Pending"}
                    </span>
                    <span className="text-text-3 text-base">›</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CLIENT DETAIL */}
        {teamTab === "clients" && selected && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="border-b border-border px-4 sm:px-6 py-2 sm:py-0 sm:h-14 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-2">
              <div className="flex items-center gap-3.5">
                <button onClick={() => setSelected(null)} className="text-text-2 bg-transparent border-none cursor-pointer text-[13px] font-body flex items-center gap-1">
                  ← Back
                </button>
                <div className="w-px h-[18px] bg-border-2 hidden sm:block" />
                <div className="flex items-center gap-2.5">
                  <Avatar name={selected.name} size={28} />
                  <span className="text-text text-sm font-semibold">{selected.name}</span>
                  <span className="text-text-3 text-[13px] hidden sm:inline">{selected.email}</span>
                </div>
              </div>
              <div className="flex gap-[3px] overflow-x-auto hide-scrollbar pb-1 sm:pb-0">
                {CLIENT_TABS.map((t) => (
                  <button key={t.id} className={`nav-tab whitespace-nowrap${clientTab === t.id ? " active" : ""}`} onClick={() => setClientTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={`flex-1 ${clientTab === "kanban" || clientTab === "messages" || clientTab === "calendar" || clientTab === "resources" || clientTab === "billing" ? "overflow-hidden" : "overflow-auto"}`}>
              {/* Intake Form */}
              {clientTab === "intake" && (
                <IntakeView data={selected.onboarding_data} title={`${selected.name}'s Intake Form`} subtitle="Submitted onboarding responses" />
              )}

              {/* Content Board (Kanban) */}
              {clientTab === "kanban" && (
                <Kanban clientId={selected.id} clientName={selected.name} />
              )}

              {/* Calendar */}
              {clientTab === "calendar" && (
                <div className="h-full">
                  <ContentCalendar
                    cards={clientCards}
                    onCardClick={(card) => setSelectedCard(card as KanbanCard)}
                  />
                </div>
              )}

              {/* Messages */}
              {clientTab === "messages" && (
                <div className="h-full">
                  <MessageThread clientId={selected.id} currentUser={currentUser} />
                </div>
              )}

              {/* Resources */}
              {clientTab === "resources" && (
                <div className="h-full">
                  <ResourceLibrary clientId={selected.id} currentUser={currentUser} isTeam={true} />
                </div>
              )}

              {/* Billing */}
              {clientTab === "billing" && (
                <div className="h-full">
                  <InvoiceSection clientId={selected.id} currentUser={currentUser} isTeam={true} />
                </div>
              )}

              {/* Activity */}
              {clientTab === "activity" && (
                <div className="p-5 sm:p-8 max-w-[700px] mx-auto">
                  <h2 className="text-text font-heading text-xl font-[800] m-0 mb-1">Recent Activity</h2>
                  <p className="text-text-2 text-[13px] m-0 mb-6">Activity log for {selected.name}</p>
                  <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    {clientActivity.length === 0 && (
                      <div className="p-10 text-text-3 text-[13px] text-center">No activity recorded yet.</div>
                    )}
                    {clientActivity.map((a) => (
                      <div key={a.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-border last:border-b-0">
                        <div
                          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                          style={{
                            background:
                              a.type === "create" ? "#10B981"
                              : a.type === "move" ? "#3B82F6"
                              : a.type === "delete" ? "#EF4444"
                              : a.type === "publish" ? "#E02020"
                              : "#5A5652",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-text-2 text-[13px] leading-[1.45] m-0">{a.description}</p>
                          <span className="text-text-3 text-[10px]">
                            {(() => {
                              const d = new Date(a.timestamp);
                              const now = new Date();
                              const diffMs = now.getTime() - d.getTime();
                              const diffMin = Math.floor(diffMs / 60000);
                              if (diffMin < 1) return "just now";
                              if (diffMin < 60) return `${diffMin}m ago`;
                              const diffHrs = Math.floor(diffMin / 60);
                              if (diffHrs < 24) return `${diffHrs}h ago`;
                              const diffDays = Math.floor(diffHrs / 24);
                              if (diffDays < 7) return `${diffDays}d ago`;
                              return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                            })()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Info */}
              {clientTab === "info" && (
                <div className="p-5 sm:p-8 max-w-[560px] mx-auto">
                  <h2 className="text-text font-heading text-xl font-[800] m-0 mb-6">Account Info</h2>
                  <div className="bg-surface border border-border rounded-[14px] p-5 sm:p-7">
                    <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border">
                      <Avatar name={selected.name} size={52} />
                      <div>
                        <div className="text-text text-[17px] font-bold">{selected.name}</div>
                        <div className="text-text-2 text-[13px] mt-0.5">{selected.email}</div>
                      </div>
                    </div>
                    {[
                      { l: "Member Since", v: selected.created_at ? new Date(selected.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Unknown" },
                      { l: "Onboarding", v: selected.onboarding_complete ? "Complete" : "Pending", color: selected.onboarding_complete ? "#10B981" : "#F59E0B" },
                      { l: "Total Content Pieces", v: String(selected.kanbanCards?.length || 0) },
                      { l: "Published", v: String(selected.kanbanCards?.filter((k) => k.column_id === "published").length || 0) },
                    ].map((row) => (
                      <div key={row.l} className="flex justify-between py-2.5 border-b border-border">
                        <span className="text-text-3 text-[13px]">{row.l}</span>
                        <span className="text-[13px] font-semibold" style={{ color: row.color || "#F0EDE6" }}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TEAM MANAGEMENT TAB */}
      {teamTab === "team" && (
        <div className="flex-1 overflow-y-auto p-5 sm:p-[28px_32px]">
          <TeamManagement teamUser={teamUser} />
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && selected && (
        <CardDetailModal
          card={selectedCard}
          clientId={selected.id}
          currentUser={currentUser}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}
    </div>
  );
}
