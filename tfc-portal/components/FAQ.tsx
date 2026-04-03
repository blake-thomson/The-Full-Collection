"use client";

import { useState, useEffect } from "react";

/* ── FAQ Data ── */

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    title: "Getting Started",
    icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8",
    items: [
      {
        q: "How do I set up my account for the first time?",
        a: "After signing up and completing payment, you'll receive a welcome email with a link to set your password. Once you log in, you'll be guided through a welcome flow to upload your photo, select your industry, and write a short bio. After that, you'll complete the onboarding questionnaire where you'll define your brand positioning, audience, content pillars, and more. This information helps our team create content that's truly tailored to you.",
      },
      {
        q: "What is the onboarding questionnaire used for?",
        a: "The onboarding questionnaire captures your brand voice, target audience, content preferences, and business goals. Our team uses this information to write scripts, choose content styles, and ensure everything we produce aligns with your brand. You can review your answers anytime from the Intake section in your dashboard.",
      },
      {
        q: "How do I update my profile picture or bio?",
        a: "Click your name at the bottom of the sidebar (or tap your avatar on mobile) to open your Profile. From there, click 'Edit Profile' to update your bio and industry, or click your avatar to upload a new photo. Changes save immediately.",
      },
      {
        q: "I forgot my password. How do I reset it?",
        a: "On the login page, click 'Forgot password?' and enter your email. You'll receive a reset link that's valid for 24 hours. Click the link, set a new password, and you're back in.",
      },
    ],
  },
  {
    title: "Content Tracker (Kanban Board)",
    icon: "M3 3h7v18H3zM14 3h7v10h-7z",
    items: [
      {
        q: "What do the different columns mean?",
        a: "Your content moves through these stages: Idea (new concepts), Filmed (footage captured), Ready to Edit (waiting for an editor), Editing (editor is working on it), Edited QCC (quality check complete), Ready for Review (waiting for your approval), Approved (you've approved it), Revise (needs changes), Scheduled (set to go live), and Published (live on your platforms). Each stage has a color-coded dot so you can see progress at a glance.",
      },
      {
        q: "How do I submit a new content idea?",
        a: "Go to the Content Tracker and click '+ Add card' on the Idea column. This opens the full card detail modal where you can fill in the title, description, and any details like platform preference, content style, or reference links. Your team will be notified automatically.",
      },
      {
        q: "What is the AI Idea Generator?",
        a: "Click 'Generate Ideas' above the Content Tracker to open the idea generator. Walk through a quick questionnaire about content format, style, video type, tone, and hook style, then AI generates ideas you can swipe through — swipe right to keep, left to skip. Accepted ideas are automatically added to your Idea column.",
      },
      {
        q: "How do I approve or request revisions on content?",
        a: "When content reaches the 'Ready for Review' column, you'll receive a notification. Open the card to see all the details and watch the edited video URL. Your team will move it to 'Approved' or 'Revise' based on your input.",
      },
      {
        q: "What does the AI writing assistant do?",
        a: "When editing a card description, press the spacebar in an empty description field to trigger the AI assistant. It uses your onboarding data (brand voice, audience, pillars) to generate relevant content suggestions like video hooks, scripts, captions, and CTAs. You can accept, reject, or regenerate suggestions.",
      },
      {
        q: "Can I see content on a calendar view?",
        a: "Yes! Switch to the Calendar tab to see all your content plotted by due date. Click any date to see the cards scheduled for that day. This is great for visualizing your content pipeline and spotting gaps.",
      },
    ],
  },
  {
    title: "Messages & Communication",
    icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    items: [
      {
        q: "How do I message my team?",
        a: "Go to the Messages tab in your sidebar. Type your message at the bottom and hit send. Your team will be notified. You can also use @mentions to tag specific team members, and start threaded conversations by clicking 'Reply' on any message.",
      },
      {
        q: "What are threads and how do I use them?",
        a: "Threads keep conversations organized. Click 'Reply' on any message to start a thread — it creates a focused sub-conversation without cluttering the main chat. This is great for discussing specific cards or topics.",
      },
      {
        q: "Can I send voice messages?",
        a: "Yes! Click the microphone icon in the message input to record a voice message. Press the stop button when you're done, then send it like a regular message. Voice messages show a playback player for easy listening.",
      },
      {
        q: "What does the /help command do?",
        a: "Type /help in the message input to create a support ticket. This flags your message as a help request so your team can prioritize and address it quickly.",
      },
    ],
  },
  {
    title: "Files & Google Drive",
    icon: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
    items: [
      {
        q: "How do I connect my Google Drive?",
        a: "Go to the Files tab and click 'Connect Google Drive'. You'll be redirected to Google to authorize access. Once connected, you'll be able to browse your Drive files directly in the portal. You can navigate folders, search files, and preview documents without leaving the app.",
      },
      {
        q: "How do I disconnect Google Drive?",
        a: "In the Files tab, click the 'Disconnect' button at the top. This removes the connection and deletes your stored access token. You can always reconnect later.",
      },
      {
        q: "What file types can I preview?",
        a: "Most Google Workspace files (Docs, Sheets, Slides) can be previewed directly in the portal. Images, PDFs, and videos will also show previews. For other file types, you can click to open them in Google Drive.",
      },
    ],
  },
  {
    title: "Billing & Subscription",
    icon: "M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2zM1 10h22",
    items: [
      {
        q: "What subscription plans are available?",
        a: "We offer three tiers: Starter ($3,000/mo) includes 15 short-form videos, 1 shoot day, AI script tool, calendar, and posting schedule. Core ($5,000/mo) includes 30 short-form, 2 YouTube videos, 2 shoot days, plus social media management. Premium ($7,500/mo) includes 45 short-form, 4 YouTube videos, 5 shoot days, monthly strategy calls, and priority turnaround.",
      },
      {
        q: "How do I view my billing information?",
        a: "Click your profile at the bottom of the sidebar, then select the 'Billing' tab. You'll see your current plan name, monthly rate, next payment date, total paid, and subscription start date. You can also click 'Manage Billing & Payment Method' to update your payment info through Stripe. If your payment is past due, you'll see a banner with instructions.",
      },
      {
        q: "What if I have a custom subscription?",
        a: "If you have a custom package, your plan name and price will reflect exactly what was set up in Stripe. Your billing section always shows your actual plan details regardless of whether it's a standard tier or custom scope.",
      },
      {
        q: "What happens if my payment fails?",
        a: "If a payment fails, your subscription status changes to 'Past Due' and a banner will appear on your dashboard. Stripe will automatically retry the payment. If you need to update your payment method, contact our team and we'll send you a secure link.",
      },
      {
        q: "How do I cancel my subscription?",
        a: "Contact our team directly to discuss cancellation. We'll work with you to understand your needs and process the request through Stripe. Your access continues until the end of your current billing period.",
      },
    ],
  },
  {
    title: "Resources & Assets",
    icon: "M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
    items: [
      {
        q: "What is the Resources section?",
        a: "Resources is a shared library where your team uploads guides, templates, brand assets, and reference materials for your account. You can browse by category, search, and download files.",
      },
      {
        q: "Can I upload my own resources?",
        a: "Yes! Click 'Add Resource' in the Resources tab. You can upload files or paste links to external resources. Add a name, category, and optional description to keep things organized.",
      },
    ],
  },
  {
    title: "Notifications & Activity",
    icon: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
    items: [
      {
        q: "How do notifications work?",
        a: "You'll receive in-app notifications when your content moves to a new stage (like 'Ready for Review' or 'Published'), when your team sends you a message, or when important updates happen. Click the bell icon to see all your notifications, and click 'Mark all as read' to clear them.",
      },
      {
        q: "Will I get email notifications?",
        a: "Yes, for key events like content status changes, you'll receive an email notification in addition to the in-app alert. This ensures you never miss important updates even when you're not logged in.",
      },
    ],
  },
  {
    title: "Trash & Recovery",
    icon: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2",
    items: [
      {
        q: "What happens when I delete something?",
        a: "Deleted items (content cards, messages, resources) go to the Trash bin instead of being permanently removed. You can access Trash from the sidebar to review, restore, or permanently delete items.",
      },
      {
        q: "How long do deleted items stay in the trash?",
        a: "Items remain in the trash for 30 days before being automatically purged. You can restore any item within that window, or permanently delete it sooner if you prefer.",
      },
      {
        q: "How do I restore a deleted item?",
        a: "Open the Trash tab from your sidebar. Find the item you want to recover and click the restore (undo) icon. The item will be moved back to its original location.",
      },
    ],
  },
  {
    title: "Account & Security",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    items: [
      {
        q: "How do I change my password?",
        a: "Go to your Profile (click your name in the sidebar), then under the Account tab, click 'Change Password'. Enter your new password, confirm it, and save. Passwords must be at least 6 characters.",
      },
      {
        q: "Is my data secure?",
        a: "Yes. We use Supabase with Row Level Security (RLS) to ensure you can only access your own data. OAuth tokens (like Google Drive) are encrypted with AES-256-GCM before storage. All API endpoints require authentication, and sensitive operations require additional role-based authorization.",
      },
      {
        q: "Who can see my content and messages?",
        a: "Only you and your assigned team members can see your content, messages, and files. Team members with the appropriate roles (YouTube Editors / Short Form Editors, admin, owner) can view and manage your content pipeline. Other clients cannot see your data.",
      },
    ],
  },
];

