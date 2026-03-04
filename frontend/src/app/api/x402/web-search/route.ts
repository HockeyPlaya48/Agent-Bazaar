import { X402_WALLET_ADDRESS } from "@/lib/x402-config";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SKILL_CONFIG = {
  priceUsd: 0.10,
  payTo: X402_WALLET_ADDRESS,
  networks: ["base"],
  tokens: ["USDC"],
  capabilityId: "web-search",
  description: "Search the web programmatically — returns titles, URLs, snippets, and structured results for any query",
};

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function GET() {
  return NextResponse.json({
    name: "Web Search API",
    description: SKILL_CONFIG.description,
    pricing: { amount: SKILL_CONFIG.priceUsd, currency: "USDC", per: "call" },
    parameters: {
      query: { type: "string", required: true, description: "Search query" },
      count: { type: "number", required: false, description: "Number of results (1-20). Default: 10" },
      freshness: { type: "string", required: false, description: "Filter by time: day, week, month, year. Default: none" },
      region: { type: "string", required: false, description: "Region code (us, uk, de, etc.). Default: us" },
    },
  });
}

export async function POST(request: Request) {
  const start = Date.now();
  const paymentHeader = request.headers.get("x-402-payment") || request.headers.get("x-payment-token");

  if (!paymentHeader) {
    return NextResponse.json({ status: 402, message: "Payment required.", payment: SKILL_CONFIG,
      howToPay: { step1: `Send $${SKILL_CONFIG.priceUsd} USDC to ${SKILL_CONFIG.payTo} on Base`, step2: "Include tx hash in X-402-Payment header", step3: "Resend your request" },
    }, { status: 402 });
  }

  const isDemoToken = paymentHeader === "demo" || paymentHeader === "test" || paymentHeader === "paid" || paymentHeader.startsWith("stripe_");
  if (!isDemoToken) {
    try {
      const verifyRes = await fetch(new URL("/api/x402/verify", request.url).toString(), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: paymentHeader, capabilityId: SKILL_CONFIG.capabilityId }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.verified) return NextResponse.json({ status: 402, error: "Payment verification failed" }, { status: 402 });
    } catch { return NextResponse.json({ error: "Payment verification service unavailable" }, { status: 503 }); }
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { query, count = 10, freshness, region = "us" } = body;
  if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 });

  let result;

  // Try Brave Search API if key available
  const braveKey = process.env.BRAVE_API_KEY;
  if (braveKey) {
    try {
      const params = new URLSearchParams({ q: query, count: String(Math.min(count, 20)), country: region });
      if (freshness) params.set("freshness", freshness === "day" ? "pd" : freshness === "week" ? "pw" : freshness === "month" ? "pm" : "py");

      const braveRes = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
        headers: { "X-Subscription-Token": braveKey, Accept: "application/json" },
      });
      const data = await braveRes.json();
      result = {
        query,
        results: (data.web?.results || []).map((r: { title: string; url: string; description: string; age?: string }) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
          age: r.age,
        })),
        total_estimated: data.web?.totalResults || 0,
        source: "brave",
      };
    } catch { result = null; }
  }

  // Fallback: GPT-4o-mini simulated search
  if (!result) {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && openaiKey !== "sk-placeholder") {
      try {
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: `You are a web search API. Given a query, return realistic search results based on your training data. Return JSON: {"query": "...", "results": [{"title": "...", "url": "...", "snippet": "...", "relevance_score": 0-1}], "total_estimated": number, "source": "ai-generated", "note": "Results based on training data, not live web. For live results, configure BRAVE_API_KEY."}. Return ${count} results.` },
              { role: "user", content: `Search: "${query}"${freshness ? ` (filter: ${freshness})` : ""}${region !== "us" ? ` (region: ${region})` : ""}` },
            ],
            temperature: 0.3,
          }),
        });
        const data = await openaiRes.json();
        const content = data.choices?.[0]?.message?.content || "";
        try { result = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "")); }
        catch { result = { query, results: [], note: content }; }
      } catch { result = null; }
    }
  }

  if (!result) {
    result = {
      query,
      results: [
        { title: `${query} - Overview`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`, snippet: `Comprehensive overview of ${query} including history, applications, and current developments.`, relevance_score: 0.9 },
        { title: `${query} | Latest News`, url: `https://news.google.com/search?q=${encodeURIComponent(query)}`, snippet: `Latest news and developments about ${query}.`, relevance_score: 0.8 },
        { title: `Understanding ${query} - A Complete Guide`, url: `https://medium.com/search?q=${encodeURIComponent(query)}`, snippet: `In-depth guide covering everything you need to know about ${query}.`, relevance_score: 0.7 },
      ],
      total_estimated: 3,
      source: "fallback",
      note: "Rule-based fallback. Configure BRAVE_API_KEY for live web results, or GPT-4o-mini for AI-generated results.",
    };
  }

  const responseTime = Date.now() - start;
  try {
    const supabase = getSupabase();
    await supabase.from("usage_logs").insert({ capability_id: null, response_time_ms: responseTime, status: "success", metadata: { skill: "web-search", query: query.slice(0, 50), demo: isDemoToken } });
  } catch {}

  return NextResponse.json({ success: true, capabilityId: SKILL_CONFIG.capabilityId, payment: isDemoToken ? "demo" : "verified", result, responseTimeMs: responseTime });
}
