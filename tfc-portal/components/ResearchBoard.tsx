"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";

interface ResearchItem {
  id: string;
  saved_by: string;
  client_id?: string;
  url?: string;
  title?: string;
  notes?: string;
  type?: string;
  platform?: string;
  tags?: string[];
  content_pillars?: string[];
  og_image?: string;
  og_title?: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

interface Props {
  clients: Client[];
}

const TYPE_OPTIONS = [
  { value: "competitor_content", label: "Competitor Content", color: "#3B82F6" },
  { value: "trending_audio", label: "Trending Audio", color: "#F59E0B" },
  { value: "viral_format", label: "Viral Format", color: "var(--color-red)" },
  { value: "reference_video", label: "Reference Video", color: "#10B981" },
  { value: "other", label: "Other", color: "#6B7280" },
] as const;

const FORMAT_OPTIONS = [
  { value: "short_form", label: "Short Form" },
  { value: "long_form", label: "Long Form" },
] as const;

const TYPE_COLORS: Record<string, string> = {
  competitor_content: "#3B82F6",
  trending_audio: "#F59E0B",
  viral_format: "var(--color-red)",
  reference_video: "#10B981",
  other: "#6B7280",
};

const TYPE_LABELS: Record<string, string> = {
  competitor_content: "Competitor",
  trending_audio: "Trending",
  viral_format: "Viral",
  reference_video: "Reference",
  other: "Other",
};

const FORMAT_LABELS: Record<string, string> = {
  short_form: "Short Form",
  long_form: "Long Form",
};

function getEmbed(url: string): { embedUrl: string; aspect: "9/16" | "16/9" | "1/1" } | null {
  if (!url) return null;
  // YouTube long-form
  const ytLong = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytLong) return { embedUrl: `https://www.youtube.com/embed/${ytLong[1]}`, aspect: "16/9" };
  // YouTube Shorts (vertical)
  const ytShort = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (ytShort) return { embedUrl: `https://www.youtube.com/embed/${ytShort[1]}`, aspect: "9/16" };
  // TikTok (vertical)
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (ttMatch) return { embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`, aspect: "9/16" };
  // Instagram Reels (vertical)
  const igReel = url.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/);
  if (igReel) return { embedUrl: `https://www.instagram.com/reel/${igReel[1]}/embed`, aspect: "9/16" };
  // Instagram Posts (square-ish)
  const igPost = url.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/);
  if (igPost) return { embedUrl: `https://www.instagram.com/p/${igPost[1]}/embed`, aspect: "1/1" };
  return null;
}

