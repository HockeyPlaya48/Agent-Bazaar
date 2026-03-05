import { NextRequest, NextResponse } from "next/server";

const SKILL_CONFIG = {
  priceUsd: 0.02,
  payTo: "0xDfaAF0f10c7822a1D620623Bd66e4a1C6B19B906",
  payToSolana: "6YtDkQ1SfsZrWmy44Z749wSHj5tRZd48TVYnyyZHwu7b", 
  networks: ["base", "solana"],
  tokens: ["USDC"],
  capabilityId: "impermanent-loss-calc",
  description: "Calculates impermanent loss for DeFi LP positions. Returns IL percentage, dollar impact, hedging recommendations.",
};

const isDemoToken = (token: string | null): boolean => {
  if (!token) return false;
  const v = token.toLowerCase().trim();
  return ["demo", "test", "paid"].includes(v) || v.startsWith("stripe_");
};

export async function GET() {
  return NextResponse.json({
    name: "Impermanent Loss Calculator",
    description: SKILL_CONFIG.description,
    pricing: { amount: SKILL_CONFIG.priceUsd, currency: "USDC", per: "call" },
    parameters: {
      token_pair: { type: "object", required: true, description: "Token pair: {token_a: 'ETH', token_b: 'USDC'}" },
      entry_prices: { type: "object", required: true, description: "Entry prices: {token_a: 2000, token_b: 1}" },
      current_prices: { type: "object", required: true, description: "Current prices: {token_a: 2500, token_b: 1}" },
      pool_type: { type: "string", required: false, description: "Pool type: 'uniswap_v2', 'uniswap_v3', 'curve'. Default: 'uniswap_v2'" },
      position_size: { type: "number", required: false, description: "Position size in USD. Default: 1000" },
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
    token_pair,
    entry_prices,
    current_prices,
    pool_type = "uniswap_v2",
    position_size = 1000
  } = body;

  if (!token_pair || !entry_prices || !current_prices) {
    return NextResponse.json({ 
      error: "token_pair, entry_prices, and current_prices are required" 
    }, { status: 400 });
  }

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
              content: `You are a DeFi impermanent loss calculator. Calculate impermanent loss for liquidity provider positions.

IMPERMANENT LOSS FORMULA:
- For 50/50 pools (Uniswap V2): IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
- Price ratio = current_price / entry_price
- Account for different pool types and fee earnings

POOL TYPES:
- uniswap_v2: 50/50 constant product, 0.3% fee
- uniswap_v3: Concentrated liquidity, variable fees
- curve: Stableswap with lower IL for similar assets

Return JSON format:
{
  "impermanent_loss": {
    "percentage": -5.2,
    "dollar_amount": -52.0,
    "break_even_price": {"token_a": 2100, "token_b": 1}
  },
  "position_analysis": {
    "initial_value": 1000,
    "current_lp_value": 948,
    "hodl_value": 1125,
    "fees_earned": 15.50,
    "net_performance": "percentage vs holding"
  },
  "hedging_strategies": [
    {
      "strategy": "Delta hedging",
      "description": "Short token with higher volatility",
      "cost": "percentage of position"
    }
  ],
  "recommendations": {
    "action": "HOLD|REBALANCE|EXIT",
    "reasoning": "explanation",
    "optimal_range": "for V3 positions"
  }
}`
            },
            {
              role: "user",
              content: `Calculate IL for ${token_pair.token_a}/${token_pair.token_b} pair.
Entry: ${token_pair.token_a}=$${entry_prices.token_a}, ${token_pair.token_b}=$${entry_prices.token_b}
Current: ${token_pair.token_a}=$${current_prices.token_a}, ${token_pair.token_b}=$${current_prices.token_b}
Pool: ${pool_type}, Position: $${position_size}`
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

  // Rule-based fallback calculation
  if (!result || result.error) {
    const priceRatio = current_prices.token_a / entry_prices.token_a;
    
    // Simplified IL calculation for 50/50 pool
    let ilPercentage;
    if (pool_type === "curve") {
      // Lower IL for stableswap
      ilPercentage = Math.abs(priceRatio - 1) * 0.5;
    } else {
      // Standard AMM IL formula
      ilPercentage = (2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1) * 100;
    }
    
    const ilDollar = (position_size * ilPercentage) / 100;
    const feesEarned = position_size * 0.015; // Estimate 1.5% fees earned
    
    // HODL value calculation
    const hodlValue = position_size * ((1 + priceRatio) / 2);
    const currentLpValue = position_size - Math.abs(ilDollar) + feesEarned;
    
    result = {
      impermanent_loss: {
        percentage: parseFloat(ilPercentage.toFixed(2)),
        dollar_amount: parseFloat(ilDollar.toFixed(2)),
        break_even_price: {
          [token_pair.token_a]: entry_prices.token_a,
          [token_pair.token_b]: entry_prices.token_b
        }
      },
      position_analysis: {
        initial_value: position_size,
        current_lp_value: parseFloat(currentLpValue.toFixed(2)),
        hodl_value: parseFloat(hodlValue.toFixed(2)),
        fees_earned: parseFloat(feesEarned.toFixed(2)),
        net_performance: `${(((currentLpValue - hodlValue) / hodlValue) * 100).toFixed(2)}%`
      },
      hedging_strategies: [
        {
          strategy: "Delta hedging",
          description: `Short ${Math.abs(ilPercentage) > 5 ? token_pair.token_a : "smaller position"} to reduce IL`,
          cost: "1-3% of position size"
        },
        {
          strategy: "Impermanent loss insurance",
          description: "Consider IL protection protocols like Bancor or Thorchain",
          cost: "0.5-2% premium"
        }
      ],
      recommendations: {
        action: Math.abs(ilPercentage) > 10 ? "REBALANCE" : Math.abs(ilPercentage) > 20 ? "EXIT" : "HOLD",
        reasoning: `IL is ${Math.abs(ilPercentage).toFixed(1)}%. ${feesEarned > Math.abs(ilDollar) ? "Fees offset IL" : "IL exceeds fees"}`,
        optimal_range: pool_type === "uniswap_v3" ? "±10% of current price" : "N/A"
      },
      calculation_method: "Rule-based IL formula. GPT-4o-mini provides detailed analysis when available."
    };
  }

  const latencyMs = Date.now() - start;

  return NextResponse.json({
    success: !result.error,
    capabilityId: SKILL_CONFIG.capabilityId,
    payment: isDemoToken(paymentHeader) ? "demo" : "verified",
    result,
    metadata: {
      skill: "impermanent-loss-calc",
      version: "1.0.0",
      latencyMs,
      billedAmount: SKILL_CONFIG.priceUsd,
      engine: openaiKey && openaiKey !== "sk-placeholder" ? "gpt-4o-mini" : "rule-based"
    }
  });
}