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
import { SubscriptionSection } from "@/components/SubscriptionSection";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { GlobalSearch } from "@/components/GlobalSearch";
import { DriveFiles } from "@/components/DriveFiles";
import { TrashBin } from "@/components/TrashBin";
import { COLUMNS } from "@/lib/constants";
import type { OnboardingData } from "@/lib/constants";
import { TIERS } from "@/lib/tiers";
import type { TierKey } from "@/lib/tiers";

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
  subscription_tier?: string | null;
  kanbanCards?: KanbanCard[];
}

interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
  type?: string;
}

/* ── Icons ── */
function Icon({ d, size = 18 }: { d: string | string[]; size?: number }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

const NAV_ITEMS = [
  {
    id: "clients", label: "All Clients",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    id: "overview", label: "Overview",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    id: "files", label: "Files",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  },
  {
    id: "team", label: "Team", ownerOnly: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

const CLIENT_TABS = [
  { id: "intake", label: "Intake" },
  { id: "kanban", label: "Content Board" },
  { id: "calendar", label: "Calendar" },
  { id: "messages", label: "Messages" },
  { id: "resources", label: "Resources" },
  { id: "billing", label: "Billing" },
  { id: "activity", label: "Activity" },
  { id: "trash", label: "Trash" },
  { id: "info", label: "Account" },
];

const ROLE_COLOR: Record<string, string> = { owner: "#F59E0B", admin: "#FF3B3B", editor: "#10B981", smm: "#8B5CF6" };

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
  const [kanbanKey, setKanbanKey] = useState(0);
  const [clientCards, setClientCards] = useState<KanbanCard[]>([]);
  const [clientActivity, setClientActivity] = useState<ActivityItem[]>([]);
  const [allCards, setAllCards] = useState<KanbanCard[]>([]);
  const [allActivity, setAllActivity] = useState<ActivityItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();
  const supabase = createBrowserSupabase();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/team/login"); return; }
      const { data: member } = await supabase.from("team_members").select("*").eq("email", user.email).single();
      if (!member) { router.push("/team/login"); return; }
      setTeamUser(member);
    })();
  }, [supabase, router]);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/clients");
    if (res.ok) {
      const data = await res.json();
      const enriched = await Promise.all(
        data.map(async (c: Client) => {
          const kbRes = await fetch(`/api/kanban?client_id=${c.id}`);
          const cards = kbRes.ok ? await kbRes.json() : [];
          return { ...c, kanbanCards: cards };
        })
      );
      setClients(enriched);
      const all: KanbanCard[] = [];
      enriched.forEach((c: Client) => { if (c.kanbanCards) all.push(...c.kanbanCards); });
      setAllCards(all);
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (teamUser) loadClients(); }, [teamUser, loadClients]);

  const loadClientDetails = useCallback(async (clientId: string) => {
    try {
      const [cardsRes, activityRes] = await Promise.all([
        fetch(`/api/kanban?client_id=${clientId}`),
        fetch(`/api/activity?client_id=${clientId}&limit=50`),
      ]);
      if (cardsRes.ok) setClientCards(await cardsRes.json());
      if (activityRes.ok) {
        const actData = await activityRes.json();
        setClientActivity((actData.data || []).map((a: { id: string; action: string; created_at: string; actor_type?: string }) => ({
          id: a.id, description: a.action, timestamp: a.created_at, type: a.actor_type || "system",
        })));
      }
    } catch {}
  }, []);

  const loadOverviewActivity = useCallback(async () => {
    try {
      const items: ActivityItem[] = [];
      for (const c of clients.slice(0, 10)) {
        const res = await fetch(`/api/activity?client_id=${c.id}&limit=5`);
        if (res.ok) {
          const actData = await res.json();
          (actData.data || []).forEach((a: { id: string; action: string; created_at: string; actor_type?: string }) => {
            items.push({ id: a.id, description: `${c.name}: ${a.action}`, timestamp: a.created_at, type: a.actor_type || "system" });
          });
        }
      }
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAllActivity(items.slice(0, 30));
    } catch {}
  }, [clients]);

  useEffect(() => { if (selected) loadClientDetails(selected.id); }, [selected, loadClientDetails]);
  useEffect(() => { if (teamTab === "overview" && clients.length > 0) loadOverviewActivity(); }, [teamTab, clients, loadOverviewActivity]);

  // Cmd+K global search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowSearch(true); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const logout = async () => { await supabase.auth.signOut(); router.push("/team/login"); };

  const handleCardUpdate = (updatedCard: KanbanCard) => {
    setClientCards((prev) => prev.map((c) => c.id === updatedCard.id ? updatedCard : c));
    setSelectedCard(null);
    setKanbanKey((k) => k + 1);
  };
  const handleCardDelete = (cardId: string) => {
    setClientCards((prev) => prev.filter((c) => c.id !== cardId));
    setSelectedCard(null);
  };

  const switchTeamTab = (id: string) => { setTeamTab(id); setSelected(null); setMobileMenuOpen(false); };

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
  const currentUser = { name: teamUser.name, email: teamUser.email, type: "team" as const };
  const navItems = NAV_ITEMS.filter((n) => !n.ownerOnly || ["owner", "admin"].includes(teamUser.role));

  const overflowClientTabs = ["kanban", "messages", "calendar", "resources", "billing", "trash"];

  return (
    <div className="bg-bg h-screen flex overflow-hidden">

      {/* ══════════════ SIDEBAR (Desktop) ══════════════ */}
      <aside className={`hidden md:flex flex-col border-r border-border bg-surface shrink-0 transition-all duration-200 ${sidebarCollapsed ? "w-[68px]" : "w-[220px]"}`}>
        {/* Logo */}
        <div className={`pt-6 shrink-0 ${sidebarCollapsed ? "px-4" : "px-5"}`}>
          {!sidebarCollapsed
            ? <Logo size={13} sub="Team Portal" />
            : <div className="flex justify-center"><span className="text-red font-heading font-bold text-[15px]">T</span></div>}
        </div>

        {/* Collapse toggle */}
        <div className={`relative mt-4 mb-2 shrink-0 ${sidebarCollapsed ? "mx-3" : "mx-5"}`}>
          <div className="border-t border-border" />
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 -top-3.5 w-7 h-7 flex items-center justify-center rounded-full bg-surface border border-border text-text-3 hover:text-text hover:border-border-2 cursor-pointer transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-2 space-y-0.5 overflow-y-auto ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          {navItems.map((t) => (
            <button
              key={t.id}
              onClick={() => switchTeamTab(t.id)}
              title={sidebarCollapsed ? t.label : undefined}
              className={`w-full flex items-center rounded-lg text-[13px] font-medium cursor-pointer transition-all border-none font-body text-left ${
                sidebarCollapsed ? "justify-center py-2.5 px-0" : "gap-3 px-3 py-2.5"
              } ${teamTab === t.id && !selected ? "bg-red/10 text-red" : "bg-transparent text-text-2 hover:text-text hover:bg-surface-2"}`}
            >
              <span className={`shrink-0 ${teamTab === t.id && !selected ? "text-red" : "text-text-3"}`}>{t.icon}</span>
              {!sidebarCollapsed && t.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className={`py-3 border-t border-border ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <NotificationBell userEmail={teamUser.email} userType="team" />
              <Avatar name={teamUser.name} size={32} />
            </div>
          ) : (
            <>
              {/* Search button */}
              <button
                onClick={() => setShowSearch(true)}
                className="w-full flex items-center gap-2 px-3 py-2 mb-1 rounded-lg bg-surface-2 border border-border text-text-3 text-[12px] font-body cursor-pointer transition-all hover:border-border-2 hover:text-text-2"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span className="flex-1 text-left">Search...</span>
                <kbd className="text-[10px] bg-surface-3 py-0.5 px-1.5 rounded text-text-3">⌘K</kbd>
              </button>

              {/* User info */}
              <div className="flex items-center gap-2.5 px-3 py-2">
                <Avatar name={teamUser.name} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-text text-[12px] font-semibold truncate">{teamUser.name}</div>
                  <span
                    className="text-[9px] font-bold tracking-[0.08em] uppercase py-[1px] px-[5px] rounded"
                    style={{ color: ROLE_COLOR[teamUser.role] || "#A8A49C", background: `${ROLE_COLOR[teamUser.role] || "#A8A49C"}18` }}
                  >
                    {teamUser.role === "smm" ? "Social Media Manager" : teamUser.role}
                  </span>
                </div>
                <NotificationBell userEmail={teamUser.email} userType="team" />
              </div>
              <button
                onClick={logout}
                className="w-full mt-1 px-3 py-2 text-left text-text-3 hover:text-text text-[12px] rounded-lg hover:bg-surface-2 bg-transparent border-none cursor-pointer transition-colors font-body"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ══════════════ MOBILE HEADER ══════════════ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface border-b border-border h-[52px] flex items-center px-4">
        <div className="w-10 flex items-center">
          <NotificationBell userEmail={teamUser.email} userType="team" />
        </div>
        <div className="flex-1 text-center font-heading font-bold text-red leading-[1.05]" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          <div>THE FULL</div>
          <div>COLLECTION</div>
        </div>
        <div className="w-10 flex items-center justify-end">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-2 border border-border text-text-2 cursor-pointer"
          >
            {mobileMenuOpen
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/60" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-[52px] right-0 w-[260px] h-[calc(100vh-52px)] bg-surface border-l border-border flex flex-col overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* User info */}
            <div className="px-4 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar name={teamUser.name} size={36} />
                <div className="min-w-0">
                  <div className="text-text text-[13px] font-semibold truncate">{teamUser.name}</div>
                  <span className="text-[10px] font-bold tracking-[0.08em] uppercase py-[1px] px-[5px] rounded"
                    style={{ color: ROLE_COLOR[teamUser.role] || "#A8A49C", background: `${ROLE_COLOR[teamUser.role] || "#A8A49C"}18` }}>
                    {teamUser.role === "smm" ? "Social Media Manager" : teamUser.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 pt-3">
              <button
                onClick={() => { setMobileMenuOpen(false); setShowSearch(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text-3 text-[13px] font-body cursor-pointer transition-all hover:border-border-2 hover:text-text-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span className="flex-1 text-left">Search...</span>
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {navItems.map((t) => (
                <button
                  key={t.id}
                  onClick={() => switchTeamTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-medium cursor-pointer transition-all border-none font-body text-left ${
                    teamTab === t.id && !selected ? "bg-red/10 text-red" : "bg-transparent text-text-2 hover:text-text hover:bg-surface-2"
                  }`}
                >
                  <span className={`shrink-0 ${teamTab === t.id && !selected ? "text-red" : "text-text-3"}`}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Sign out */}
            <div className="px-3 py-3 border-t border-border">
              <button onClick={logout} className="w-full px-3 py-3 text-left text-text-3 hover:text-red text-[14px] rounded-lg hover:bg-surface-2 bg-transparent border-none cursor-pointer transition-colors font-body">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile spacer */}
        <div className="md:hidden h-[52px] shrink-0" />

        {/* Desktop top bar */}
        <div className="hidden md:flex h-[52px] border-b border-border px-6 items-center justify-between shrink-0">
          <h2 className="text-text font-heading text-[16px] font-bold m-0 shrink-0">
            {selected ? selected.name : navItems.find((n) => n.id === teamTab)?.label || "Team Portal"}
          </h2>
          <button
            onClick={() => setShowSearch(true)}
            className="flex-1 max-w-[520px] mx-auto text-text-3 hover:text-text-2 bg-surface border border-border hover:border-border-2 rounded-xl py-2 px-4 cursor-pointer font-body text-[13px] transition-all flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span className="flex-1 text-left">Search content, messages, files...</span>
            <kbd className="text-[10px] bg-surface-3 py-0.5 px-1.5 rounded text-text-3">⌘K</kbd>
          </button>
          <div className="w-[120px]" />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">

          {/* ── OVERVIEW TAB ── */}
          {teamTab === "overview" && !selected && (
            <div className="flex-1 overflow-y-auto">
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
              <AnalyticsDashboard clientId="all" cards={allCards} activity={allActivity} />
              <div className="px-5 sm:px-8 pb-8">
                <h3 className="text-text font-heading text-base font-bold m-0 mb-4">Content by Client</h3>
                <div className="bg-surface border border-border rounded-xl overflow-hidden overflow-x-auto">
                  <div className="grid gap-2 px-5 py-2.5 border-b border-border min-w-[600px]" style={{ gridTemplateColumns: `1fr ${COLUMNS.map(() => "60px").join(" ")}` }}>
                    <span className="text-text-3 text-[11px] font-bold tracking-[0.08em] uppercase">Client</span>
                    {COLUMNS.map((c) => <span key={c.id} className="text-text-3 text-[10px] font-bold tracking-[0.06em] uppercase text-center">{c.label.split(" ")[0]}</span>)}
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

          {/* ── FILES TAB ── */}
          {teamTab === "files" && !selected && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <DriveFiles folderId={process.env.NEXT_PUBLIC_GOOGLE_DRIVE_ROOT_FOLDER} />
            </div>
          )}

          {/* ── TEAM TAB ── */}
          {teamTab === "team" && !selected && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-[28px_32px]">
              <TeamManagement teamUser={teamUser} />
            </div>
          )}

          {/* ── ALL CLIENTS LIST ── */}
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
                    {["Client", "Shorts", "YouTube", "SMM", "Onboarding", ""].map((h, i) => (
                      <span key={i} className={`text-text-3 text-[11px] font-bold tracking-[0.08em] uppercase${h === "Shorts" ? " col-short" : h === "YouTube" ? " col-long" : ""}`}>{h}</span>
                    ))}
                  </div>
                  {filtered.length === 0 && (
                    <div className="p-10 text-center text-text-3 text-[13px]">
                      {clients.length === 0 ? "No clients have signed up yet." : "No clients match your search."}
                    </div>
                  )}
                  {filtered.map((c) => {
                    const tier = c.subscription_tier && c.subscription_tier in TIERS ? TIERS[c.subscription_tier as TierKey] : null;
                    return (
                    <div key={c.id} className="client-row" onClick={() => { setSelected(c); setClientTab("intake"); }}>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} />
                        <div>
                          <span className="text-text text-sm font-medium block">{c.name}</span>
                          <span className="text-text-3 text-[11px] hidden sm:block">{c.email}</span>
                        </div>
                      </div>
                      <span className="col-short text-text-2 text-[13px] hidden sm:inline font-medium">
                        {tier ? (tier.shortForm === null ? "∞" : `${tier.shortForm}`) : "—"}
                      </span>
                      <span className="col-long text-text-2 text-[13px] hidden sm:inline font-medium">
                        {tier ? (tier.youtube === 0 ? "—" : `${tier.youtube}`) : "—"}
                      </span>
                      <span className="text-[11px] font-bold tracking-[0.06em] py-[3px] px-2 rounded-md inline-block"
                        style={tier?.smm
                          ? { background: "rgba(139,92,246,0.1)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.2)" }
                          : { background: "rgba(168,164,156,0.08)", color: "#6B6763", border: "1px solid rgba(168,164,156,0.12)" }
                        }>
                        {tier?.smm ? "Yes" : "—"}
                      </span>
                      <span
                        className="col-status text-[11px] font-bold tracking-[0.06em] py-[3px] px-2.5 rounded-md inline-block"
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
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── CLIENT DETAIL ── */}
          {selected && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Client sub-nav */}
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

              <div className={`flex-1 ${overflowClientTabs.includes(clientTab) ? "overflow-hidden" : "overflow-auto"}`}>
                {/* Intake */}
                {clientTab === "intake" && <IntakeView data={selected.onboarding_data} title={`${selected.name}'s Intake Form`} subtitle="Submitted onboarding responses" />}

                {/* Content Board */}
                {clientTab === "kanban" && (
                  <Kanban key={kanbanKey} clientId={selected.id} clientName={selected.name} onCardClick={(card) => setSelectedCard(card as KanbanCard)} />
                )}

                {/* Calendar */}
                {clientTab === "calendar" && (
                  <div className="h-full">
                    <ContentCalendar cards={clientCards} onCardClick={(card) => setSelectedCard(card as KanbanCard)} />
                  </div>
                )}

                {/* Messages */}
                {clientTab === "messages" && (
                  <div className="h-full">
                    <MessageThread clientId={selected.id} currentUser={currentUser} clientName={selected.name} />
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
                    <SubscriptionSection clientId={selected.id} isTeam={true} />
                  </div>
                )}

                {/* Activity */}
                {clientTab === "activity" && (
                  <div className="p-5 sm:p-8 max-w-[700px] mx-auto">
                    <h2 className="text-text font-heading text-xl font-[800] m-0 mb-1">Recent Activity</h2>
                    <p className="text-text-2 text-[13px] m-0 mb-6">Activity log for {selected.name}</p>
                    <div className="bg-surface border border-border rounded-xl overflow-hidden">
                      {clientActivity.length === 0 && <div className="p-10 text-text-3 text-[13px] text-center">No activity recorded yet.</div>}
                      {clientActivity.map((a) => (
                        <div key={a.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-border last:border-b-0">
                          <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{
                            background: a.type === "create" ? "#10B981" : a.type === "move" ? "#3B82F6" : a.type === "delete" ? "#EF4444" : a.type === "publish" ? "#E02020" : "#5A5652",
                          }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-text-2 text-[13px] leading-[1.45] m-0">{a.description}</p>
                            <span className="text-text-3 text-[10px]">
                              {(() => {
                                const d = new Date(a.timestamp);
                                const now = new Date();
                                const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
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

                {/* Trash */}
                {clientTab === "trash" && (
                  <div className="h-full">
                    <TrashBin clientId={selected.id} />
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
      </div>

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

      {/* Global Search */}
      {showSearch && (
        <GlobalSearch
          cards={allCards}
          onSelectCard={(card) => {
            setShowSearch(false);
            // Find which client this card belongs to and navigate to it
            const owner = clients.find((c) => c.kanbanCards?.some((k) => k.id === card.id));
            if (owner) { setSelected(owner); setClientTab("kanban"); setTeamTab("clients"); }
          }}
          onSelectMessage={() => { setShowSearch(false); }}
          onSelectResource={() => { setShowSearch(false); }}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
