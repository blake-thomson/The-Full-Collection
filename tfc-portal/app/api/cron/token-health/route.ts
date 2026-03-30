import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { decryptJson, isEncrypted } from "@/lib/crypto";

/**
 * GET /api/cron/token-health
 *
 * Runs weekly via Vercel Cron. Validates all connected social account tokens
 * by making a lightweight API call. Flags any that have gone bad (e.g. client
 * changed their password or revoked access) so the team knows immediately.
 */
export async function GET(req: NextRequest) {
  const secret =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  const { data: accounts, error } = await supabase
    .from("client_social_accounts")
    .select("id, client_id, platform, access_token, token_expiry, account_name")
    .eq("connected", true);

  if (error || !accounts?.length) {
    return NextResponse.json({ message: "No connected accounts", checked: 0 });
  }

  const results: Array<{ id: string; platform: string; account: string; valid: boolean; error?: string }> = [];

  for (const account of accounts) {
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
      results.push({ id: account.id, platform: account.platform, account: account.account_name || "", valid: false, error: "Cannot decrypt token" });
      continue;
    }

    // Lightweight validation call per platform
    let valid = false;
    let errorMsg: string | undefined;

    try {
      if (account.platform === "instagram") {
        const res = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`);
        valid = res.ok;
        if (!valid) errorMsg = `Meta API returned ${res.status}`;
      } else if (account.platform === "youtube") {
        const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id&mine=true", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        valid = res.ok;
        if (!valid) errorMsg = `YouTube API returned ${res.status}`;
      } else if (account.platform === "tiktok") {
        const res = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        valid = res.ok;
        if (!valid) errorMsg = `TikTok API returned ${res.status}`;
      }
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : "Network error";
    }

    if (!valid) {
      // Mark as disconnected so it shows up in the UI
      await supabase
        .from("client_social_accounts")
        .update({ connected: false })
        .eq("id", account.id);

      // Get client name for the notification
      const { data: client } = await supabase
        .from("clients")
        .select("name")
        .eq("id", account.client_id)
        .maybeSingle();

      // Notify admins and SMMs
      const { data: teamMembers } = await supabase
        .from("team_members")
        .select("email, role")
        .in("role", ["owner", "admin", "social_media_manager", "smm"]);

      if (teamMembers?.length) {
        const notifications = teamMembers.map((m) => ({
          recipient_email: m.email,
          recipient_type: "team",
          title: `${account.platform} disconnected`,
          message: `${client?.name || "A client"}'s ${account.platform} account "${account.account_name}" needs to be reconnected.`,
          link: "/team/portal",
          type: "social_token_expired",
        }));
        await supabase.from("notifications").insert(notifications);
      }
    }

    results.push({
      id: account.id,
      platform: account.platform,
      account: account.account_name || "",
      valid,
      error: errorMsg,
    });
  }

  const healthy = results.filter((r) => r.valid).length;
  const invalid = results.filter((r) => !r.valid).length;
  console.log(`[cron/token-health] Healthy: ${healthy}, Invalid: ${invalid}`);

  return NextResponse.json({ checked: results.length, healthy, invalid, results });
}
