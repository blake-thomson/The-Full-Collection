"use client";

import { useState, useEffect, useCallback } from "react";

interface Assignment {
  id: string;
  team_member_email: string;
  name: string;
  role: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  project_manager: "Project Manager",
  editor: "Editor",
  videographer: "Videographer",
  smm: "Social Media Manager",
  social_media_manager: "Social Media Manager",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "#F59E0B",
  admin: "#FF3B3B",
  project_manager: "#3B82F6",
  editor: "#10B981",
  videographer: "#EC4899",
  smm: "#8B5CF6",
  social_media_manager: "#8B5CF6",
};

// Which roles get notified for which column moves (for display purposes)
const ROLE_NOTIFICATION_INFO: Record<string, string[]> = {
  editor: ["Filmed → notified", "Revise → notified"],
  project_manager: ["Filmed → notified"],
  videographer: ["Shoot date → notified"],
  smm: ["Approved for Publish → notified"],
  social_media_manager: ["Approved for Publish → notified"],
  admin: ["Edited QCC → notified"],
  owner: ["Edited QCC → notified"],
};

export function ClientAssignments({ clientId }: { clientId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [assignRes, memberRes] = await Promise.all([
      fetch(`/api/client-assignments?client_id=${clientId}`),
      fetch("/api/team-members"),
    ]);
    if (assignRes.ok) setAssignments(await assignRes.json());
    if (memberRes.ok) setAllMembers(await memberRes.json());
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const assignedEmails = new Set(assignments.map((a) => a.team_member_email));
  const unassigned = allMembers.filter((m) => !assignedEmails.has(m.email));

  async function assign(email: string) {
    setAdding(true);
    setShowPicker(false);
    const res = await fetch("/api/client-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, team_member_email: email }),
    });
    if (res.ok) {
      const added = await res.json();
      setAssignments((prev) => [...prev, added]);
    }
    setAdding(false);
  }

  async function remove(id: string) {
    setRemovingId(id);
    await fetch(`/api/client-assignments?id=${id}`, { method: "DELETE" });
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setRemovingId(null);
  }

  if (loading) {
    return (
      <div style={{ padding: "24px", color: "#5A5652", fontSize: 14 }}>
        Loading assignments…
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h3 style={{ color: "#F0EDE6", fontSize: 16, fontWeight: 600, margin: 0 }}>
            Team Assignments
          </h3>
          <p style={{ color: "#5A5652", fontSize: 13, margin: "4px 0 0" }}>
            Assigned members receive notifications when content moves to relevant columns.
          </p>
        </div>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowPicker((v) => !v)}
            disabled={adding || unassigned.length === 0}
            style={{
              background: "var(--color-red)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: unassigned.length === 0 ? "not-allowed" : "pointer",
              opacity: unassigned.length === 0 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Assign Member
          </button>

          {showPicker && unassigned.length > 0 && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "#181818",
              border: "1px solid #252525",
              borderRadius: 10,
              minWidth: 240,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              zIndex: 50,
              overflow: "hidden",
            }}>
              {unassigned.map((m) => (
                <button
                  key={m.email}
                  onClick={() => assign(m.email)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    borderBottom: "1px solid #202020",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#202020")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#252525",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: ROLE_COLORS[m.role] ?? "#A8A49C",
                    flexShrink: 0,
                  }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: "#F0EDE6", fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                    <div style={{ color: ROLE_COLORS[m.role] ?? "#5A5652", fontSize: 11, marginTop: 2 }}>
                      {ROLE_LABELS[m.role] ?? m.role}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Click-outside to close picker */}
      {showPicker && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 49 }}
          onClick={() => setShowPicker(false)}
        />
      )}

      {/* Assignment list */}
      {assignments.length === 0 ? (
        <div style={{
          background: "#111111",
          border: "1px dashed #252525",
          borderRadius: 12,
          padding: "32px 24px",
          textAlign: "center",
        }}>
          <div style={{ color: "#5A5652", fontSize: 14 }}>No team members assigned yet.</div>
          <div style={{ color: "#3A3632", fontSize: 12, marginTop: 6 }}>
            Assign members to automatically route notifications when content moves columns.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {assignments.map((a) => (
            <div
              key={a.id}
              style={{
                background: "#111111",
                border: "1px solid #1e1e1e",
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#1e1e1e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: ROLE_COLORS[a.role] ?? "#A8A49C",
                flexShrink: 0,
              }}>
                {a.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ color: "#F0EDE6", fontSize: 14, fontWeight: 500 }}>{a.name}</span>
                  <span style={{
                    background: `${ROLE_COLORS[a.role] ?? "#5A5652"}22`,
                    color: ROLE_COLORS[a.role] ?? "#5A5652",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 20,
                    letterSpacing: "0.02em",
                  }}>
                    {ROLE_LABELS[a.role] ?? a.role}
                  </span>
                </div>
                <div style={{ color: "#5A5652", fontSize: 12, marginTop: 3 }}>{a.team_member_email}</div>

                {/* Notification triggers */}
                {ROLE_NOTIFICATION_INFO[a.role] && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    {ROLE_NOTIFICATION_INFO[a.role].map((trigger) => (
                      <span key={trigger} style={{
                        background: "#181818",
                        border: "1px solid #252525",
                        color: "#A8A49C",
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 20,
                      }}>
                        🔔 {trigger}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Remove */}
              <button
                onClick={() => remove(a.id)}
                disabled={removingId === a.id}
                style={{
                  background: "none",
                  border: "1px solid #252525",
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer",
                  color: "#5A5652",
                  fontSize: 12,
                  flexShrink: 0,
                  opacity: removingId === a.id ? 0.5 : 1,
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#EF4444";
                  e.currentTarget.style.borderColor = "#EF4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#5A5652";
                  e.currentTarget.style.borderColor = "#252525";
                }}
              >
                {removingId === a.id ? "…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notification routing legend */}
      <div style={{
        marginTop: 28,
        background: "#0D0D0D",
        border: "1px solid #1A1A1A",
        borderRadius: 12,
        padding: "16px 20px",
      }}>
        <div style={{ color: "#A8A49C", fontSize: 12, fontWeight: 600, marginBottom: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Notification Routing Rules
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { column: "Filmed", arrow: "→", roles: "Editors & Project Managers", color: "#3B82F6" },
            { column: "Edited QCC", arrow: "→", roles: "Admins & Owners", color: "#A78BFA" },
            { column: "Ready for Review", arrow: "→", roles: "Client", color: "#EC4899" },
            { column: "Approved for Publish", arrow: "→", roles: "Social Media Managers", color: "#10B981" },
            { column: "Revise", arrow: "→", roles: "Editors", color: "#EF4444" },
            { column: "Scheduled", arrow: "→", roles: "Client", color: "#06B6D4" },
            { column: "Published", arrow: "→", roles: "Client", color: "var(--color-red)" },
            { column: "Shoot Date", arrow: "→", roles: "Editors, Videographers, Admins & Owners", color: "#EC4899" },
          ].map(({ column, arrow, roles, color }) => (
            <div key={column} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
              <span style={{ color, fontWeight: 600, minWidth: 160 }}>{column}</span>
              <span style={{ color: "#3A3632" }}>{arrow}</span>
              <span style={{ color: "#A8A49C" }}>{roles} notified</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
