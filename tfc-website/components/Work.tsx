"use client";

import Image from "next/image";
import { FadeIn } from "./AnimatedSection";
import { motion } from "framer-motion";

const PROJECTS = [
  {
    name: "Paul Simyu",
    category: "Full Production + Strategy",
    from: "30,000",
    to: "68,000",
    image: "/results/paul.svg",
  },
  {
    name: "Arturo Johnson",
    category: "Full Production + Strategy",
    from: "900",
    to: "235,000",
    image: "/results/arturo.svg",
  },
  {
    name: "Abram Mitchell",
    category: "Full Production + Strategy",
    from: "70,000",
    to: "103,000",
    image: "/results/abram.svg",
  },
];

export function Work() {
  return (
    <section id="work" className="section bg-cream">
      <div className="container-wide">
        <FadeIn className="text-center mb-16">
          <div className="label text-red mb-4">Our Work</div>
          <h2 className="heading-lg text-warm-900 mb-5">
            Results That Speak
          </h2>
          <p className="body-lg max-w-2xl mx-auto">
            We don&apos;t just create content — we build content engines that drive real growth.
            Here are some of the results we&apos;ve delivered.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PROJECTS.map((project, i) => (
            <motion.div
              key={project.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="group relative rounded-2xl overflow-hidden bg-[#0D0D0D] border border-white/10 hover:border-red/40 hover:shadow-2xl hover:shadow-red/10 transition-all duration-300 aspect-[3/4] cursor-pointer"
              >
                {/* Full-bleed image */}
                <Image
                  src={project.image}
                  alt={project.name}
                  fill
                  className="object-cover object-top"
                />

                {/* Gradient: only covers bottom ~35% of card */}
                <div className="absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black to-transparent" />

                {/* Top badge */}
                <div className="absolute top-4 left-4">
                  <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-red/90 bg-black/50 border border-red/30 rounded-full px-2.5 py-1 backdrop-blur-sm">
                    {project.category}
                  </div>
                </div>

                {/* Bottom content */}
                <div className="absolute bottom-0 inset-x-0 p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/40 text-sm font-mono line-through">{project.from}</span>
                    <span className="text-red text-xs">→</span>
                    <span className="text-white font-heading font-[800] text-xl tracking-wide">{project.to}</span>
                  </div>
                  <div className="text-[9px] font-bold tracking-[0.14em] uppercase text-white/30 mb-3">Followers</div>
                  <div className="w-full h-px bg-white/10 mb-3" />
                  <h3 className="font-heading font-[800] text-white text-lg tracking-wide uppercase leading-tight">
                    {project.name}
                  </h3>
                </div>

                {/* Hover red line accent */}
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-red group-hover:w-full transition-all duration-500" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
