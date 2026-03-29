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

// GET — return permissions, optionally filtered by role
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const member = await getTeamMember(user.email!, supabase);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const role = req.nextUrl.searchParams.get("role");
  const permission = req.nextUrl.searchParams.get("permission");

  let query = supabase.from("role_permissions").select("*");
  if (role) query = query.eq("role", role);
  if (permission) query = query.eq("permission", permission);

  const { data, error } = await query.order("role").order("permission");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If both role and permission are specified, return a single granted boolean
  if (role && permission) {
    const row = data?.[0];
    return NextResponse.json({ granted: row?.granted ?? false });
  }

  return NextResponse.json(data);
}

// PATCH — update a single permission
export async function PATCH(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const member = await getTeamMember(user.email!, supabase);
  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden — owner only" }, { status: 403 });
  }

  const body = await req.json();
  const { role, permission, granted } = body;
  if (!role || !permission || granted === undefined) {
    return NextResponse.json({ error: "role, permission, and granted are required" }, { status: 400 });
  }

  // Don't allow modifying owner permissions
  if (role === "owner") {
    return NextResponse.json({ error: "Cannot modify owner permissions" }, { status: 400 });
  }

  // Upsert the permission
  const { data, error } = await supabase
    .from("role_permissions")
    .upsert({ role, permission, granted }, { onConflict: "role,permission" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
