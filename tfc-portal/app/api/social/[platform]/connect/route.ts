import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

const PLATFORM_CONFIG: Record<
  string,
  { authUrl: string; scopes: string; clientIdEnv: string }
> = {
  instagram: {
    authUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    scopes: "instagram_basic,instagram_content_publish,instagram_manage_comments,pages_read_engagement,pages_show_list,pages_manage_posts,business_management",
    clientIdEnv: "META_APP_ID",
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    scopes: "user.info.basic,user.info.profile,user.info.stats,video.list,video.upload,video.publish",
    clientIdEnv: "TIKTOK_CLIENT_KEY",
  },
  youtube: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
    clientIdEnv: "GOOGLE_CLIENT_ID",
  },
};

// GET /api/social/[platform]/connect?client_id=xxx
export async function GET(
  req: NextRequest,
  { params }: { params: { platform: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const platform = params.platform.toLowerCase();
  const config = PLATFORM_CONFIG[platform];
  if (!config) {
    return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 });
  }

  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) {
    return NextResponse.json({ error: "client_id required" }, { status: 400 });
  }

  const clientAppId = process.env[config.clientIdEnv];
  if (!clientAppId) {
    return NextResponse.json(
      { error: `${config.clientIdEnv} not configured` },
      { status: 500 }
    );
  }

  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/social/${platform}/callback`;
  const state = encodeURIComponent(JSON.stringify({ client_id: clientId }));

  const authParams = new URLSearchParams();

  if (platform === "tiktok") {
    authParams.set("client_key", clientAppId);
    authParams.set("scope", config.scopes);
    authParams.set("response_type", "code");
    authParams.set("redirect_uri", redirectUri);
    authParams.set("state", state);
  } else {
    authParams.set("client_id", clientAppId);
    authParams.set("redirect_uri", redirectUri);
    authParams.set("state", state);
    authParams.set("response_type", "code");
    if (platform === "youtube") {
      authParams.set("scope", config.scopes);
      authParams.set("access_type", "offline");
      authParams.set("prompt", "consent");
    } else {
      authParams.set("scope", config.scopes);
    }
  }

  const url = `${config.authUrl}?${authParams.toString()}`;
  return NextResponse.redirect(url);
}