export function ResearchBoard({ clients }: Props) {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterFormat, setFilterFormat] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [columnCount, setColumnCount] = useState(3);
  const [editingItem, setEditingItem] = useState<ResearchItem | null>(null);

  // Form state
  const [formUrl, setFormUrl] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("");
  const [formFormat, setFormFormat] = useState("");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formTagInput, setFormTagInput] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [ogPreview, setOgPreview] = useState<{ title: string | null; image: string | null }>({ title: null, image: null });
  const [ogLoading, setOgLoading] = useState(false);
  const ogTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sidebar visibility on mobile
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/research");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let result = items;
    if (filterClient !== "all") result = result.filter((i) => i.client_id === filterClient);
    if (filterType !== "all") result = result.filter((i) => i.type === filterType);
    if (filterFormat !== "all") {
      result = result.filter((i) => {
        const val = (i.platform || "").toLowerCase().replace(/[\s-]/g, "_");
        return val === filterFormat;
      });
    }
    return result;
  }, [items, filterClient, filterType, filterFormat]);

  const fetchOgPreview = useCallback(async (url: string) => {
    if (!url) {
      setOgPreview({ title: null, image: null });
      return;
    }
    setOgLoading(true);
    try {
      const res = await fetch(`/api/research/og-preview?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        setOgPreview(data);
        if (data.title && !formTitle) setFormTitle(data.title);
      }
    } catch {
      // silent
    } finally {
      setOgLoading(false);
    }
  }, [formTitle]);

  function handleUrlBlur() {
    if (formUrl && formUrl.startsWith("http")) {
      if (ogTimeout.current) clearTimeout(ogTimeout.current);
      ogTimeout.current = setTimeout(() => fetchOgPreview(formUrl), 300);
    }
  }

  function handleUrlPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text");
    if (pasted && pasted.startsWith("http")) {
      setTimeout(() => fetchOgPreview(pasted), 300);
    }
  }

  function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && formTagInput.trim()) {
      e.preventDefault();
      if (!formTags.includes(formTagInput.trim())) {
        setFormTags([...formTags, formTagInput.trim()]);
      }
      setFormTagInput("");
    }
  }

  function removeTag(tag: string) {
    setFormTags(formTags.filter((t) => t !== tag));
  }

  async function handleSave() {
    if (!formTitle.trim()) return;
    setFormSaving(true);
    try {
      if (editingItem) {
        // Update existing item
        const res = await fetch("/api/research", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingItem.id,
            url: formUrl || undefined,
            title: formTitle,
            notes: formNotes || undefined,
            type: formType || undefined,
            format: formFormat || undefined,
            tags: formTags.length ? formTags : undefined,
            clientId: formClient || undefined,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i));
          resetForm();
          setShowForm(false);
          setEditingItem(null);
        }
      } else {
        // Create new
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: formUrl || undefined,
            title: formTitle,
            notes: formNotes || undefined,
            type: formType || undefined,
            format: formFormat || undefined,
            tags: formTags.length ? formTags : undefined,
            clientId: formClient || undefined,
          }),
        });
        if (res.ok) {
          const item = await res.json();
          setItems((prev) => [item, ...prev]);
          resetForm();
          setShowForm(false);
        }
      }
    } catch {
      // silent
    } finally {
      setFormSaving(false);
    }
  }

  function openEdit(item: ResearchItem) {
    setFormUrl(item.url || "");
    setFormTitle(item.og_title || item.title || "");
    setFormType(item.type || "");
    setFormFormat(item.platform || "");
    setFormTags(item.tags || []);
    setFormClient(item.client_id || "");
    setFormNotes(item.notes || "");
    setOgPreview({ title: item.og_title || null, image: item.og_image || null });
    setEditingItem(item);
    setShowForm(true);
  }

  function resetForm() {
    setFormUrl("");
    setFormTitle("");
    setFormType("");
    setFormFormat("");
    setFormTags([]);
    setFormTagInput("");
    setFormClient("");
    setFormNotes("");
    setOgPreview({ title: null, image: null });
    setEditingItem(null);
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch("/api/research", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setDeleteConfirm(null);
      }
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  function toggleNotes(id: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <h2 className="text-lg font-semibold text-text">Research & Inspiration</h2>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[rgba(245,158,11,0.15)] text-[#F59E0B]">
            {items.length}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-2 text-text-2 border border-border hover:text-text transition-colors"
          >
            Filters
          </button>
          {/* Size controls */}
          <div className="hidden sm:flex items-center gap-1 bg-surface-2 border border-border rounded-lg p-0.5">
            <button
              onClick={() => setColumnCount((c) => Math.min(c + 1, 6))}
              disabled={columnCount >= 6}
              className="w-7 h-7 flex items-center justify-center rounded text-text-3 hover:text-text hover:bg-surface-3 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-3"
              title="Smaller cards"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
            <span className="text-[10px] text-text-3 font-medium w-4 text-center">{columnCount}</span>
            <button
              onClick={() => setColumnCount((c) => Math.max(c - 1, 1))}
              disabled={columnCount <= 1}
              className="w-7 h-7 flex items-center justify-center rounded text-text-3 hover:text-text hover:bg-surface-3 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-3"
              title="Larger cards"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            style={{ background: "rgba(224,32,32,0.12)", color: "var(--color-red)", border: "1px solid rgba(224,32,32,0.3)" }}
          >
            + Save New
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Sidebar Filters */}
        <div className={`${showFilters ? "block" : "hidden"} sm:block w-full sm:w-48 shrink-0 space-y-4`}>
          {/* Client filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-3 uppercase tracking-wider">Client</label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-surface border border-border rounded-lg text-text focus:outline-none focus:border-red"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-3 uppercase tracking-wider">Type</label>
            <div className="space-y-1">
              <button
                onClick={() => setFilterType("all")}
                className="w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors"
                style={{
                  background: filterType === "all" ? "rgba(224,32,32,0.12)" : "transparent",
                  color: filterType === "all" ? "var(--color-red)" : "var(--text-2, #a0a0a0)",
                }}
              >
                All Types
              </button>
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFilterType(t.value)}
                  className="w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-2"
                  style={{
                    background: filterType === t.value ? `${t.color}20` : "transparent",
                    color: filterType === t.value ? t.color : "var(--text-2, #a0a0a0)",
                  }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-3 uppercase tracking-wider">Format</label>
            <div className="space-y-1">
              <button
                onClick={() => setFilterFormat("all")}
                className="w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors"
                style={{
                  background: filterFormat === "all" ? "rgba(224,32,32,0.12)" : "transparent",
                  color: filterFormat === "all" ? "var(--color-red)" : "var(--text-2, #a0a0a0)",
                }}
              >
                All Formats
              </button>
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterFormat(f.value)}
                  className="w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors"
                  style={{
                    background: filterFormat === f.value ? "rgba(224,32,32,0.12)" : "transparent",
                    color: filterFormat === f.value ? "var(--color-red)" : "var(--text-2, #a0a0a0)",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main grid area */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-3, #666)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-text-2 text-sm font-medium mb-1">No research items yet</p>
              <p className="text-text-3 text-xs max-w-xs">
                Save competitor content, trending audio, viral formats, and reference videos to inspire your content strategy.
              </p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="gap-3" style={{ columnCount, columnGap: "0.75rem" }}>
              {filtered.map((item) => {
                const typeColor = TYPE_COLORS[item.type || ""] || "#6B7280";
                const typeLabel = TYPE_LABELS[item.type || ""] || "Other";
                const formatLabel = FORMAT_LABELS[item.platform || ""] || null;
                const clientName = clients.find((c) => c.id === item.client_id)?.name;
                const isExpanded = expandedNotes.has(item.id);
                const embed = item.url ? getEmbed(item.url) : null;

                return (
                  <div
                    key={item.id}
                    className="break-inside-avoid mb-3 bg-surface border border-border rounded-xl overflow-hidden hover:border-[rgba(224,32,32,0.3)] transition-colors"
                  >
                    {/* Video embed at native aspect ratio, OG image, or gradient */}
                    {embed ? (
                      <div className="w-full relative bg-black" style={{ aspectRatio: embed.aspect }}>
                        <iframe
                          src={embed.embedUrl}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : item.og_image ? (
                      <div className="w-full h-36 relative">
                        <img
                          src={item.og_image}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    ) : (
                      <div
                        className="w-full h-20"
                        style={{
                          background: `linear-gradient(135deg, ${typeColor}30, ${typeColor}10)`,
                        }}
                      />
                    )}

                    <div className="p-3 space-y-2">
                      {/* Title */}
                      <h3 className="text-sm font-semibold text-text leading-tight line-clamp-2">
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-red transition-colors">
                            {item.og_title || item.title || "Untitled"}
                          </a>
                        ) : (
                          item.title || "Untitled"
                        )}
                      </h3>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider"
                          style={{ background: `${typeColor}20`, color: typeColor }}
                        >
                          {typeLabel}
                        </span>
                        {formatLabel && (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-surface-2 text-text-2 border border-border">
                            {formatLabel}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-[10px] rounded bg-surface-2 text-text-3 border border-border">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div>
                          <p className={`text-xs text-text-3 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                            {item.notes}
                          </p>
                          {item.notes.length > 100 && (
                            <button
                              onClick={() => toggleNotes(item.id)}
                              className="text-[11px] text-text-3 hover:text-text transition-colors mt-0.5"
                            >
                              {isExpanded ? "Show less" : "Show more"}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Client link */}
                      {clientName && (
                        <p className="text-[11px] text-text-3">
                          Linked to <span className="text-text-2 font-medium">{clientName}</span>
                        </p>
                      )}

                      {/* Date */}
                      <p className="text-[10px] text-text-3">
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="flex-1 py-1.5 text-[11px] font-medium rounded-lg bg-surface-2 text-text-3 hover:text-text hover:bg-surface-3 border border-border transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="flex-1 py-1.5 text-[11px] font-medium rounded-lg bg-surface-2 text-text-3 hover:text-red hover:bg-[rgba(224,32,32,0.08)] border border-border transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-bg border border-border rounded-2xl p-5 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-text mb-2">Delete Research Item?</h3>
            <p className="text-xs text-text-3 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 text-xs font-medium rounded-lg bg-surface-2 text-text-2 border border-border hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                style={{ background: "rgba(224,32,32,0.15)", color: "var(--color-red)", border: "1px solid rgba(224,32,32,0.3)" }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save New Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingItem(null); }}>
          <div
            className="w-full max-w-lg bg-bg border border-border rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text">{editingItem ? "Edit Research Item" : "Save Research Item"}</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg hover:bg-surface-2 text-text-3 hover:text-text transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* URL */}
              <div>
                <label className="text-[11px] font-medium text-text-3 uppercase tracking-wider mb-1 block">URL (optional)</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  onPaste={handleUrlPaste}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text placeholder:text-text-3 focus:outline-none focus:border-red"
                />
              </div>

              {/* OG Preview */}
              {ogLoading && (
                <div className="flex items-center gap-2 text-xs text-text-3">
                  <div className="w-3 h-3 border border-text-3 border-t-transparent rounded-full animate-spin" />
                  Fetching preview...
                </div>
              )}
              {ogPreview.image && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img src={ogPreview.image} alt="" className="w-full h-32 object-cover" />
                  {ogPreview.title && <p className="p-2 text-xs text-text-2">{ogPreview.title}</p>}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="text-[11px] font-medium text-text-3 uppercase tracking-wider mb-1 block">Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Research item title"
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text placeholder:text-text-3 focus:outline-none focus:border-red"
                />
              </div>

              {/* Type */}
              <div>
                <label className="text-[11px] font-medium text-text-3 uppercase tracking-wider mb-1 block">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text focus:outline-none focus:border-red"
                >
                  <option value="">Select type...</option>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Format toggle */}
              <div>
                <label className="text-[11px] font-medium text-text-3 uppercase tracking-wider mb-1.5 block">Format</label>
                <div className="flex gap-2">
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFormFormat(formFormat === f.value ? "" : f.value)}
                      className="flex-1 py-2 text-xs font-medium rounded-lg transition-colors border"
                      style={{
                        background: formFormat === f.value ? "rgba(224,32,32,0.12)" : "transparent",
                        color: formFormat === f.value ? "var(--color-red)" : "var(--color-text-2, #A8A49C)",
                        borderColor: formFormat === f.value ? "rgba(224,32,32,0.3)" : "var(--color-border, #252525)",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-[11px] font-medium text-text-3 uppercase tracking-wider mb-1 block">Tags</label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {formTags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full bg-surface-2 text-text-2 border border-border"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="text-text-3 hover:text-red">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={formTagInput}
                  onChange={(e) => setFormTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type and press Enter..."
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text placeholder:text-text-3 focus:outline-none focus:border-red"
                />
              </div>

              {/* Client link */}
              <div>
                <label className="text-[11px] font-medium text-text-3 uppercase tracking-wider mb-1 block">Link to Client (optional)</label>
                <select
                  value={formClient}
                  onChange={(e) => setFormClient(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text focus:outline-none focus:border-red"
                >
                  <option value="">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-medium text-text-3 uppercase tracking-wider mb-1 block">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Why is this interesting? How could it be used?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text placeholder:text-text-3 focus:outline-none focus:border-red resize-none"
                />
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={!formTitle.trim() || formSaving}
                className="w-full py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                style={{ background: "rgba(224,32,32,0.15)", color: "var(--color-red)", border: "1px solid rgba(224,32,32,0.3)" }}
              >
                {formSaving ? "Saving..." : editingItem ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
