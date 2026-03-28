import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess } from "@/lib/auth-helpers";

// GET /api/messages?client_id=xxx&thread_parent_id=yyy
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, clientId, supabase);
  if (!access.ok) return access.response;

  // Get IDs of messages hidden by this user
  const { data: hiddenRows } = await supabase
    .from("message_hides")
    .select("message_id")
    .eq("user_email", user.email!);
  const hiddenIds = hiddenRows?.map((r) => r.message_id as string) ?? [];

  const threadParentId = req.nextUrl.searchParams.get("thread_parent_id");

  if (threadParentId) {
    let q = supabase
      .from("messages")
      .select("*")
      .eq("client_id", clientId)
      .eq("thread_parent_id", threadParentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });
    if (hiddenIds.length > 0) q = q.not("id", "in", `(${hiddenIds.join(",")})`);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  let q = supabase
    .from("messages")
    .select("*")
    .eq("client_id", clientId)
    .is("thread_parent_id", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (hiddenIds.length > 0) q = q.not("id", "in", `(${hiddenIds.join(",")})`);
  const { data, error } = await q;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get reply counts for all top-level messages
  if (data && data.length > 0) {
    const messageIds = data.map((m) => m.id as string);
    const { data: replies } = await supabase
      .from("messages")
      .select("thread_parent_id")
      .in("thread_parent_id", messageIds)
      .is("deleted_at", null);

    if (replies) {
      const countMap: Record<string, number> = {};
      for (const r of replies) {
        const pid = r.thread_parent_id as string;
        countMap[pid] = (countMap[pid] || 0) + 1;
      }
      for (const msg of data) {
        (msg as Record<string, unknown>).reply_count = countMap[msg.id as string] || 0;
      }
    }
  }

  return NextResponse.json(data);
}

// POST /api/messages — send a message
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    client_id,
    sender_email,
    sender_name,
    sender_type,
    content,
    thread_parent_id,
    message_type,
    mentions,
    voice_url,
    voice_duration,
  } = await req.json();

  if (!client_id || !sender_email || !content) {
    return NextResponse.json(
      { error: "client_id, sender_email, and content are required" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, client_id, supabase);
  if (!access.ok) return access.response;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      client_id,
      sender_email,
      sender_name: sender_name || null,
      sender_type: sender_type || "team",
      content,
      thread_parent_id: thread_parent_id || null,
      message_type: message_type || "text",
      mentions: mentions || [],
      voice_url: voice_url || null,
      voice_duration: voice_duration || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/messages — edit a message
export async function PATCH(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, content, action } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  const { data: msg } = await supabase
    .from("messages")
    .select("client_id")
    .eq("id", id)
    .single();
  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const access = await requireClientAccess(user.email!, msg.client_id, supabase);
  if (!access.ok) return access.response;

  // Hide action — per-user only
  if (action === "hide") {
    await supabase.from("message_hides").upsert({ user_email: user.email!, message_id: id }, { onConflict: "user_email,message_id" });
    return NextResponse.json({ ok: true });
  }

  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("messages")
    .update({ content })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/messages?id=...
export async function DELETE(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Message id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  const { data: msg } = await supabase
    .from("messages")
    .select("client_id, sender_email")
    .eq("id", id)
    .single();
  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const access = await requireClientAccess(user.email!, msg.client_id, supabase);
  if (!access.ok) return access.response;

  // Only the sender or owner/admin team members may delete
  if (msg.sender_email !== user.email) {
    const { data: actor } = await supabase.from("team_members").select("role").eq("email", user.email!).single();
    if (!actor || !["owner", "admin"].includes(actor.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
