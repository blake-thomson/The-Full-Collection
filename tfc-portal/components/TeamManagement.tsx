"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { Avatar } from "@/components/ui/Avatar";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Invite {
  id: string;
  code: string;
  email: string;
  name: string;
  role: string;
  used: boolean;
}

interface Client {
  id: string;
  name: string;
  email: string;
  onboarding_complete: boolean;
  created_at: string;
}

interface Props {
  teamUser: { name: string; email: string; role: string };
}

export function TeamManagement({ teamUser }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tab, setTab] = useState("team");
  const [showInvite, setShowInvite] = useState(false);
  const [invName, setInvName] = useState("");
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("editor");
  const [invErr, setInvErr] = useState("");
  const [lastInvite, setLastInvite] = useState<{ name: string; email: string; code: string; role: string } | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPass, setCPass] = useState("");
  const [cErr, setCErr] = useState("");
  const [lastClient, setLastClient] = useState<{ name: string; email: string; pass: string } | null>(null);
  const supabase = createBrowserSupabase();
  const canManage = ["owner", "admin"].includes(teamUser.role);

  const load = async () => {
    const [membersRes, invitesRes, clientsRes] = await Promise.all([
      supabase.from("team_members").select("*").order("created_at"),
      supabase.from("team_invites").select("*").order("created_at"),
      fetch("/api/clients").then((r) => r.json()),
    ]);
    setMembers(membersRes.data || []);
    setInvites(invitesRes.data || []);
    setClients(clientsRes || []);
  };

  useEffect(() => { load(); }, []);

  const sendInvite = async () => {
    setInvErr("");
    const name = invName.trim();
    const email = invEmail.trim().toLowerCase();
    if (!name || !email) { setInvErr("Name and email are required."); return; }

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role: invRole, inviterName: teamUser.name }),
    });
    const data = await res.json();
    if (!res.ok) { setInvErr(data.error || "Failed to create invite."); return; }

    setInvName(""); setInvEmail(""); setInvRole("editor");
    setShowInvite(false);
    setLastInvite({ name, email, code: data.code, role: invRole });
    load();
  };

  const createClient = async () => {
    setCErr("");
    const name = cName.trim();
    const email = cEmail.trim().toLowerCase();
    const pass = cPass.trim();
    if (!name || !email || !pass) { setCErr("All fields are required."); return; }

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: pass, createdBy: teamUser.name }),
    });
    const data = await res.json();
    if (!res.ok) { setCErr(data.error || "Failed to create client."); return; }

    setCName(""); setCEmail(""); setCPass("");
    setShowNewClient(false);
    setLastClient({ name, email, pass });
    load();
  };

  const ROLE_COLOR: Record<string, string> = { owner: "#F59E0B", admin: "#FF3B3B", editor: "#10B981" };
  const pendingInvites = invites.filter((i) => !i.used);

  return (
    <div className="max-w-[760px]">
      <div className="flex gap-[3px] mb-7">
        {[{ id: "team", label: "Team Members" }, { id: "clients", label: "Client Accounts" }].map((t) => (
          <button key={t.id} className={`nav-tab${tab === t.id ? " active" : ""}`} onClick={() => { setTab(t.id); setLastInvite(null); setLastClient(null); }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TEAM MEMBERS TAB */}
      {tab === "team" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-text font-heading text-[22px] font-[800] m-0 mb-1">Team Members</h2>
              <p className="text-text-2 text-[13px] m-0">{members.length} member{members.length !== 1 ? "s" : ""} · {pendingInvites.length} invite{pendingInvites.length !== 1 ? "s" : ""} pending</p>
            </div>
            {canManage && !showInvite && (
              <button className="tfc-btn py-[9px] px-5 text-xs" onClick={() => { setShowInvite(true); setInvErr(""); setLastInvite(null); }}>
                + Invite Team Member
              </button>
            )}
          </div>

          {/* Success */}
          {lastInvite && (
            <div className="bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)] rounded-[10px] p-4 mb-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[#10B981] text-sm font-bold m-0 mb-1.5">Invite sent to {lastInvite.name}</p>
                  <p className="text-text-2 text-[13px] m-0 mb-1">{lastInvite.email} · <span className="capitalize">{lastInvite.role}</span></p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-text-3 text-xs">Invite code:</span>
                    <span className="text-text text-[13px] font-bold font-mono tracking-[0.12em] bg-surface-3 py-[3px] px-2.5 rounded-md border border-border-2">{lastInvite.code}</span>
                    <span className="text-text-3 text-xs">— share this if the email doesn&apos;t arrive</span>
                  </div>
                </div>
                <button onClick={() => setLastInvite(null)} className="text-text-3 bg-transparent border-none cursor-pointer text-lg leading-none pl-3">×</button>
              </div>
            </div>
          )}

          {/* Invite form */}
          {showInvite && (
            <div className="bg-surface-2 border border-border-2 rounded-xl p-[22px] mb-6">
              <h3 className="text-text font-heading text-[15px] font-bold m-0 mb-[18px]">Send Team Invite</h3>
              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div><label className="tfc-label">Name</label><input className="tfc-input" value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="Their full name" /></div>
                <div><label className="tfc-label">Email</label><input className="tfc-input" type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} placeholder="their@email.com" /></div>
              </div>
              <div className="mb-[18px]">
                <label className="tfc-label">Role</label>
                <div className="flex gap-2">
                  {(teamUser.role === "owner" ? ["admin", "editor"] : ["editor"]).map((r) => (
                    <button key={r} className={`tfc-pill capitalize${invRole === r ? " active" : ""}`} onClick={() => setInvRole(r)}>{r}</button>
                  ))}
                </div>
              </div>
              {invErr && <div className="text-[#FCA5A5] text-[13px] mb-3 bg-[rgba(239,68,68,0.08)] py-2 px-3 rounded-[7px]">{invErr}</div>}
              <div className="flex gap-2.5">
                <button className="tfc-btn py-[9px] px-[22px] text-xs" onClick={sendInvite}>Send Invite →</button>
                <button className="tfc-btn-ghost py-[9px] px-[18px] text-xs" onClick={() => { setShowInvite(false); setInvErr(""); }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Active Members */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden mb-5">
            <div className="py-2.5 px-5 border-b border-border bg-surface-2">
              <span className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase">Active Members</span>
            </div>
            {members.length === 0 && <div className="p-7 text-center text-text-3 text-[13px]">No team members yet.</div>}
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3.5 px-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} size={34} />
                  <div>
                    <div className="text-text text-sm font-semibold">
                      {m.name} {m.email === teamUser.email && <span className="text-text-3 text-[11px] font-normal">(you)</span>}
                    </div>
                    <div className="text-text-2 text-xs mt-px">{m.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className="text-[11px] font-bold tracking-[0.08em] uppercase py-[3px] px-[9px] rounded-md"
                    style={{ color: ROLE_COLOR[m.role] || "#A8A49C", background: `${ROLE_COLOR[m.role] || "#A8A49C"}18`, border: `1px solid ${ROLE_COLOR[m.role] || "#A8A49C"}30` }}
                  >
                    {m.role}
                  </span>
                  <span className="text-text-3 text-xs">{m.created_at ? new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Invites */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="py-2.5 px-5 border-b border-border bg-surface-2">
              <span className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase">
                Awaiting Acceptance{pendingInvites.length > 0 ? ` (${pendingInvites.length})` : ""}
              </span>
            </div>
            {pendingInvites.length === 0 && <div className="p-5 text-text-3 text-[13px]">No pending invites.</div>}
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3.5 px-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-[34px] h-[34px] rounded-full bg-surface-3 border border-dashed border-border-2 flex items-center justify-center text-text-3 font-bold text-[13px]">
                    {inv.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-text text-sm font-medium">{inv.name}</div>
                    <div className="text-text-2 text-xs mt-px">{inv.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-text-3 text-[11px] font-mono tracking-[0.12em] bg-surface-3 py-[3px] px-2.5 rounded-md border border-border-2">{inv.code}</span>
                  <span className="capitalize text-[11px]" style={{ color: ROLE_COLOR[inv.role] || "#A8A49C" }}>{inv.role}</span>
                  <span className="text-[11px] font-bold text-[#F59E0B] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] py-[3px] px-2.5 rounded-md uppercase tracking-[0.06em]">Pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CLIENT ACCOUNTS TAB */}
      {tab === "clients" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-text font-heading text-[22px] font-[800] m-0 mb-1">Client Accounts</h2>
              <p className="text-text-2 text-[13px] m-0">Accounts are created by TFC — clients cannot self-register</p>
            </div>
            {!showNewClient && (
              <button className="tfc-btn py-[9px] px-5 text-xs" onClick={() => { setShowNewClient(true); setCErr(""); setLastClient(null); }}>
                + Create Client
              </button>
            )}
          </div>

          {/* Success */}
          {lastClient && (
            <div className="bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)] rounded-[10px] p-4 mb-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[#10B981] text-sm font-bold m-0 mb-1.5">Client account created for {lastClient.name}</p>
                  <p className="text-text-2 text-[13px] m-0 mb-1">{lastClient.email}</p>
                  <p className="text-text-3 text-xs m-0 mt-1">Welcome email sending in background. Temporary password: <span className="text-text font-semibold font-mono">{lastClient.pass}</span></p>
                </div>
                <button onClick={() => setLastClient(null)} className="text-text-3 bg-transparent border-none cursor-pointer text-lg leading-none pl-3">×</button>
              </div>
            </div>
          )}

          {/* Create client form */}
          {showNewClient && (
            <div className="bg-surface-2 border border-border-2 rounded-xl p-[22px] mb-6">
              <h3 className="text-text font-heading text-[15px] font-bold m-0 mb-1.5">New Client Account</h3>
              <p className="text-text-2 text-[13px] m-0 mb-[18px] leading-relaxed">Fill in the client&apos;s details. They&apos;ll receive a welcome email with their login credentials.</p>
              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div><label className="tfc-label">Client Name</label><input className="tfc-input" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Their full name" /></div>
                <div><label className="tfc-label">Email Address</label><input className="tfc-input" type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="their@email.com" /></div>
              </div>
              <div className="mb-[18px]">
                <label className="tfc-label">Temporary Password</label>
                <input className="tfc-input" value={cPass} onChange={(e) => setCPass(e.target.value)} placeholder="Create a temporary password for them" />
              </div>
              {cErr && <div className="text-[#FCA5A5] text-[13px] mb-3 bg-[rgba(239,68,68,0.08)] py-2 px-3 rounded-[7px]">{cErr}</div>}
              <div className="flex gap-2.5">
                <button className="tfc-btn py-[9px] px-[22px] text-xs" onClick={createClient}>Create & Send Welcome Email →</button>
                <button className="tfc-btn-ghost py-[9px] px-[18px] text-xs" onClick={() => { setShowNewClient(false); setCErr(""); }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Client list */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {clients.length === 0 && <div className="p-9 text-center text-text-3 text-[13px]">No client accounts yet.</div>}
            {clients.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3.5 px-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} size={32} />
                  <div>
                    <div className="text-text text-sm font-medium">{c.name}</div>
                    <div className="text-text-2 text-xs">{c.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className="text-[11px] font-bold tracking-[0.06em] py-[3px] px-2.5 rounded-md uppercase"
                    style={{
                      background: c.onboarding_complete ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                      color: c.onboarding_complete ? "#10B981" : "#F59E0B",
                      border: `1px solid ${c.onboarding_complete ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                    }}
                  >
                    {c.onboarding_complete ? "Onboarded" : "Pending"}
                  </span>
                  <span className="text-text-3 text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
