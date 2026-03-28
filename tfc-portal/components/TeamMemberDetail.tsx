"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/theme";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

interface KanbanCard {
  id: string;
  title: string;
  column_id: string;
  platform?: string;
  priority?: string;
  due_date?: string;
  client_id: string;
  client_name: string;
  updated_at: string;
}

interface Props {
  memberId: string;
  currentUserEmail: string;
  currentUserRole: string;
  onBack: () => void;
  onClientSelect?: (clientId: string) => void;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "#F59E0B",
  admin: "#FF3B3B",
  editor: "#10B981",
  smm: "#8B5CF6",
  social_media_manager: "#8B5CF6",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  smm: "Social Media Manager",
  social_media_manager: "Social Media Manager",
};

const COLUMN_LABELS: Record<string, string> = {
  idea: "Idea",
  filmed: "Filmed",
  editing: "Editing",
  edited_qcc: "Edited QCC",
  ready_review: "Ready for Review",
  approved: "Approved",
  revise: "Revise",
  scheduled: "Scheduled",
  published: "Published",
};

const COLUMN_COLORS: Record<string, string> = {
  idea: "#5A5652",
  filmed: "#3B82F6",
  editing: "#F59E0B",
  edited_qcc: "#A78BFA",
  ready_review: "#EC4899",
  approved: "#10B981",
  revise: "#EF4444",
  scheduled: "#06B6D4",
  published: "#E02020",
};

const ROLE_SOPS: Record<string, { summary: string; responsibilities: string[]; pipeline: { stage: string; action: string }[] }> = {
  owner: {
    summary: "The Owner has full oversight of The Full Collection's operations, client relationships, and team performance.",
    responsibilities: [
      "Review and approve content at the Edited QCC stage",
      "Manage client onboarding and account relationships",
      "Oversee billing, contracts, and business development",
      "Set strategic direction for content and brand standards",
      "Final approval authority on major client decisions",
      "Manage team growth, hiring, and performance",
    ],
    pipeline: [
      { stage: "Edited QCC", action: "Notified — review content quality before client sees it" },
      { stage: "Ready for Review", action: "Content is live for client approval" },
      { stage: "Approved / Published", action: "Confirm client satisfaction" },
    ],
  },
  admin: {
    summary: "The Admin manages day-to-day operations and ensures content moves smoothly through the full pipeline.",
    responsibilities: [
      "Monitor content pipeline across all client boards",
      "Coordinate between editors and social media managers",
      "Handle client escalations and communications",
      "Review content at the Edited QCC stage",
      "Maintain project timelines and deliverables",
      "Onboard new clients and manage intake forms",
    ],
    pipeline: [
      { stage: "Edited QCC", action: "Notified — review content before client" },
      { stage: "Ready for Review", action: "Monitor client feedback and approvals" },
      { stage: "Revise", action: "Coordinate revision requests with editors" },
    ],
  },
  editor: {
    summary: "The Editor is responsible for all video editing, content production quality, and timely delivery.",
    responsibilities: [
      "Pick up footage when cards move to Filmed column",
      "Edit video content to brand standards and client brief",
      "Submit completed edits for QCC review",
      "Address revision requests promptly",
      "Maintain organized file management in Google Drive",
      "Meet all edit deadlines and communicate blockers early",
    ],
    pipeline: [
      { stage: "Filmed", action: "Notified — pick up footage and begin editing" },
      { stage: "Editing", action: "Active editing phase" },
      { stage: "Edited QCC", action: "Submit for quality control review" },
      { stage: "Revise", action: "Notified — address client revision notes" },
    ],
  },
  smm: {
    summary: "The Social Media Manager handles all content publishing, scheduling, and platform performance.",
    responsibilities: [
      "Pick up approved content and prepare for publishing",
      "Write platform-specific captions and hashtag sets",
      "Schedule posts according to client content calendars",
      "Publish content and confirm all platforms are live",
      "Report performance metrics back to the team and clients",
      "Stay current on platform algorithm changes and best practices",
    ],
    pipeline: [
      { stage: "Approved for Publish", action: "Notified — prepare captions and schedule" },
      { stage: "Scheduled", action: "Content queued in scheduling tool" },
      { stage: "Published", action: "Confirm live and log performance" },
    ],
  },
  social_media_manager: {
    summary: "The Social Media Manager handles all content publishing, scheduling, and platform performance.",
    responsibilities: [
      "Pick up approved content and prepare for publishing",
      "Write platform-specific captions and hashtag sets",
      "Schedule posts according to client content calendars",
      "Publish content and confirm all platforms are live",
      "Report performance metrics back to the team and clients",
      "Stay current on platform algorithm changes and best practices",
    ],
    pipeline: [
      { stage: "Approved for Publish", action: "Notified — prepare captions and schedule" },
      { stage: "Scheduled", action: "Content queued in scheduling tool" },
      { stage: "Published", action: "Confirm live and log performance" },
    ],
  },
};

