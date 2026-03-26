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
