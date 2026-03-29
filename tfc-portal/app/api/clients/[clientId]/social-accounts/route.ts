import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess } from "@/lib/auth-helpers";

// GET /api/clients/[clientId]/social-accounts
export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, params.clientId, admin);
  if (!access.ok) return access.response;

  const { data, error } = await admin
    .from("client_social_accounts")
    .select("id, client_id, platform, account_name, platform_user_id, connected, connected_at")
    .eq("client_id", params.clientId)
    .eq("connected", true)
    .order("connected_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/clients/[clientId]/social-accounts?id=<accountId>
export async function DELETE(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, params.clientId, admin);
  if (!access.ok) return access.response;

  const accountId = req.nextUrl.searchParams.get("id");
  if (!accountId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await admin
    .from("client_social_accounts")
    .delete()
    .eq("id", accountId)
    .eq("client_id", params.clientId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
