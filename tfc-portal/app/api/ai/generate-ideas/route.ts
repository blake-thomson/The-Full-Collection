import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess } from "@/lib/auth-helpers";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

function buildClientContext(onboardingData: Record<string, unknown>): string {
  const d = onboardingData;
  const sections: string[] = [];

  if (d.whoIHelp || d.helpAchieve || d.byDoing || d.soTheyCan) {
    sections.push(`## Brand Positioning
- I help: ${d.whoIHelp || "N/A"}
- Achieve: ${d.helpAchieve || "N/A"}
- By doing: ${d.byDoing || "N/A"}
- So they can: ${d.soTheyCan || "N/A"}`);
  }

  if (d.primaryAudience || d.notMyAudience) {
    sections.push(`## Target Audience
- Primary audience: ${d.primaryAudience || "N/A"}
- NOT my audience: ${d.notMyAudience || "N/A"}`);
  }

  const problems = (d.problems as string[])?.filter(Boolean) || [];
  const desires = (d.desires as string[])?.filter(Boolean) || [];
  if (problems.length || desires.length) {
    sections.push(`## Audience Pain Points & Desires
- Problems: ${problems.join("; ") || "N/A"}
- Desires: ${desires.join("; ") || "N/A"}`);
  }

  const pillars = (d.pillars as string[])?.filter(Boolean) || [];
  if (pillars.length) {
    sections.push(`## Content Pillars
${pillars.map((p, i) => `${i + 1}. ${p}`).join("\n")}`);
  }

  if (d.delivery || d.swears || d.noGoTopics) {
    sections.push(`## Tone & Voice
- Delivery: ${d.delivery || "N/A"}
- Profanity: ${d.swears || "N/A"}
- Avoid topics: ${d.noGoTopics || "N/A"}`);
  }

  const hotTakes = (d.hotTakes as string[])?.filter(Boolean) || [];
  if (hotTakes.length) {
    sections.push(`## Hot Takes
${hotTakes.map((t, i) => `${i + 1}. ${t}`).join("\n")}`);
  }

  if (d.formats || d.lengthRange || d.hookStyle || d.captionStyle) {
    const formats = Array.isArray(d.formats) ? (d.formats as string[]).join(", ") : d.formats;
    sections.push(`## Content Preferences
- Formats: ${formats || "N/A"}
- Length: ${d.lengthRange || "N/A"}
- Hook style: ${d.hookStyle || "N/A"}
- Caption style: ${d.captionStyle || "N/A"}`);
  }

  if (d.offerName || d.pricePoint || d.whoItsFor || d.callToAction) {
    sections.push(`## Offer
- Name: ${d.offerName || "N/A"}
- Price: ${d.pricePoint || "N/A"}
- For: ${d.whoItsFor || "N/A"}
- CTA: ${d.callToAction || "N/A"}`);
  }

  return sections.join("\n\n");
}

