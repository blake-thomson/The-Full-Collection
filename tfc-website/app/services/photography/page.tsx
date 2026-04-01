import type { Metadata } from "next";
import { ServicePageLayout, ServicePageData } from "@/components/ServicePageLayout";
import { PhotographyHeroGraphic } from "@/components/PhotographyHeroGraphic";

export const metadata: Metadata = {
  title: "Brand & Content Photography Nashville",
  description:
    "Professional brand and content photography in Nashville, TN. Product shots, lifestyle, headshots, and campaign photography for businesses that want to stand out.",
  alternates: { canonical: "https://thefullcollection.com/services/photography" },
  openGraph: {
    title: "Brand & Content Photography Nashville | The Full Collection",
    description:
      "Professional brand photography in Nashville. Product, lifestyle, headshots, and campaign imagery for growing businesses.",
    url: "https://thefullcollection.com/services/photography",
  },
};

const data: ServicePageData = {
  heroVisual: <PhotographyHeroGraphic />,
  label: "Photography",
  title: "Brand & Content Photography",
  subtitle: "Stunning still imagery for your brand — from product shots and lifestyle content to headshots and campaign photography.",
  description:
    "Great video needs great stills alongside it. Our photography team captures images that work across your website, social media, press, and marketing materials. We plan every shoot with your brand identity in mind so every photo looks intentional, consistent, and unmistakably you.",
  icon: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  includes: [
    {
      title: "Brand Photography",
      description: "Consistent, on-brand imagery for your website, press kits, and digital presence. Planned around your visual identity and color palette.",
    },
    {
      title: "Content & Social Stills",
      description: "Scroll-stopping images built for social media. Square, portrait, and landscape formats delivered for every platform.",
    },
    {
      title: "Product Photography",
      description: "Clean, high-quality product shots on white, lifestyle, and creative backgrounds. Perfect for e-commerce, ads, and social.",
    },
    {
      title: "Lifestyle Photography",
      description: "Real-world imagery showing your product or brand in action. Models, locations, and props coordinated for every shoot.",
    },
    {
      title: "Headshots & Team Photos",
      description: "Professional headshots and team portraits for your website, LinkedIn, press releases, and speaker profiles.",
    },
    {
      title: "Event Coverage",
      description: "Full event photography for launches, pop-ups, brand activations, and client experiences. Delivered within 48 hours.",
    },
  ],
  process: [
    {
      number: "01",
      title: "Creative Brief",
      description: "We review your brand guidelines, existing visuals, and photography goals. We develop a shot list and mood board before the shoot.",
    },
    {
      number: "02",
      title: "Shoot Scheduling",
      description: "We book the shoot date, coordinate any models or props, arrange the location, and confirm all logistics with you in advance.",
    },
    {
      number: "03",
      title: "Photography Session",
      description: "Our photographers capture every shot on the list. We direct, style, and adjust lighting to match your brand aesthetic in real time.",
    },
    {
      number: "04",
      title: "Editing & Delivery",
      description: "Photos are culled, color-graded, and retouched to brand standards. Final images are delivered via your client portal within 48–72 hours.",
    },
  ],
  tiers: [
    {
      name: "Starter",
      included: true,
      note: "Photography included during shoot day coverage",
    },
    {
      name: "Core",
      included: true,
      note: "Dedicated photography coverage with 2 shoot days/month",
    },
    {
      name: "Premium",
      included: true,
      note: "Full photography suite — brand, lifestyle, events, and product across 5 shoot days/month",
    },
  ],
  deliverables: [
    "High-resolution edited images (300 DPI)",
    "Web-optimized versions for social and digital",
    "Multiple aspect ratios per shot",
    "Color-graded to brand standards",
    "Delivered via client portal",
    "Commercial usage rights included",
    "48–72 hour turnaround post-shoot",
  ],
  faq: [
    {
      question: "How many photos do we receive per shoot?",
      answer: "Delivery varies by project scope, but typical shoots yield 50–150 final edited images. We always over-shoot and curate the best.",
    },
    {
      question: "Do we own the photos?",
      answer: "Yes. All photography delivered to you comes with full commercial usage rights. You own every image.",
    },
    {
      question: "Can you match our existing visual style?",
      answer: "Absolutely. Share your brand guidelines and existing photography and we'll match the aesthetic precisely — color treatment, composition, and tone.",
    },
    {
      question: "Do you provide models or props?",
      answer: "We can coordinate talent and props for an additional production fee. Many clients use their own team or products, which keeps costs minimal.",
    },
  ],
};

export default function PhotographyPage() {
  return <ServicePageLayout data={data} />;
}
