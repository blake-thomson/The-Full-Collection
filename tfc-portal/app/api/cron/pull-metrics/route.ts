import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { decryptJson, isEncrypted } from "@/lib/crypto";

/**
 * GET /api/cron/pull-metrics
 *
 * Runs daily via Vercel Cron. Pulls engagement metrics (views, likes, shares,
 * comments, saves, reach) from Instagram, TikTok, and YouTube for all published
 * posts and writes them to the post_metrics table.
 */
export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Fetch all posted scheduled_posts that have a platform_post_id
  const { data: posts, error: postsErr } = await supabase
    .from("scheduled_posts")
    .select("id, client_id, platform, platform_post_id, posted_at")
    .eq("status", "posted")
    .not("platform_post_id", "is", null)
    .order("posted_at", { ascending: false })
    .limit(200);

  if (postsErr || !posts?.length) {
    return NextResponse.json({ message: "No posted content to pull metrics for", pulled: 0 });
  }

  // Group posts by client+platform so we can look up tokens efficiently
  const clientPlatformKeys = new Set(posts.map((p) => `${p.client_id}|${p.platform}`));
  const tokenCache: Record<string, string> = {};

  for (const key of clientPlatformKeys) {
    const [clientId, platform] = key.split("|");
    const { data: account } = await supabase
      .from("client_social_accounts")
      .select("access_token, refresh_token, token_expiry, platform")
      .eq("client_id", clientId)
      .eq("platform", platform)
      .eq("connected", true)
      .maybeSingle();

    if (!account) continue;

    let accessToken: string | null = null;
    try {
      const stored = typeof account.access_token === "string"
        ? JSON.parse(account.access_token)
        : account.access_token;
      accessToken = isEncrypted(stored) ? decryptJson<string>(stored) : stored;
    } catch {
      accessToken = account.access_token;
    }

    // For YouTube, refresh the short-lived access token if needed
    if (platform === "youtube" && account.refresh_token) {
      try {
        let refreshToken: string | null = null;
        const storedRefresh = typeof account.refresh_token === "string"
          ? JSON.parse(account.refresh_token)
          : account.refresh_token;
        refreshToken = isEncrypted(storedRefresh) ? decryptJson<string>(storedRefresh) : storedRefresh;

        if (refreshToken) {
          const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: refreshToken,
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            }).toString(),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.access_token) accessToken = data.access_token;
          }
        }
      } catch {
        // Use existing token
      }
    }

    if (accessToken) tokenCache[key] = accessToken;
  }

  const results: Array<{ postId: string; platform: string; success: boolean; error?: string }> = [];

  for (const post of posts) {
    const key = `${post.client_id}|${post.platform}`;
    const accessToken = tokenCache[key];

    if (!accessToken) {
      results.push({ postId: post.id, platform: post.platform, success: false, error: "No token" });
      continue;
    }

    try {
      const metrics = await fetchMetricsForPost(post.platform, post.platform_post_id, accessToken);

      if (metrics) {
        await supabase.from("post_metrics").upsert(
          {
            scheduled_post_id: post.id,
            client_id: post.client_id,
            platform: post.platform,
            pulled_at: new Date().toISOString(),
            views: metrics.views || 0,
            likes: metrics.likes || 0,
            comments: metrics.comments || 0,
            shares: metrics.shares || 0,
            saves: metrics.saves || 0,
            reach: metrics.reach || 0,
            impressions: metrics.impressions || 0,
          },
          { onConflict: "scheduled_post_id" }
        );
        results.push({ postId: post.id, platform: post.platform, success: true });
      } else {
        results.push({ postId: post.id, platform: post.platform, success: false, error: "No metrics returned" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[pull-metrics] Error for post ${post.id}:`, message);
      results.push({ postId: post.id, platform: post.platform, success: false, error: message });
    }
  }

  const pulled = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`[cron/pull-metrics] Pulled: ${pulled}, Failed: ${failed}`);

  return NextResponse.json({ pulled, failed, results });
}

interface PostMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
}

async function fetchMetricsForPost(
  platform: string,
  platformPostId: string,
  accessToken: string
): Promise<PostMetrics | null> {
  if (platform === "instagram") return fetchInstagramMetrics(platformPostId, accessToken);
  if (platform === "youtube") return fetchYouTubeMetrics(platformPostId, accessToken);
  if (platform === "tiktok") return fetchTikTokMetrics(platformPostId, accessToken);
  return null;
}

/**
 * Instagram — Meta Graph API media insights
 * Uses the media ID (platform_post_id) to fetch reach, impressions, likes, comments, shares, saves.
 */
async function fetchInstagramMetrics(mediaId: string, accessToken: string): Promise<PostMetrics | null> {
  try {
    // Fetch basic media fields
    const fieldsRes = await fetch(
      `https://graph.facebook.com/v21.0/${mediaId}?fields=like_count,comments_count&access_token=${accessToken}`
    );
    const fieldsData = fieldsRes.ok ? await fieldsRes.json() : {};

    // Fetch insights (reach, impressions, shares, saves)
    const insightsRes = await fetch(
      `https://graph.facebook.com/v21.0/${mediaId}/insights?metric=reach,impressions,shares,saved&access_token=${accessToken}`
    );
    const insightsData = insightsRes.ok ? await insightsRes.json() : {};

    const insightsMap: Record<string, number> = {};
    if (insightsData.data) {
      for (const insight of insightsData.data) {
        insightsMap[insight.name] = insight.values?.[0]?.value || 0;
      }
    }

    return {
      views: insightsMap.impressions || 0,
      likes: fieldsData.like_count || 0,
      comments: fieldsData.comments_count || 0,
      shares: insightsMap.shares || 0,
      saves: insightsMap.saved || 0,
      reach: insightsMap.reach || 0,
      impressions: insightsMap.impressions || 0,
    };
  } catch (err) {
    console.error("[pull-metrics] Instagram error:", err);
    return null;
  }
}

/**
 * YouTube — YouTube Data API v3 video statistics
 * Uses the video ID (platform_post_id) to fetch views, likes, comments.
 */
async function fetchYouTubeMetrics(videoId: string, accessToken: string): Promise<PostMetrics | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const stats = data.items?.[0]?.statistics;
    if (!stats) return null;

    return {
      views: parseInt(stats.viewCount || "0", 10),
      likes: parseInt(stats.likeCount || "0", 10),
      comments: parseInt(stats.commentCount || "0", 10),
      shares: 0, // YouTube doesn't expose share count
      saves: 0,
      reach: parseInt(stats.viewCount || "0", 10),
      impressions: parseInt(stats.viewCount || "0", 10),
    };
  } catch (err) {
    console.error("[pull-metrics] YouTube error:", err);
    return null;
  }
}

/**
 * TikTok — Content Posting API query status
 * TikTok's API is limited — we can check publish status but metrics
 * require the Research API (which needs separate approval).
 * For now we pull what's available from the user info endpoint.
 */
async function fetchTikTokMetrics(publishId: string, accessToken: string): Promise<PostMetrics | null> {
  try {
    // Try to get video info via the query endpoint
    const res = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publish_id: publishId }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    // TikTok publish status response doesn't include metrics directly.
    // If the video has been published, we return zeros and the weekly
    // token-health cron will verify the account is still connected.
    // Full metrics require TikTok Research API access.
    if (data.data?.status === "PUBLISH_COMPLETE") {
      return {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        reach: 0,
        impressions: 0,
      };
    }

    return null;
  } catch (err) {
    console.error("[pull-metrics] TikTok error:", err);
    return null;
  }
}
