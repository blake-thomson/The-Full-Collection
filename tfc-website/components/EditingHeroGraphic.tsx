"use client";

import { motion } from "framer-motion";

const TRACKS = [
  {
    label: "VIDEO",
    color: "bg-red/30 border-red/40",
    clips: [
      { w: "w-20", shade: "bg-red/25", label: "Intro" },
      { w: "w-10", shade: "bg-red/15", label: "" },
      { w: "w-24", shade: "bg-red/25", label: "Main" },
      { w: "w-8", shade: "bg-red/15", label: "" },
      { w: "w-14", shade: "bg-red/20", label: "CTA" },
    ],
  },
  {
    label: "B-ROLL",
    color: "bg-blue-500/20 border-blue-500/30",
    clips: [
      { w: "w-6", shade: "bg-blue-500/20", label: "" },
      { w: "w-16", shade: "bg-blue-500/30", label: "Office" },
      { w: "w-6", shade: "bg-blue-500/15", label: "" },
      { w: "w-20", shade: "bg-blue-500/25", label: "Product" },
      { w: "w-10", shade: "bg-blue-500/20", label: "" },
    ],
  },
  {
    label: "MUSIC",
    color: "bg-purple-500/20 border-purple-500/30",
    clips: [
      { w: "w-full", shade: "bg-purple-500/15", label: "Background Track" },
    ],
  },
  {
    label: "SFX",
    color: "bg-amber-500/20 border-amber-500/30",
    clips: [
      { w: "w-3", shade: "bg-amber-500/30", label: "" },
      { w: "w-2", shade: "bg-amber-500/20", label: "" },
      { w: "w-4", shade: "bg-amber-500/30", label: "" },
      { w: "w-2", shade: "bg-amber-500/20", label: "" },
      { w: "w-3", shade: "bg-amber-500/30", label: "" },
    ],
  },
];

const PANELS = [
  { label: "Color", value: "Applied", dot: "bg-green-400" },
  { label: "Captions", value: "On", dot: "bg-green-400" },
  { label: "Export", value: "4K · H.264", dot: "bg-blue-400" },
];

export function EditingHeroGraphic() {
  return (
    <div className="w-full h-full bg-[#0D0D0D] rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red" />
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/50">TFC Portal — Editing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="text-[8px] text-amber-400 font-bold"
          >
            ● RENDERING
          </motion.div>
        </div>
      </div>

      {/* Preview frame */}
      <div className="mx-4 mt-3 mb-2">
        <div
          className="relative bg-[#111] border border-white/10 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ aspectRatio: "16/9" }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{
              background: "linear-gradient(135deg, #1a0000 0%, #000 50%, #00001a 100%)"
            }}
          />
          {/* Simulated video frame content */}
          <div className="flex flex-col items-center gap-1 z-10">
            <div className="w-16 h-1 bg-white/10 rounded" />
            <div className="w-10 h-1 bg-white/6 rounded" />
          </div>
          {/* Timecode */}
          <div className="absolute bottom-1.5 left-2 font-mono text-[7px] text-white/40">00:01:24:12</div>
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 10 10" fill="rgba(255,255,255,0.6)">
                <polygon points="3,1 9,5 3,9" />
              </svg>
            </div>
          </div>
          {/* Grade badge */}
          <div className="absolute top-1.5 right-1.5 bg-purple-500/20 border border-purple-500/30 rounded px-1.5 py-0.5">
            <span className="text-[6px] text-purple-300 font-bold">GRADED</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4 flex-1 overflow-hidden">
        <div className="text-[8px] font-bold tracking-[0.12em] uppercase text-white/25 mb-1.5">Timeline</div>
        <div className="flex flex-col gap-1">
          {TRACKS.map((track, i) => (
            <motion.div
              key={track.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className="flex items-center gap-1.5 h-5"
            >
              <div className={`text-[6px] font-bold tracking-wide w-8 flex-shrink-0 text-right ${track.color.includes("red") ? "text-red/60" : track.color.includes("blue") ? "text-blue-400/60" : track.color.includes("purple") ? "text-purple-400/60" : "text-amber-400/60"}`}>
                {track.label}
              </div>
              <div className="flex-1 flex items-center gap-0.5 h-full">
                {track.clips.map((clip, j) => (
                  <div
                    key={j}
                    className={`h-full ${clip.w} ${clip.shade} rounded-sm border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0`}
                  >
                    {clip.label && (
                      <span className="text-[5px] text-white/40 truncate px-0.5">{clip.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-white/[0.07] mt-2">
        {PANELS.map((p) => (
          <div key={p.label} className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 py-1">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.dot}`} />
            <span className="text-[7px] text-white/40">{p.label}:</span>
            <span className="text-[7px] text-white/60 font-bold">{p.value}</span>
          </div>
        ))}
        <div className="ml-auto bg-red/20 border border-red/30 rounded-lg px-2 py-1">
          <span className="text-[7px] font-bold text-red uppercase tracking-wide">Export</span>
        </div>
      </div>
    </div>
  );
}
