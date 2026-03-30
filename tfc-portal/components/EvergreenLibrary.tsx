"use client";

import { useState, useEffect, useMemo } from "react";

interface EvergreenCard {
  id: string;
  title: string;
  description?: string;
  platform?: string;
  content_type?: string;
  publish_date?: string;
  is_evergreen: boolean;
  metrics: { views: number; likes: number; shares: number };
}

interface Suggestion {
  platform: string;
  format: string;
  hook: string;
  rationale: string;
}

interface Props {
  clientId: string;
  isTeam?: boolean;
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  instagram: { bg: "rgba(225,48,108,0.15)", text: "#E1306C", label: "Instagram" },
  tiktok: { bg: "rgba(0,0,0,0.15)", text: "#ffffff", label: "TikTok" },
  youtube: { bg: "rgba(255,0,0,0.15)", text: "#FF0000", label: "YouTube" },
  linkedin: { bg: "rgba(10,102,194,0.15)", text: "#0A66C2", label: "LinkedIn" },
  twitter: { bg: "rgba(29,155,240,0.15)", text: "#1DA1F2", label: "Twitter / X" },
  facebook: { bg: "rgba(24,119,242,0.15)", text: "#1877F2", label: "Facebook" },
  podcast: { bg: "rgba(139,92,246,0.15)", text: "#8B5CF6", label: "Podcast" },
  blog: { bg: "rgba(16,185,129,0.15)", text: "#10B981", label: "Blog" },
};

const FILTER_PLATFORMS = ["all", "instagram", "tiktok", "youtube", "linkedin"] as const;

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

