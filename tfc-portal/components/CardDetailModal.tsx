"use client";

import { useState, useEffect, useRef } from "react";

interface Comment {
  id: string;
  card_id: string;
  author_email: string;
  author_name: string;
  author_type: "client" | "team";
  content: string;
  created_at: string;
}

interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
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

const AI_QUICK_ACTIONS = [
  { id: "video_hook", label: "Generate Hooks", icon: "🎣" },
  { id: "video_script", label: "Write Script", icon: "🎬" },
  { id: "caption", label: "Write Captions", icon: "✍️" },
  { id: "content_ideas", label: "Brainstorm Ideas", icon: "💡" },
];

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
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // AI State
  const [activeTab, setActiveTab] = useState<"details" | "ai">("details");
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadComments();
  }, [card.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  useEffect(() => {
    if (activeTab === "ai" && aiInputRef.current) {
      aiInputRef.current.focus();
    }
  }, [activeTab]);

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
      const res = await fetch(`/api/kanban/comments?card_id=${card.id}`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch {
      setError("Failed to load comments.");
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
      setError("Failed to save changes.");
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
      setError("Failed to delete card.");
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch("/api/kanban/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: card.id,
          author_email: currentUser.email,
          author_name: currentUser.name,
          author_type: currentUser.type,
          content: newComment.trim(),
        }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
      }
    } catch {
      setError("Failed to add comment.");
    }
  };

  // --- AI Functions ---
  const sendAIMessage = async (message: string, contentType?: string) => {
    if (!message.trim() && !contentType) return;

    const userMsg: AIMessage = {
      role: "user",
      content: contentType
        ? `Generate ${AI_QUICK_ACTIONS.find((a) => a.id === contentType)?.label?.toLowerCase() || contentType} for this content.`
        : message.trim(),
      timestamp: new Date(),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setAiLoading(true);

    try {
      // Build the topic from card context
      const topic = [
        title && `Title: ${title}`,
        description && `Description: ${description}`,
        platform && `Platform: ${platform}`,
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          content_type: contentType || "video_hook",
          platform: platform || undefined,
          topic,
          additional_context: contentType ? undefined : message.trim(),
        }),
      });

      const data = await res.json();

      const aiMsg: AIMessage = {
        role: "assistant",
        content: res.ok ? data.content : `Sorry, I couldn't generate that. ${data.error || "Please try again."}`,
        timestamp: new Date(),
      };

      setAiMessages((prev) => [...prev, aiMsg]);
    } catch {
      setAiMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again.", timestamp: new Date() },
      ]);
    }

    setAiLoading(false);
  };

  const copyAIContent = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  const insertToDescription = (content: string) => {
    setDescription((prev) => (prev ? prev + "\n\n" + content : content));
    setActiveTab("details");
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Tabs */}
        <div className="px-6 py-3 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-all border-none ${
                activeTab === "details"
                  ? "bg-surface-3 text-text"
                  : "bg-transparent text-text-3 hover:text-text-2"
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-3 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-all border-none flex items-center gap-1.5 ${
                activeTab === "ai"
                  ? "bg-surface-3 text-text"
                  : "bg-transparent text-text-3 hover:text-text-2"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              AI Writer
              {aiMessages.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red" />
              )}
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-xl leading-none font-body transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "details" ? (
            /* ============ DETAILS TAB ============ */
            <div className="p-6">
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
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
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

              {/* Error */}
              {error && <p className="text-[#EF4444] text-[12px] mb-4">{error}</p>}

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
                    <div className="p-6 text-text-3 text-[13px] text-center">
                      No comments yet. Start the conversation.
                    </div>
                  )}
                  {!loadingComments &&
                    comments.map((c) => (
                      <div key={c.id} className="px-4 py-3 border-b border-border last:border-b-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-text text-[13px] font-semibold">{c.author_name}</span>
                          <span
                            className="text-[9px] font-bold tracking-[0.08em] uppercase py-[2px] px-[6px] rounded-[4px]"
                            style={{
                              background:
                                c.author_type === "team" ? "rgba(224,32,32,0.12)" : "rgba(168,164,156,0.12)",
                              color: c.author_type === "team" ? "#FF3B3B" : "#A8A49C",
                              border: `1px solid ${c.author_type === "team" ? "rgba(224,32,32,0.25)" : "rgba(168,164,156,0.25)"}`,
                            }}
                          >
                            {c.author_type}
                          </span>
                          <span className="text-text-3 text-[11px] ml-auto">{formatDate(c.created_at)}</span>
                        </div>
                        <p className="text-text-2 text-[13px] leading-[1.5] m-0">{c.content}</p>
                      </div>
                    ))}
                  <div ref={commentsEndRef} />
                </div>

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
          ) : (
            /* ============ AI WRITER TAB ============ */
            <div className="flex flex-col h-full" style={{ minHeight: 400 }}>
              {/* Quick Actions */}
              {aiMessages.length === 0 && (
                <div className="p-6 pb-3">
                  <div className="mb-4">
                    <p className="text-text-2 text-sm mb-1">
                      I know your brand voice. Tell me what you need for{" "}
                      <span className="text-text font-semibold">&ldquo;{title || "this content"}&rdquo;</span>.
                    </p>
                    {platform && (
                      <p className="text-text-3 text-xs">
                        Platform: <span className="text-text-2">{platform}</span>
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {AI_QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => sendAIMessage("", action.id)}
                        disabled={aiLoading}
                        className="text-left p-3 rounded-xl border border-border bg-surface-2 hover:border-border-2 hover:bg-surface-3 transition-all cursor-pointer disabled:opacity-50 group"
                      >
                        <span className="text-lg">{action.icon}</span>
                        <div className="text-sm font-semibold text-text-2 group-hover:text-text mt-1 font-heading">
                          {action.label}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border mt-4" />
                </div>
              )}

              {/* AI Messages */}
              {aiMessages.length > 0 && (
                <div className="flex-1 overflow-y-auto px-6 pt-4 space-y-4" style={{ maxHeight: 360 }}>
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-red/15 border border-red/20 text-text"
                            : "bg-surface-2 border border-border text-text"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#E02020"
                              strokeWidth="2"
                            >
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red">
                              Claude
                            </span>
                          </div>
                        )}
                        <pre className="whitespace-pre-wrap text-[13px] leading-relaxed font-body m-0">
                          {msg.content}
                        </pre>
                        {msg.role === "assistant" && (
                          <div className="flex gap-1.5 mt-3 pt-2 border-t border-border">
                            <button
                              onClick={() => copyAIContent(msg.content)}
                              className="text-[10px] font-semibold py-1 px-2.5 rounded-md cursor-pointer transition-colors bg-surface-3 border border-border text-text-3 hover:text-text hover:border-border-2"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => insertToDescription(msg.content)}
                              className="text-[10px] font-semibold py-1 px-2.5 rounded-md cursor-pointer transition-colors bg-surface-3 border border-border text-text-3 hover:text-text hover:border-border-2"
                            >
                              Insert to Description
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-surface-2 border border-border rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 border-2 border-red/30 border-t-red rounded-full animate-spin" />
                          <span className="text-text-3 text-[12px]">Claude is writing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={aiMessagesEndRef} />
                </div>
              )}

              {/* AI Input */}
              <div className="px-6 py-4 border-t border-border mt-auto">
                <div className="flex gap-2">
                  <textarea
                    ref={aiInputRef}
                    className="tfc-textarea flex-1"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder={
                      aiMessages.length === 0
                        ? "Ask Claude anything about this content..."
                        : "Continue the conversation..."
                    }
                    style={{ minHeight: 44, maxHeight: 100, resize: "none" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendAIMessage(aiInput);
                      }
                    }}
                    disabled={aiLoading}
                  />
                  <button
                    className="tfc-btn shrink-0 self-end"
                    style={{ padding: "10px 18px", fontSize: 11 }}
                    onClick={() => sendAIMessage(aiInput)}
                    disabled={!aiInput.trim() || aiLoading}
                  >
                    {aiLoading ? "..." : "Send"}
                  </button>
                </div>
                <p className="text-text-3 text-[10px] mt-2">
                  AI uses your brand profile from onboarding to match your voice.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer — only on details tab */}
        {activeTab === "details" && (
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
        )}
      </div>
    </div>
  );
}
