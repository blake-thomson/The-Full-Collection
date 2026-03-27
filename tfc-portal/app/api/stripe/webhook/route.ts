import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import { sendClientWelcome } from "@/lib/resend";
import Stripe from "stripe";
import crypto from "crypto";

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
      // Create the client record
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
        // If the insert failed due to a unique constraint (race condition), just update instead
        if (clientErr.code === "23505") {
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
      }

      // Create auth account — no password set; user will receive a reset link
      const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name, role: "client" },
      });

      if (authErr && authErr.message !== "User already registered") {
        console.error("Failed to create auth user:", authErr);
      }

      // Generate a secure password reset link so the client sets their own password
      let resetLink: string | undefined;
      try {
        const { data: linkData } = await admin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
          },
        });
        resetLink = linkData?.properties?.action_link;
      } catch (linkErr) {
        console.error("Failed to generate reset link:", linkErr);
      }

      // Send welcome email with the secure set-password link (no plaintext password)
      try {
        await sendClientWelcome({
          to: email,
          name: name || "there",
          email,
          resetLink,
        });
      } catch (emailErr) {
        console.error("Failed to send welcome email:", emailErr);
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
    await admin
      .from("clients")
      .update({ subscription_status: "active" })
      .eq("stripe_customer_id", invoice.customer as string);
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
