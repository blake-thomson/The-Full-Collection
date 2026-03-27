import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess } from "@/lib/auth-helpers";

const MAX_LIMIT = 100;

// GET /api/activity?client_id=xxx&page=1&limit=20
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, clientId, supabase);
  if (!access.ok) return access.response;

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const { count } = await supabase
    .from("activity_log")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId);

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
    },
  });
}

// POST /api/activity — log an activity
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { client_id, actor_email, actor_name, actor_type, action, metadata } = await req.json();

  if (!client_id || !action) {
    return NextResponse.json({ error: "client_id and action are required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, client_id, supabase);
  if (!access.ok) return access.response;

  const { data, error } = await supabase
    .from("activity_log")
    .insert({
      client_id,
      actor_email: actor_email || null,
      actor_name: actor_name || null,
      actor_type: actor_type || "system",
      action,
      metadata: metadata || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
