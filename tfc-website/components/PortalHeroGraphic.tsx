"use client";

import { motion } from "framer-motion";

const COLUMNS = [
  { label: "Filming", color: "bg-blue-500/20 text-blue-300", cards: 2 },
  { label: "Editing", color: "bg-purple-500/20 text-purple-300", cards: 3 },
  { label: "Review", color: "bg-yellow-500/20 text-yellow-300", cards: 1 },
  { label: "Live", color: "bg-green-500/20 text-green-300", cards: 2 },
];

const CARD_TITLES = [
  ["Brand Story Ep. 3", "Product Launch"],
  ["Q&A Cut", "Reel Pack Vol. 2", "Collab Drop"],
  ["Launch Trailer"],
  ["Weekly Vlog #14", "BTS Series"],
];

export function PortalHeroGraphic() {
  return (
    <div className="w-full h-full bg-[#0D0D0D] rounded-2xl overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red" />
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/50">TFC Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-1"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[8px] text-green-400/80 font-medium">Live</span>
          </motion.div>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-4 h-1.5 rounded-full bg-white/10" />
            ))}
          </div>
        </div>
      </div>

      {/* Month label */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-white/30">Content Board — April</span>
        <div className="flex items-center gap-1.5">
          <div className="bg-red/20 border border-red/30 rounded px-2 py-0.5">
            <span className="text-[7px] font-bold text-red uppercase tracking-wide">+ Add Card</span>
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-2 px-3 pb-3 flex-1 overflow-hidden">
        {COLUMNS.map((col, ci) => (
          <div key={col.label} className="flex-1 flex flex-col gap-1.5 min-w-0">
            {/* Column header */}
            <div className={`text-[7px] font-bold tracking-[0.1em] uppercase px-2 py-1 rounded-md ${col.color}`}>
              {col.label} · {col.cards}
            </div>
            {/* Cards */}
            {CARD_TITLES[ci].map((title, cardIdx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.1 + cardIdx * 0.08, duration: 0.4 }}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-2 flex flex-col gap-1.5 hover:border-white/20 transition-colors duration-200"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-red/25 flex-shrink-0" />
                  <span className="text-[7px] text-white/60 leading-tight truncate">{title}</span>
                </div>
                <div className="flex gap-1">
                  <div className="h-1 rounded-full bg-white/10 flex-1" />
                  <div className="h-1 rounded-full bg-white/10 w-1/2" />
                </div>
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      {/* Floating notification */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-5 right-4 bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 shadow-xl max-w-[140px]"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-4 h-4 rounded-full bg-red/30 flex items-center justify-center flex-shrink-0">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#E02020" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span className="text-[8px] font-bold text-white">Approved!</span>
        </div>
        <p className="text-[7px] text-white/40 leading-tight">Launch Trailer is ready to publish.</p>
      </motion.div>
    </div>
  );
}
