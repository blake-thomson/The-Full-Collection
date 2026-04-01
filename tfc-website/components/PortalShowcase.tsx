"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FadeIn, FadeInLeft, FadeInRight } from "./AnimatedSection";

interface ShowcaseFeature {
  label: string;
  title: string;
  description: string;
  screenshot?: string; // Set to "/portal/feature-name.png" when real screenshots are available
  mockup: React.ReactNode;
}

/* ─── Mockup: Content Board ─── */
const BoardMockup = () => (
  <div className="w-full h-full bg-[#0F0F0F] rounded-xl p-4 overflow-hidden">
    <div className="flex gap-3 h-full overflow-x-auto pb-2">
      {[
        { col: "Idea", color: "bg-warm-700", cards: ["Brand Story Video", "Product Reveal"] },
        { col: "Filming", color: "bg-blue-900/60", cards: ["Weekly Vlog #12"] },
        { col: "Editing", color: "bg-purple-900/60", cards: ["Behind the Scenes", "Q&A Video"] },
        { col: "Review", color: "bg-yellow-900/60", cards: ["Launch Trailer"] },
        { col: "Approved", color: "bg-green-900/60", cards: ["Collab Drop", "Reel Series"] },
      ].map((col) => (
        <div key={col.col} className="flex-shrink-0 w-36">
          <div className={`text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-1 rounded mb-2 ${col.color} text-white/70`}>
            {col.col}
          </div>
          <div className="flex flex-col gap-1.5">
            {col.cards.map((card) => (
              <div key={card} className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2">
                <div className="w-4 h-4 rounded bg-red/30 mb-1.5" />
                <div className="text-[8px] text-white/70 leading-tight">{card}</div>
                <div className="flex gap-1 mt-1.5">
                  <div className="w-8 h-1 rounded-full bg-white/10" />
                  <div className="w-5 h-1 rounded-full bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Mockup: Content Calendar ─── */
const CalendarMockup = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const events: Record<number, { label: string; platform: string; color: string }[]> = {
    1: [{ label: "YouTube Video", platform: "YT", color: "bg-red/40" }],
    3: [{ label: "Instagram Reel", platform: "IG", color: "bg-pink-800/50" }],
    4: [{ label: "TikTok Drop", platform: "TT", color: "bg-purple-800/50" }],
    6: [{ label: "Long-Form Post", platform: "YT", color: "bg-red/40" }, { label: "Story Series", platform: "IG", color: "bg-pink-800/50" }],
  };
  return (
    <div className="w-full h-full bg-[#0F0F0F] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-bold text-white/60 uppercase tracking-widest">April 2025</div>
        <div className="flex gap-1">
          <div className="w-12 h-4 rounded bg-white/5 border border-white/10" />
          <div className="w-12 h-4 rounded bg-red/20 border border-red/30 flex items-center justify-center">
            <span className="text-[7px] text-red font-bold">+ Add</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <div key={d} className="text-[7px] text-white/30 text-center font-bold tracking-wide pb-1">{d}</div>
        ))}
        {Array.from({ length: 28 }, (_, i) => (
          <div key={i} className="aspect-square rounded-md bg-white/[0.03] border border-white/5 p-0.5 flex flex-col gap-0.5">
            <span className="text-[6px] text-white/30">{i + 1}</span>
            {events[i]?.map((e) => (
              <div key={e.label} className={`rounded px-0.5 ${e.color}`}>
                <span className="text-[5px] text-white/70 leading-none block truncate">{e.platform}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Mockup: Idea Generator (Tinder-style) — exported for reuse ─── */
export const IdeaMockup = () => (
  <div className="w-full h-full bg-[#0F0F0F] rounded-xl p-4 flex flex-col items-center justify-center">
    <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-white/40 mb-3">Content Idea Generator</div>
    <div className="relative w-48 h-48">
      {/* Back card */}
      <div className="absolute inset-0 bg-warm-800/50 border border-white/10 rounded-2xl rotate-6 scale-95" />
      <div className="absolute inset-0 bg-warm-800/70 border border-white/10 rounded-2xl rotate-3 scale-97" />
      {/* Front card */}
      <div className="absolute inset-0 bg-gradient-to-br from-warm-800 to-[#1a1a1a] border border-white/15 rounded-2xl p-4 flex flex-col">
        <div className="bg-red/20 border border-red/30 rounded-lg px-2 py-1 self-start mb-3">
          <span className="text-[8px] text-red font-bold uppercase tracking-wide">New Idea</span>
        </div>
        <div className="text-white text-[11px] font-bold leading-tight mb-2">
          "Day In The Life Behind the Camera"
        </div>
        <div className="text-white/40 text-[8px] leading-relaxed">
          Show your audience what production actually looks like. High engagement format, great for growth.
        </div>
        <div className="mt-auto flex gap-1">
          <div className="bg-white/5 rounded px-1.5 py-0.5 text-[7px] text-white/40">YouTube</div>
          <div className="bg-white/5 rounded px-1.5 py-0.5 text-[7px] text-white/40">TikTok</div>
        </div>
      </div>
    </div>
    {/* Swipe buttons */}
    <div className="flex gap-4 mt-4">
      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
      <div className="w-10 h-10 rounded-full bg-red/20 border border-red/30 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E02020" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </div>
  </div>
);

/* ─── Mockup: Messenger ─── */
const MessengerMockup = () => (
  <div className="w-full h-full bg-[#0F0F0F] rounded-xl p-4 flex flex-col">
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
      <div className="w-7 h-7 rounded-full bg-red/30 flex items-center justify-center">
        <span className="text-[8px] font-bold text-red">TFC</span>
      </div>
      <div>
        <div className="text-[10px] font-bold text-white">Production Team</div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[8px] text-white/40">Online</span>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-2 flex-1 overflow-hidden">
      <div className="self-start max-w-[75%] bg-white/8 border border-white/10 rounded-2xl rounded-tl-sm px-3 py-2">
        <p className="text-[8px] text-white/70 leading-relaxed">Your Week 3 videos are moving into editing now. Should be ready for review by Thursday.</p>
      </div>
      <div className="self-end max-w-[75%] bg-red/20 border border-red/20 rounded-2xl rounded-tr-sm px-3 py-2">
        <p className="text-[8px] text-white/80 leading-relaxed">Perfect! Can we add a CTA at the end of the main video?</p>
      </div>
      <div className="self-start max-w-[75%] bg-white/8 border border-white/10 rounded-2xl rounded-tl-sm px-3 py-2">
        <p className="text-[8px] text-white/70 leading-relaxed">Absolutely — noted. We'll add it before final export.</p>
      </div>
      <div className="self-end max-w-[75%] bg-red/20 border border-red/20 rounded-2xl rounded-tr-sm px-3 py-2">
        <p className="text-[8px] text-white/80 leading-relaxed">🔥 let's go</p>
      </div>
    </div>
    <div className="mt-3 flex gap-2 items-center">
      <div className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
        <span className="text-[8px] text-white/20">Type a message...</span>
      </div>
      <div className="w-7 h-7 rounded-full bg-red flex items-center justify-center flex-shrink-0">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </div>
    </div>
  </div>
);

const FEATURES: ShowcaseFeature[] = [
  {
    label: "Content Board",
    title: "Real-Time Production Tracker",
    description: "Every piece of content is a card moving through 10 stages — from Idea all the way to Published. You see exactly where everything stands, in real time, without asking anyone.",
    mockup: <BoardMockup />,
  },
  {
    label: "Content Calendar",
    title: "Full Monthly Calendar",
    description: "See every scheduled post for the month — platform, publish date, and status — all in one view. Automatically synced with your kanban board so nothing falls through the cracks.",
    mockup: <CalendarMockup />,
  },
  {
    label: "Idea Generator",
    title: "Tinder-Style Content Ideas",
    description: "Our AI generates content ideas tailored to your brand and audience. Swipe through, approve what you love, and it goes straight into production — no briefs, no back and forth.",
    mockup: <IdeaMockup />,
  },
  {
    label: "Messenger",
    title: "Direct Line to Your Team",
    description: "Message your production team directly inside the portal. Share feedback, request changes, and stay in the loop — all in one thread tied to your account.",
    mockup: <MessengerMockup />,
  },
];

// Dark section header — shown once above all features
function PortalHeader() {
  return (
    <section className="py-20 px-5 md:px-8 bg-[#0A0A0A]">
      <FadeIn className="text-center">
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-red mb-3">Inside the Portal</div>
        <h2 className="font-heading font-[800] uppercase text-white tracking-[0.04em] leading-[1.05]"
          style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)" }}>
          See It in Action
        </h2>
        <p className="text-warm-500 text-base leading-relaxed max-w-xl mx-auto mt-4">
          Every feature is built specifically for content production. Here&apos;s what you get access to from day one.
        </p>
      </FadeIn>
    </section>
  );
}

export function PortalShowcase() {
  return (
    <>
      <PortalHeader />
      {FEATURES.map((feature, i) => {
        const flip = i % 2 === 1;
        return (
          <section
            key={feature.label}
            className="py-16 md:py-20 px-5 md:px-8 bg-[#0A0A0A] border-t border-white/[0.06] overflow-hidden"
          >
            <div className="container-tight">
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${flip ? "lg:grid-flow-dense" : ""}`}>
                {/* Label + title — compact */}
                <motion.div
                  initial={{ opacity: 0, x: flip ? 24 : -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className={flip ? "lg:col-start-2" : ""}
                >
                  <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-red mb-2">{feature.label}</div>
                  <h3
                    className="font-heading font-[800] uppercase text-white tracking-[0.04em] leading-[1.05] mb-3"
                    style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.8rem)" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-warm-500 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>

                {/* Mockup — bigger, more prominent */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative ${flip ? "lg:col-start-1 lg:row-start-1" : ""}`}
                >
                  <div
                    className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
                    style={{ aspectRatio: "16/10" }}
                  >
                    {feature.screenshot ? (
                      <Image
                        src={feature.screenshot}
                        alt={feature.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full">
                        {feature.mockup}
                      </div>
                    )}
                  </div>
                  <div className="absolute -inset-4 bg-red/5 rounded-3xl blur-2xl -z-10" />
                </motion.div>
              </div>
            </div>
          </section>
        );
      })}

    </>
  );
}
