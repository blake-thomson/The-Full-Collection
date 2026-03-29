"use client";

import { useState, useEffect, useCallback } from "react";

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string | null;
}

interface Props {
  cardId: string;
  clientId: string;
  onScheduled: () => void;
}

const PLATFORM_META: Record<
  string,
  { name: string; color: string; textColor?: string }
> = {
  instagram: { name: "Instagram", color: "#E1306C" },
  tiktok: { name: "TikTok", color: "#000000", textColor: "#FFFFFF" },
  youtube: { name: "YouTube", color: "#FF0000" },
  facebook: { name: "Facebook", color: "#1877F2" },
};

function getNextWeekday11am(): string {
  const now = new Date();
  const d = new Date(now);
  // Advance to tomorrow first
  d.setDate(d.getDate() + 1);
  // Skip weekends
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(11, 0, 0, 0);
  // Format as datetime-local value
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T11:00`;
}

export default function PublishScheduler({
  cardId,
  clientId,
  onScheduled,
}: Props) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledFor, setScheduledFor] = useState(getNextWeekday11am());
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState("");

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/social-accounts`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Try to prefill caption from the card
  useEffect(() => {
    async function fetchCard() {
      try {
        const res = await fetch(`/api/kanban?client_id=${clientId}`);
        if (res.ok) {
          const cards = await res.json();
          const card = cards.find((c: { id: string; caption?: string }) => c.id === cardId);
          if (card?.caption) setCaption(card.caption);
        }
      } catch {
        // silent
      }
    }
    fetchCard();
  }, [cardId, clientId]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) {
      setHashtags((prev) => [...prev, tag]);
    }
    setHashtagInput("");
  };

  const removeHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSchedule = async () => {
    if (!selectedPlatforms.length) {
      setError("Select at least one platform");
      return;
    }
    if (!scheduledFor) {
      setError("Pick a date and time");
      return;
    }

    setScheduling(true);
    setError("");

    try {
      const res = await fetch("/api/posts/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          clientId,
          platforms: selectedPlatforms,
          scheduledFor: new Date(scheduledFor).toISOString(),
          caption: caption || null,
          hashtags: hashtags.length ? hashtags : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to schedule");
        return;
      }

      onScheduled();
    } catch {
      setError("Network error");
    } finally {
      setScheduling(false);
    }
  };

  const connectedPlatforms = accounts.map((a) => a.platform);

  if (loading) {
    return (
      <div className="bg-surface-2 rounded-xl border border-border p-5 animate-pulse h-[200px]" />
    );
  }

  return (
    <div className="bg-surface-2 rounded-xl border border-border p-5 flex flex-col gap-4">
      <h3 className="text-text text-[15px] font-bold font-body">
        Schedule for Publishing
      </h3>

      {/* Connected accounts */}
      {accounts.length === 0 ? (
        <p className="text-text-3 text-[13px] font-body">
          No social accounts connected. Connect them in the client settings.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {accounts.map((a) => {
            const meta = PLATFORM_META[a.platform];
            return (
              <div
                key={a.id}
                className="flex items-center gap-1.5 text-[12px] font-body text-text-2 bg-surface rounded-full px-3 py-1 border border-border"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: meta?.color || "#666" }}
                />
                <span className="truncate max-w-[120px]">
                  {a.account_name || meta?.name || a.platform}
                </span>
                <span className="text-emerald-400 text-[10px] font-semibold">
                  Connected
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Platform toggles */}
      {connectedPlatforms.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-text-2 text-[12px] font-semibold font-body">
            Publish to
          </label>
          <div className="flex flex-wrap gap-2">
            {connectedPlatforms.map((platformId) => {
              const meta = PLATFORM_META[platformId];
              if (!meta) return null;
              const isSelected = selectedPlatforms.includes(platformId);
              return (
                <button
                  key={platformId}
                  onClick={() => togglePlatform(platformId)}
                  className="rounded-full px-4 py-1.5 text-[12px] font-semibold font-body border transition-all cursor-pointer"
                  style={
                    isSelected
                      ? {
                          backgroundColor: meta.color,
                          color: meta.textColor || "#FFFFFF",
                          borderColor: meta.color,
                        }
                      : {
                          backgroundColor: "transparent",
                          color: "#A8A49C",
                          borderColor: "#252525",
                        }
                  }
                >
                  {meta.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Date/time picker */}
      {connectedPlatforms.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-text-2 text-[12px] font-semibold font-body">
            Schedule for
          </label>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="tfc-input text-[13px] font-body"
          />
        </div>
      )}

      {/* Caption */}
      {connectedPlatforms.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-text-2 text-[12px] font-semibold font-body">
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="tfc-textarea text-[13px] font-body"
            style={{ minHeight: 80, resize: "vertical" }}
          />
        </div>
      )}

      {/* Hashtags */}
      {connectedPlatforms.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-text-2 text-[12px] font-semibold font-body">
            Hashtags
          </label>
          <div className="flex flex-wrap gap-1.5 mb-1">
            {hashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-surface rounded-full px-2.5 py-0.5 text-[12px] font-body text-text-2 border border-border"
              >
                #{tag}
                <button
                  onClick={() => removeHashtag(tag)}
                  className="text-text-3 hover:text-red-400 text-[10px] cursor-pointer bg-transparent border-none p-0 ml-0.5"
                >
                  x
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHashtag();
                }
              }}
              placeholder="Add hashtag..."
              className="tfc-input flex-1 text-[13px] font-body"
            />
            <button
              onClick={addHashtag}
              disabled={!hashtagInput.trim()}
              className="tfc-btn-ghost text-[12px] font-body shrink-0"
              style={{ padding: "7px 14px" }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-[12px] font-body">{error}</p>
      )}

      {/* Schedule button */}
      {connectedPlatforms.length > 0 && (
        <button
          onClick={handleSchedule}
          disabled={scheduling || !selectedPlatforms.length}
          className="tfc-btn w-full text-[13px] font-body font-semibold"
          style={{ padding: "10px 0" }}
        >
          {scheduling ? "Scheduling..." : "Schedule Post"}
        </button>
      )}
    </div>
  );
}
