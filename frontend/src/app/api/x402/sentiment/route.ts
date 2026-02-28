import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SKILL_CONFIG = {
  priceUsd: 0.01,
  payTo: process.env.X402_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000",
  networks: ["base"],
  tokens: ["USDC"],
  capabilityId: "sentiment-analyzer",
  description: "Analyze text sentiment, emotion detection, and brand monitoring",
};

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(request: Request) {
  const start = Date.now();
  const paymentHeader = request.headers.get("x-402-payment") || request.headers.get("x-payment-token");

  if (!paymentHeader) {
    return NextResponse.json({
      status: 402,
      message: "Payment required. Send USDC on Base to use this skill.",
      payment: SKILL_CONFIG,
      howToPay: {
        step1: `Send $${SKILL_CONFIG.priceUsd} USDC to ${SKILL_CONFIG.payTo} on Base`,
        step2: "Include the transaction hash in the X-402-Payment header",
        step3: "Resend your request",
      },
    }, { status: 402 });
  }

  const isDemoToken = paymentHeader === "demo" || paymentHeader === "test";
  if (!isDemoToken) {
    try {
      const verifyRes = await fetch(new URL("/api/x402/verify", request.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: paymentHeader, capabilityId: SKILL_CONFIG.capabilityId }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.verified) {
        return NextResponse.json({ status: 402, error: "Payment verification failed" }, { status: 402 });
      }
    } catch {
      return NextResponse.json({ error: "Payment verification service unavailable" }, { status: 503 });
    }
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text, texts } = body;
  const inputTexts: string[] = texts || (text ? [text] : []);
  
  if (inputTexts.length === 0) {
    return NextResponse.json({ error: "text or texts field is required" }, { status: 400 });
  }

  let results;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey && openaiKey !== "sk-placeholder") {
    try {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Analyze sentiment for each text. Return a JSON array where each element has: "text" (first 100 chars), "sentiment" ("positive"|"negative"|"neutral"|"mixed"), "confidence" (0-1), "emotions" (array of {emotion, score}), "entities" (array of {name, sentiment}). Return ONLY valid JSON array.`,
            },
            { role: "user", content: JSON.stringify(inputTexts) },
          ],
          temperature: 0.2,
          max_tokens: 2000,
        }),
      });
      const data = await openaiRes.json();
      results = JSON.parse(data.choices?.[0]?.message?.content);
    } catch {
      results = inputTexts.map(t => analyzeSentimentBasic(t));
    }
  } else {
    results = inputTexts.map(t => analyzeSentimentBasic(t));
  }

  const latencyMs = Date.now() - start;

  try {
    const supabase = getSupabase();
    await supabase.from("usage_logs").insert({
      capability_id: SKILL_CONFIG.capabilityId,
      payer_address: paymentHeader,
      payment_tx: paymentHeader,
      amount_usd: SKILL_CONFIG.priceUsd,
      latency_ms: latencyMs,
      success: true,
    });
  } catch {}

  return NextResponse.json({
    success: true,
    results,
    summary: {
      total: results.length,
      positive: results.filter((r: any) => r.sentiment === "positive").length,
      negative: results.filter((r: any) => r.sentiment === "negative").length,
      neutral: results.filter((r: any) => r.sentiment === "neutral").length,
      mixed: results.filter((r: any) => r.sentiment === "mixed").length,
    },
    metadata: {
      skill: "sentiment-analyzer",
      version: "1.0.0",
      latencyMs,
      billedAmount: SKILL_CONFIG.priceUsd,
      engine: openaiKey && openaiKey !== "sk-placeholder" ? "gpt-4o-mini" : "rule-based",
    },
  });
}

// Basic rule-based sentiment analysis
function analyzeSentimentBasic(text: string) {
  const lower = text.toLowerCase();
  
  const positiveWords = ["great", "good", "love", "amazing", "excellent", "best", "happy", "wonderful", "fantastic", "awesome", "brilliant", "perfect", "beautiful", "exciting", "impressive", "outstanding", "superb", "delightful", "pleased", "grateful"];
  const negativeWords = ["bad", "hate", "terrible", "awful", "worst", "horrible", "disgusting", "angry", "sad", "disappointed", "frustrated", "annoying", "poor", "ugly", "broken", "failed", "useless", "pathetic", "dreadful", "miserable"];
  
  let posScore = 0;
  let negScore = 0;
  
  for (const word of positiveWords) {
    if (lower.includes(word)) posScore++;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) negScore++;
  }

  const total = posScore + negScore;
  let sentiment: string;
  let confidence: number;

  if (total === 0) {
    sentiment = "neutral";
    confidence = 0.6;
  } else if (posScore > 0 && negScore > 0) {
    sentiment = posScore > negScore ? "mixed" : "mixed";
    confidence = 0.5 + Math.abs(posScore - negScore) / total * 0.3;
  } else if (posScore > negScore) {
    sentiment = "positive";
    confidence = 0.6 + Math.min(posScore / 5, 0.35);
  } else {
    sentiment = "negative";
    confidence = 0.6 + Math.min(negScore / 5, 0.35);
  }

  const emotions: Array<{emotion: string; score: number}> = [];
  if (lower.includes("happy") || lower.includes("love") || lower.includes("joy")) emotions.push({ emotion: "joy", score: 0.8 });
  if (lower.includes("angry") || lower.includes("hate") || lower.includes("furious")) emotions.push({ emotion: "anger", score: 0.8 });
  if (lower.includes("sad") || lower.includes("disappointed") || lower.includes("sorry")) emotions.push({ emotion: "sadness", score: 0.7 });
  if (lower.includes("afraid") || lower.includes("scared") || lower.includes("worried")) emotions.push({ emotion: "fear", score: 0.7 });
  if (lower.includes("surprised") || lower.includes("amazing") || lower.includes("wow")) emotions.push({ emotion: "surprise", score: 0.7 });
  if (emotions.length === 0) emotions.push({ emotion: "neutral", score: 0.5 });

  return {
    text: text.slice(0, 100),
    sentiment,
    confidence: Math.round(confidence * 100) / 100,
    emotions,
    entities: [],
  };
}
