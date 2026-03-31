"use client";

import { motion } from "framer-motion";

export function VideographyHeroGraphic() {
  return (
    <div className="w-full h-full bg-[#0D0D0D] rounded-2xl overflow-hidden flex flex-col items-center justify-center relative p-6">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full bg-red/5 blur-3xl" />
      </div>

      {/* REC badge */}
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-4 right-4 flex items-center gap-1.5 bg-red/15 border border-red/30 rounded-full px-2.5 py-1"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-red" />
        <span className="text-[8px] text-red font-bold tracking-widest">REC</span>
      </motion.div>

      {/* Camera SVG */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        <svg width="220" height="160" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Camera body */}
          <rect x="30" y="52" width="160" height="88" rx="10" fill="#1a1a1a" stroke="#333" strokeWidth="1.5" />

          {/* Top hump (viewfinder bump) */}
          <rect x="72" y="36" width="60" height="22" rx="6" fill="#1a1a1a" stroke="#333" strokeWidth="1.5" />

          {/* Hot shoe */}
          <rect x="86" y="30" width="32" height="8" rx="2" fill="#222" stroke="#2a2a2a" strokeWidth="1" />

          {/* Lens barrel outer */}
          <circle cx="110" cy="96" r="36" fill="#111" stroke="#2a2a2a" strokeWidth="2" />
          {/* Lens barrel ring */}
          <circle cx="110" cy="96" r="30" fill="#0a0a0a" stroke="#333" strokeWidth="1.5" />
          {/* Lens glass inner */}
          <circle cx="110" cy="96" r="22" fill="#080d14" stroke="#1a2a3a" strokeWidth="1" />
          {/* Lens reflection */}
          <circle cx="110" cy="96" r="16" fill="#070b12" />
          <motion.circle
            cx="110" cy="96" r="16"
            fill="none"
            stroke="url(#lensGlow)"
            strokeWidth="2"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Lens sheen */}
          <ellipse cx="103" cy="89" rx="5" ry="3" fill="white" opacity="0.06" transform="rotate(-30 103 89)" />
          <ellipse cx="100" cy="86" rx="2" ry="1.5" fill="white" opacity="0.1" transform="rotate(-30 100 86)" />

          {/* Lens mount screws */}
          {[0, 90, 180, 270].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x = 110 + 26 * Math.cos(rad);
            const y = 96 + 26 * Math.sin(rad);
            return <circle key={angle} cx={x} cy={y} r="1.5" fill="#222" stroke="#333" strokeWidth="0.5" />;
          })}

          {/* Shutter button */}
          <circle cx="168" cy="52" r="8" fill="#222" stroke="#333" strokeWidth="1" />
          <circle cx="168" cy="52" r="5" fill="#1a1a1a" />

          {/* Mode dial */}
          <circle cx="52" cy="52" r="10" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
          <line x1="52" y1="44" x2="52" y2="48" stroke="#e02020" strokeWidth="1.5" strokeLinecap="round" />

          {/* Viewfinder eyepiece */}
          <rect x="80" y="38" width="44" height="12" rx="3" fill="#111" stroke="#2a2a2a" strokeWidth="1" />

          {/* LCD screen on back — small indicator */}
          <rect x="148" y="70" width="30" height="20" rx="3" fill="#050f1a" stroke="#1a2a3a" strokeWidth="1" />
          <motion.rect
            x="151" y="73" width="24" height="14" rx="2"
            fill="none"
            stroke="#e02020"
            strokeWidth="0.5"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />

          {/* Grip texture lines */}
          {[0, 3, 6].map((i) => (
            <line key={i} x1={36 + i} y1="62" x2={36 + i} y2="130" stroke="#222" strokeWidth="0.8" strokeLinecap="round" />
          ))}

          {/* Defs */}
          <defs>
            <radialGradient id="lensGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#e02020" stopOpacity="0.2" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex items-center gap-4 mt-4 z-10"
      >
        {[
          { label: "4K", sub: "Resolution" },
          { label: "60fps", sub: "Frame Rate" },
          { label: "RAW", sub: "Format" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-white font-heading font-[800] text-sm tracking-wide">{s.label}</div>
            <div className="text-white/30 text-[9px] uppercase tracking-widest">{s.sub}</div>
          </div>
        ))}
      </motion.div>

      {/* Bottom label */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-red" />
        <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-white/30">TFC Production</span>
      </div>
    </div>
  );
}
