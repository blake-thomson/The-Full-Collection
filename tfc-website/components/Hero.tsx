"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Subtle animated grid background */}
      <div className="absolute inset-0 bg-grid opacity-60" />

      {/* Floating accent shapes */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] right-[10%] w-32 h-32 md:w-48 md:h-48 rounded-full bg-red/5 blur-xl"
      />
      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -2, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[20%] left-[5%] w-40 h-40 md:w-64 md:h-64 rounded-full bg-red/[0.03] blur-2xl"
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center px-5 md:px-8 pt-20">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="label mb-6 text-red"
        >
          Content Production Agency
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="heading-xl text-warm-900 mb-6"
        >
          We Build Content
          <br />
          <span className="text-red">Machines</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="body-lg max-w-2xl mx-auto mb-10"
        >
          Full-stack videography, editing, photography, and social media management.
          Powered by a proprietary portal that gives you complete visibility into every
          piece of content we produce.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <a href="/book" className="btn-primary no-underline">
            Book a Call
          </a>
          <a href="/#work" className="btn-outline no-underline">
            See Our Work
          </a>
        </motion.div>

        {/* Animated stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-12 flex flex-row justify-center items-start gap-12 md:gap-20 max-w-3xl mx-auto"
        >
          {[
            { number: "1B+", label: "Views Generated" },
            { number: "1M+", label: "Followers Built" },
            { number: "1K+", label: "Videos / Month" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
              className="text-center"
            >
              <div className="font-heading font-[800] text-3xl md:text-4xl text-warm-900">{stat.number}</div>
              <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-warm-600 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

    </section>
  );
}
