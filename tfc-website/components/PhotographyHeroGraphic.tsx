"use client";

import { motion } from "framer-motion";

const GALLERY = [
  { label: "Brand", count: 18, color: "bg-blue-500/20 text-blue-300" },
  { label: "Lifestyle", count: 24, color: "bg-pink-500/20 text-pink-300" },
  { label: "Product", count: 12, color: "bg-amber-500/20 text-amber-300" },
];

const IMAGES = [
  { w: "col-span-2", h: "row-span-2", shade: "bg-white/[0.06]" },
  { w: "col-span-1", h: "row-span-1", shade: "bg-white/[0.04]" },
  { w: "col-span-1", h: "row-span-1", shade: "bg-white/[0.05]" },
  { w: "col-span-1", h: "row-span-1", shade: "bg-white/[0.03]" },
  { w: "col-span-1", h: "row-span-1", shade: "bg-white/[0.05]" },
  { w: "col-span-1", h: "row-span-1", shade: "bg-white/[0.04]" },
  { w: "col-span-1", h: "row-span-1", shade: "bg-white/[0.06]" },
];

export function PhotographyHeroGraphic() {
  return (
    <div className="w-full h-full bg-[#0D0D0D] rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red" />
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/50">TFC Portal — Photography</span>
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
          <span className="text-[8px] text-white/40 font-medium">54 photos delivered</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 px-4 pt-3 pb-2">
        {GALLERY.map((g) => (
          <div key={g.label} className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-lg px-2.5 py-2">
            <div className="text-[10px] font-bold text-white">{g.count}</div>
            <div className={`text-[7px] mt-0.5 font-bold px-1 py-0.5 rounded inline-block ${g.color}`}>{g.label}</div>
          </div>
        ))}
        <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg px-2.5 py-2 text-center">
          <div className="text-[10px] font-bold text-green-400">48h</div>
          <div className="text-[7px] text-green-400/50 mt-0.5">Delivery</div>
        </div>
      </div>

      {/* Photo grid */}
      <div className="px-4 pb-1 flex-1">
        <div className="text-[8px] font-bold tracking-[0.12em] uppercase text-white/25 mb-2">April 2025 — Session Delivery</div>
        <div className="grid grid-cols-3 grid-rows-2 gap-1.5 h-[calc(100%-20px)]">
          {IMAGES.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, duration: 0.35, ease: "easeOut" }}
              className={`${img.shade} ${img.w} ${img.h} rounded-lg border border-white/[0.06] relative overflow-hidden`}
            >
              {/* Simulated photo grain */}
              <div className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `radial-gradient(circle at ${20 + i * 15}% ${30 + i * 10}%, rgba(255,255,255,0.08) 0%, transparent 60%)`
                }}
              />
              {i === 0 && (
                <div className="absolute bottom-1.5 left-1.5 bg-black/50 rounded px-1.5 py-0.5">
                  <span className="text-[6px] text-white/50">HERO SHOT</span>
                </div>
              )}
              {i === 0 && (
                <div className="absolute top-1.5 right-1.5 bg-green-500/20 border border-green-500/30 rounded px-1 py-0.5">
                  <span className="text-[6px] text-green-400 font-bold">✓ APPROVED</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.07] mt-auto">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-red/20 border border-red/30 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-red" />
          </div>
          <span className="text-[8px] text-white/40">48 approved · 6 pending review</span>
        </div>
        <div className="bg-red/20 border border-red/30 rounded-lg px-2.5 py-1">
          <span className="text-[7px] font-bold text-red uppercase tracking-wide">Download All</span>
        </div>
      </div>
    </div>
  );
}
