import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

// GET /api/invoices?client_id=xxx
export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("client_id");
  if (!clientId) {
    return NextResponse.json({ error: "client_id required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
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

// POST /api/invoices — create an invoice
export async function POST(req: NextRequest) {
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

  const supabase = createSupabaseAdmin();
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

// PATCH /api/invoices — update invoice status
export async function PATCH(req: NextRequest) {
  const { id, status, stripe_invoice_id, stripe_payment_url } =
    await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "Invoice id required" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const updates: Record<string, any> = {};
  if (status !== undefined) updates.status = status;
  if (stripe_invoice_id !== undefined)
    updates.stripe_invoice_id = stripe_invoice_id;
  if (stripe_payment_url !== undefined)
    updates.stripe_payment_url = stripe_payment_url;
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
