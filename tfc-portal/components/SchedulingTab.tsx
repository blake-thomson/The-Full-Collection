"use client";

import { useState, useEffect, useCallback } from "react";
import PublishScheduler from "@/components/PublishScheduler";
import { AICaptionGenerator } from "@/components/AICaptionGenerator";
import { COLUMNS } from "@/lib/constants";

interface Card {
  id: string;
  title: string;
  column_id: string;
  content_style?: string;
  content_type?: string;
  edited_video_url?: string;
  caption?: string;
}

interface Props {
  clientId: string;
  clientName: string;
}

const SCHEDULABLE_COLUMNS = ["approved", "scheduled"];

export function SchedulingTab({ clientId, clientName }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kanban?client_id=${clientId}`);
      if (res.ok) {
        const all = await res.json();
        setCards(all.filter((c: Card) => SCHEDULABLE_COLUMNS.includes(c.column_id)));
      }
    } catch { /* silent */ }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const approvedCards = cards.filter((c) => c.column_id === "approved");
  const scheduledCards = cards.filter((c) => c.column_id === "scheduled");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="text-text-3 text-[13px]">Loading scheduling queue...</span>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-8 max-w-[720px] mx-auto">
      <h2 className="text-text font-heading text-xl font-[800] m-0 mb-1">Scheduling</h2>
      <p className="text-text-2 text-[13px] m-0 mb-6">Schedule approved content for {clientName}</p>

      {/* Ready to Schedule */}
      <div className="mb-8">
        <h3 className="text-text-3 text-[10px] font-bold tracking-[0.1em] uppercase mb-3">
          Ready to Schedule ({approvedCards.length})
        </h3>
        {approvedCards.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-text-3 text-[13px] m-0">No approved content waiting to be scheduled.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {approvedCards.map((card) => (
              <div key={card.id} className="bg-surface border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#10B981" }} />
                      <span className="text-text text-[14px] font-semibold truncate">{card.title}</span>
                    </div>
                    {(card.content_style || card.content_type) && (
                      <span className="text-text-3 text-[11px] ml-4">
                        {[card.content_style, card.content_type].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`text-text-3 transition-transform shrink-0 ml-3 ${expandedCard === card.id ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {expandedCard === card.id && (
                  <div className="border-t border-border px-5 py-4 flex flex-col gap-4">
                    {card.edited_video_url && (
                      <div>
                        <label className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase block mb-1">Edited Video</label>
                        <a href={card.edited_video_url} target="_blank" rel="noopener noreferrer" className="text-red text-[12px] font-semibold no-underline hover:underline">
                          View video
                        </a>
                      </div>
                    )}
                    <AICaptionGenerator cardId={card.id} cardColumnId={card.column_id} />
                    <PublishScheduler
                      cardId={card.id}
                      clientId={clientId}
                      onScheduled={loadCards}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Already Scheduled */}
      <div>
        <h3 className="text-text-3 text-[10px] font-bold tracking-[0.1em] uppercase mb-3">
          Scheduled ({scheduledCards.length})
        </h3>
        {scheduledCards.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-text-3 text-[13px] m-0">No content scheduled yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {scheduledCards.map((card) => (
              <div key={card.id} className="bg-surface border border-border rounded-xl px-5 py-3.5 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#06B6D4" }} />
                <div className="flex-1 min-w-0">
                  <span className="text-text text-[13px] font-semibold truncate block">{card.title}</span>
                  {(card.content_style || card.content_type) && (
                    <span className="text-text-3 text-[11px]">
                      {[card.content_style, card.content_type].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-[0.06em] uppercase py-[3px] px-[8px] rounded-md shrink-0"
                  style={{ background: "rgba(6,182,212,0.12)", color: "#06B6D4", border: "1px solid rgba(6,182,212,0.25)" }}>
                  Scheduled
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
