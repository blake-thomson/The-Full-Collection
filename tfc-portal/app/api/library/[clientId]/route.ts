import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess } from "@/lib/auth-helpers";

// GET /api/library/[clientId] — Return all evergreen cards with metrics
export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = params;
  const admin = createSupabaseAdmin();

  const access = await requireClientAccess(user.email!, clientId, admin);
  if (!access.ok) return access.response;

  // Fetch all published evergreen cards
  const { data: cards, error } = await admin
    .from("kanban_cards")
    .select("id, title, description, platform, content_type, publish_date, is_evergreen, created_at")
    .eq("client_id", clientId)
    .eq("is_evergreen", true)
    .eq("column_id", "published")
    .is("deleted_at", null)
    .order("publish_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!cards || cards.length === 0) return NextResponse.json([]);

  // Fetch scheduled posts for these cards to link to metrics
  const cardIds = cards.map((c) => c.id);
  const { data: posts } = await admin
    .from("scheduled_posts")
    .select("id, card_id")
    .in("card_id", cardIds);

  const postIdsByCard: Record<string, string[]> = {};
  for (const p of posts || []) {
    if (!postIdsByCard[p.card_id]) postIdsByCard[p.card_id] = [];
    postIdsByCard[p.card_id].push(p.id);
  }

  // Fetch metrics for all related scheduled posts
  const allPostIds = Object.values(postIdsByCard).flat();
  let metricsMap: Record<string, { views: number; likes: number; shares: number }> = {};

  if (allPostIds.length > 0) {
    const { data: metrics } = await admin
      .from("post_metrics")
      .select("scheduled_post_id, views, likes, shares")
      .in("scheduled_post_id", allPostIds);

    // Aggregate metrics per scheduled_post_id (take latest/sum)
    const postMetrics: Record<string, { views: number; likes: number; shares: number }> = {};
    for (const m of metrics || []) {
      if (!postMetrics[m.scheduled_post_id]) {
        postMetrics[m.scheduled_post_id] = { views: 0, likes: 0, shares: 0 };
      }
      postMetrics[m.scheduled_post_id].views += Number(m.views) || 0;
      postMetrics[m.scheduled_post_id].likes += Number(m.likes) || 0;
      postMetrics[m.scheduled_post_id].shares += Number(m.shares) || 0;
    }

    // Aggregate per card
    for (const [cardId, postIds] of Object.entries(postIdsByCard)) {
      let totalViews = 0, totalLikes = 0, totalShares = 0;
      for (const pid of postIds) {
        const pm = postMetrics[pid];
        if (pm) {
          totalViews += pm.views;
          totalLikes += pm.likes;
          totalShares += pm.shares;
        }
      }
      metricsMap[cardId] = { views: totalViews, likes: totalLikes, shares: totalShares };
    }
  }

  const result = cards.map((card) => ({
    id: card.id,
    title: card.title,
    description: card.description,
    platform: card.platform,
    content_type: card.content_type,
    publish_date: card.publish_date,
    is_evergreen: card.is_evergreen,
    metrics: metricsMap[card.id] || { views: 0, likes: 0, shares: 0 },
  }));

  return NextResponse.json(result);
}
