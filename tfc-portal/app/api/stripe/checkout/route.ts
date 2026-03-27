import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { TIERS, TierKey } from "@/lib/tiers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tier, name, email, phone, address } = body;

  if (!tier || !name || !email || !phone || !address?.line1 || !address?.city || !address?.state || !address?.zip) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const tierData = TIERS[tier as TierKey];
  if (!tierData) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const origin = req.headers.get("origin") || "https://portal.thefullcollection.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `TFC ${tierData.name} Package`,
              description: tierData.description,
            },
            unit_amount: tierData.price * 100,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        tier,
        client_name: name,
        client_email: email,
        client_phone: phone,
        address_line1: address.line1,
        address_city: address.city,
        address_state: address.state,
        address_zip: address.zip,
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe checkout error:", message);
    return NextResponse.json({ error: `Checkout failed: ${message}` }, { status: 500 });
  }
}
