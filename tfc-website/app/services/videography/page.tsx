import type { Metadata } from "next";
import { ServicePageLayout, ServicePageData } from "@/components/ServicePageLayout";
import { VideographyHeroGraphic } from "@/components/VideographyHeroGraphic";

export const metadata: Metadata = {
  title: "Nashville Videography & Video Production",
  description:
    "Professional video production in Nashville, TN. Short-form TikTok & Reels, long-form YouTube, and branded video content — produced at volume by The Full Collection.",
  alternates: { canonical: "https://thefullcollection.com/services/videography" },
  openGraph: {
    title: "Nashville Videography & Video Production | The Full Collection",
    description:
      "Professional video production in Nashville. TikTok, Reels, YouTube, and branded content produced at scale.",
    url: "https://thefullcollection.com/services/videography",
  },
};

const data: ServicePageData = {
  heroVisual: <VideographyHeroGraphic />,
  label: "Videography",
  title: "Professional Video Production",
  subtitle: "Short-form and long-form video content produced at every level — from concept to camera to final delivery.",
  description:
    "Our videography team handles every aspect of production. We work with your brand's vision, schedule shoot days, direct on set, and deliver polished content ready for every platform. Whether you need 15 short-form clips a month or a full YouTube series, we've built the systems to produce at volume without sacrificing quality.",
  icon: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  includes: [
    {
      title: "Pre-Production Planning",
      description: "Shot lists, run-of-show docs, location scouting, talent coordination, and creative briefs — all handled before we ever touch a camera.",
    },
    {
      title: "Professional Shoot Days",
      description: "Fully equipped crew with cinema-grade cameras, lighting, and audio. 1–5 shoot days per month depending on your tier.",
    },
    {
      title: "Short-Form Content (TikTok, Reels, Shorts)",
      description: "15–45 vertical short-form videos per month, scripted, filmed, and edited for maximum engagement on TikTok, Instagram Reels, and YouTube Shorts.",
    },
    {
      title: "Long-Form YouTube Videos",
      description: "Core and Premium plans include 2–4 polished YouTube videos per month — fully produced with intros, b-roll, graphics, and branded end screens.",
    },
    {
      title: "On-Set Direction",
      description: "Our directors work with you on set to capture authentic, on-brand content. We handle every angle, every take, every creative decision in the moment.",
    },
    {
      title: "Content Batch Shooting",
      description: "We batch-produce content during shoot days to maximize efficiency. One shoot day can yield weeks of content when planned correctly.",
    },
  ],
  process: [
    {
      number: "01",
      title: "Discovery & Brief",
      description: "We learn your brand voice, audience, content goals, and visual style. You fill out our onboarding questionnaire and we map out a shoot plan.",
    },
    {
      number: "02",
      title: "Pre-Production",
      description: "Shot lists, scripts, location booking, and crew scheduling. Everything is prepared before shoot day so we use every minute efficiently.",
    },
    {
      number: "03",
      title: "Shoot Day",
      description: "Our full crew comes to you, or you come to us in Nashville. We film everything on the schedule, capture b-roll, and deliver raw footage the same day.",
    },
    {
      number: "04",
      title: "Delivery via Portal",
      description: "Finished videos appear in your client portal for review and approval. Track every video from raw footage through to published.",
    },
  ],
  tiers: [
    {
      name: "Starter",
      included: true,
      note: "15 short-form videos/month, 1 shoot day/month",
    },
    {
      name: "Core",
      included: true,
      note: "30 short-form + 2 YouTube videos/month, 2 shoot days/month",
    },
    {
      name: "Premium",
      included: true,
      note: "45 short-form + 4 YouTube videos/month, 5 shoot days/month",
    },
  ],
  deliverables: [
    "15–45 short-form vertical videos per month",
    "2–4 long-form YouTube videos per month (Core & Premium)",
    "Raw footage archive",
    "Pre-production brief and shot list",
    "Content calendar with shoot schedule",
    "On-set direction and crew",
    "Same-day raw footage delivery",
    "Video files exported for every platform",
  ],
  faq: [
    {
      question: "Where do shoot days take place?",
      answer: "Shoots can take place anywhere. We're happy to come to you, or you can come to us in Nashville. We coordinate all logistics regardless of location.",
    },
    {
      question: "What type of content do you film?",
      answer: "Talking head videos, product demos, brand storytelling, lifestyle content, event coverage, tutorials — whatever format fits your brand and audience.",
    },
    {
      question: "How much notice do you need to schedule a shoot?",
      answer: "We typically schedule shoot days 1–2 weeks in advance. For Premium clients we maintain standing recurring shoot dates so you're always on the calendar.",
    },
    {
      question: "How quickly will I see results?",
      answer: "Most clients see measurable growth in views, engagement, and followers within the first 30–60 days of consistent content. Our team is built for volume and speed — so you're not waiting months to see your content machine in motion.",
    },
  ],
};

export default function VideographyPage() {
  return <ServicePageLayout data={data} />;
}
