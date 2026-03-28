import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import { sendClientWelcome } from "@/lib/resend";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};
    const email = meta.client_email || session.customer_email || "";
    const name = meta.client_name || "";
    const phone = meta.client_phone || "";
    const tier = meta.tier || "starter";
    const address = [meta.address_line1, meta.address_city, meta.address_state, meta.address_zip]
      .filter(Boolean)
      .join(", ");

    if (!email) {
      console.error("No email in checkout session", { sessionId: session.id });
      return NextResponse.json({ received: true });
    }

    // Check if client already exists
    const { data: existing } = await admin
      .from("clients")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!existing) {
      // Generate a one-time setup code (no auth user yet — created when they activate)
      const setupCode = generateSetupCode();

      const { error: clientErr } = await admin.from("clients").insert({
        name,
        email,
        phone,
        address,
        onboarding_complete: false,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        subscription_status: "active",
        subscription_tier: tier,
        setup_code: setupCode,
      });

      if (clientErr) {
        if (clientErr.code === "23505") {
          // Race condition — client already exists, just update Stripe info
          await admin
            .from("clients")
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: "active",
              subscription_tier: tier,
            })
            .eq("email", email);
        } else {
          console.error("Failed to create client:", clientErr);
          return NextResponse.json({ received: true });
        }
      } else {
        // Send welcome email with setup code
        try {
          await sendClientWelcome({
            to: email,
            name: name || "there",
            email,
            code: setupCode,
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          });
        } catch (emailErr) {
          console.error("Failed to send welcome email:", emailErr);
        }
      }
    } else {
      // Client exists — update Stripe info
      await admin
        .from("clients")
        .update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          subscription_status: "active",
          subscription_tier: tier,
        })
        .eq("email", email);
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const updateResult = await admin
      .from("clients")
      .update({ subscription_status: "active" })
      .eq("stripe_customer_id", invoice.customer as string);
    if (updateResult.error) {
      console.error("Failed to update subscription status on invoice.paid:", updateResult.error);
    }
  }

  // Handle one-time checkout completions (invoice Pay Now flow)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "payment" && session.metadata?.invoice_id) {
      const { error: invErr } = await admin
        .from("invoices")
        .update({ status: "paid" })
        .eq("id", session.metadata.invoice_id);
      if (invErr) {
        console.error("Failed to mark invoice as paid:", invErr);
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await admin
      .from("clients")
      .update({ subscription_status: "canceled" })
      .eq("stripe_customer_id", subscription.customer as string);
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    await admin
      .from("clients")
      .update({ subscription_status: "past_due" })
      .eq("stripe_customer_id", invoice.customer as string);
  }

  return NextResponse.json({ received: true });
}

function generateSetupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
