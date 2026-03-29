"use client";

import { useState, useCallback } from "react";

interface TopFormat {
  format: string;
  avgViews: number;
  recommendation: string;
}

interface PostingTime {
  day: string;
  time: string;
  platform: string;
}

interface ActionItem {
  priority: "high" | "medium" | "low";
  action: string;
  rationale: string;
}

interface InsightsData {
  hasEnoughData: boolean;
  topFormat?: TopFormat;
  bestPostingTimes?: PostingTime[];
  underperforming?: { format: string; recommendation: string };
  actionItems?: ActionItem[];
}

interface Props {
  clientId: string;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-[#E02020]/20", text: "text-[#E02020]", label: "High" },
  medium: { bg: "bg-[#F59E0B]/20", text: "text-[#F59E0B]", label: "Medium" },
  low: { bg: "bg-[#10B981]/20", text: "text-[#10B981]", label: "Low" },
};

export function AIInsights({ clientId }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InsightsData | null>(null);
  const [creatingCard, setCreatingCard] = useState<number | null>(null);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        const result: InsightsData = await res.json();
        setData(result);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const handleCreateCard = async (item: ActionItem, index: number) => {
    setCreatingCard(index);
    try {
      await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          column_id: "idea",
          title: item.action,
          description: item.rationale,
          priority: item.priority,
        }),
      });
    } catch {
      // ignore
    } finally {
      setCreatingCard(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-text">AI Insights</h2>
          <svg className="w-5 h-5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.09 6.26L20.18 9.27l-5.09 3.9L16.18 20 12 16.77 7.82 20l1.09-6.83L3.82 9.27l6.09-1.01L12 2z" />
          </svg>
        </div>
        {!loading && (
          <button
            onClick={handleGenerate}
            className="px-3 py-1.5 text-sm bg-[#E02020] text-white rounded-lg hover:bg-[#c41a1a] transition-colors"
          >
            {data ? "Refresh Insights" : "Generate Insights"}
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface-2 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Not enough data */}
      {data && !data.hasEnoughData && (
        <div className="bg-surface rounded-lg border border-border p-6 text-center">
          <p className="text-text-3 text-sm">
            Need at least 10 published posts with metrics to generate insights.
          </p>
        </div>
      )}

      {/* Results */}
      {data && data.hasEnoughData && (
        <div className="space-y-3">
          {/* Top Format */}
          {data.topFormat && (
            <div className="bg-surface rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981]">
                  Top Format
                </span>
              </div>
              <p className="text-text font-medium">{data.topFormat.format}</p>
              <p className="text-sm text-text-2 mt-1">
                Avg views: {data.topFormat.avgViews.toLocaleString()}
              </p>
              <p className="text-sm text-text-3 mt-1">{data.topFormat.recommendation}</p>
            </div>
          )}

          {/* Best Posting Times */}
          {data.bestPostingTimes && data.bestPostingTimes.length > 0 && (
            <div className="bg-surface rounded-lg border border-border p-4">
              <p className="text-xs text-text-3 mb-2">Best Posting Times</p>
              <div className="space-y-1.5">
                {data.bestPostingTimes.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-text font-medium w-24">{t.day}</span>
                    <span className="text-text-2">{t.time}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#3B82F6]/20 text-[#3B82F6]">
                      {t.platform}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Underperforming */}
          {data.underperforming && (
            <div className="bg-surface rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B]">
                  Underperforming
                </span>
              </div>
              <p className="text-text font-medium">{data.underperforming.format}</p>
              <p className="text-sm text-text-3 mt-1">{data.underperforming.recommendation}</p>
            </div>
          )}

          {/* Action Items */}
          {data.actionItems && data.actionItems.length > 0 && (
            <div className="bg-surface rounded-lg border border-border p-4">
              <p className="text-xs text-text-3 mb-3">Action Items</p>
              <div className="space-y-3">
                {data.actionItems.map((item, i) => {
                  const style = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.low;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${style.bg} ${style.text}`}
                      >
                        {style.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text">{item.action}</p>
                        <p className="text-xs text-text-3 mt-0.5">{item.rationale}</p>
                      </div>
                      <button
                        onClick={() => handleCreateCard(item, i)}
                        disabled={creatingCard === i}
                        className="shrink-0 px-2 py-1 text-xs bg-surface-2 border border-border rounded text-text-2 hover:text-text hover:border-[#E02020] transition-colors disabled:opacity-50"
                      >
                        {creatingCard === i ? "..." : "Create Card"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !data && (
        <div className="bg-surface rounded-lg border border-border p-6 text-center">
          <p className="text-text-3 text-sm">
            Click &quot;Generate Insights&quot; to analyze your content performance with AI.
          </p>
        </div>
      )}
    </div>
  );
}