/* ── Team-specific FAQ items ── */

const TEAM_FAQ_DATA: FAQCategory[] = [
  {
    title: "Managing Clients",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    items: [
      {
        q: "How do I create a new client?",
        a: "Go to the Team tab (owner/admin only), then click 'Create Client'. Enter their name and email. This creates their account and sends a welcome email with login instructions. They'll go through the onboarding flow on their first login.",
      },
      {
        q: "How do I assign team members to a client?",
        a: "Select a client from the All Clients list, then go to the Assignments tab. Use the dropdown to pick a team member and click 'Assign'. Assigned members receive notifications when that client's content changes status.",
      },
      {
        q: "How do I view a client's intake data?",
        a: "Select a client, then click the 'Intake' tab. This shows all their onboarding questionnaire responses — positioning, audience, content pillars, tone, formats, brand assets, and more. Use this to inform your content creation.",
      },
    ],
  },
  {
    title: "Team Management",
    icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8",
    items: [
      {
        q: "What roles are available?",
        a: "Owner (full control, gold badge), Admin (management access, red badge), Project Manager (operational oversight, blue badge), YouTube Editor (long-form video editing, green badge), Short Form Editor (short-form content editing, cyan badge), Videographer (content capture, pink badge), and Social Media Manager (publishing & scheduling, purple badge). Only Owners and Admins can invite members, delete members, and create clients.",
      },
      {
        q: "How do I invite a new team member?",
        a: "Go to the Team tab, click 'Invite Member', enter their name, email, and select a role. They'll receive an email with an invite code and a link to set up their account. Invite codes are single-use and tied to their email.",
      },
      {
        q: "How do I remove a team member?",
        a: "In the Team tab, click the trash icon next to the member you want to remove. Confirm the deletion. This removes their access, client assignments, and disables their auth account. Only Owners and Admins can do this.",
      },
    ],
  },
  {
    title: "Content Pipeline",
    icon: "M3 3h7v18H3zM14 3h7v10h-7z",
    items: [
      {
        q: "How does the notification system work for card moves?",
        a: "When content moves between columns, notifications are automatically sent based on role routing: 'Filmed' notifies Project Managers, 'Ready to Edit' notifies YouTube Editors (for long-form) or Short Form Editors (for short-form) based on content type, 'Edited QCC' notifies Admins/Owners, 'Ready for Review' notifies the Client, 'Approved' notifies SMMs, 'Revise' notifies YouTube Editors (for long-form) or Short Form Editors (for short-form) based on content type, 'Scheduled' notifies the Client, 'Published' notifies the Client. When a Shoot Date is set, Videographers are notified. When an Edit Deadline is set, YouTube Editors and Short Form Editors are both notified. Only team members assigned to that client receive notifications.",
      },
      {
        q: "How do I use the AI content generator?",
        a: "Use the inline AI trigger (press space in an empty description) in a card detail. Choose a content type (video hook, script, caption, bio, CTA, content ideas) and optionally select a platform. The AI uses the client's onboarding data to generate tailored content.",
      },
    ],
  },
];

