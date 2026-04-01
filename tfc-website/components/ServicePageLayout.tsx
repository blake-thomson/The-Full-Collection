"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { FadeIn, FadeInLeft, FadeInRight, StaggerContainer, StaggerItem } from "./AnimatedSection";

export interface ServiceIncluded {
  title: string;
  description: string;
}

export interface ServiceStep {
  number: string;
  title: string;
  description: string;
}

export interface ServiceTier {
  name: "Starter" | "Core" | "Premium";
  included: boolean;
  note?: string;
}

export interface ServicePageData {
  label: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  /** Optional hero media — image or video replaces the animated icon placeholder */
  heroMedia?: { type: "image"; src: string; alt?: string } | { type: "video"; src: string };
  /** Fully custom right-column visual — overrides heroMedia and the default icon */
  heroVisual?: React.ReactNode;
  includes: ServiceIncluded[];
  process: ServiceStep[];
  tiers: ServiceTier[];
  deliverables: string[];
  faq?: { question: string; answer: string }[];
}

const TIER_PRICES = {
  Starter: "$3,000/mo",
  Core: "$5,000/mo",
  Premium: "$7,500/mo",
};

export function ServicePageLayout({ data, hideCta, afterHeroSlot }: { data: ServicePageData; hideCta?: boolean; afterHeroSlot?: React.ReactNode }) {
  return (
    <div className="pt-16 md:pt-20">

      {/* ─── Hero ─── */}
      <section className="section pb-0 overflow-hidden bg-cream border-b border-warm-200">
        <div className="container-tight">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] text-warm-500 font-medium tracking-wide mb-10">
            <Link href="/" className="hover:text-warm-800 transition-colors no-underline">Home</Link>
            <span>/</span>
            <Link href="/#services" className="hover:text-warm-800 transition-colors no-underline">Services</Link>
            <span>/</span>
            <span className="text-warm-700">{data.label}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: text */}
            <FadeInLeft className="min-w-0">
              <div className="label text-red mb-4">{data.label}</div>
              <h1 className="font-heading font-[800] uppercase tracking-tight leading-[1.05] text-warm-900 mb-5"
                style={{ fontSize: "clamp(1.3rem, 2.2vw, 1.9rem)" }}>
                {data.title}
              </h1>
              <p className="text-lg text-warm-600 leading-relaxed mb-4">{data.subtitle}</p>
              <p className="text-base text-warm-600 leading-relaxed mb-8">{data.description}</p>
              <div className="flex flex-wrap gap-3">
                <a href="/book" className="btn-primary no-underline">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Book a Call
                </a>
                <Link href="/#pricing" className="btn-outline no-underline">See Pricing</Link>
              </div>
            </FadeInLeft>

            {/* Right: visual — desktop only */}
            <FadeInRight className="hidden lg:block">
              <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-warm-300 relative"
                style={{ aspectRatio: data.heroMedia?.type === "video" ? "16/9" : "1/1" }}>
                {data.heroMedia?.type === "image" ? (
                  <Image
                    src={data.heroMedia.src}
                    alt={data.heroMedia.alt ?? data.title}
                    fill
                    className="object-cover"
                  />
                ) : data.heroMedia?.type === "video" ? (
                  <iframe
                    src={data.heroMedia.src}
                    title={data.title}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : data.heroVisual ? (
                  <div className="w-full h-full">{data.heroVisual}</div>
                ) : (
                  /* Default animated placeholder */
                  <div className="w-full h-full bg-gradient-to-br from-warm-200 to-warm-100 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-grid opacity-40" />
                    <motion.div
                      animate={{ scale: [1, 1.05, 1], rotate: [0, 2, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="relative z-10 w-24 h-24 rounded-2xl bg-white border border-warm-300 shadow-xl shadow-warm-200/50 flex items-center justify-center text-red"
                    >
                      {data.icon}
                    </motion.div>
                  </div>
                )}
              </div>
            </FadeInRight>
          </div>
        </div>
      </section>

      {afterHeroSlot}

      {/* ─── What's Included ─── */}
      <section className="py-20 md:py-28 px-5 md:px-8 bg-white">
        <div className="container-tight">
          <FadeIn className="mb-12">
            <div className="label text-red mb-3">What&apos;s Included</div>
            <h2 className="font-heading font-[800] uppercase text-warm-900 text-3xl md:text-4xl tracking-[0.04em]">Everything You Get</h2>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.includes.map((item) => (
              <StaggerItem key={item.title}>
                <motion.div
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className="flex gap-4 p-6 rounded-xl border border-warm-200 bg-warm-50 hover:border-warm-300 hover:bg-white transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red/[0.07] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-red transition-colors duration-200">
                    <svg className="text-red group-hover:text-white transition-colors duration-200" width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold tracking-[0.05em] uppercase text-warm-900 mb-1.5">{item.title}</h3>
                    <p className="text-sm text-warm-600 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Process ─── */}
      <section className="py-20 md:py-28 px-5 md:px-8 bg-warm-900">
        <div className="container-tight">
          <FadeIn className="mb-12">
            <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-red-light mb-3">The Process</div>
            <h2 className="font-heading font-[800] uppercase text-white text-3xl md:text-4xl tracking-[0.04em]">How You Receive It</h2>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.process.map((step) => (
              <StaggerItem key={step.number}>
                <div>
                  <div className="w-8 h-8 rounded-full bg-red flex items-center justify-center mb-4">
                    <span className="text-white text-[11px] font-bold">{step.number}</span>
                  </div>
                  <h3 className="text-[13px] font-bold tracking-[0.05em] uppercase text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-warm-500 leading-relaxed">{step.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Deliverables ─── */}
      <section className="py-20 md:py-28 px-5 md:px-8 bg-white">
        <div className="container-tight">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <FadeInLeft>
              <div className="label text-red mb-3">Deliverables</div>
              <h2 className="font-heading font-[800] uppercase text-warm-900 text-3xl md:text-4xl tracking-[0.04em] mb-5">Exactly What You Receive</h2>
              <p className="text-warm-600 leading-relaxed">
                Every deliverable is tracked inside your proprietary client portal in real time.
                No chasing emails. No guessing where things stand.
              </p>
            </FadeInLeft>
            <FadeInRight>
              <div className="space-y-2">
                {data.deliverables.map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 py-3 px-4 rounded-lg bg-warm-50 border border-warm-200 hover:border-warm-300 hover:bg-white transition-all duration-150"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red flex-shrink-0" />
                    <span className="text-sm text-warm-800 font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </FadeInRight>
          </div>
        </div>
      </section>

      {/* ─── Tiers ─── */}
      <section className="py-20 md:py-28 px-5 md:px-8 bg-cream">
        <div className="container-tight">
          <FadeIn className="mb-10">
            <div className="label text-red mb-3">Pricing</div>
            <h2 className="font-heading font-[800] uppercase text-warm-900 text-3xl md:text-4xl tracking-[0.04em]">Which Plans Include This</h2>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {data.tiers.map((tier) => (
              <StaggerItem key={tier.name}>
                <motion.div
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  className={`rounded-xl border p-6 transition-all duration-200 ${
                    tier.included
                      ? "border-warm-800 bg-warm-900"
                      : "border-warm-200 bg-white opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-[11px] font-bold tracking-[0.12em] uppercase mb-0.5 text-warm-500">{tier.name}</div>
                      <div className={`text-lg font-bold ${tier.included ? "text-white" : "text-warm-700"}`}>{TIER_PRICES[tier.name]}</div>
                    </div>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${tier.included ? "bg-red" : "bg-warm-200"}`}>
                      {tier.included ? (
                        <svg width="11" height="11" viewBox="0 0 20 20" fill="white"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg width="9" height="9" viewBox="0 0 20 20" fill="#9E9892"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      )}
                    </div>
                  </div>
                  {tier.note && <p className="text-xs leading-relaxed mb-4 text-warm-500">{tier.note}</p>}
                  {tier.included && (
                    <a href="/book" className="block text-center py-2.5 rounded-lg bg-red text-white text-[11px] font-bold tracking-[0.08em] uppercase hover:bg-red-light transition-colors no-underline mt-2">
                      Get Started
                    </a>
                  )}
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      {data.faq && data.faq.length > 0 && (
        <section className="py-20 md:py-28 px-5 md:px-8 bg-white">
          <div className="max-w-2xl mx-auto">
            <FadeIn className="mb-10">
              <div className="label text-red mb-3">FAQ</div>
              <h2 className="font-heading font-[800] uppercase text-warm-900 text-3xl md:text-4xl tracking-[0.04em]">Common Questions</h2>
            </FadeIn>
            <div className="divide-y divide-warm-200">
              {data.faq.map((item, i) => (
                <motion.div
                  key={item.question}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="py-6"
                >
                  <h4 className="text-[13px] font-bold tracking-[0.05em] uppercase text-warm-900 mb-2">{item.question}</h4>
                  <p className="text-sm text-warm-600 leading-relaxed">{item.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ─── */}
      {!hideCta && <section className="py-20 md:py-28 px-5 md:px-8 bg-cream border-t border-warm-200">
        <div className="container-tight">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <FadeInLeft>
              <div className="label text-red mb-3">Ready to Start?</div>
              <h2 className="font-heading font-[800] uppercase text-warm-900 text-3xl md:text-4xl tracking-[0.04em] max-w-md">
                Let&apos;s Talk About Your {data.label}
              </h2>
            </FadeInLeft>
            <FadeInRight className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <a href="/book" className="btn-primary no-underline">Book a Call</a>
              <Link href="/#services" className="btn-outline no-underline">All Services</Link>
            </FadeInRight>
          </div>
        </div>
      </section>}

    </div>
  );
}
