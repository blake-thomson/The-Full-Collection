import { ServicePageLayout, ServicePageData } from "@/components/ServicePageLayout";
import { IdeaMockup } from "@/components/PortalShowcase";

const data: ServicePageData = {
  label: "Content Strategy",
  title: "Data-Driven Content Strategy",
  subtitle: "A clear content roadmap built around your audience, your goals, and what actually performs — not guesswork.",
  heroVisual: <IdeaMockup />,
  description:
    "Great content without strategy is just noise. Before we film a single frame, we build a content plan that maps every piece of content to a growth objective. We research your audience, study your competitors, identify your content pillars, and build a system that compounds over time.",
  icon: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  includes: [
    {
      title: "Brand & Audience Deep Dive",
      description: "We map your target audience, study their content consumption habits, and identify exactly what topics, formats, and hooks will resonate.",
    },
    {
      title: "Competitor Analysis",
      description: "We analyze your top competitors and category leaders — identifying gaps you can own, formats they're missing, and angles that differentiate you.",
    },
    {
      title: "Content Pillar Development",
      description: "Three to five core content pillars that define what your brand talks about. Every piece of content maps back to a pillar.",
    },
    {
      title: "Format & Platform Strategy",
      description: "Platform-by-platform recommendations for what formats to prioritize — short-form vs. long-form, vertical vs. horizontal, educational vs. entertainment.",
    },
    {
      title: "Monthly Strategy Reviews",
      description: "Premium clients get a monthly strategy call to review what performed, what didn't, and where to focus the next 30 days.",
    },
    {
      title: "AI Script Writing Tool Access",
      description: "Every client gets access to TFC's proprietary AI script-writing tool — trained on top-performing content formats and tuned to your brand voice.",
    },
  ],
  process: [
    {
      number: "01",
      title: "Onboarding Questionnaire",
      description: "You complete our 8-step onboarding questionnaire covering brand positioning, audience, content references, tone, and goals.",
    },
    {
      number: "02",
      title: "Research & Analysis",
      description: "We research your niche, analyze competitor content, study platform trends, and identify the content opportunities your brand should own.",
    },
    {
      number: "03",
      title: "Strategy Document",
      description: "You receive a full content strategy document: pillars, formats, platform priorities, posting cadence, topic ideas, and a 90-day content roadmap.",
    },
    {
      number: "04",
      title: "Ongoing Optimization",
      description: "Strategy is reviewed monthly using real performance data. What works gets scaled. What doesn't gets cut. The plan evolves with the data.",
    },
  ],
  tiers: [
    {
      name: "Starter",
      included: true,
      note: "Content calendar and posting schedule included",
    },
    {
      name: "Core",
      included: true,
      note: "Full content strategy + social media management + monthly reporting",
    },
    {
      name: "Premium",
      included: true,
      note: "Full strategy + monthly strategy call + competitor analysis + priority planning",
    },
  ],
  deliverables: [
    "Onboarding brand questionnaire (8 steps)",
    "Content pillar framework (3–5 pillars)",
    "Competitor analysis report",
    "Platform priority recommendations",
    "90-day content roadmap",
    "Monthly content calendar",
    "AI script-writing tool access",
    "Monthly strategy review call (Premium)",
    "Monthly performance analytics report",
  ],
  faq: [
    {
      question: "What does the onboarding questionnaire cover?",
      answer: "Brand positioning, target audience, content pillars, tone of voice, preferred formats, content references, brand assets, and core offers. It takes about 30 minutes and gives us everything we need.",
    },
    {
      question: "How quickly do you build the strategy?",
      answer: "Your initial content strategy document is delivered within 5–7 business days of completing onboarding. From there, strategy is updated monthly.",
    },
    {
      question: "What is the AI script-writing tool?",
      answer: "It's a proprietary tool built inside your client portal. You input a topic and your brand details, and it generates video scripts formatted for short-form and long-form — trained on what performs.",
    },
    {
      question: "How do you measure if the strategy is working?",
      answer: "We track views, engagement rate, follower growth, and content performance by pillar and format. Monthly reports break down what's working so we can double down on it.",
    },
  ],
};

export default function ContentStrategyPage() {
  return <ServicePageLayout data={data} />;
}
