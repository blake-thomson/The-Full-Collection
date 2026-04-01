"use client";

import { FadeIn, FadeInLeft, FadeInRight } from "./AnimatedSection";
import { motion } from "framer-motion";

const VALUES = [
  {
    number: "01",
    title: "Quality Over Quantity",
    description: "Every piece of content is crafted with intention. We don't cut corners — we cut footage.",
  },
  {
    number: "02",
    title: "Full Transparency",
    description: "Our proprietary portal means you see exactly where every deliverable stands. No guesswork.",
  },
  {
    number: "03",
    title: "Creator-First",
    description: "We exist to make creators win. Your brand voice, your vision — our production muscle behind it.",
  },
  {
    number: "04",
    title: "Built to Scale",
    description: "From 15 videos a month to 45+, our systems and team scale with you as your content needs grow.",
  },
];

export function About() {
  return (
    <section id="about" className="section bg-cream">
      <div className="container-tight">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center mb-24">
          {/* Left text */}
          <FadeInLeft>
            <div className="label text-red mb-4">About Us</div>
            <h2 className="heading-lg text-warm-900 mb-6">
              The Agency Behind
              <br />
              the Creators
            </h2>
            <p className="body-lg mb-6">
              The Full Collection is a white-label content production agency built for
              creators and brands who are serious about growth. We handle the entire
              content pipeline — from scripting and shooting to editing and posting —
              so you can focus on what you do best.
            </p>
            <p className="body-md mb-8">
              Every client gets access to our proprietary client portal — a real-time
              tracking system where you can see every video move from idea to published.
              No more chasing updates. No more wondering where your content is.
            </p>
            <a href="/book" className="btn-primary no-underline">
              Book a Call
            </a>
          </FadeInLeft>

          {/* Right visual */}
          <FadeInRight>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-warm-200 to-warm-100 border border-warm-300 overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div
                      className="font-heading font-[800] tracking-[0.28em] uppercase text-4xl md:text-5xl"
                      style={{ color: "#E02020" }}
                    >
                      TFC
                    </div>
                    <div className="text-warm-600 text-sm tracking-[0.2em] uppercase mt-2">
                      Est. 2023
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl shadow-warm-200/40 border border-warm-300 p-5"
              >
                <div className="font-heading font-[800] text-2xl text-warm-900">1K+</div>
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-warm-600">
                  Videos / Month
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -top-6 -right-6 bg-white rounded-xl shadow-xl shadow-warm-200/40 border border-warm-300 p-5"
              >
                <div className="font-heading font-[800] text-2xl text-red">1B+</div>
                <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-warm-600">
                  Views Generated
                </div>
              </motion.div>
            </div>
          </FadeInRight>
        </div>

        {/* Values grid */}
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {VALUES.map((value, i) => (
              <motion.div
                key={value.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5"
              >
                <div className="font-heading font-[800] text-red/20 text-3xl leading-none">
                  {value.number}
                </div>
                <div>
                  <h3 className="heading-sm text-warm-900 mb-2">{value.title}</h3>
                  <p className="body-sm">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
