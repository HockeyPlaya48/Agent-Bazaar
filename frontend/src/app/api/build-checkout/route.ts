import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20" as any,
});

// Create a Stripe checkout session for the Agent Builder ($0.25)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, name, platforms } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Description required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "AI Agent Builder",
              description: `Build a custom AI agent: "${description.slice(0, 100)}${description.length > 100 ? "..." : ""}"`,
            },
            unit_amount: 25, // $0.25 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://agent-bazaar.com"}/build?session_id={CHECKOUT_SESSION_ID}&description=${encodeURIComponent(description)}&name=${encodeURIComponent(name || "")}&platforms=${encodeURIComponent((platforms || []).join(","))}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://agent-bazaar.com"}/build?cancelled=true`,
      metadata: {
        skill: "agent-builder",
        description,
        name: name || "",
        platforms: (platforms || []).join(","),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Verify a completed checkout session
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      paid: session.payment_status === "paid",
      description: session.metadata?.description,
      name: session.metadata?.name,
      platforms: session.metadata?.platforms?.split(",").filter(Boolean),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
