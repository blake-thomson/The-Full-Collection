export const TIERS = {
  growth: {
    name: "Growth",
    price: 3000,
    description: "Perfect for creators ready to scale",
    shortForm: 8,
    longForm: 0,
    smm: false,
    features: [
      "8 pieces of short-form content per month",
      "Professional editing & post-production",
      "Content strategy session (monthly)",
      "Content calendar management",
      "Portal access with AI content tools",
    ],
  },
  professional: {
    name: "Professional",
    price: 5000,
    popular: true,
    description: "For established creators who want premium content",
    shortForm: 15,
    longForm: 2,
    smm: false,
    features: [
      "15 pieces of short-form content per month",
      "2 long-form videos per month",
      "Dedicated editor assigned to your brand",
      "Bi-weekly strategy calls",
      "Full portal access with AI + Google Drive",
      "Priority turnaround on edits",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 7500,
    description: "Full-service content production for top creators",
    shortForm: null,
    longForm: 4,
    smm: true,
    features: [
      "Unlimited short-form content",
      "4 long-form videos per month",
      "Dedicated creative director",
      "Weekly strategy calls",
      "Full portal access — all features",
      "Same-day edit turnaround",
      "Thumbnail & graphic design included",
      "Podcast editing & distribution",
    ],
  },
} as const;

export type TierKey = keyof typeof TIERS;
