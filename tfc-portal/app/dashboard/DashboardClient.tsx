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
import { ContentDatabase } from "@/components/ContentDatabase";
import { ContentBrief } from "@/components/ContentBrief";
import { ClientHome } from "@/components/ClientHome";
import { GlobalSearch } from "@/components/GlobalSearch";
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
}

const TABS = [
  { id: "home", label: "Home" },
  { id: "content", label: "Content" },
  { id: "kanban", label: "Board" },
  { id: "calendar", label: "Calendar" },
  { id: "messages", label: "Messages" },
  { id: "resources", label: "Resources" },
  { id: "billing", label: "Billing" },
  { id: "intake", label: "My Intake" },
  { id: "profile", label: "Profile" },
];

export default function DashboardClient() {
  const [tab, setTab] = useState("home");
  const [client, setClient] = useState<ClientData | null>(null);
  const [kanbanCards, setKanbanCards] = useState<KanbanCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabase();

  // Cmd+K global search shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!data) { router.push("/login"); return; }
      if (!data.onboarding_complete) { router.push("/onboarding"); return; }
      setClient(data);
    })();
  }, [supabase, router]);

  const loadKanbanCards = useCallback(async () => {
    if (!client) return;
    try {
      const res = await fetch(`/api/kanban?client_id=${client.id}`);
      if (res.ok) {
        setKanbanCards(await res.json());
      }
    } catch (err) {
      console.error("Failed to load kanban cards.");
    }
  }, [client]);

  useEffect(() => {
    if (client) loadKanbanCards();
  }, [client, loadKanbanCards]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleCardUpdate = (updatedCard: KanbanCard) => {
    setKanbanCards((prev) => prev.map((c) => c.id === updatedCard.id ? updatedCard : c));
    setSelectedCard(null);
  };

  const handleCardDelete = (cardId: string) => {
    setKanbanCards((prev) => prev.filter((c) => c.id !== cardId));
    setSelectedCard(null);
  };

  const handleChangePassword = async () => {
    setPasswordMsg("");
    setPasswordErr("");
    if (!newPassword || newPassword.length < 6) {
      setPasswordErr("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr("Passwords do not match.");
      return;
    }
    setPasswordBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordErr(error.message);
    } else {
      setPasswordMsg("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
      setChangingPassword(false);
    }
    setPasswordBusy(false);
  };

  if (!client) return null;

  const currentUser = { name: client.name, email: client.email, type: "client" as const };
  const overflowTabs = ["home", "kanban", "content", "messages", "calendar", "resources", "billing"];

  return (
    <div className="bg-bg h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 h-[58px] flex items-center justify-between shrink-0">
        <Logo size={13} />
        <div className="flex gap-[3px] overflow-x-auto hide-scrollbar">
          {TABS.map((t) => (
            <button key={t.id} className={`nav-tab whitespace-nowrap${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3.5">
          {/* Search Button */}
          <button
            onClick={() => setShowSearch(true)}
            className="text-text-3 hover:text-text bg-transparent border border-border rounded-lg py-1.5 px-2.5 cursor-pointer font-body text-[11px] transition-colors flex items-center gap-1.5"
            title="Search (Cmd+K)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline text-[9px] bg-surface-3 py-0.5 px-1 rounded ml-1">&#8984;K</kbd>
          </button>
          <NotificationBell userEmail={client.email} userType="client" />
          <div className="hidden sm:flex items-center gap-2.5">
            <Avatar name={client.name} />
            <span className="text-text text-[13px] font-medium">{client.name}</span>
          </div>
          <button onClick={logout} className="text-text-3 bg-transparent border-none cursor-pointer text-xs font-body">
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 ${overflowTabs.includes(tab) ? "overflow-hidden" : "overflow-auto"}`}>
        {/* Home */}
        {tab === "home" && (
          <ClientHome
            clientName={client.name}
            cards={kanbanCards}
            onSubmitIdea={() => setShowBrief(true)}
            onViewCalendar={() => setTab("calendar")}
            onMessageTeam={() => setTab("messages")}
            onCardClick={(card) => setSelectedCard(card as KanbanCard)}
          />
        )}

        {/* Content Database (Notion-style multi-view) */}
        {tab === "content" && (
          <div className="h-full flex flex-col">
            <div className="px-4 sm:px-6 py-3.5 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="text-text font-heading text-[17px] font-bold m-0">Content Database</h2>
              <button
                className="tfc-btn"
                style={{ padding: "7px 16px", fontSize: 12 }}
                onClick={() => setShowBrief(true)}
              >
                + New Content
              </button>
            </div>
            <ContentDatabase
              clientId={client.id}
              cards={kanbanCards}
              onCardClick={(card) => setSelectedCard(card as KanbanCard)}
              onCardsChange={loadKanbanCards}
              editable
              clientName={client.name}
            />
          </div>
        )}

        {/* Content Tracker (Kanban) */}
        {tab === "kanban" && (
          <div className="h-full flex flex-col">
            <div className="px-4 sm:px-6 py-3.5 border-b border-border flex items-center gap-6 shrink-0">
              <h2 className="text-text font-heading text-[17px] font-bold m-0">Content Tracker</h2>
            </div>
            <Kanban
              clientId={client.id}
            />
          </div>
        )}

        {/* Calendar */}
        {tab === "calendar" && (
          <div className="h-full">
            <ContentCalendar
              cards={kanbanCards}
              onCardClick={(card) => setSelectedCard(card as KanbanCard)}
            />
          </div>
        )}

        {/* Messages */}
        {tab === "messages" && (
          <div className="h-full">
            <MessageThread clientId={client.id} currentUser={currentUser} />
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
          <div className="p-6 sm:p-8 max-w-[460px] mx-auto">
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

              {/* Password Change Section */}
              <div className="mt-6">
                {!changingPassword ? (
                  <button
                    className="tfc-btn-ghost w-full text-center"
                    onClick={() => setChangingPassword(true)}
                  >
                    Change Password
                  </button>
                ) : (
                  <div className="bg-surface-2 border border-border rounded-xl p-4">
                    <h4 className="text-text font-heading text-[14px] font-bold m-0 mb-3">Change Password</h4>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="tfc-label">New Password</label>
                        <input
                          className="tfc-input"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                        />
                      </div>
                      <div>
                        <label className="tfc-label">Confirm Password</label>
                        <input
                          className="tfc-input"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                        />
                      </div>
                      {passwordErr && <p className="text-[#EF4444] text-[12px] m-0">{passwordErr}</p>}
                      {passwordMsg && <p className="text-[#10B981] text-[12px] m-0">{passwordMsg}</p>}
                      <div className="flex gap-2">
                        <button className="tfc-btn flex-1" style={{ fontSize: 12, padding: "8px 16px" }} onClick={handleChangePassword} disabled={passwordBusy}>
                          {passwordBusy ? "Updating..." : "Update Password"}
                        </button>
                        <button
                          className="tfc-btn-ghost flex-1"
                          style={{ fontSize: 12, padding: "8px 16px" }}
                          onClick={() => {
                            setChangingPassword(false);
                            setNewPassword("");
                            setConfirmPassword("");
                            setPasswordErr("");
                            setPasswordMsg("");
                          }}
                        >
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
        <ContentBrief
          clientId={client.id}
          onClose={() => setShowBrief(false)}
          onCreated={loadKanbanCards}
        />
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
