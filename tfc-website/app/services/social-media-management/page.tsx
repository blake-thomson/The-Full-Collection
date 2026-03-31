import { ServicePageLayout, ServicePageData } from "@/components/ServicePageLayout";
import { SocialMediaHeroGraphic } from "@/components/SocialMediaHeroGraphic";

const data: ServicePageData = {
  label: "Social Media Management",
  title: "Full-Service Social Media Management",
  subtitle: "We manage your social presence end-to-end — content scheduling, community management, analytics, and growth strategy.",
  heroVisual: <SocialMediaHeroGraphic />,
  description:
    "Posting great content isn't enough. You need a consistent presence, an engaged community, and a data-backed strategy. Our social media team takes the entire operation off your plate — from building the content calendar to responding to comments to analyzing what's working and doubling down on it.",
  icon: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  includes: [
    {
      title: "Content Calendar Management",
      description: "We build and maintain your monthly content calendar — every post planned, scheduled, and mapped to your growth strategy.",
    },
    {
      title: "Cross-Platform Posting",
      description: "Content published across TikTok, Instagram, YouTube, and other platforms on your behalf. Optimal posting times applied for each platform.",
    },
    {
      title: "Caption Writing & Hashtag Strategy",
      description: "Platform-optimized captions written to drive engagement, clicks, and follows. Hashtag research updated monthly.",
    },
    {
      title: "Community Management",
      description: "Responding to comments and DMs, engaging with your audience, and maintaining a consistent brand voice in every interaction.",
    },
    {
      title: "Performance Reporting",
      description: "Monthly analytics reports covering views, engagement, follower growth, reach, and content performance breakdowns by platform.",
    },
    {
      title: "Platform Optimization",
      description: "Regular profile audits, bio updates, pinned post strategy, and algorithm-aware posting cadence to maximize organic reach.",
    },
  ],
  process: [
    {
      number: "01",
      title: "Platform Audit",
      description: "We audit your existing accounts, analyze what's worked, and identify gaps. You get a clear picture of where you stand before we start.",
    },
    {
      number: "02",
      title: "Strategy Build",
      description: "We build a 30-day content strategy tailored to your brand and audience. Themes, formats, posting cadence, and platform priorities are all mapped out.",
    },
    {
      number: "03",
      title: "Content Scheduling",
      description: "All content is loaded into the scheduler, tied to your content calendar in the portal. You can see every planned post before it goes live.",
    },
    {
      number: "04",
      title: "Monitor & Optimize",
      description: "We monitor performance in real time, respond to your community, and adjust the strategy monthly based on what the data shows.",
    },
  ],
  tiers: [
    {
      name: "Starter",
      included: false,
      note: "Not included — upgrade to Core or Premium",
    },
    {
      name: "Core",
      included: true,
      note: "Full social media management included across all platforms",
    },
    {
      name: "Premium",
      included: true,
      note: "Full SMM + monthly strategy call + advanced analytics reporting",
    },
  ],
  deliverables: [
    "Monthly content calendar",
    "Daily posting across TikTok, Instagram, YouTube",
    "Platform-optimized captions written monthly",
    "Hashtag research and strategy",
    "Community management (comments & DMs)",
    "Monthly performance analytics report",
    "Profile optimization and bio updates",
    "Platform algorithm monitoring",
    "Content approval workflow via portal",
  ],
  faq: [
    {
      question: "Which platforms do you manage?",
      answer: "We manage TikTok, Instagram, YouTube, and YouTube Shorts as core platforms. We can also extend to LinkedIn, Facebook, X (Twitter), and Pinterest.",
    },
    {
      question: "Do I approve posts before they go live?",
      answer: "Yes. Every post is visible in your content calendar inside the portal before it publishes. You can review, edit, or flag anything before it goes live.",
    },
    {
      question: "Do you have access to my social accounts?",
      answer: "We use a secure social scheduling platform and request posting access via official APIs. You maintain full ownership and can revoke access at any time.",
    },
    {
      question: "What counts as community management?",
      answer: "We respond to comments on your posts, engage with tagged content, manage DMs for general inquiries, and flag anything that needs your personal response.",
    },
  ],
};

export default function SocialMediaManagementPage() {
  return <ServicePageLayout data={data} />;
}
