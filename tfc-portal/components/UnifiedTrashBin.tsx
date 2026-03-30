"use client";

import { useState, useEffect, useCallback } from "react";

interface TrashItem {
  id: string;
  type: string;
  table: string;
  label: string;
  client_id: string | null;
  client_name: string | null;
  deleted_at: string;
  deleted_by: string | null;
  meta: string | null;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  card: { label: "Content", color: "#C83232" },
  message: { label: "Message", color: "#3B82F6" },
  resource: { label: "Resource", color: "#8B5CF6" },
  team_conversation: { label: "Team Chat", color: "#F59E0B" },
  team_message: { label: "Team Msg", color: "#F59E0B" },
  client_conversation: { label: "Client Chat", color: "#10B981" },
  client_message: { label: "Client Msg", color: "#10B981" },
};

const FILTERS = ["All", "Content", "Messages", "Resources", "Conversations"] as const;
type Filter = (typeof FILTERS)[number];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function matchesFilter(item: TrashItem, filter: Filter): boolean {
  if (filter === "All") return true;
  if (filter === "Content") return item.type === "card";
  if (filter === "Messages") return ["message", "team_message", "client_message"].includes(item.type);
  if (filter === "Resources") return item.type === "resource";
  if (filter === "Conversations") return ["team_conversation", "client_conversation"].includes(item.type);
  return true;
}

export function UnifiedTrashBin() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/trash-all");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = items
    .filter((item) => matchesFilter(item, filter))
    .filter((item) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        item.label.toLowerCase().includes(q) ||
        (item.client_name || "").toLowerCase().includes(q) ||
        (item.deleted_by || "").toLowerCase().includes(q)
      );
    });

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-surface rounded-xl border border-border p-5 animate-pulse h-[72px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-text font-heading text-[22px] font-[800] m-0 mb-1 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Recently Deleted
          </h2>
          <p className="text-text-2 text-[13px] m-0">
            {filtered.length} item{filtered.length !== 1 ? "s" : ""} in trash across all clients
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          className="tfc-input max-w-full sm:max-w-[260px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, client, or user..."
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`tfc-pill${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-10 text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-text-3 mb-3">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          <p className="text-text-2 text-[14px] font-semibold font-body m-0">Trash is empty</p>
          <p className="text-text-3 text-[12px] font-body m-0 mt-1">Items are automatically deleted after 30 days</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => {
            const typeInfo = TYPE_LABELS[item.type] || { label: item.type, color: "#666" };
            const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - new Date(item.deleted_at).getTime()) / 86400000));

            return (
              <div
                key={`${item.table}-${item.id}`}
                className="bg-surface rounded-xl border border-border p-4 flex items-start gap-3"
              >
                {/* Type badge */}
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-md shrink-0 mt-0.5"
                  style={{ color: typeInfo.color, background: typeInfo.color + "18" }}
                >
                  {typeInfo.label}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-text text-[13px] font-semibold font-body m-0 truncate">
                    {item.label}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    {/* When */}
                    <span className="text-text-3 text-[11px] font-body">
                      {timeAgo(item.deleted_at)}
                    </span>
                    {/* Who */}
                    {item.deleted_by && (
                      <span className="text-text-3 text-[11px] font-body">
                        by <span className="text-text-2">{item.deleted_by.split("@")[0]}</span>
                      </span>
                    )}
                    {/* Client */}
                    {item.client_name && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-2 text-text-2 font-body">
                        {item.client_name}
                      </span>
                    )}
                    {/* Days left */}
                    {daysLeft <= 7 && (
                      <span className="text-[10px] text-amber-400 font-body">{daysLeft}d left</span>
                    )}
                  </div>
                  {item.meta && (
                    <p className="text-text-3 text-[10px] font-body m-0 mt-0.5">{item.meta}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <p className="text-text-3 text-[11px] font-body text-center mt-2">
        Items are automatically deleted after 30 days
      </p>
    </div>
  );
}
