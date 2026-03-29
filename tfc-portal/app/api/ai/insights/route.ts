import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess } from "@/lib/auth-helpers";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const body = await req.json();
  const { clientId } = body;
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const access = await requireClientAccess(user.email!, clientId, supabase);
  if (!access.ok) return access.response;

  // Check if client has enough post metrics
  const { count, error: countErr } = await supabase
    .from("post_metrics")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 });

  if (!count || count < 10) {
    return NextResponse.json({ hasEnoughData: false });
  }

  // Fetch client info
  const { data: client } = await supabase
    .from("clients")
    .select("name, onboarding_data")
    .eq("id", clientId)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const onboarding = client.onboarding_data || {};

  // Fetch last 90 days of posts with metrics
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: metrics, error: metricsErr } = await supabase
    .from("post_metrics")
    .select("platform, content_type, title, views, likes, shares, posted_at")
    .eq("client_id", clientId)
    .gte("posted_at", ninetyDaysAgo.toISOString())
    .order("posted_at", { ascending: false });

  if (metricsErr) return NextResponse.json({ error: metricsErr.message }, { status: 500 });

  const pillars = Array.isArray(onboarding.pillars)
    ? (onboarding.pillars as string[]).filter(Boolean).join(", ")
    : "general content";

  const systemPrompt = `You are a data analyst for a content agency. Analyze this client's content performance.

Client: ${client.name}, Industry: ${onboarding.whoIHelp || "general"}
Content pillars: ${pillars}

Performance data (last 90 days):
${JSON.stringify(metrics, null, 2)}

Return JSON:
{
  "topFormat": { "format": string, "avgViews": number, "recommendation": string },
  "bestPostingTimes": [{ "day": string, "time": string, "platform": string }],
  "underperforming": { "format": string, "recommendation": string },
  "actionItems": [{ "priority": "high"|"medium"|"low", "action": string, "rationale": string }]
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: systemPrompt }],
    });

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return NextResponse.json({ error: "No text response from AI" }, { status: 500 });
    }

    let parsed;
    try {
      const jsonMatch = text.text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text.text);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ hasEnoughData: true, ...parsed });
  } catch (err) {
    console.error("AI insights error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
