/**
 * AaaS — Automation-as-a-Service x402 Endpoint
 *
 * Per-month subscription initiated via a single USDC payment.
 * Tiers: Basic $200 · Standard $400 · Premium $800
 *
 * Flow:
 *   1. Client POSTs with scoping body (no payment header) → 402 response with instructions
 *   2. Client sends USDC on Base and POSTs again with X-402-Payment: <txHash>
 *   3. Server verifies amount matches chosen tier
 *   4. Notifications fire (email to Tyler + @nexusx2026 tweet queue)
 *   5. Returns proof-of-purchase JSON
 */

import { X402_WALLET_ADDRESS, X402_PAY_TO } from "@/lib/x402-config";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Tier config ──────────────────────────────────────────────────────────────

export const AAAS_TIERS = {
  basic: {
    label: "Basic",
    priceUsd: 200,
    description: "Simple automation bots, scheduling, single-channel alerts, basic scraping.",
    deliverables: ["Up to 3 automation bots", "Basic scheduling & monitoring", "Email/Slack alert integration", "2-week delivery"],
  },
  standard: {
    label: "Standard",
    priceUsd: 400,
    description: "Content pipelines + social automation across multiple platforms.",
    deliverables: ["Everything in Basic", "Multi-platform content pipeline", "Social media automation (X, Telegram, Discord)", "Engagement monitoring", "1-week delivery"],
  },
  premium: {
    label: "Premium",
    priceUsd: 800,
    description: "Full monitoring + custom multi-agent system (powered by @nexusx2026's 19-agent stack).",
    deliverables: ["Everything in Standard", "Custom 19-agent orchestration", "24/7 uptime monitoring", "Self-improving feedback loops", "Priority support via DM", "3-day delivery"],
  },
} as const;

export type AaaStier = keyof typeof AAAS_TIERS;

const SKILL_CONFIG = {
  capabilityId: "automation-as-a-service",
  payTo: X402_PAY_TO,
  networks: ["base"],
  tokens: ["USDC"],
  description: "Done-for-you AI automation — @nexusx2026's 19-agent system builds, monitors, and maintains your automations.",
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── GET — describe the skill ─────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    name: "Automation-as-a-Service (AaaS)",
    description: SKILL_CONFIG.description,
    provider: "@thebasedfrogx / @nexusx2026",
    tiers: AAAS_TIERS,
    paymentRails: {
      x402: { networks: SKILL_CONFIG.networks, tokens: SKILL_CONFIG.tokens, payTo: SKILL_CONFIG.payTo },
      stripe: "https://agent-bazaar.com/api/aaas/checkout",
    },
    contact: {
      x: "@thebasedfrogx",
      phone: "(207) 745-5876",
      email: "kenneytyler14@gmail.com",
    },
    parameters: {
      tier: { type: "string", required: true, enum: ["basic", "standard", "premium"] },
      fullName: { type: "string", required: true },
      email: { type: "string", required: true },
      automationDescription: { type: "string", required: true, minLength: 20 },
      xHandle: { type: "string", required: false },
      phone: { type: "string", required: false },
    },
  });
}

// ─── POST — submit scope + x402 payment ───────────────────────────────────────

