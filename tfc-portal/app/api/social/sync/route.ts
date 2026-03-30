import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember, requireClientAccess } from "@/lib/auth-helpers";
import { decryptJson, isEncrypted } from "@/lib/crypto";

/**
 * POST /api/social/sync
 *
 * Syncs existing content from connected social accounts (Instagram, Facebook,
 * YouTube, TikTok) into the portal. Pulls recent posts and their metrics so
 * the analytics dashboard shows data for content that was posted outside the
 * portal.
 *
 * Body: { client_id: string }
 */
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();

  const { client_id } = await req.json();
  if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  // Allow both team members and clients to sync
  const access = await requireClientAccess(user.email!, client_id, admin);
  if (!access.ok) return access.response;

  // Fetch all connected social accounts for this client
  const { data: accounts } = await admin
    .from("client_social_accounts")
    .select("*")
    .eq("client_id", client_id)
    .eq("connected", true);

  if (!accounts?.length) {
    return NextResponse.json({ error: "No connected social accounts" }, { status: 400 });
  }

  const results: Array<{ platform: string; synced: number; error?: string }> = [];

  for (const account of accounts) {
    let accessToken: string | null = null;
    try {
      const stored = typeof account.access_token === "string"
        ? JSON.parse(account.access_token) : account.access_token;
      accessToken = isEncrypted(stored) ? decryptJson<string>(stored) : stored;
    } catch {
      accessToken = account.access_token;
    }

    if (!accessToken) {
      results.push({ platform: account.platform, synced: 0, error: "Cannot decrypt token" });
      continue;
    }

    let token: string = accessToken;

    // Refresh short-lived access tokens using stored refresh tokens
    if ((account.platform === "youtube" || account.platform === "tiktok") && account.refresh_token) {
      try {
        let refreshToken: string | null = null;
        const storedRefresh = typeof account.refresh_token === "string"
          ? JSON.parse(account.refresh_token) : account.refresh_token;
        refreshToken = isEncrypted(storedRefresh) ? decryptJson<string>(storedRefresh) : storedRefresh;
        if (refreshToken) {
          const body: Record<string, string> = { grant_type: "refresh_token", refresh_token: refreshToken };
          let tokenUrl: string;

          if (account.platform === "youtube") {
            tokenUrl = "https://oauth2.googleapis.com/token";
            body.client_id = process.env.GOOGLE_CLIENT_ID!;
            body.client_secret = process.env.GOOGLE_CLIENT_SECRET!;
          } else {
            tokenUrl = "https://open.tiktokapis.com/v2/oauth/token/";
            body.client_key = process.env.TIKTOK_CLIENT_KEY!;
            body.client_secret = process.env.TIKTOK_CLIENT_SECRET!;
          }

          const res = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(body).toString(),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.access_token) token = data.access_token;
          }
        }
      } catch { /* use existing */ }
    }

    try {
      if (account.platform === "instagram") {
        const synced = await syncInstagram(admin, client_id, account.platform_user_id || "", token);
        results.push({ platform: "instagram", synced });
      } else if (account.platform === "youtube") {
        const synced = await syncYouTube(admin, client_id, token);
        results.push({ platform: "youtube", synced });
      } else if (account.platform === "tiktok") {
        const synced = await syncTikTok(admin, client_id, token);
        results.push({ platform: "tiktok", synced });
      } else {
        results.push({ platform: account.platform, synced: 0, error: "Platform sync not supported" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[social/sync] Error syncing ${account.platform}:`, message);
      results.push({ platform: account.platform, synced: 0, error: message });
    }
  }

  const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
  return NextResponse.json({ synced: totalSynced, results });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

/**
 * Creates a scheduled_post record for externally published content (no kanban card).
 * Returns the scheduled_post ID, or null if creation failed.
 */
async function createSyncedPost(
  admin: Admin,
  clientId: string,
  platform: string,
  title: string,
  postedAt: string,
  platformPostId: string
): Promise<string | null> {
  const { data: post, error } = await admin
    .from("scheduled_posts")
    .insert({
      client_id: clientId,
      platform,
      caption: title || "",
      status: "posted",
      posted_at: postedAt,
      platform_post_id: platformPostId,
      scheduled_for: postedAt,
    })
    .select("id")
    .single();

  if (error || !post) {
    console.error(`[social/sync] Failed to create scheduled_post:`, error?.message);
    return null;
  }

  return post.id;
}

/**
 * Instagram — Fetch recent media from the IG Business Account and pull insights
 */
async function syncInstagram(admin: Admin, clientId: string, platformUserId: string, accessToken: string): Promise<number> {
  // First try to get the IG Business Account ID from the page
  let igUserId = platformUserId;
  try {
    const pageRes = await fetch(
      `https://graph.facebook.com/v21.0/${platformUserId}?fields=instagram_business_account&access_token=${accessToken}`
    );
    if (pageRes.ok) {
      const pageData = await pageRes.json();
      if (pageData.instagram_business_account?.id) {
        igUserId = pageData.instagram_business_account.id;
      }
    }
  } catch { /* use platformUserId */ }

  // Fetch recent media (last 30 days worth, up to 50 posts)
  const mediaRes = await fetch(
    `https://graph.facebook.com/v21.0/${igUserId}/media?fields=id,caption,timestamp,like_count,comments_count,media_type,permalink&limit=50&access_token=${accessToken}`
  );
  if (!mediaRes.ok) {
    const err = await mediaRes.text();
    throw new Error(`Instagram media fetch failed: ${err}`);
  }
  const mediaData = await mediaRes.json();
  const posts = mediaData.data || [];

  let synced = 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  for (const post of posts) {
    // Skip posts older than 30 days
    if (post.timestamp < thirtyDaysAgo) continue;

    // Check if we already have this post synced
    const { data: existing } = await admin
      .from("scheduled_posts")
      .select("id")
      .eq("platform_post_id", post.id)
      .eq("client_id", clientId)
      .maybeSingle();

    let scheduledPostId: string;

    if (existing) {
      scheduledPostId = existing.id;
    } else {
      const caption = (post.caption || "").substring(0, 100);
      const newId = await createSyncedPost(admin, clientId, "instagram", caption, post.timestamp, post.id);
      if (!newId) continue;
      scheduledPostId = newId;
    }

    // Pull insights for this media
    let views = 0, reach = 0, impressions = 0, shares = 0, saves = 0;
    try {
      const insightsRes = await fetch(
        `https://graph.facebook.com/v21.0/${post.id}/insights?metric=reach,impressions,shares,saved&access_token=${accessToken}`
      );
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        for (const insight of insightsData.data || []) {
          const val = insight.values?.[0]?.value || 0;
          if (insight.name === "reach") reach = val;
          if (insight.name === "impressions") { impressions = val; views = val; }
          if (insight.name === "shares") shares = val;
          if (insight.name === "saved") saves = val;
        }
      }
    } catch { /* insights may not be available for all media types */ }

    // Upsert metrics
    await admin.from("post_metrics").upsert(
      {
        scheduled_post_id: scheduledPostId,
        client_id: clientId,
        platform: "instagram",
        pulled_at: new Date().toISOString(),
        views: views || impressions,
        likes: post.like_count || 0,
        comments: post.comments_count || 0,
        shares,
        saves,
        reach,
        impressions,
      },
      { onConflict: "scheduled_post_id" }
    );
    synced++;
  }

  // Pull follower growth from account-level insights
  try {
    const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const until = Math.floor(Date.now() / 1000);
    const followerRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/insights?metric=follower_count&period=day&since=${since}&until=${until}&access_token=${accessToken}`
    );
    if (followerRes.ok) {
      const followerData = await followerRes.json();
      const values = followerData.data?.[0]?.values || [];
      if (values.length >= 2) {
        const oldest = values[0]?.value || 0;
        const newest = values[values.length - 1]?.value || 0;
        const growth = newest - oldest;
        // Attach follower growth to the most recent synced post's metrics
        const { data: latestPost } = await admin
          .from("scheduled_posts")
          .select("id")
          .eq("client_id", clientId)
          .eq("platform", "instagram")
          .eq("status", "posted")
          .order("posted_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestPost) {
          await admin
            .from("post_metrics")
            .update({ follower_growth: growth })
            .eq("scheduled_post_id", latestPost.id);
        }
      }
    }
  } catch { /* follower insights may not be available */ }

  // Also sync Facebook Page posts
  try {
    const fbSynced = await syncFacebookPage(admin, clientId, platformUserId, accessToken, thirtyDaysAgo);
    synced += fbSynced;
  } catch { /* Facebook page sync is optional */ }

  return synced;
}

/**
 * Facebook Page — Fetch recent page posts and their insights
 */
async function syncFacebookPage(admin: Admin, clientId: string, pageId: string, accessToken: string, since: string): Promise<number> {
  const feedRes = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/feed?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&limit=50&access_token=${accessToken}`
  );
  if (!feedRes.ok) return 0;
  const feedData = await feedRes.json();
  const posts = feedData.data || [];

  let synced = 0;
  for (const post of posts) {
    if (post.created_time < since) continue;

    const { data: existing } = await admin
      .from("scheduled_posts")
      .select("id")
      .eq("platform_post_id", post.id)
      .eq("client_id", clientId)
      .maybeSingle();

    let scheduledPostId: string;
    if (existing) {
      scheduledPostId = existing.id;
    } else {
      const message = (post.message || "Facebook post").substring(0, 100);
      const newId = await createSyncedPost(admin, clientId, "facebook", message, post.created_time, post.id);
      if (!newId) continue;
      scheduledPostId = newId;
    }

    // Pull post-level insights (reach, impressions)
    let reach = 0, impressions = 0;
    try {
      const insightsRes = await fetch(
        `https://graph.facebook.com/v21.0/${post.id}/insights?metric=post_impressions,post_impressions_unique&access_token=${accessToken}`
      );
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        for (const insight of insightsData.data || []) {
          const val = insight.values?.[0]?.value || 0;
          if (insight.name === "post_impressions") impressions = val;
          if (insight.name === "post_impressions_unique") reach = val;
        }
      }
    } catch { /* insights may not be available */ }

    await admin.from("post_metrics").upsert(
      {
        scheduled_post_id: scheduledPostId,
        client_id: clientId,
        platform: "facebook",
        pulled_at: new Date().toISOString(),
        views: impressions,
        likes: post.likes?.summary?.total_count || 0,
        comments: post.comments?.summary?.total_count || 0,
        shares: post.shares?.count || 0,
        saves: 0,
        reach,
        impressions,
      },
      { onConflict: "scheduled_post_id" }
    );
    synced++;
  }
  return synced;
}

