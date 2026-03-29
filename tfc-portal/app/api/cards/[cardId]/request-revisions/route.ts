import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { sendRevisionRequestEmail } from "@/lib/approval-emails";

export async function POST(
  req: NextRequest,
  { params }: { params: { cardId: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notes } = await req.json();
  if (!notes || typeof notes !== "string" || notes.trim().length < 10) {
    return NextResponse.json(
      { error: "Revision notes are required (minimum 10 characters)" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdmin();
  const { cardId } = params;

  // Fetch the card
  const { data: card, error: cardErr } = await admin
    .from("kanban_cards")
    .select("id, client_id, title, column_id")
    .eq("id", cardId)
    .maybeSingle();

  if (!card || cardErr) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Verify the authenticated user is the client who owns this card
  const { data: client } = await admin
    .from("clients")
    .select("id, email, name")
    .eq("email", user.email!)
    .eq("id", card.client_id)
    .maybeSingle();

  if (!client) {
    return NextResponse.json(
      { error: "Only the client who owns this content can request revisions" },
      { status: 403 }
    );
  }

  // Update the card: set approval_status, revision_notes, move to 'revise' column
  const { data: updated, error: updateErr } = await admin
    .from("kanban_cards")
    .update({
      approval_status: "revisions_requested",
      revision_notes: notes.trim(),
      column_id: "revise",
      updated_at: new Date().toISOString(),
    })
    .eq("id", cardId)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Get all team members assigned to this client for notifications
  const { data: assignments } = await admin
    .from("client_assignments")
    .select("team_member_email")
    .eq("client_id", card.client_id);

  if (assignments && assignments.length > 0) {
    const emails = assignments.map((a) => a.team_member_email);

    // In-app notifications
    const notifications = emails.map((email) => ({
      recipient_email: email,
      recipient_type: "team",
      title: `${client.name} requested revisions`,
      message: `"${card.title}" needs revisions: ${notes.trim().slice(0, 100)}${notes.trim().length > 100 ? "..." : ""}`,
      link: `/team/portal?card=${cardId}`,
      type: "content_update",
    }));

    admin.from("notifications").insert(notifications).then(() => {});

    // Email notifications (fire-and-forget)
    for (const email of emails) {
      sendRevisionRequestEmail({
        to: email,
        clientName: client.name,
        cardTitle: card.title,
        revisionNotes: notes.trim(),
      }).catch(() => {});
    }
  }

  return NextResponse.json(updated);
}