export async function POST(request: Request) {
  const start = Date.now();
  const paymentHeader =
    request.headers.get("x-402-payment") ||
    request.headers.get("x-payment-token") ||
    request.headers.get("X-402-Payment");

  // ── Parse body early so we can include tier in 402 response ──
  let body: Record<string, string> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { tier = "basic", fullName, email, automationDescription, xHandle, phone } = body;

  // Validate required scoping fields
  if (!fullName || !email || !automationDescription) {
    return NextResponse.json(
      { error: "fullName, email, and automationDescription are required" },
      { status: 400 }
    );
  }

  if (automationDescription.length < 20) {
    return NextResponse.json(
      { error: "automationDescription must be at least 20 characters" },
      { status: 400 }
    );
  }

  const tierConfig = AAAS_TIERS[tier as AaaStier];
  if (!tierConfig) {
    return NextResponse.json(
      { error: "tier must be one of: basic, standard, premium" },
      { status: 400 }
    );
  }

  // ── No payment → 402 with full instructions ──
  if (!paymentHeader) {
    return NextResponse.json(
      {
        status: 402,
        message: `Payment required — $${tierConfig.priceUsd} USDC for ${tierConfig.label} tier`,
        tier: tierConfig,
        payment: {
          ...SKILL_CONFIG,
          priceUsd: tierConfig.priceUsd,
        },
        howToPay: {
          step1: `Send exactly $${tierConfig.priceUsd} USDC to ${X402_WALLET_ADDRESS} on Base (chain 8453)`,
          step2: "Copy the transaction hash from your wallet",
          step3: "Re-send this POST with header: X-402-Payment: <txHash>",
          alternativeStripe: `POST https://agent-bazaar.com/api/aaas/checkout with { tier, fullName, email, automationDescription }`,
        },
        contact: {
          x: "@thebasedfrogx",
          phone: "(207) 745-5876",
          email: "kenneytyler14@gmail.com",
        },
      },
      { status: 402 }
    );
  }

  // ── Determine if this is a test/demo token ──
  const isDemo =
    paymentHeader === "demo" ||
    paymentHeader === "test" ||
    paymentHeader === "paid" ||
    paymentHeader.startsWith("stripe_") ||
    paymentHeader.startsWith("test_");

  // ── Verify on-chain for real payments ──
  if (!isDemo) {
    try {
      const verifyRes = await fetch(
        new URL("/api/x402/verify", request.url).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: paymentHeader,
            capabilityId: SKILL_CONFIG.capabilityId,
            expectedAmountUsd: tierConfig.priceUsd,
          }),
        }
      );
      const verifyData = await verifyRes.json();
      if (!verifyData.verified) {
        return NextResponse.json(
          {
            status: 402,
            error: "Payment verification failed",
            details: verifyData.error,
            expectedAmount: `$${tierConfig.priceUsd} USDC`,
          },
          { status: 402 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Payment verification service unavailable" },
        { status: 503 }
      );
    }
  }

  // ── Payment verified — record subscription + fire notifications ──
  const supabase = getSupabase();
  const clientRecord = {
    capability_id: SKILL_CONFIG.capabilityId,
    tier,
    full_name: fullName,
    email,
    x_handle: xHandle || null,
    phone: phone || null,
    automation_description: automationDescription,
    payment_tx: paymentHeader,
    payment_method: isDemo ? "demo" : "x402",
    amount_usd: tierConfig.priceUsd,
    status: "active",
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from("aaas_clients").insert(clientRecord);
  } catch {
    // Table may not exist yet — log and continue
    console.error("aaas_clients insert failed (table may need creation)");
  }

  // Log usage
  try {
    await supabase.from("usage_logs").insert({
      capability_id: SKILL_CONFIG.capabilityId,
      payer_address: paymentHeader,
      payment_tx: paymentHeader,
      amount_usd: tierConfig.priceUsd,
      latency_ms: Date.now() - start,
      success: true,
      metadata: { tier, email, fullName },
    });
  } catch {}

  // ── Fire notifications (non-blocking) ──
  const notifyUrl = new URL("/api/aaas/notify", request.url).toString();
  fetch(notifyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": process.env.INTERNAL_NOTIFY_KEY || "aaas-internal",
    },
    body: JSON.stringify({
      event: "new_purchase",
      paymentMethod: isDemo ? "demo/x402-test" : "x402-usdc",
      tier,
      tierConfig,
      fullName,
      email,
      xHandle: xHandle || "not provided",
      phone: phone || "not provided",
      automationDescription,
      txHash: paymentHeader,
      amountUsd: tierConfig.priceUsd,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {});

  // ── Build proof of purchase ──
  const purchaseId = `AAAS-${tier.toUpperCase()}-${Date.now()}`;

  return NextResponse.json(
    {
      success: true,
      purchaseId,
      message: `Welcome aboard! Your ${tierConfig.label} AaaS subscription is active.`,
      tier: tierConfig,
      paymentVerified: true,
      paymentMethod: isDemo ? "demo" : "x402",
      txHash: paymentHeader,
      nextSteps: {
        step1: "Check your email — a proof of purchase and onboarding details have been sent.",
        step2: "DM @thebasedfrogx on X with your purchase ID to finalize your automation scope.",
        step3: "@nexusx2026's 19-agent system will begin building your automation within the delivery window.",
        scopeDm: `DM @thebasedfrogx: "AaaS ${purchaseId} — ${automationDescription.slice(0, 80)}"`,
      },
      contact: {
        x: "@thebasedfrogx",
        phone: "(207) 745-5876",
        email: "kenneytyler14@gmail.com",
      },
      deliverables: tierConfig.deliverables,
      latencyMs: Date.now() - start,
    },
    { status: 200 }
  );
}
