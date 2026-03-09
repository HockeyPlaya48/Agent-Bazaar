import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function handleAaaSPurchase(session: Stripe.Checkout.Session, origin: string) {
  const meta = session.metadata || {};
  const supabase = getSupabase();

  // Store AaaS client record
  try {
    await supabase.from("aaas_clients").insert({
      capability_id: "automation-as-a-service",
      tier: meta.tier,
      full_name: meta.full_name,
      email: meta.email || session.customer_details?.email,
      x_handle: meta.x_handle || null,
      phone: meta.phone || null,
      automation_description: meta.automation_description,
      scope_id: meta.scope_id || null,
      payment_tx: session.id,
      payment_method: "stripe",
      amount_usd: parseInt(meta.amount_usd || "0"),
      status: "active",
      stripe_session_id: session.id,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("aaas_clients insert failed:", e);
  }

  // Fire notifications (email + tweet queue)
  try {
    await fetch(`${origin}/api/aaas/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": process.env.INTERNAL_NOTIFY_KEY || "aaas-internal",
      },
      body: JSON.stringify({
        event: "new_purchase",
        paymentMethod: "stripe",
        tier: meta.tier,
        tierConfig: null, // notify handler has AAAS_TIERS
        fullName: meta.full_name,
        email: meta.email || session.customer_details?.email,
        xHandle: meta.x_handle || "not provided",
        phone: meta.phone || "not provided",
        automationDescription: meta.automation_description,
        txHash: session.id,
        amountUsd: meta.amount_usd,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.error("AaaS notify call failed:", e);
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const origin = new URL(request.url).origin;

  let event: Stripe.Event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabase();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Record payment in payments table (all skills)
    try {
      await supabase.from("payments").insert({
        stripe_session_id: session.id,
        capability_slug: session.metadata?.capability_slug,
        capability_id: session.metadata?.capability_id,
        amount_cents: session.amount_total,
        currency: session.currency,
        status: "completed",
        customer_email: session.customer_details?.email,
        metadata: session.metadata,
      });
    } catch {}

    // AaaS-specific post-purchase flow
    if (session.metadata?.capability_slug === "automation-as-a-service") {
      await handleAaaSPurchase(session, origin);
    }
  }

  // Handle AaaS subscription renewal
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = (invoice as any).subscription as string | undefined;
    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        if (sub.metadata?.capability_slug === "automation-as-a-service") {
          await supabase.from("aaas_renewals").insert({
            subscription_id: subscriptionId,
            tier: sub.metadata.tier,
            email: sub.metadata.email,
            amount_cents: invoice.amount_paid,
            period_start: new Date((invoice.period_start ?? 0) * 1000).toISOString(),
            period_end: new Date((invoice.period_end ?? 0) * 1000).toISOString(),
            created_at: new Date().toISOString(),
          });
        }
      } catch {}
    }
  }

  return NextResponse.json({ received: true });
}
