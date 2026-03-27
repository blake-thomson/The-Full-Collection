"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { COLUMNS } from "@/lib/constants";
import { Kanban } from "@/components/Kanban";
import { ContentCalendar } from "@/components/ContentCalendar";

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

interface Props {
  clientId: string;
  cards: Card[];
  onCardClick?: (card: Card) => void;
  onCardsChange?: () => void;
  editable?: boolean;
  clientName?: string;
}

type ViewType = "table" | "board" | "calendar" | "timeline";
type SortField = "title" | "platform" | "column_id" | "priority" | "due_date" | "created_at";
type SortDir = "asc" | "desc";

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Twitter / X", "Facebook", "Podcast", "Blog"];
const PRIORITIES: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  medium: { label: "Medium", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  high: { label: "High", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

const VIEW_ICONS: Record<ViewType, { label: string; svg: React.ReactNode }> = {
  table: {
    label: "Table",
    svg: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
      </svg>
    ),
  },
  board: {
    label: "Board",
    svg: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="15" rx="1" />
      </svg>
    ),
  },
  calendar: {
    label: "Calendar",
    svg: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  timeline: {
    label: "Timeline",
    svg: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
};

const COL_MAP = Object.fromEntries(COLUMNS.map((c) => [c.id, { label: c.label, color: c.color }]));

export function ContentDatabase({ clientId, cards, onCardClick, onCardsChange, editable = true, clientName }: Props) {
  const [view, setView] = useState<ViewType>("table");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [editingCell, setEditingCell] = useState<{ cardId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Restore view from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tfc-db-view");
    if (saved && (saved === "table" || saved === "board" || saved === "calendar" || saved === "timeline")) {
      setView(saved as ViewType);
    }
  }, []);

  const changeView = (v: ViewType) => {
    setView(v);
    localStorage.setItem("tfc-db-view", v);
  };

  // Filtering
  const filtered = useMemo(() => {
    let result = [...cards];
    if (filterPlatform) result = result.filter((c) => c.platform === filterPlatform);
    if (filterStatus) result = result.filter((c) => c.column_id === filterStatus);
    if (filterPriority) result = result.filter((c) => c.priority === filterPriority);
    return result;
  }, [cards, filterPlatform, filterStatus, filterPriority]);

  // Sorting for table view
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const colOrder = Object.fromEntries(COLUMNS.map((c, i) => [c.id, i]));

    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = (a.title || "").localeCompare(b.title || "");
          break;
        case "platform":
          cmp = (a.platform || "").localeCompare(b.platform || "");
          break;
        case "column_id":
          cmp = (colOrder[a.column_id] ?? 99) - (colOrder[b.column_id] ?? 99);
          break;
        case "priority":
          cmp = (priorityOrder[a.priority || "low"] || 0) - (priorityOrder[b.priority || "low"] || 0);
          break;
        case "due_date":
          cmp = (a.due_date || "9999").localeCompare(b.due_date || "9999");
          break;
        case "created_at":
          cmp = (a.created_at || "").localeCompare(b.created_at || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const startEdit = (cardId: string, field: string, currentValue: string) => {
    if (!editable) return;
    setEditingCell({ cardId, field });
    setEditValue(currentValue);
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    const { cardId, field } = editingCell;
    try {
      await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cardId, [field]: editValue || null }),
      });
      onCardsChange?.();
    } catch {
      // silent
    }
    setEditingCell(null);
    setEditValue("");
  };

  const toggleGroup = (colId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [colId]: !prev[colId] }));
  };

  // Initialize all groups as expanded
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    COLUMNS.forEach((c) => { initial[c.id] = true; });
    setExpandedGroups(initial);
  }, []);

  const hasFilters = filterPlatform || filterStatus || filterPriority;

  const SortArrow = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-[10px]">
      {sortField === field ? (sortDir === "asc" ? "\u2191" : "\u2193") : ""}
    </span>
  );

  // --- Filter Bar ---
  const FilterBar = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        className="tfc-input"
        style={{ padding: "5px 10px", fontSize: 11, width: "auto", minWidth: 120 }}
        value={filterPlatform}
        onChange={(e) => setFilterPlatform(e.target.value)}
      >
        <option value="">All Platforms</option>
        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <select
        className="tfc-input"
        style={{ padding: "5px 10px", fontSize: 11, width: "auto", minWidth: 130 }}
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
      >
        <option value="">All Statuses</option>
        {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <select
        className="tfc-input"
        style={{ padding: "5px 10px", fontSize: 11, width: "auto", minWidth: 110 }}
        value={filterPriority}
        onChange={(e) => setFilterPriority(e.target.value)}
      >
        <option value="">All Priorities</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
      </select>
      {hasFilters && (
        <button
          className="text-text-3 text-[11px] bg-transparent border-none cursor-pointer font-body hover:text-text transition-colors"
          onClick={() => { setFilterPlatform(""); setFilterStatus(""); setFilterPriority(""); }}
        >
          Clear filters
        </button>
      )}
      <span className="text-text-3 text-[11px] ml-auto">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
    </div>
  );

  // --- Table View ---
  const TableView = () => {
    const columns: Array<{ field: SortField; label: string; width: string }> = [
      { field: "title", label: "Title", width: "flex-1 min-w-[200px]" },
      { field: "platform", label: "Platform", width: "w-[120px]" },
      { field: "column_id", label: "Status", width: "w-[150px]" },
      { field: "priority", label: "Priority", width: "w-[100px]" },
      { field: "due_date", label: "Due Date", width: "w-[120px]" },
      { field: "created_at", label: "Created", width: "w-[110px]" },
    ];

    return (
      <div className="overflow-x-auto overflow-y-auto flex-1">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.field}
                  className={`text-left text-text-3 text-[11px] font-bold tracking-[0.06em] uppercase py-2.5 px-3 cursor-pointer hover:text-text transition-colors select-none ${col.width}`}
                  onClick={() => handleSort(col.field)}
                >
                  {col.label}
                  <SortArrow field={col.field} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((card) => {
              const col = COL_MAP[card.column_id];
              const pri = card.priority ? PRIORITY_CONFIG[card.priority] : null;

              return (
                <tr
                  key={card.id}
                  className="border-b border-border hover:bg-surface-2 transition-colors cursor-pointer group"
                  onClick={() => onCardClick?.(card)}
                >
                  {/* Title */}
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    {editingCell?.cardId === card.id && editingCell?.field === "title" ? (
                      <input
                        autoFocus
                        className="tfc-input"
                        style={{ padding: "4px 8px", fontSize: 12 }}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingCell(null); }}
                      />
                    ) : (
                      <span
                        className="text-text text-[13px] font-medium cursor-text hover:underline"
                        onDoubleClick={() => startEdit(card.id, "title", card.title)}
                        onClick={() => onCardClick?.(card)}
                      >
                        {card.title}
                      </span>
                    )}
                  </td>

                  {/* Platform */}
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    {editingCell?.cardId === card.id && editingCell?.field === "platform" ? (
                      <select
                        autoFocus
                        className="tfc-input"
                        style={{ padding: "4px 8px", fontSize: 11 }}
                        value={editValue}
                        onChange={(e) => { setEditValue(e.target.value); }}
                        onBlur={saveEdit}
                      >
                        <option value="">None</option>
                        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      <span
                        className="text-text-2 text-[12px] cursor-text"
                        onDoubleClick={() => startEdit(card.id, "platform", card.platform || "")}
                      >
                        {card.platform || <span className="text-text-3">--</span>}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3">
                    <span
                      className="text-[10px] font-bold py-[3px] px-2 rounded-md inline-flex items-center gap-1.5"
                      style={{ background: `${col?.color || "#6B7280"}18`, color: col?.color || "#6B7280" }}
                    >
                      <span className="w-[6px] h-[6px] rounded-full" style={{ background: col?.color || "#6B7280" }} />
                      {col?.label || card.column_id}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    {editingCell?.cardId === card.id && editingCell?.field === "priority" ? (
                      <select
                        autoFocus
                        className="tfc-input"
                        style={{ padding: "4px 8px", fontSize: 11 }}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                      >
                        {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
                      </select>
                    ) : (
                      <span
                        className="text-[11px] font-semibold py-[2px] px-1.5 rounded cursor-text"
                        style={{ background: pri?.bg || "transparent", color: pri?.color || "#5A5652" }}
                        onDoubleClick={() => startEdit(card.id, "priority", card.priority || "medium")}
                      >
                        {pri?.label || "--"}
                      </span>
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="py-2.5 px-3">
                    <span className="text-text-2 text-[12px]">
                      {card.due_date
                        ? new Date(card.due_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : <span className="text-text-3">--</span>
                      }
                    </span>
                  </td>

                  {/* Created */}
                  <td className="py-2.5 px-3">
                    <span className="text-text-3 text-[11px]">
                      {card.created_at
                        ? new Date(card.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "--"
                      }
                    </span>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-text-3 text-[13px] py-16">
                  No content found{hasFilters ? " matching filters" : ""}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Board View (wraps existing Kanban) ---
  const BoardView = () => (
    <div className="flex-1 overflow-hidden">
      <Kanban clientId={clientId} editable={editable} clientName={clientName} />
    </div>
  );

  // --- Calendar View (wraps existing ContentCalendar) ---
  const CalendarView = () => (
    <div className="flex-1 overflow-hidden">
      <ContentCalendar cards={filtered as any} onCardClick={onCardClick as any} />
    </div>
  );

  // --- Timeline/List View ---
  const TimelineView = () => {
    const grouped = useMemo(() => {
      const groups: Array<{ col: typeof COLUMNS[number]; cards: Card[]; count: number }> = [];
      COLUMNS.forEach((col) => {
        const colCards = filtered.filter((c) => c.column_id === col.id);
        groups.push({ col, cards: colCards, count: colCards.length });
      });
      return groups;
    }, [filtered]);

    const totalCards = filtered.length;

    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-[800px] mx-auto space-y-3">
          {grouped.map(({ col, cards: groupCards, count }) => {
            const pct = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0;
            const isExpanded = expandedGroups[col.id] ?? true;

            return (
              <div key={col.id} className="bg-surface border border-border rounded-xl overflow-hidden">
                {/* Group Header */}
                <button
                  className="w-full px-4 py-3 flex items-center gap-3 bg-transparent border-none cursor-pointer text-left font-body transition-colors hover:bg-surface-2"
                  onClick={() => toggleGroup(col.id)}
                >
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="shrink-0 transition-transform"
                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <div className="w-[8px] h-[8px] rounded-full shrink-0" style={{ background: col.color }} />
                  <span className="text-text text-[13px] font-semibold">{col.label}</span>
                  <span className="text-text-3 text-[11px] bg-surface-3 py-[2px] px-[7px] rounded-full font-bold">{count}</span>

                  {/* Progress Bar */}
                  <div className="flex-1 flex items-center gap-2 ml-2">
                    <div className="flex-1 h-[5px] bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: col.color }}
                      />
                    </div>
                    <span className="text-text-3 text-[10px] font-bold w-[32px] text-right">{pct}%</span>
                  </div>
                </button>

                {/* Group Cards */}
                {isExpanded && groupCards.length > 0 && (
                  <div className="border-t border-border">
                    {groupCards.map((card, i) => {
                      const pri = card.priority ? PRIORITY_CONFIG[card.priority] : null;
                      return (
                        <div
                          key={card.id}
                          className="px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-surface-2 transition-colors"
                          style={{ borderBottom: i < groupCards.length - 1 ? "1px solid #252525" : "none" }}
                          onClick={() => onCardClick?.(card)}
                        >
                          <span className="text-text-3 text-[11px] w-[20px] text-right shrink-0">{i + 1}</span>
                          <span className="text-text text-[13px] font-medium flex-1 truncate">{card.title}</span>
                          {card.platform && (
                            <span className="text-text-3 text-[10px] shrink-0">{card.platform}</span>
                          )}
                          {pri && (
                            <span
                              className="text-[10px] font-semibold py-[2px] px-1.5 rounded shrink-0"
                              style={{ background: pri.bg, color: pri.color }}
                            >
                              {pri.label}
                            </span>
                          )}
                          {card.due_date && (
                            <span className="text-text-3 text-[11px] shrink-0">
                              {new Date(card.due_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {isExpanded && groupCards.length === 0 && (
                  <div className="border-t border-border px-4 py-4 text-text-3 text-[12px] text-center">
                    No items
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* View Switcher + Filter Bar */}
      <div className="px-4 sm:px-5 py-3 border-b border-border shrink-0 space-y-2.5">
        <div className="flex items-center gap-1">
          {(Object.keys(VIEW_ICONS) as ViewType[]).map((v) => {
            const cfg = VIEW_ICONS[v];
            const active = view === v;
            return (
              <button
                key={v}
                onClick={() => changeView(v)}
                className="flex items-center gap-1.5 py-[6px] px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-all border font-body"
                style={{
                  background: active ? "rgba(224,32,32,0.08)" : "transparent",
                  color: active ? "#FF3B3B" : "#5A5652",
                  borderColor: active ? "rgba(224,32,32,0.2)" : "transparent",
                }}
              >
                {cfg.svg}
                <span className="hidden sm:inline">{cfg.label}</span>
              </button>
            );
          })}
        </div>
        {(view === "table" || view === "board" || view === "timeline") && <FilterBar />}
      </div>

      {/* View Content */}
      {view === "table" && <TableView />}
      {view === "board" && <BoardView />}
      {view === "calendar" && <CalendarView />}
      {view === "timeline" && <TimelineView />}
    </div>
  );
}
