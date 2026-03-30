"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { COLUMNS } from "@/lib/constants";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

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

// ── Performance Analytics Dashboard ────────────────────────────────

interface AnalyticsData {
  summary: {
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    avgEngagementRate: number;
    followerGrowth: number;
  };
  byDate: { date: string; views: number; likes: number; shares: number }[];
  byContentType: { type: string; views: number; likes: number; count: number }[];
  topPosts: {
    id: string;
    title: string;
    platform: string;
    views: number;
    likes: number;
    shares: number;
    engagementRate: number;
    postedAt: string;
  }[];
  previousPeriod: {
    totalViews: number;
    totalLikes: number;
    followerGrowth: number;
  };
}

interface PerformanceProps {
  clientId: string;
  isTeam?: boolean;
}

const PLATFORMS = ["All", "Instagram", "TikTok", "YouTube", "LinkedIn"] as const;
const RANGES = [
  { label: "Last 7 Days", value: "7" },
  { label: "Last 30 Days", value: "30" },
  { label: "Last 90 Days", value: "90" },
] as const;

const PERF_PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  tiktok: "#000000",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
};

type SortKey = "title" | "platform" | "views" | "likes" | "shares" | "engagementRate" | "postedAt";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const delta = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
  const isUp = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
        isUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
      }`}
    >
      {isUp ? "\u2191" : "\u2193"}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

export function PerformanceAnalyticsDashboard({ clientId, isTeam }: PerformanceProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string>("All");
  const [range, setRange] = useState("30");
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range });
      if (platform !== "All") params.set("platform", platform.toLowerCase());
      const res = await fetch(`/api/analytics/${clientId}?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Keep previous data or null
    } finally {
      setLoading(false);
    }
  }, [clientId, platform, range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const syncFromPlatforms = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/social/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      });
      const json = await res.json();
      if (res.ok) {
        const total = json.synced || 0;
        const details = (json.results || [])
          .filter((r: { synced: number }) => r.synced > 0)
          .map((r: { platform: string; synced: number }) => `${r.platform}: ${r.synced}`)
          .join(", ");
        setSyncResult(total > 0 ? `Synced ${total} posts (${details})` : "No new posts found to sync");
        await fetchData();
      } else {
        setSyncResult(json.error || "Sync failed");
      }
    } catch {
      setSyncResult("Sync failed — check connection");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 8000);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedPosts = useMemo(() => {
    if (!data) return [];
    return [...data.topPosts].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [data, sortKey, sortDir]);

  const isEmpty = !data || (data.byDate.length === 0 && data.topPosts.length === 0);

  // Empty state
  if (!loading && isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-5">
        <svg
          className="w-16 h-16 text-text-3 mb-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        </svg>
        <p className="text-text-2 text-[15px] font-medium mb-2">No analytics data yet</p>
        <p className="text-text-3 text-[13px] text-center max-w-sm mb-4">
          Sync your connected social accounts to pull in metrics from your existing content.
        </p>
        {isTeam && (
          <button
            onClick={syncFromPlatforms}
            disabled={syncing}
            className="tfc-btn text-[13px] font-body"
            style={{ padding: "8px 20px" }}
          >
            {syncing ? "Syncing..." : "Sync from Platforms"}
          </button>
        )}
        {syncResult && (
          <p className="text-text-3 text-[12px] mt-3">{syncResult}</p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-y-auto p-5 sm:p-7">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        {/* Platform Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                platform === p
                  ? "bg-red text-white"
                  : "bg-surface-2 text-text-2 hover:text-text"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        {/* Date Range */}
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="bg-surface-2 border border-border text-text text-[12px] rounded-lg px-3 py-1.5 ml-auto"
        >
          {RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {isTeam && (
          <button
            onClick={syncFromPlatforms}
            disabled={syncing}
            className="bg-surface-2 border border-border text-text-2 hover:text-text text-[12px] font-semibold rounded-lg px-3 py-1.5 transition-colors cursor-pointer font-body"
          >
            {syncing ? "Syncing..." : "↻ Sync"}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-red border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
            <div className="bg-surface-2 rounded-xl p-5 border border-border relative">
              <div className="absolute top-3 right-3">
                <DeltaBadge current={data.summary.totalViews} previous={data.previousPeriod.totalViews} />
              </div>
              <div className="font-heading text-[28px] sm:text-[32px] font-[800] leading-none text-text">
                {formatNumber(data.summary.totalViews)}
              </div>
              <div className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mt-2">Total Views</div>
            </div>

            <div className="bg-surface-2 rounded-xl p-5 border border-border relative">
              <div className="absolute top-3 right-3">
                <DeltaBadge current={data.summary.totalLikes} previous={data.previousPeriod.totalLikes} />
              </div>
              <div className="font-heading text-[28px] sm:text-[32px] font-[800] leading-none text-text">
                {formatNumber(data.summary.totalLikes)}
              </div>
              <div className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mt-2">Total Likes</div>
            </div>

            <div className="bg-surface-2 rounded-xl p-5 border border-border relative">
              <div className="absolute top-3 right-3">
                {/* Engagement rate delta: use views-based previous estimate */}
                <DeltaBadge
                  current={data.summary.avgEngagementRate}
                  previous={
                    data.previousPeriod.totalViews > 0
                      ? Number(((data.previousPeriod.totalLikes / data.previousPeriod.totalViews) * 100).toFixed(2))
                      : 0
                  }
                />
              </div>
              <div className="font-heading text-[28px] sm:text-[32px] font-[800] leading-none text-red">
                {data.summary.avgEngagementRate.toFixed(1)}%
              </div>
              <div className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mt-2">Avg Engagement</div>
            </div>

            <div className="bg-surface-2 rounded-xl p-5 border border-border relative">
              <div className="absolute top-3 right-3">
                <DeltaBadge current={data.summary.followerGrowth} previous={data.previousPeriod.followerGrowth} />
              </div>
              <div className="font-heading text-[28px] sm:text-[32px] font-[800] leading-none text-text">
                {data.summary.followerGrowth >= 0 ? "+" : ""}
                {formatNumber(data.summary.followerGrowth)}
              </div>
              <div className="text-text-3 text-[11px] font-bold tracking-[0.1em] uppercase mt-2">Follower Growth</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7">
            {/* Views Over Time */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h4 className="text-text font-heading text-[14px] font-bold m-0 mb-5">Views Over Time</h4>
              {data.byDate.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.byDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252525" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#5A5652", fontSize: 11 }}
                      tickFormatter={(v: string) => {
                        const d = new Date(v);
                        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }}
                    />
                    <YAxis tick={{ fill: "#5A5652", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#181818",
                        border: "1px solid #252525",
                        borderRadius: 8,
                        color: "#F0EDE6",
                        fontSize: 12,
                      }}
                      labelFormatter={(v) => new Date(String(v)).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    />
                    <Line type="monotone" dataKey="views" stroke="#E02020" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-text-3 text-[13px] py-16 text-center">No data for selected period</div>
              )}
            </div>

            {/* Engagement by Content Type */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h4 className="text-text font-heading text-[14px] font-bold m-0 mb-5">Engagement by Content Type</h4>
              {data.byContentType.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.byContentType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252525" />
                    <XAxis dataKey="type" tick={{ fill: "#5A5652", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#5A5652", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#181818",
                        border: "1px solid #252525",
                        borderRadius: 8,
                        color: "#F0EDE6",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="likes" fill="#E02020" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-text-3 text-[13px] py-16 text-center">No data for selected period</div>
              )}
            </div>
          </div>

          {/* Content Performance Table */}
          {sortedPosts.length > 0 && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="p-5 pb-0">
                <h4 className="text-text font-heading text-[14px] font-bold m-0 mb-4">Content Performance</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-border">
                      {(
                        [
                          { key: "title" as SortKey, label: "Title" },
                          { key: "platform" as SortKey, label: "Platform" },
                          { key: "postedAt" as SortKey, label: "Posted" },
                          { key: "views" as SortKey, label: "Views" },
                          { key: "likes" as SortKey, label: "Likes" },
                          { key: "shares" as SortKey, label: "Shares" },
                          { key: "engagementRate" as SortKey, label: "Eng. Rate" },
                        ] as const
                      ).map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className="text-left text-text-3 font-semibold px-5 py-3 cursor-pointer hover:text-text-2 transition-colors select-none whitespace-nowrap"
                        >
                          {col.label}
                          {sortKey === col.key && (
                            <span className="ml-1">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPosts.map((post, i) => {
                      const platformColor =
                        PERF_PLATFORM_COLORS[post.platform?.toLowerCase()] || "#5A5652";
                      return (
                        <tr
                          key={post.id}
                          className={`border-b border-border last:border-b-0 ${
                            i % 2 === 0 ? "bg-surface" : "bg-surface-2"
                          }`}
                        >
                          <td className="px-5 py-3 text-text max-w-[200px] truncate">{post.title}</td>
                          <td className="px-5 py-3">
                            <span
                              className="inline-block px-2 py-0.5 rounded-md text-white text-[10px] font-semibold capitalize"
                              style={{ background: platformColor }}
                            >
                              {post.platform}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-text-2 whitespace-nowrap">
                            {post.postedAt
                              ? new Date(post.postedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "-"}
                          </td>
                          <td className="px-5 py-3 text-text font-semibold">{formatNumber(post.views)}</td>
                          <td className="px-5 py-3 text-text">{formatNumber(post.likes)}</td>
                          <td className="px-5 py-3 text-text">{formatNumber(post.shares)}</td>
                          <td className="px-5 py-3 text-red font-semibold">{post.engagementRate.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
