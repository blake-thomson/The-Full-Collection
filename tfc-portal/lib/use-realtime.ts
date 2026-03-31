"use client";

import { useEffect, useRef, useMemo } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE";

const DEFAULT_EVENTS: RealtimeEvent[] = ["INSERT", "UPDATE", "DELETE"];

interface UseRealtimeOptions {
  /** Supabase table name */
  table: string;
  /** Column to filter on (e.g., "client_id") */
  filterColumn?: string;
  /** Value to match for the filter */
  filterValue?: string;
  /** Which events to listen for */
  events?: RealtimeEvent[];
  /** Callback when a change is detected */
  onChanges: () => void;
  /** Whether to enable the subscription */
  enabled?: boolean;
}

/**
 * Hook that subscribes to Supabase Realtime changes on a table
 * and calls onChanges when data is modified.
 *
 * This triggers a refetch rather than trying to merge payloads,
 * which is simpler and works reliably with RLS.
 */
export function useRealtime({
  table,
  filterColumn,
  filterValue,
  events = DEFAULT_EVENTS,
  onChanges,
  enabled = true,
}: UseRealtimeOptions) {
  const callbackRef = useRef(onChanges);
  callbackRef.current = onChanges;

  // Stabilize events so the effect doesn't re-run on every render
  const eventsKey = useMemo(() => events.join(","), [events]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createBrowserSupabase();
    const channelName = `realtime:${table}:${filterColumn || "all"}:${filterValue || "all"}`;

    let filter: string | undefined;
    if (filterColumn && filterValue) {
      filter = `${filterColumn}=eq.${filterValue}`;
    }

    const channel = supabase.channel(channelName);

    for (const event of events) {
      const opts: { event: RealtimeEvent; schema: string; table: string; filter?: string } = {
        event,
        schema: "public",
        table,
      };
      if (filter) opts.filter = filter;
      channel.on("postgres_changes" as "system", opts as unknown as { event: string }, () => {
        callbackRef.current();
      });
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filterColumn, filterValue, enabled, eventsKey]);
}

/**
 * Subscribe to realtime notifications for a specific user.
 */
export function useRealtimeNotifications(email: string, onNewNotification: () => void) {
  useRealtime({
    table: "notifications",
    filterColumn: "recipient_email",
    filterValue: email,
    events: ["INSERT"],
    onChanges: onNewNotification,
    enabled: !!email,
  });
}

/**
 * Subscribe to realtime kanban card changes for a specific client.
 */
export function useRealtimeKanban(clientId: string, onCardChange: () => void) {
  useRealtime({
    table: "kanban_cards",
    filterColumn: "client_id",
    filterValue: clientId,
    onChanges: onCardChange,
    enabled: !!clientId,
  });
}

/**
 * Subscribe to realtime message changes for a specific client.
 */
export function useRealtimeMessages(clientId: string, onMessageChange: () => void) {
  useRealtime({
    table: "messages",
    filterColumn: "client_id",
    filterValue: clientId,
    events: ["INSERT"],
    onChanges: onMessageChange,
    enabled: !!clientId,
  });
}
