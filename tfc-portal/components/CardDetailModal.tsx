"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { COLUMNS } from "@/lib/constants";
import { openGooglePicker, type PickerResult } from "@/lib/google-picker";
import PublishScheduler from "@/components/PublishScheduler";
import TimeTracker from "@/components/TimeTracker";

interface Attachment {
  id: string;
  card_id: string;
  drive_file_id: string;
  drive_file_name: string;
  drive_mime_type: string | null;
  drive_view_link: string | null;
  drive_thumbnail_link: string | null;
  drive_web_content_link: string | null;
  drive_modified_time: string | null;
  file_size: number | null;
  label: string | null;
  is_final: boolean;
  linked_by: string;
  linked_by_name: string;
  linked_by_type: string;
  version_notes: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  card_id: string;
  author_email: string;
  author_name: string;
  author_type: "client" | "team";
  content: string;
  created_at: string;
}

interface Card {
  id: string;
  title: string;
  description?: string;
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
  revision_notes?: string;
  is_evergreen?: boolean;
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

const CONTENT_STYLES = ["Education", "Lifestyle", "Entertainment", "Vlog"];
const CONTENT_TYPES = ["Short-form", "Long-form", "Post/Carousel"];

function getVideoEmbed(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    // Direct video files
    if (/\.(mp4|mov|webm|m4v)$/i.test(u.pathname)) return url;
  } catch {}
  return null;
}

