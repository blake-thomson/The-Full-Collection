"use client";

import { motion } from "framer-motion";

export function PhotographyHeroGraphic() {
  return (
    <div className="w-full h-full bg-[#0D0D0D] rounded-2xl overflow-hidden flex flex-col items-center justify-center relative p-6">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full bg-red/5 blur-3xl" />
      </div>

      {/* Flash burst indicator */}
      <motion.div
        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/25 rounded-full px-2.5 py-1"
      >
        <span className="text-[9px] text-amber-400 font-bold tracking-widest">⚡ FLASH</span>
      </motion.div>

      {/* Camera SVG — mirrorless style, front-facing */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        <svg width="200" height="165" viewBox="0 0 200 165" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body */}
          <rect x="20" y="45" width="160" height="100" rx="12" fill="#161616" stroke="#2a2a2a" strokeWidth="1.5" />

          {/* Top plate */}
          <rect x="20" y="45" width="160" height="18" rx="12" fill="#1c1c1c" stroke="#2a2a2a" strokeWidth="1.5" />
          <rect x="20" y="52" width="160" height="11" fill="#1c1c1c" />

          {/* Viewfinder hump */}
          <rect x="65" y="28" width="70" height="22" rx="8" fill="#161616" stroke="#2a2a2a" strokeWidth="1.5" />
          <rect x="65" y="38" width="70" height="12" fill="#161616" />
          {/* Viewfinder glass */}
          <rect x="73" y="32" width="54" height="14" rx="4" fill="#0a0a12" stroke="#1a1a2a" strokeWidth="1" />
          <motion.rect
            x="73" y="32" width="54" height="14" rx="4"
            fill="none"
            stroke="#3b3b6a"
            strokeWidth="0.5"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />

          {/* Shutter button */}
          <circle cx="155" cy="53" r="7" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
          <circle cx="155" cy="53" r="4.5" fill="#111" />
          <motion.circle
            cx="155" cy="53" r="4.5"
            fill="none"
            stroke="#e02020"
            strokeWidth="0.5"
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          />

          {/* Mode dial */}
          <circle cx="45" cy="53" r="9" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
          <circle cx="45" cy="53" r="6" fill="#141414" />
          {/* Mode markers */}
          {["A", "S", "M", "P"].map((m, i) => {
            const angle = (i * 90 - 45) * (Math.PI / 180);
            return (
              <text key={m} x={45 + 4 * Math.cos(angle)} y={53 + 4 * Math.sin(angle) + 1} fontSize="2.5" fill={m === "M" ? "#e02020" : "#555"} textAnchor="middle" fontWeight="bold">{m}</text>
            );
          })}

          {/* Lens — larger, centered */}
          {/* Lens mount ring */}
          <circle cx="100" cy="100" r="44" fill="#111" stroke="#252525" strokeWidth="2" />
          {/* Lens barrel */}
          <circle cx="100" cy="100" r="38" fill="#0e0e0e" stroke="#2a2a2a" strokeWidth="1.5" />
          {/* Focus ring grooves */}
          {[34, 30, 26].map((r, i) => (
            <circle key={i} cx="100" cy="100" r={r} fill="none" stroke="#1e1e1e" strokeWidth="1" />
          ))}
          {/* Aperture blades */}
          <circle cx="100" cy="100" r="20" fill="#080c10" stroke="#1a2030" strokeWidth="1" />
          {/* Inner glass */}
          <circle cx="100" cy="100" r="15" fill="#050810" />
          {/* Glass sheen */}
          <motion.circle
            cx="100" cy="100" r="15"
            fill="none"
            stroke="url(#photoLensGlow)"
            strokeWidth="1.5"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Lens highlight */}
          <ellipse cx="93" cy="93" rx="5" ry="3" fill="white" opacity="0.07" transform="rotate(-30 93 93)" />
          <ellipse cx="91" cy="91" rx="2" ry="1.5" fill="white" opacity="0.12" transform="rotate(-30 91 91)" />

          {/* Lens mount screws */}
          {[0, 72, 144, 216, 288].map((angle) => {
            const rad = angle * (Math.PI / 180);
            return <circle key={angle} cx={100 + 41 * Math.cos(rad)} cy={100 + 41 * Math.sin(rad)} r="1.5" fill="#1e1e1e" stroke="#2a2a2a" strokeWidth="0.5" />;
          })}

          {/* Hot shoe rail */}
          <rect x="78" y="27" width="44" height="5" rx="1.5" fill="#1a1a1a" stroke="#222" strokeWidth="0.5" />

          {/* Card/port door */}
          <rect x="160" y="80" width="12" height="30" rx="3" fill="#131313" stroke="#222" strokeWidth="0.5" />

          {/* Defs */}
          <defs>
            <radialGradient id="photoLensGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#e02020" stopOpacity="0.15" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Camera settings row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex items-center gap-4 mt-3 z-10"
      >
        {[
          { label: "f/1.8", sub: "Aperture" },
          { label: "1/500", sub: "Shutter" },
          { label: "ISO 100", sub: "Sensitivity" },
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
        <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-white/30">TFC Photography</span>
      </div>
    </div>
  );
}
