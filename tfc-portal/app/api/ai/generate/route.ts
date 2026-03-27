import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

type ContentType =
  | "video_hook"
  | "video_script"
  | "caption"
  | "content_ideas"
  | "bio"
  | "cta";

const CONTENT_TYPE_PROMPTS: Record<ContentType, string> = {
  video_hook: `Generate 5 compelling video hooks (opening lines) for short-form content. Each hook should:
- Be 1-2 sentences max
- Create immediate curiosity or emotional response
- Be designed to stop the scroll
- Match the client's tone and delivery style

Format: Number each hook 1-5, one per line.`,

  video_script: `Write a complete short-form video script (30-60 seconds). Include:
- HOOK: A powerful opening line (first 3 seconds)
- BODY: The core message with a clear narrative arc
- CTA: A natural call-to-action that fits the client's offer

Format the script with clear sections labeled [HOOK], [BODY], and [CTA]. Include suggested on-screen text in [brackets].`,

  caption: `Write 3 social media captions for this content. Each caption should:
- Match the client's caption style preference
- Include a hook in the first line
- End with a clear CTA
- Suggest relevant hashtags (5-8)

Format: Number each caption 1-3, separated by blank lines.`,

  content_ideas: `Generate 10 content ideas based on the client's pillars and audience. For each idea include:
- Content title/concept
- Which content pillar it falls under
- Suggested platform
- Brief description (1-2 sentences)
- Suggested format type

Format as a numbered list.`,

  bio: `Write 3 versions of a social media bio that:
- Clearly communicates who they help and how
- Includes their unique positioning
- Has a clear CTA
- Fits within 150 characters for the short version, 300 for medium, full for long

Format: Label as SHORT, MEDIUM, and LONG versions.`,

  cta: `Generate 10 call-to-action variations for this client. Include:
- Link-in-bio CTAs
- End-of-video CTAs
- Story/caption CTAs
- DM-based CTAs

Each should feel natural to the client's voice and drive toward their offer.`,
};

function buildClientContext(onboardingData: Record<string, unknown>): string {
  const d = onboardingData;
  const sections: string[] = [];

  // Positioning
  if (d.whoIHelp || d.helpAchieve || d.byDoing || d.soTheyCan) {
    sections.push(`## Brand Positioning
- I help: ${d.whoIHelp || "N/A"}
- Achieve: ${d.helpAchieve || "N/A"}
- By doing: ${d.byDoing || "N/A"}
- So they can: ${d.soTheyCan || "N/A"}`);
  }

  // Audience
  if (d.primaryAudience || d.notMyAudience) {
    sections.push(`## Target Audience
- Primary audience: ${d.primaryAudience || "N/A"}
- NOT my audience: ${d.notMyAudience || "N/A"}`);
  }

  // Problems & Desires
  const problems = (d.problems as string[])?.filter(Boolean) || [];
  const desires = (d.desires as string[])?.filter(Boolean) || [];
  if (problems.length || desires.length) {
    sections.push(`## Audience Pain Points & Desires
- Problems they face: ${problems.join("; ") || "N/A"}
- What they desire: ${desires.join("; ") || "N/A"}`);
  }

  // Content Pillars
  const pillars = (d.pillars as string[])?.filter(Boolean) || [];
  if (pillars.length) {
    sections.push(`## Content Pillars
${pillars.map((p, i) => `${i + 1}. ${p}`).join("\n")}`);
  }

  // Tone & Voice
  if (d.delivery || d.swears || d.noGoTopics) {
    sections.push(`## Tone & Voice
- Delivery style: ${d.delivery || "N/A"}
- Uses profanity: ${d.swears || "N/A"}
- Topics to avoid: ${d.noGoTopics || "N/A"}`);
  }

  // Hot Takes
  const hotTakes = (d.hotTakes as string[])?.filter(Boolean) || [];
  if (hotTakes.length) {
    sections.push(`## Hot Takes / Strong Opinions
${hotTakes.map((t, i) => `${i + 1}. ${t}`).join("\n")}`);
  }

  // Content Formats
  if (d.formats || d.lengthRange || d.hookStyle || d.captionStyle) {
    const formats = Array.isArray(d.formats) ? (d.formats as string[]).join(", ") : d.formats;
    sections.push(`## Content Preferences
- Preferred formats: ${formats || "N/A"}
- Length range: ${d.lengthRange || "N/A"}
- Hook style: ${d.hookStyle || "N/A"}
- Caption style: ${d.captionStyle || "N/A"}`);
  }

  // Offer
  if (d.offerName || d.pricePoint || d.whoItsFor || d.callToAction) {
    sections.push(`## Offer Details
- Offer: ${d.offerName || "N/A"}
- Price: ${d.pricePoint || "N/A"}
- For: ${d.whoItsFor || "N/A"}
- CTA: ${d.callToAction || "N/A"}`);
  }

  return sections.join("\n\n");
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { client_id, content_type, platform, topic, additional_context } = body;

  if (!client_id || !content_type) {
    return NextResponse.json(
      { error: "client_id and content_type are required" },
      { status: 400 }
    );
  }

  if (!CONTENT_TYPE_PROMPTS[content_type as ContentType]) {
    return NextResponse.json(
      { error: `Invalid content_type. Valid types: ${Object.keys(CONTENT_TYPE_PROMPTS).join(", ")}` },
      { status: 400 }
    );
  }

  // Fetch client's onboarding data
  const admin = createSupabaseAdmin();
  const { data: client, error: clientError } = await admin
    .from("clients")
    .select("name, email, onboarding_data")
    .eq("id", client_id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const onboardingData = client.onboarding_data || {};
  const clientContext = buildClientContext(onboardingData);

  const systemPrompt = `You are a world-class content strategist and copywriter working for The Full Collection, a premium content agency. You are writing content for a specific client based on their brand profile.

# Client: ${client.name}

${clientContext}

# Instructions
- Write in the client's authentic voice based on their tone, delivery style, and preferences above.
- Every piece of content should serve their audience and drive toward their offer.
- Be specific, not generic. Use the client's actual positioning, pillars, and hot takes.
- Match their energy — if they're bold and direct, write that way. If they're warm and nurturing, match that.
- Never use filler phrases like "in today's world" or "let me tell you something."
- Every hook should be scroll-stopping. Every script should have a clear arc. Every caption should convert.`;

  let userPrompt = CONTENT_TYPE_PROMPTS[content_type as ContentType];

  if (platform) {
    userPrompt += `\n\nTarget platform: ${platform}`;
  }
  if (topic) {
    userPrompt += `\n\nTopic/Brief: ${topic}`;
  }
  if (additional_context) {
    userPrompt += `\n\nAdditional context: ${additional_context}`;
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return NextResponse.json({ error: "No text response from AI" }, { status: 500 });
    }

    return NextResponse.json({
      content: text.text,
      content_type,
      platform: platform || null,
      topic: topic || null,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate content. Please try again." },
      { status: 500 }
    );
  }
}
