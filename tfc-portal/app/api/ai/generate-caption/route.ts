import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const body = await req.json();
  const { cardId, platform } = body;
  if (!cardId || !platform) {
    return NextResponse.json({ error: "cardId and platform are required" }, { status: 400 });
  }

  // Fetch card data
  const { data: card, error: cardErr } = await supabase
    .from("kanban_cards")
    .select("*")
    .eq("id", cardId)
    .single();

  if (cardErr || !card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Fetch client onboarding data
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("name, onboarding_data")
    .eq("id", card.client_id)
    .single();

  if (clientErr || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const onboarding = client.onboarding_data || {};
  const tone = onboarding.delivery || "professional and engaging";
  const pillars = Array.isArray(onboarding.pillars)
    ? (onboarding.pillars as string[]).filter(Boolean).join(", ")
    : "general content";
  const audience = onboarding.primaryAudience || "general audience";

  const systemPrompt = `You are a social media copywriter for ${client.name}.
Their brand voice: ${tone}
Their content pillars: ${pillars}
Their target audience: ${audience}

Write a caption for a ${platform} post about: ${card.title}${card.description ? ` - ${card.description}` : ""}

Requirements:
- Platform: ${platform} — match native style and character limits
- Include relevant hashtags (10-15 for Instagram, 3-5 for LinkedIn, 5-10 for TikTok)
- Match the brand voice exactly
- End with a clear call to action

Return JSON: { "caption": "the caption text", "hashtags": ["tag1", "tag2"], "hook": "opening line" }`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: systemPrompt }],
    });

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return NextResponse.json({ error: "No text response from AI" }, { status: 500 });
    }

    // Parse JSON from response (handle potential markdown wrapping)
    let parsed;
    try {
      const jsonMatch = text.text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text.text);
    } catch {
      // If JSON parse fails, return raw text as caption
      parsed = { caption: text.text, hashtags: [], hook: "" };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("AI caption generation error:", err);
    return NextResponse.json({ error: "Failed to generate caption" }, { status: 500 });
  }
}
