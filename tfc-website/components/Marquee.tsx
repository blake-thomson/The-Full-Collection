"use client";

import { motion } from "framer-motion";

const WORDS = [
  "Videography",
  "Photography",
  "Editing",
  "Social Media",
  "Strategy",
  "Content",
  "Production",
  "Creative",
  "Storytelling",
  "Branding",
];

export function Marquee() {
  return (
    <div className="relative overflow-hidden py-6 bg-warm-900">
      <motion.div
        animate={{ x: [0, -1920] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex gap-8 whitespace-nowrap"
      >
        {[...WORDS, ...WORDS, ...WORDS, ...WORDS].map((word, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-heading font-[800] text-white/10 text-2xl md:text-3xl tracking-[0.1em] uppercase">
              {word}
            </span>
            <span className="w-2 h-2 rounded-full bg-red/40 flex-shrink-0" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
