"use client";

import { useState, useEffect, useCallback } from "react";

interface Session {
  id: string;
  email: string;
  name: string;
  type: "team" | "client" | "unknown";
  role: string | null;
  last_sign_in: string | null;
  created_at: string;
  confirmed_at: string | null;
  banned: boolean;
}

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  team: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  client: { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  unknown: { color: "#A8A49C", bg: "rgba(168,164,156,0.12)" },
};

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoutBusy, setLogoutBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "team" | "client">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        setSessions(await res.json());
      } else {
        const data = await res.json();
        setError(data.error || "Failed to load sessions");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const forceLogout = async (userId: string) => {
    setLogoutBusy(userId);
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        load();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to force logout");
      }
    } catch {
      alert("Network error");
    }
    setLogoutBusy(null);
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return "Never";
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filtered = filter === "all" ? sessions : sessions.filter((s) => s.type === filter);

  return (
    <div className="p-5 sm:p-8 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-text font-heading text-xl font-[800] m-0 mb-1">Session Management</h2>
          <p className="text-text-2 text-[13px] m-0">View active users, last sign-in times, and force logout.</p>
        </div>
        <button
          onClick={load}
          className="text-text-3 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-[12px] font-semibold cursor-pointer hover:text-text transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(["all", "team", "client"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition-colors"
            style={{
              background: filter === f ? "var(--color-surface-3)" : "transparent",
              color: filter === f ? "var(--color-text)" : "var(--color-text-3)",
              border: filter === f ? "1px solid var(--color-border-2)" : "1px solid transparent",
            }}
          >
            {f === "all" ? `All (${sessions.length})` : f === "team" ? `Team (${sessions.filter((s) => s.type === "team").length})` : `Clients (${sessions.filter((s) => s.type === "client").length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-surface border border-border rounded-xl p-10 text-text-3 text-[13px] text-center">Loading sessions...</div>
      ) : error ? (
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
          <p className="text-[#EF4444] text-[13px] m-0">{error}</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase">User</th>
                  <th className="px-4 py-2.5 text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase">Type</th>
                  <th className="px-4 py-2.5 text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase">Role</th>
                  <th className="px-4 py-2.5 text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase">Last Sign In</th>
                  <th className="px-4 py-2.5 text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase">Status</th>
                  <th className="px-4 py-2.5 text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const tc = TYPE_COLORS[s.type] || TYPE_COLORS.unknown;
                  return (
                    <tr key={s.id} className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-2.5">
                        <p className="text-text text-[13px] font-semibold m-0">{s.name}</p>
                        <p className="text-text-3 text-[11px] m-0">{s.email}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-bold tracking-[0.06em] uppercase py-[2px] px-[8px] rounded-md" style={{ color: tc.color, background: tc.bg }}>
                          {s.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-text-2 text-[12px] capitalize">{s.role || "—"}</td>
                      <td className="px-4 py-2.5 text-text-3 text-[12px]">{formatTime(s.last_sign_in)}</td>
                      <td className="px-4 py-2.5">
                        {s.banned ? (
                          <span className="text-[10px] font-bold text-[#EF4444] bg-[rgba(239,68,68,0.12)] py-[2px] px-[8px] rounded-md">Banned</span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#10B981] bg-[rgba(16,185,129,0.12)] py-[2px] px-[8px] rounded-md">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {!s.banned && (
                          <button
                            onClick={() => forceLogout(s.id)}
                            disabled={logoutBusy === s.id}
                            className="text-[11px] font-semibold text-[#EF4444] bg-transparent border border-[rgba(239,68,68,0.3)] rounded-lg px-2.5 py-1 cursor-pointer hover:bg-[rgba(239,68,68,0.08)] transition-colors disabled:opacity-50"
                          >
                            {logoutBusy === s.id ? "..." : "Force Logout"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
