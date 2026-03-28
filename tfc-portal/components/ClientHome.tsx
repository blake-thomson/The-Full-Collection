"use client";

import { useState, useMemo } from "react";
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
}

interface Activity {
  id: string;
  type: "card_created" | "card_moved" | "comment_added" | "card_updated";
  description: string;
  timestamp: string;
}

interface Props {
  clientName: string;
  cards: Card[];
  activities?: Activity[];
  onSubmitIdea: () => void;
  onGenerateIdeas?: () => void;
  onViewCalendar: () => void;
  onMessageTeam: () => void;
  onCardClick?: (card: Card) => void;
}

const COL_MAP = Object.fromEntries(COLUMNS.map((c) => [c.id, { label: c.label, color: c.color }]));

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  medium: { label: "Medium", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  high: { label: "High", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

const ACTIVITY_ICONS: Record<string, string> = {
  card_created: "+",
  card_moved: "\u2192",
  comment_added: "\u{1F4AC}",
  card_updated: "\u270E",
};

export function ClientHome({ clientName, cards, activities = [], onSubmitIdea, onGenerateIdeas, onViewCalendar, onMessageTeam, onCardClick }: Props) {
  const today = new Date();
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  // Stats
  const stats = useMemo(() => {
    const total = cards.length;
    const inProduction = cards.filter((c) =>
      ["filmed", "editing", "edited_qcc"].includes(c.column_id)
    ).length;
    const readyForReview = cards.filter((c) => c.column_id === "ready_review").length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const published = cards.filter((c) => {
      if (c.column_id !== "published") return false;
      if (!c.created_at) return false;
      return new Date(c.created_at) >= startOfMonth;
    }).length;

    return [
      { label: "Total Content", value: total, color: "#F0EDE6" },
      { label: "In Production", value: inProduction, color: "#3B82F6" },
      { label: "Ready for Review", value: readyForReview, color: "#EC4899" },
      { label: "Published This Month", value: published, color: "#E02020" },
    ];
  }, [cards]);

  // Upcoming content (next 5 by due date)
  const upcoming = useMemo(() => {
    const todayStr = today.toISOString().split("T")[0];
    return cards
      .filter((c) => c.due_date && c.due_date >= todayStr && c.column_id !== "published")
      .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
      .slice(0, 5);
  }, [cards]);

  // Recent activities (last 10, or generate from cards if none provided)
  const recentActivities = useMemo(() => {
    if (activities.length > 0) return activities.slice(0, 10);

    // Generate pseudo-activities from cards sorted by created_at
    return cards
      .filter((c) => c.created_at)
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        type: "card_created" as const,
        description: `"${c.title}" added to ${COL_MAP[c.column_id]?.label || c.column_id}`,
        timestamp: c.created_at || "",
      }));
  }, [cards, activities]);

  const formatRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-text font-heading text-[26px] sm:text-[32px] font-[800] m-0 leading-tight">
            {greeting}, {clientName.split(" ")[0]}
          </h1>
          <p className="text-text-3 text-[14px] m-0 mt-1.5">{dateStr}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-surface border border-border rounded-xl p-4 sm:p-5"
            >
              <p className="text-text-3 text-[11px] font-bold tracking-[0.06em] uppercase m-0">{stat.label}</p>
              <p className="text-[28px] sm:text-[34px] font-heading font-[800] m-0 mt-1" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <button
            onClick={onSubmitIdea}
            className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:border-red hover:bg-[rgba(224,32,32,0.04)] text-left font-body group"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(224,32,32,0.12)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E02020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <p className="text-text text-[13px] font-semibold m-0 group-hover:text-red transition-colors">Submit Content Idea</p>
              <p className="text-text-3 text-[11px] m-0 mt-0.5">Create a new content brief</p>
            </div>
          </button>

          {onGenerateIdeas && (
            <button
              onClick={onGenerateIdeas}
              className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.04)] text-left font-body group"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.12)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div>
                <p className="text-text text-[13px] font-semibold m-0 group-hover:text-[#8B5CF6] transition-colors">Generate Ideas</p>
                <p className="text-text-3 text-[11px] m-0 mt-0.5">AI-powered content ideation</p>
              </div>
            </button>
          )}

          <button
            onClick={onViewCalendar}
            className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:border-border-2 text-left font-body group"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(59,130,246,0.12)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-text text-[13px] font-semibold m-0">View Calendar</p>
              <p className="text-text-3 text-[11px] m-0 mt-0.5">See your content schedule</p>
            </div>
          </button>

          <button
            onClick={onMessageTeam}
            className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:border-border-2 text-left font-body group"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(168,164,156,0.12)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A8A49C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-text text-[13px] font-semibold m-0">Message Team</p>
              <p className="text-text-3 text-[11px] m-0 mt-0.5">Chat with your content team</p>
            </div>
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upcoming Content */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-text font-heading text-[14px] font-bold m-0">Upcoming Content</h3>
              <span className="text-text-3 text-[11px]">{upcoming.length} upcoming</span>
            </div>
            {upcoming.length === 0 && (
              <div className="p-6 text-text-3 text-[13px] text-center">
                No upcoming content with due dates.
              </div>
            )}
            {upcoming.map((card, i) => {
              const col = COL_MAP[card.column_id];
              const pri = card.priority ? PRIORITY_CONFIG[card.priority] : null;
              const dueDate = card.due_date
                ? new Date(card.due_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "";
              const isOverdue = card.due_date && card.due_date < today.toISOString().split("T")[0];

              return (
                <div
                  key={card.id}
                  className="px-5 py-3 flex items-center gap-3 cursor-pointer hover:bg-surface-2 transition-colors"
                  style={{ borderBottom: i < upcoming.length - 1 ? "1px solid #252525" : "none" }}
                  onClick={() => onCardClick?.(card)}
                >
                  <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: col?.color || "#6B7280" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-[13px] font-medium m-0 truncate">{card.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[9px] font-bold py-[1px] px-1.5 rounded"
                        style={{ background: `${col?.color || "#6B7280"}18`, color: col?.color || "#6B7280" }}
                      >
                        {col?.label || card.column_id}
                      </span>
                      {card.platform && <span className="text-text-3 text-[10px]">{card.platform}</span>}
                    </div>
                  </div>
                  {pri && (
                    <span
                      className="text-[10px] font-semibold py-[2px] px-1.5 rounded shrink-0"
                      style={{ background: pri.bg, color: pri.color }}
                    >
                      {pri.label}
                    </span>
                  )}
                  <span
                    className="text-[11px] font-semibold shrink-0"
                    style={{ color: isOverdue ? "#EF4444" : "#A8A49C" }}
                  >
                    {dueDate}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-text font-heading text-[14px] font-bold m-0">Recent Activity</h3>
              <span className="text-text-3 text-[11px]">{recentActivities.length} recent</span>
            </div>
            {recentActivities.length === 0 && (
              <div className="p-6 text-text-3 text-[13px] text-center">
                No recent activity yet.
              </div>
            )}
            {recentActivities.map((activity, i) => (
              <div
                key={activity.id + "-" + i}
                className="px-5 py-3 flex items-start gap-3"
                style={{ borderBottom: i < recentActivities.length - 1 ? "1px solid #252525" : "none" }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[12px] mt-0.5"
                  style={{ background: "#202020", color: "#A8A49C" }}
                >
                  {activity.type === "card_created" ? "+" : activity.type === "card_moved" ? "\u2192" : activity.type === "comment_added" ? "\u2709" : "\u270E"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-2 text-[12px] m-0 leading-[1.5]">{activity.description}</p>
                  <p className="text-text-3 text-[10px] m-0 mt-0.5">{formatRelativeTime(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
