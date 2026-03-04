import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SKILL_CONFIG = {
  priceUsd: 0.05,
  payTo: process.env.X402_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000",
  networks: ["base"],
  tokens: ["USDC"],
  capabilityId: "twitter-automation",
  description: "Automate Twitter/X — generate optimized tweets, threads, engagement strategies, and posting schedules",
};

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function GET() {
  return NextResponse.json({
    name: "Twitter/X Automation",
    description: SKILL_CONFIG.description,
    pricing: { amount: SKILL_CONFIG.priceUsd, currency: "USDC", per: "call" },
    parameters: {
      action: { type: "string", required: true, description: "Action: compose-tweet, compose-thread, engagement-plan, schedule, analyze-profile" },
      topic: { type: "string", required: false, description: "Topic or content to create around" },
      tone: { type: "string", required: false, description: "Tone: professional, casual, provocative, educational, witty. Default: witty" },
      audience: { type: "string", required: false, description: "Target audience description" },
      count: { type: "number", required: false, description: "Number of tweets/items to generate. Default: 3" },
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

  const { action = "compose-tweet", topic, tone = "witty", audience, count = 3 } = body;
  if (!topic && !["analyze-profile", "schedule"].includes(action)) return NextResponse.json({ error: "topic is required for this action" }, { status: 400 });

  let result;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey && openaiKey !== "sk-placeholder") {
    try {
      const systemPrompts: Record<string, string> = {
        "compose-tweet": `Generate ${count} tweet options about the given topic. Each tweet must be under 280 characters. Return JSON: {"tweets": [{"text": "...", "hashtags": [...], "estimated_engagement": "low|medium|high", "best_time_to_post": "..."}]}`,
        "compose-thread": `Create a Twitter thread (${count}-8 tweets) about the topic. First tweet is the hook. Return JSON: {"thread": [{"position": 1, "text": "...", "media_suggestion": "..."}], "hook_score": 1-10}`,
        "engagement-plan": `Create a 7-day Twitter engagement plan for the topic/niche. Return JSON: {"daily_plan": [{"day": 1, "posts": [...], "engagement_actions": [...], "target_metrics": {...}}], "strategy_notes": "..."}`,
        "schedule": `Generate an optimal posting schedule for Twitter. Return JSON: {"schedule": [{"day": "Monday", "times": ["9:00 AM EST", ...], "content_type": "..."}], "rationale": "..."}`,
        "analyze-profile": `Analyze the described profile/niche and suggest improvements. Return JSON: {"bio_suggestions": [...], "content_pillars": [...], "growth_tactics": [...], "estimated_monthly_growth": "..."}`,
      };

      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: `You are an expert Twitter/X growth strategist. Tone: ${tone}. ${audience ? `Target audience: ${audience}.` : ""} ${systemPrompts[action] || systemPrompts["compose-tweet"]}` },
            { role: "user", content: topic || "General Twitter growth strategy" },
          ],
          temperature: 0.8,
        }),
      });
      const data = await openaiRes.json();
      const content = data.choices?.[0]?.message?.content || "";
      try { result = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "")); }
      catch { result = { action, output: content }; }
    } catch { result = null; }
  }

  if (!result) {
    result = {
      action,
      tweets: [
        { text: `${topic} is changing everything. Here's what nobody's talking about 🧵`, hashtags: ["#AI", "#tech"], estimated_engagement: "medium", best_time_to_post: "9:00 AM EST" },
        { text: `Hot take: ${topic} will be bigger than most people realize. The early movers are already here.`, hashtags: ["#buildinpublic"], estimated_engagement: "high", best_time_to_post: "12:00 PM EST" },
        { text: `I spent the last week going deep on ${topic}. The results surprised me. Thread incoming...`, hashtags: [], estimated_engagement: "high", best_time_to_post: "6:00 PM EST" },
      ],
      note: "Rule-based fallback. GPT-4o-mini generates more tailored content when available.",
    };
  }

  const responseTime = Date.now() - start;
  try {
    const supabase = getSupabase();
    await supabase.from("usage_logs").insert({ capability_id: null, response_time_ms: responseTime, status: "success", metadata: { skill: "twitter-automation", action, demo: isDemoToken } });
  } catch {}

  return NextResponse.json({ success: true, capabilityId: SKILL_CONFIG.capabilityId, payment: isDemoToken ? "demo" : "verified", result, responseTimeMs: responseTime });
}
