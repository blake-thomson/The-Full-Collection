"use client";

import { FadeIn, StaggerContainer, StaggerItem } from "./AnimatedSection";
import { motion } from "framer-motion";

const TIERS = [
  {
    name: "Starter",
    price: "$3,000",
    period: "/mo",
    description: "Everything you need to build a consistent content presence",
    features: [
      "15 short-form videos per month",
      "1 shoot day per month",
      "AI-powered script-writing tool",
      "Content calendar & posting schedule",
      "Proprietary client portal access",
    ],
    popular: false,
  },
  {
    name: "Core",
    price: "$5,000",
    period: "/mo",
    description: "Full-service content production with social media management",
    features: [
      "30 short-form videos per month",
      "2 YouTube videos per month",
      "2 shoot days per month",
      "AI-powered script-writing tool",
      "Content calendar & posting schedule",
      "Social media management included",
      "Proprietary client portal access",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "$7,500",
    period: "/mo",
    description: "The complete content machine for top-tier creators",
    features: [
      "45 short-form videos per month",
      "4 YouTube videos per month",
      "5 shoot days per month",
      "AI-powered script-writing tool",
      "Content calendar & posting schedule",
      "Social media management included",
      "Monthly strategy call",
      "Priority edit turnaround",
      "Proprietary client portal access",
    ],
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="section bg-white">
      <div className="container-tight">
        <FadeIn className="text-center mb-16">
          <div className="label text-red mb-4">Pricing</div>
          <h2 className="heading-lg text-warm-900 mb-5">
            Simple, Transparent Pricing
          </h2>
          <p className="body-lg max-w-2xl mx-auto">
            Three tiers designed to match where you are in your content journey.
            Every plan includes access to our proprietary client portal.
          </p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {TIERS.map((tier) => (
            <StaggerItem key={tier.name}>
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`rounded-2xl p-8 lg:p-10 border transition-all duration-300 relative ${
                  tier.popular
                    ? "bg-warm-900 text-white border-warm-900 shadow-2xl shadow-warm-900/20 scale-[1.02]"
                    : "bg-white border-warm-300 hover:border-warm-400 hover:shadow-xl hover:shadow-warm-200/50"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-red text-white text-[10px] font-bold tracking-[0.14em] uppercase px-4 py-1.5 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <div className={`heading-sm mb-2 ${tier.popular ? "text-warm-400" : "text-warm-600"}`}>
                    {tier.name}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading font-[800] text-4xl lg:text-5xl">
                      {tier.price}
                    </span>
                    <span className={`text-sm ${tier.popular ? "text-warm-500" : "text-warm-600"}`}>
                      {tier.period}
                    </span>
                  </div>
                  <p className={`text-sm mt-3 ${tier.popular ? "text-warm-400" : "text-warm-600"}`}>
                    {tier.description}
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <svg
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tier.popular ? "text-red-light" : "text-red"}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className={`text-sm ${tier.popular ? "text-warm-300" : "text-warm-700"}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <a
                  href="/book"
                  className={`block text-center py-3.5 rounded-lg font-bold text-[13px] tracking-[0.06em] uppercase transition-all duration-200 no-underline ${
                    tier.popular
                      ? "bg-red text-white hover:bg-red-light"
                      : "bg-warm-100 text-warm-900 hover:bg-warm-200"
                  }`}
                >
                  Get Started
                </a>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
