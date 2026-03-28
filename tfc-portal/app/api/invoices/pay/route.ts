import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * POST /api/invoices/pay — Create a Stripe Checkout session for a specific invoice.
 * Client-facing: requires authentication and invoice ownership.
 */
export async function POST(req: NextRequest) {
  const supabaseServer = createServerSupabase();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoice_id } = await req.json();
  if (!invoice_id) {
    return NextResponse.json({ error: "invoice_id is required" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Fetch the invoice
  const { data: invoice, error: invErr } = await admin
    .from("invoices")
    .select("*, clients(email, name)")
    .eq("id", invoice_id)
    .single();

  if (invErr || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Verify the requesting user owns this invoice's client
  const { data: client } = await admin
    .from("clients")
    .select("id, email")
    .eq("id", invoice.client_id)
    .eq("email", user.email)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Don't allow payment on already-paid invoices
  if (invoice.status === "paid") {
    return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
  }

  // If invoice already has a Stripe payment URL, return it
  if (invoice.stripe_payment_url) {
    return NextResponse.json({ url: invoice.stripe_payment_url });
  }

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://portal.thefullcollection.com";

  try {
    // Create a one-time Stripe Checkout session for this invoice
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: invoice.currency || "usd",
            product_data: {
              name: invoice.title,
              description: invoice.description || `Invoice payment`,
            },
            unit_amount: Math.round(invoice.amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoice_id: invoice.id,
        client_id: invoice.client_id,
      },
      success_url: `${origin}/dashboard?invoice_paid=${invoice.id}`,
      cancel_url: `${origin}/dashboard`,
    });

    // Save the Stripe session URL to the invoice for reuse
    await admin
      .from("invoices")
      .update({
        stripe_payment_url: session.url,
        stripe_invoice_id: session.id,
      })
      .eq("id", invoice.id);

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Invoice payment error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
  }
}
