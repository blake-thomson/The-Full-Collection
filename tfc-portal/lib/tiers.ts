export const TIERS = {
  growth: {
    name: "Growth",
    price: 3000,
    description: "Perfect for creators ready to scale",
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
