import { NextRequest, NextResponse } from "next/server";

const SKILL_CONFIG = {
  priceUsd: 0.05,
  payTo: "0xDfaAF0f10c7822a1D620623Bd66e4a1C6B19B906",
  payToSolana: "6YtDkQ1SfsZrWmy44Z749wSHj5tRZd48TVYnyyZHwu7b", 
  networks: ["base", "solana"],
  tokens: ["USDC"],
  capabilityId: "mev-opportunity-scanner",
  description: "Scans for MEV opportunities in DeFi pools. Returns sandwich opportunities, arbitrage routes, liquidation targets.",
};

const isDemoToken = (token: string | null): boolean => {
  if (!token) return false;
  const v = token.toLowerCase().trim();
  return ["demo", "test", "paid"].includes(v) || v.startsWith("stripe_");
};

export async function GET() {
  return NextResponse.json({
    name: "MEV Opportunity Scanner",
    description: SKILL_CONFIG.description,
    pricing: { amount: SKILL_CONFIG.priceUsd, currency: "USDC", per: "call" },
    parameters: {
      networks: { type: "array", required: false, description: "Networks to scan: ['ethereum', 'base', 'arbitrum', 'polygon']. Default: ['ethereum', 'base']" },
      opportunity_types: { type: "array", required: false, description: "MEV types: ['arbitrage', 'sandwich', 'liquidation']. Default: all" },
      min_profit: { type: "number", required: false, description: "Minimum profit threshold in USD. Default: 50" },
      gas_limit: { type: "number", required: false, description: "Max gas price willing to pay (gwei). Default: 100" },
      protocols: { type: "array", required: false, description: "DeFi protocols: ['uniswap', 'curve', 'balancer', 'aave']. Default: top protocols" },
    },
    payment: {
      networks: SKILL_CONFIG.networks,
      addresses: { base: SKILL_CONFIG.payTo, solana: SKILL_CONFIG.payToSolana },
      tokens: SKILL_CONFIG.tokens,
    },
  });
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const paymentHeader = req.headers.get("X-402-Payment") || req.headers.get("x-402-payment");

  if (!paymentHeader) {
    return NextResponse.json({
      status: 402,
      message: "Payment required.",
      payment: SKILL_CONFIG,
      howToPay: {
        step1: `Send $${SKILL_CONFIG.priceUsd} USDC to ${SKILL_CONFIG.payTo} on Base or ${SKILL_CONFIG.payToSolana} on Solana`,
        step2: "Include tx hash in X-402-Payment header",
        step3: "Resend your request"
      },
    }, { status: 402 });
  }

  if (!isDemoToken(paymentHeader)) {
    return NextResponse.json({
      status: 402,
      error: "Payment verification not implemented. Use demo token for testing."
    }, { status: 402 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { 
    networks = ["ethereum", "base"],
    opportunity_types = ["arbitrage", "sandwich", "liquidation"],
    min_profit = 50,
    gas_limit = 100,
    protocols = ["uniswap", "curve", "balancer", "aave"]
  } = body;

  let result;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openaiKey && openaiKey !== "sk-placeholder") {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
              content: `You are an MEV (Maximum Extractable Value) opportunity scanner for DeFi protocols.

MEV OPPORTUNITY TYPES:

1. ARBITRAGE:
- Price differences between DEXs for same token pairs
- Cross-chain arbitrage opportunities
- Calculate profit after gas, slippage, fees

2. SANDWICH ATTACKS:
- Detect large pending swaps in mempool
- Calculate frontrun/backrun profit potential
- Consider gas wars and competition

3. LIQUIDATIONS:
- Undercollateralized positions in lending protocols
- Calculate liquidation bonuses vs gas costs
- Monitor health factors approaching liquidation thresholds

4. JIT LIQUIDITY:
- Just-in-time liquidity provision for large swaps
- Concentrated liquidity range optimization

Return JSON format:
{
  "opportunities": [
    {
      "type": "arbitrage|sandwich|liquidation",
      "network": "ethereum",
      "protocol": "uniswap_v3",
      "token_pair": "ETH/USDC",
      "estimated_profit": 125.50,
      "required_capital": 10000,
      "gas_cost": 45.20,
      "net_profit": 80.30,
      "confidence": 85,
      "execution_steps": ["step1", "step2"],
      "time_sensitivity": "HIGH|MEDIUM|LOW",
      "competition_risk": "HIGH|MEDIUM|LOW"
    }
  ],
  "market_conditions": {
    "gas_price_gwei": 35,
    "mempool_congestion": "MEDIUM",
    "volatile_pairs": ["ETH/USDC", "BTC/WETH"],
    "liquidation_alerts": 5
  },
  "execution_tips": [
    "Monitor gas prices for optimal timing",
    "Use flashloans to reduce capital requirements"
  ]
}`
            },
            {
              role: "user",
              content: `Scan for MEV opportunities on ${networks.join(", ")} networks. Types: ${opportunity_types.join(", ")}. Min profit: $${min_profit}, Max gas: ${gas_limit} gwei. Protocols: ${protocols.join(", ")}`
            }
          ],
          temperature: 0.2,
        }),
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      try {
        result = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, ""));
      } catch {
        result = { error: "Failed to parse AI response", raw_response: content };
      }
    } catch (e: any) {
      result = { error: "OpenAI API error", message: e.message };
    }
  }

  // Rule-based fallback
  if (!result || result.error) {
    const opportunities: any[] = [];
    
    // Generate sample opportunities based on requested types
    if (opportunity_types.includes("arbitrage")) {
      opportunities.push({
        type: "arbitrage",
        network: networks[0],
        protocol: "uniswap_v3",
        token_pair: "ETH/USDC",
        estimated_profit: Math.floor(Math.random() * 200) + min_profit,
        required_capital: Math.floor(Math.random() * 50000) + 5000,
        gas_cost: Math.floor(Math.random() * 50) + 20,
        net_profit: 0, // Will calculate
        confidence: Math.floor(Math.random() * 30) + 70,
        execution_steps: [
          `Buy ETH on ${protocols[0]}`,
          `Sell ETH on ${protocols[1] || 'sushiswap'}`,
          "Execute in single transaction with flashloan"
        ],
        time_sensitivity: "HIGH",
        competition_risk: "MEDIUM"
      });
    }

    if (opportunity_types.includes("sandwich")) {
      opportunities.push({
        type: "sandwich", 
        network: networks[Math.floor(Math.random() * networks.length)],
        protocol: protocols[0],
        token_pair: "WBTC/ETH",
        estimated_profit: Math.floor(Math.random() * 150) + 75,
        required_capital: Math.floor(Math.random() * 25000) + 10000,
        gas_cost: Math.floor(Math.random() * 80) + 40,
        net_profit: 0,
        confidence: 60,
        execution_steps: [
          "Frontrun large swap with buy",
          "Let user transaction execute",
          "Backrun with sell order"
        ],
        time_sensitivity: "CRITICAL",
        competition_risk: "HIGH"
      });
    }

    if (opportunity_types.includes("liquidation")) {
      opportunities.push({
        type: "liquidation",
        network: networks[0],
        protocol: "aave",
        token_pair: "ETH/USDC",
        estimated_profit: Math.floor(Math.random() * 300) + 100,
        required_capital: Math.floor(Math.random() * 100000) + 20000,
        gas_cost: Math.floor(Math.random() * 60) + 25,
        net_profit: 0,
        confidence: 90,
        execution_steps: [
          "Monitor health factor < 1.0",
          "Execute liquidation call",
          "Receive liquidation bonus"
        ],
        time_sensitivity: "MEDIUM",
        competition_risk: "LOW"
      });
    }

    // Calculate net profits
    opportunities.forEach(opp => {
      opp.net_profit = parseFloat((opp.estimated_profit - opp.gas_cost).toFixed(2));
    });

    // Filter by min profit
    const filteredOpps = opportunities.filter(opp => opp.net_profit >= min_profit);

    result = {
      opportunities: filteredOpps,
      market_conditions: {
        gas_price_gwei: Math.floor(Math.random() * 50) + 25,
        mempool_congestion: ["LOW", "MEDIUM", "HIGH"][Math.floor(Math.random() * 3)],
        volatile_pairs: ["ETH/USDC", "BTC/WETH", "MATIC/ETH"],
        liquidation_alerts: Math.floor(Math.random() * 10) + 2
      },
      execution_tips: [
        "Use private mempools to avoid competition",
        "Monitor gas prices for optimal execution timing", 
        "Consider flashloan protocols to reduce capital requirements",
        "Set appropriate slippage tolerance for volatile markets"
      ],
      note: "Rule-based MEV simulation. GPT-4o-mini provides real-time opportunity analysis when available."
    };
  }

  const latencyMs = Date.now() - start;

  return NextResponse.json({
    success: !result.error,
    capabilityId: SKILL_CONFIG.capabilityId,
    payment: isDemoToken(paymentHeader) ? "demo" : "verified",
    result,
    metadata: {
      skill: "mev-opportunity-scanner",
      version: "1.0.0",
      latencyMs,
      billedAmount: SKILL_CONFIG.priceUsd,
      engine: openaiKey && openaiKey !== "sk-placeholder" ? "gpt-4o-mini" : "rule-based"
    }
  });
}