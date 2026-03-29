import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// POST /api/library/repurpose — AI repurpose suggestions for an evergreen card
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) return teamCheck.response;

  const body = await req.json();
  const { cardId, clientId } = body;

  if (!cardId || !clientId) {
    return NextResponse.json({ error: "cardId and clientId are required" }, { status: 400 });
  }

  // Fetch the card
  const { data: card, error: cardErr } = await admin
    .from("kanban_cards")
    .select("id, title, description, platform, content_type, publish_date, client_id")
    .eq("id", cardId)
    .eq("client_id", clientId)
    .single();

  if (cardErr || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Fetch metrics via scheduled_posts
  let metrics = { views: 0, likes: 0, shares: 0 };
  const { data: posts } = await admin
    .from("scheduled_posts")
    .select("id")
    .eq("card_id", cardId);

  if (posts && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const { data: metricRows } = await admin
      .from("post_metrics")
      .select("views, likes, shares")
      .in("scheduled_post_id", postIds);

    for (const m of metricRows || []) {
      metrics.views += Number(m.views) || 0;
      metrics.likes += Number(m.likes) || 0;
      metrics.shares += Number(m.shares) || 0;
    }
  }

  // Fetch client onboarding data
  const { data: client } = await admin
    .from("clients")
    .select("name, onboarding_data")
    .eq("id", clientId)
    .single();

  const onboardingData = client?.onboarding_data || {};
  const pillars = (onboardingData.pillars as string[])?.filter(Boolean) || [];
  const audience = onboardingData.primaryAudience || "N/A";

  const userPrompt = `This piece of content was posted on ${card.platform || "social media"} on ${card.publish_date || "unknown date"} and received ${metrics.views} views, ${metrics.likes} likes, ${metrics.shares} shares.
The title was "${card.title}". Description: "${card.description || "N/A"}"
Client brand pillars: ${pillars.length ? pillars.join(", ") : "N/A"}
Client target audience: ${audience}

Suggest 3 specific ways to repurpose this content for a new post, each on a different platform.
For each suggestion: provide the new hook (first 3 seconds script), platform, format, and rationale.
Return as JSON: { "suggestions": [{ "platform": string, "format": string, "hook": string, "rationale": string }] }

IMPORTANT: Return ONLY the JSON. No markdown, no backticks, no explanation.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let raw = text.text.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("Failed to parse repurpose response:", raw.substring(0, 200));
      return NextResponse.json({ error: "Failed to parse AI suggestions. Please try again." }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Repurpose AI error:", err);
    return NextResponse.json({ error: "Failed to generate suggestions. Please try again." }, { status: 500 });
  }
}