/**
 * YouTube — Fetch recent uploads and their statistics
 */
async function syncYouTube(admin: Admin, clientId: string, accessToken: string): Promise<number> {
  // Get the channel's uploads playlist
  const channelRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!channelRes.ok) throw new Error("YouTube channel fetch failed");
  const channelData = await channelRes.json();
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error("No uploads playlist found");

  // Fetch recent videos
  const playlistRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!playlistRes.ok) throw new Error("YouTube playlist fetch failed");
  const playlistData = await playlistRes.json();
  const videos = playlistData.items || [];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const videoIds = videos
    .filter((v: { snippet: { publishedAt: string } }) => v.snippet.publishedAt >= thirtyDaysAgo)
    .map((v: { snippet: { resourceId: { videoId: string } } }) => v.snippet.resourceId.videoId);

  if (!videoIds.length) return 0;

  // Fetch stats for all videos in one call
  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(",")}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!statsRes.ok) throw new Error("YouTube stats fetch failed");
  const statsData = await statsRes.json();

  let synced = 0;
  for (const video of statsData.items || []) {
    const { data: existing } = await admin
      .from("scheduled_posts")
      .select("id")
      .eq("platform_post_id", video.id)
      .eq("client_id", clientId)
      .maybeSingle();

    let scheduledPostId: string;
    if (existing) {
      scheduledPostId = existing.id;
    } else {
      const title = video.snippet?.title || "YouTube video";
      const newId = await createSyncedPost(admin, clientId, "youtube", title, video.snippet?.publishedAt, video.id);
      if (!newId) continue;
      scheduledPostId = newId;
    }

    const stats = video.statistics || {};
    await admin.from("post_metrics").upsert(
      {
        scheduled_post_id: scheduledPostId,
        client_id: clientId,
        platform: "youtube",
        pulled_at: new Date().toISOString(),
        views: parseInt(stats.viewCount || "0", 10),
        likes: parseInt(stats.likeCount || "0", 10),
        comments: parseInt(stats.commentCount || "0", 10),
        shares: 0,
        saves: parseInt(stats.favoriteCount || "0", 10),
        reach: parseInt(stats.viewCount || "0", 10),
        impressions: parseInt(stats.viewCount || "0", 10),
      },
      { onConflict: "scheduled_post_id" }
    );
    synced++;
  }
  return synced;
}

