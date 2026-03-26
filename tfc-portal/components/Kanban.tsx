"use client";

import { useState, useCallback, useEffect } from "react";
import { COLUMNS } from "@/lib/constants";

interface Card {
  id: string;
  title: string;
  platform?: string;
  column_id: string;
  position: number;
}

interface Props {
  clientId: string;
  editable?: boolean;
  clientName?: string;
}

export function Kanban({ clientId, editable = true, clientName }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [dragging, setDragging] = useState<{ cardId: string; colId: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCards = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/kanban?client_id=${clientId}`);
    if (res.ok) {
      setCards(await res.json());
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const addCard = async (colId: string) => {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/kanban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, column_id: colId, title: newTitle.trim() }),
    });
    if (res.ok) {
      const card = await res.json();
      setCards((prev) => [...prev, card]);
    }
    setNewTitle("");
    setAddingTo(null);
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
                    className="kanban-card"
                    onDragStart={() => setDragging({ cardId: card.id, colId: col.id })}
                  >
                    <div className="flex items-start gap-1.5">
                      <p className="text-text text-xs font-medium leading-[1.45] m-0 flex-1">{card.title}</p>
                      {editable && (
                        <button
                          className="card-del opacity-0 text-[#EF4444] bg-transparent border-none cursor-pointer text-sm p-0 transition-opacity leading-none shrink-0 font-body"
                          onClick={() => deleteCard(card.id)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {card.platform && <span className="text-[10px] text-text-3 mt-[5px] block">{card.platform}</span>}
                  </div>
                ))}
                {editable && (
                  addingTo === col.id ? (
                    <div>
                      <textarea
                        autoFocus
                        className="tfc-textarea"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addCard(col.id); }
                          if (e.key === "Escape") { setAddingTo(null); setNewTitle(""); }
                        }}
                        placeholder="Content title..."
                        style={{ minHeight: 60, resize: "none", fontSize: 12, marginBottom: 6 }}
                      />
                      <div className="flex gap-[5px]">
                        <button className="tfc-btn" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => addCard(col.id)}>Add</button>
                        <button className="tfc-btn-ghost" style={{ padding: "5px 12px", fontSize: 11 }} onClick={() => { setAddingTo(null); setNewTitle(""); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="kanban-add-btn" onClick={() => { setAddingTo(col.id); setNewTitle(""); }}>+ Add card</button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
