"use client";

import { motion } from "framer-motion";

export function EditingHeroGraphic() {
  return (
    <div className="w-full h-full bg-[#0D0D0D] rounded-2xl overflow-hidden flex flex-col items-center justify-center relative p-6">
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full bg-red/5 blur-3xl" />
      </div>

      {/* Rendering badge */}
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/25 rounded-full px-2.5 py-1"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span className="text-[8px] text-amber-400 font-bold tracking-widest">RENDERING</span>
      </motion.div>

      {/* Clapperboard SVG */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        <svg width="210" height="170" viewBox="0 0 210 170" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Board body */}
          <rect x="25" y="55" width="160" height="105" rx="8" fill="#161616" stroke="#2a2a2a" strokeWidth="1.5" />

          {/* Board interior — screen area */}
          <rect x="35" y="68" width="140" height="82" rx="4" fill="#0d0d0d" stroke="#1e1e1e" strokeWidth="1" />

          {/* Clapper arm (top part) */}
          <motion.g
            animate={{ rotate: [0, -18, 0] }}
            transition={{ duration: 0.15, delay: 2, repeat: Infinity, repeatDelay: 3.5, ease: "easeIn" }}
            style={{ transformOrigin: "25px 55px" }}
          >
            <rect x="25" y="30" width="160" height="28" rx="6" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.5" />
            {/* Clapper stripes */}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect
                key={i}
                x={25 + i * 23}
                y="30"
                width="11"
                height="28"
                rx={i === 0 ? "6 0 0 6" : i === 6 ? "0 6 6 0" : "0"}
                fill={i % 2 === 0 ? "#e02020" : "#1a1a1a"}
                opacity={i % 2 === 0 ? 0.85 : 1}
              />
            ))}
            {/* Hinge dots */}
            <circle cx="35" cy="58" r="3" fill="#222" stroke="#333" strokeWidth="1" />
            <circle cx="175" cy="58" r="3" fill="#222" stroke="#333" strokeWidth="1" />
          </motion.g>

          {/* Hinge line */}
          <rect x="25" y="53" width="160" height="4" rx="1" fill="#111" stroke="#252525" strokeWidth="0.5" />

          {/* Board text content */}
          <text x="44" y="86" fontSize="6" fill="#555" fontFamily="monospace">PRODUCTION</text>
          <text x="44" y="96" fontSize="9" fill="white" fontFamily="monospace" fontWeight="bold">THE FULL COLLECTION</text>

          <line x1="35" y1="102" x2="175" y2="102" stroke="#222" strokeWidth="0.5" />

          <text x="44" y="114" fontSize="6" fill="#555" fontFamily="monospace">SCENE</text>
          <text x="44" y="124" fontSize="10" fill="#e02020" fontFamily="monospace" fontWeight="bold">03</text>

          <line x1="90" y1="105" x2="90" y2="140" stroke="#222" strokeWidth="0.5" />

          <text x="100" y="114" fontSize="6" fill="#555" fontFamily="monospace">TAKE</text>
          <text x="100" y="124" fontSize="10" fill="white" fontFamily="monospace" fontWeight="bold">01</text>

          <line x1="146" y1="105" x2="146" y2="140" stroke="#222" strokeWidth="0.5" />

          <text x="152" y="114" fontSize="6" fill="#555" fontFamily="monospace">ROLL</text>
          <text x="152" y="124" fontSize="10" fill="white" fontFamily="monospace" fontWeight="bold">A</text>

          <line x1="35" y1="133" x2="175" y2="133" stroke="#222" strokeWidth="0.5" />

          {/* Director / Camera lines */}
          <text x="44" y="143" fontSize="6" fill="#555" fontFamily="monospace">DIRECTOR</text>
          <text x="110" y="143" fontSize="6" fill="#555" fontFamily="monospace">CAMERA</text>
          <text x="44" y="151" fontSize="6.5" fill="#888" fontFamily="monospace">TFC</text>
          <text x="110" y="151" fontSize="6.5" fill="#888" fontFamily="monospace">A-CAM</text>
        </svg>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex items-center gap-4 mt-2 z-10"
      >
        {[
          { label: "4K", sub: "Export" },
          { label: "24fps", sub: "Frame Rate" },
          { label: "H.265", sub: "Codec" },
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
        <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-white/30">TFC Post Production</span>
      </div>
    </div>
  );
}
