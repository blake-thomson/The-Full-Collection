import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess } from "@/lib/auth-helpers";

// GET /api/analytics/[clientId]?platform=instagram&range=30  (or range=7|90|custom&start=...&end=...)
export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, params.clientId, admin);
  if (!access.ok) return access.response;

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") || null;
  const range = searchParams.get("range") || "30";
  const customStart = searchParams.get("start");
  const customEnd = searchParams.get("end");

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  if (range === "custom" && customStart && customEnd) {
    startDate = new Date(customStart);
    endDate = new Date(customEnd);
  } else {
    const days = parseInt(range, 10) || 30;
    startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  const periodLength = endDate.getTime() - startDate.getTime();
  const prevStart = new Date(startDate.getTime() - periodLength);
  const prevEnd = new Date(startDate.getTime());

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();
  const prevStartISO = prevStart.toISOString();
  const prevEndISO = prevEnd.toISOString();

  try {
    // Fetch current period metrics joined with scheduled_posts
    let metricsQuery = admin
      .from("post_metrics")
      .select("*, scheduled_posts!inner(id, card_id, platform, caption, posted_at, status)")
      .eq("client_id", params.clientId)
      .gte("pulled_at", startISO)
      .lte("pulled_at", endISO);

    if (platform) {
      metricsQuery = metricsQuery.eq("platform", platform.toLowerCase());
    }

    const { data: metrics } = await metricsQuery;

    // Fetch previous period metrics for comparison
    let prevQuery = admin
      .from("post_metrics")
      .select("views, likes, shares, follower_growth")
      .eq("client_id", params.clientId)
      .gte("pulled_at", prevStartISO)
      .lte("pulled_at", prevEndISO);

    if (platform) {
      prevQuery = prevQuery.eq("platform", platform.toLowerCase());
    }

    const { data: prevMetrics } = await prevQuery;

    // Fetch scheduled posts for content type info
    let postsQuery = admin
      .from("scheduled_posts")
      .select("id, card_id, platform, caption, posted_at, status, kanban_cards(title, content_type)")
      .eq("client_id", params.clientId)
      .gte("posted_at", startISO)
      .lte("posted_at", endISO);

    if (platform) {
      postsQuery = postsQuery.eq("platform", platform.toLowerCase());
    }

    const { data: posts } = await postsQuery;

    // Calculate summary
    const currentMetrics = metrics || [];
    const prevMetricsList = prevMetrics || [];

    const totalViews = currentMetrics.reduce((sum, m) => sum + (Number(m.views) || 0), 0);
    const totalLikes = currentMetrics.reduce((sum, m) => sum + (Number(m.likes) || 0), 0);
    const totalShares = currentMetrics.reduce((sum, m) => sum + (Number(m.shares) || 0), 0);
    const totalEngagement = totalLikes + totalShares + currentMetrics.reduce((sum, m) => sum + (Number(m.comments) || 0), 0);
    const avgEngagementRate = totalViews > 0 ? Number(((totalEngagement / totalViews) * 100).toFixed(2)) : 0;
    const followerGrowth = currentMetrics.reduce((sum, m) => sum + (Number(m.follower_growth) || 0), 0);

    const prevTotalViews = prevMetricsList.reduce((sum, m) => sum + (Number(m.views) || 0), 0);
    const prevTotalLikes = prevMetricsList.reduce((sum, m) => sum + (Number(m.likes) || 0), 0);
    const prevFollowerGrowth = prevMetricsList.reduce((sum, m) => sum + (Number(m.follower_growth) || 0), 0);

    // Group by date
    const byDateMap: Record<string, { views: number; likes: number; shares: number }> = {};
    for (const m of currentMetrics) {
      const date = new Date(m.pulled_at).toISOString().split("T")[0];
      if (!byDateMap[date]) byDateMap[date] = { views: 0, likes: 0, shares: 0 };
      byDateMap[date].views += Number(m.views) || 0;
      byDateMap[date].likes += Number(m.likes) || 0;
      byDateMap[date].shares += Number(m.shares) || 0;
    }
    const byDate = Object.entries(byDateMap)
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by content type (from joined kanban_cards)
    const byContentTypeMap: Record<string, { views: number; likes: number; count: number }> = {};
    for (const p of posts || []) {
      const card = p.kanban_cards as { title?: string; content_type?: string } | null;
      const type = card?.content_type || p.platform || "other";
      if (!byContentTypeMap[type]) byContentTypeMap[type] = { views: 0, likes: 0, count: 0 };
      byContentTypeMap[type].count += 1;
      // Find matching metrics for this post
      const postMetrics = currentMetrics.filter((m) => m.scheduled_post_id === p.id);
      for (const pm of postMetrics) {
        byContentTypeMap[type].views += Number(pm.views) || 0;
        byContentTypeMap[type].likes += Number(pm.likes) || 0;
      }
    }
    const byContentType = Object.entries(byContentTypeMap).map(([type, vals]) => ({
      type,
      ...vals,
    }));

    // Top posts
    const postMetricsMap: Record<string, { views: number; likes: number; shares: number; comments: number }> = {};
    for (const m of currentMetrics) {
      const pid = m.scheduled_post_id;
      if (!pid) continue;
      if (!postMetricsMap[pid]) postMetricsMap[pid] = { views: 0, likes: 0, shares: 0, comments: 0 };
      postMetricsMap[pid].views += Number(m.views) || 0;
      postMetricsMap[pid].likes += Number(m.likes) || 0;
      postMetricsMap[pid].shares += Number(m.shares) || 0;
      postMetricsMap[pid].comments += Number(m.comments) || 0;
    }

    const topPosts = (posts || [])
      .map((p) => {
        const card = p.kanban_cards as { title?: string; content_type?: string } | null;
        const pm = postMetricsMap[p.id] || { views: 0, likes: 0, shares: 0, comments: 0 };
        const engagement = pm.likes + pm.shares + pm.comments;
        const engagementRate = pm.views > 0 ? Number(((engagement / pm.views) * 100).toFixed(2)) : 0;
        return {
          id: p.id,
          title: card?.title || p.caption || "Untitled",
          platform: p.platform,
          views: pm.views,
          likes: pm.likes,
          shares: pm.shares,
          engagementRate,
          postedAt: p.posted_at,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return NextResponse.json({
      summary: {
        totalViews,
        totalLikes,
        totalShares,
        avgEngagementRate,
        followerGrowth,
      },
      byDate,
      byContentType,
      topPosts,
      previousPeriod: {
        totalViews: prevTotalViews,
        totalLikes: prevTotalLikes,
        followerGrowth: prevFollowerGrowth,
      },
    });
  } catch (err) {
    console.error("Analytics fetch error:", err);
    return NextResponse.json(
      {
        summary: { totalViews: 0, totalLikes: 0, totalShares: 0, avgEngagementRate: 0, followerGrowth: 0 },
        byDate: [],
        byContentType: [],
        topPosts: [],
        previousPeriod: { totalViews: 0, totalLikes: 0, followerGrowth: 0 },
      },
      { status: 200 }
    );
  }
}
