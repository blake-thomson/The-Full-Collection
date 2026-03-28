import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess, requireTeamMember } from "@/lib/auth-helpers";

// GET /api/invoices?client_id=xxx
export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) {
    return NextResponse.json({ error: "client_id required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Verify the requesting user can access this client's invoices
  const access = await requireClientAccess(user.email!, clientId, supabase);
  if (!access.ok) return access.response;

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST /api/invoices — create an invoice (team members only)
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Only team members can create invoices
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const {
    client_id,
    title,
    amount,
    currency,
    due_date,
    description,
    stripe_invoice_id,
    stripe_payment_url,
  } = await req.json();

  if (!client_id || !title || amount === undefined) {
    return NextResponse.json(
      { error: "client_id, title, and amount are required" },
      { status: 400 }
    );
  }

  if (typeof amount !== "number" || amount < 0) {
    return NextResponse.json({ error: "amount must be a non-negative number" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      client_id,
      title,
      amount,
      currency: currency || "usd",
      due_date: due_date || null,
      description: description || null,
      status: "pending",
      stripe_invoice_id: stripe_invoice_id || null,
      stripe_payment_url: stripe_payment_url || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// PATCH /api/invoices — update invoice status (team members only)
export async function PATCH(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Only team members can modify invoices
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const { id, status, stripe_invoice_id, stripe_payment_url } =
    await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "Invoice id required" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (stripe_invoice_id !== undefined) updates.stripe_invoice_id = stripe_invoice_id;
  if (stripe_payment_url !== undefined) updates.stripe_payment_url = stripe_payment_url;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// DELETE /api/invoices?id=...
export async function DELETE(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Only team members can delete invoices
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Invoice id required" },
      { status: 400 }
    );
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("id", id)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
