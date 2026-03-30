"use client";

import { useState, useEffect, useCallback } from "react";

interface TrashCard {
  id: string;
  title: string;
  platform?: string;
  column_id: string;
  priority?: string;
  deleted_at: string;
  deleted_by?: string | null;
}

interface TrashMessage {
  id: string;
  content: string;
  sender_name: string;
  sender_type: string;
  deleted_at: string;
  deleted_by?: string | null;
}

interface TrashResource {
  id: string;
  name: string;
  category?: string;
  type?: string;
  deleted_at: string;
  deleted_by?: string | null;
}

interface Props {
  clientId: string;
}

type TrashItem =
  | { kind: "card"; data: TrashCard }
  | { kind: "message"; data: TrashMessage }
  | { kind: "resource"; data: TrashResource };

const FILTERS = ["All", "Content", "Messages", "Resources"] as const;
type Filter = (typeof FILTERS)[number];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntilPurge(dateStr: string) {
  const deleted = new Date(dateStr).getTime();
  const purgeAt = deleted + 30 * 24 * 60 * 60 * 1000;
  const remaining = Math.ceil((purgeAt - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, remaining);
}

export function TrashBin({ clientId }: Props) {
  const [cards, setCards] = useState<TrashCard[]>([]);
  const [messages, setMessages] = useState<TrashMessage[]>([]);
  const [resources, setResources] = useState<TrashResource[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trash?client_id=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
        setMessages(data.messages || []);
        setResources(data.resources || []);
      }
    } catch {}
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const handleRestore = async (id: string, type: "card" | "message" | "resource") => {
    setBusy(id);
    try {
      const res = await fetch("/api/trash", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type }),
      });
      if (res.ok) {
        if (type === "card") setCards((p) => p.filter((c) => c.id !== id));
        if (type === "message") setMessages((p) => p.filter((m) => m.id !== id));
        if (type === "resource") setResources((p) => p.filter((r) => r.id !== id));
      }
    } catch {}
    setBusy(null);
  };

  const handlePermanentDelete = async (id: string, type: "card" | "message" | "resource") => {
    setBusy(id);
    try {
      const res = await fetch(`/api/trash?id=${id}&type=${type}`, { method: "DELETE" });
      if (res.ok) {
        if (type === "card") setCards((p) => p.filter((c) => c.id !== id));
        if (type === "message") setMessages((p) => p.filter((m) => m.id !== id));
        if (type === "resource") setResources((p) => p.filter((r) => r.id !== id));
      }
    } catch {}
    setBusy(null);
    setConfirmDelete(null);
  };

  const handleEmptyTrash = async () => {
    setBusy("empty");
    const allItems: { id: string; type: "card" | "message" | "resource" }[] = [
      ...cards.map((c) => ({ id: c.id, type: "card" as const })),
      ...messages.map((m) => ({ id: m.id, type: "message" as const })),
      ...resources.map((r) => ({ id: r.id, type: "resource" as const })),
    ];
    await Promise.all(
      allItems.map(({ id, type }) =>
        fetch(`/api/trash?id=${id}&type=${type}`, { method: "DELETE" })
      )
    );
    setCards([]);
    setMessages([]);
    setResources([]);
    setBusy(null);
    setConfirmDelete(null);
  };

  // Build filtered list
  const items: TrashItem[] = [];
  if (filter === "All" || filter === "Content") {
    cards.forEach((c) => items.push({ kind: "card", data: c }));
  }
  if (filter === "All" || filter === "Messages") {
    messages.forEach((m) => items.push({ kind: "message", data: m }));
  }
  if (filter === "All" || filter === "Resources") {
    resources.forEach((r) => items.push({ kind: "resource", data: r }));
  }
  // Sort by deleted_at descending
  items.sort((a, b) => new Date(b.data.deleted_at).getTime() - new Date(a.data.deleted_at).getTime());

  const totalCount = cards.length + messages.length + resources.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A8A49C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
          <h3 className="text-text font-heading text-[15px] font-bold m-0">Recently Deleted</h3>
          <span className="text-text-3 text-[12px]">{totalCount} item{totalCount !== 1 ? "s" : ""}</span>
        </div>
        {totalCount > 0 && (
          confirmDelete === "empty-all" ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-text-3">Delete everything?</span>
              <button
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] border-none cursor-pointer font-body hover:bg-[#EF4444]/20 transition-colors"
                onClick={handleEmptyTrash}
                disabled={busy === "empty"}
              >
                {busy === "empty" ? "Deleting..." : "Yes, empty"}
              </button>
              <button
                className="text-[11px] px-3 py-1.5 rounded-lg bg-surface-2 text-text-3 border-none cursor-pointer font-body hover:text-text transition-colors"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-surface-2 text-text-3 border border-border cursor-pointer font-body hover:text-[#EF4444] hover:border-[#EF4444]/30 transition-colors shrink-0"
              onClick={() => setConfirmDelete("empty-all")}
            >
              Empty Trash
            </button>
          )
        )}
      </div>

      {/* Filter Pills */}
      <div className="px-5 py-2.5 border-b border-border flex items-center gap-2 shrink-0 overflow-x-auto">
        {FILTERS.map((f) => {
          const count = f === "All" ? totalCount : f === "Content" ? cards.length : f === "Messages" ? messages.length : resources.length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-label={`Filter by ${f}`}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border-none cursor-pointer font-body transition-all whitespace-nowrap ${
                filter === f
                  ? "bg-red/10 text-red"
                  : "bg-transparent text-text-3 hover:text-text hover:bg-surface-2"
              }`}
            >
              {f}{count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-text-3 text-[13px] m-0">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-40">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            <p className="text-text-3 text-[13px] m-0">Trash is empty</p>
            <p className="text-text-3 text-[11px] m-0 mt-1 opacity-60">Deleted items will appear here for 30 days</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const id = item.data.id;
              const isBusy = busy === id;
              const isConfirming = confirmDelete === id;
              const days = daysUntilPurge(item.data.deleted_at);

              return (
                <div key={id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-surface-2/50 transition-colors">
                  {/* Type badge */}
                  <span
                    className="text-[9px] font-bold tracking-[0.08em] uppercase py-[3px] px-[7px] rounded shrink-0"
                    style={{
                      background: item.kind === "card" ? "rgba(224,32,32,0.12)" : item.kind === "message" ? "rgba(168,164,156,0.12)" : "rgba(59,130,246,0.12)",
                      color: item.kind === "card" ? "#E02020" : item.kind === "message" ? "#A8A49C" : "#3B82F6",
                    }}
                  >
                    {item.kind === "card" ? "Content" : item.kind === "message" ? "Message" : "Resource"}
                  </span>

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-[13px] font-medium m-0 truncate">
                      {item.kind === "card"
                        ? item.data.title
                        : item.kind === "message"
                          ? (item.data as TrashMessage).content.length > 60
                            ? (item.data as TrashMessage).content.slice(0, 60) + "..."
                            : (item.data as TrashMessage).content
                          : (item.data as TrashResource).name}
                    </p>
                    <p className="text-text-3 text-[11px] m-0 mt-0.5">
                      Deleted {timeAgo(item.data.deleted_at)}
                      {item.data.deleted_by && (
                        <span className="text-text-3 ml-1">
                          by <span className="text-text-2">{item.data.deleted_by.split("@")[0]}</span>
                        </span>
                      )}
                      {days <= 7 && <span className="text-[#F59E0B] ml-1.5">({days}d left)</span>}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isConfirming ? (
                      <>
                        <button
                          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] border-none cursor-pointer font-body hover:bg-[#EF4444]/20 transition-colors"
                          onClick={() => handlePermanentDelete(id, item.kind === "card" ? "card" : item.kind === "message" ? "message" : "resource")}
                          disabled={isBusy}
                        >
                          {isBusy ? "..." : "Confirm"}
                        </button>
                        <button
                          className="text-[11px] px-2.5 py-1.5 rounded-lg bg-surface-2 text-text-3 border-none cursor-pointer font-body hover:text-text transition-colors"
                          onClick={() => setConfirmDelete(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-surface-2 text-text-2 border-none cursor-pointer font-body hover:text-text hover:bg-surface-3 transition-colors"
                          onClick={() => handleRestore(id, item.kind === "card" ? "card" : item.kind === "message" ? "message" : "resource")}
                          disabled={isBusy}
                          title="Restore item"
                          aria-label="Restore item"
                        >
                          {isBusy ? "..." : "Restore"}
                        </button>
                        <button
                          className="text-[11px] px-2 py-1.5 rounded-lg bg-transparent text-text-3 border-none cursor-pointer font-body hover:text-[#EF4444] transition-colors"
                          onClick={() => setConfirmDelete(id)}
                          title="Delete permanently"
                          aria-label="Delete permanently"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {totalCount > 0 && (
        <div className="px-5 py-2.5 border-t border-border shrink-0" style={{ background: "#0D0D0D" }}>
          <p className="text-text-3 text-[10px] m-0">
            Items are automatically deleted after 30 days
          </p>
        </div>
      )}
    </div>
  );
}
