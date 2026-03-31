import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";
import { logActivity, ACTIONS } from "@/lib/activity-logger";

// POST /api/posts/schedule
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) return teamCheck.response;

  const body = await req.json();
  const { cardId, clientId, platforms, scheduledFor, caption, hashtags, attachmentId } = body;

  if (!cardId || !clientId || !platforms?.length || !scheduledFor) {
    return NextResponse.json(
      { error: "cardId, clientId, platforms (array), and scheduledFor are required" },
      { status: 400 }
    );
  }

  // Create one scheduled_posts record per platform
  const records = (platforms as string[]).map((platform: string) => ({
    card_id: cardId,
    client_id: clientId,
    platform,
    scheduled_for: scheduledFor,
    caption: caption || null,
    hashtags: hashtags?.length ? hashtags : null,
    attachment_id: attachmentId || null,
    status: "scheduled",
  }));

  const { data, error } = await admin
    .from("scheduled_posts")
    .insert(records)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Move the kanban card to "scheduled" column and set publish_date
  await admin
    .from("kanban_cards")
    .update({
      column_id: "scheduled",
      publish_date: scheduledFor,
    })
    .eq("id", cardId);

  logActivity(admin, {
    client_id: clientId,
    actor_email: user.email!,
    actor_type: "team",
    action: ACTIONS.POST_SCHEDULED,
    metadata: { card_id: cardId, platforms, scheduled_for: scheduledFor },
  });

  return NextResponse.json(data, { status: 201 });
}
