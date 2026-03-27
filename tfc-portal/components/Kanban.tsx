"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { COLUMNS } from "@/lib/constants";

interface Card {
  id: string;
  title: string;
  platform?: string;
  column_id: string;
  position: number;
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
  priority?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  clientId: string;
  editable?: boolean;
  clientName?: string;
  onCardClick?: (card: Card) => void;
}

const CONTENT_STYLES = ["Education", "Lifestyle", "Entertainment", "Vlog"];
const CONTENT_TYPES = ["Short-form", "Long-form", "Post/Carousel"];

export function Kanban({ clientId, editable = true, clientName, onCardClick }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ cardId: string; colId: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [locationResults, setLocationResults] = useState<Array<{ display: string; place_id: string }>>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const locationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New card form state
  const [newTitle, setNewTitle] = useState("");
  const [newContentStyle, setNewContentStyle] = useState("");
  const [newContentType, setNewContentType] = useState("");
  const [newReferenceUrl, setNewReferenceUrl] = useState("");
  const [newEditor, setNewEditor] = useState("");
  const [newShootDate, setNewShootDate] = useState("");
  const [newEditDeadline, setNewEditDeadline] = useState("");
  const [newPublishDate, setNewPublishDate] = useState("");
  const [newShootLocation, setNewShootLocation] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const resetForm = () => {
    setNewTitle("");
    setNewContentStyle("");
    setNewContentType("");
    setNewReferenceUrl("");
    setNewEditor("");
    setNewShootDate("");
    setNewEditDeadline("");
    setNewPublishDate("");
    setNewShootLocation("");
    setNewPriority("medium");
    setCreateError("");
    setLocationResults([]);
  };

  // Debounced address search via OpenStreetMap Nominatim
  const searchLocations = useCallback((query: string) => {
    if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    if (query.length < 3) {
      setLocationResults([]);
      setShowLocationDropdown(false);
      return;
    }
    setLocationLoading(true);
    locationTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=us`,
          { headers: { "Accept": "application/json" } }
        );
        if (res.ok) {
          const data = await res.json();
          setLocationResults(
            data.map((r: { display_name: string; place_id: number }) => ({
              display: r.display_name,
              place_id: String(r.place_id),
            }))
          );
          setShowLocationDropdown(true);
        }
      } catch {
        // Silent fail — user can still type freely
      }
      setLocationLoading(false);
    }, 400);
  }, []);

  // Close location dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadCards = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/kanban?client_id=${clientId}`);
    if (res.ok) {
      setCards(await res.json());
    }
    setLoading(false);
  }, [clientId]);

  // Load team members (editors)
  const loadTeamMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) return;
      // Try to get team members from a dedicated endpoint or fall back
    } catch { /* ignore */ }
    // Fetch team members via Supabase admin - use the invites endpoint pattern
    try {
      const res = await fetch("/api/team-members");
      if (res.ok) {
        const members = await res.json();
        setTeamMembers(members);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadCards(); loadTeamMembers(); }, [loadCards, loadTeamMembers]);

  const addCard = async (colId: string) => {
    if (!newTitle.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          column_id: colId,
          title: newTitle.trim(),
          content_style: newContentStyle || null,
          content_type: newContentType || null,
          reference_url: newReferenceUrl.trim() || null,
          assigned_editor: newEditor || null,
          shoot_date: newShootDate || null,
          edit_deadline: newEditDeadline || null,
          publish_date: newPublishDate || null,
          shoot_location: newShootLocation.trim() || null,
          priority: newPriority || null,
        }),
      });
      if (res.ok) {
        const card = await res.json();
        setCards((prev) => [...prev, card]);
        resetForm();
        setShowCreateModal(null);
      } else {
        const data = await res.json();
        setCreateError(data.error || "Failed to create card. Please try again.");
      }
    } catch {
      setCreateError("Network error. Please try again.");
    }
    setCreating(false);
  };

  const deleteCard = async (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    await fetch(`/api/kanban?id=${cardId}`, { method: "DELETE" });
  };

  const drop = async (toColId: string) => {
    if (!dragging || dragging.colId === toColId) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const card = cards.find((c) => c.id === dragging.cardId);
    if (!card) return;

    setCards((prev) =>
      prev.map((c) => (c.id === dragging.cardId ? { ...c, column_id: toColId } : c))
    );
    setDragging(null);
    setDragOver(null);

    await fetch("/api/kanban", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dragging.cardId, column_id: toColId }),
    });
  };

  const getColCards = (colId: string) => cards.filter((c) => c.column_id === colId);
  const total = cards.length;
  const published = getColCards("published").length;

  if (loading) return <div className="p-10 text-text-3 text-[13px] text-center">Loading board...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="px-[22px] py-3 border-b border-border flex items-center gap-5 shrink-0">
        {clientName && (
          <>
            <span className="text-text-2 text-xs">Editing board for <strong className="text-text">{clientName}</strong></span>
            <div className="h-3.5 w-px bg-border-2" />
          </>
        )}
        {[
          { l: "Total", v: total, accent: false },
          { l: "Published", v: published, accent: true },
          { l: "In Progress", v: total - published, accent: false },
        ].map((s) => (
          <div key={s.l} className="flex items-center gap-1.5">
            <span className="text-text-3 text-[11px] tracking-[0.06em] uppercase">{s.l}</span>
            <span className={`text-[13px] font-semibold ${s.accent ? "text-red" : "text-text"}`}>{s.v}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-[16px_18px] flex gap-2.5 items-start">
        {COLUMNS.map((col) => {
          const colCards = getColCards(col.id);
          const isOver = dragOver === col.id;
          return (
            <div
              key={col.id}
              className="w-[210px] shrink-0 rounded-xl flex flex-col transition-all"
              style={{
                background: isOver ? "rgba(224,32,32,0.04)" : "#111111",
                border: `1px solid ${isOver ? "#E02020" : "#252525"}`,
                maxHeight: "calc(100vh - 220px)",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
              onDrop={(e) => { e.preventDefault(); drop(col.id); }}
              onDragLeave={() => setDragOver(null)}
            >
              <div className="px-3 py-2.5 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-[7px]">
                  <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: col.color }} />
                  <span className="text-text text-xs font-semibold">{col.label}</span>
                </div>
                <span className="text-text-3 text-[10px] bg-surface-3 py-[2px] px-[7px] rounded-[9px] font-semibold">{colCards.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-[7px_7px_4px]">
                {colCards.map((card) => (
                  <div
                    key={card.id}
                    draggable={editable}
                    className="kanban-card cursor-pointer"
                    onDragStart={() => setDragging({ cardId: card.id, colId: col.id })}
                    onClick={() => onCardClick?.(card)}
                  >
                    <div className="flex items-start gap-1.5">
                      <p className="text-text text-xs font-medium leading-[1.45] m-0 flex-1">{card.title}</p>
                      {editable && (
                        <button
                          className="card-del opacity-0 text-[#EF4444] bg-transparent border-none cursor-pointer text-sm p-0 transition-opacity leading-none shrink-0 font-body"
                          onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {(card.content_style || card.content_type) && (
                      <span className="text-[10px] text-text-3 mt-[3px] block">
                        {[card.content_style, card.content_type].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                ))}
                {editable && (
                  <button className="kanban-add-btn" onClick={() => { setShowCreateModal(col.id); resetForm(); }}>+ Add card</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Card Creation Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowCreateModal(null); resetForm(); } }}
        >
          <div
            className="bg-surface border border-border rounded-2xl w-full max-w-[540px] max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-text font-heading text-[16px] font-bold m-0">New Content</h3>
                <p className="text-text-3 text-[11px] m-0 mt-0.5">
                  Adding to <span className="text-text-2 font-semibold">{COLUMNS.find((c) => c.id === showCreateModal)?.label}</span>
                </p>
              </div>
              <button
                onClick={() => { setShowCreateModal(null); resetForm(); }}
                className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-xl leading-none font-body transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Content Name */}
              <div className="mb-4">
                <label className="tfc-label">Content Name *</label>
                <input
                  autoFocus
                  className="tfc-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Day in the life vlog, Top 5 tips..."
                  onKeyDown={(e) => { if (e.key === "Enter" && newTitle.trim()) addCard(showCreateModal!); }}
                />
              </div>

              {/* Row: Content Style, Content Type, Priority */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="tfc-label">Content Style</label>
                  <select className="tfc-input" value={newContentStyle} onChange={(e) => setNewContentStyle(e.target.value)} style={{ cursor: "pointer" }}>
                    <option value="">Select...</option>
                    {CONTENT_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="tfc-label">Content Type</label>
                  <select className="tfc-input" value={newContentType} onChange={(e) => setNewContentType(e.target.value)} style={{ cursor: "pointer" }}>
                    <option value="">Select...</option>
                    {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="tfc-label">Priority</label>
                  <select className="tfc-input" value={newPriority} onChange={(e) => setNewPriority(e.target.value)} style={{ cursor: "pointer" }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Reference URL */}
              <div className="mb-4">
                <label className="tfc-label">Reference URL</label>
                <input
                  type="url"
                  className="tfc-input"
                  value={newReferenceUrl}
                  onChange={(e) => setNewReferenceUrl(e.target.value)}
                  placeholder="https://instagram.com/reel/..."
                />
              </div>

              {/* Editor (dropdown from team members) & Shoot Location (autocomplete) */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="tfc-label">Editor</label>
                  <select
                    className="tfc-input"
                    value={newEditor}
                    onChange={(e) => setNewEditor(e.target.value)}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="">Select editor...</option>
                    {teamMembers
                      .filter((m) => m.role === "editor" || m.role === "admin" || m.role === "owner")
                      .map((m) => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))
                    }
                    {teamMembers.length === 0 && (
                      <option value="" disabled>No team members found</option>
                    )}
                  </select>
                </div>
                <div ref={locationRef} className="relative">
                  <label className="tfc-label">Shoot Location</label>
                  <input
                    className="tfc-input"
                    value={newShootLocation}
                    onChange={(e) => {
                      setNewShootLocation(e.target.value);
                      searchLocations(e.target.value);
                    }}
                    placeholder="Search address..."
                  />
                  {locationLoading && (
                    <div className="absolute right-2 top-[30px] text-text-3">
                      <span className="inline-block w-3 h-3 border-2 border-text-3/30 border-t-text-3 rounded-full animate-spin" />
                    </div>
                  )}
                  {showLocationDropdown && locationResults.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 bg-surface-2 border border-border rounded-lg overflow-hidden z-10 shadow-lg"
                      style={{ maxHeight: 220, overflowY: "auto" }}
                    >
                      {locationResults.map((loc) => (
                        <button
                          key={loc.place_id}
                          type="button"
                          className="w-full text-left px-3 py-2.5 text-xs text-text-2 hover:bg-surface-3 hover:text-text cursor-pointer border-none bg-transparent font-body transition-colors border-b border-border last:border-b-0"
                          onClick={() => {
                            setNewShootLocation(loc.display);
                            setShowLocationDropdown(false);
                            setLocationResults([]);
                          }}
                        >
                          <span className="line-clamp-2">{loc.display}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dates row */}
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div>
                  <label className="tfc-label">Shoot Date</label>
                  <input type="date" className="tfc-input" value={newShootDate} onChange={(e) => setNewShootDate(e.target.value)} style={{ colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="tfc-label">Edit Deadline</label>
                  <input type="date" className="tfc-input" value={newEditDeadline} onChange={(e) => setNewEditDeadline(e.target.value)} style={{ colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="tfc-label">Publish Date</label>
                  <input type="date" className="tfc-input" value={newPublishDate} onChange={(e) => setNewPublishDate(e.target.value)} style={{ colorScheme: "dark" }} />
                </div>
              </div>

              {/* Error */}
              {createError && (
                <p className="text-[#EF4444] text-[12px] mt-3 mb-0">{createError}</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 shrink-0">
              <button
                className="tfc-btn-ghost"
                style={{ padding: "8px 18px", fontSize: 12 }}
                onClick={() => { setShowCreateModal(null); resetForm(); }}
              >
                Cancel
              </button>
              <button
                className="tfc-btn"
                style={{ padding: "8px 18px", fontSize: 12 }}
                onClick={() => addCard(showCreateModal)}
                disabled={!newTitle.trim() || creating}
              >
                {creating ? "Creating..." : "Create Content"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
