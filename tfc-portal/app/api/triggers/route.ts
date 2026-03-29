import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

async function getTeamMember(email: string, supabase: ReturnType<typeof createSupabaseAdmin>) {
  const { data } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();
  return data;
}

// GET — list all triggers
export async function GET() {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const member = await getTeamMember(user.email!, supabase);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("workflow_triggers")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create a trigger
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const member = await getTeamMember(user.email!, supabase);
  if (!member || !["owner", "admin"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden — owner or admin only" }, { status: 403 });
  }

  const body = await req.json();
  const { name, triggerColumn, conditions, actions } = body;
  if (!name || !triggerColumn || !actions) {
    return NextResponse.json({ error: "name, triggerColumn, and actions are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("workflow_triggers")
    .insert({
      name,
      trigger_column: triggerColumn,
      conditions: conditions || null,
      actions,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — update a trigger
export async function PATCH(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const member = await getTeamMember(user.email!, supabase);
  if (!member || !["owner", "admin"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden — owner or admin only" }, { status: 403 });
  }

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.isActive !== undefined) updates.is_active = body.isActive;
  if (body.name !== undefined) updates.name = body.name;
  if (body.actions !== undefined) updates.actions = body.actions;
  if (body.triggerColumn !== undefined) updates.trigger_column = body.triggerColumn;
  if (body.conditions !== undefined) updates.conditions = body.conditions;

  const { data, error } = await supabase
    .from("workflow_triggers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — delete a trigger
export async function DELETE(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const member = await getTeamMember(user.email!, supabase);
  if (!member || !["owner", "admin"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden — owner or admin only" }, { status: 403 });
  }

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase
    .from("workflow_triggers")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
