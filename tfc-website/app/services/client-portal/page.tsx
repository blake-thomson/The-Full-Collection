import { ServicePageLayout, ServicePageData } from "@/components/ServicePageLayout";
import { PortalShowcase } from "@/components/PortalShowcase";
import { PortalHeroGraphic } from "@/components/PortalHeroGraphic";

const data: ServicePageData = {
  label: "Client Portal",
  title: "Your Proprietary Client Portal",
  subtitle: "Real-time production tracking, content review, messaging, and analytics — all in one custom-built platform exclusive to TFC clients.",
  heroVisual: <PortalHeroGraphic />,
  description:
    "Every client gets access to our proprietary portal from day one. It's not a third-party tool — it's a system we built specifically to manage content production at scale. You can see every video move through production in real time, review and approve content, communicate with your team, and track your analytics all in one place.",
  icon: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  includes: [
    {
      title: "Real-Time Kanban Board",
      description: "Every piece of content is a card that moves through 10 stages: Idea → Filming → Editing → QC → Review → Approved → Scheduled → Published. You always know exactly where things stand.",
    },
    {
      title: "Content Review & Approval",
      description: "Watch videos and leave timecoded feedback directly in the portal. Approve with one click or request revisions with specific notes. No email chains.",
    },
    {
      title: "Content Calendar",
      description: "A full monthly calendar showing every piece of content, its platform, and its scheduled publish date. Integrated with your kanban so statuses update automatically.",
    },
    {
      title: "Direct Messaging",
      description: "Real-time messaging with your dedicated production team. Share references, give feedback, ask questions — all in one thread tied to your account.",
    },
    {
      title: "Analytics Dashboard",
      description: "Track performance across every platform in one place. Views, engagement, follower growth, and content performance — updated in real time.",
    },
    {
      title: "AI Script Writing Tool",
      description: "Generate video scripts using our proprietary AI tool, trained on high-performing content and tuned to your brand voice. Available directly in the portal.",
    },
    {
      title: "Brand Asset Library",
      description: "Upload logos, fonts, brand guidelines, and reference videos. Your entire brand kit lives in the portal, accessible to your full production team.",
    },
    {
      title: "Onboarding Wizard",
      description: "A guided 8-step onboarding flow that captures everything we need to get production started — brand positioning, audience, tone, visual style, and more.",
    },
  ],
  process: [
    {
      number: "01",
      title: "Account Setup",
      description: "You receive an invitation to the portal. Setup takes under 10 minutes — create your profile, upload brand assets, and you're in.",
    },
    {
      number: "02",
      title: "Onboarding Questionnaire",
      description: "Complete the 8-step guided questionnaire inside the portal. This gives your production team everything they need to start producing on-brand content.",
    },
    {
      number: "03",
      title: "Production Begins",
      description: "Content cards appear in your kanban board as production starts. Watch each video move through stages in real time — no chasing updates.",
    },
    {
      number: "04",
      title: "Review & Approve",
      description: "Finished content appears in the Review column. Watch, leave feedback, and approve directly in the portal. Revisions are tracked automatically.",
    },
  ],
  tiers: [
    {
      name: "Starter",
      included: true,
      note: "Full portal access included with every plan",
    },
    {
      name: "Core",
      included: true,
      note: "Full portal access with social media management integration",
    },
    {
      name: "Premium",
      included: true,
      note: "Full portal access + advanced analytics + AI script tool + priority support",
    },
  ],
  deliverables: [
    "Dedicated client portal account",
    "Real-time kanban production tracker",
    "In-portal video review and approval",
    "Content calendar integration",
    "Direct messaging with production team",
    "Analytics dashboard (all platforms)",
    "AI script-writing tool",
    "Brand asset library",
    "Onboarding wizard",
    "Notification system for every production update",
  ],
  faq: [
    {
      question: "Is the portal included in all plans?",
      answer: "Yes. Portal access is included with every plan at no additional cost. It's the backbone of how we manage production for every client.",
    },
    {
      question: "Is this a third-party tool like Notion or Trello?",
      answer: "No — it's a proprietary platform built by TFC specifically for content production management. It's not available anywhere else.",
    },
    {
      question: "Can multiple people on my team have access?",
      answer: "Yes. You can invite team members to your account with different access levels — view-only, review, or admin.",
    },
    {
      question: "What happens to the portal if I cancel?",
      answer: "You retain read-only access to your content archive for 90 days after cancellation. All files can be downloaded during that window.",
    },
    {
      question: "Is the portal available as a mobile app?",
      answer: "The portal is a progressive web app — it works on any device via browser with an app-like experience on mobile. It can be added to your home screen on iOS and Android.",
    },
  ],
};

export default function ClientPortalPage() {
  return <ServicePageLayout data={data} afterHeroSlot={<PortalShowcase />} />;
}
