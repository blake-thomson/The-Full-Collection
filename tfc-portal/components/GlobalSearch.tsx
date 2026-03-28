"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { COLUMNS } from "@/lib/constants";

interface Card {
  id: string;
  title: string;
  description?: string;
  platform?: string;
  column_id: string;
  due_date?: string;
  priority?: "low" | "medium" | "high";
}

interface Message {
  id: string;
  author_name: string;
  message: string;
  created_at: string;
}

interface Resource {
  id: string;
  name: string;
  file_type: string;
  category: string;
}

interface SearchResult {
  id: string;
  type: "content" | "message" | "resource";
  title: string;
  subtitle: string;
  meta?: string;
  data: Card | Message | Resource;
}

interface Props {
  cards: Card[];
  messages?: Message[];
  resources?: Resource[];
  onSelectCard?: (card: Card) => void;
  onSelectMessage?: () => void;
  onSelectResource?: () => void;
  onClose: () => void;
}

const COL_MAP = Object.fromEntries(COLUMNS.map((c) => [c.id, { label: c.label, color: c.color }]));

const TYPE_CONFIG = {
  content: { label: "Content", color: "#E02020", bg: "rgba(224,32,32,0.12)" },
  message: { label: "Messages", color: "#A8A49C", bg: "rgba(168,164,156,0.12)" },
  resource: { label: "Resources", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
};

export function GlobalSearch({ cards, messages = [], resources = [], onSelectCard, onSelectMessage, onSelectResource, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search results
  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery) return [];

    const matches: SearchResult[] = [];

    // Search cards
    cards.forEach((card) => {
      const searchable = `${card.title} ${card.description || ""} ${card.platform || ""}`.toLowerCase();
      if (searchable.includes(debouncedQuery)) {
        const col = COL_MAP[card.column_id];
        matches.push({
          id: `card-${card.id}`,
          type: "content",
          title: card.title,
          subtitle: `${col?.label || card.column_id}${card.platform ? ` \u00B7 ${card.platform}` : ""}`,
          meta: card.priority,
          data: card,
        });
      }
    });

    // Search messages
    messages.forEach((msg) => {
      const searchable = `${msg.message} ${msg.author_name}`.toLowerCase();
      if (searchable.includes(debouncedQuery)) {
        matches.push({
          id: `msg-${msg.id}`,
          type: "message",
          title: msg.message.length > 80 ? msg.message.slice(0, 80) + "..." : msg.message,
          subtitle: `From ${msg.author_name}`,
          meta: new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          data: msg,
        });
      }
    });

    // Search resources
    resources.forEach((res) => {
      const searchable = `${res.name} ${res.category} ${res.file_type}`.toLowerCase();
      if (searchable.includes(debouncedQuery)) {
        matches.push({
          id: `res-${res.id}`,
          type: "resource",
          title: res.name,
          subtitle: `${res.category} \u00B7 ${res.file_type.toUpperCase()}`,
          data: res,
        });
      }
    });

    return matches;
  }, [debouncedQuery, cards, messages, resources]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  // Group results
  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((r) => {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    });
    return groups;
  }, [results]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => {
    const flat: SearchResult[] = [];
    ["content", "message", "resource"].forEach((type) => {
      if (grouped[type]) flat.push(...grouped[type]);
    });
    return flat;
  }, [grouped]);

  const selectResult = useCallback((result: SearchResult) => {
    switch (result.type) {
      case "content":
        onSelectCard?.(result.data as Card);
        break;
      case "message":
        onSelectMessage?.();
        break;
      case "resource":
        onSelectResource?.();
        break;
    }
    onClose();
  }, [onSelectCard, onSelectMessage, onSelectResource, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatResults[activeIndex]) {
        selectResult(flatResults[activeIndex]);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = resultsRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-[580px] overflow-hidden flex flex-col"
        style={{ maxHeight: "60vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-text text-[15px] font-body outline-none placeholder:text-text-3"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search content, messages, resources..."
            aria-label="Search"
            aria-activedescendant={flatResults[activeIndex] ? `search-result-${flatResults[activeIndex].id}` : undefined}
          />
          <kbd className="text-text-3 text-[10px] font-bold bg-surface-3 py-1 px-1.5 rounded border border-border font-body">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="flex-1 overflow-y-auto" role="listbox">
          {/* Empty state: no query */}
          {!debouncedQuery && (
            <div className="p-8 text-center">
              <p className="text-text-3 text-[13px] m-0">
                Type to search across content, messages, and resources
              </p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <kbd className="text-text-3 text-[10px] font-bold bg-surface-3 py-1 px-1.5 rounded border border-border font-body">
                  {"\u2191\u2193"}
                </kbd>
                <span className="text-text-3 text-[10px]">Navigate</span>
                <kbd className="text-text-3 text-[10px] font-bold bg-surface-3 py-1 px-1.5 rounded border border-border font-body">
                  Enter
                </kbd>
                <span className="text-text-3 text-[10px]">Select</span>
              </div>
            </div>
          )}

          {/* Empty state: no results */}
          {debouncedQuery && results.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-text-3 text-[13px] m-0">
                No results for &ldquo;{debouncedQuery}&rdquo;
              </p>
            </div>
          )}

          {/* Grouped results */}
          {(["content", "message", "resource"] as const).map((type) => {
            const items = grouped[type];
            if (!items || items.length === 0) return null;
            const cfg = TYPE_CONFIG[type];

            return (
              <div key={type}>
                {/* Group Header */}
                <div className="px-5 py-2 border-b border-border flex items-center gap-2" style={{ background: "#0D0D0D" }}>
                  <span
                    className="text-[9px] font-bold tracking-[0.08em] uppercase py-[2px] px-[6px] rounded"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-text-3 text-[10px]">{items.length} result{items.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Items */}
                {items.map((result) => {
                  const globalIndex = flatResults.indexOf(result);
                  const isActive = globalIndex === activeIndex;

                  return (
                    <div
                      key={result.id}
                      id={`search-result-${result.id}`}
                      data-index={globalIndex}
                      role="option"
                      aria-selected={isActive}
                      className="px-5 py-2.5 flex items-center gap-3 cursor-pointer transition-colors"
                      style={{ background: isActive ? "rgba(224,32,32,0.06)" : "transparent" }}
                      onClick={() => selectResult(result)}
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-text text-[13px] font-medium m-0 truncate">
                          {highlightMatch(result.title, debouncedQuery)}
                        </p>
                        <p className="text-text-3 text-[11px] m-0 mt-0.5 truncate">{result.subtitle}</p>
                      </div>
                      {result.meta && (
                        <span className="text-text-3 text-[10px] shrink-0">{result.meta}</span>
                      )}
                      {isActive && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-5 py-2.5 border-t border-border flex items-center gap-4 shrink-0" style={{ background: "#0D0D0D" }}>
            <span className="text-text-3 text-[10px]">{results.length} result{results.length !== 1 ? "s" : ""}</span>
            <div className="flex items-center gap-2 ml-auto">
              <kbd className="text-text-3 text-[10px] font-bold bg-surface-3 py-0.5 px-1 rounded border border-border font-body">{"\u2191\u2193"}</kbd>
              <span className="text-text-3 text-[10px]">Navigate</span>
              <kbd className="text-text-3 text-[10px] font-bold bg-surface-3 py-0.5 px-1 rounded border border-border font-body">Enter</kbd>
              <span className="text-text-3 text-[10px]">Open</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Highlight matching substring in text */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query);
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: "#FF3B3B", fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
