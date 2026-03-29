"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TimeEntry {
  id: string;
  card_id: string;
  team_member_email: string;
  team_member_name: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  cardId: string;
  currentUserEmail: string;
  currentUserName: string;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function formatEntryDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TimeTracker({ cardId, currentUserEmail, currentUserName }: Props) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Find the current user's running timer on this card
  const runningEntry = entries.find(
    (e) => e.team_member_email === currentUserEmail && !e.ended_at
  );

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/time/card/${cardId}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setTotalSeconds(data.totalSeconds);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, [cardId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Tick the elapsed timer every second when there's a running entry
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (runningEntry) {
      const startedAt = new Date(runningEntry.started_at).getTime();
      const tick = () => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runningEntry?.id, runningEntry?.started_at]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch("/api/time/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });
      if (res.ok) {
        await loadEntries();
      }
    } catch {
      // silent
    }
    setStarting(false);
  };

  const handleStop = async () => {
    if (!runningEntry) return;
    setStopping(true);
    try {
      const res = await fetch("/api/time/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: runningEntry.id }),
      });
      if (res.ok) {
        await loadEntries();
      }
    } catch {
      // silent
    }
    setStopping(false);
  };

  const completedEntries = entries.filter((e) => e.ended_at);

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface-2 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className="tfc-label m-0 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Time Tracking
        </span>
        {totalSeconds > 0 && (
          <span className="text-text text-[13px] font-bold">
            {formatDuration(totalSeconds)}
          </span>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        {loading ? (
          <div className="text-text-3 text-[13px] text-center py-2">Loading...</div>
        ) : (
          <>
            {/* Timer control */}
            {runningEntry ? (
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-[20px] font-bold tracking-wider text-text"
                  style={{ fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace" }}
                >
                  {formatElapsed(elapsed)}
                </span>
                <button
                  onClick={handleStop}
                  disabled={stopping}
                  className="ml-auto text-[11px] font-semibold py-2 px-4 rounded-lg cursor-pointer transition-all border disabled:opacity-50"
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    color: "#EF4444",
                    borderColor: "rgba(239,68,68,0.3)",
                  }}
                >
                  {stopping ? "Stopping..." : "Stop"}
                </button>
              </div>
            ) : (
              <button
                onClick={handleStart}
                disabled={starting}
                className="w-full text-[11px] font-semibold py-2 px-4 rounded-lg cursor-pointer transition-all border disabled:opacity-50 mb-3"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  color: "#10B981",
                  borderColor: "rgba(16,185,129,0.3)",
                }}
              >
                {starting ? "Starting..." : "Start Timer"}
              </button>
            )}

            {/* Time log */}
            {completedEntries.length > 0 && (
              <div className="space-y-0">
                {completedEntries.slice(0, 10).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-2 py-1.5 text-[12px] border-b border-border last:border-b-0"
                  >
                    <span className="text-text-2 font-medium truncate">{e.team_member_name}</span>
                    <span className="text-text-3 shrink-0">{formatEntryDate(e.started_at)}</span>
                    <span className="text-text ml-auto font-semibold shrink-0">
                      {e.duration_seconds != null ? formatDuration(e.duration_seconds) : "--"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!runningEntry && completedEntries.length === 0 && (
              <div className="text-text-3 text-[12px] text-center py-1">No time logged yet.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
