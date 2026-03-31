import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess } from "@/lib/auth-helpers";
import { logActivity, ACTIONS } from "@/lib/activity-logger";

// GET /api/resources?client_id=xxx
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, clientId, supabase);
  if (!access.ok) return access.response;

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("client_id", clientId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/resources — create a resource
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { client_id, name, type, url, file_path, uploaded_by, description } = await req.json();

  if (!client_id || !name) {
    return NextResponse.json({ error: "client_id and name are required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, client_id, supabase);
  if (!access.ok) return access.response;

  const { data, error } = await supabase
    .from("resources")
    .insert({
      client_id,
      name,
      type: type || null,
      url: url || null,
      file_path: file_path || null,
      uploaded_by: uploaded_by || null,
      description: description || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logActivity(supabase, {
    client_id,
    actor_email: user.email!,
    actor_type: "team",
    action: ACTIONS.RESOURCE_ADDED,
    metadata: { resource_id: data.id, name },
  });

  return NextResponse.json(data);
}

// DELETE /api/resources?id=...
export async function DELETE(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Resource id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  const { data: resource } = await supabase
    .from("resources")
    .select("client_id")
    .eq("id", id)
    .single();
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const access = await requireClientAccess(user.email!, resource.client_id, supabase);
  if (!access.ok) return access.response;

  const { error } = await supabase
    .from("resources")
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.email })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH /api/resources — update a resource
export async function PATCH(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, type, url, description, category } = await req.json();

  if (!id) return NextResponse.json({ error: "Resource id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  const { data: resource } = await supabase
    .from("resources")
    .select("client_id")
    .eq("id", id)
    .single();
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const access = await requireClientAccess(user.email!, resource.client_id, supabase);
  if (!access.ok) return access.response;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (type !== undefined) updates.type = type;
  if (url !== undefined) updates.url = url;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;

  const { data, error } = await supabase
    .from("resources")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
