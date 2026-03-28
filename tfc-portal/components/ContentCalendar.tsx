"use client";

import { useState, useMemo } from "react";
import { COLUMNS } from "@/lib/constants";

interface Card {
  id: string;
  title: string;
  platform?: string;
  column_id: string;
  due_date?: string;
  publish_date?: string;
  shoot_date?: string;
  priority?: string;
}

interface Props {
  cards: Card[];
  onCardClick?: (card: Card) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ContentCalendar({ cards, onCardClick }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const colMap = useMemo(() => {
    const m: Record<string, { label: string; color: string }> = {};
    COLUMNS.forEach((c) => { m[c.id] = { label: c.label, color: c.color }; });
    return m;
  }, []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: Array<{ date: number; month: number; year: number; isCurrentMonth: boolean }> = [];

    // Previous month padding
    const prevMonth = new Date(currentYear, currentMonth, 0);
    for (let i = startPad - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        month: currentMonth - 1,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
      days.push({ date: d, month: currentMonth, year: currentYear, isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: d,
        month: currentMonth + 1,
        year: currentMonth === 11 ? currentYear + 1 : currentYear,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  const cardsByDate = useMemo(() => {
    const map: Record<string, Card[]> = {};
    cards.forEach((card) => {
      const date = card.publish_date || card.due_date;
      if (date) {
        const dateKey = date.split("T")[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(card);
      }
    });
    return map;
  }, [cards]);

  // Shoot dates — separate map so we can color them differently
  const shootDatesByDate = useMemo(() => {
    const map: Record<string, Card[]> = {};
    cards.forEach((card) => {
      if (card.shoot_date) {
        const dateKey = card.shoot_date.split("T")[0];
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(card);
      }
    });
    return map;
  }, [cards]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(null);
  };

  const toDateKey = (d: { date: number; month: number; year: number }) => {
    const m = ((d.month % 12) + 12) % 12;
    const y = d.year;
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d.date).padStart(2, "0")}`;
  };

  const isToday = (d: { date: number; month: number; year: number }) => {
    return d.date === today.getDate() && d.month === today.getMonth() && d.year === today.getFullYear();
  };

  const selectedCards = selectedDate ? (cardsByDate[selectedDate] || []) : [];
  const selectedShootCards = selectedDate ? (shootDatesByDate[selectedDate] || []) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-text font-heading text-[17px] font-bold m-0">
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={goToToday}
            className="text-text-3 text-[11px] font-semibold bg-transparent border border-border rounded-md py-1 px-2.5 cursor-pointer font-body hover:text-text hover:border-border-2 transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="bg-surface-2 border border-border rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-text-2 hover:text-text hover:border-border-2 transition-colors"
            aria-label="Previous month"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="bg-surface-2 border border-border rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-text-2 hover:text-text hover:border-border-2 transition-colors"
            aria-label="Next month"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {DAYS.map((day) => (
              <div key={day} className="text-center py-2 text-text-3 text-[10px] font-bold tracking-[0.1em] uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(224,32,32,0.3)", borderLeft: "2px solid #E02020" }} />
              <span className="text-text-3 text-[10px] font-semibold">Publish Date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(245,158,11,0.2)", borderLeft: "2px solid #F59E0B" }} />
              <span className="text-text-3 text-[10px] font-semibold">Shoot Date</span>
            </div>
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-px" role="grid">
            {calendarDays.map((d, i) => {
              const dateKey = toDateKey(d);
              const dayCards = cardsByDate[dateKey] || [];
              const dayShootCards = shootDatesByDate[dateKey] || [];
              const totalItems = dayCards.length + dayShootCards.length;
              const isSelected = selectedDate === dateKey;
              const isTodayCell = isToday(d);

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  aria-label={`${MONTHS[((d.month % 12) + 12) % 12]} ${d.date}, ${d.year}`}
                  className="min-h-[70px] sm:min-h-[90px] p-1.5 sm:p-2 rounded-lg cursor-pointer transition-all border"
                  style={{
                    background: isSelected ? "rgba(224,32,32,0.06)" : d.isCurrentMonth ? "#111111" : "#0D0D0D",
                    borderColor: isSelected ? "#E02020" : "transparent",
                    opacity: d.isCurrentMonth ? 1 : 0.4,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[12px] font-semibold inline-flex items-center justify-center ${
                        isTodayCell ? "w-6 h-6 rounded-full bg-red text-white" : "text-text-2"
                      }`}
                    >
                      {d.date}
                    </span>
                    {totalItems > 0 && (
                      <span className="text-[9px] font-bold text-text-3 bg-surface-3 py-[1px] px-[5px] rounded-full">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {/* Shoot dates first — amber */}
                    {dayShootCards.slice(0, 2).map((card) => (
                      <div
                        key={`shoot-${card.id}`}
                        className="text-[9px] sm:text-[10px] truncate rounded px-1 py-0.5 leading-tight cursor-pointer"
                        style={{
                          background: "rgba(245,158,11,0.12)",
                          color: "#F59E0B",
                          borderLeft: "2px solid #F59E0B",
                        }}
                        onClick={(e) => { e.stopPropagation(); onCardClick?.(card); }}
                        title={`📷 Shoot: ${card.title}`}
                      >
                        📷 {card.title}
                      </div>
                    ))}
                    {/* Publish dates */}
                    {dayCards.slice(0, Math.max(0, 3 - dayShootCards.length)).map((card) => {
                      const col = colMap[card.column_id];
                      return (
                        <div
                          key={card.id}
                          className="text-[9px] sm:text-[10px] truncate rounded px-1 py-0.5 leading-tight cursor-pointer"
                          style={{
                            background: `${col?.color || "#6B7280"}18`,
                            color: col?.color || "#6B7280",
                            borderLeft: `2px solid ${col?.color || "#6B7280"}`,
                          }}
                          onClick={(e) => { e.stopPropagation(); onCardClick?.(card); }}
                        >
                          {card.title}
                        </div>
                      );
                    })}
                    {totalItems > 3 && (
                      <div className="text-[9px] text-text-3 pl-1">+{totalItems - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Detail Panel */}
        {selectedDate && (
          <div className="lg:w-[280px] border-t lg:border-t-0 lg:border-l border-border shrink-0 overflow-y-auto">
            <div className="px-4 py-3 border-b border-border">
              <h4 className="text-text font-heading text-[14px] font-bold m-0">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h4>
              <p className="text-text-3 text-[11px] m-0 mt-0.5">
                {selectedCards.length + selectedShootCards.length} item{(selectedCards.length + selectedShootCards.length) !== 1 ? "s" : ""}
              </p>
            </div>
            {selectedCards.length === 0 && selectedShootCards.length === 0 && (
              <div className="p-6 text-text-3 text-[13px] text-center">Nothing scheduled this day.</div>
            )}
            {/* Shoot dates */}
            {selectedShootCards.map((card) => (
              <div
                key={`shoot-${card.id}`}
                className="px-4 py-3 border-b border-border cursor-pointer transition-colors hover:bg-surface-2"
                onClick={() => onCardClick?.(card)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "#F59E0B" }} />
                  <span className="text-text text-[13px] font-medium">{card.title}</span>
                  <span className="text-[10px] font-bold py-[1px] px-1.5 rounded ml-auto" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>📷 Shoot</span>
                </div>
                {card.platform && (
                  <div className="pl-4">
                    <span className="text-text-3 text-[10px]">{card.platform}</span>
                  </div>
                )}
              </div>
            ))}
            {/* Publish dates */}
            {selectedCards.map((card) => {
              const col = colMap[card.column_id];
              return (
                <div
                  key={card.id}
                  className="px-4 py-3 border-b border-border cursor-pointer transition-colors hover:bg-surface-2"
                  onClick={() => onCardClick?.(card)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col?.color || "#6B7280" }} />
                    <span className="text-text text-[13px] font-medium">{card.title}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <span
                      className="text-[10px] font-semibold py-[1px] px-1.5 rounded"
                      style={{ background: `${col?.color || "#6B7280"}18`, color: col?.color || "#6B7280" }}
                    >
                      {col?.label || card.column_id}
                    </span>
                    {card.platform && (
                      <span className="text-text-3 text-[10px]">{card.platform}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
