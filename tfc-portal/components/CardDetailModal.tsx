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
  content_style?: string;
  content_type?: string;
  reference_url?: string;
  unedited_url?: string;
  edited_video_url?: string;
  assigned_editor?: string;
  shoot_date?: string;
  edit_deadline?: string;
  publish_date?: string;
  shoot_location?: string;
}

interface CurrentUser {
  name: string;
  email: string;
  type: "client" | "team";
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  card: Card;
  clientId: string;
  currentUser: CurrentUser;
  teamMembers?: TeamMember[];
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

const CONTENT_STYLES = ["Education", "Lifestyle", "Entertainment", "Vlog"];

const CONTENT_TYPES = ["Short-form", "Long-form", "Post/Carousel"];

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

export function CardDetailModal({ card, clientId, currentUser, teamMembers = [], onClose, onUpdate, onDelete }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [platform, setPlatform] = useState(card.platform || "");
  const [dueDate, setDueDate] = useState(card.due_date || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(card.priority || "medium");
  const [contentStyle, setContentStyle] = useState(card.content_style || "");
  const [contentType, setContentType] = useState(card.content_type || "");
  const [referenceUrl, setReferenceUrl] = useState(card.reference_url || "");
  const [uneditedUrl, setUneditedUrl] = useState(card.unedited_url || "");
  const [editedVideoUrl, setEditedVideoUrl] = useState(card.edited_video_url || "");
  const [assignedEditor, setAssignedEditor] = useState(card.assigned_editor || "");
  const [shootDate, setShootDate] = useState(card.shoot_date || "");
  const [editDeadline, setEditDeadline] = useState(card.edit_deadline || "");
  const [publishDate, setPublishDate] = useState(card.publish_date || "");
  const [shootLocation, setShootLocation] = useState(card.shoot_location || "");
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
          content_style: contentStyle || null,
          content_type: contentType || null,
          reference_url: referenceUrl.trim() || null,
          unedited_url: uneditedUrl.trim() || null,
          edited_video_url: editedVideoUrl.trim() || null,
          assigned_editor: assignedEditor || null,
          shoot_date: shootDate || null,
          edit_deadline: editDeadline || null,
          publish_date: publishDate || null,
          shoot_location: shootLocation.trim() || null,
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
          content_style: contentStyle || undefined,
          content_type: contentType || undefined,
          reference_url: referenceUrl.trim() || undefined,
          unedited_url: uneditedUrl.trim() || undefined,
          edited_video_url: editedVideoUrl.trim() || undefined,
          assigned_editor: assignedEditor || undefined,
          shoot_date: shootDate || undefined,
          edit_deadline: editDeadline || undefined,
          publish_date: publishDate || undefined,
          shoot_location: shootLocation.trim() || undefined,
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

              {/* Production Brief — Notion-style fields */}
              <div className="space-y-1 mb-6">
                {/* Content Style */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-2 transition-colors group">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                  <select
                    className="flex-1 bg-transparent border-none text-[13px] font-body cursor-pointer outline-none appearance-none py-1"
                    style={{ color: contentStyle ? "#F0EDE6" : "#5A5652" }}
                    value={contentStyle}
                    onChange={(e) => setContentStyle(e.target.value)}
                  >
                    <option value="" style={{ color: "#5A5652" }}>Add Content Style</option>
                    {CONTENT_STYLES.map((s) => (
                      <option key={s} value={s} style={{ color: "#F0EDE6", background: "#181818" }}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Content Type */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-2 transition-colors group">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <select
                    className="flex-1 bg-transparent border-none text-[13px] font-body cursor-pointer outline-none appearance-none py-1"
                    style={{ color: contentType ? "#F0EDE6" : "#5A5652" }}
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                  >
                    <option value="" style={{ color: "#5A5652" }}>Add Content Type</option>
                    {CONTENT_TYPES.map((t) => (
                      <option key={t} value={t} style={{ color: "#F0EDE6", background: "#181818" }}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Reference URL */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-2 transition-colors group">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                  <input
                    type="url"
                    className="flex-1 bg-transparent border-none text-[13px] font-body outline-none py-1"
                    style={{ color: referenceUrl ? "#F0EDE6" : "#5A5652" }}
                    placeholder="Add Reference URL"
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                  />
                </div>

                {/* Unedited (raw footage) URL */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-2 transition-colors group">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  <input
                    type="url"
                    className="flex-1 bg-transparent border-none text-[13px] font-body outline-none py-1"
                    style={{ color: uneditedUrl ? "#F0EDE6" : "#5A5652" }}
                    placeholder="Unedited / Raw Footage URL"
                    value={uneditedUrl}
                    onChange={(e) => setUneditedUrl(e.target.value)}
                  />
                </div>

                {/* Edited Video URL */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-2 transition-colors group">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <input
                    type="url"
                    className="flex-1 bg-transparent border-none text-[13px] font-body outline-none py-1"
                    style={{ color: editedVideoUrl ? "#F0EDE6" : "#5A5652" }}
                    placeholder="Edited Video URL"
                    value={editedVideoUrl}
                    onChange={(e) => setEditedVideoUrl(e.target.value)}
                  />
                </div>

                {/* Editor */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-2 transition-colors group">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {teamMembers.length > 0 ? (
                    <select
                      className="flex-1 bg-transparent border-none text-[13px] font-body cursor-pointer outline-none appearance-none py-1"
                      style={{ color: assignedEditor ? "#F0EDE6" : "#5A5652" }}
                      value={assignedEditor}
                      onChange={(e) => setAssignedEditor(e.target.value)}
                    >
                      <option value="" style={{ color: "#5A5652" }}>Add Editor</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.name} style={{ color: "#F0EDE6", background: "#181818" }}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="flex-1 bg-transparent border-none text-[13px] font-body outline-none py-1"
                      style={{ color: assignedEditor ? "#F0EDE6" : "#5A5652" }}
                      placeholder="Add Editor"
                      value={assignedEditor}
                      onChange={(e) => setAssignedEditor(e.target.value)}
                    />
                  )}
                </div>

                {/* Shoot Date */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-2 transition-colors group">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                  </svg>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[13px] text-text-3 shrink-0" style={{ minWidth: 90 }}>Shoot Date</span>
                    <input
                      type="date"
                      className="flex-1 bg-transparent border-none text-[13px] font-body outline-none py-1"
                      style={{ colorScheme: "dark", color: shootDate ? "#F0EDE6" : "#5A5652" }}
                      value={shootDate}
                      onChange={(e) => setShootDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Edit Deadline */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-2 transition-colors group">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[13px] text-text-3 shrink-0" style={{ minWidth: 90 }}>Edit Deadline</span>
                    <input
                      type="date"
                      className="flex-1 bg-transparent border-none text-[13px] font-body outline-none py-1"
                      style={{ colorScheme: "dark", color: editDeadline ? "#F0EDE6" : "#5A5652" }}
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                    />
                  </div>
                </div>

                {/* Publish Date */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-2 transition-colors group">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[13px] text-text-3 shrink-0" style={{ minWidth: 90 }}>Publish Date</span>
                    <input
                      type="date"
                      className="flex-1 bg-transparent border-none text-[13px] font-body outline-none py-1"
                      style={{ colorScheme: "dark", color: publishDate ? "#F0EDE6" : "#5A5652" }}
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Shoot Location */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface-2 transition-colors group">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A5652" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <input
                    type="text"
                    className="flex-1 bg-transparent border-none text-[13px] font-body outline-none py-1"
                    style={{ color: shootLocation ? "#F0EDE6" : "#5A5652" }}
                    placeholder="Add Shoot Location"
                    value={shootLocation}
                    onChange={(e) => setShootLocation(e.target.value)}
                  />
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
