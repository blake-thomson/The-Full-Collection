import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  const userEmail = user.email;
  if (!userEmail) {
    return NextResponse.json({ error: "No email on session" }, { status: 401 });
  }

  // Team members can pass a client_id to view any client's subscription
  const clientId = req.nextUrl.searchParams.get("client_id");

  let clientQuery = admin
    .from("clients")
    .select(
      "stripe_subscription_id, stripe_customer_id, subscription_status, subscription_tier"
    );

  if (clientId) {
    // Verify the requester is a team member
    const { data: teamMember, error: tmError } = await admin
      .from("team_members")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();
    if (tmError) {
      console.error("Team member lookup error:", tmError);
      return NextResponse.json({ error: "Authorization check failed" }, { status: 500 });
    }
    if (!teamMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    clientQuery = clientQuery.eq("id", clientId);
  } else {
    clientQuery = clientQuery.eq("email", userEmail);
  }

  const { data: client, error } = await clientQuery.maybeSingle();

  if (error) {
    console.error("Client query error:", error);
    return NextResponse.json({ error: "Failed to load client" }, { status: 500 });
  }
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (!client.stripe_subscription_id) {
    // No recurring subscription — still pull invoice history if they have a Stripe customer
    let totalPaid = 0;
    let totalPaymentCount = 0;
    if (client.stripe_customer_id) {
      try {
        const invoices = await stripe.invoices.list({
          customer: client.stripe_customer_id,
          status: "paid",
          limit: 100,
        });
        totalPaid = invoices.data.reduce(
          (sum, inv) => sum + (inv.amount_paid ?? 0),
          0
        );
        totalPaymentCount = invoices.data.length;
      } catch (err) {
        console.error("Failed to fetch invoices for non-subscription client:", err);
      }
    }
    return NextResponse.json({
      subscription: null,
      tier: client.subscription_tier,
      planName: client.subscription_tier
        ? (client.subscription_tier.charAt(0).toUpperCase() + client.subscription_tier.slice(1))
        : "Custom",
      status: client.subscription_status || "active",
      totalPaid,
      totalPaymentCount,
    });
  }

  try {
    // Fetch live subscription from Stripe (expand product so we get the name)
    const subscription = await stripe.subscriptions.retrieve(
      client.stripe_subscription_id,
      { expand: ["items.data.price.product"] }
    );
    // In Stripe SDK v17+, period dates live on the first subscription item
    const item = subscription.items?.data?.[0] as any;

    // Pull actual plan name and price from Stripe (works for standard tiers AND custom packages)
    const stripePrice = item?.price;
    const stripeProduct = stripePrice?.product as any;
    const planName: string | null = stripeProduct?.name ?? null;
    const priceAmount: number | null = stripePrice?.unit_amount ?? null;
    const priceInterval: string | null = stripePrice?.recurring?.interval ?? null;

    // Fetch all paid invoices to compute total paid + payment count
    let totalPaid = 0;
    let totalPaymentCount = 0;
    if (client.stripe_customer_id) {
      const invoices = await stripe.invoices.list({
        customer: client.stripe_customer_id,
        status: "paid",
        limit: 100,
      });
      totalPaid = invoices.data.reduce(
        (sum, inv) => sum + (inv.amount_paid ?? 0),
        0
      );
      totalPaymentCount = invoices.data.length;
    }

    // If past_due, find how many days since the most recent failed invoice due date
    let daysOverdue: number | null = null;
    if (subscription.status === "past_due" && client.stripe_customer_id) {
      const failedInvoices = await stripe.invoices.list({
        customer: client.stripe_customer_id,
        status: "open",
        limit: 1,
      });
      if (failedInvoices.data.length > 0) {
        const failedInv = failedInvoices.data[0];
        const dueTs = failedInv.due_date
          ? failedInv.due_date * 1000
          : failedInv.created * 1000;
        daysOverdue = Math.max(
          0,
          Math.floor((Date.now() - dueTs) / (1000 * 60 * 60 * 24))
        );
      }
    }

    // Period dates: try subscription level first, fall back to item level (SDK v17+)
    const subAny = subscription as any;
    const currentPeriodEnd =
      subAny.current_period_end ?? item?.current_period_end ?? null;
    const currentPeriodStart =
      subAny.current_period_start ?? item?.current_period_start ?? null;

    // Subscription start date (when they first subscribed)
    const subAny2 = subscription as any;
    const startDate = subAny2.start_date ?? subAny2.created ?? null;

    return NextResponse.json({
      tier: client.subscription_tier,
      status: subscription.status,
      planName,
      priceAmount,
      priceInterval,
      currentPeriodEnd,
      currentPeriodStart,
      startDate,
      totalPaid,
      totalPaymentCount,
      daysOverdue,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (err) {
    console.error("Stripe subscription fetch error:", err);
    // Fall back to DB data if Stripe call fails
    return NextResponse.json({
      subscription: null,
      tier: client.subscription_tier,
      status: client.subscription_status,
    });
  }
}
