import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

// GET — list all requests (owner/admin only)
export async function GET() {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const { data: actor } = await supabase
    .from("team_members").select("role").eq("email", user.email!).single();
  if (!actor || !["owner", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("feature_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — submit a feature request (any team member)
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const { data: member } = await supabase
    .from("team_members").select("name").eq("email", user.email!).single();

  const { title, description, type } = await req.json();
  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
  }
  if (!["feature", "bug", "improvement"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feature_requests")
    .insert({
      title: title.trim(),
      description: description.trim(),
      type,
      submitted_by: user.email!,
      submitted_by_name: member?.name || user.email!,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — update status (owner/admin only)
export async function PATCH(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const { data: actor } = await supabase
    .from("team_members").select("role").eq("email", user.email!).single();
  if (!actor || !["owner", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status } = await req.json();
  if (!id || !["pending", "reviewing", "planned", "done", "declined"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feature_requests")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