export function EvergreenLibrary({ clientId, isTeam }: Props) {
  const [cards, setCards] = useState<EvergreenCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [repurposeCardId, setRepurposeCardId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [repurposeLoading, setRepurposeLoading] = useState(false);
  const [repurposeError, setRepurposeError] = useState("");
  const [creatingIdx, setCreatingIdx] = useState<number | null>(null);
  const [createdIdx, setCreatedIdx] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchCards();
  }, [clientId]);

  async function fetchCards() {
    setLoading(true);
    try {
      const res = await fetch(`/api/library/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let result = cards;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(s));
    }
    if (platformFilter !== "all") {
      result = result.filter((c) => c.platform === platformFilter);
    }
    return result;
  }, [cards, search, platformFilter]);

  async function handleRepurpose(cardId: string) {
    setRepurposeCardId(cardId);
    setSuggestions([]);
    setRepurposeError("");
    setRepurposeLoading(true);
    setCreatedIdx(new Set());

    try {
      const res = await fetch("/api/library/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, clientId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRepurposeError(data.error || "Failed to generate suggestions");
        return;
      }
      setSuggestions(data.suggestions || []);
    } catch {
      setRepurposeError("Network error. Please try again.");
    } finally {
      setRepurposeLoading(false);
    }
  }

  async function handleCreateCard(suggestion: Suggestion, idx: number) {
    setCreatingIdx(idx);
    try {
      const card = cards.find((c) => c.id === repurposeCardId);
      const res = await fetch("/api/library/create-from-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title: `[Repurposed] ${card?.title || "Content"} - ${suggestion.platform}`,
          description: suggestion.rationale,
          platform: suggestion.platform,
          contentType: suggestion.format,
          hook: suggestion.hook,
        }),
      });
      if (res.ok) {
        setCreatedIdx((prev) => new Set(prev).add(idx));
      }
    } catch {
      // silent
    } finally {
      setCreatingIdx(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          <h2 className="text-lg font-semibold text-text">Evergreen Library</h2>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[rgba(16,185,129,0.15)] text-[#10B981]">
            {cards.length}
          </span>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text placeholder:text-text-3 focus:outline-none focus:border-red"
        />
        <div className="flex gap-2 flex-wrap">
          {FILTER_PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
              style={{
                background: platformFilter === p ? "rgba(224,32,32,0.15)" : "var(--surface-2, #1e1e1e)",
                color: platformFilter === p ? "var(--color-red)" : "var(--text-2, #a0a0a0)",
                border: `1px solid ${platformFilter === p ? "rgba(224,32,32,0.3)" : "var(--border, #2a2a2a)"}`,
              }}
            >
              {p === "all" ? "All Platforms" : PLATFORM_COLORS[p]?.label || p}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-3, #666)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66L8 16" />
            <path d="M15 12l-4-4 4-4" />
            <path d="M20 20c-2-2-4.5-3.5-8-4" />
          </svg>
          <p className="text-text-2 text-sm font-medium mb-1">No evergreen content yet</p>
          <p className="text-text-3 text-xs max-w-xs">
            Mark published content as evergreen to build your library.
          </p>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((card) => {
            const pc = PLATFORM_COLORS[card.platform || ""] || { bg: "rgba(107,114,128,0.15)", text: "#6B7280", label: card.platform || "Other" };
            return (
              <div
                key={card.id}
                className="bg-surface border border-border rounded-xl p-4 space-y-3 hover:border-[rgba(224,32,32,0.3)] transition-colors"
              >
                {/* Platform badge + title */}
                <div className="space-y-2">
                  <span
                    className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider"
                    style={{ background: pc.bg, color: pc.text }}
                  >
                    {pc.label}
                  </span>
                  <h3 className="text-sm font-semibold text-text leading-tight line-clamp-2">{card.title}</h3>
                  {card.publish_date && (
                    <p className="text-[11px] text-text-3">
                      Published {new Date(card.publish_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>

                {/* Metrics row */}
                <div className="flex items-center gap-4 text-xs text-text-2">
                  <div className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {formatNumber(card.metrics.views)}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {formatNumber(card.metrics.likes)}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    {formatNumber(card.metrics.shares)}
                  </div>
                </div>

                {/* Repurpose button — team only */}
                {isTeam && (
                  <button
                    onClick={() => handleRepurpose(card.id)}
                    className="w-full py-2 text-xs font-medium rounded-lg bg-surface-2 text-text-2 hover:text-text hover:bg-surface-3 transition-colors border border-border"
                  >
                    Repurpose
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Repurpose Modal */}
      {repurposeCardId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRepurposeCardId(null)}>
          <div
            className="w-full max-w-lg bg-bg border border-border rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text">Repurpose Suggestions</h3>
              <button
                onClick={() => setRepurposeCardId(null)}
                className="p-1 rounded-lg hover:bg-surface-2 text-text-3 hover:text-text transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {repurposeLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-red border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-text-3">AI is generating repurpose ideas...</p>
              </div>
            )}

            {repurposeError && (
              <p className="text-sm text-red text-center py-8">{repurposeError}</p>
            )}

            {!repurposeLoading && !repurposeError && suggestions.length > 0 && (
              <div className="space-y-3">
                {suggestions.map((s, idx) => {
                  const pc = PLATFORM_COLORS[s.platform?.toLowerCase() || ""] || { bg: "rgba(107,114,128,0.15)", text: "#6B7280", label: s.platform };
                  const isCreated = createdIdx.has(idx);
                  return (
                    <div key={idx} className="bg-surface border border-border rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider"
                          style={{ background: pc.bg, color: pc.text }}
                        >
                          {pc.label}
                        </span>
                        <span className="text-xs text-text-2">{s.format}</span>
                      </div>
                      <p className="text-sm text-text font-medium">&ldquo;{s.hook}&rdquo;</p>
                      <p className="text-xs text-text-3 leading-relaxed">{s.rationale}</p>
                      <button
                        onClick={() => handleCreateCard(s, idx)}
                        disabled={creatingIdx === idx || isCreated}
                        className="w-full py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                        style={{
                          background: isCreated ? "rgba(16,185,129,0.15)" : "rgba(224,32,32,0.12)",
                          color: isCreated ? "#10B981" : "var(--color-red)",
                          border: `1px solid ${isCreated ? "rgba(16,185,129,0.3)" : "rgba(224,32,32,0.3)"}`,
                        }}
                      >
                        {creatingIdx === idx ? "Creating..." : isCreated ? "Card Created" : "Create Card"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
