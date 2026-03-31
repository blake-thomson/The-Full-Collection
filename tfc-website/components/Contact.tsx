"use client";

import { FadeIn, FadeInLeft, FadeInRight } from "./AnimatedSection";
import { motion } from "framer-motion";

export function Contact() {
  return (
    <section id="contact" className="section bg-white relative">
      <div className="container-tight">
        {/* CTA Banner */}
        <FadeIn className="mb-20">
          <div className="relative rounded-3xl bg-warm-900 text-white overflow-hidden p-10 md:p-16 lg:p-20 text-center">
            {/* Animated background shapes */}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full border border-white/5"
            />
            <motion.div
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[-30%] left-[-15%] w-[500px] h-[500px] rounded-full border border-white/5"
            />

            <div className="relative z-10">
              <div className="label text-red-light mb-6">Ready to Start?</div>
              <h2 className="heading-lg text-white mb-6 max-w-3xl mx-auto">
                Let&apos;s Build Your
                <br />
                Content Machine
              </h2>
              <p className="text-warm-400 text-lg max-w-xl mx-auto mb-10">
                Book a call with our team to discuss your content goals. We&apos;ll map out
                a production plan, match you with the right tier, and get your content
                engine running.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#book" className="btn-primary !bg-red !text-white no-underline">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Book a Call
                </a>
                <a href="mailto:hello@thefullcollection.com" className="btn-outline !border-warm-600 !text-warm-300 hover:!border-white hover:!text-white no-underline">
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Contact info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          <FadeIn delay={0}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-red/[0.08] flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E02020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="heading-sm text-warm-900 mb-2">Email</div>
              <a href="mailto:hello@thefullcollection.com" className="body-sm text-red hover:text-red-dark no-underline">
                hello@thefullcollection.com
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-red/[0.08] flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E02020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="heading-sm text-warm-900 mb-2">Book a Call</div>
              <p className="body-sm">
                Schedule a 30-minute strategy session with our team
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-red/[0.08] flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E02020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="heading-sm text-warm-900 mb-2">Headquarters</div>
              <p className="body-sm">Nashville, TN</p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
