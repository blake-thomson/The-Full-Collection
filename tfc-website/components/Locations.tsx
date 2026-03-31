"use client";

import { FadeIn, StaggerContainer, StaggerItem } from "./AnimatedSection";
import { motion } from "framer-motion";

const LOCATIONS = [
  {
    city: "Nashville",
    state: "TN",
    address: "1212 McGavock St, Apt 1704\nNashville, TN 37203",
    description: "Our headquarters and home base for all creative operations, client management, and production coordination.",
    features: ["Headquarters", "Production Hub", "Client Portal Ops"],
    primary: true,
    comingSoon: false,
  },
  {
    city: "Chicago",
    state: "IL",
    address: null,
    description: "TFC is expanding to Chicago — bringing our full production team, proprietary client portal, and end-to-end content pipeline to the market. Coming soon.",
    features: [],
    primary: false,
    comingSoon: true,
  },
  {
    city: "Scottsdale",
    state: "AZ",
    address: null,
    description: "TFC is expanding to Scottsdale — bringing our full production team, proprietary client portal, and end-to-end content pipeline to the market. Coming soon.",
    features: [],
    primary: false,
    comingSoon: true,
  },
];

export function Locations() {
  return (
    <section id="locations" className="section bg-cream">
      <div className="container-tight">
        <FadeIn className="text-center mb-16">
          <div className="label text-red mb-4">Locations</div>
          <h2 className="heading-lg text-warm-900 mb-5">
            Where We Operate
          </h2>
          <p className="body-lg max-w-2xl mx-auto">
            Based in Nashville. Expanding to Chicago and Scottsdale. Remote capabilities
            to serve clients anywhere in the country.
          </p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {LOCATIONS.map((location) => (
            <StaggerItem key={location.city}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`rounded-2xl border p-8 lg:p-10 transition-all duration-300 h-full relative ${
                  location.primary
                    ? "bg-warm-900 text-white border-warm-900"
                    : "bg-white border-warm-300 hover:border-warm-400 hover:shadow-xl hover:shadow-warm-200/50"
                }`}
              >
                {/* Expanding badge */}
                {location.comingSoon && (
                  <div className="absolute top-5 right-5 bg-red/10 text-red text-[10px] font-bold tracking-[0.1em] uppercase py-1 px-2.5 rounded-full">
                    Expanding
                  </div>
                )}

                {/* Map pin icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                  location.primary ? "bg-red" : "bg-red/[0.08]"
                }`}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={location.primary ? "#fff" : "#E02020"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>

                <div className="mb-4">
                  <h3 className="font-heading font-[800] text-xl tracking-[0.04em] uppercase">
                    {location.city}
                  </h3>
                  <div className={`text-[11px] font-bold tracking-[0.14em] uppercase mt-1 ${
                    location.primary ? "text-warm-400" : "text-warm-600"
                  }`}>
                    {location.state}{location.primary && " — Headquarters"}
                  </div>
                  {location.address && (
                    <div className={`text-xs mt-2 leading-relaxed whitespace-pre-line ${
                      location.primary ? "text-warm-500" : "text-warm-500"
                    }`}>
                      {location.address}
                    </div>
                  )}
                </div>

                <p className={`text-sm leading-relaxed mb-6 ${
                  location.primary ? "text-warm-400" : "text-warm-600"
                }`}>
                  {location.description}
                </p>

              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
