"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  clientId: string;
  clientName: string;
  onClose?: () => void;
}

const CONTENT_TYPES = [
  { id: "video_hook", label: "Video Hooks", icon: "🎣", desc: "Scroll-stopping opening lines" },
  { id: "video_script", label: "Video Script", icon: "🎬", desc: "Full short-form video script" },
  { id: "caption", label: "Captions", icon: "✍️", desc: "Social media captions with CTAs" },
  { id: "content_ideas", label: "Content Ideas", icon: "💡", desc: "10 ideas based on your pillars" },
  { id: "bio", label: "Bio Writer", icon: "👤", desc: "Social media bio variations" },
  { id: "cta", label: "CTA Generator", icon: "📢", desc: "Call-to-action variations" },
] as const;

const PLATFORMS = [
  "Instagram Reels",
  "TikTok",
  "YouTube Shorts",
  "LinkedIn",
  "Twitter / X",
  "Facebook",
  "Podcast",
  "Blog",
];

export function AIWriter({ clientId, clientName, onClose }: Props) {
  const [contentType, setContentType] = useState<string>("video_hook");
  const [platform, setPlatform] = useState("");
  const [topic, setTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<{ input_tokens: number; output_tokens: number } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const generate = async () => {
    setLoading(true);
    setError("");
    setResult("");
    setUsage(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          content_type: contentType,
          platform: platform || undefined,
          topic: topic || undefined,
          additional_context: additionalContext || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate content");
        return;
      }

      setResult(data.content);
      setUsage(data.usage);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedType = CONTENT_TYPES.find((t) => t.id === contentType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-text">AI Content Writer</h2>
          <p className="text-sm text-text-2 mt-1">
            Powered by Claude &middot; Using {clientName}&apos;s brand voice
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text transition-colors text-xl leading-none"
          >
            &times;
          </button>
        )}
      </div>

      {/* Content Type Grid */}
      <div>
        <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-3">
          What do you want to create?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CONTENT_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setContentType(type.id)}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                contentType === type.id
                  ? "border-red bg-red/10 text-text"
                  : "border-border bg-surface hover:border-border-2 text-text-2 hover:text-text"
              }`}
            >
              <div className="text-lg mb-1">{type.icon}</div>
              <div className="text-sm font-semibold font-heading">{type.label}</div>
              <div className="text-[11px] text-text-3 mt-0.5">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Platform */}
      <div>
        <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-2">
          Platform (optional)
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setPlatform("")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              !platform
                ? "bg-red/20 text-red border border-red/30"
                : "bg-surface border border-border text-text-2 hover:border-border-2"
            }`}
          >
            Any
          </button>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                platform === p
                  ? "bg-red/20 text-red border border-red/30"
                  : "bg-surface border border-border text-text-2 hover:border-border-2"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div>
        <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-2">
          Topic or brief (optional)
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={`e.g. "Why most people fail at ${selectedType?.id === "content_ideas" ? "growing on social media" : "their first 30 days"}"`}
          className="tfc-input w-full"
        />
      </div>

      {/* Additional Context */}
      <div>
        <label className="block text-xs font-semibold text-text-2 uppercase tracking-wider mb-2">
          Additional context (optional)
        </label>
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="Any extra info — recent wins, trending topics, specific angle you want to take..."
          rows={2}
          className="tfc-input w-full resize-none"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={generate}
        disabled={loading}
        className="tfc-btn w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating with Claude...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Generate {selectedType?.label}
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red/10 border border-red/20 text-red text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div ref={resultRef} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-text text-sm">Generated Content</h3>
            <div className="flex items-center gap-2">
              {usage && (
                <span className="text-[10px] text-text-3">
                  {usage.input_tokens + usage.output_tokens} tokens
                </span>
              )}
              <button
                onClick={copyToClipboard}
                className="text-xs font-semibold py-1.5 px-3 rounded-md cursor-pointer transition-colors bg-surface-3 border border-border text-text-2 hover:text-text hover:border-border-2"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={generate}
                disabled={loading}
                className="text-xs font-semibold py-1.5 px-3 rounded-md cursor-pointer transition-colors bg-surface-3 border border-border text-text-2 hover:text-text hover:border-border-2 disabled:opacity-50"
              >
                Regenerate
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-surface border border-border">
            <pre className="whitespace-pre-wrap text-sm text-text font-body leading-relaxed">
              {result}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
