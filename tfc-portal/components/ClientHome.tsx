"use client";

import { useMemo } from "react";
import { COLUMNS } from "@/lib/constants";

interface Card {
  id: string;
  title: string;
  description?: string;
  platform?: string;
  column_id: string;
  position: number;
  due_date?: string;
  priority?: "low" | "medium" | "high";
  created_at?: string;
  shoot_date?: string;
  publish_date?: string;
}

interface Props {
  clientName: string;
  cards: Card[];
  onCardClick?: (card: Card) => void;
  onMessageTeam: () => void;
}

const COL_META: Record<string, { label: string; color: string }> = Object.fromEntries(
  COLUMNS.map((c) => [c.id, { label: c.label, color: c.color }])
);

const PIPELINE_STAGES = [
  { label: "Filming", columns: ["filmed"], color: "#3B82F6" },
  { label: "Editing", columns: ["ready_to_edit", "editing", "edited_qcc"], color: "#F59E0B" },
  { label: "In Review", columns: ["ready_review"], color: "#EC4899" },
  { label: "Approved", columns: ["approved"], color: "#10B981" },
  { label: "Scheduled", columns: ["scheduled"], color: "#06B6D4" },
  { label: "Published", columns: ["published"], color: "var(--color-red)" },
];

export function ClientHome({ clientName, cards, onCardClick, onMessageTeam }: Props) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";

  /* ── Needs attention: cards waiting for client review ── */
  const reviewCards = useMemo(() =>
    cards.filter((c) => c.column_id === "ready_review"),
  [cards]);

  /* ── Pipeline counts (excluding ideas — clients don't care about that stage) ── */
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const pipeline = useMemo(() =>
    PIPELINE_STAGES.map((stage) => ({
      ...stage,
      count: stage.label === "Published"
        ? cards.filter((c) => stage.columns.includes(c.column_id) && c.created_at && new Date(c.created_at) >= startOfMonth).length
        : cards.filter((c) => stage.columns.includes(c.column_id)).length,
    })),
  [cards, startOfMonth]);

  const inProgressCount = cards.filter((c) => !["idea", "published"].includes(c.column_id)).length;

  /* ── Coming up: next shoots and publishes ── */
  const upcoming = useMemo(() => {
    const items: { card: Card; type: "publish" | "shoot"; date: string }[] = [];
    for (const card of cards) {
      if (card.column_id === "published") continue;
      if (card.publish_date && card.publish_date >= todayStr) {
        items.push({ card, type: "publish", date: card.publish_date });
      } else if (card.shoot_date && card.shoot_date >= todayStr) {
        items.push({ card, type: "shoot", date: card.shoot_date });
      } else if (card.due_date && card.due_date >= todayStr) {
        items.push({ card, type: "publish", date: card.due_date });
      }
    }
    return items
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [cards, todayStr]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-5 sm:py-8">

        {/* ── Greeting ── */}
        <div className="mb-6">
          <p className="text-text-2 text-[14px] m-0">{greeting},</p>
          <h1 className="text-text font-heading text-[24px] sm:text-[28px] font-[800] m-0 leading-tight">
            {clientName.split(" ")[0]}
          </h1>
        </div>

        {/* ── Section 1: Needs Your Attention ── */}
        <div className="mb-6">
          {reviewCards.length > 0 ? (
            <>
              <h2 className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mb-3">
                Needs Your Review
              </h2>
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                {reviewCards.map((card, i) => (
                  <button
                    key={card.id}
                    onClick={() => onCardClick?.(card)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-transparent border-none cursor-pointer text-left font-body transition-colors hover:bg-surface-2"
                    style={{ borderBottom: i < reviewCards.length - 1 ? "1px solid var(--color-border)" : "none" }}
                  >
                    <div className="w-[4px] self-stretch rounded-full shrink-0 bg-[#EC4899]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-text text-[14px] font-medium m-0 truncate">{card.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {card.platform && (
                          <span className="text-text-3 text-[11px] capitalize">{card.platform}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-red text-[12px] font-semibold shrink-0">Review →</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="text-[22px] leading-none">✓</div>
                <div>
                  <p className="text-text text-[14px] font-semibold m-0">You're all caught up</p>
                  <p className="text-text-3 text-[12px] m-0 mt-0.5">
                    {inProgressCount > 0
                      ? `Your team is working on ${inProgressCount} piece${inProgressCount !== 1 ? "s" : ""} of content`
                      : "No content in the pipeline yet"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Section 2: Your Content Pipeline ── */}
        <div className="mb-6">
          <h2 className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mb-3">Your Content</h2>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
            {pipeline.map((stage, i) => (
              <div key={stage.label} className="flex items-center">
                <div className="min-w-[56px] sm:min-w-[64px] bg-surface border border-border rounded-xl p-2.5 sm:p-3 text-center">
                  <div className="text-[20px] sm:text-[24px] font-heading font-[800] leading-none" style={{ color: stage.count > 0 ? stage.color : "var(--color-text-3)" }}>
                    {stage.count}
                  </div>
                  <div className="text-text-3 text-[8px] sm:text-[9px] font-bold tracking-[0.04em] uppercase mt-1 leading-tight">
                    {stage.label}
                  </div>
                </div>
                {i < pipeline.length - 1 && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 mx-0.5 text-text-3 hidden xs:block">
                    <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 3: Coming Up ── */}
        <div className="mb-6">
          <h2 className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mb-3">Coming Up</h2>
          {upcoming.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-text-2 text-[13px] m-0">No upcoming dates scheduled</p>
              <button
                onClick={onMessageTeam}
                className="text-red text-[12px] font-semibold bg-transparent border-none cursor-pointer p-0 mt-1.5 font-body"
              >
                Message your team about scheduling →
              </button>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              {upcoming.map((item, i) => {
                const dateObj = new Date(item.date + "T12:00:00");
                const dateLabel = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                const isThisWeek = (dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= 7;
                return (
                  <button
                    key={item.card.id + item.type}
                    onClick={() => onCardClick?.(item.card)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left font-body transition-colors hover:bg-surface-2"
                    style={{ borderBottom: i < upcoming.length - 1 ? "1px solid var(--color-border)" : "none" }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[12px]" style={{
                      background: item.type === "shoot" ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
                    }}>
                      {item.type === "shoot" ? "📷" : "📤"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text text-[13px] font-medium m-0 truncate">{item.card.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.card.platform && <span className="text-text-3 text-[11px] capitalize">{item.card.platform}</span>}
                        <span className="text-text-3 text-[10px]">·</span>
                        <span className="text-text-3 text-[10px] capitalize">{item.type}</span>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold shrink-0 ${isThisWeek ? "text-text" : "text-text-3"}`}>
                      {dateLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
