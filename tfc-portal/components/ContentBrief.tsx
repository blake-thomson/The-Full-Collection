"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  clientId: string;
  onClose: () => void;
  onCreated?: () => void;
}

const PLATFORMS = [
  "Instagram", "TikTok", "YouTube", "LinkedIn", "Twitter / X", "Facebook", "Blog", "Podcast", "Other",
];

const CONTENT_TYPES = [
  "Reel", "Story", "Carousel", "Long-form video", "Short-form video", "Blog post", "Newsletter", "Podcast episode",
];

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "#6B7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.25)" },
  medium: { label: "Medium", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  high: { label: "High", color: "#EF4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
};

export function ContentBrief({ clientId, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [contentType, setContentType] = useState("");
  const [description, setDescription] = useState("");
  const [referenceLinks, setReferenceLinks] = useState<string[]>([""]);
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const addReferenceLink = () => {
    setReferenceLinks((prev) => [...prev, ""]);
  };

  const removeReferenceLink = (index: number) => {
    setReferenceLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const updateReferenceLink = (index: number, value: string) => {
    setReferenceLinks((prev) => prev.map((l, i) => (i === index ? value : l)));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Content title is required.");
      return;
    }
    setError("");
    setSubmitting(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const links = referenceLinks.filter((l) => l.trim());

    // Build description with all metadata
    const parts: string[] = [];
    if (description.trim()) parts.push(description.trim());
    if (contentType) parts.push(`\n---\nContent Type: ${contentType}`);
    if (tags.length > 0) parts.push(`Tags: ${tags.join(", ")}`);
    if (links.length > 0) parts.push(`Reference Links:\n${links.map((l) => `- ${l}`).join("\n")}`);

    const fullDescription = parts.join("\n");

    try {
      const res = await fetch("/api/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          column_id: "idea",
          title: title.trim(),
          description: fullDescription || null,
          platform: platform || null,
          due_date: targetDate || null,
          priority,
        }),
      });

      if (res.ok) {
        onCreated?.();
        onClose();
      } else {
        setError("Failed to create content brief. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div
        className="bg-surface border-l border-border w-full max-w-[540px] h-full flex flex-col animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideInRight 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-text font-heading text-[17px] font-bold m-0">Submit Content Idea</h3>
            <p className="text-text-3 text-[12px] m-0 mt-0.5">Fill out the brief and it will appear in your Idea column</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-xl leading-none font-body transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="tfc-label">Content Title *</label>
            <input
              className="tfc-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Behind-the-scenes reel for product launch"
            />
          </div>

          {/* Platform + Content Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="tfc-label">Platform</label>
              <select
                className="tfc-input"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="">Select platform...</option>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="tfc-label">Content Type</label>
              <select
                className="tfc-input"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="">Select type...</option>
                {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="tfc-label">Description / Creative Direction</label>
            <textarea
              className="tfc-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the content idea, creative direction, talking points, etc."
              style={{ minHeight: 100 }}
            />
          </div>

          {/* Reference Links */}
          <div>
            <label className="tfc-label">Reference Links</label>
            <div className="space-y-2">
              {referenceLinks.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="tfc-input flex-1"
                    value={link}
                    onChange={(e) => updateReferenceLink(i, e.target.value)}
                    placeholder="https://..."
                  />
                  {referenceLinks.length > 1 && (
                    <button
                      className="text-text-3 hover:text-red bg-transparent border border-border rounded-lg px-2.5 cursor-pointer font-body transition-colors text-sm"
                      onClick={() => removeReferenceLink(i)}
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-[12px] font-body mt-2 transition-colors"
              onClick={addReferenceLink}
            >
              + Add another link
            </button>
          </div>

          {/* Target Date + Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="tfc-label">Target Publish Date</label>
              <input
                type="date"
                className="tfc-input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
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
                      className="flex-1 py-[7px] px-2 rounded-lg text-[11px] font-bold tracking-[0.04em] uppercase cursor-pointer transition-all border font-body"
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

          {/* Tags */}
          <div>
            <label className="tfc-label">Tags (comma-separated)</label>
            <input
              className="tfc-input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. product launch, behind-the-scenes, brand"
            />
            {tagsInput && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tagsInput.split(",").map((t, i) => t.trim()).filter(Boolean).map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold py-[3px] px-2 rounded-md"
                    style={{ background: "rgba(224,32,32,0.1)", color: "#FF3B3B", border: "1px solid rgba(224,32,32,0.2)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-[#EF4444] text-[12px] m-0">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 shrink-0">
          <button className="tfc-btn-ghost" style={{ padding: "9px 20px" }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="tfc-btn"
            style={{ padding: "9px 24px" }}
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
          >
            {submitting ? "Submitting..." : "Submit Idea"}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