function VideoPreview({ url, label }: { url: string; label: string }) {
  const embed = getVideoEmbed(url);
  if (!embed) return null;
  const isDirect = /\.(mp4|mov|webm|m4v)$/i.test(embed);
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-border bg-surface-2">
      <div className="px-3 py-1.5 border-b border-border flex items-center gap-1.5">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
          <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
        <span className="text-text-3 text-[10px] font-semibold">{label}</span>
      </div>
      {isDirect
        ? <video src={embed} controls className="w-full max-h-[280px] bg-black" />
        : <iframe src={embed} className="w-full aspect-video" allowFullScreen frameBorder="0" allow="autoplay; encrypted-media" />
      }
    </div>
  );
}

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "#6B7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.25)" },
  medium: { label: "Medium", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  high: { label: "High", color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
};

function getMimeIcon(mimeType: string | null): string {
  if (!mimeType) return "\uD83D\uDCC4";
  if (mimeType.startsWith("video/")) return "\uD83C\uDFA5";
  if (mimeType.startsWith("image/")) return "\uD83D\uDDBC\uFE0F";
  if (mimeType.startsWith("audio/")) return "\uD83C\uDFB5";
  if (mimeType.includes("pdf")) return "\uD83D\uDCC4";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "\uD83D\uDCCA";
  if (mimeType.includes("document") || mimeType.includes("word")) return "\uD83D\uDCC3";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "\uD83D\uDCFD\uFE0F";
  return "\uD83D\uDCC4";
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function CardDetailModal({ card, clientId, currentUser, onClose, onUpdate, onDelete }: Props) {
  const [title, setTitle] = useState(card.title);
  const [status, setStatus] = useState(card.column_id);
  const [description, setDescription] = useState(card.description || "");
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
  const [revisionNotes, setRevisionNotes] = useState(card.revision_notes || "");
  const [isEvergreen, setIsEvergreen] = useState(card.is_evergreen ?? false);
  const [sendingToRevisions, setSendingToRevisions] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [attachmentsOpen, setAttachmentsOpen] = useState(true);
  const [attachingFile, setAttachingFile] = useState(false);
  const [attachError, setAttachError] = useState("");
  const [confirmUnlink, setConfirmUnlink] = useState<string | null>(null);

  // Inline AI state
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const aiPromptRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const backdropRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadComments(); loadAttachments(); }, [card.id]);
  useEffect(() => { commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comments]);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !showAIPrompt) onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, showAIPrompt]);
  useEffect(() => {
    if (showAIPrompt && aiPromptRef.current) aiPromptRef.current.focus();
  }, [showAIPrompt]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/kanban/comments?card_id=${card.id}`);
      if (res.ok) setComments(await res.json());
    } catch { setError("Failed to load comments."); }
    setLoadingComments(false);
  };

  const loadAttachments = async () => {
    setLoadingAttachments(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/attachments`);
      if (res.ok) setAttachments(await res.json());
    } catch { setAttachError("Failed to load attachments."); }
    setLoadingAttachments(false);
  };

  const handleAttachFromDrive = async () => {
    setAttachError("");
    setAttachingFile(true);
    try {
      // Get valid token
      const tokenRes = await fetch("/api/auth/google-token");
      const tokenData = await tokenRes.json();
      if (tokenData.error === "not_connected") {
        setAttachError("Connect Google Drive first.");
        setAttachingFile(false);
        return;
      }
      if (!tokenData.accessToken) {
        setAttachError("Could not get Drive access token.");
        setAttachingFile(false);
        return;
      }

      // Open picker
      const picked: PickerResult | null = await openGooglePicker(tokenData.accessToken);
      if (!picked) { setAttachingFile(false); return; }

      // POST to attachments
      const res = await fetch(`/api/cards/${card.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveFileId: picked.id,
          driveFileName: picked.name,
          driveMimeType: picked.mimeType,
          driveViewLink: picked.url,
          driveThumbnailLink: picked.thumbnailLink,
          driveWebContentLink: picked.webContentLink,
          driveModifiedTime: picked.modifiedTime,
          fileSize: picked.size,
        }),
      });
      if (res.ok) {
        await loadAttachments();
      } else {
        setAttachError("Failed to save attachment.");
      }
    } catch {
      setAttachError("Failed to attach file.");
    }
    setAttachingFile(false);
  };

  const updateAttachment = async (attachmentId: string, updates: { label?: string; isFinal?: boolean; notes?: string }) => {
    try {
      const res = await fetch(`/api/cards/${card.id}/attachments/${attachmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setAttachments((prev) => prev.map((a) => (a.id === attachmentId ? updated : a)));
      }
    } catch { setAttachError("Failed to update attachment."); }
  };

  const unlinkAttachment = async (attachmentId: string) => {
    try {
      const res = await fetch(`/api/cards/${card.id}/attachments/${attachmentId}`, { method: "DELETE" });
      if (res.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        setConfirmUnlink(null);
      }
    } catch { setAttachError("Failed to unlink attachment."); }
  };

  // Handle space on empty description to trigger AI
  const handleDescriptionKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === " " && description.trim() === "" && !showAIPrompt) {
      e.preventDefault();
      setShowAIPrompt(true);
      setAiResult("");
      setAiPrompt("");
    }
  }, [description, showAIPrompt]);

  // AI generation
  const generateAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult("");
    try {
      const topic = [title && `Title: ${title}`, contentStyle && `Style: ${contentStyle}`].filter(Boolean).join("\n");
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          content_type: "video_script",
          topic,
          additional_context: aiPrompt.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiResult(data.content);
      } else {
        setAiResult("Failed to generate. Please try again.");
      }
    } catch {
      setAiResult("Network error. Please try again.");
    }
    setAiLoading(false);
  };

  const acceptAI = () => {
    setDescription((prev) => (prev ? prev + "\n\n" + aiResult : aiResult));
    setShowAIPrompt(false);
    setAiResult("");
    setAiPrompt("");
  };

  const dismissAI = () => {
    setShowAIPrompt(false);
    setAiResult("");
    setAiPrompt("");
    setTimeout(() => descRef.current?.focus(), 50);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: card.id, column_id: status, title: title.trim(), description: description.trim(),
          due_date: dueDate || null, priority,
          content_style: contentStyle || null, content_type: contentType || null,
          reference_url: referenceUrl.trim() || null, unedited_url: uneditedUrl.trim() || null,
          edited_video_url: editedVideoUrl.trim() || null, assigned_editor: assignedEditor || null,
          shoot_date: shootDate || null, edit_deadline: editDeadline || null,
          publish_date: publishDate || null, shoot_location: shootLocation.trim() || null,
          revision_notes: revisionNotes.trim() || null,
          is_evergreen: isEvergreen,
        }),
      });
      if (res.ok) {
        onUpdate({ ...card, column_id: status, title: title.trim(), description: description.trim(),
          due_date: dueDate || undefined, priority,
          content_style: contentStyle || undefined, content_type: contentType || undefined,
          reference_url: referenceUrl.trim() || undefined, unedited_url: uneditedUrl.trim() || undefined,
          edited_video_url: editedVideoUrl.trim() || undefined, assigned_editor: assignedEditor || undefined,
          shoot_date: shootDate || undefined, edit_deadline: editDeadline || undefined,
          publish_date: publishDate || undefined, shoot_location: shootLocation.trim() || undefined,
          revision_notes: revisionNotes.trim() || undefined,
          is_evergreen: isEvergreen,
        });
      }
    } catch { setError("Failed to save changes."); }
    setSaving(false);
  };

  const sendToRevisions = async () => {
    if (!revisionNotes.trim()) return;
    setSendingToRevisions(true);
    try {
      const res = await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: card.id,
          column_id: "revise",
          revision_notes: revisionNotes.trim(),
        }),
      });
      if (res.ok) {
        onUpdate({ ...card, column_id: "revise", revision_notes: revisionNotes.trim() });
        onClose();
      }
    } catch { setError("Failed to send to revisions."); }
    setSendingToRevisions(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try { await fetch(`/api/kanban?id=${card.id}`, { method: "DELETE" }); onDelete(card.id); onClose(); }
    catch { setError("Failed to delete card."); }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch("/api/kanban/comments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: card.id, author_email: currentUser.email, author_name: currentUser.name, author_type: currentUser.type, content: newComment.trim() }),
      });
      if (res.ok) { const comment = await res.json(); setComments((prev) => [...prev, comment]); setNewComment(""); }
    } catch { setError("Failed to add comment."); }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div ref={backdropRef} className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}>
      <div className="bg-surface border border-border rounded-2xl w-full max-w-[680px] max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog" aria-modal="true"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h3 className="text-text font-heading text-[17px] font-bold m-0">Card Details</h3>
          <button onClick={onClose} aria-label="Close" className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-xl leading-none font-body transition-colors">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <div className="mb-5">
            <label className="tfc-label">Title</label>
            <input className="tfc-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Content title..." />
          </div>

          {/* Status */}
          <div className="mb-5">
            <label className="tfc-label">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {COLUMNS.map((col) => {
                const active = status === col.id;
                return (
                  <button key={col.id} onClick={() => setStatus(col.id)}
                    className="py-1.5 px-3 rounded-lg text-[11px] font-semibold cursor-pointer transition-all border"
                    style={{
                      background: active ? `${col.color}18` : "transparent",
                      color: active ? col.color : "#5A5652",
                      borderColor: active ? `${col.color}40` : "#252525",
                    }}>
                    <span className="inline-block w-[6px] h-[6px] rounded-full mr-1.5" style={{ background: col.color }} />
                    {col.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review Content CTA for ready_review cards */}
          {(card.column_id === "ready_review" || status === "ready_review") && (
            <div className="mb-5">
              <a
                href={`/review/${card.id}`}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold no-underline transition-all"
                style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Review Content
              </a>
            </div>
          )}

          {/* Description with inline AI */}
          <div className="mb-5">
            <label className="tfc-label flex items-center gap-2">
              Description
              <span className="text-text-3 text-[10px] font-normal">(press space when empty to use AI)</span>
            </label>

            {!showAIPrompt ? (
              <textarea
                ref={descRef}
                className="tfc-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleDescriptionKeyDown}
                placeholder="Press space to write with AI, or type your description..."
                style={{ minHeight: 100 }}
              />
            ) : (
              <div className="rounded-xl border border-red/30 bg-red/5 overflow-hidden">
                {/* AI Prompt Bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-red/20">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E02020" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <input
                    ref={aiPromptRef}
                    className="flex-1 bg-transparent border-none text-text text-sm outline-none placeholder:text-text-3 font-body"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); generateAI(); }
                      if (e.key === "Escape") dismissAI();
                    }}
                    placeholder="Tell AI what to write... (e.g. 'write video hooks about morning routines')"
                  />
                  <button
                    onClick={generateAI}
                    disabled={!aiPrompt.trim() || aiLoading}
                    className="tfc-btn text-[11px] py-1.5 px-3 disabled:opacity-40"
                  >
                    {aiLoading ? "Writing..." : "Generate"}
                  </button>
                  <button
                    onClick={dismissAI}
                    className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-sm font-body"
                  >
                    ×
                  </button>
                </div>

                {/* AI Loading */}
                {aiLoading && (
                  <div className="px-4 py-6 flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-red/30 border-t-red rounded-full animate-spin" />
                    <span className="text-text-3 text-sm">Claude is writing...</span>
                  </div>
                )}

                {/* AI Result */}
                {aiResult && !aiLoading && (
                  <div className="p-4">
                    <pre className="whitespace-pre-wrap text-sm text-text font-body leading-relaxed m-0 mb-3">{aiResult}</pre>
                    <div className="flex gap-2">
                      <button onClick={acceptAI} className="tfc-btn text-[11px] py-1.5 px-4">
                        Insert
                      </button>
                      <button onClick={() => { setAiResult(""); setAiPrompt(""); aiPromptRef.current?.focus(); }}
                        className="tfc-btn-ghost text-[11px] py-1.5 px-4">
                        Try again
                      </button>
                      <button onClick={dismissAI} className="tfc-btn-ghost text-[11px] py-1.5 px-4">
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick suggestions when no prompt yet */}
                {!aiPrompt && !aiResult && !aiLoading && (
                  <div className="px-4 py-3 flex flex-wrap gap-1.5">
                    {[
                      "Write video hooks",
                      "Write a script",
                      "Write captions",
                      "Brainstorm content ideas",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setAiPrompt(s); setTimeout(() => aiPromptRef.current?.focus(), 50); }}
                        className="text-[11px] py-1 px-2.5 rounded-md bg-surface-3 border border-border text-text-3 hover:text-text hover:border-border-2 cursor-pointer transition-colors font-body border-none"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row: Content Style, Content Type, Priority */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div>
              <label className="tfc-label">Content Style</label>
              <select className="tfc-input" aria-label="Content Style" value={contentStyle} onChange={(e) => setContentStyle(e.target.value)} style={{ cursor: "pointer" }}>
                <option value="">Select...</option>
                {CONTENT_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="tfc-label">Content Type</label>
              <select className="tfc-input" aria-label="Content Type" value={contentType} onChange={(e) => setContentType(e.target.value)} style={{ cursor: "pointer" }}>
                <option value="">Select...</option>
                {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="tfc-label">Priority</label>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as const).map((p) => {
                  const cfg = PRIORITY_CONFIG[p]; const active = priority === p;
                  return (
                    <button key={p} onClick={() => setPriority(p)}
                      aria-label={`Priority: ${cfg.label}`}
                      className="flex-1 py-[7px] px-2 rounded-lg text-[11px] font-bold tracking-[0.04em] uppercase cursor-pointer transition-all border"
                      style={{ background: active ? cfg.bg : "transparent", color: active ? cfg.color : "#5A5652", borderColor: active ? cfg.border : "#252525" }}>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 gap-3 mb-5">
            <div>
              <label className="tfc-label">Reference URL</label>
              <input type="url" className="tfc-input" value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} placeholder="https://..." />
              {referenceUrl && <VideoPreview url={referenceUrl} label="Reference Preview" />}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="tfc-label">Raw Footage URL</label>
                <input type="url" className="tfc-input" value={uneditedUrl} onChange={(e) => setUneditedUrl(e.target.value)} placeholder="Link to raw footage" />
                {uneditedUrl && <VideoPreview url={uneditedUrl} label="Raw Footage Preview" />}
              </div>
              <div>
                <label className="tfc-label">Edited Video URL</label>
                <input type="url" className="tfc-input" value={editedVideoUrl} onChange={(e) => setEditedVideoUrl(e.target.value)} placeholder="Link to edited video" />
                {editedVideoUrl && <VideoPreview url={editedVideoUrl} label="Edited Video Preview" />}
              </div>
            </div>
          </div>

          {/* Evergreen toggle */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setIsEvergreen((v) => !v)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all w-full text-left font-body ${
                isEvergreen
                  ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                  : "bg-surface-2 border-border text-text-3 hover:text-text-2 hover:border-border-2"
              }`}
            >
              <span className="text-[16px]">♻️</span>
              <div className="flex-1">
                <div className="text-[12px] font-semibold">Evergreen Content</div>
                <div className="text-[10px] opacity-70">Flag this piece as reusable / recyclable content</div>
              </div>
              <div className={`w-8 h-4 rounded-full transition-colors flex items-center ${isEvergreen ? "bg-[#10B981]" : "bg-surface-3"}`}>
                <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform mx-0.5 ${isEvergreen ? "translate-x-4" : "translate-x-0"}`} />
              </div>
            </button>
          </div>

          {/* Editor & Location */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="tfc-label">Editor</label>
              <input className="tfc-input" value={assignedEditor} onChange={(e) => setAssignedEditor(e.target.value)} placeholder="Editor name" />
            </div>
            <div>
              <label className="tfc-label">Shoot Location</label>
              <input className="tfc-input" value={shootLocation} onChange={(e) => setShootLocation(e.target.value)} placeholder="Address or location" />
            </div>
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div>
              <label className="tfc-label">Shoot Date & Time</label>
              <input type="datetime-local" className="tfc-input" aria-label="Shoot Date & Time" value={shootDate} onChange={(e) => setShootDate(e.target.value)} style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="tfc-label">Edit Deadline</label>
              <input type="datetime-local" className="tfc-input" aria-label="Edit Deadline" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="tfc-label">Publish Date & Time</label>
              <input type="datetime-local" className="tfc-input" aria-label="Publish Date & Time" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} style={{ colorScheme: "dark" }} />
            </div>
          </div>

          {/* Revisions */}
          <div className="mb-5 p-4 rounded-xl border border-border bg-surface-2">
            <label className="tfc-label flex items-center gap-2 mb-2">
              <span className="text-[#EF4444]">●</span> Revisions
              {card.column_id === "revise" && (
                <span className="text-[9px] font-bold tracking-wider uppercase py-[2px] px-[6px] rounded bg-[#EF4444]/12 text-[#EF4444] border border-[#EF4444]/25">In Revision</span>
              )}
            </label>
            <textarea
              className="tfc-textarea w-full"
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="List any revisions needed (e.g. shorten the intro, change music, add captions)..."
              style={{ minHeight: 70, resize: "vertical" }}
            />
            {revisionNotes.trim() && card.column_id !== "revise" && (
              <button
                onClick={sendToRevisions}
                disabled={sendingToRevisions}
                className="mt-2 text-[11px] font-semibold py-2 px-4 rounded-lg cursor-pointer transition-all border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 disabled:opacity-50"
              >
                {sendingToRevisions ? "Moving..." : "Send to Revisions"}
              </button>
            )}
          </div>

          {/* Attachments */}
          <div className="mb-5 rounded-xl border border-border bg-surface-2 overflow-hidden">
            <button
              type="button"
              onClick={() => setAttachmentsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer text-left"
            >
              <span className="tfc-label m-0 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
                Attachments
                {attachments.length > 0 && (
                  <span className="text-[10px] font-bold py-[1px] px-[6px] rounded-full bg-red/12 text-red border border-red/25">{attachments.length}</span>
                )}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`text-text-3 transition-transform ${attachmentsOpen ? "rotate-180" : ""}`}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {attachmentsOpen && (
              <div className="border-t border-border">
                {/* Attachment list */}
                {loadingAttachments && (
                  <div className="px-4 py-6 text-text-3 text-[13px] text-center">Loading attachments...</div>
                )}
                {!loadingAttachments && attachments.length === 0 && (
                  <div className="px-4 py-6 text-text-3 text-[13px] text-center">No files attached yet.</div>
                )}
                {!loadingAttachments && attachments.map((att) => (
                  <div
                    key={att.id}
                    className={`px-4 py-3 border-b border-border last:border-b-0 ${att.is_final ? "ring-1 ring-[#10B981]/40 bg-[#10B981]/5" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-surface-3 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        {att.drive_thumbnail_link ? (
                          <img src={att.drive_thumbnail_link} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[16px]">{getMimeIcon(att.drive_mime_type)}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-text text-[13px] font-semibold truncate">{att.drive_file_name}</span>
                          {att.is_final && (
                            <span className="text-[9px] font-bold tracking-wider uppercase py-[1px] px-[5px] rounded bg-[#10B981]/12 text-[#10B981] border border-[#10B981]/25 shrink-0">Final</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {att.label && (
                            <span className="text-[9px] font-bold tracking-wider uppercase py-[1px] px-[5px] rounded bg-red/8 text-red border border-red/20">{att.label}</span>
                          )}
                          {att.file_size && (
                            <span className="text-text-3 text-[11px]">{formatFileSize(att.file_size)}</span>
                          )}
                          <span className="text-text-3 text-[11px]">by {att.linked_by_name}</span>
                        </div>

                        {/* Controls row */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {/* Label dropdown */}
                          <select
                            value={att.label || ""}
                            onChange={(e) => updateAttachment(att.id, { label: e.target.value || undefined })}
                            className="text-[10px] py-1 px-2 rounded-md bg-surface-3 border border-border text-text-2 cursor-pointer font-body outline-none"
                            style={{ colorScheme: "dark" }}
                          >
                            <option value="">No label</option>
                            <option value="Raw Footage">Raw Footage</option>
                            <option value="Edited Cut">Edited Cut</option>
                            <option value="Thumbnail">Thumbnail</option>
                            <option value="Caption File">Caption File</option>
                            <option value="Other">Other</option>
                          </select>

                          {/* Mark as Final toggle */}
                          <button
                            onClick={() => updateAttachment(att.id, { isFinal: !att.is_final })}
                            className={`text-[10px] py-1 px-2 rounded-md border cursor-pointer font-body transition-colors ${
                              att.is_final
                                ? "bg-[#10B981]/12 border-[#10B981]/30 text-[#10B981]"
                                : "bg-surface-3 border-border text-text-3 hover:text-text-2"
                            }`}
                          >
                            {att.is_final ? "Final" : "Mark Final"}
                          </button>

                          {/* Open in Drive */}
                          {att.drive_view_link && (
                            <a
                              href={att.drive_view_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] py-1 px-2 rounded-md bg-surface-3 border border-border text-text-3 hover:text-text-2 no-underline font-body transition-colors"
                            >
                              Open in Drive
                            </a>
                          )}

                          {/* Unlink */}
                          {confirmUnlink === att.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-text-3">Remove from card?</span>
                              <button
                                onClick={() => unlinkAttachment(att.id)}
                                className="text-[10px] py-0.5 px-2 rounded bg-[#EF4444]/12 text-[#EF4444] border border-[#EF4444]/25 cursor-pointer font-body"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmUnlink(null)}
                                className="text-[10px] py-0.5 px-2 rounded bg-surface-3 text-text-3 border border-border cursor-pointer font-body"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmUnlink(att.id)}
                              className="text-[10px] py-1 px-2 rounded-md bg-surface-3 border border-border text-text-3 hover:text-[#EF4444] cursor-pointer font-body transition-colors"
                            >
                              Unlink
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Attach button */}
                <div className="px-4 py-3">
                  {attachError && <p className="text-[#EF4444] text-[11px] mb-2">{attachError}</p>}
                  <button
                    onClick={handleAttachFromDrive}
                    disabled={attachingFile}
                    className="tfc-btn text-[11px] py-2 px-4 w-full disabled:opacity-50"
                  >
                    {attachingFile ? "Opening picker..." : "Attach from Google Drive"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Time Tracking — team members only */}
          {currentUser.type === "team" && (
            <TimeTracker
              cardId={card.id}
              currentUserEmail={currentUser.email}
              currentUserName={currentUser.name}
            />
          )}

          {/* Error */}
          {error && <p className="text-[#EF4444] text-[12px] mb-4">{error}</p>}

          {/* Divider */}
          <div className="border-t border-border my-6" />

          {/* Comments */}
          <div>
            <label className="tfc-label">Comments</label>
            <div className="bg-surface-2 border border-border rounded-xl overflow-hidden mb-3" style={{ maxHeight: 240, overflowY: "auto" }}>
              {loadingComments && <div className="p-6 text-text-3 text-[13px] text-center">Loading comments...</div>}
              {!loadingComments && comments.length === 0 && <div className="p-6 text-text-3 text-[13px] text-center">No comments yet.</div>}
              {!loadingComments && comments.map((c) => (
                <div key={c.id} className="px-4 py-3 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-text text-[13px] font-semibold">{c.author_name}</span>
                    <span className="text-[9px] font-bold tracking-[0.08em] uppercase py-[2px] px-[6px] rounded-[4px]"
                      style={{ background: c.author_type === "team" ? "rgba(224,32,32,0.12)" : "rgba(168,164,156,0.12)", color: c.author_type === "team" ? "#FF3B3B" : "#A8A49C", border: `1px solid ${c.author_type === "team" ? "rgba(224,32,32,0.25)" : "rgba(168,164,156,0.25)"}` }}>
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
              <textarea className="tfc-textarea flex-1" value={newComment} onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..." style={{ minHeight: 44, resize: "none" }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(); } }} />
              <button className="tfc-btn shrink-0 self-end" style={{ padding: "10px 18px", fontSize: 11 }} onClick={addComment} disabled={!newComment.trim()}>Send</button>
            </div>
          </div>
        </div>

        {/* Publish Scheduler — shown when card is in the approved column */}
        {card.column_id === "approved" && (
          <div className="px-6 py-4 border-t border-border">
            <PublishScheduler
              cardId={card.id}
              clientId={clientId}
              onScheduled={() => {
                onUpdate({ ...card, column_id: "scheduled" });
                onClose();
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <button onClick={handleDelete}
            className="text-[13px] font-semibold cursor-pointer border-none bg-transparent transition-colors font-body"
            style={{ color: confirmDelete ? "#EF4444" : "#5A5652" }}>
            {confirmDelete ? "Click again to confirm delete" : "Delete Card"}
          </button>
          <div className="flex gap-2">
            <button className="tfc-btn-ghost" style={{ padding: "9px 20px" }} onClick={onClose}>Cancel</button>
            <button className="tfc-btn" style={{ padding: "9px 20px" }} onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
