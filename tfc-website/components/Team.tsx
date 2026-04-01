"use client";

import Image from "next/image";
import { Marquee } from "@/components/ui/marquee";

const TEAM = [
  {
    name: "Blake",
    role: "Operating Partner",
    image: "/team/blake.jpg",
  },
  {
    name: "Junior",
    role: "Lead Strategy Partner",
    image: "/team/junior.jpg",
  },
  {
    name: "Lawson",
    role: "Production Manager",
    image: "/team/lawson.jpg",
  },
  {
    name: "Joey",
    role: "YouTube Editor",
    image: "/team/joey.jpg",
  },
  {
    name: "Mollie",
    role: "Social Media Management",
    image: "/team/mollie.jpg",
  },
  {
    name: "Kaden",
    role: "Post Production Manager",
    image: "/team/kaden.jpg",
  },
];

export function Team() {
  return (
    <section id="team" className="relative w-full overflow-hidden bg-white py-20 md:py-28 lg:py-36">
      {/* Decorative SVG */}
      <div>
        <svg
          className="absolute right-0 bottom-0 text-warm-200"
          fill="none"
          height="154"
          viewBox="0 0 460 154"
          width="460"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_team)">
            <path
              d="M-87.463 458.432C-102.118 348.092 -77.3418 238.841 -15.0744 188.274C57.4129 129.408 180.708 150.071 351.748 341.128C278.246 -374.233 633.954 380.602 548.123 42.7707"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="40"
            />
          </g>
          <defs>
            <clipPath id="clip0_team">
              <rect fill="white" height="154" width="460" />
            </clipPath>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-16 flex max-w-5xl flex-col items-center px-5 md:px-8 text-center">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-red text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          <h2 className="relative mb-4 font-heading font-[800] text-warm-900 tracking-[0.04em] uppercase leading-[1.05]" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)" }}>
            The People Behind
            <br />
            the Production
            <svg
              className="absolute -top-2 -right-8 -z-10 w-24 text-warm-200"
              fill="currentColor"
              height="86"
              viewBox="0 0 108 86"
              width="108"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M38.8484 16.236L15 43.5793L78.2688 15L18.1218 71L93 34.1172L70.2047 65.2739"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="28"
              />
            </svg>
          </h2>
          <p className="max-w-2xl text-warm-600 text-lg leading-relaxed">
            A team of specialists — not generalists. Each member of The Full Collection
            brings deep expertise in their craft, from lens to timeline.
          </p>
        </div>

        {/* Team Marquee */}
        <div className="relative w-full">
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-24 md:w-32 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-24 md:w-32 bg-gradient-to-l from-white to-transparent" />

          <Marquee className="[--gap:1.5rem] [--duration:30s] pt-4" pauseOnHover>
            {TEAM.map((member) => (
              <div
                className="group flex w-60 md:w-64 shrink-0 flex-col transition-transform duration-300 hover:-translate-y-2"
                key={member.name}
              >
                <div className="relative h-80 md:h-92 w-full overflow-hidden rounded-2xl bg-warm-100">
                  <Image
                    alt={member.name}
                    className="h-full w-full object-cover object-top grayscale transition-all duration-300 group-hover:grayscale-0"
                    fill
                    sizes="(max-width: 768px) 240px, 256px"
                    src={member.image}
                  />
                  <div className="absolute bottom-0 w-full bg-white/85 p-3">
                    <h3 className="font-heading font-[700] text-warm-900 text-sm tracking-[0.06em] uppercase">
                      {member.name}
                    </h3>
                    <p className="text-red text-xs font-bold tracking-[0.08em] uppercase">
                      {member.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Marquee>
        </div>

        {/* Testimonial */}
        <div className="mx-auto mt-20 max-w-3xl px-5 md:px-8 text-center">
          <p className="mb-8 font-heading font-[700] text-lg text-warm-900 leading-relaxed md:text-xl tracking-[0.02em]">
            &ldquo;I&apos;m gonna say I love you every time I hang up the phone
            and every time I leave the office because what we&apos;re building
            here is truly family.&rdquo;
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-red/20">
              <Image
                alt="Junior"
                className="h-full w-full object-cover object-top"
                fill
                sizes="56px"
                src="/team/junior.jpg"
              />
            </div>
            <div className="text-center">
              <p className="font-heading font-[700] text-warm-900 text-sm tracking-[0.06em] uppercase">
                Junior
              </p>
              <p className="text-warm-600 text-xs font-bold tracking-[0.08em] uppercase">
                Lead Strategy Partner
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
