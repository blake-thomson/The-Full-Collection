"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Kanban } from "@/components/Kanban";
import { IntakeView } from "@/components/IntakeView";
import { CardDetailModal } from "@/components/CardDetailModal";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageThread } from "@/components/MessageThread";
import { ContentCalendar } from "@/components/ContentCalendar";
import { ResourceLibrary } from "@/components/ResourceLibrary";
import { InvoiceSection } from "@/components/InvoiceSection";
import { ContentBrief } from "@/components/ContentBrief";
import { ClientHome } from "@/components/ClientHome";
import { GlobalSearch } from "@/components/GlobalSearch";
import { DriveFiles } from "@/components/DriveFiles";
import type { OnboardingData } from "@/lib/constants";

interface ClientData {
  id: string;
  name: string;
  email: string;
  onboarding_complete: boolean;
  onboarding_data: OnboardingData | null;
  created_at: string;
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
  content_style?: string;
  content_type?: string;
  reference_url?: string;
  unedited_url?: string;
  edited_video_url?: string;
  assigned_editor?: string;
  shoot_date?: string;
  edit_deadline?: string;
  publish_date?: string;
  shoot_location?: string;
}

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
    id: "billing", label: "Billing",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    id: "intake", label: "My Intake",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "profile", label: "Profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function DashboardClient() {
  const [tab, setTab] = useState("home");
  const [client, setClient] = useState<ClientData | null>(null);
  const [kanbanCards, setKanbanCards] = useState<KanbanCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [kanbanKey, setKanbanKey] = useState(0);
  const [openCreateCard, setOpenCreateCard] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordErr, setPasswordErr] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

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
        setClient(clients[0]);
        if (!clients[0].onboarding_complete) router.push("/onboarding");
      }
    })();
  }, []);

  useEffect(() => { loadKanbanCards(); }, [loadKanbanCards]);

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

  const handleChangePassword = async () => {
    setPasswordMsg("");
    setPasswordErr("");
    if (!newPassword || newPassword.length < 6) { setPasswordErr("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordErr("Passwords do not match."); return; }
    setPasswordBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordErr(error.message); } else {
      setPasswordMsg("Password updated successfully.");
      setNewPassword(""); setConfirmPassword(""); setChangingPassword(false);
    }
    setPasswordBusy(false);
  };

  const switchTab = (id: string) => {
    setTab(id);
    setMobileMenuOpen(false);
  };

  if (!client) return null;

  const currentUser = { name: client.name, email: client.email, type: "client" as const };
  const overflowTabs = ["home", "kanban", "messages", "calendar", "files", "resources", "billing"];

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
            <div className="flex justify-center py-2">
              <Avatar name={client.name} size={32} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 px-3 py-2">
                <Avatar name={client.name} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-text text-[12px] font-semibold truncate">{client.name}</div>
                  <div className="text-text-3 text-[10px] truncate">{client.email}</div>
                </div>
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

      {/* ============ MOBILE HEADER + MENU ============ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface border-b border-border h-[52px] flex items-center justify-between px-4">
        <Logo size={11} />
        <div className="flex items-center gap-2">
          <NotificationBell userEmail={client.email} userType="client" />
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
            {/* User Info */}
            <div className="px-4 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar name={client.name} size={36} />
                <div className="min-w-0">
                  <div className="text-text text-[13px] font-semibold truncate">{client.name}</div>
                  <div className="text-text-3 text-[11px] truncate">{client.email}</div>
                </div>
              </div>
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

            {/* Sign Out */}
            <div className="px-3 py-3 border-t border-border">
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
            {TABS.find((t) => t.id === tab)?.label || "Dashboard"}
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
              onSubmitIdea={() => { setTab("kanban"); setOpenCreateCard(true); setKanbanKey((k) => k + 1); }}
              onViewCalendar={() => setTab("calendar")}
              onMessageTeam={() => setTab("messages")}
              onCardClick={(card) => setSelectedCard(card as KanbanCard)}
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
            <div className="h-full">
              <MessageThread clientId={client.id} currentUser={currentUser} />
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

          {/* Billing */}
          {tab === "billing" && (
            <div className="h-full">
              <InvoiceSection clientId={client.id} currentUser={currentUser} isTeam={false} />
            </div>
          )}

          {/* My Intake */}
          {tab === "intake" && <IntakeView data={client.onboarding_data} title="My Intake Form" subtitle="Your completed onboarding responses" />}

          {/* Profile */}
          {tab === "profile" && (
            <div className="p-4 sm:p-8 max-w-[460px] mx-auto">
              <h2 className="text-text font-heading text-[22px] font-[800] mb-7">Profile</h2>
              <div className="bg-surface border border-border rounded-2xl p-5 sm:p-7">
                <div className="flex items-center gap-4 pb-[22px] border-b border-border mb-[22px]">
                  <Avatar name={client.name} size={52} />
                  <div>
                    <div className="text-text text-[17px] font-bold">{client.name}</div>
                    <div className="text-text-2 text-[13px] mt-0.5">{client.email}</div>
                  </div>
                </div>
                {[
                  { l: "Member Since", v: new Date(client.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                  { l: "Onboarding", v: client.onboarding_complete ? "Complete" : "Pending", color: client.onboarding_complete ? "#10B981" : "#F59E0B" },
                ].map((row) => (
                  <div key={row.l} className="flex justify-between py-2.5 border-b border-border">
                    <span className="text-text-3 text-[13px]">{row.l}</span>
                    <span className="text-[13px] font-semibold" style={{ color: row.color || "#F0EDE6" }}>{row.v}</span>
                  </div>
                ))}

                <div className="mt-6">
                  {!changingPassword ? (
                    <button className="tfc-btn-ghost w-full text-center" onClick={() => setChangingPassword(true)}>
                      Change Password
                    </button>
                  ) : (
                    <div className="bg-surface-2 border border-border rounded-xl p-4">
                      <h4 className="text-text font-heading text-[14px] font-bold m-0 mb-3">Change Password</h4>
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="tfc-label">New Password</label>
                          <input className="tfc-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                        </div>
                        <div>
                          <label className="tfc-label">Confirm Password</label>
                          <input className="tfc-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} />
                        </div>
                        {passwordErr && <p className="text-[#EF4444] text-[12px] m-0">{passwordErr}</p>}
                        {passwordMsg && <p className="text-[#10B981] text-[12px] m-0">{passwordMsg}</p>}
                        <div className="flex gap-2">
                          <button className="tfc-btn flex-1" style={{ fontSize: 12, padding: "8px 16px" }} onClick={handleChangePassword} disabled={passwordBusy}>
                            {passwordBusy ? "Updating..." : "Update Password"}
                          </button>
                          <button className="tfc-btn-ghost flex-1" style={{ fontSize: 12, padding: "8px 16px" }} onClick={() => { setChangingPassword(false); setNewPassword(""); setConfirmPassword(""); setPasswordErr(""); setPasswordMsg(""); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button className="tfc-btn-ghost w-full text-center mt-4" onClick={logout}>Sign Out</button>
              </div>
            </div>
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
    </div>
  );
}
