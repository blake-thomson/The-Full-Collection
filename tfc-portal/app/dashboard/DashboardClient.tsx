"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Kanban } from "@/components/Kanban";
import { CardDetailModal } from "@/components/CardDetailModal";
import { NotificationBell } from "@/components/NotificationBell";
import { ClientMessenger } from "@/components/ClientMessenger";
import { ContentCalendar } from "@/components/ContentCalendar";
import { ResourceLibrary } from "@/components/ResourceLibrary";
import { ContentBrief } from "@/components/ContentBrief";
import { ClientHome } from "@/components/ClientHome";
import { ClientProfile } from "@/components/ClientProfile";
import { GlobalSearch } from "@/components/GlobalSearch";
import { DriveFiles } from "@/components/DriveFiles";
import { TrashBin } from "@/components/TrashBin";
import { FAQ } from "@/components/FAQ";
import { IdeaSwiper } from "@/components/IdeaSwiper";
import { useRealtimeKanban, useRealtimeMessages, useRealtimeNotifications } from "@/lib/use-realtime";

import { PerformanceAnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { normalizeContentType } from "@/lib/constants";
import type { OnboardingData } from "@/lib/constants";
import type { Client, KanbanCard, CurrentUser } from "@/lib/types";

const TABS = [
  {
    id: "home", label: "Home",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "kanban", label: "Content Tracker",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="3" width="7" height="10" rx="1" />
      </svg>
    ),
  },
  {
    id: "calendar", label: "Calendar",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "messages", label: "Messages",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    id: "files", label: "Files",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    id: "resources", label: "Resources",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    id: "analytics", label: "Analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function DashboardClient() {
  const [tab, setTab] = useState("home");
  const [client, setClient] = useState<Client | null>(null);
  const [kanbanCards, setKanbanCards] = useState<KanbanCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [kanbanKey, setKanbanKey] = useState(0);
  const [openCreateCard, setOpenCreateCard] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showIdeaSwiper, setShowIdeaSwiper] = useState(false);

  const router = useRouter();
  const supabase = createBrowserSupabase();

  const loadKanbanCards = useCallback(async () => {
    if (!client) return;
    const res = await fetch(`/api/kanban?client_id=${client.id}`);
    if (res.ok) setKanbanCards(await res.json());
  }, [client]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const res = await fetch(`/api/clients?email=${user.email}`);
      if (!res.ok) { router.push("/login"); return; }
      const clients = await res.json();
      if (clients.length > 0) {
        const c = clients[0];
        if (!c.onboarding_complete) { router.push("/onboarding"); return; }
        if (!c.profile_complete) { router.push("/welcome"); return; }
        setClient(c);
      }
    })();
  }, []);

  useEffect(() => { loadKanbanCards(); }, [loadKanbanCards]);

  // Real-time subscriptions
  useRealtimeKanban(client?.id || "", () => { loadKanbanCards(); setKanbanKey((k) => k + 1); });
  useRealtimeMessages(client?.id || "", () => { /* triggers re-render for message tab badge */ });
  useRealtimeNotifications(client?.email || "", () => { /* NotificationBell polls, but this gives instant updates */ });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowSearch(true); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleCardUpdate = (updatedCard: KanbanCard) => {
    setKanbanCards((prev) => prev.map((c) => c.id === updatedCard.id ? updatedCard : c));
    setSelectedCard(null);
    setKanbanKey((k) => k + 1);
    setOpenCreateCard(false);
  };

  const handleCardDelete = (cardId: string) => {
    setKanbanCards((prev) => prev.filter((c) => c.id !== cardId));
    setSelectedCard(null);
  };

  const handleAcceptIdea = async (idea: { title: string; description: string; platform: string; content_style: string; content_type: string; priority: string; hook: string; cta: string }) => {
    if (!client) return;

    const normalizedType = normalizeContentType(idea.content_type || "");

    try {
      const res = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client.id,
          column_id: "idea",
          title: idea.title,
          description: `${idea.description}\n\nHook: "${idea.hook}"${idea.cta ? `\n\nCTA: ${idea.cta}` : ""}`,
          platform: idea.platform?.toLowerCase().trim(),
          content_style: idea.content_style,
          content_type: normalizedType,
          priority: idea.priority || "medium",
        }),
      });
      if (res.ok) {
        const newCard = await res.json();
        setKanbanCards((prev) => [...prev, newCard]);
        setKanbanKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Failed to create card from idea:", err);
    }
  };

  const switchTab = (id: string) => {
    setTab(id);
    setMobileMenuOpen(false);
  };

  if (!client) return null;

  const currentUser: CurrentUser = { name: client.name, email: client.email, type: "client" };
  const overflowTabs = ["home", "kanban", "messages", "calendar", "files", "resources", "analytics", "help", "trash"];

  return (
    <div className="bg-bg h-screen flex overflow-hidden">
      {/* ============ SIDEBAR (Desktop) ============ */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-surface shrink-0 transition-all duration-200 ${
          sidebarCollapsed ? "w-[68px]" : "w-[220px]"
        }`}
      >
        {/* Logo */}
        <div className={`pt-6 shrink-0 ${sidebarCollapsed ? "px-4" : "px-5"}`}>
          {!sidebarCollapsed && <Logo size={13} />}
          {sidebarCollapsed && (
            <div className="flex justify-center">
              <span className="text-red font-heading font-bold text-[15px]">T</span>
            </div>
          )}
        </div>

        {/* Divider with collapse button */}
        <div className={`relative mt-4 mb-2 shrink-0 ${sidebarCollapsed ? "mx-3" : "mx-5"}`}>
          <div className="border-t border-border" />
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 -top-3.5 w-7 h-7 flex items-center justify-center rounded-full bg-surface border border-border text-text-3 hover:text-text hover:border-border-2 cursor-pointer transition-all"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Nav Items */}
        <nav className={`flex-1 py-2 space-y-0.5 overflow-y-auto ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              title={sidebarCollapsed ? t.label : undefined}
              className={`w-full flex items-center rounded-lg text-[13px] font-medium cursor-pointer transition-all border-none font-body text-left ${
                sidebarCollapsed ? "justify-center py-2.5 px-0" : "gap-3 px-3 py-2.5"
              } ${
                tab === t.id
                  ? "bg-red/10 text-red"
                  : "bg-transparent text-text-2 hover:text-text hover:bg-surface-2"
              }`}
            >
              <span className={`shrink-0 ${tab === t.id ? "text-red" : "text-text-3"}`}>
                {t.icon}
              </span>
              {!sidebarCollapsed && t.label}
            </button>
          ))}
        </nav>

        {/* User Footer */}
        <div className={`py-3 border-t border-border ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          {sidebarCollapsed ? (
            <button
              onClick={() => switchTab("profile")}
              className="flex justify-center py-2 bg-transparent border-none cursor-pointer w-full rounded-lg hover:bg-surface-2 transition-colors"
              title="Profile"
            >
              <Avatar name={client.name} size={32} src={client.avatar_url} />
            </button>
          ) : (
            <>
              <button
                onClick={() => switchTab("profile")}
                className={`flex items-center gap-2.5 px-3 py-2 w-full bg-transparent border-none cursor-pointer rounded-lg transition-colors ${
                  tab === "profile" ? "bg-red/10" : "hover:bg-surface-2"
                }`}
              >
                <Avatar name={client.name} size={32} src={client.avatar_url} />
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-text text-[12px] font-semibold truncate">{client.name}</div>
                  <div className="text-text-3 text-[10px] truncate">{client.email}</div>
                </div>
              </button>
              <button
                onClick={() => switchTab("trash")}
                className={`w-full mt-1 px-3 py-2 text-left text-[12px] rounded-lg bg-transparent border-none cursor-pointer transition-colors font-body flex items-center gap-2 ${
                  tab === "trash" ? "text-red" : "text-text-3 hover:text-text hover:bg-surface-2"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Recently Deleted
              </button>
              <button
                onClick={() => switchTab("help")}
                className={`w-full mt-1 px-3 py-2 text-left text-[12px] rounded-lg bg-transparent border-none cursor-pointer transition-colors font-body flex items-center gap-2 ${tab === "help" ? "text-red" : "text-text-3 hover:text-text hover:bg-surface-2"}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Help
              </button>
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

      {/* ============ MOBILE HEADER + MENU ============ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface border-b border-border h-[52px] flex items-center px-4">
        {/* Left: notification */}
        <div className="w-10 flex items-center">
          <NotificationBell userEmail={client.email} userType="client" />
        </div>
        {/* Center: stacked logo */}
        <div className="flex-1 text-center font-heading font-bold text-red leading-[1.05]" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          <div>THE FULL</div>
          <div>COLLECTION</div>
        </div>
        {/* Right: hamburger */}
        <div className="w-10 flex items-center justify-end">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-2 border border-border text-text-2 cursor-pointer"
          >
            {mobileMenuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/60" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute top-[52px] right-0 w-[260px] h-[calc(100vh-52px)] bg-surface border-l border-border flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Info — tap to open profile */}
            <button
              onClick={() => switchTab("profile")}
              className="w-full px-4 py-4 border-b border-border bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <Avatar name={client.name} size={36} src={client.avatar_url} />
                <div className="min-w-0">
                  <div className="text-text text-[13px] font-semibold truncate">{client.name}</div>
                  <div className="text-text-3 text-[11px] truncate">{client.email}</div>
                </div>
              </div>
            </button>

            {/* Search Bar */}
            <div className="px-3 pt-3">
              <button
                onClick={() => { setMobileMenuOpen(false); setShowSearch(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text-3 text-[13px] font-body cursor-pointer transition-all hover:border-border-2 hover:text-text-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="flex-1 text-left">Search...</span>
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => switchTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-medium cursor-pointer transition-all border-none font-body text-left ${
                    tab === t.id
                      ? "bg-red/10 text-red"
                      : "bg-transparent text-text-2 hover:text-text hover:bg-surface-2"
                  }`}
                >
                  <span className={`shrink-0 ${tab === t.id ? "text-red" : "text-text-3"}`}>
                    {t.icon}
                  </span>
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Recently Deleted + Sign Out */}
            <div className="px-3 py-3 border-t border-border" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
              <button
                onClick={() => switchTab("trash")}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-[14px] font-medium cursor-pointer transition-all border-none font-body text-left ${
                  tab === "trash"
                    ? "bg-red/10 text-red"
                    : "bg-transparent text-text-3 hover:text-text hover:bg-surface-2"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Recently Deleted
              </button>
              <button
                onClick={() => switchTab("help")}
                className={`w-full flex items-center gap-3 px-3 py-3 text-[14px] rounded-lg bg-transparent border-none cursor-pointer transition-colors font-body text-left ${tab === "help" ? "bg-red/10 text-red" : "text-text-3 hover:text-text hover:bg-surface-2"}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Help
              </button>
              <button
                onClick={logout}
                className="w-full px-3 py-3 text-left text-text-3 hover:text-red text-[14px] rounded-lg hover:bg-surface-2 bg-transparent border-none cursor-pointer transition-colors font-body"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex-1 flex flex-col min-w-0 md:h-screen">
        {/* Desktop Top Bar */}
        <div className="hidden md:flex h-[52px] border-b border-border px-6 items-center justify-between shrink-0">
          <h2 className="text-text font-heading text-[16px] font-bold m-0 shrink-0 w-[120px]">
            {TABS.find((t) => t.id === tab)?.label || (tab === "profile" ? "Profile" : tab === "trash" ? "Recently Deleted" : "Dashboard")}
          </h2>
          <button
            onClick={() => setShowSearch(true)}
            className="flex-1 max-w-[520px] mx-auto text-text-3 hover:text-text-2 bg-surface border border-border hover:border-border-2 rounded-xl py-2 px-4 cursor-pointer font-body text-[13px] transition-all flex items-center gap-2"
            title="Search (Cmd+K)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="flex-1 text-left">Search content, messages, files...</span>
            <kbd className="text-[10px] bg-surface-3 py-0.5 px-1.5 rounded text-text-3">⌘K</kbd>
          </button>
          <div className="flex items-center gap-3 shrink-0 w-[120px] justify-end">
            <NotificationBell userEmail={client.email} userType="client" />
          </div>
        </div>

        {/* Mobile spacer for fixed header */}
        <div className="md:hidden h-[52px] shrink-0" />

        {/* Content */}
        <div className={`flex-1 ${overflowTabs.includes(tab) ? "overflow-hidden" : "overflow-auto"}`}>
          {/* Home */}
          {tab === "home" && (
            <ClientHome
              clientName={client.name}
              cards={kanbanCards}
              onCardClick={(card) => setSelectedCard(card as KanbanCard)}
              onMessageTeam={() => setTab("messages")}
            />
          )}

          {/* Content Tracker (Kanban) */}
          {tab === "kanban" && (
            <div className="h-full flex flex-col">
              <Kanban
                key={kanbanKey}
                clientId={client.id}
                onCardClick={(card) => setSelectedCard(card as KanbanCard)}
                autoOpenCreate={openCreateCard}
              />
            </div>
          )}

          {/* Calendar */}
          {tab === "calendar" && (
            <div className="h-full">
              <ContentCalendar cards={kanbanCards} onCardClick={(card) => setSelectedCard(card as KanbanCard)} />
            </div>
          )}

          {/* Messages */}
          {tab === "messages" && (
            <div className="h-full flex flex-col overflow-hidden">
              <ClientMessenger clientId={client.id} currentUser={currentUser} />
            </div>
          )}

          {/* Files (Google Drive) */}
          {tab === "files" && (
            <div className="h-full p-4 sm:p-6 overflow-y-auto">
              <DriveFiles folderId={process.env.NEXT_PUBLIC_GOOGLE_DRIVE_ROOT_FOLDER} />
            </div>
          )}

          {/* Resources */}
          {tab === "resources" && (
            <div className="h-full">
              <ResourceLibrary clientId={client.id} currentUser={currentUser} isTeam={false} />
            </div>
          )}

          {/* Analytics */}
          {tab === "analytics" && (
            <div className="h-full overflow-y-auto p-4 sm:p-6">
              <PerformanceAnalyticsDashboard clientId={client.id} />
            </div>
          )}


          {/* Help / FAQ */}
          {tab === "help" && (
            <div className="h-full overflow-y-auto">
              <FAQ userType="client" />
            </div>
          )}

          {/* Recently Deleted */}
          {tab === "trash" && (
            <div className="h-full">
              <TrashBin clientId={client.id} />
            </div>
          )}

          {/* Profile (with Account, Billing, Intake sub-tabs) */}
          {tab === "profile" && (
            <ClientProfile
              client={client}
              onClientUpdate={(updated) => setClient((prev) => prev ? { ...prev, ...updated } : prev)}
              onLogout={logout}
            />
          )}
        </div>
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          clientId={client.id}
          currentUser={currentUser}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}

      {/* Content Brief Slide-over */}
      {showBrief && (
        <ContentBrief clientId={client.id} onClose={() => setShowBrief(false)} onCreated={loadKanbanCards} />
      )}

      {/* Global Search */}
      {showSearch && (
        <GlobalSearch
          cards={kanbanCards}
          onSelectCard={(card) => setSelectedCard(card as KanbanCard)}
          onSelectMessage={() => { setShowSearch(false); setTab("messages"); }}
          onSelectResource={() => { setShowSearch(false); setTab("resources"); }}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showIdeaSwiper && (
        <IdeaSwiper
          clientId={client.id}
          clientPillars={(client.onboarding_data as OnboardingData | null)?.pillars?.filter(Boolean)}
          onAcceptIdea={handleAcceptIdea}
          onClose={() => setShowIdeaSwiper(false)}
        />
      )}
    </div>
  );
}
