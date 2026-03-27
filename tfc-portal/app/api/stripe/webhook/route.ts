import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import { sendClientWelcome } from "@/lib/resend";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

function generateCode(len = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

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
    const tier = meta.tier || "growth";
    const address = [meta.address_line1, meta.address_city, meta.address_state, meta.address_zip].filter(Boolean).join(", ");

    if (!email) {
      console.error("No email in checkout session");
      return NextResponse.json({ received: true });
    }

    // Check if client already exists
    const { data: existing } = await admin
      .from("clients")
      .select("id")
      .eq("email", email)
      .single();

    if (!existing) {
      // Create the client
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
      });

      if (clientErr) {
        console.error("Failed to create client:", clientErr);
      }

      // Create auth account for the client (temporary password — they'll reset)
      const tempPassword = generateCode(12);
      const { error: authErr } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name, role: "client" },
      });

      if (authErr) {
        console.error("Failed to create auth user:", authErr);
      }

      // Generate invite code
      const code = generateCode();
      await admin.from("team_invites").insert({
        email,
        role: "client",
        code,
        accepted: false,
      });

      // Send welcome email with login details
      try {
        await sendClientWelcome({
          to: email,
          name: name || "there",
          email,
          password: tempPassword,
        });
      } catch (emailErr) {
        console.error("Failed to send welcome email:", emailErr);
      }
    } else {
      // Client exists — just update their Stripe info
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
    const customerId = invoice.customer as string;

    // Update payment status
    await admin
      .from("clients")
      .update({ subscription_status: "active" })
      .eq("stripe_customer_id", customerId);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    await admin
      .from("clients")
      .update({ subscription_status: "canceled" })
      .eq("stripe_customer_id", customerId);
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;

    await admin
      .from("clients")
      .update({ subscription_status: "past_due" })
      .eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}
