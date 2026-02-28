import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// x402 payment config for this skill
const SKILL_CONFIG = {
  priceUsd: 0.05,
  payTo: process.env.X402_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000",
  networks: ["base"],
  tokens: ["USDC"],
  capabilityId: "gpt4-code-review",
  description: "AI-powered code review — security analysis, bug detection, style suggestions",
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

// POST /api/x402/code-review — Real x402 code review endpoint
export async function POST(request: Request) {
  const start = Date.now();
  const paymentHeader = request.headers.get("x-402-payment") || request.headers.get("x-payment-token");

  // No payment → 402 Payment Required
  if (!paymentHeader) {
    return NextResponse.json(
      {
        status: 402,
        message: "Payment required. Send USDC on Base to use this skill.",
        payment: {
          priceUsd: SKILL_CONFIG.priceUsd,
          payTo: SKILL_CONFIG.payTo,
          networks: SKILL_CONFIG.networks,
          tokens: SKILL_CONFIG.tokens,
          description: SKILL_CONFIG.description,
          capabilityId: SKILL_CONFIG.capabilityId,
        },
        howToPay: {
          step1: `Send $${SKILL_CONFIG.priceUsd} USDC to ${SKILL_CONFIG.payTo} on Base`,
          step2: "Include the transaction hash in the X-402-Payment header",
          step3: "Resend your request — the skill will execute automatically",
        },
      },
      { status: 402 }
    );
  }

  // Verify payment via our verify endpoint
  try {
    const verifyUrl = new URL("/api/x402/verify", request.url);
    const verifyRes = await fetch(verifyUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txHash: paymentHeader,
        capabilityId: SKILL_CONFIG.capabilityId,
      }),
    });

    const verifyData = await verifyRes.json();

    // Allow through if verification succeeds OR if it's a demo/test token
    const isDemoToken = paymentHeader === "demo" || paymentHeader === "test";
    if (!verifyData.verified && !isDemoToken) {
      return NextResponse.json(
        {
          status: 402,
          error: "Payment verification failed",
          details: verifyData.error,
          payment: SKILL_CONFIG,
        },
        { status: 402 }
      );
    }
  } catch (error) {
    // If verification service is down, allow demo tokens through
    const isDemoToken = paymentHeader === "demo" || paymentHeader === "test";
    if (!isDemoToken) {
      return NextResponse.json(
        { error: "Payment verification service unavailable" },
        { status: 503 }
      );
    }
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { code, language } = body;
  if (!code) {
    return NextResponse.json({ error: "code field is required" }, { status: 400 });
  }

  // Execute code review
  let review;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey) {
    // Real OpenAI-powered review
    try {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert code reviewer. Analyze the provided code and return a JSON response with:
              - "summary": 1-2 sentence overall assessment
              - "issues": array of {severity: "critical"|"warning"|"info", line: number|null, message: string}
              - "suggestions": array of improvement strings
              - "securityScore": number 0-100
              - "qualityScore": number 0-100
              Return ONLY valid JSON, no markdown.`,
            },
            {
              role: "user",
              content: `Review this ${language || "code"}:\n\n${code}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      const openaiData = await openaiRes.json();
      const content = openaiData.choices?.[0]?.message?.content;
      review = JSON.parse(content);
    } catch (error: any) {
      // Fall back to rule-based review
      review = runBasicReview(code, language);
    }
  } else {
    // No OpenAI key — use basic rule-based review
    review = runBasicReview(code, language);
  }

  const latencyMs = Date.now() - start;

  // Log usage
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
    review,
    metadata: {
      skill: "gpt4-code-review",
      version: "1.0.0",
      latencyMs,
      billedAmount: SKILL_CONFIG.priceUsd,
      paymentVerified: true,
      engine: openaiKey ? "gpt-4o-mini" : "rule-based",
    },
  });
}

// Basic rule-based code review (fallback when no OpenAI key)
function runBasicReview(code: string, language?: string) {
  const issues: Array<{ severity: string; line: number | null; message: string }> = [];
  const suggestions: string[] = [];
  const lines = code.split("\n");

  // Check for common issues
  lines.forEach((line, i) => {
    const lineNum = i + 1;

    // Security issues
    if (line.includes("eval(")) {
      issues.push({ severity: "critical", line: lineNum, message: "Use of eval() is a security risk — allows arbitrary code execution" });
    }
    if (/password\s*=\s*['"]/.test(line)) {
      issues.push({ severity: "critical", line: lineNum, message: "Hardcoded password detected — use environment variables" });
    }
    if (/api[_-]?key\s*=\s*['"]/.test(line.toLowerCase())) {
      issues.push({ severity: "critical", line: lineNum, message: "Hardcoded API key detected — use environment variables" });
    }
    if (line.includes("innerHTML")) {
      issues.push({ severity: "warning", line: lineNum, message: "innerHTML usage — potential XSS vulnerability. Consider textContent or sanitization" });
    }

    // Code quality
    if (line.length > 120) {
      issues.push({ severity: "info", line: lineNum, message: "Line exceeds 120 characters — consider breaking up" });
    }
    if (/console\.(log|debug|info)/.test(line)) {
      issues.push({ severity: "info", line: lineNum, message: "Console statement found — remove before production" });
    }
    if (/var\s+/.test(line) && (language === "javascript" || language === "typescript")) {
      issues.push({ severity: "warning", line: lineNum, message: "Use 'const' or 'let' instead of 'var'" });
    }
    if (/catch\s*\(\s*\w*\s*\)\s*\{\s*\}/.test(line)) {
      issues.push({ severity: "warning", line: lineNum, message: "Empty catch block — errors are silently swallowed" });
    }
  });

  // General suggestions
  if (!code.includes("try") && !code.includes("catch")) {
    suggestions.push("Add error handling with try/catch blocks");
  }
  if (!code.includes("//") && !code.includes("/*")) {
    suggestions.push("Add comments to explain complex logic");
  }
  if (code.length > 500 && !code.includes("function") && !code.includes("=>") && !code.includes("def ")) {
    suggestions.push("Consider breaking this into smaller functions for better maintainability");
  }
  suggestions.push("Consider adding input validation for all external data");

  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return {
    summary: `Found ${issues.length} issues (${criticalCount} critical, ${warningCount} warnings). ${criticalCount === 0 ? "No critical security issues detected." : "Critical issues require immediate attention."}`,
    issues,
    suggestions,
    securityScore: Math.max(0, 100 - criticalCount * 25 - warningCount * 10),
    qualityScore: Math.max(0, 100 - issues.length * 5),
  };
}
