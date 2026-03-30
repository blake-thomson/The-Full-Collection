export const COLUMNS = [
  { id: "idea", label: "Idea", color: "#6B7280" },
  { id: "filmed", label: "Filmed", color: "#3B82F6" },
  { id: "editing", label: "Editing", color: "#F59E0B" },
  { id: "edited_qcc", label: "Edited QCC", color: "#A78BFA" },
  { id: "ready_review", label: "Ready for Review", color: "#EC4899" },
  { id: "approved", label: "Approved for Publish", color: "#10B981" },
  { id: "revise", label: "Revise", color: "#EF4444" },
  { id: "scheduled", label: "Scheduled", color: "#06B6D4" },
  { id: "published", label: "Published", color: "#E02020" },
] as const;

export type ColumnId = (typeof COLUMNS)[number]["id"];

/** Map column id to its display label */
export const COLUMN_LABELS: Record<ColumnId, string> = Object.fromEntries(
  COLUMNS.map((c) => [c.id, c.label])
) as Record<ColumnId, string>;

/** Map column id to its dot color */
export const COLUMN_COLORS: Record<ColumnId, string> = Object.fromEntries(
  COLUMNS.map((c) => [c.id, c.color])
) as Record<ColumnId, string>;

export const STEP_TITLES = [
  "Define Your Positioning",
  "Clarify Your Audience",
  "Content Pillars",
  "Tone & Point of View",
  "Content Formats",
  "Reference Content",
  "Brand Assets & Links",
  "Offer Clarity",
];

export const FORMATS = [
  "Talking-head reels (direct to camera)",
  "Interview-style conversational clips",
  "Voiceover + b-roll",
  "On-screen text / story reels",
  "Framework reels (drawn, whiteboard, screen-record)",
  "Street interviews (public Q&A)",
  "Green screen / screen share",
];

export const EMPTY_ONBOARDING_DATA = {
  whoIHelp: "",
  helpAchieve: "",
  byDoing: "",
  soTheyCan: "",
  primaryAudience: "",
  notMyAudience: "",
  problems: ["", "", "", "", ""],
  desires: ["", "", "", "", ""],
  pillars: ["", "", "", "", ""],
  delivery: "",
  swears: "",
  noGoTopics: "",
  hotTakes: ["", "", ""],
  formats: [] as string[],
  lengthRange: "",
  hookStyle: "",
  captionStyle: "",
  references: [{ link: "", likes: "", copyVsAvoid: "" }],
  logoFiles: "",
  brandColors: "",
  fonts: "",
  website: "",
  instagram: "",
  tiktok: "",
  youtube: "",
  linkedin: "",
  brandGuidelines: "",
  pastContent: "",
  offerName: "",
  pricePoint: "",
  whoItsFor: "",
  callToAction: "",
};

export type OnboardingData = typeof EMPTY_ONBOARDING_DATA;

/** Industry options used in client onboarding + profile editing */
export const INDUSTRIES = [
  "Real Estate",
  "E-Commerce",
  "Health & Wellness",
  "Beauty & Skincare",
  "Fitness & Sports",
  "Food & Beverage",
  "Fashion & Apparel",
  "Music & Entertainment",
  "Tech & SaaS",
  "Finance & Investing",
  "Education & Coaching",
  "Non-Profit",
  "Construction & Trades",
  "Automotive",
  "Travel & Hospitality",
  "Legal",
  "Marketing & Advertising",
  "Other",
] as const;

/** Role metadata for team members */
export const ROLE_META: Record<string, { label: string; color: string; emoji: string; welcomeLine: string }> = {
  owner: { label: "Owner", color: "#F59E0B", emoji: "👑", welcomeLine: "You're running the show. Let's set up your profile so the team knows who's boss." },
  admin: { label: "Admin", color: "#FF3B3B", emoji: "🛡️", welcomeLine: "You keep everything running smooth. Let's get your profile set up." },
  project_manager: { label: "Project Manager", color: "#3B82F6", emoji: "📋", welcomeLine: "You keep the pipeline moving. Let's get your profile set up so the team knows who's keeping them on track." },
  editor: { label: "Editor", color: "#10B981", emoji: "🎬", welcomeLine: "The magic happens in the edit bay. Let's get your profile looking as good as your cuts." },
  smm: { label: "Social Media Manager", color: "#8B5CF6", emoji: "📱", welcomeLine: "You're the voice of the brand. Let's make sure your profile matches the energy." },
  social_media_manager: { label: "Social Media Manager", color: "#8B5CF6", emoji: "📱", welcomeLine: "You're the voice of the brand. Let's make sure your profile matches the energy." },
};

/** Normalize AI-generated content_type values to DB enum format */
export const CONTENT_TYPE_MAP: Record<string, string> = {
  "short-form": "short_form", "short form": "short_form", "shortform": "short_form",
  "long-form": "long_form", "long form": "long_form", "longform": "long_form",
  "post/carousel": "carousel", "post": "carousel",
};

export function normalizeContentType(raw: string): string {
  const key = raw.toLowerCase().trim();
  return CONTENT_TYPE_MAP[key] || key.replace(/[-\s]/g, "_");
}
