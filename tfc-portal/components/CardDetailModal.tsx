"use client";

import { useState, useEffect, useRef } from "react";

interface Comment {
  id: string;
  card_id: string;
  author_name: string;
  author_type: "client" | "team";
  message: string;
  created_at: string;
}

interface Card {
  id: string;
  title: string;
  description?: string;
  platform?: string;
  column_id: string;
  position: number;
  due_date?: string;
  priority?: "low" | "medium" | "high";
}

interface CurrentUser {
  name: string;
  email: string;
  type: "client" | "team";
}

interface Props {
  card: Card;
  clientId: string;
  currentUser: CurrentUser;
  onClose: () => void;
  onUpdate: (card: Card) => void;
  onDelete: (cardId: string) => void;
}

const PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "Twitter / X",
  "Facebook",
  "Podcast",
  "Blog",
];

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "#6B7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.25)" },
  medium: { label: "Medium", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  high: { label: "High", color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
};

export function CardDetailModal({ card, clientId, currentUser, onClose, onUpdate, onDelete }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [platform, setPlatform] = useState(card.platform || "");
  const [dueDate, setDueDate] = useState(card.due_date || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(card.priority || "medium");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadComments();
  }, [card.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/comments?card_id=${card.id}`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch {
      // Comments endpoint may not exist yet
    }
    setLoadingComments(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: card.id,
          title: title.trim(),
          description: description.trim(),
          platform: platform || null,
          due_date: dueDate || null,
          priority,
        }),
      });
      if (res.ok) {
        onUpdate({
          ...card,
          title: title.trim(),
          description: description.trim(),
          platform: platform || undefined,
          due_date: dueDate || undefined,
          priority,
        });
      }
    } catch {
      // Handle error silently
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await fetch(`/api/kanban?id=${card.id}`, { method: "DELETE" });
      onDelete(card.id);
      onClose();
    } catch {
      // Handle error silently
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: card.id,
          author_name: currentUser.name,
          author_type: currentUser.type,
          message: newComment.trim(),
        }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
      }
    } catch {
      // Handle error silently
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h3 className="text-text font-heading text-[17px] font-bold m-0">Card Details</h3>
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-xl leading-none font-body transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <div className="mb-5">
            <label className="tfc-label">Title</label>
            <input
              className="tfc-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Content title..."
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="tfc-label">Description</label>
            <textarea
              className="tfc-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              style={{ minHeight: 100 }}
            />
          </div>

          {/* Row: Platform, Due Date, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Platform */}
            <div>
              <label className="tfc-label">Platform</label>
              <select
                className="tfc-input"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="">None</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="tfc-label">Due Date</label>
              <input
                type="date"
                className="tfc-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ colorScheme: "dark" }}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="tfc-label">Priority</label>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as const).map((p) => {
                  const cfg = PRIORITY_CONFIG[p];
                  const active = priority === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className="flex-1 py-[7px] px-2 rounded-lg text-[11px] font-bold tracking-[0.04em] uppercase cursor-pointer transition-all border"
                      style={{
                        background: active ? cfg.bg : "transparent",
                        color: active ? cfg.color : "#5A5652",
                        borderColor: active ? cfg.border : "#252525",
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border my-6" />

          {/* Comments */}
          <div>
            <label className="tfc-label">Comments</label>
            <div
              className="bg-surface-2 border border-border rounded-xl overflow-hidden mb-3"
              style={{ maxHeight: 280, overflowY: "auto" }}
            >
              {loadingComments && (
                <div className="p-6 text-text-3 text-[13px] text-center">Loading comments...</div>
              )}
              {!loadingComments && comments.length === 0 && (
                <div className="p-6 text-text-3 text-[13px] text-center">No comments yet. Start the conversation.</div>
              )}
              {!loadingComments && comments.map((c) => (
                <div key={c.id} className="px-4 py-3 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-text text-[13px] font-semibold">{c.author_name}</span>
                    <span
                      className="text-[9px] font-bold tracking-[0.08em] uppercase py-[2px] px-[6px] rounded-[4px]"
                      style={{
                        background: c.author_type === "team" ? "rgba(224,32,32,0.12)" : "rgba(168,164,156,0.12)",
                        color: c.author_type === "team" ? "#FF3B3B" : "#A8A49C",
                        border: `1px solid ${c.author_type === "team" ? "rgba(224,32,32,0.25)" : "rgba(168,164,156,0.25)"}`,
                      }}
                    >
                      {c.author_type}
                    </span>
                    <span className="text-text-3 text-[11px] ml-auto">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-text-2 text-[13px] leading-[1.5] m-0">{c.message}</p>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            {/* Add Comment */}
            <div className="flex gap-2">
              <textarea
                className="tfc-textarea flex-1"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                style={{ minHeight: 44, resize: "none" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addComment();
                  }
                }}
              />
              <button
                className="tfc-btn shrink-0 self-end"
                style={{ padding: "10px 18px", fontSize: 11 }}
                onClick={addComment}
                disabled={!newComment.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <button
            onClick={handleDelete}
            className="text-[13px] font-semibold cursor-pointer border-none bg-transparent transition-colors font-body"
            style={{ color: confirmDelete ? "#EF4444" : "#5A5652" }}
          >
            {confirmDelete ? "Click again to confirm delete" : "Delete Card"}
          </button>
          <div className="flex gap-2">
            <button className="tfc-btn-ghost" style={{ padding: "9px 20px" }} onClick={onClose}>
              Cancel
            </button>
            <button
              className="tfc-btn"
              style={{ padding: "9px 20px" }}
              onClick={handleSave}
              disabled={saving || !title.trim()}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