export function TeamMemberDetail({ memberId, currentUserEmail, currentUserRole, onBack, onClientSelect }: Props) {
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<"profile" | "work" | "clients">("profile");
  const [member, setMember] = useState<TeamMember | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const [sopOpen, setSopOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/team-members/${memberId}`);
    if (res.ok) {
      const json = await res.json();
      setMember(json.member);
      setClients(json.clients || []);
      setCards(json.cards || []);
      setEditBio(json.member.bio || "");
      setEditAvatar(json.member.avatar_url || "");
      setEditName(json.member.name || "");
    }
    setLoading(false);
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  const isOwnProfile = member?.email === currentUserEmail;
  const canEdit = isOwnProfile || ["owner", "admin"].includes(currentUserRole);

  const saveProfile = async () => {
    setSaving(true);
    setSaveErr("");
    const res = await fetch("/api/team-members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio: editBio, avatar_url: editAvatar, name: editName }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMember(updated);
      setEditing(false);
    } else {
      const d = await res.json();
      setSaveErr(d.error || "Failed to save");
    }
    setSaving(false);
  };

  // Group cards by client
  const cardsByClient: Record<string, KanbanCard[]> = {};
  for (const card of cards) {
    if (!cardsByClient[card.client_name]) cardsByClient[card.client_name] = [];
    cardsByClient[card.client_name].push(card);
  }

  const roleColor = member ? (ROLE_COLORS[member.role] ?? "#A8A49C") : "#A8A49C";
  const roleLabel = member ? (ROLE_LABELS[member.role] ?? member.role) : "";
  const sop = member ? ROLE_SOPS[member.role] : null;

  if (loading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: "#5A5652", fontSize: 14 }}>
        Loading profile…
      </div>
    );
  }

  if (!member) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: "#EF4444", fontSize: 14 }}>
        Member not found.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", color: "#5A5652", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to Team
      </button>

      {/* Header card */}
      <div style={{ background: "#111111", border: "1px solid #1e1e1e", borderRadius: 16, padding: "28px 28px 24px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 20 }}>
        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.name}
              style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `2px solid ${roleColor}33` }}
            />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: `linear-gradient(135deg, ${roleColor}33, ${roleColor}11)`,
              border: `2px solid ${roleColor}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 800, color: roleColor,
            }}>
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
            <h2 style={{ color: "#F0EDE6", fontSize: 20, fontWeight: 800, margin: 0 }}>
              {member.name}
              {isOwnProfile && <span style={{ color: "#5A5652", fontSize: 12, fontWeight: 400, marginLeft: 8 }}>(you)</span>}
            </h2>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "3px 10px", borderRadius: 20,
              color: roleColor, background: `${roleColor}18`, border: `1px solid ${roleColor}30`,
            }}>
              {roleLabel}
            </span>
          </div>
          <div style={{ color: "#5A5652", fontSize: 13, marginBottom: 8 }}>{member.email}</div>
          {member.bio && !editing && (
            <p style={{ color: "#A8A49C", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{member.bio}</p>
          )}
          <div style={{ color: "#3A3632", fontSize: 11, marginTop: 8 }}>
            Joined {new Date(member.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {/* Edit button */}
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            style={{ background: "none", border: "1px solid #252525", borderRadius: 8, padding: "7px 14px", color: "#5A5652", fontSize: 12, cursor: "pointer", flexShrink: 0 }}
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Inline edit form */}
      {editing && (
        <div style={{ background: "#111111", border: "1px solid #252525", borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: "#F0EDE6", fontSize: 14, fontWeight: 700, margin: "0 0 18px" }}>Edit Profile</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ color: "#5A5652", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Display Name</label>
              <input
                className="tfc-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label style={{ color: "#5A5652", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Avatar URL</label>
              <input
                className="tfc-input"
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                placeholder="https://… (paste an image link)"
              />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: "#5A5652", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Bio</label>
            <textarea
              className="tfc-input"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="A short bio about you and your role…"
              rows={3}
              style={{ resize: "vertical", minHeight: 72 }}
            />
          </div>
          {saveErr && <div style={{ color: "#FCA5A5", fontSize: 12, marginBottom: 12, background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: 7 }}>{saveErr}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="tfc-btn" style={{ fontSize: 12, padding: "9px 20px" }} onClick={saveProfile} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => { setEditing(false); setSaveErr(""); setEditBio(member.bio || ""); setEditAvatar(member.avatar_url || ""); setEditName(member.name); }}
              style={{ background: "none", border: "1px solid #252525", borderRadius: 8, padding: "9px 16px", color: "#5A5652", fontSize: 12, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 3, marginBottom: 28 }}>
        {([
          { id: "profile", label: "Profile & SOP" },
          { id: "work", label: `Work (${cards.length})` },
          { id: "clients", label: `Clients (${clients.length})` },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`nav-tab${tab === t.id ? " active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {tab === "profile" && (
        <div>
          {/* Bio placeholder if empty */}
          {!member.bio && !editing && (
            <div style={{
              background: "#0D0D0D", border: "1px dashed #252525", borderRadius: 12,
              padding: "24px", textAlign: "center", marginBottom: 24,
            }}>
              <div style={{ color: "#5A5652", fontSize: 14 }}>No bio added yet.</div>
              {canEdit && (
                <button
                  onClick={() => setEditing(true)}
                  style={{ marginTop: 8, color: "#E02020", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  Add a bio →
                </button>
              )}
            </div>
          )}

          {/* Role SOP */}
          {sop && (
            <div style={{ background: "#0D0D0D", border: "1px solid #1A1A1A", borderRadius: 14, overflow: "hidden" }}>
              {/* SOP Header */}
              <button
                onClick={() => setSopOpen((v) => !v)}
                style={{
                  width: "100%", background: "none", border: "none", padding: "18px 24px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${roleColor}18`, border: `1px solid ${roleColor}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={roleColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ color: "#F0EDE6", fontSize: 13, fontWeight: 700 }}>{roleLabel} — Standard Operating Procedure</div>
                    <div style={{ color: "#5A5652", fontSize: 11, marginTop: 2 }}>Role responsibilities and pipeline overview</div>
                  </div>
                </div>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: sopOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {sopOpen && (
                <div style={{ padding: "0 24px 24px", borderTop: "1px solid #1A1A1A" }}>
                  <p style={{ color: "#A8A49C", fontSize: 13, lineHeight: 1.7, margin: "20px 0 24px" }}>{sop.summary}</p>

                  {/* Responsibilities */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ color: "#5A5652", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                      Key Responsibilities
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {sop.responsibilities.map((r, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: roleColor, marginTop: 6, flexShrink: 0 }} />
                          <span style={{ color: "#A8A49C", fontSize: 13, lineHeight: 1.6 }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pipeline stages */}
                  <div>
                    <div style={{ color: "#5A5652", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                      Pipeline Involvement
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {sop.pipeline.map((p, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#111111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "10px 14px" }}>
                          <div style={{ minWidth: 130, color: roleColor, fontSize: 12, fontWeight: 600 }}>{p.stage}</div>
                          <div style={{ color: "#A8A49C", fontSize: 12 }}>{p.action}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Appearance — only visible on your own profile */}
          {isOwnProfile && (
            <div style={{ marginTop: 24, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "20px 24px" }}>
              <div style={{ color: "var(--color-text)", fontSize: 14, fontWeight: 700, fontFamily: "var(--font-syne), Syne, sans-serif", marginBottom: 16 }}>Appearance</div>
              <div style={{ display: "flex", gap: 12 }}>
                {([
                  { id: "dark" as const, label: "Dark", bg: "#0A0A0A", sidebar: "#111111", text: "#F0EDE6", border: "#252525" },
                  { id: "light" as const, label: "Light", bg: "#F2F0EC", sidebar: "#FFFFFF", text: "#1A1917", border: "#DDD9D3" },
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    style={{
                      flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start",
                      gap: 10, padding: 12, borderRadius: 12, cursor: "pointer",
                      background: "transparent", border: `2px solid ${theme === opt.id ? "#E02020" : "var(--color-border-2)"}`,
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div style={{
                      width: "100%", height: 52, borderRadius: 8,
                      background: opt.bg, border: `1px solid ${opt.border}`,
                      overflow: "hidden", position: "relative",
                    }}>
                      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 32, background: opt.sidebar, borderRight: `1px solid ${opt.border}` }} />
                      <div style={{ position: "absolute", top: 11, left: 40, right: 8, height: 7, borderRadius: 4, background: opt.text, opacity: 0.8 }} />
                      <div style={{ position: "absolute", top: 25, left: 40, right: 20, height: 5, borderRadius: 3, background: opt.text, opacity: 0.3 }} />
                      <div style={{ position: "absolute", top: 36, left: 40, right: 14, height: 5, borderRadius: 3, background: opt.text, opacity: 0.18 }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                      <span style={{ color: "var(--color-text)", fontSize: 12, fontWeight: 600 }}>{opt.label}</span>
                      {theme === opt.id && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E02020" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WORK TAB */}
      {tab === "work" && (
        <div>
          {cards.length === 0 ? (
            <div style={{
              background: "#0D0D0D", border: "1px dashed #252525", borderRadius: 12,
              padding: "40px 24px", textAlign: "center",
            }}>
              <div style={{ color: "#5A5652", fontSize: 14 }}>No active work items.</div>
              <div style={{ color: "#3A3632", fontSize: 12, marginTop: 6 }}>
                {member.role === "editor"
                  ? "Cards will appear here when assigned_editor is set to this member."
                  : "Cards from assigned clients will appear here."}
              </div>
            </div>
          ) : (
            <div>
              {/* Summary bar */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                {Object.entries(
                  cards.reduce((acc, c) => { acc[c.column_id] = (acc[c.column_id] || 0) + 1; return acc; }, {} as Record<string, number>)
                ).map(([col, count]) => (
                  <div key={col} style={{
                    background: "#111111", border: `1px solid ${COLUMN_COLORS[col] ?? "#252525"}33`,
                    borderRadius: 8, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLUMN_COLORS[col] ?? "#5A5652" }} />
                    <span style={{ color: "#A8A49C", fontSize: 12 }}>{COLUMN_LABELS[col] ?? col}</span>
                    <span style={{ color: COLUMN_COLORS[col] ?? "#5A5652", fontSize: 12, fontWeight: 700 }}>{count}</span>
                  </div>
                ))}
              </div>

              {/* Cards grouped by client */}
              {Object.entries(cardsByClient).map(([clientName, clientCards]) => {
                const clientId = clientCards[0]?.client_id;
                return (
                <div key={clientName} style={{ marginBottom: 20 }}>
                  <div style={{
                    color: "#A8A49C", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", marginBottom: 10, paddingBottom: 8,
                    borderBottom: "1px solid #1A1A1A", display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <span>{clientName} — {clientCards.length} item{clientCards.length !== 1 ? "s" : ""}</span>
                    {onClientSelect && clientId && (
                      <button
                        onClick={() => onClientSelect(clientId)}
                        style={{
                          background: "transparent", border: "1px solid #252525", borderRadius: 6,
                          color: "#A8A49C", fontSize: 10, fontWeight: 700, cursor: "pointer",
                          padding: "3px 10px", letterSpacing: "0.06em", textTransform: "uppercase",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E02020"; (e.currentTarget as HTMLButtonElement).style.color = "#E02020"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#252525"; (e.currentTarget as HTMLButtonElement).style.color = "#A8A49C"; }}
                      >
                        Open Board →
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {clientCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => onClientSelect && clientId && onClientSelect(clientId)}
                        style={{
                          background: "#111111", border: "1px solid #1e1e1e", borderRadius: 10,
                          padding: "12px 16px", display: "flex", alignItems: "center", gap: 14,
                          cursor: onClientSelect ? "pointer" : "default",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={(e) => { if (onClientSelect) (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1e1e1e"; }}
                      >
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                          background: COLUMN_COLORS[card.column_id] ?? "#5A5652",
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "#F0EDE6", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {card.title}
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                            <span style={{ color: COLUMN_COLORS[card.column_id] ?? "#5A5652", fontSize: 11 }}>
                              {COLUMN_LABELS[card.column_id] ?? card.column_id}
                            </span>
                            {card.platform && (
                              <span style={{ color: "#5A5652", fontSize: 11 }}>· {card.platform}</span>
                            )}
                            {card.due_date && (
                              <span style={{ color: "#5A5652", fontSize: 11 }}>
                                · Due {new Date(card.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                        {card.priority && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                            padding: "2px 8px", borderRadius: 6,
                            color: card.priority === "high" ? "#EF4444" : card.priority === "medium" ? "#F59E0B" : "#5A5652",
                            background: card.priority === "high" ? "rgba(239,68,68,0.1)" : card.priority === "medium" ? "rgba(245,158,11,0.1)" : "#1A1A1A",
                            border: `1px solid ${card.priority === "high" ? "rgba(239,68,68,0.2)" : card.priority === "medium" ? "rgba(245,158,11,0.2)" : "#252525"}`,
                          }}>
                            {card.priority}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CLIENTS TAB */}
      {tab === "clients" && (
        <div>
          {clients.length === 0 ? (
            <div style={{
              background: "#0D0D0D", border: "1px dashed #252525", borderRadius: 12,
              padding: "40px 24px", textAlign: "center",
            }}>
              <div style={{ color: "#5A5652", fontSize: 14 }}>No clients assigned.</div>
              <div style={{ color: "#3A3632", fontSize: 12, marginTop: 6 }}>
                Assign clients from each client&apos;s Assignments tab.
              </div>
            </div>
          ) : (
            <div style={{ background: "#111111", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden" }}>
              {clients.map((c, i) => (
                <div key={c.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 20px",
                  borderBottom: i < clients.length - 1 ? "1px solid #1A1A1A" : "none",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg, #E02020, #8A1010)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0,
                  }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: "#F0EDE6", fontSize: 14, fontWeight: 500 }}>{c.name}</div>
                    <div style={{ color: "#5A5652", fontSize: 12, marginTop: 2 }}>{c.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