/* ── Component ── */

const TYPE_LABELS: Record<string, string> = { feature: "Feature Request", bug: "Bug Report", improvement: "Improvement" };
const TYPE_COLORS: Record<string, string> = { feature: "#3B82F6", bug: "#EF4444", improvement: "#10B981" };
const STATUS_LABELS: Record<string, string> = { pending: "Pending", reviewing: "Reviewing", planned: "Planned", done: "Done", declined: "Declined" };
const STATUS_COLORS: Record<string, string> = { pending: "#F59E0B", reviewing: "#3B82F6", planned: "#8B5CF6", done: "#10B981", declined: "#6B7280" };

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  type: string;
  submitted_by: string;
  submitted_by_name: string;
  status: string;
  created_at: string;
}

export function FAQ({ userType = "client", userRole }: { userType?: "client" | "team"; userRole?: string }) {
  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);

  // Feature request form state
  const [frTitle, setFrTitle] = useState("");
  const [frDesc, setFrDesc] = useState("");
  const [frType, setFrType] = useState("feature");
  const [frBusy, setFrBusy] = useState(false);
  const [frSuccess, setFrSuccess] = useState(false);
  const [frErr, setFrErr] = useState("");

  // Admin review state
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const isAdmin = userRole === "owner" || userRole === "admin";

  const loadRequests = async () => {
    setLoadingRequests(true);
    const res = await fetch("/api/feature-requests");
    if (res.ok) setRequests(await res.json());
    setLoadingRequests(false);
  };

  useEffect(() => {
    if (isAdmin && showRequests) loadRequests();
  }, [isAdmin, showRequests]);

  const submitRequest = async () => {
    setFrErr("");
    if (!frTitle.trim() || !frDesc.trim()) { setFrErr("Please fill in all fields."); return; }
    setFrBusy(true);
    const res = await fetch("/api/feature-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: frTitle, description: frDesc, type: frType }),
    });
    setFrBusy(false);
    if (!res.ok) { const d = await res.json(); setFrErr(d.error || "Failed to submit."); return; }
    setFrTitle(""); setFrDesc(""); setFrType("feature");
    setFrSuccess(true);
    setTimeout(() => setFrSuccess(false), 5000);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/feature-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  };

  const categories = userType === "team" ? [...FAQ_DATA, ...TEAM_FAQ_DATA] : FAQ_DATA;

  const filtered = search.trim()
    ? categories
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              item.q.toLowerCase().includes(search.toLowerCase()) ||
              item.a.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((cat) => cat.items.length > 0)
    : categories;

  const totalResults = filtered.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-heading font-bold text-text mb-1">Help Center</h1>
        <p className="text-text-3 text-[13px]">
          Find answers to common questions about using The Full Collection portal.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpenCategory(null);
            setOpenItem(null);
          }}
          placeholder="Search for help..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-2 border border-border text-text text-[13px] font-body placeholder:text-text-3 focus:outline-none focus:border-red/40 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text bg-transparent border-none cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {search && (
        <p className="text-text-3 text-[12px] mb-4">
          {totalResults} result{totalResults !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Categories */}
      <div className="space-y-3">
        {filtered.map((cat, catIdx) => {
          const isCatOpen = openCategory === catIdx || !!search;

          return (
            <div key={cat.title} className="rounded-xl border border-border bg-surface overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => {
                  if (!search) setOpenCategory(openCategory === catIdx ? null : catIdx);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-transparent border-none cursor-pointer text-left transition-colors hover:bg-surface-2"
              >
                <span className="shrink-0 text-red">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={cat.icon} />
                  </svg>
                </span>
                <span className="flex-1 text-text text-[14px] font-semibold font-body">
                  {cat.title}
                </span>
                <span className="text-text-3 text-[11px] mr-2">{cat.items.length}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-text-3 transition-transform"
                  style={{ transform: isCatOpen ? "rotate(180deg)" : "none" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Items */}
              {isCatOpen && (
                <div className="border-t border-border">
                  {cat.items.map((item) => {
                    const key = `${cat.title}-${item.q}`;
                    const isOpen = openItem === key;

                    return (
                      <div key={key} className="border-b border-border last:border-b-0">
                        <button
                          onClick={() => setOpenItem(isOpen ? null : key)}
                          className="w-full flex items-start gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left transition-colors hover:bg-surface-2"
                        >
                          <span className="shrink-0 mt-0.5 text-text-3">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          </span>
                          <span className="flex-1 text-text text-[13px] font-medium font-body">
                            {item.q}
                          </span>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 mt-0.5 text-text-3 transition-transform"
                            style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-3 pl-11">
                            <p className="text-text-2 text-[13px] leading-relaxed font-body">
                              {item.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-text-3 mb-3">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="text-text-3 text-[14px]">No results found for &ldquo;{search}&rdquo;</p>
          <p className="text-text-3 text-[12px] mt-1">Try different keywords or browse the categories above.</p>
        </div>
      )}

      {/* Contact footer */}
      <div className="mt-8 p-4 rounded-xl border border-border bg-surface-2 text-center">
        <p className="text-text-2 text-[13px] mb-1">Still need help?</p>
        <p className="text-text-3 text-[12px]">
          Send a message to your team from the Messages tab, or type <code className="text-red bg-surface px-1.5 py-0.5 rounded text-[11px]">/help</code> to create a support ticket.
        </p>
      </div>

      {/* Feature Request Form — team only */}
      {userType === "team" && (
        <div className="mt-6 rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-surface-2 flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-red shrink-0">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span className="text-text text-[14px] font-semibold">Submit a Feature Request</span>
          </div>
          <div className="p-5">
            {frSuccess ? (
              <div className="bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)] rounded-lg p-4 text-center">
                <p className="text-[#10B981] text-sm font-bold m-0 mb-1">Request submitted!</p>
                <p className="text-text-3 text-[12px] m-0">Blake will review it and update the status.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                <p className="text-text-3 text-[12px] m-0 leading-relaxed">
                  Found a bug, have an idea, or want something improved? Submit it here and it'll go straight to Blake's review queue.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(["feature", "bug", "improvement"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFrType(t)}
                      className="tfc-pill capitalize"
                      style={frType === t ? { background: `${TYPE_COLORS[t]}18`, color: TYPE_COLORS[t], border: `1px solid ${TYPE_COLORS[t]}40` } : {}}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="tfc-label">Title</label>
                  <input
                    className="tfc-input"
                    value={frTitle}
                    onChange={(e) => setFrTitle(e.target.value)}
                    placeholder="Brief summary of the request"
                  />
                </div>
                <div>
                  <label className="tfc-label">Description</label>
                  <textarea
                    className="tfc-input resize-none"
                    rows={3}
                    value={frDesc}
                    onChange={(e) => setFrDesc(e.target.value)}
                    placeholder="Describe what you'd like to see, or what's broken and how to reproduce it..."
                  />
                </div>
                {frErr && <div className="text-[#FCA5A5] text-[13px] bg-[rgba(239,68,68,0.08)] py-2 px-3 rounded-[7px]">{frErr}</div>}
                <button className="tfc-btn py-[9px] px-5 text-xs self-start" onClick={submitRequest} disabled={frBusy}>
                  {frBusy ? "Submitting..." : "Submit Request →"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Review Panel — owner/admin only */}
      {userType === "team" && isAdmin && (
        <div className="mt-4 rounded-xl border border-border bg-surface overflow-hidden">
          <button
            onClick={() => setShowRequests(!showRequests)}
            className="w-full px-5 py-4 border-b border-border bg-surface-2 flex items-center justify-between bg-transparent cursor-pointer text-left hover:bg-surface-3 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-red shrink-0">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              <span className="text-text text-[14px] font-semibold">Review Requests</span>
              <span className="text-[11px] font-bold text-text-3 bg-surface-3 border border-border py-[2px] px-2 rounded-md">Owner / Admin</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-3 transition-transform" style={{ transform: showRequests ? "rotate(180deg)" : "none" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showRequests && (
            <div className="p-5">
              {loadingRequests ? (
                <p className="text-text-3 text-[13px] text-center py-4">Loading...</p>
              ) : requests.length === 0 ? (
                <p className="text-text-3 text-[13px] text-center py-4">No requests submitted yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {requests.map((r) => (
                    <div key={r.id} className="bg-surface-2 border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-text text-[13px] font-semibold">{r.title}</span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.08em] py-[2px] px-2 rounded-md"
                              style={{ color: TYPE_COLORS[r.type], background: `${TYPE_COLORS[r.type]}18`, border: `1px solid ${TYPE_COLORS[r.type]}30` }}>
                              {TYPE_LABELS[r.type]}
                            </span>
                          </div>
                          <p className="text-text-2 text-[12px] m-0 leading-relaxed">{r.description}</p>
                          <p className="text-text-3 text-[11px] m-0 mt-1.5">
                            {r.submitted_by_name} · {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <select
                          value={r.status}
                          onChange={(e) => updateStatus(r.id, e.target.value)}
                          className="text-[11px] font-bold uppercase tracking-[0.06em] py-[4px] px-2.5 rounded-lg border cursor-pointer bg-surface shrink-0"
                          style={{ color: STATUS_COLORS[r.status], borderColor: `${STATUS_COLORS[r.status]}40` }}
                        >
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
