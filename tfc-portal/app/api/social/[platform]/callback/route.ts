import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { encryptJson } from "@/lib/crypto";

interface TokenExchangeResult {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  platform_user_id?: string;
  account_name?: string;
}

const TOKEN_ENDPOINTS: Record<string, string> = {
  instagram: "https://graph.facebook.com/v18.0/oauth/access_token",
  tiktok: "https://open.tiktokapis.com/v2/oauth/token/",
  youtube: "https://oauth2.googleapis.com/token",
  facebook: "https://graph.facebook.com/v18.0/oauth/access_token",
};

async function exchangeCode(
  platform: string,
  code: string,
  redirectUri: string
): Promise<TokenExchangeResult> {
  const endpoint = TOKEN_ENDPOINTS[platform];
  if (!endpoint) throw new Error(`No token endpoint for ${platform}`);

  const body: Record<string, string> = {
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };

  if (platform === "instagram") {
    body.client_id = process.env.META_APP_ID!;
    body.client_secret = process.env.META_APP_SECRET!;
  } else if (platform === "tiktok") {
    body.client_key = process.env.TIKTOK_CLIENT_KEY!;
    body.client_secret = process.env.TIKTOK_CLIENT_SECRET!;
  } else if (platform === "youtube") {
    body.client_id = process.env.GOOGLE_CLIENT_ID!;
    body.client_secret = process.env.GOOGLE_CLIENT_SECRET!;
  } else if (platform === "facebook") {
    body.client_id = process.env.META_APP_ID!;
    body.client_secret = process.env.META_APP_SECRET!;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  // Normalize across platforms
  if (platform === "tiktok") {
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      platform_user_id: data.open_id,
    };
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

async function fetchAccountName(
  platform: string,
  accessToken: string
): Promise<{ name: string; userId?: string }> {
  try {
    if (platform === "instagram") {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
      );
      const data = await res.json();
      const page = data.data?.[0];
      return { name: page?.name || "Instagram Account", userId: page?.id };
    }
    if (platform === "youtube") {
      const res = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      const ch = data.items?.[0];
      return { name: ch?.snippet?.title || "YouTube Channel", userId: ch?.id };
    }
    if (platform === "facebook") {
      const res = await fetch("https://graph.facebook.com/v18.0/me?fields=id,name", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      return { name: data.name || "Facebook Page", userId: data.id };
    }
    if (platform === "tiktok") {
      return { name: "TikTok Account" };
    }
  } catch {
    // Fallback
  }
  return { name: `${platform} account` };
}

// GET /api/social/[platform]/callback
export async function GET(
  req: NextRequest,
  { params }: { params: { platform: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/team/login", req.url));
  }

  const platform = params.platform.toLowerCase();
  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state");

  if (!code || !stateRaw) {
    return NextResponse.redirect(
      new URL("/team/portal?error=oauth_missing_params", req.url)
    );
  }

  let clientId: string;
  try {
    const parsed = JSON.parse(decodeURIComponent(stateRaw));
    clientId = parsed.client_id;
  } catch {
    return NextResponse.redirect(
      new URL("/team/portal?error=oauth_invalid_state", req.url)
    );
  }

  try {
    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/social/${platform}/callback`;
    const tokens = await exchangeCode(platform, code, redirectUri);
    const account = await fetchAccountName(platform, tokens.access_token);

    const encryptedAccessToken = encryptJson(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptJson(tokens.refresh_token)
      : null;

    const tokenExpiry = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    const admin = createSupabaseAdmin();
    const { error } = await admin
      .from("client_social_accounts")
      .upsert(
        {
          client_id: clientId,
          platform,
          account_name: account.name,
          access_token: JSON.stringify(encryptedAccessToken),
          refresh_token: encryptedRefreshToken
            ? JSON.stringify(encryptedRefreshToken)
            : null,
          token_expiry: tokenExpiry,
          platform_user_id: tokens.platform_user_id || account.userId || null,
          connected: true,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "client_id,platform" }
      );

    if (error) {
      console.error("[social-callback] DB error:", error);
      return NextResponse.redirect(
        new URL(`/team/portal?error=oauth_db_error`, req.url)
      );
    }

    return NextResponse.redirect(
      new URL(
        `/team/portal?tab=clients&social_connected=${platform}`,
        req.url
      )
    );
  } catch (err) {
    console.error("[social-callback] Error:", err);
    return NextResponse.redirect(
      new URL(`/team/portal?error=oauth_exchange_failed`, req.url)
    );
  }
}
