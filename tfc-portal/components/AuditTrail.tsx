"use client";

import { useState, useEffect, useCallback } from "react";

interface AuditEntry {
  id: string;
  client_id: string;
  actor_email: string;
  actor_name: string | null;
  actor_type: string;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface Props {
  clients: { id: string; name: string }[];
}

const ACTION_LABELS: Record<string, string> = {
  card_created: "Card Created",
  card_moved: "Card Moved",
  card_updated: "Card Updated",
  card_deleted: "Card Deleted",
  card_restored: "Card Restored",
  card_approved: "Content Approved",
  card_revision_requested: "Revisions Requested",
  comment_added: "Comment Added",
  attachment_added: "Attachment Added",
  attachment_deleted: "Attachment Deleted",
  team_member_added: "Team Member Added",
  team_member_removed: "Team Member Removed",
  team_member_role_changed: "Role Changed",
  client_created: "Client Created",
  client_updated: "Client Updated",
  client_assignment_added: "Assignment Added",
  client_assignment_removed: "Assignment Removed",
  login: "Login",
  subscription_created: "Subscription Created",
  subscription_updated: "Subscription Updated",
  subscription_canceled: "Subscription Canceled",
  payment_received: "Payment Received",
  payment_failed: "Payment Failed",
  post_scheduled: "Post Scheduled",
  post_published: "Post Published",
  post_failed: "Post Failed",
  report_generated: "Report Generated",
  report_sent: "Report Sent",
  resource_added: "Resource Added",
  resource_deleted: "Resource Deleted",
};

const ACTOR_TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  team: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  client: { color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  system: { color: "#A8A49C", bg: "rgba(168,164,156,0.12)" },
};

export function AuditTrail({ clients }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClient, setFilterClient] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterActor, setFilterActor] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const allEntries: AuditEntry[] = [];

    const targetClients = filterClient
      ? clients.filter((c) => c.id === filterClient)
      : clients.slice(0, 20);

    for (const c of targetClients) {
      try {
        const res = await fetch(`/api/activity?client_id=${c.id}&page=${page}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          if (data.data) allEntries.push(...data.data);
          if (data.pagination) setTotalPages(Math.max(totalPages, data.pagination.total_pages));
        }
      } catch {}
    }

    let filtered = allEntries;
    if (filterAction) filtered = filtered.filter((e) => e.action === filterAction);
    if (filterActor) filtered = filtered.filter((e) => e.actor_email.includes(filterActor) || (e.actor_name || "").includes(filterActor));

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setEntries(filtered.slice(0, 100));
    setLoading(false);
  }, [clients, filterClient, filterAction, filterActor, page, totalPages]);

  useEffect(() => { load(); }, [load]);

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const describeEntry = (e: AuditEntry) => {
    const label = ACTION_LABELS[e.action] || e.action.replace(/_/g, " ");
    const meta = e.metadata;
    if (meta?.title) return `${label}: "${meta.title}"`;
    if (meta?.name) return `${label}: "${meta.name}"`;
    if (meta?.from && meta?.to) return `${label}: ${meta.from} → ${meta.to}`;
    return label;
  };

  const uniqueActions = [...new Set(entries.map((e) => e.action))].sort();

  return (
    <div className="p-5 sm:p-8 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-text font-heading text-xl font-[800] m-0 mb-1">Audit Trail</h2>
          <p className="text-text-2 text-[13px] m-0">Who did what, when. Full accountability log.</p>
        </div>
        <button
          onClick={load}
          className="text-text-3 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-[12px] font-semibold cursor-pointer hover:text-text transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filterClient}
          onChange={(e) => { setFilterClient(e.target.value); setPage(1); }}
          className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-text text-[12px] outline-none"
        >
          <option value="">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-text text-[12px] outline-none"
        >
          <option value="">All Actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
          ))}
        </select>
        <input
          value={filterActor}
          onChange={(e) => setFilterActor(e.target.value)}
          placeholder="Filter by actor..."
          className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-text text-[12px] outline-none placeholder:text-text-3 w-[180px]"
        />
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-text-3 text-[13px] text-center">Loading audit trail...</div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-text-3 text-[13px] text-center">No activity found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase">Time</th>
                  <th className="px-4 py-2.5 text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase">Client</th>
                  <th className="px-4 py-2.5 text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase">Actor</th>
                  <th className="px-4 py-2.5 text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase">Type</th>
                  <th className="px-4 py-2.5 text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const actorColors = ACTOR_TYPE_COLORS[e.actor_type] || ACTOR_TYPE_COLORS.system;
                  return (
                    <tr key={e.id} className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors">
                      <td className="px-4 py-2.5 text-text-3 text-[11px] whitespace-nowrap">{formatTime(e.created_at)}</td>
                      <td className="px-4 py-2.5 text-text-2 text-[12px]">{clientMap.get(e.client_id) || "—"}</td>
                      <td className="px-4 py-2.5 text-text text-[12px]">{e.actor_name || e.actor_email}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[10px] font-bold tracking-[0.06em] uppercase py-[2px] px-[8px] rounded-md"
                          style={{ color: actorColors.color, background: actorColors.bg }}
                        >
                          {e.actor_type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-text-2 text-[12px]">{describeEntry(e)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="text-text-3 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-[12px] font-semibold cursor-pointer disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-text-3 text-[12px]">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="text-text-3 bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-[12px] font-semibold cursor-pointer disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
