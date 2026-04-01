import type { Metadata } from "next";
import { ServicePageLayout, ServicePageData } from "@/components/ServicePageLayout";
import { EditingHeroGraphic } from "@/components/EditingHeroGraphic";

export const metadata: Metadata = {
  title: "Video Editing & Post-Production Nashville",
  description:
    "Expert video editing and post-production services in Nashville, TN. Color grading, motion graphics, captions, and platform-ready exports — fast turnaround, unlimited revisions.",
  alternates: { canonical: "https://thefullcollection.com/services/editing" },
  openGraph: {
    title: "Video Editing & Post-Production Nashville | The Full Collection",
    description:
      "Expert video editing in Nashville. Color grading, motion graphics, captions, and fast turnaround for brands that move fast.",
    url: "https://thefullcollection.com/services/editing",
  },
};

const data: ServicePageData = {
  heroVisual: <EditingHeroGraphic />,
  label: "Editing",
  title: "Post-Production & Editing",
  subtitle: "Expert editing that transforms raw footage into polished, platform-ready content — with fast turnaround and unlimited revisions.",
  description:
    "Our editing team handles everything after the camera stops rolling. Color grading, sound design, motion graphics, captions, transitions, and final platform exports — all handled internally by dedicated editors assigned to your account. No outsourcing, no bottlenecks.",
  icon: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  includes: [
    {
      title: "Short-Form Video Editing",
      description: "Fast-paced, retention-optimized edits for TikTok, Reels, and Shorts. Jump cuts, pacing, trending sounds, and captions handled by platform-native editors.",
    },
    {
      title: "Long-Form YouTube Editing",
      description: "Full YouTube video edits with intros, b-roll integration, graphics packages, lower thirds, end screens, and chapter markers.",
    },
    {
      title: "Color Grading",
      description: "Professional color treatment applied to every video — matching your brand palette and creating a consistent visual identity across all content.",
    },
    {
      title: "Motion Graphics & Titles",
      description: "Custom animated titles, lower thirds, callouts, and branded graphics packages designed to match your visual identity.",
    },
    {
      title: "Sound Design & Audio Mixing",
      description: "Clean dialogue, background music, sound effects, and proper audio leveling. Every video sounds as good as it looks.",
    },
    {
      title: "Captions & Subtitles",
      description: "Auto-generated and human-reviewed captions for every video. Styled to match your brand for short-form, or SRT files for long-form.",
    },
    {
      title: "Thumbnail Design",
      description: "Click-worthy custom thumbnails for YouTube videos. A/B variants available on Premium plans.",
    },
    {
      title: "Platform-Specific Exports",
      description: "Every video exported and optimized for its target platform — correct aspect ratio, resolution, frame rate, and file format.",
    },
  ],
  process: [
    {
      number: "01",
      title: "Footage Intake",
      description: "Raw footage is uploaded to your drive and synced to your account. Your assigned editor reviews the footage and the shot list.",
    },
    {
      number: "02",
      title: "Assembly Edit",
      description: "Your editor builds the rough cut — selecting the best takes, arranging the structure, and applying the initial edit.",
    },
    {
      number: "03",
      title: "Polish & Finishing",
      description: "Color grade, audio mix, graphics, captions, and final touches. The video is checked against brand guidelines before review.",
    },
    {
      number: "04",
      title: "Review in Portal",
      description: "The finished video appears in your client portal for review. Leave timecoded comments or approve with one click. Revisions are turned around in 24 hours.",
    },
  ],
  tiers: [
    {
      name: "Starter",
      included: true,
      note: "Editing for 15 short-form videos/month",
    },
    {
      name: "Core",
      included: true,
      note: "Editing for 30 short-form + 2 YouTube videos/month",
    },
    {
      name: "Premium",
      included: true,
      note: "Editing for 45 short-form + 4 YouTube videos/month with priority turnaround",
    },
  ],
  deliverables: [
    "Fully edited short-form videos (vertical, 9:16)",
    "Fully edited YouTube videos with full post-production",
    "Color-graded to brand standards",
    "Captions and subtitles on every video",
    "Motion graphics and title cards",
    "Thumbnail designs for YouTube",
    "Platform-specific export files",
    "Timecoded revision feedback via client portal",
    "24-hour revision turnaround (48-hour on Premium)",
  ],
  faq: [
    {
      question: "How long does editing take?",
      answer: "Short-form videos are typically edited within 2–3 business days of footage intake. Long-form YouTube videos take 4–5 business days. Premium clients receive priority turnaround.",
    },
    {
      question: "How many revisions do I get?",
      answer: "Unlimited revisions until you're 100% happy with the video. We don't cap revision rounds — your satisfaction is the standard.",
    },
    {
      question: "Do you match a specific editing style?",
      answer: "Yes. Share reference videos during onboarding and we'll match the pacing, style, and energy exactly. Your dedicated editor learns your preferences over time.",
    },
    {
      question: "Can I send footage shot on my phone?",
      answer: "Absolutely. We edit footage from any source — cinema cameras, iPhone, GoPro, or screen recordings. Quality varies by source but we'll always make it look its best.",
    },
  ],
};

export default function EditingPage() {
  return <ServicePageLayout data={data} />;
}
