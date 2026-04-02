"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { COLUMNS } from "@/lib/constants";
import PublishScheduler from "@/components/PublishScheduler";
import TimeTracker from "@/components/TimeTracker";
import { AICaptionGenerator } from "@/components/AICaptionGenerator";

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

  const [sendingToRevisions, setSendingToRevisions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);


  // Inline AI state
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const aiPromptRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !showAIPrompt) onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, showAIPrompt]);
  useEffect(() => {
    if (showAIPrompt && aiPromptRef.current) aiPromptRef.current.focus();
  }, [showAIPrompt]);

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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" strokeWidth="2">
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

        {/* AI Caption Generator — shown for team on approved/scheduled cards */}
        {currentUser.type === "team" && (card.column_id === "approved" || card.column_id === "scheduled") && (
          <div className="px-6 py-4 border-t border-border">
            <AICaptionGenerator
              cardId={card.id}
              cardColumnId={card.column_id}
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
