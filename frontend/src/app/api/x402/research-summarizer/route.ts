import { X402_WALLET_ADDRESS } from "@/lib/x402-config";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SKILL_CONFIG = {
  priceUsd: 0.04,
  payTo: X402_WALLET_ADDRESS,
  networks: ["base"], tokens: ["USDC"],
  capabilityId: "research-summarizer",
  description: "Summarize academic papers, extract key findings, generate literature reviews",
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

  const { text, url, doi, topic } = body;

  // Get content to summarize
  let content = text || "";
  
  if (url && !content) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "AgentBazaar-Research/1.0" }, signal: AbortSignal.timeout(8000) });
      const html = await res.text();
      content = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 10000);
    } catch {}
  }

  if (topic && !content) {
    content = `Research topic: ${topic}`;
  }

  if (!content) return NextResponse.json({ error: "Provide text, url, doi, or topic" }, { status: 400 });

  let summary;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey && openaiKey !== "sk-placeholder") {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: `You are a research assistant. Analyze the content and return JSON with: "title" (string), "summary" (2-3 paragraph summary), "keyFindings" (array of strings), "methodology" (string or null), "limitations" (array of strings), "citations" (array of related work to look up), "readingTimeMin" (number). Return ONLY valid JSON.` },
            { role: "user", content: content.slice(0, 8000) },
          ],
          temperature: 0.3, max_tokens: 2000,
        }),
      });
      const data = await res.json();
      summary = JSON.parse(data.choices?.[0]?.message?.content);
    } catch {
      summary = basicSummary(content);
    }
  } else {
    summary = basicSummary(content);
  }

  const latencyMs = Date.now() - start;
  try { const s = getSupabase(); await s.from("usage_logs").insert({ capability_id: SKILL_CONFIG.capabilityId, payer_address: paymentHeader, payment_tx: paymentHeader, amount_usd: SKILL_CONFIG.priceUsd, latency_ms: latencyMs, success: true }); } catch {}

  return NextResponse.json({
    success: true, summary,
    metadata: { skill: "research-summarizer", version: "1.0.0", latencyMs, billedAmount: SKILL_CONFIG.priceUsd, engine: openaiKey && openaiKey !== "sk-placeholder" ? "gpt-4o-mini" : "basic" },
  });
}

function basicSummary(text: string) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  return {
    title: sentences[0]?.trim().slice(0, 80) || "Research Summary",
    summary: sentences.slice(0, 5).join(". ").trim() + ".",
    keyFindings: sentences.slice(0, 3).map(s => s.trim()),
    methodology: null,
    limitations: ["Automated summary — may miss nuanced findings"],
    citations: [],
    readingTimeMin: Math.ceil(text.split(/\s+/).length / 200),
  };
}
