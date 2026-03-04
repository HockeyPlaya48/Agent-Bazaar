import { X402_WALLET_ADDRESS } from "@/lib/x402-config";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SKILL_CONFIG = {
  priceUsd: 0.08,
  payTo: X402_WALLET_ADDRESS,
  networks: ["base"], tokens: ["USDC"],
  capabilityId: "dalle-image-gen",
  description: "Generate images from text prompts via DALL-E 3",
};

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(request: Request) {
  const start = Date.now();
  const paymentHeader = request.headers.get("x-402-payment") || request.headers.get("x-payment-token");

  if (!paymentHeader) {
    return NextResponse.json({ status: 402, message: "Payment required.", payment: SKILL_CONFIG }, { status: 402 });
  }

  const isDemoToken = paymentHeader === "demo" || paymentHeader === "test";
  if (!isDemoToken) {
    try {
      const v = await fetch(new URL("/api/x402/verify", request.url).toString(), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: paymentHeader, capabilityId: SKILL_CONFIG.capabilityId }),
      });
      const vd = await v.json();
      if (!vd.verified) return NextResponse.json({ status: 402, error: "Payment verification failed" }, { status: 402 });
    } catch { return NextResponse.json({ error: "Payment verification unavailable" }, { status: 503 }); }
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { prompt, size = "1024x1024", quality = "standard" } = body;
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });

  let result;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey && openaiKey !== "sk-placeholder") {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size, quality }),
      });
      const data = await res.json();
      if (data.data?.[0]) {
        result = { imageUrl: data.data[0].url, revisedPrompt: data.data[0].revised_prompt };
      } else {
        result = { error: "Image generation failed", details: data.error?.message || "Unknown error" };
      }
    } catch (e: any) {
      result = { error: "OpenAI API error", message: e.message };
    }
  } else {
    result = { imageUrl: `https://placehold.co/1024x1024/1a1a2e/f97316?text=${encodeURIComponent(prompt.slice(0, 30))}`, revisedPrompt: prompt, note: "Demo mode — placeholder image" };
  }

  const latencyMs = Date.now() - start;
  try { const s = getSupabase(); await s.from("usage_logs").insert({ capability_id: SKILL_CONFIG.capabilityId, payer_address: paymentHeader, payment_tx: paymentHeader, amount_usd: SKILL_CONFIG.priceUsd, latency_ms: latencyMs, success: !result.error }); } catch {}

  return NextResponse.json({ success: !result.error, ...result, metadata: { skill: "dalle-image-gen", version: "1.0.0", latencyMs, billedAmount: SKILL_CONFIG.priceUsd, engine: openaiKey && openaiKey !== "sk-placeholder" ? "dall-e-3" : "placeholder" } });
}
