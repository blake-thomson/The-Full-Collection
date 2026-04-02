import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { logActivity, ACTIONS } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  // Only team members can link Stripe
  const { data: teamMember } = await admin
    .from("team_members")
    .select("id, role")
    .eq("email", user.email)
    .maybeSingle();
  if (!teamMember || !["owner", "admin"].includes(teamMember.role)) {
    return NextResponse.json({ error: "Forbidden — owner or admin only" }, { status: 403 });
  }

  const { stripeCustomerId } = await req.json();
  if (!stripeCustomerId || typeof stripeCustomerId !== "string") {
    return NextResponse.json({ error: "stripeCustomerId is required" }, { status: 400 });
  }

  const customerId = stripeCustomerId.trim();
  if (!customerId.startsWith("cus_")) {
    return NextResponse.json({ error: "Invalid Stripe customer ID (must start with cus_)" }, { status: 400 });
  }

  // Verify the customer exists in Stripe
  let customer;
  try {
    customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return NextResponse.json({ error: "Stripe customer has been deleted" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Stripe customer not found" }, { status: 404 });
  }

  // Find the client
  const { data: client } = await admin
    .from("clients")
    .select("id, name")
    .eq("id", params.clientId)
    .maybeSingle();
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Look for an active subscription on this customer
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });
  // Also check trialing/past_due if no active
  let sub = subscriptions.data[0] ?? null;
  if (!sub) {
    const otherSubs = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });
    sub = otherSubs.data[0] ?? null;
  }

  // Update the client with Stripe info
  const updatePayload: Record<string, string | null> = {
    stripe_customer_id: customerId,
  };
  if (sub) {
    updatePayload.stripe_subscription_id = sub.id;
    updatePayload.subscription_status = sub.status;
  }

  const { error: updateErr } = await admin
    .from("clients")
    .update(updatePayload)
    .eq("id", client.id);

  if (updateErr) {
    console.error("Failed to link Stripe:", updateErr);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }

  logActivity(admin, {
    client_id: client.id,
    actor_email: user.email,
    actor_type: "team",
    action: ACTIONS.SUBSCRIPTION_CREATED,
    metadata: {
      stripe_customer_id: customerId,
      stripe_subscription_id: sub?.id ?? null,
      manual_link: true,
    },
  });

  return NextResponse.json({
    success: true,
    customerName: customer.name,
    subscriptionId: sub?.id ?? null,
    subscriptionStatus: sub?.status ?? null,
  });
}