/**
 * POST /api/ai/generate-ideas
 *
 * Generates content ideas based on client onboarding data + swiper preferences.
 * Returns structured JSON array of ideas for the swipe UI.
 */
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    client_id,
    format,        // "short_form" | "long_form" | "both"
    styles,        // string[] e.g. ["educational", "entertainment", "edutainment", "lifestyle"]
    video_types,   // string[] e.g. ["talking_head", "interview", "text_broll", "podcast", "qa", "street_interview", "greenscreen", "voiceover_broll"]
    platforms,     // string[] e.g. ["instagram", "tiktok", "youtube", "linkedin"]
    tone,          // string[] e.g. ["serious", "funny", "inspirational", "controversial"]
    hook_style,    // string[] e.g. ["question", "bold_statement", "statistic", "storytelling"]
    cta,           // string - custom CTA or "" for none
    pillar_focus,  // string[] - subset of their content pillars to focus on
    topic_hint,    // string - optional free text topic/keyword
    count,         // number - how many ideas (5, 10, 15)
  } = body;

  if (!client_id) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, client_id, admin);
  if (!access.ok) return access.response;

  const { data: client, error: clientErr } = await admin
    .from("clients")
    .select("name, email, onboarding_data")
    .eq("id", client_id)
    .single();

  if (clientErr || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const onboardingData = client.onboarding_data || {};
  const clientContext = buildClientContext(onboardingData);
  const ideaCount = Math.min(Math.max(count || 10, 3), 20);

  const systemPrompt = `You are a world-class content strategist for The Full Collection, a premium content agency. You generate highly specific, actionable content ideas tailored to each client's brand, audience, and voice.

# Client: ${client.name}

${clientContext}

# CRITICAL RULES
- Every idea MUST be specific to THIS client's brand, audience, and pillars — never generic.
- Use their actual positioning, pain points, hot takes, and offer details.
- Match their tone and delivery style exactly.
- Each idea should be immediately actionable — a creator should be able to film it today.
- No filler ideas. Every single one should be scroll-stopping.
- Vary the ideas — don't repeat the same angle. Mix educational, story-driven, controversial, and value-packed.`;

  let userPrompt = `Generate exactly ${ideaCount} content ideas for this client based on the following preferences:

## Content Preferences
- Format: ${format === "both" ? "Mix of short-form and long-form" : format === "long_form" ? "Long-form only" : "Short-form only"}
- Styles: ${styles?.length ? styles.join(", ") : "Any"}
- Video types: ${video_types?.length ? video_types.join(", ").replace(/_/g, " ") : "Any"}
- Target platforms: ${platforms?.length ? platforms.join(", ") : "Any"}
- Tone: ${tone?.length ? tone.join(", ") : "Match client's natural tone"}
- Hook style preference: ${hook_style?.length ? hook_style.join(", ").replace(/_/g, " ") : "Varied"}`;

  if (pillar_focus?.length) {
    userPrompt += `\n- Focus on these pillars: ${pillar_focus.join(", ")}`;
  }
  if (cta) {
    userPrompt += `\n- Include this CTA angle: ${cta}`;
  }
  if (topic_hint) {
    userPrompt += `\n- Topic/keyword to incorporate: ${topic_hint}`;
  }

  userPrompt += `

## OUTPUT FORMAT
Return a JSON array of exactly ${ideaCount} objects. Each object must have these exact fields:
{
  "title": "The video title/concept (compelling, specific)",
  "description": "2-3 sentence description of what this video covers and the angle",
  "hook": "The exact opening line / hook for the video",
  "platform": "instagram" | "tiktok" | "youtube" | "linkedin",
  "content_style": "Education" | "Lifestyle" | "Entertainment" | "Vlog",
  "content_type": "Short-form" | "Long-form" | "Post/Carousel",
  "video_type": "talking_head" | "interview" | "text_broll" | "podcast" | "qa" | "street_interview" | "greenscreen" | "voiceover_broll",
  "pillar": "Which content pillar this falls under",
  "cta": "The call-to-action for this video (or empty string)",
  "priority": "low" | "medium" | "high"
}

IMPORTANT: Return ONLY the JSON array. No markdown, no backticks, no explanation. Just the raw JSON array.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content.find((b: { type: string }) => b.type === "text");
    if (!text || text.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Parse the JSON response - handle potential markdown wrapping
    let raw = text.text.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let ideas;
    try {
      ideas = JSON.parse(raw);
    } catch {
      console.error("Failed to parse AI response as JSON:", raw.substring(0, 200));
      return NextResponse.json({ error: "Failed to parse generated ideas. Please try again." }, { status: 500 });
    }

    if (!Array.isArray(ideas)) {
      return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
    }

    return NextResponse.json({
      ideas,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (err) {
    console.error("AI idea generation error:", err);
    return NextResponse.json({ error: "Failed to generate ideas. Please try again." }, { status: 500 });
  }
}
