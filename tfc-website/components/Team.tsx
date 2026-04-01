"use client";

import Image from "next/image";
import { FadeIn, StaggerContainer, StaggerItem } from "./AnimatedSection";
import { motion } from "framer-motion";

const TEAM = [
  {
    name: "Blake",
    role: "Operating Partner",
    description: "Oversees day-to-day operations, production systems, and client delivery. Keeps everything running at the highest level.",
    initials: "BT",
    image: "/team/blake.jpg",
    imagePosition: "top",
  },
  {
    name: "Junior",
    role: "Lead Strategy Partner",
    description: "Drives the vision and strategy behind The Full Collection. Leads client relationships, growth direction, and overall agency positioning.",
    initials: "JB",
    image: "/team/junior.jpg",
    imagePosition: "top",
  },
  {
    name: "Lawson",
    role: "Production Manager",
    description: "Manages all production logistics — shoot scheduling, on-set direction, and making sure every project comes out on time.",
    initials: "LW",
    image: "/team/lawson.jpg",
    imagePosition: "top",
  },
  {
    name: "Joey",
    role: "YouTube Editor",
    description: "Specialist in long-form YouTube content. Handles editing, pacing, thumbnails, and everything that makes videos perform.",
    initials: "JO",
    image: "/team/joey.jpg",
    imagePosition: "top",
  },
  {
    name: "Mollie",
    role: "Social Media Management",
    description: "Runs social strategy, content calendars, community management, and analytics reporting across all platforms.",
    initials: "MO",
    image: "/team/mollie.jpg",
    imagePosition: "top",
  },
  {
    name: "Kaden",
    role: "Post Production Manager",
    description: "Heads post-production — color grading, motion graphics, sound design, and final delivery across every format.",
    initials: "KA",
    image: "/team/kaden.jpg",
    imagePosition: "20% top",
  },
];

export function Team() {
  return (
    <section id="team" className="section bg-white">
      <div className="container-tight">
        <FadeIn className="text-center mb-16">
          <div className="label text-red mb-4">Our Team</div>
          <h2 className="heading-lg text-warm-900 mb-5">
            The People Behind
            <br />
            the Production
          </h2>
          <p className="body-lg max-w-2xl mx-auto">
            A team of specialists — not generalists. Each member of The Full Collection
            brings deep expertise in their craft, from lens to timeline.
          </p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEAM.map((member) => (
            <StaggerItem key={member.name}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="card group text-center"
              >
                {/* Avatar — photo if available, else initials */}
                <div className="w-20 h-20 rounded-full mx-auto mb-5 overflow-hidden bg-warm-200 flex items-center justify-center group-hover:ring-2 group-hover:ring-red/30 transition-all duration-300">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: member.imagePosition ?? "center" }}
                    />
                  ) : (
                    <span className="font-heading font-[800] text-warm-600 text-lg tracking-wider group-hover:text-red transition-colors duration-300">
                      {member.initials}
                    </span>
                  )}
                </div>

                <h3 className="heading-sm text-warm-900 mb-1">{member.name}</h3>
                <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-red mb-4">
                  {member.role}
                </div>
                <p className="body-sm">{member.description}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
