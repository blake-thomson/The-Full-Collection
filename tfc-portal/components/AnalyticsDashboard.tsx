"use client";

import { useMemo } from "react";
import { COLUMNS } from "@/lib/constants";

interface Card {
  id: string;
  title: string;
  platform?: string;
  column_id: string;
  due_date?: string;
  created_at?: string;
}

interface Activity {
  id: string;
  description: string;
  timestamp: string;
  type?: string;
}

interface Props {
  clientId: string;
  cards: Card[];
  activity: Activity[];
}

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#E1306C",
  TikTok: "#00F2EA",
  YouTube: "#FF0000",
  LinkedIn: "#0A66C2",
  "Twitter / X": "#1DA1F2",
  Facebook: "#1877F2",
  Podcast: "#8B5CF6",
  Blog: "#10B981",
};

export function AnalyticsDashboard({ clientId, cards, activity }: Props) {
  const stats = useMemo(() => {
    const total = cards.length;
    const published = cards.filter((c) => c.column_id === "published").length;
    const inProgress = cards.filter((c) => !["published", "idea"].includes(c.column_id)).length;

    // Avg time to publish (simple estimate based on created_at to now for published cards)
    let avgDays = 0;
    const publishedCards = cards.filter((c) => c.column_id === "published" && c.created_at);
    if (publishedCards.length > 0) {
      const totalDays = publishedCards.reduce((acc, c) => {
        const created = new Date(c.created_at!);
        const now = new Date();
        return acc + Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      avgDays = Math.round(totalDays / publishedCards.length);
    }

    return { total, published, inProgress, avgDays };
  }, [cards]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    COLUMNS.forEach((col) => {
      counts[col.id] = cards.filter((c) => c.column_id === col.id).length;
    });
    return counts;
  }, [cards]);

  const maxStatusCount = useMemo(() => {
    return Math.max(...Object.values(statusBreakdown), 1);
  }, [statusBreakdown]);

  const platformBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    cards.forEach((c) => {
      const p = c.platform || "Unassigned";
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [cards]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = 0;
    }

    cards.forEach((c) => {
      if (c.created_at) {
        const d = new Date(c.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (months[key] !== undefined) {
          months[key]++;
        }
      }
    });

    return Object.entries(months).map(([key, count]) => {
      const [y, m] = key.split("-");
      const d = new Date(Number(y), Number(m) - 1);
      return {
        label: d.toLocaleDateString("en-US", { month: "short" }),
        count,
      };
    });
  }, [cards]);

  const maxMonthly = useMemo(() => Math.max(...monthlyTrend.map((m) => m.count), 1), [monthlyTrend]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="overflow-y-auto p-5 sm:p-7">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Total Content", value: stats.total, accent: false },
          { label: "Published", value: stats.published, accent: true },
          { label: "In Progress", value: stats.inProgress, accent: false },
          { label: "Avg Days to Publish", value: stats.avgDays || "N/A", accent: false },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-[18px_20px]">
            <div className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mb-2">{s.label}</div>
            <div className={`font-heading text-[28px] sm:text-[32px] font-[800] leading-none ${s.accent ? "text-red" : "text-text"}`}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7">
        {/* Content by Status - Bar Chart */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h4 className="text-text font-heading text-[14px] font-bold m-0 mb-5">Content by Status</h4>
          <div className="space-y-2.5">
            {COLUMNS.map((col) => {
              const count = statusBreakdown[col.id] || 0;
              const pct = (count / maxStatusCount) * 100;
              return (
                <div key={col.id} className="flex items-center gap-3">
                  <span className="text-text-2 text-[11px] w-[100px] sm:w-[120px] shrink-0 truncate">{col.label}</span>
                  <div className="flex-1 h-[18px] bg-surface-3 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                        background: col.color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="text-text text-[12px] font-semibold w-6 text-right shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content by Platform */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h4 className="text-text font-heading text-[14px] font-bold m-0 mb-5">Content by Platform</h4>
          {platformBreakdown.length === 0 && (
            <div className="text-text-3 text-[13px] py-4 text-center">No content yet</div>
          )}
          <div className="space-y-3">
            {platformBreakdown.map(([platform, count]) => {
              const color = PLATFORM_COLORS[platform] || "#5A5652";
              const pct = cards.length > 0 ? Math.round((count / cards.length) * 100) : 0;
              return (
                <div key={platform} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-[100px] sm:w-[120px] shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-text-2 text-[12px] truncate">{platform}</span>
                  </div>
                  <div className="flex-1 h-[6px] bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span className="text-text text-[12px] font-semibold w-10 text-right shrink-0">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Output Trend - CSS Line Chart */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h4 className="text-text font-heading text-[14px] font-bold m-0 mb-5">Monthly Content Output</h4>
          <div className="flex items-end gap-2 h-[140px]">
            {monthlyTrend.map((m, i) => {
              const pct = (m.count / maxMonthly) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-text text-[11px] font-semibold">{m.count}</span>
                  <div className="w-full relative flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(pct, m.count > 0 ? 6 : 2)}%`,
                        background: m.count > 0 ? "#E02020" : "#202020",
                        opacity: m.count > 0 ? 0.8 : 0.4,
                      }}
                    />
                  </div>
                  <span className="text-text-3 text-[10px] font-semibold">{m.label}</span>
                </div>
              );
            })}
          </div>
          {/* Connecting line overlay */}
          <div className="relative h-0">
            <svg
              className="absolute bottom-[170px] left-0 w-full pointer-events-none"
              height="140"
              style={{ overflow: "visible" }}
            >
              <polyline
                fill="none"
                stroke="#E02020"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.4"
                points={monthlyTrend
                  .map((m, i) => {
                    const x = ((i + 0.5) / monthlyTrend.length) * 100;
                    const y = 140 - (m.count / maxMonthly) * 120 - 10;
                    return `${x}%,${y}`;
                  })
                  .join(" ")}
              />
            </svg>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h4 className="text-text font-heading text-[14px] font-bold m-0 mb-4">Recent Activity</h4>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {activity.length === 0 && (
              <div className="text-text-3 text-[13px] py-6 text-center">No recent activity</div>
            )}
            {activity.slice(0, 20).map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0">
                <div
                  className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                  style={{
                    background: a.type === "create" ? "#10B981"
                      : a.type === "move" ? "#3B82F6"
                      : a.type === "delete" ? "#EF4444"
                      : a.type === "publish" ? "#E02020"
                      : "#5A5652",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-text-2 text-[12px] leading-[1.45] m-0">{a.description}</p>
                  <span className="text-text-3 text-[10px]">{formatTime(a.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
