/**
 * AaaS Stripe Subscription Checkout
 * POST /api/aaas/checkout
 *
 * Creates a Stripe Checkout session in `subscription` mode.
 * Scoping data is stored in session metadata so the webhook
 * can trigger notifications after payment completes.
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY            — Stripe secret
 *   STRIPE_AAAS_BASIC_PRICE_ID   — optional pre-created monthly price ($200/mo)
 *   STRIPE_AAAS_STANDARD_PRICE_ID— optional pre-created monthly price ($400/mo)
 *   STRIPE_AAAS_PREMIUM_PRICE_ID — optional pre-created monthly price ($800/mo)
 *   (if price IDs are absent, checkout creates a one-time payment instead)
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { AAAS_TIERS, type AaaStier } from "@/app/api/x402/automation-as-a-service/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// Optional pre-created Stripe recurring price IDs
const PRICE_ID_MAP: Record<AaaStier, string | undefined> = {
  basic: process.env.STRIPE_AAAS_BASIC_PRICE_ID,
  standard: process.env.STRIPE_AAAS_STANDARD_PRICE_ID,
  premium: process.env.STRIPE_AAAS_PREMIUM_PRICE_ID,
};

export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { tier, fullName, email, automationDescription, xHandle, phone, scopeId } = body;

  if (!tier || !fullName || !email || !automationDescription) {
    return NextResponse.json(
      { error: "tier, fullName, email, and automationDescription are required" },
      { status: 400 }
    );
  }

  const tierConfig = AAAS_TIERS[tier as AaaStier];
  if (!tierConfig) {
    return NextResponse.json(
      { error: "tier must be: basic | standard | premium" },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;
  const priceId = PRICE_ID_MAP[tier as AaaStier];

  // Build metadata stored on the session (retrieved by webhook)
  const metadata: Record<string, string> = {
    capability_slug: "automation-as-a-service",
    tier,
    tier_label: tierConfig.label,
    amount_usd: String(tierConfig.priceUsd),
    full_name: fullName,
    email,
    x_handle: xHandle || "",
    phone: phone || "",
    automation_description: automationDescription.slice(0, 500),
    scope_id: scopeId || "",
  };

  try {
    let session: Stripe.Checkout.Session;

    if (priceId) {
      // ── Use pre-created recurring price ──────────────────────────────────
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer_email: email,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: { metadata },
        metadata,
        success_url: `${origin}/agents/automation-as-a-service?payment=success&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
        cancel_url: `${origin}/agents/automation-as-a-service?payment=cancelled`,
      });
    } else {
      // ── Dynamic one-time payment (no pre-created price) ───────────────────
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `AaaS ${tierConfig.label} — Month 1`,
                description: tierConfig.description,
                metadata: { tier, capability: "automation-as-a-service" },
              },
              unit_amount: tierConfig.priceUsd * 100,
            },
            quantity: 1,
          },
        ],
        metadata,
        success_url: `${origin}/agents/automation-as-a-service?payment=success&session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
        cancel_url: `${origin}/agents/automation-as-a-service?payment=cancelled`,
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      tier: tierConfig,
      mode: priceId ? "subscription" : "one-time-first-month",
    });
  } catch (err: any) {
    console.error("AaaS Stripe checkout error:", err);
    return NextResponse.json({ error: err.message || "Checkout failed" }, { status: 500 });
  }
}

// GET — test endpoint
export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/aaas/checkout",
    description: "Create a Stripe Checkout session for AaaS subscription",
    tiers: AAAS_TIERS,
  });
}
