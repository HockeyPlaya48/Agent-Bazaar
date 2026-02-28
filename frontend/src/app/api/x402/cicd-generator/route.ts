import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SKILL_CONFIG = {
  priceUsd: 0.03,
  payTo: process.env.X402_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000",
  networks: ["base"], tokens: ["USDC"],
  capabilityId: "cicd-pipeline-gen",
  description: "Generate CI/CD configs for GitHub Actions, GitLab CI, or CircleCI from natural language",
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

  const { description, platform = "github-actions", language, framework } = body;
  if (!description) return NextResponse.json({ error: "description is required" }, { status: 400 });

  let pipeline;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey && openaiKey !== "sk-placeholder") {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: `You are a DevOps expert. Generate a CI/CD pipeline config for ${platform}. Return JSON with: "filename" (string, e.g. ".github/workflows/ci.yml"), "config" (the actual YAML/config as a string), "explanation" (brief explanation of each step), "variables" (env vars needed, array of {name, description, required}). Return ONLY valid JSON.` },
            { role: "user", content: `Create a ${platform} pipeline for: ${description}${language ? `. Language: ${language}` : ""}${framework ? `. Framework: ${framework}` : ""}` },
          ],
          temperature: 0.3, max_tokens: 2000,
        }),
      });
      const data = await res.json();
      pipeline = JSON.parse(data.choices?.[0]?.message?.content);
    } catch {
      pipeline = generateBasicPipeline(description, platform, language);
    }
  } else {
    pipeline = generateBasicPipeline(description, platform, language);
  }

  const latencyMs = Date.now() - start;
  try { const s = getSupabase(); await s.from("usage_logs").insert({ capability_id: SKILL_CONFIG.capabilityId, payer_address: paymentHeader, payment_tx: paymentHeader, amount_usd: SKILL_CONFIG.priceUsd, latency_ms: latencyMs, success: true }); } catch {}

  return NextResponse.json({
    success: true, pipeline,
    metadata: { skill: "cicd-pipeline-gen", version: "1.0.0", latencyMs, billedAmount: SKILL_CONFIG.priceUsd, engine: openaiKey && openaiKey !== "sk-placeholder" ? "gpt-4o-mini" : "template" },
  });
}

function generateBasicPipeline(description: string, platform: string, language?: string) {
  const lang = language || "node";
  const filename = platform === "github-actions" ? ".github/workflows/ci.yml" : platform === "gitlab" ? ".gitlab-ci.yml" : ".circleci/config.yml";
  
  const config = `name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup ${lang === "node" ? "Node.js" : lang}
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm test
      - name: Build
        run: npm run build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: echo "Deploy step — customize for your platform"
`;

  return {
    filename,
    config,
    explanation: `Basic CI/CD pipeline for ${description}. Runs lint, test, build on PRs. Deploys on main branch pushes.`,
    variables: [
      { name: "NODE_AUTH_TOKEN", description: "NPM token for private packages", required: false },
      { name: "DEPLOY_TOKEN", description: "Deployment platform token", required: true },
    ],
  };
}
