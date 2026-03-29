"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

interface Props {
  userEmail: string;
  userType: "client" | "team";
}

export function NotificationBell({ userEmail, userType }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?email=${encodeURIComponent(userEmail)}&type=${userType}`);
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error("Failed to load notifications.");
    }
    setLoading(false);
  }, [userEmail, userType]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Calculate fixed dropdown position from button bounding rect
  useLayoutEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth < 640;
      if (isMobile) {
        // Center on mobile — full width with 8px margin each side
        setDropdownPos({ top: rect.bottom + 8, right: 8 });
      } else {
        const right = Math.max(8, viewportWidth - rect.right - 2);
        setDropdownPos({ top: rect.bottom + 8, right });
      }
    }
  }, [open]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read.");
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read.");
    }
  };

  const handleNotificationClick = (n: Notification) => {
    markOneRead(n.id);
    if (n.link) {
      window.location.href = n.link;
    }
  };

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
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative bg-transparent border-none cursor-pointer p-1.5 rounded-lg transition-colors"
        style={{ color: open ? "#F0EDE6" : "#A8A49C" }}
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: "#E02020", padding: "0 4px" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel — always fixed so it's never clipped by sidebar overflow */}
      {open && dropdownPos && (
        <div
          ref={panelRef}
          className="fixed sm:w-[380px] bg-surface border border-border rounded-xl overflow-hidden z-[9999]"
          style={{
            top: dropdownPos.top,
            right: dropdownPos.right,
            left: window.innerWidth < 640 ? 8 : "auto",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h4 className="text-text font-heading text-[14px] font-bold m-0">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-text-3 bg-transparent border-none cursor-pointer text-[11px] font-semibold font-body hover:text-text transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {loading && notifications.length === 0 && (
              <div className="p-6 text-text-3 text-[13px] text-center">Loading...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="p-8 text-text-3 text-[13px] text-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-40">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                No notifications yet
              </div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className="px-4 py-3 border-b border-border cursor-pointer transition-colors"
                style={{
                  background: n.read ? "transparent" : "rgba(224,32,32,0.03)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#181818"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = n.read ? "transparent" : "rgba(224,32,32,0.03)"; }}
              >
                <div className="flex items-start gap-3">
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-red shrink-0 mt-1.5" />
                  )}
                  <div className={`flex-1 ${n.read ? "pl-5" : ""}`}>
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-[13px] font-semibold ${n.read ? "text-text-2" : "text-text"}`}>
                        {n.title}
                      </span>
                      <span className="text-text-3 text-[10px] shrink-0">{formatTime(n.created_at)}</span>
                    </div>
                    <p className={`text-[12px] leading-[1.45] m-0 ${n.read ? "text-text-3" : "text-text-2"}`}>
                      {n.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
