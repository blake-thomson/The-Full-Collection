"use client";

import { FadeIn, StaggerContainer, StaggerItem } from "./AnimatedSection";
import { motion } from "framer-motion";
import Link from "next/link";

const SERVICES = [
  {
    href: "/services/videography",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    title: "Videography",
    description: "Professional short-form and long-form video production. From concept to final cut, we handle every frame.",
  },
  {
    href: "/services/photography",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    title: "Photography",
    description: "Stunning visuals for your brand. Product shots, lifestyle content, headshots, and campaign photography.",
  },
  {
    href: "/services/editing",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: "Editing",
    description: "Expert post-production with fast turnaround. Color grading, motion graphics, sound design, and more.",
  },
  {
    href: "/services/social-media-management",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: "Social Media Management",
    description: "End-to-end social strategy. Content calendars, posting, community management, and analytics reporting.",
  },
  {
    href: "/services/content-strategy",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: "Content Strategy",
    description: "Data-driven content plans tailored to your audience. We map out every piece of content before we create it.",
  },
  {
    href: "/services/client-portal",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "Client Portal",
    description: "Our proprietary tracking system gives you real-time visibility into every stage of production, from idea to published.",
  },
];

export function Services() {
  return (
    <section id="services" className="section bg-cream">
      <div className="container-tight">
        <FadeIn className="text-center mb-16">
          <div className="label text-red mb-4">What We Do</div>
          <h2 className="font-heading font-[800] uppercase tracking-[0.06em] leading-[1] text-warm-900 mb-5"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)" }}>
            Everything You Need. Nothing You Don&apos;t.
          </h2>
          <p className="body-lg max-w-2xl mx-auto">
            We are a full-stack content production agency. You get access to our entire
            team of videographers, editors, photographers, and strategists — plus a
            proprietary portal to track every deliverable in real time.
          </p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <StaggerItem key={service.title}>
              <Link href={service.href} className="no-underline block h-full">
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="card group h-full cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-red/[0.08] flex items-center justify-center text-red mb-5 group-hover:bg-red group-hover:text-white transition-all duration-300">
                    {service.icon}
                  </div>
                  <h3 className="heading-sm text-warm-900 mb-3">{service.title}</h3>
                  <p className="body-sm mb-4">{service.description}</p>
                  <div className="flex items-center gap-1.5 text-red text-[12px] font-bold tracking-[0.06em] uppercase group-hover:gap-2.5 transition-all duration-200">
                    Learn More
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </motion.div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
