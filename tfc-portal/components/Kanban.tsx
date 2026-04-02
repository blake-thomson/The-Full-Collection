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

interface Props {
  clientId: string;
  editable?: boolean;
  clientName?: string;
  onCardClick?: (card: Card) => void;
  autoOpenCreate?: boolean;
  onGenerateIdeas?: () => void;
}

export function Kanban({ clientId, editable = true, clientName, onCardClick, autoOpenCreate, onGenerateIdeas }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [dragging, setDragging] = useState<{ cardId: string; colId: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [touchMoveCard, setTouchMoveCard] = useState<Card | null>(null);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [showBulkMove, setShowBulkMove] = useState(false);

  const loadCards = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/kanban?client_id=${clientId}`);
    if (res.ok) {
      setCards(await res.json());
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { loadCards(); }, [loadCards]);

  // Auto-create card in "idea" column when triggered from home page
  useEffect(() => {
    if (autoOpenCreate) {
      quickCreateCard("idea");
    }
  }, [autoOpenCreate]);

  const quickCreateCard = async (colId: string) => {
    try {
      const res = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          column_id: colId,
          title: "Untitled",
        }),
      });
      if (res.ok) {
        const card = await res.json();
        setCards((prev) => [...prev, card]);
        if (onCardClick) onCardClick(card);
      }
    } catch { /* silent */ }
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
        {onGenerateIdeas && (
          <button
            onClick={onGenerateIdeas}
            className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-[12px] font-semibold cursor-pointer transition-all border border-[#8B5CF6]/25 bg-[#8B5CF6]/8 text-[#8B5CF6] hover:bg-[#8B5CF6]/15 hover:border-[#8B5CF6]/40 font-body"
            title="AI Idea Generator"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Generate Ideas
          </button>
        )}
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
        <div className="ml-auto flex items-center gap-1.5">
          {editable && selectedCards.size > 0 && (
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-red text-[11px] font-semibold">{selectedCards.size} selected</span>
              <button
                className="text-[11px] font-semibold py-1 px-2.5 rounded-md cursor-pointer font-body transition-colors bg-red/10 border border-red/20 text-red hover:bg-red/20"
                onClick={() => setShowBulkMove(true)}
              >
                Move
              </button>
              <button
                className="text-[11px] font-semibold py-1 px-2.5 rounded-md cursor-pointer font-body transition-colors bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.15)]"
                onClick={async () => {
                  const ids = [...selectedCards];
                  setCards((prev) => prev.filter((c) => !selectedCards.has(c.id)));
                  setSelectedCards(new Set());
                  await Promise.all(ids.map((id) =>
                    fetch(`/api/kanban?id=${id}`, { method: "DELETE" })
                  ));
                }}
              >
                Delete
              </button>
              <button
                className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-[11px] font-body"
                onClick={() => setSelectedCards(new Set())}
              >
                Clear
              </button>
            </div>
          )}
          <button
            className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            title="Export as CSV"
            aria-label="Export content as CSV"
            onClick={() => {
              window.open(`/api/export?client_id=${clientId}&format=csv`, "_blank");
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
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
                border: `1px solid ${isOver ? "var(--color-red)" : "#252525"}`,
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
                    onContextMenu={(e) => {
                      if (!editable) return;
                      e.preventDefault();
                      setTouchMoveCard(card);
                    }}
                  >
                    <div className="flex items-start gap-1.5">
                      {editable && (
                        <input
                          type="checkbox"
                          checked={selectedCards.has(card.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedCards((prev) => {
                              const next = new Set(prev);
                              if (next.has(card.id)) next.delete(card.id);
                              else next.add(card.id);
                              return next;
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 mt-0.5 accent-red cursor-pointer"
                          aria-label={`Select ${card.title}`}
                        />
                      )}
                      <p className="text-text text-xs font-medium leading-[1.45] m-0 flex-1">{card.title}</p>
                      {editable && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            className="sm:hidden text-text-3 bg-transparent border-none cursor-pointer text-[10px] p-0 transition-opacity leading-none font-body hover:text-red"
                            onClick={(e) => { e.stopPropagation(); setTouchMoveCard(card); }}
                            title="Move card"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/>
                              <line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
                            </svg>
                          </button>
                          <button
                            className="card-del opacity-0 text-[#EF4444] bg-transparent border-none cursor-pointer text-sm p-0 transition-opacity leading-none shrink-0 font-body"
                            onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    {(card.content_style || card.content_type) && (
                      <span className="text-[10px] text-text-3 mt-[3px] block">
                        {[card.content_style, card.content_type].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    {col.id === "ready_review" && (
                      <a
                        href={`/review/${card.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[10px] font-bold tracking-[0.04em] uppercase cursor-pointer transition-all no-underline"
                        style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.25)" }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        Review
                      </a>
                    )}
                  </div>
                ))}
                {editable && (
                  <button className="kanban-add-btn" onClick={() => quickCreateCard(col.id)}>+ Add card</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Move Modal */}
      {showBulkMove && selectedCards.size > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowBulkMove(false)}
        >
          <div
            className="w-full sm:w-[340px] bg-surface border-t sm:border border-border rounded-t-2xl sm:rounded-2xl p-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-text text-[14px] font-semibold m-0">Move {selectedCards.size} Cards</h3>
              <button onClick={() => setShowBulkMove(false)} className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-lg">&times;</button>
            </div>
            <div className="space-y-1">
              {COLUMNS.map((col) => (
                <button
                  key={col.id}
                  onClick={async () => {
                    const ids = [...selectedCards];
                    setCards((prev) => prev.map((c) => ids.includes(c.id) ? { ...c, column_id: col.id } : c));
                    setSelectedCards(new Set());
                    setShowBulkMove(false);
                    await Promise.all(ids.map((id) =>
                      fetch("/api/kanban", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, column_id: col.id }),
                      })
                    ));
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium font-body text-left border-none cursor-pointer transition-colors bg-transparent text-text hover:bg-surface-2"
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                  {col.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Move Card Modal */}
      {touchMoveCard && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setTouchMoveCard(null)}
        >
          <div
            className="w-full sm:w-[340px] bg-surface border-t sm:border border-border rounded-t-2xl sm:rounded-2xl p-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-text text-[14px] font-semibold m-0">Move Card</h3>
              <button
                onClick={() => setTouchMoveCard(null)}
                className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-lg"
              >
                &times;
              </button>
            </div>
            <p className="text-text-2 text-[12px] mb-3 truncate">{touchMoveCard.title}</p>
            <div className="space-y-1">
              {COLUMNS.map((col) => (
                <button
                  key={col.id}
                  disabled={touchMoveCard.column_id === col.id}
                  onClick={async () => {
                    if (touchMoveCard.column_id === col.id) return;
                    const cardId = touchMoveCard.id;
                    setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, column_id: col.id } : c));
                    setTouchMoveCard(null);
                    await fetch("/api/kanban", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: cardId, column_id: col.id }),
                    });
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium font-body text-left border-none cursor-pointer transition-colors ${
                    touchMoveCard.column_id === col.id
                      ? "bg-surface-3 text-text-3 cursor-not-allowed"
                      : "bg-transparent text-text hover:bg-surface-2"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                  {col.label}
                  {touchMoveCard.column_id === col.id && <span className="text-[10px] text-text-3 ml-auto">current</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Card Creation Modal */}
    </div>
  );
}
