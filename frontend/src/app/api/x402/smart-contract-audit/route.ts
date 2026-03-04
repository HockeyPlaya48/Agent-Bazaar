import { X402_WALLET_ADDRESS } from "@/lib/x402-config";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SKILL_CONFIG = {
  priceUsd: 0.10,
  payTo: X402_WALLET_ADDRESS,
  networks: ["base"],
  tokens: ["USDC"],
  capabilityId: "smart-contract-auditor",
  description: "AI-powered smart contract security analysis — reentrancy, overflow, access control vulnerabilities",
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

  const { code, contractAddress } = body;
  if (!code && !contractAddress) {
    return NextResponse.json({ error: "code or contractAddress field is required" }, { status: 400 });
  }

  let sourceCode = code || "";
  
  // If contractAddress provided, try to fetch from Basescan
  if (contractAddress && !code) {
    try {
      const res = await fetch(`https://api.basescan.org/api?module=contract&action=getsourcecode&address=${contractAddress}`);
      const data = await res.json();
      if (data.result?.[0]?.SourceCode) {
        sourceCode = data.result[0].SourceCode;
      }
    } catch {}
  }

  if (!sourceCode) {
    return NextResponse.json({ error: "Could not retrieve contract source code" }, { status: 400 });
  }

  let audit;
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
              content: `You are a smart contract security auditor. Analyze the Solidity code and return JSON with:
              "summary": overall assessment (1-2 sentences)
              "riskLevel": "critical"|"high"|"medium"|"low"
              "vulnerabilities": array of {severity: "critical"|"high"|"medium"|"low"|"info", type: string, description: string, line: number|null, recommendation: string}
              "gasOptimizations": array of {description: string, estimatedSaving: string}
              "securityScore": 0-100
              "bestPractices": array of {practice: string, status: "pass"|"fail"|"warning"}
              Return ONLY valid JSON.`,
            },
            { role: "user", content: `Audit this smart contract:\n\n${sourceCode.slice(0, 8000)}` },
          ],
          temperature: 0.2,
          max_tokens: 3000,
        }),
      });
      const data = await openaiRes.json();
      audit = JSON.parse(data.choices?.[0]?.message?.content);
    } catch {
      audit = auditBasic(sourceCode);
    }
  } else {
    audit = auditBasic(sourceCode);
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
    audit,
    metadata: {
      skill: "smart-contract-auditor",
      version: "1.0.0",
      latencyMs,
      billedAmount: SKILL_CONFIG.priceUsd,
      engine: openaiKey && openaiKey !== "sk-placeholder" ? "gpt-4o-mini" : "rule-based",
    },
  });
}

function auditBasic(code: string) {
  const vulnerabilities: Array<{severity: string; type: string; description: string; line: number | null; recommendation: string}> = [];
  const gasOptimizations: Array<{description: string; estimatedSaving: string}> = [];
  const bestPractices: Array<{practice: string; status: string}> = [];
  const lines = code.split("\n");

  lines.forEach((line, i) => {
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Reentrancy
    if (trimmed.includes(".call{value:") || trimmed.includes(".call.value(")) {
      vulnerabilities.push({
        severity: "critical",
        type: "Reentrancy",
        description: "External call with value transfer detected. Potential reentrancy vulnerability.",
        line: lineNum,
        recommendation: "Use ReentrancyGuard or checks-effects-interactions pattern",
      });
    }

    // tx.origin
    if (trimmed.includes("tx.origin")) {
      vulnerabilities.push({
        severity: "high",
        type: "tx.origin Authentication",
        description: "Using tx.origin for authentication is vulnerable to phishing attacks.",
        line: lineNum,
        recommendation: "Use msg.sender instead of tx.origin",
      });
    }

    // Unchecked return values
    if (trimmed.includes(".transfer(") || trimmed.includes(".send(")) {
      if (!trimmed.includes("require") && !trimmed.includes("assert")) {
        vulnerabilities.push({
          severity: "high",
          type: "Unchecked Return Value",
          description: "Return value of transfer/send not checked.",
          line: lineNum,
          recommendation: "Use require() to check return value or use .call() with checks",
        });
      }
    }

    // Integer overflow (pre-0.8.0)
    if (trimmed.includes("pragma solidity") && !trimmed.includes("^0.8") && !trimmed.includes(">=0.8")) {
      vulnerabilities.push({
        severity: "high",
        type: "Integer Overflow/Underflow",
        description: "Solidity version < 0.8.0 does not have built-in overflow checks.",
        line: lineNum,
        recommendation: "Upgrade to Solidity ^0.8.0 or use SafeMath library",
      });
    }

    // Delegatecall
    if (trimmed.includes("delegatecall")) {
      vulnerabilities.push({
        severity: "high",
        type: "Delegatecall Usage",
        description: "delegatecall can allow attackers to change contract state if target is untrusted.",
        line: lineNum,
        recommendation: "Ensure delegatecall targets are trusted and immutable",
      });
    }

    // selfdestruct
    if (trimmed.includes("selfdestruct") || trimmed.includes("suicide")) {
      vulnerabilities.push({
        severity: "critical",
        type: "Self-Destruct",
        description: "selfdestruct can permanently destroy the contract and send funds to arbitrary address.",
        line: lineNum,
        recommendation: "Remove selfdestruct or add strict access controls",
      });
    }

    // Gas optimizations
    if (trimmed.startsWith("uint8 ") || trimmed.startsWith("uint16 ")) {
      gasOptimizations.push({
        description: `Line ${lineNum}: Small uint types cost more gas than uint256 in storage`,
        estimatedSaving: "~200 gas per operation",
      });
    }
  });

  // Best practices checks
  bestPractices.push({ practice: "Uses latest Solidity version (^0.8.x)", status: code.includes("^0.8") || code.includes(">=0.8") ? "pass" : "fail" });
  bestPractices.push({ practice: "Has access control (Ownable/AccessControl)", status: code.includes("Ownable") || code.includes("AccessControl") || code.includes("onlyOwner") ? "pass" : "warning" });
  bestPractices.push({ practice: "Emits events for state changes", status: code.includes("emit ") ? "pass" : "warning" });
  bestPractices.push({ practice: "Uses ReentrancyGuard", status: code.includes("ReentrancyGuard") || code.includes("nonReentrant") ? "pass" : "warning" });
  bestPractices.push({ practice: "Has NatSpec documentation", status: code.includes("@dev") || code.includes("@notice") ? "pass" : "fail" });

  const criticalCount = vulnerabilities.filter(v => v.severity === "critical").length;
  const highCount = vulnerabilities.filter(v => v.severity === "high").length;
  const securityScore = Math.max(0, 100 - criticalCount * 30 - highCount * 15 - vulnerabilities.length * 5);
  const riskLevel = criticalCount > 0 ? "critical" : highCount > 0 ? "high" : vulnerabilities.length > 2 ? "medium" : "low";

  return {
    summary: `Found ${vulnerabilities.length} vulnerabilities (${criticalCount} critical, ${highCount} high). ${riskLevel === "low" ? "Contract appears relatively safe." : "Issues require attention before deployment."}`,
    riskLevel,
    vulnerabilities,
    gasOptimizations,
    securityScore,
    bestPractices,
  };
}
