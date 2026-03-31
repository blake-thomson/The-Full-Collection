"use client";

import { FadeIn, StaggerContainer, StaggerItem } from "./AnimatedSection";
import { motion } from "framer-motion";

const STEPS = [
  {
    number: "01",
    title: "Discovery Call",
    description: "We learn your brand, audience, and content goals. You get a custom production plan and a tier recommendation.",
  },
  {
    number: "02",
    title: "Onboarding",
    description: "Set up your client portal, complete the brand questionnaire, upload your assets. Your team is assigned and ready.",
  },
  {
    number: "03",
    title: "Production",
    description: "Shoots are scheduled, content is filmed, and editing begins. Track every deliverable in real time on your dashboard.",
  },
  {
    number: "04",
    title: "Review & Publish",
    description: "Review and approve content directly in the portal. Once approved, we handle scheduling and posting across all platforms.",
  },
];

export function Process() {
  return (
    <section className="section bg-cream">
      <div className="container-tight">
        <FadeIn className="text-center mb-16">
          <div className="label text-red mb-4">How It Works</div>
          <h2 className="heading-lg text-warm-900 mb-5">
            From Call to Content
            <br />
            in Four Steps
          </h2>
          <p className="body-lg max-w-2xl mx-auto">
            We&apos;ve streamlined the entire content production process so you can go from
            first call to published content in as little as two weeks.
          </p>
        </FadeIn>

        <StaggerContainer className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-warm-300 -translate-x-1/2" />

          <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-1 lg:gap-0">
            {STEPS.map((step, i) => (
              <StaggerItem key={step.number}>
                <div className={`lg:grid lg:grid-cols-2 lg:gap-16 items-center ${i > 0 ? "lg:mt-16" : ""}`}>
                  {/* Content — alternates sides */}
                  <div className={`${i % 2 === 1 ? "lg:order-2 lg:text-left" : "lg:text-right"}`}>
                    <motion.div
                      whileInView={{ opacity: 1, x: 0 }}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="font-heading font-[800] text-red/15 text-6xl md:text-7xl leading-none mb-2">
                        {step.number}
                      </div>
                      <h3 className="heading-md text-warm-900 mb-3">{step.title}</h3>
                      <p className="body-md max-w-md">{i % 2 === 0 ? <span className="lg:ml-auto lg:block">{step.description}</span> : step.description}</p>
                    </motion.div>
                  </div>

                  {/* Center dot */}
                  <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center" style={{ top: `${12.5 + i * 25}%` }}>
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-4 h-4 rounded-full bg-red border-4 border-cream"
                    />
                  </div>

                  {/* Empty space for alternating layout */}
                  <div className={`hidden lg:block ${i % 2 === 1 ? "lg:order-1" : ""}`} />
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>

        <FadeIn delay={0.3} className="text-center mt-16">
          <a href="#contact" className="btn-primary no-underline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Book Your Discovery Call
          </a>
        </FadeIn>
      </div>
    </section>
  );
}
