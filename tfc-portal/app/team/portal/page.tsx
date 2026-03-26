"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Kanban } from "@/components/Kanban";
import { IntakeView } from "@/components/IntakeView";
import { TeamManagement } from "@/components/TeamManagement";
import { COLUMNS } from "@/lib/constants";
import type { OnboardingData } from "@/lib/constants";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  onboarding_complete: boolean;
  onboarding_data: OnboardingData | null;
  created_at: string;
  kanbanCards?: { column_id: string }[];
}

export default function TeamPortalPage() {
  const [teamUser, setTeamUser] = useState<TeamMember | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [teamTab, setTeamTab] = useState("clients");
  const [clientTab, setClientTab] = useState("intake");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
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
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (teamUser) loadClients();
  }, [teamUser, loadClients]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/team/login");
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

  return (
    <div className="bg-bg h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-6 h-[58px] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Logo size={13} sub="Team Portal" />
          <span className="team-badge">Team</span>
        </div>
        <div className="flex gap-[3px]">
          {[
            { id: "clients", label: "All Clients" },
            { id: "overview", label: "Overview" },
            ...(["owner", "admin"].includes(teamUser.role) ? [{ id: "team", label: "Team" }] : []),
          ].map((t) => (
            <button
              key={t.id}
              className={`nav-tab${teamTab === t.id ? " active" : ""}`}
              onClick={() => { setTeamTab(t.id); setSelected(null); }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
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
          <div className="flex-1 overflow-y-auto p-[36px_32px]">
            <h2 className="text-text font-heading text-[22px] font-[800] m-0 mb-1.5">Overview</h2>
            <p className="text-text-2 text-[13px] m-0 mb-8">A snapshot of all client activity across The Full Collection.</p>

            <div className="grid grid-cols-4 gap-3.5 mb-9">
              {[
                { l: "Total Clients", v: totalClients, accent: false },
                { l: "Onboarded", v: onboarded, accent: false },
                { l: "Content Pieces", v: totalContent, accent: false },
                { l: "Published", v: totalPublished, accent: true },
              ].map((s) => (
                <div key={s.l} className="bg-surface border border-border rounded-xl p-[18px_20px]">
                  <div className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mb-2">{s.l}</div>
                  <div className={`font-heading text-[32px] font-[800] leading-none ${s.accent ? "text-red" : "text-text"}`}>{s.v}</div>
                </div>
              ))}
            </div>

            <h3 className="text-text font-heading text-base font-bold m-0 mb-4">Content by Client</h3>
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="grid gap-2 px-5 py-2.5 border-b border-border" style={{ gridTemplateColumns: `1fr ${COLUMNS.map(() => "60px").join(" ")}` }}>
                <span className="text-text-3 text-[11px] font-bold tracking-[0.08em] uppercase">Client</span>
                {COLUMNS.map((c) => (
                  <span key={c.id} className="text-text-3 text-[10px] font-bold tracking-[0.06em] uppercase text-center">{c.label.split(" ")[0]}</span>
                ))}
              </div>
              {clients.length === 0 && <div className="p-7 text-text-3 text-[13px]">No clients yet.</div>}
              {clients.map((c) => (
                <div key={c.id} className="grid gap-2 px-5 py-3 border-b border-border items-center" style={{ gridTemplateColumns: `1fr ${COLUMNS.map(() => "60px").join(" ")}` }}>
                  <div>
                    <span className="text-text text-[13px] font-medium">{c.name}</span>
                    <span className="text-text-3 text-[11px] ml-2">{c.email}</span>
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
        )}

        {/* CLIENTS TAB - LIST */}
        {teamTab === "clients" && !selected && (
          <div className="flex-1 overflow-y-auto p-[28px_32px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-text font-heading text-[22px] font-[800] m-0 mb-1">All Clients</h2>
                <p className="text-text-2 text-[13px] m-0">{totalClients} client{totalClients !== 1 ? "s" : ""} · {onboarded} onboarded</p>
              </div>
              <button className="tfc-btn-ghost text-xs py-2 px-4" onClick={loadClients}>↻ Refresh</button>
            </div>
            <div className="flex gap-2.5 mb-5">
              <input className="tfc-input max-w-[280px]" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." />
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
                <div className="client-row cursor-default border-b border-border-2">
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
                    <span className="text-text-2 text-[13px]">{c.email}</span>
                    <span className="text-text-2 text-[13px]">{c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
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
            <div className="border-b border-border px-6 h-14 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <button onClick={() => setSelected(null)} className="text-text-2 bg-transparent border-none cursor-pointer text-[13px] font-body flex items-center gap-1">
                  ← All Clients
                </button>
                <div className="w-px h-[18px] bg-border-2" />
                <div className="flex items-center gap-2.5">
                  <Avatar name={selected.name} size={28} />
                  <span className="text-text text-sm font-semibold">{selected.name}</span>
                  <span className="text-text-3 text-[13px]">{selected.email}</span>
                </div>
              </div>
              <div className="flex gap-[3px]">
                {[
                  { id: "intake", label: "Intake Form" },
                  { id: "kanban", label: "Content Board" },
                  { id: "info", label: "Account Info" },
                ].map((t) => (
                  <button key={t.id} className={`nav-tab${clientTab === t.id ? " active" : ""}`} onClick={() => setClientTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={`flex-1 ${clientTab === "kanban" ? "overflow-hidden" : "overflow-auto"}`}>
              {clientTab === "intake" && (
                <IntakeView data={selected.onboarding_data} title={`${selected.name}'s Intake Form`} subtitle="Submitted onboarding responses" />
              )}
              {clientTab === "kanban" && (
                <Kanban clientId={selected.id} clientName={selected.name} />
              )}
              {clientTab === "info" && (
                <div className="p-8 max-w-[560px] mx-auto">
                  <h2 className="text-text font-heading text-xl font-[800] m-0 mb-6">Account Info</h2>
                  <div className="bg-surface border border-border rounded-[14px] p-7">
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
        <div className="flex-1 overflow-y-auto p-[28px_32px]">
          <TeamManagement teamUser={teamUser} />
        </div>
      )}
    </div>
  );
}
