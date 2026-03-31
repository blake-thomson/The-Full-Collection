"use client";

import { FadeIn, FadeInLeft, FadeInRight } from "./AnimatedSection";
import { motion } from "framer-motion";

const PORTAL_FEATURES = [
  {
    title: "Real-Time Kanban Tracking",
    description: "Watch every video move from Idea → Filming → Editing → Review → Published. Always know where your content stands.",
  },
  {
    title: "Content Calendar",
    description: "See your entire posting schedule mapped out. Know what's going live, when, and on which platform.",
  },
  {
    title: "Direct Messaging",
    description: "Chat directly with your production team. Give feedback, share references, and approve content — all in one place.",
  },
  {
    title: "Analytics Dashboard",
    description: "Track performance across every platform. Views, engagement, growth — the numbers that matter, in real time.",
  },
  {
    title: "AI Script Writing",
    description: "Generate video scripts with our built-in AI tool. Trained on what performs, tailored to your brand voice.",
  },
  {
    title: "Brand Asset Library",
    description: "Upload logos, guidelines, and references. Your entire brand kit, accessible to the whole team.",
  },
];

export function Portal() {
  return (
    <section id="portal" className="section bg-white relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red/[0.02] to-transparent pointer-events-none" />

      <div className="container-tight relative">
        <FadeIn className="text-center mb-16">
          <div className="label text-red mb-4">Proprietary Technology</div>
          <h2 className="heading-lg text-warm-900 mb-5">
            Your Content.
            <br />
            Complete Visibility.
          </h2>
          <p className="body-lg max-w-2xl mx-auto">
            Every client gets access to our proprietary client portal — a custom-built
            tracking system where you can see every piece of content move through production
            in real time.
          </p>
        </FadeIn>

        {/* Portal mockup */}
        <FadeIn className="mb-16">
          <div className="rounded-2xl border border-warm-300 overflow-hidden shadow-2xl shadow-warm-200/30">
            {/* Window chrome */}
            <div className="bg-warm-100 border-b border-warm-300 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red/30" />
              <div className="w-3 h-3 rounded-full bg-warm-400/40" />
              <div className="w-3 h-3 rounded-full bg-warm-400/40" />
              <div className="ml-4 flex-1 max-w-sm">
                <div className="bg-white rounded-md px-3 py-1 text-[11px] text-warm-500 border border-warm-300">
                  app.thefullcollection.com/dashboard
                </div>
              </div>
            </div>

            {/* Portal content mockup */}
            <div className="bg-[#0A0A0A] p-6 md:p-10">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-8">
                <div className="font-heading font-[800] tracking-[0.28em] uppercase text-[12px]" style={{ color: "#E02020" }}>
                  THE FULL COLLECTION
                </div>
                <div className="flex gap-2">
                  {["Dashboard", "Calendar", "Messages", "Analytics"].map((tab) => (
                    <div
                      key={tab}
                      className={`py-1.5 px-3 rounded-md text-[11px] font-medium ${
                        tab === "Dashboard"
                          ? "bg-[#E02020] text-white"
                          : "text-[#A8A49C]"
                      }`}
                    >
                      {tab}
                    </div>
                  ))}
                </div>
              </div>

              {/* Kanban columns mockup */}
              <div className="flex gap-3 overflow-hidden">
                {[
                  { title: "Idea", count: 4, color: "#5A5652" },
                  { title: "Filming", count: 2, color: "#6366F1" },
                  { title: "Editing", count: 5, color: "#E02020" },
                  { title: "Review", count: 3, color: "#F59E0B" },
                  { title: "Published", count: 8, color: "#22C55E" },
                ].map((col) => (
                  <div key={col.title} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <div className="text-[11px] font-bold text-[#A8A49C] tracking-wider uppercase truncate">{col.title}</div>
                      <div className="text-[10px] text-[#5A5652] ml-auto">{col.count}</div>
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: Math.min(col.count, 3) }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="bg-[#181818] border border-[#252525] rounded-lg p-3"
                        >
                          <div className="h-2 bg-[#252525] rounded w-3/4 mb-2" />
                          <div className="h-2 bg-[#202020] rounded w-1/2" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PORTAL_FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4"
            >
              <div className="w-2 h-2 rounded-full bg-red mt-2 flex-shrink-0" />
              <div>
                <h4 className="heading-sm text-warm-900 mb-2">{feature.title}</h4>
                <p className="body-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
