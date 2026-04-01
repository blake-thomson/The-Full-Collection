"use client";

import { FadeIn } from "./AnimatedSection";
import { motion } from "framer-motion";

interface VSLProps {
  /** YouTube or Vimeo embed URL. If omitted, shows a placeholder. */
  videoUrl?: string;
}

export function VSL({ videoUrl }: VSLProps = {}) {
  return (
    <section id="vsl" className="section bg-warm-900 overflow-hidden">
      <div className="container-tight">
        <FadeIn className="text-center mb-10">
          <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-red-light mb-4">
            Watch First
          </div>
          <h2 className="font-heading font-[800] uppercase text-white tracking-[0.04em] leading-[1.05]"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            See What
            <br />
            We Build
            <br />
            <span className="text-red">For Our
            <br />
            Clients</span>
          </h2>
          <p className="text-warm-400 text-base leading-relaxed max-w-xl mx-auto mt-4">
            Watch how The Full Collection takes brands from zero to a full content machine —
            and what it looks like to work with us.
          </p>
        </FadeIn>

        {/* Video container */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40"
            style={{ aspectRatio: "16 / 9" }}>
            {videoUrl ? (
              <iframe
                src={videoUrl}
                title="The Full Collection — Video Sales Letter"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              /* Placeholder — replace with real videoUrl when ready */
              <div className="absolute inset-0 bg-warm-800 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-red/20 border border-red/30 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="#E02020">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </motion.div>
                </div>
                <div className="text-center">
                  <div className="text-white font-heading font-[800] uppercase tracking-[0.06em] text-sm">
                    Video Coming Soon
                  </div>
                  <div className="text-warm-500 text-xs mt-1">
                    Pass a <code className="text-red/80">videoUrl</code> prop to embed your VSL
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Glow effect */}
          <div className="absolute -inset-4 bg-red/5 rounded-3xl blur-2xl -z-10" />
        </motion.div>

        {/* CTA below video */}
        <FadeIn className="text-center mt-10">
          <a href="/book" className="btn-primary no-underline">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Book a Call
          </a>
        </FadeIn>
      </div>
    </section>
  );
}
