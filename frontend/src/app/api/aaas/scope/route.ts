/**
 * AaaS Scope Submission
 * POST /api/aaas/scope
 *
 * Validates and stores scoping form data before checkout.
 * Returns a scopeId that is passed to Stripe checkout metadata
 * so the webhook can retrieve the full scope after payment.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AAAS_TIERS, type AaaStier } from "@/app/api/x402/automation-as-a-service/route";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { tier, fullName, email, automationDescription, xHandle, phone } = body;

  // ── Validate ──────────────────────────────────────────────────────────────
  if (!tier || !fullName || !email || !automationDescription) {
    return NextResponse.json(
      { error: "tier, fullName, email, and automationDescription are required" },
      { status: 400 }
    );
  }

  if (!AAAS_TIERS[tier as AaaStier]) {
    return NextResponse.json(
      { error: "tier must be: basic | standard | premium" },
      { status: 400 }
    );
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (automationDescription.length < 20) {
    return NextResponse.json(
      { error: "automationDescription must be at least 20 characters" },
      { status: 400 }
    );
  }

  // ── Store scope ───────────────────────────────────────────────────────────
  const scopeId = `scope_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const tierConfig = AAAS_TIERS[tier as AaaStier];

  try {
    const supabase = getSupabase();
    await supabase.from("aaas_scopes").insert({
      scope_id: scopeId,
      tier,
      full_name: fullName,
      email,
      x_handle: xHandle || null,
      phone: phone || null,
      automation_description: automationDescription,
      status: "pending_payment",
      created_at: new Date().toISOString(),
    });
  } catch {
    // Table may not exist — scope is still returned in-memory for checkout
    console.warn("aaas_scopes insert failed — proceeding without DB storage");
  }

  return NextResponse.json({
    scopeId,
    tier,
    tierConfig,
    message: "Scope saved. Proceed to checkout.",
    checkoutUrl: `/api/aaas/checkout`,
  });
}
