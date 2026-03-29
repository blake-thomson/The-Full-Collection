/**
 * Social media publishing placeholders.
 *
 * Each platform requires app-review and production API credentials before
 * real publishing can happen.  These stubs are called by the scheduled-post
 * cron (when it exists) and log the intent so we can verify the flow works
 * end-to-end.
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

export async function publishToInstagram(payload: PublishPayload) {
  console.log("[social-publisher] Would publish to Instagram:", {
    postId: payload.postId,
    caption: payload.caption,
    platformUserId: payload.platformUserId,
  });
  return { success: true, platformPostId: null };
}

export async function publishToTikTok(payload: PublishPayload) {
  console.log("[social-publisher] Would publish to TikTok:", {
    postId: payload.postId,
    caption: payload.caption,
    platformUserId: payload.platformUserId,
  });
  return { success: true, platformPostId: null };
}

export async function publishToYouTube(payload: PublishPayload) {
  console.log("[social-publisher] Would publish to YouTube:", {
    postId: payload.postId,
    caption: payload.caption,
    platformUserId: payload.platformUserId,
  });
  return { success: true, platformPostId: null };
}

export async function publishToLinkedIn(payload: PublishPayload) {
  console.log("[social-publisher] Would publish to LinkedIn:", {
    postId: payload.postId,
    caption: payload.caption,
    platformUserId: payload.platformUserId,
  });
  return { success: true, platformPostId: null };
}

const publishers: Record<string, (p: PublishPayload) => Promise<{ success: boolean; platformPostId: string | null }>> = {
  instagram: publishToInstagram,
  tiktok: publishToTikTok,
  youtube: publishToYouTube,
  linkedin: publishToLinkedIn,
};

export async function publishToplatform(payload: PublishPayload) {
  const fn = publishers[payload.platform];
  if (!fn) throw new Error(`Unsupported platform: ${payload.platform}`);
  return fn(payload);
}
