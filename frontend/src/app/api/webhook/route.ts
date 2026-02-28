import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// POST /api/webhook — Stripe webhook for completed payments
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  // If we have a webhook secret, verify the signature
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    // No webhook secret configured — parse the event directly (dev mode)
    event = JSON.parse(body) as Stripe.Event;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { capability_id, capability_slug, price_per_call } = session.metadata || {};

    if (capability_id) {
      const supabase = getSupabase();

      // Record the payment
      await supabase.from("payments").insert({
        capability_id,
        payer_address: session.customer_email || "stripe-customer",
        receiver_address: "stripe",
        tx_hash: `stripe_${session.id}`,
        network: "stripe",
        token: "USD",
        amount_usd: parseFloat(price_per_call || "0"),
        verified: true,
        verified_at: new Date().toISOString(),
      });

      // Log usage
      await supabase.from("usage_logs").insert({
        capability_id,
        payer_address: session.customer_email || "stripe-customer",
        payment_tx: `stripe_${session.id}`,
        amount_usd: parseFloat(price_per_call || "0"),
        latency_ms: 0,
        success: true,
      });

      console.log(`Stripe payment recorded for ${capability_slug}: $${price_per_call}`);
    }
  }

  return NextResponse.json({ received: true });
}
