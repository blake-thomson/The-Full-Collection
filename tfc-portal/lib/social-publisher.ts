/**
 * Social media publishing — real API integrations.
 *
 * Instagram: Meta Graph API container-based publishing
 * Facebook:  Meta Graph API page post
 * YouTube:   YouTube Data API v3 video upload (requires resumable upload)
 * TikTok:    TikTok Content Posting API v2
 */

export interface PublishPayload {
  postId: string;
  platform: string;
  caption: string;
  hashtags: string[];
  accessToken: string;
  platformUserId: string;
  attachmentUrl?: string;
}

interface PublishResult {
  success: boolean;
  platformPostId: string | null;
  error?: string;
}

/**
 * Instagram publishing via Meta Graph API.
 * Two-step process: create media container, then publish it.
 * Supports image posts. Video requires additional polling for processing.
 */
export async function publishToInstagram(payload: PublishPayload): Promise<PublishResult> {
  const { accessToken, platformUserId, caption, hashtags, attachmentUrl } = payload;
  const fullCaption = buildCaption(caption, hashtags);

  if (!attachmentUrl) {
    console.log("[social-publisher] Instagram: No attachment URL — publishing text-only is not supported on Instagram");
    return { success: false, platformPostId: null, error: "Instagram requires an image or video attachment" };
  }

  try {
    // Step 1: Get Instagram Business Account ID from the Facebook Page
    const igAccountRes = await fetch(
      `https://graph.facebook.com/v21.0/${platformUserId}?fields=instagram_business_account&access_token=${accessToken}`
    );
    const igAccountData = await igAccountRes.json();
    const igUserId = igAccountData.instagram_business_account?.id;

    if (!igUserId) {
      // The platformUserId might already be the IG user ID
      // Try using it directly
      return await publishToInstagramDirect(igAccountData.id || platformUserId, fullCaption, attachmentUrl, accessToken);
    }

    return await publishToInstagramDirect(igUserId, fullCaption, attachmentUrl, accessToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[social-publisher] Instagram error:", message);
    return { success: false, platformPostId: null, error: message };
  }
}

async function publishToInstagramDirect(
  igUserId: string,
  caption: string,
  imageUrl: string,
  accessToken: string
): Promise<PublishResult> {
  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v21.0/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );

  const containerData = await containerRes.json();
  if (containerData.error) {
    return { success: false, platformPostId: null, error: containerData.error.message };
  }

  const containerId = containerData.id;

  // Step 2: Publish the container
  const publishRes = await fetch(
    `https://graph.facebook.com/v21.0/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  const publishData = await publishRes.json();
  if (publishData.error) {
    return { success: false, platformPostId: null, error: publishData.error.message };
  }

  return { success: true, platformPostId: publishData.id };
}

/**
 * TikTok publishing via Content Posting API v2.
 * Uses the "pull from URL" method — TikTok fetches the video from a public URL.
 */
export async function publishToTikTok(payload: PublishPayload): Promise<PublishResult> {
  const { accessToken, caption, hashtags, attachmentUrl } = payload;
  const fullCaption = buildCaption(caption, hashtags);

  if (!attachmentUrl) {
    return { success: false, platformPostId: null, error: "TikTok requires a video attachment" };
  }

  try {
    // TikTok Direct Post — pull from URL
    const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: fullCaption.substring(0, 150),
          privacy_level: "SELF_ONLY", // Start as private — user can change on TikTok
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: attachmentUrl,
        },
      }),
    });

    const data = await res.json();
    if (data.error?.code !== "ok" && data.error?.code) {
      return { success: false, platformPostId: null, error: data.error.message || data.error.code };
    }

    return { success: true, platformPostId: data.data?.publish_id || null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[social-publisher] TikTok error:", message);
    return { success: false, platformPostId: null, error: message };
  }
}

/**
 * YouTube publishing via YouTube Data API v3.
 * For video uploads, requires a resumable upload flow. This implementation
 * handles metadata-only updates and simple video uploads via URL.
 *
 * Note: Full video upload requires streaming the file, which needs the video
 * binary. When attachmentUrl is a Google Drive link, we initiate a resumable
 * upload session.
 */
export async function publishToYouTube(payload: PublishPayload): Promise<PublishResult> {
  const { accessToken, caption, hashtags, attachmentUrl } = payload;
  const title = caption.split("\n")[0]?.substring(0, 100) || "New Video";
  const description = buildCaption(caption, hashtags);

  if (!attachmentUrl) {
    return { success: false, platformPostId: null, error: "YouTube requires a video attachment" };
  }

  try {
    // Step 1: Download the video from the attachment URL
    const videoRes = await fetch(attachmentUrl);
    if (!videoRes.ok) {
      return { success: false, platformPostId: null, error: "Could not fetch video from attachment URL" };
    }
    const videoBuffer = await videoRes.arrayBuffer();

    // Step 2: Initialize resumable upload
    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": "video/*",
          "X-Upload-Content-Length": videoBuffer.byteLength.toString(),
        },
        body: JSON.stringify({
          snippet: {
            title,
            description,
            tags: hashtags,
            categoryId: "22", // People & Blogs
          },
          status: {
            privacyStatus: "private", // Start as private — user publishes on YouTube
            selfDeclaredMadeForKids: false,
          },
        }),
      }
    );

    if (!initRes.ok) {
      const err = await initRes.text();
      return { success: false, platformPostId: null, error: `Upload init failed: ${err}` };
    }

    const uploadUrl = initRes.headers.get("location");
    if (!uploadUrl) {
      return { success: false, platformPostId: null, error: "No upload URL returned" };
    }

    // Step 3: Upload the video
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/*",
        "Content-Length": videoBuffer.byteLength.toString(),
      },
      body: videoBuffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return { success: false, platformPostId: null, error: `Upload failed: ${err}` };
    }

    const uploadData = await uploadRes.json();
    return { success: true, platformPostId: uploadData.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[social-publisher] YouTube error:", message);
    return { success: false, platformPostId: null, error: message };
  }
}

/**
 * Facebook Page publishing via Graph API.
 * Posts to the page's feed as the page itself.
 */
export async function publishToFacebook(payload: PublishPayload): Promise<PublishResult> {
  const { accessToken, platformUserId, caption, hashtags, attachmentUrl } = payload;
  const fullCaption = buildCaption(caption, hashtags);

  try {
    const body: Record<string, string> = {
      message: fullCaption,
      access_token: accessToken,
    };

    // If there's an image attachment, use photos endpoint
    if (attachmentUrl) {
      body.url = attachmentUrl;

      const res = await fetch(
        `https://graph.facebook.com/v21.0/${platformUserId}/photos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      if (data.error) {
        return { success: false, platformPostId: null, error: data.error.message };
      }
      return { success: true, platformPostId: data.post_id || data.id };
    }

    // Text-only post
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${platformUserId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    if (data.error) {
      return { success: false, platformPostId: null, error: data.error.message };
    }

    return { success: true, platformPostId: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[social-publisher] Facebook error:", message);
    return { success: false, platformPostId: null, error: message };
  }
}

function buildCaption(caption: string, hashtags: string[]): string {
  if (!hashtags?.length) return caption;
  const hashtagStr = hashtags
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ");
  return `${caption}\n\n${hashtagStr}`;
}

const publishers: Record<
  string,
  (p: PublishPayload) => Promise<PublishResult>
> = {
  instagram: publishToInstagram,
  tiktok: publishToTikTok,
  youtube: publishToYouTube,
  facebook: publishToFacebook,
};

export async function publishToPlatform(
  payload: PublishPayload
): Promise<PublishResult> {
  const fn = publishers[payload.platform];
  if (!fn) throw new Error(`Unsupported platform: ${payload.platform}`);
  return fn(payload);
}
