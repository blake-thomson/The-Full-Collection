import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

// GET /api/research — Return research items with optional filters
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) return teamCheck.response;

  const clientId = req.nextUrl.searchParams.get("client_id");
  const type = req.nextUrl.searchParams.get("type");
  const format = req.nextUrl.searchParams.get("format");

  let query = admin
    .from("research_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (clientId) query = query.eq("client_id", clientId);
  if (type) query = query.eq("type", type);
  if (format) query = query.eq("platform", format);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST /api/research — Create a research item
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) return teamCheck.response;

  const body = await req.json();
  const { url, title, notes, type, format, tags, contentPillars, clientId } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // If URL provided, try to fetch OG metadata
  let ogImage: string | null = null;
  let ogTitle: string | null = null;

  if (url) {
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

      ogImage = imageMatch?.[1] || imageMatch2?.[1] || null;
      ogTitle = titleMatch?.[1] || titleMatch2?.[1] || null;
    } catch {
      // OG fetch failed silently — that's fine
    }
  }

  const { data, error } = await admin
    .from("research_items")
    .insert({
      saved_by: user.email!,
      client_id: clientId || null,
      url: url || null,
      title,
      notes: notes || null,
      type: type || null,
      platform: format || null,
      tags: tags || null,
      content_pillars: contentPillars || null,
      og_image: ogImage,
      og_title: ogTitle,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/research — Delete a research item
export async function DELETE(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) return teamCheck.response;

  const body = await req.json();
  const { id } = body;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await admin
    .from("research_items")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
