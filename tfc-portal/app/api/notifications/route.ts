import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

// GET /api/notifications?email=xxx&type=client
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email");
  const type = req.nextUrl.searchParams.get("type");

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("recipient_email", email)
    .eq("read", false)
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("recipient_type", type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST /api/notifications — create a notification
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipient_email, recipient_type, title, message, link, type } =
    await req.json();

  if (!recipient_email || !title) {
    return NextResponse.json(
      { error: "recipient_email and title are required" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      recipient_email,
      recipient_type: recipient_type || "client",
      title,
      message: message || null,
      link: link || null,
      type: type || "general",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// PATCH /api/notifications — mark as read (by id, or all for a user)
export async function PATCH(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, email } = await req.json();

  if (!id && !email) {
    return NextResponse.json(
      { error: "id or email required" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  if (id) {
    // Mark a single notification as read
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Mark all notifications as read for a user
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("recipient_email", email)
      .eq("read", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
