"use client";

import Script from "next/script";
import { motion } from "framer-motion";

export function BookingContent() {
  return (
    <>
      {/* GHL form embed script — must load early so widget initialises correctly */}
      <Script
        src="https://link.msgsndr.com/js/form_embed.js"
        strategy="afterInteractive"
      />

      {/* Hero */}
      <section className="bg-warm-900 pt-32 pb-16 md:pt-40 md:pb-20 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-red font-heading font-[700] tracking-[0.22em] uppercase text-[11px] md:text-[13px] mb-4"
          >
            Schedule a Call
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading font-[800] uppercase tracking-[0.04em] text-white text-[40px] leading-[1.05] md:text-[64px] mb-6"
          >
            Let&apos;s Build
            <br />
            <span className="text-red">Together.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-warm-400 text-[15px] md:text-[17px] font-body font-[400] leading-relaxed max-w-xl mx-auto"
          >
            Pick a time that works for you. We&apos;ll talk about your brand,
            your content goals, and exactly what The Full Collection can build
            for you.
          </motion.p>
        </div>
      </section>

      {/* Calendar embed */}
      <section className="bg-warm-100 py-12 md:py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl"
        >
          <iframe
            src="https://api.leadconnectorhq.com/widget/booking/Ebr4Ha96LRvTPKqUdkp6"
            style={{ width: "100%", border: "none", overflow: "hidden", minHeight: "800px", display: "block" }}
            scrolling="no"
            id="Ebr4Ha96LRvTPKqUdkp6_1775013514055"
            title="Book a call with The Full Collection"
          />
        </motion.div>
      </section>

      {/* Trust strip */}
      <section className="bg-warm-900 py-10 px-5 border-t border-warm-800">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-center">
          {[
            { label: "Nashville-based team", icon: "📍" },
            { label: "No long-term contracts", icon: "✅" },
            { label: "Results in 30 days", icon: "⚡" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-warm-300 font-body font-[500] text-[14px] tracking-wide uppercase">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
