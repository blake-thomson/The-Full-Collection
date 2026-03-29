import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, admin);
  if (!access.ok) return access.response;

  const { clientId } = params;

  // Parse month param (defaults to current month)
  const monthParam = req.nextUrl.searchParams.get("month");
  let year: number, month: number;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m;
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000Z`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01T00:00:00.000Z`;

  // Get all cards for this client
  const { data: cards } = await admin
    .from("kanban_cards")
    .select("id, title")
    .eq("client_id", clientId);

  if (!cards || cards.length === 0) {
    return NextResponse.json({ totalSeconds: 0, byCard: [], byMember: [] });
  }

  const cardIds = cards.map((c: any) => c.id);
  const cardMap = new Map(cards.map((c: any) => [c.id, c.title]));

  // Fetch time entries for those cards in the given month
  const { data: entries, error } = await admin
    .from("time_entries")
    .select("*")
    .in("card_id", cardIds)
    .gte("started_at", startDate)
    .lt("started_at", endDate)
    .not("duration_seconds", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const safeEntries = entries || [];

  const totalSeconds = safeEntries.reduce((sum: number, e: any) => sum + (e.duration_seconds || 0), 0);

  // Group by card
  const byCardMap = new Map<string, number>();
  for (const e of safeEntries) {
    byCardMap.set(e.card_id, (byCardMap.get(e.card_id) || 0) + (e.duration_seconds || 0));
  }
  const byCard = Array.from(byCardMap.entries()).map(([cardId, secs]) => ({
    cardId,
    title: cardMap.get(cardId) || "Unknown",
    totalSeconds: secs,
  }));

  // Group by member
  const byMemberMap = new Map<string, { email: string; name: string; totalSeconds: number }>();
  for (const e of safeEntries) {
    const existing = byMemberMap.get(e.team_member_email);
    if (existing) {
      existing.totalSeconds += e.duration_seconds || 0;
    } else {
      byMemberMap.set(e.team_member_email, {
        email: e.team_member_email,
        name: e.team_member_name,
        totalSeconds: e.duration_seconds || 0,
      });
    }
  }
  const byMember = Array.from(byMemberMap.values());

  return NextResponse.json({ totalSeconds, byCard, byMember });
}
