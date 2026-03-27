import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "./supabase";

type AdminClient = ReturnType<typeof createSupabaseAdmin>;

/**
 * Verifies the requesting user (by email) can access the given clientId.
 * - Team members can access any client.
 * - Clients can only access their own record (email must match AND id must match).
 *
 * Returns { ok: true, isTeam } on success, or a ready-to-return 403 NextResponse.
 */
export async function requireClientAccess(
  email: string,
  clientId: string,
  admin: AdminClient
): Promise<{ ok: true; isTeam: boolean } | { ok: false; response: NextResponse }> {
  const [teamRes, clientRes] = await Promise.all([
    admin.from("team_members").select("id").eq("email", email).maybeSingle(),
    admin.from("clients").select("id").eq("email", email).eq("id", clientId).maybeSingle(),
  ]);

  if (teamRes.data) return { ok: true, isTeam: true };
  if (clientRes.data) return { ok: true, isTeam: false };

  return {
    ok: false,
    response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}
