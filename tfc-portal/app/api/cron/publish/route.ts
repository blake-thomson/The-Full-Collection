import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { decryptJson, isEncrypted } from "@/lib/crypto";
import { publishToPlatform } from "@/lib/social-publisher";

/**
 * GET /api/cron/publish
 *
 * Runs every 10 minutes via Vercel Cron.
 * Finds scheduled_posts where scheduled_for <= now and status = 'scheduled',
 * fetches the client's social account tokens, calls the platform API, and
 * updates the record with the result.
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
  const now = new Date().toISOString();

  // Fetch all posts that are due
  const { data: duePosts, error: fetchErr } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (fetchErr) {
    console.error("[cron/publish] Error fetching due posts:", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!duePosts?.length) {
    return NextResponse.json({ message: "No posts due", published: 0 });
  }

  const results: Array<{ postId: string; platform: string; success: boolean; error?: string }> = [];

  for (const post of duePosts) {
    try {
      // Fetch the client's social account for this platform
      const { data: account } = await supabase
        .from("client_social_accounts")
        .select("*")
        .eq("client_id", post.client_id)
        .eq("platform", post.platform)
        .eq("connected", true)
        .single();

      if (!account) {
        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message: `No connected ${post.platform} account for this client`,
          })
          .eq("id", post.id);

        results.push({ postId: post.id, platform: post.platform, success: false, error: "No connected account" });
        continue;
      }

      // Decrypt the access token
      let accessToken: string | null = null;
      try {
        const stored = typeof account.access_token === "string"
          ? JSON.parse(account.access_token)
          : account.access_token;

        if (isEncrypted(stored)) {
          accessToken = decryptJson<string>(stored);
        } else {
          accessToken = stored;
        }
      } catch {
        accessToken = account.access_token;
      }

      if (!accessToken) {
        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message: "Could not decrypt access token",
          })
          .eq("id", post.id);

        results.push({ postId: post.id, platform: post.platform, success: false, error: "Token decryption failed" });
        continue;
      }

      // Check if token is expired and needs refresh
      // Note: token_expiry is null for permanent tokens (e.g. Meta Page tokens) — skip refresh
      if (account.token_expiry && new Date(account.token_expiry) < new Date()) {
        const refreshed = await refreshToken(supabase, account);
        if (refreshed) {
          accessToken = refreshed;
        } else {
          await supabase
            .from("scheduled_posts")
            .update({
              status: "failed",
              error_message: "Access token expired and refresh failed",
            })
            .eq("id", post.id);

          results.push({ postId: post.id, platform: post.platform, success: false, error: "Token expired" });
          continue;
        }
      }

      // Get attachment URL if there is one
      let attachmentUrl: string | undefined;
      if (post.attachment_id) {
        const { data: attachment } = await supabase
          .from("card_attachments")
          .select("drive_url")
          .eq("id", post.attachment_id)
          .single();
        attachmentUrl = attachment?.drive_url || undefined;
      }

      // Publish
      const result = await publishToPlatform({
        postId: post.id,
        platform: post.platform,
        caption: post.caption || "",
        hashtags: post.hashtags || [],
        accessToken,
        platformUserId: account.platform_user_id || "",
        attachmentUrl,
      });

      if (result.success) {
        await supabase
          .from("scheduled_posts")
          .update({
            status: "posted",
            posted_at: new Date().toISOString(),
            platform_post_id: result.platformPostId,
          })
          .eq("id", post.id);

        // Move kanban card to "published" if all platforms for this card are done
        const { data: remaining } = await supabase
          .from("scheduled_posts")
          .select("id")
          .eq("card_id", post.card_id)
          .eq("status", "scheduled");

        if (!remaining?.length) {
          await supabase
            .from("kanban_cards")
            .update({ column_id: "published" })
            .eq("id", post.card_id);
        }

        results.push({ postId: post.id, platform: post.platform, success: true });
      } else {
        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message: result.platformPostId || "Publishing failed",
          })
          .eq("id", post.id);

        results.push({ postId: post.id, platform: post.platform, success: false, error: "API call failed" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[cron/publish] Error publishing post ${post.id}:`, message);

      await supabase
        .from("scheduled_posts")
        .update({ status: "failed", error_message: message })
        .eq("id", post.id);

      results.push({ postId: post.id, platform: post.platform, success: false, error: message });
    }
  }

  const published = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  console.log(`[cron/publish] Published: ${published}, Failed: ${failed}`);

  return NextResponse.json({ published, failed, results });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshToken(supabase: any, account: any): Promise<string | null> {
  if (!account.refresh_token) return null;

  let refreshToken: string | null = null;
  try {
    const stored = typeof account.refresh_token === "string"
      ? JSON.parse(account.refresh_token)
      : account.refresh_token;
    if (isEncrypted(stored)) {
      refreshToken = decryptJson<string>(stored);
    } else {
      refreshToken = stored;
    }
  } catch {
    refreshToken = account.refresh_token;
  }

  if (!refreshToken) return null;

  try {
    const platform = account.platform;
    let tokenUrl: string;
    const body: Record<string, string> = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    };

    if (platform === "youtube") {
      tokenUrl = "https://oauth2.googleapis.com/token";
      body.client_id = process.env.GOOGLE_CLIENT_ID!;
      body.client_secret = process.env.GOOGLE_CLIENT_SECRET!;
    } else if (platform === "instagram" || platform === "facebook") {
      // Meta long-lived tokens don't use refresh_token — they're exchanged
      // for a new long-lived token before expiry
      tokenUrl = "https://graph.facebook.com/v21.0/oauth/access_token";
      body.grant_type = "fb_exchange_token";
      body.client_id = process.env.META_APP_ID!;
      body.client_secret = process.env.META_APP_SECRET!;
      body.fb_exchange_token = refreshToken;
      delete body.refresh_token;
    } else if (platform === "tiktok") {
      tokenUrl = "https://open.tiktokapis.com/v2/oauth/token/";
      body.client_key = process.env.TIKTOK_CLIENT_KEY!;
      body.client_secret = process.env.TIKTOK_CLIENT_SECRET!;
    } else {
      return null;
    }

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
    });

    if (!res.ok) {
      console.error(`[cron/publish] Token refresh failed for ${platform}:`, await res.text());
      return null;
    }

    const data = await res.json();
    const newAccessToken = data.access_token;
    if (!newAccessToken) return null;

    // Encrypt and save the new tokens
    const { encryptJson } = await import("@/lib/crypto");
    const encryptedAccess = encryptJson(newAccessToken);
    const updateData: Record<string, unknown> = {
      access_token: JSON.stringify(encryptedAccess),
      token_expiry: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null,
    };

    if (data.refresh_token) {
      const encryptedRefresh = encryptJson(data.refresh_token);
      updateData.refresh_token = JSON.stringify(encryptedRefresh);
    }

    await supabase
      .from("client_social_accounts")
      .update(updateData)
      .eq("id", account.id);

    return newAccessToken;
  } catch (err) {
    console.error("[cron/publish] Token refresh error:", err);
    return null;
  }
}
