import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

// GET /api/reputation?slug=xyz — Get reputation score for a skill
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug parameter required" }, { status: 400 });
  }

  try {
    const sb = getSupabase();
    
    // Get usage logs for this skill
    const { data: capability } = await sb
      .from("capabilities")
      .select("id, name, slug")
      .eq("slug", slug)
      .single();

    if (!capability) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    const { data: logs } = await sb
      .from("usage_logs")
      .select("success, latency_ms, created_at")
      .eq("capability_id", capability.id)
      .order("created_at", { ascending: false })
      .limit(1000);

    const totalCalls = logs?.length || 0;
    const successfulCalls = logs?.filter((l: any) => l.success)?.length || 0;
    const successRate = totalCalls > 0 ? successfulCalls / totalCalls : 0;
    const avgLatency = totalCalls > 0
      ? (logs?.reduce((sum: number, l: any) => sum + (l.latency_ms || 0), 0) || 0) / totalCalls
      : 0;

    // Calculate reputation score (0-100)
    // Weighted: 40% success rate, 25% volume, 20% latency, 15% age
    const volumeScore = Math.min(totalCalls / 1000, 1); // max at 1000 calls
    const latencyScore = avgLatency > 0 ? Math.max(0, 1 - (avgLatency / 10000)) : 0.5; // <10s is good
    const firstCall = logs?.[logs.length - 1]?.created_at;
    const ageDays = firstCall ? (Date.now() - new Date(firstCall).getTime()) / 86400000 : 0;
    const ageScore = Math.min(ageDays / 30, 1); // max at 30 days

    const reputationScore = Math.round(
      (successRate * 40) + (volumeScore * 25) + (latencyScore * 20) + (ageScore * 15)
    );

    // Assign tier
    let tier = "new";
    if (totalCalls >= 500000 && successRate >= 0.99) tier = "elite";
    else if (totalCalls >= 100000 && successRate >= 0.99) tier = "trusted";
    else if (totalCalls >= 10000 && successRate >= 0.95) tier = "established";
    else if (totalCalls >= 1000) tier = "rising";

    return NextResponse.json({
      slug,
      name: capability.name,
      reputation: {
        score: reputationScore,
        tier,
        totalCalls,
        successRate: Math.round(successRate * 1000) / 10,
        avgLatencyMs: Math.round(avgLatency),
        ageDays: Math.round(ageDays),
      },
      breakdown: {
        successRateScore: Math.round(successRate * 40),
        volumeScore: Math.round(volumeScore * 25),
        latencyScore: Math.round(latencyScore * 20),
        ageScore: Math.round(ageScore * 15),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/reputation/log — Log a skill call (called by x402 endpoints)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { capabilitySlug, success, latencyMs, payerAddress, amountUsd, paymentTx } = body;

    const sb = getSupabase();

    // Look up capability
    const { data: cap } = await sb
      .from("capabilities")
      .select("id")
      .eq("slug", capabilitySlug)
      .single();

    if (!cap) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Insert usage log
    const { error } = await sb.from("usage_logs").insert({
      capability_id: cap.id,
      success: success ?? true,
      latency_ms: latencyMs || 0,
      payer_address: payerAddress || "anonymous",
      amount_usd: amountUsd || 0,
      payment_tx: paymentTx || "internal",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logged: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
