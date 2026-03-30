"use client";

import { useState } from "react";

interface CaptionResult {
  caption: string;
  hashtags: string[];
  hook: string;
}

interface Props {
  cardId: string;
  cardColumnId?: string;
}

const PLATFORMS = ["instagram", "tiktok", "linkedin", "youtube", "twitter", "facebook"];

export function AICaptionGenerator({ cardId, cardColumnId }: Props) {
  const [platform, setPlatform] = useState("instagram");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [editedCaption, setEditedCaption] = useState("");
  const [editedHashtags, setEditedHashtags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Only show for approved or scheduled columns
  const showColumns = ["approved", "scheduled"];
  if (cardColumnId && !showColumns.includes(cardColumnId)) {
    return null;
  }

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, platform }),
      });
      if (res.ok) {
        const data: CaptionResult = await res.json();
        setResult(data);
        setEditedCaption(data.caption);
        setEditedHashtags(data.hashtags || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fullCaption = editedCaption + (editedHashtags.length > 0 ? "\n\n" + editedHashtags.map((h) => `#${h}`).join(" ") : "");
      await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cardId, caption: fullCaption }),
      });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    const fullText = editedCaption + (editedHashtags.length > 0 ? "\n\n" + editedHashtags.map((h) => `#${h}`).join(" ") : "");
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeHashtag = (index: number) => {
    setEditedHashtags(editedHashtags.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text">AI Caption</h3>

      {/* Generate controls */}
      <div className="flex gap-2">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="px-3 py-2 text-sm bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-red"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 text-sm bg-red text-white rounded-lg hover:bg-[#c41a1a] transition-colors disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Caption"}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          <div className="h-24 bg-surface-2 rounded-lg animate-pulse" />
          <div className="h-8 bg-surface-2 rounded-lg animate-pulse w-3/4" />
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-3">
          {/* Hook */}
          {result.hook && (
            <div className="bg-surface-2 rounded-lg p-3 border border-border">
              <p className="text-xs text-text-3 mb-1">Hook</p>
              <p className="text-sm text-text">{result.hook}</p>
            </div>
          )}

          {/* Caption */}
          <textarea
            value={editedCaption}
            onChange={(e) => setEditedCaption(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 text-sm bg-surface-2 border border-border rounded-lg text-text placeholder:text-text-3 focus:outline-none focus:border-red resize-y"
          />

          {/* Hashtags */}
          <div className="flex flex-wrap gap-1.5">
            {editedHashtags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-surface-2 border border-border text-text-2"
              >
                #{tag}
                <button
                  onClick={() => removeHashtag(i)}
                  className="text-text-3 hover:text-red ml-0.5"
                >
                  x
                </button>
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-[#10B981] text-white rounded-lg hover:bg-[#0d9668] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save to Card"}
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-sm bg-surface-2 border border-border text-text-2 rounded-lg hover:text-text hover:border-red transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
