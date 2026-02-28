import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// POST /api/checkout — Create a Stripe Checkout session for a skill call
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { capabilitySlug, capabilityId, returnUrl } = body;

    if (!capabilitySlug && !capabilityId) {
      return NextResponse.json({ error: "capabilitySlug or capabilityId required" }, { status: 400 });
    }

    // Look up the capability
    const supabase = getSupabase();
    const query = capabilitySlug
      ? supabase.from("capabilities").select("*").eq("slug", capabilitySlug).single()
      : supabase.from("capabilities").select("*").eq("id", capabilityId).single();
    
    const { data: capability, error } = await query;
    if (error || !capability) {
      return NextResponse.json({ error: "Capability not found" }, { status: 404 });
    }

    const priceInCents = Math.round(capability.price_per_call * 100);
    const origin = new URL(request.url).origin;

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${capability.name} — 1 Call`,
              description: capability.description,
              metadata: {
                capability_id: capability.id,
                capability_slug: capability.slug,
              },
            },
            unit_amount: priceInCents < 50 ? 50 : priceInCents, // Stripe minimum is $0.50
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${returnUrl || origin}/agents/${capability.slug}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl || origin}/agents/${capability.slug}?payment=cancelled`,
      metadata: {
        capability_id: capability.id,
        capability_slug: capability.slug,
        price_per_call: capability.price_per_call.toString(),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      capability: {
        name: capability.name,
        slug: capability.slug,
        pricePerCall: capability.price_per_call,
        stripePrice: (priceInCents < 50 ? 50 : priceInCents) / 100,
      },
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 500 });
  }
}