/**
 * TikTok — Limited metrics (Research API needed for full stats).
 * Fetches user's video list and basic info.
 */
async function syncTikTok(admin: Admin, clientId: string, accessToken: string): Promise<number> {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,like_count,comment_count,share_count,view_count",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ max_count: 20 }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TikTok video list failed: ${err}`);
  }

  const data = await res.json();
  const videos = data.data?.videos || [];
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

  let synced = 0;
  for (const video of videos) {
    if (video.create_time < thirtyDaysAgo) continue;

    const { data: existing } = await admin
      .from("scheduled_posts")
      .select("id")
      .eq("platform_post_id", video.id)
      .eq("client_id", clientId)
      .maybeSingle();

    let scheduledPostId: string;
    if (existing) {
      scheduledPostId = existing.id;
    } else {
      const postedAt = new Date(video.create_time * 1000).toISOString();
      const title = video.title || "TikTok video";
      const newId = await createSyncedPost(admin, clientId, "tiktok", title, postedAt, video.id);
      if (!newId) continue;
      scheduledPostId = newId;
    }

    await admin.from("post_metrics").upsert(
      {
        scheduled_post_id: scheduledPostId,
        client_id: clientId,
        platform: "tiktok",
        pulled_at: new Date().toISOString(),
        views: video.view_count || 0,
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        shares: video.share_count || 0,
        saves: 0,
        reach: video.view_count || 0,
        impressions: video.view_count || 0,
      },
      { onConflict: "scheduled_post_id" }
    );
    synced++;
  }
  return synced;
}
