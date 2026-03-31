"use client";

import { motion } from "framer-motion";

const SHOTS = [
  { id: "01", label: "Intro — Talking Head", status: "filmed", duration: "0:45" },
  { id: "02", label: "Product Hero Shot", status: "filmed", duration: "0:30" },
  { id: "03", label: "B-Roll — Office Walk", status: "filming", duration: "1:15" },
  { id: "04", label: "CTA Close", status: "queued", duration: "0:20" },
  { id: "05", label: "Lifestyle — Outdoor", status: "queued", duration: "0:55" },
];

const STATUS_STYLE: Record<string, string> = {
  filmed: "bg-green-500/15 text-green-400",
  filming: "bg-red/20 text-red",
  queued: "bg-white/8 text-white/30",
};

export function VideographyHeroGraphic() {
  return (
    <div className="w-full h-full bg-[#0D0D0D] rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red" />
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/50">TFC Portal — Production</span>
        </div>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-1.5 bg-red/15 border border-red/30 rounded-full px-2 py-0.5"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-red" />
          <span className="text-[8px] text-red font-bold tracking-wide">REC</span>
        </motion.div>
      </div>

      {/* Shoot day info */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2">
          <div className="text-[7px] text-white/30 uppercase tracking-wide mb-0.5">Shoot Day</div>
          <div className="text-[10px] font-bold text-white">April 2025 — Day 1</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] font-bold text-white">5</div>
          <div className="text-[7px] text-white/30 mt-0.5">Shots</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-center">
          <div className="text-[10px] font-bold text-green-400">2</div>
          <div className="text-[7px] text-green-400/50 mt-0.5">Done</div>
        </div>
      </div>

      {/* Camera viewfinder */}
      <div className="mx-4 mb-3">
        <motion.div
          className="relative bg-[#111] border border-white/10 rounded-xl overflow-hidden"
          style={{ aspectRatio: "16/9" }}
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "33.33% 33.33%"
            }}
          />
          {/* Center cross */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-px bg-red/60" />
            <div className="absolute w-px h-3 bg-red/60" />
          </div>
          {/* Corner brackets */}
          {[["top-2 left-2", "border-t border-l"], ["top-2 right-2", "border-t border-r"], ["bottom-2 left-2", "border-b border-l"], ["bottom-2 right-2", "border-b border-r"]].map(([pos, border]) => (
            <div key={pos} className={`absolute w-3 h-3 ${pos} ${border} border-white/40`} />
          ))}
          {/* Scene label */}
          <div className="absolute bottom-2 left-2 bg-black/60 rounded px-1.5 py-0.5">
            <span className="text-[7px] text-white/60 font-mono">SCENE 03 / TAKE 1</span>
          </div>
          {/* Focus indicator */}
          <motion.div
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute top-2 right-2 text-[7px] text-green-400 font-bold"
          >
            AF ●
          </motion.div>
        </motion.div>
      </div>

      {/* Shot list */}
      <div className="px-4 pb-3 flex-1 overflow-hidden">
        <div className="text-[8px] font-bold tracking-[0.12em] uppercase text-white/25 mb-2">Shot List</div>
        <div className="flex flex-col gap-1">
          {SHOTS.map((shot, i) => (
            <motion.div
              key={shot.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] rounded-lg px-2.5 py-1.5"
            >
              <span className="text-[7px] text-white/20 font-mono w-4 flex-shrink-0">{shot.id}</span>
              <span className="text-[8px] text-white/60 flex-1 truncate">{shot.label}</span>
              <span className="text-[6px] text-white/20 flex-shrink-0 font-mono">{shot.duration}</span>
              <span className={`text-[6px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0 ${STATUS_STYLE[shot.status]}`}>
                {shot.status}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
