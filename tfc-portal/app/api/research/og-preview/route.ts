import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

// GET /api/research/og-preview?url=... — Fetch OG metadata from a URL
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) return teamCheck.response;

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ title: null, image: null });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "TFC-Portal/1.0" },
    });
    clearTimeout(timeout);
    const html = await res.text();

    const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/);
    const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/);
    // Also try reverse attribute order
    const imageMatch2 = html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"/);
    const titleMatch2 = html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/);

    return NextResponse.json({
      title: titleMatch?.[1] || titleMatch2?.[1] || null,
      image: imageMatch?.[1] || imageMatch2?.[1] || null,
    });
  } catch {
    return NextResponse.json({ title: null, image: null });
  }
}
