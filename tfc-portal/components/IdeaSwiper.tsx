"use client";

import { useState, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

interface Idea {
  title: string;
  description: string;
  hook: string;
  platform: string;
  content_style: string;
  content_type: string;
  video_type: string;
  pillar: string;
  cta: string;
  priority: string;
}

interface Props {
  clientId: string;
  clientPillars?: string[];
  onAcceptIdea: (idea: Idea) => void;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════════════════
   QUESTIONNAIRE OPTIONS
   ═══════════════════════════════════════════════════════════ */

const FORMAT_OPTIONS = [
  { id: "short_form", label: "Short-Form", desc: "Reels, TikToks, Shorts (< 90s)" },
  { id: "long_form", label: "Long-Form", desc: "YouTube videos, Podcasts (3+ min)" },
  { id: "both", label: "Both", desc: "Mix of short and long" },
];

const STYLE_OPTIONS = [
  { id: "educational", label: "Educational", icon: "📚" },
  { id: "entertainment", label: "Entertainment", icon: "🎬" },
  { id: "edutainment", label: "Edutainment", icon: "🎯" },
  { id: "lifestyle", label: "Lifestyle", icon: "✨" },
  { id: "inspirational", label: "Inspirational", icon: "💡" },
  { id: "behind_scenes", label: "Behind the Scenes", icon: "🎥" },
];

const VIDEO_TYPE_OPTIONS = [
  { id: "talking_head", label: "Talking Head", desc: "Direct to camera" },
  { id: "interview", label: "Interview Style", desc: "Conversational clips" },
  { id: "text_broll", label: "Text over B-Roll", desc: "On-screen text with footage" },
  { id: "podcast", label: "Podcast", desc: "Audio-first, seated format" },
  { id: "qa", label: "Q&A / Questions", desc: "Question-based content" },
  { id: "street_interview", label: "Street Interviews", desc: "Public Q&A" },
  { id: "greenscreen", label: "Green Screen", desc: "Screen share / reaction" },
  { id: "voiceover_broll", label: "Voiceover + B-Roll", desc: "Narration over footage" },
];

const PLATFORM_OPTIONS = [
  { id: "instagram", label: "Instagram", color: "#E1306C" },
  { id: "tiktok", label: "TikTok", color: "#00F2EA" },
  { id: "youtube", label: "YouTube", color: "#FF0000" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2" },
];

const TONE_OPTIONS = [
  { id: "serious", label: "Serious" },
  { id: "funny", label: "Funny" },
  { id: "inspirational", label: "Inspirational" },
  { id: "controversial", label: "Controversial / Hot Take" },
  { id: "conversational", label: "Conversational" },
  { id: "authoritative", label: "Authoritative" },
];

const HOOK_STYLE_OPTIONS = [
  { id: "question", label: "Question" },
  { id: "bold_statement", label: "Bold Statement" },
  { id: "statistic", label: "Statistic / Data" },
  { id: "storytelling", label: "Storytelling" },
  { id: "challenge", label: "Challenge / Dare" },
  { id: "myth_busting", label: "Myth Busting" },
];

const COUNT_OPTIONS = [5, 10, 15];

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function IdeaSwiper({ clientId, clientPillars, onAcceptIdea, onClose }: Props) {
  // Questionnaire state
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState("short_form");
  const [styles, setStyles] = useState<string[]>([]);
  const [videoTypes, setVideoTypes] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState<string[]>([]);
  const [hookStyle, setHookStyle] = useState<string[]>([]);
  const [cta, setCta] = useState("");
  const [pillarFocus, setPillarFocus] = useState<string[]>([]);
  const [topicHint, setTopicHint] = useState("");
  const [count, setCount] = useState(10);

  // Swipe state
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accepted, setAccepted] = useState<Idea[]>([]);
  const [declined, setDeclined] = useState<Idea[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [phase, setPhase] = useState<"questionnaire" | "swiping" | "summary">("questionnaire");

  // Swipe animation
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const pillars = (clientPillars || []).filter(Boolean);

  /* ── Toggle helper ── */
  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  /* ── Generate ideas ── */
  const generateIdeas = useCallback(async () => {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/ai/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          format,
          styles,
          video_types: videoTypes,
          platforms,
          tone,
          hook_style: hookStyle,
          cta,
          pillar_focus: pillarFocus,
          topic_hint: topicHint,
          count,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setGenError(data.error || "Failed to generate ideas.");
        setGenerating(false);
        return;
      }
      const data = await res.json();
      setIdeas(data.ideas || []);
      setCurrentIndex(0);
      setAccepted([]);
      setDeclined([]);
      setPhase("swiping");
    } catch {
      setGenError("Network error. Please try again.");
    }
    setGenerating(false);
  }, [clientId, format, styles, videoTypes, platforms, tone, hookStyle, cta, pillarFocus, topicHint, count]);

  /* ── Swipe handlers ── */
  const handleSwipe = (direction: "left" | "right") => {
    const idea = ideas[currentIndex];
    if (!idea) return;

    setSwipeDir(direction);

    setTimeout(() => {
      if (direction === "right") {
        setAccepted((prev) => [...prev, idea]);
        onAcceptIdea(idea);
      } else {
        setDeclined((prev) => [...prev, idea]);
      }

      if (currentIndex + 1 >= ideas.length) {
        setPhase("summary");
      } else {
        setCurrentIndex((i) => i + 1);
      }
      setSwipeDir(null);
      setDragX(0);
    }, 300);
  };

  /* ── Touch swipe ── */
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const dx = e.touches[0].clientX - touchStart.x;
    setDragX(dx);
  };

  const onTouchEnd = () => {
    if (Math.abs(dragX) > 80) {
      handleSwipe(dragX > 0 ? "right" : "left");
    } else {
      setDragX(0);
    }
    setTouchStart(null);
  };

  /* ── Keyboard support ── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (phase !== "swiping") return;
    if (e.key === "ArrowLeft") handleSwipe("left");
    if (e.key === "ArrowRight") handleSwipe("right");
  };

  /* ── Step definitions ── */
  const STEPS = [
    { title: "What format?", subtitle: "Pick the length of content you want" },
    { title: "What style?", subtitle: "Select one or more content styles" },
    { title: "What type of videos?", subtitle: "How do you want these shot?" },
    { title: "Which platforms?", subtitle: "Where will this content live?" },
    { title: "What tone?", subtitle: "How should these ideas feel?" },
    { title: "Hook style", subtitle: "How should each video open?" },
    { title: "Final details", subtitle: "CTA, pillars, and topic focus" },
  ];

  const canAdvance = () => {
    if (step === 0) return !!format;
    if (step === 1) return styles.length > 0;
    if (step === 2) return videoTypes.length > 0;
    return true;
  };

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */

  const currentIdea = ideas[currentIndex];
  const progress = ideas.length > 0 ? ((currentIndex + (phase === "summary" ? 0 : 0)) / ideas.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div
        className="w-full max-w-[520px] max-h-[90vh] mx-4 bg-surface border border-border rounded-2xl overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-text font-heading text-[18px] font-bold m-0">
              {phase === "questionnaire" ? "Content Idea Generator" : phase === "swiping" ? "Swipe Ideas" : "All Done!"}
            </h2>
            {phase === "questionnaire" && (
              <p className="text-text-3 text-[12px] m-0 mt-0.5">
                Step {step + 1} of {STEPS.length} — {STEPS[step].subtitle}
              </p>
            )}
            {phase === "swiping" && (
              <p className="text-text-3 text-[12px] m-0 mt-0.5">
                {currentIndex + 1} of {ideas.length} — Swipe right to keep, left to skip
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Progress bar */}
        {phase === "questionnaire" && (
          <div className="h-1 bg-surface-3 shrink-0">
            <div
              className="h-full bg-red transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        )}
        {phase === "swiping" && (
          <div className="h-1 bg-surface-3 shrink-0">
            <div
              className="h-full bg-red transition-all duration-300"
              style={{ width: `${((currentIndex) / ideas.length) * 100}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── QUESTIONNAIRE ── */}
          {phase === "questionnaire" && (
            <>
              <h3 className="text-text font-heading text-[16px] font-bold mb-4">{STEPS[step].title}</h3>

              {/* Step 0: Format */}
              {step === 0 && (
                <div className="space-y-2">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFormat(opt.id)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all cursor-pointer font-body ${
                        format === opt.id
                          ? "border-red bg-red/8 text-text"
                          : "border-border bg-surface-2 text-text-2 hover:border-border-2 hover:text-text"
                      }`}
                    >
                      <div className="text-[14px] font-semibold">{opt.label}</div>
                      <div className="text-[12px] text-text-3 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 1: Styles */}
              {step === 1 && (
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => toggle(styles, setStyles, opt.id)}
                      className={`text-left px-4 py-3.5 rounded-xl border transition-all cursor-pointer font-body ${
                        styles.includes(opt.id)
                          ? "border-red bg-red/8 text-text"
                          : "border-border bg-surface-2 text-text-2 hover:border-border-2 hover:text-text"
                      }`}
                    >
                      <div className="text-[18px] mb-1">{opt.icon}</div>
                      <div className="text-[13px] font-semibold">{opt.label}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Video Types */}
              {step === 2 && (
                <div className="grid grid-cols-2 gap-2">
                  {VIDEO_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => toggle(videoTypes, setVideoTypes, opt.id)}
                      className={`text-left px-4 py-3 rounded-xl border transition-all cursor-pointer font-body ${
                        videoTypes.includes(opt.id)
                          ? "border-red bg-red/8 text-text"
                          : "border-border bg-surface-2 text-text-2 hover:border-border-2 hover:text-text"
                      }`}
                    >
                      <div className="text-[13px] font-semibold">{opt.label}</div>
                      <div className="text-[11px] text-text-3 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 3: Platforms */}
              {step === 3 && (
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORM_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => toggle(platforms, setPlatforms, opt.id)}
                      className={`text-left px-4 py-3.5 rounded-xl border transition-all cursor-pointer font-body ${
                        platforms.includes(opt.id)
                          ? "border-red bg-red/8 text-text"
                          : "border-border bg-surface-2 text-text-2 hover:border-border-2 hover:text-text"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: opt.color }} />
                        <span className="text-[14px] font-semibold">{opt.label}</span>
                      </div>
                    </button>
                  ))}
                  <p className="text-text-3 text-[11px] col-span-2 mt-1">Optional — leave empty for all platforms</p>
                </div>
              )}

              {/* Step 4: Tone */}
              {step === 4 && (
                <div className="grid grid-cols-2 gap-2">
                  {TONE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => toggle(tone, setTone, opt.id)}
                      className={`text-left px-4 py-3 rounded-xl border transition-all cursor-pointer font-body ${
                        tone.includes(opt.id)
                          ? "border-red bg-red/8 text-text"
                          : "border-border bg-surface-2 text-text-2 hover:border-border-2 hover:text-text"
                      }`}
                    >
                      <span className="text-[13px] font-semibold">{opt.label}</span>
                    </button>
                  ))}
                  <p className="text-text-3 text-[11px] col-span-2 mt-1">Optional — leave empty to match your natural tone</p>
                </div>
              )}

              {/* Step 5: Hook Style */}
              {step === 5 && (
                <div className="grid grid-cols-2 gap-2">
                  {HOOK_STYLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => toggle(hookStyle, setHookStyle, opt.id)}
                      className={`text-left px-4 py-3 rounded-xl border transition-all cursor-pointer font-body ${
                        hookStyle.includes(opt.id)
                          ? "border-red bg-red/8 text-text"
                          : "border-border bg-surface-2 text-text-2 hover:border-border-2 hover:text-text"
                      }`}
                    >
                      <span className="text-[13px] font-semibold">{opt.label}</span>
                    </button>
                  ))}
                  <p className="text-text-3 text-[11px] col-span-2 mt-1">Optional — leave empty for a mix</p>
                </div>
              )}

              {/* Step 6: Final Details */}
              {step === 6 && (
                <div className="space-y-4">
                  {/* CTA */}
                  <div>
                    <label className="text-text-2 text-[12px] font-semibold block mb-1.5">Call-to-Action (optional)</label>
                    <input
                      value={cta}
                      onChange={(e) => setCta(e.target.value)}
                      placeholder='e.g. "Book a free call", "Link in bio", "DM me GROWTH"'
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-[13px] font-body placeholder:text-text-3 focus:outline-none focus:border-red/40"
                    />
                  </div>

                  {/* Pillar Focus */}
                  {pillars.length > 0 && (
                    <div>
                      <label className="text-text-2 text-[12px] font-semibold block mb-1.5">Focus on these pillars (optional)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {pillars.map((p) => (
                          <button
                            key={p}
                            onClick={() => toggle(pillarFocus, setPillarFocus, p)}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all cursor-pointer font-body ${
                              pillarFocus.includes(p)
                                ? "border-red bg-red/8 text-red"
                                : "border-border bg-surface-2 text-text-2 hover:text-text"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topic Hint */}
                  <div>
                    <label className="text-text-2 text-[12px] font-semibold block mb-1.5">Topic or keyword (optional)</label>
                    <input
                      value={topicHint}
                      onChange={(e) => setTopicHint(e.target.value)}
                      placeholder="e.g. morning routines, productivity, sales objections..."
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-text text-[13px] font-body placeholder:text-text-3 focus:outline-none focus:border-red/40"
                    />
                  </div>

                  {/* Count */}
                  <div>
                    <label className="text-text-2 text-[12px] font-semibold block mb-1.5">How many ideas?</label>
                    <div className="flex gap-2">
                      {COUNT_OPTIONS.map((n) => (
                        <button
                          key={n}
                          onClick={() => setCount(n)}
                          className={`flex-1 py-2.5 rounded-xl text-[14px] font-bold border transition-all cursor-pointer font-body ${
                            count === n
                              ? "border-red bg-red/8 text-red"
                              : "border-border bg-surface-2 text-text-2 hover:text-text"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {genError && <p className="text-[#EF4444] text-[12px]">{genError}</p>}
                </div>
              )}
            </>
          )}

          {/* ── SWIPING PHASE ── */}
          {phase === "swiping" && currentIdea && (
            <div className="flex flex-col items-center">
              {/* Swipe hint indicators */}
              <div className="flex items-center justify-between w-full mb-4 px-2">
                <div className={`flex items-center gap-1.5 transition-opacity ${dragX < -30 ? "opacity-100" : "opacity-30"}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span className="text-[#EF4444] text-[11px] font-semibold">SKIP</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-opacity ${dragX > 30 ? "opacity-100" : "opacity-30"}`}>
                  <span className="text-[#10B981] text-[11px] font-semibold">KEEP</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              {/* Card */}
              <div
                ref={cardRef}
                className="w-full rounded-2xl border border-border bg-surface-2 p-5 transition-transform select-none"
                style={{
                  transform: swipeDir
                    ? `translateX(${swipeDir === "right" ? 400 : -400}px) rotate(${swipeDir === "right" ? 15 : -15}deg)`
                    : `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
                  opacity: swipeDir ? 0 : 1,
                  transition: swipeDir ? "all 0.3s ease-out" : dragX ? "none" : "all 0.2s ease",
                  cursor: "grab",
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={(e) => setTouchStart({ x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => { if (touchStart) setDragX(e.clientX - touchStart.x); }}
                onMouseUp={() => { if (Math.abs(dragX) > 80) handleSwipe(dragX > 0 ? "right" : "left"); else setDragX(0); setTouchStart(null); }}
                onMouseLeave={() => { if (touchStart) { setDragX(0); setTouchStart(null); } }}
              >
                {/* Card badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-[10px] font-bold tracking-[0.06em] uppercase py-[3px] px-[8px] rounded-md" style={{ background: "rgba(224,32,32,0.1)", color: "var(--color-red)", border: "1px solid rgba(224,32,32,0.2)" }}>
                    {currentIdea.content_type}
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.06em] uppercase py-[3px] px-[8px] rounded-md" style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.2)" }}>
                    {currentIdea.platform}
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.06em] uppercase py-[3px] px-[8px] rounded-md" style={{ background: "rgba(168,164,156,0.1)", color: "#A8A49C", border: "1px solid rgba(168,164,156,0.2)" }}>
                    {currentIdea.content_style}
                  </span>
                  {currentIdea.priority === "high" && (
                    <span className="text-[10px] font-bold tracking-[0.06em] uppercase py-[3px] px-[8px] rounded-md" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                      High Priority
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-text font-heading text-[18px] font-bold mb-2 leading-tight">{currentIdea.title}</h3>

                {/* Description */}
                <p className="text-text-2 text-[13px] leading-relaxed mb-4">{currentIdea.description}</p>

                {/* Hook preview */}
                <div className="bg-surface rounded-xl p-3.5 border border-border mb-3">
                  <div className="text-text-3 text-[10px] font-bold tracking-[0.08em] uppercase mb-1.5">Hook</div>
                  <p className="text-text text-[14px] font-medium leading-snug m-0 italic">&ldquo;{currentIdea.hook}&rdquo;</p>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-3">
                  {currentIdea.video_type && (
                    <span>Type: <span className="text-text-2">{currentIdea.video_type.replace(/_/g, " ")}</span></span>
                  )}
                  {currentIdea.pillar && (
                    <span>Pillar: <span className="text-text-2">{currentIdea.pillar}</span></span>
                  )}
                  {currentIdea.cta && (
                    <span>CTA: <span className="text-text-2">{currentIdea.cta}</span></span>
                  )}
                </div>
              </div>

              {/* Action buttons (desktop) */}
              <div className="flex items-center gap-6 mt-6">
                <button
                  onClick={() => handleSwipe("left")}
                  className="w-14 h-14 rounded-full border-2 border-[#EF4444] bg-transparent flex items-center justify-center cursor-pointer transition-all hover:bg-[rgba(239,68,68,0.1)]"
                  aria-label="Skip idea"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <button
                  onClick={() => handleSwipe("right")}
                  className="w-14 h-14 rounded-full border-2 border-[#10B981] bg-transparent flex items-center justify-center cursor-pointer transition-all hover:bg-[rgba(16,185,129,0.1)]"
                  aria-label="Keep idea"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>

              <p className="text-text-3 text-[11px] mt-3">Swipe or use arrow keys &larr; &rarr;</p>
            </div>
          )}

          {/* ── SUMMARY ── */}
          {phase === "summary" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-red/10 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-text font-heading text-[20px] font-bold mb-2">Ideas Generated!</h3>
              <p className="text-text-2 text-[14px] mb-6">
                You accepted <strong className="text-red">{accepted.length}</strong> out of {ideas.length} ideas.
                {accepted.length > 0 && " They've been added to your Idea board."}
              </p>

              <div className="flex gap-3 mb-6">
                <div className="flex-1 bg-surface-2 rounded-xl p-4">
                  <div className="text-[#10B981] font-heading text-[28px] font-bold">{accepted.length}</div>
                  <div className="text-text-3 text-[11px] font-semibold tracking-[0.06em] uppercase">Accepted</div>
                </div>
                <div className="flex-1 bg-surface-2 rounded-xl p-4">
                  <div className="text-[#EF4444] font-heading text-[28px] font-bold">{declined.length}</div>
                  <div className="text-text-3 text-[11px] font-semibold tracking-[0.06em] uppercase">Skipped</div>
                </div>
              </div>

              {accepted.length > 0 && (
                <div className="text-left mb-4">
                  <h4 className="text-text text-[13px] font-semibold mb-2">Accepted Ideas:</h4>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {accepted.map((idea, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-surface-2 rounded-lg">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-text text-[12px] truncate">{idea.title}</span>
                        <span className="text-text-3 text-[10px] shrink-0 ml-auto">{idea.platform}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setPhase("questionnaire");
                    setStep(0);
                    setIdeas([]);
                  }}
                  className="flex-1 py-3 rounded-xl text-[13px] font-semibold cursor-pointer font-body transition-all bg-surface-2 border border-border text-text-2 hover:text-text hover:border-border-2"
                >
                  Generate More
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-[13px] font-semibold cursor-pointer font-body transition-all bg-red border-none text-white hover:bg-red-light"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav (questionnaire only) */}
        {phase === "questionnaire" && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-between shrink-0">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : onClose()}
              className="text-text-3 hover:text-text bg-transparent border-none cursor-pointer text-[13px] font-semibold font-body"
            >
              {step === 0 ? "Cancel" : "Back"}
            </button>
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? "bg-red w-4" : i < step ? "bg-red/40" : "bg-surface-3"}`} />
              ))}
            </div>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance()}
                className={`py-2 px-5 rounded-xl text-[13px] font-semibold cursor-pointer font-body transition-all border-none ${
                  canAdvance()
                    ? "bg-red text-white hover:bg-red-light"
                    : "bg-surface-3 text-text-3 cursor-not-allowed"
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={generateIdeas}
                disabled={generating}
                className="py-2 px-5 rounded-xl text-[13px] font-semibold cursor-pointer font-body transition-all border-none bg-red text-white hover:bg-red-light disabled:opacity-50"
              >
                {generating ? "Generating..." : `Generate ${count} Ideas`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
