import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SKILL_CONFIG = {
  priceUsd: 0.07,
  payTo: process.env.X402_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000",
  networks: ["base"],
  tokens: ["USDC"],
  capabilityId: "social-content-generator",
  description: "Generate platform-specific social media content — X threads, Instagram captions, TikTok scripts, LinkedIn posts with correct formatting per platform",
};

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function GET() {
  return NextResponse.json({
    name: "Social Media Content Generator",
    description: SKILL_CONFIG.description,
    pricing: { amount: SKILL_CONFIG.priceUsd, currency: "USDC", per: "call" },
    parameters: {
      topic: { type: "string", required: true, description: "Topic or product to create content about" },
      platforms: { type: "array", required: false, description: "Platforms: x, instagram, tiktok, linkedin, reddit. Default: all" },
      tone: { type: "string", required: false, description: "Tone: professional, casual, edgy, educational, hype. Default: casual" },
      include_hashtags: { type: "boolean", required: false, description: "Include relevant hashtags. Default: true" },
      cta: { type: "string", required: false, description: "Call to action URL or message to include" },
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

  const { topic, platforms = ["x", "instagram", "tiktok", "linkedin"], tone = "casual", include_hashtags = true, cta } = body;
  if (!topic) return NextResponse.json({ error: "topic is required" }, { status: 400 });

  let result;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey && openaiKey !== "sk-placeholder") {
    try {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: `You are a social media content expert. Generate platform-specific content for each requested platform. Tone: ${tone}. ${cta ? `Include CTA: ${cta}` : ""}
            
CRITICAL PLATFORM RULES:
- X/Twitter: Under 280 chars per tweet. No links in main tweet (link goes in reply). Thread format for longer content.
- Instagram: Visual-first language. Suggest image/carousel concept. Line breaks for readability. Hashtags at end (up to 30).
- TikTok: Script format with hook in first 3 seconds. Casual, conversational. Include trending sound suggestion.
- LinkedIn: Professional but human. Longer form OK. Use line breaks for readability. No hashtag spam (3-5 max).
- Reddit: Discussion format. End with question. Don't sound like an ad.

Return JSON: {"content": {"x": {"main_post": "...", "reply_with_link": "...", "thread": [...]}, "instagram": {"caption": "...", "image_concept": "...", "hashtags": [...]}, "tiktok": {"hook": "...", "script": "...", "duration_seconds": N, "trending_sound": "..."}, "linkedin": {"post": "...", "hashtags": [...]}}, "posting_order": [...], "best_times": {...}}

Only include platforms that were requested.` },
            { role: "user", content: `Topic: ${topic}\nPlatforms: ${platforms.join(", ")}` },
          ],
          temperature: 0.8,
        }),
      });
      const data = await openaiRes.json();
      const content = data.choices?.[0]?.message?.content || "";
      try { result = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "")); }
      catch { result = { topic, output: content }; }
    } catch { result = null; }
  }

  if (!result) {
    result = {
      content: {
        x: platforms.includes("x") ? { main_post: `${topic} is changing everything. Here's what most people are missing:`, reply_with_link: "Full breakdown here: [your link]", thread: [] } : undefined,
        instagram: platforms.includes("instagram") ? { caption: `${topic} ✨\n\nThis is going to change the game.\n\nSave this for later 👆`, image_concept: "Clean infographic with key stats", hashtags: include_hashtags ? ["#AI", "#tech", "#innovation"] : [] } : undefined,
        tiktok: platforms.includes("tiktok") ? { hook: `Wait, did you know about ${topic}?`, script: `Hook: "Wait, did you know about this?"\nBody: Quick explanation of ${topic}\nCTA: "Follow for more"`, duration_seconds: 30, trending_sound: "Original audio" } : undefined,
        linkedin: platforms.includes("linkedin") ? { post: `I've been thinking about ${topic}.\n\nHere's what I've learned:\n\n→ Point 1\n→ Point 2\n→ Point 3\n\nWhat's your take?`, hashtags: ["#AI", "#Innovation"] } : undefined,
      },
      posting_order: ["x", "linkedin", "instagram", "tiktok"],
      best_times: { x: "9am EST", instagram: "11am EST", tiktok: "6pm EST", linkedin: "8am EST" },
      note: "Rule-based fallback. GPT-4o-mini generates tailored platform-specific content when available.",
    };
  }

  const responseTime = Date.now() - start;
  try {
    const supabase = getSupabase();
    await supabase.from("usage_logs").insert({ capability_id: null, response_time_ms: responseTime, status: "success", metadata: { skill: "social-content", platforms, demo: isDemoToken } });
  } catch {}

  return NextResponse.json({ success: true, capabilityId: SKILL_CONFIG.capabilityId, payment: isDemoToken ? "demo" : "verified", result, responseTimeMs: responseTime });
}
