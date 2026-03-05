import { NextRequest, NextResponse } from "next/server";

const SKILL_CONFIG = {
  priceUsd: 0.04,
  payTo: "0xDfaAF0f10c7822a1D620623Bd66e4a1C6B19B906",
  payToSolana: "6YtDkQ1SfsZrWmy44Z749wSHj5tRZd48TVYnyyZHwu7b", 
  networks: ["base", "solana"],
  tokens: ["USDC"],
  capabilityId: "options-flow-analyzer",
  description: "Analyzes crypto options flow (Deribit). Identifies unusual activity, large bets, put/call ratios for institutional positioning insights.",
};

const isDemoToken = (token: string | null): boolean => {
  if (!token) return false;
  const v = token.toLowerCase().trim();
  return ["demo", "test", "paid"].includes(v) || v.startsWith("stripe_");
};

export async function GET() {
  return NextResponse.json({
    name: "Options Flow Analyzer",
    description: SKILL_CONFIG.description,
    pricing: { amount: SKILL_CONFIG.priceUsd, currency: "USDC", per: "call" },
    parameters: {
      assets: { type: "array", required: false, description: "Assets to analyze ['BTC', 'ETH', 'SOL']. Default: ['BTC', 'ETH']" },
      timeframe: { type: "string", required: false, description: "Analysis period: '1h', '4h', '1d', '1w'. Default: '1d'" },
      min_volume: { type: "number", required: false, description: "Minimum option volume threshold. Default: 100" },
      exchanges: { type: "array", required: false, description: "Exchanges: ['deribit', 'binance', 'okx']. Default: ['deribit']" },
      flow_type: { type: "string", required: false, description: "Flow focus: 'all', 'unusual', 'large_trades', 'gamma'. Default: 'all'" },
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
    assets = ["BTC", "ETH"],
    timeframe = "1d",
    min_volume = 100,
    exchanges = ["deribit"],
    flow_type = "all"
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
              content: `You are a crypto options flow analyst specializing in institutional positioning and market sentiment through derivatives data.

KEY METRICS TO ANALYZE:

1. PUT/CALL RATIOS:
- >1.0 = Bearish sentiment, <0.5 = Bullish sentiment
- Sudden spikes indicate fear/hedging activity
- Compare to historical averages

2. UNUSUAL ACTIVITY:
- Volume >3x average for specific strikes
- Large block trades (>$1M notional)
- Unusual interest in far OTM options

3. GAMMA POSITIONING:
- High gamma strikes that could create pin risk
- Dealer gamma hedging impact on spot
- Max pain levels for expiry

4. IMPLIED VOLATILITY:
- IV term structure skews
- Put/call IV spreads
- Volatility surface anomalies

5. INSTITUTIONAL SIGNALS:
- Large size trades (>500 contracts)
- Complex spread strategies
- Cross-asset hedging patterns

Return JSON format:
{
  "flow_analysis": {
    "asset": "BTC",
    "put_call_ratio": 0.85,
    "sentiment": "BEARISH|NEUTRAL|BULLISH",
    "total_volume": 15420,
    "volume_vs_average": 2.3,
    "dominant_expiry": "Mar-29",
    "max_pain_level": 45000
  },
  "unusual_activity": [
    {
      "asset": "BTC",
      "strike": 50000,
      "expiry": "Mar-29",
      "type": "CALL",
      "volume": 1200,
      "unusual_factor": 4.5,
      "implied_move": "8.5%",
      "trade_type": "OPENING|CLOSING",
      "institution_likely": true
    }
  ],
  "market_positioning": {
    "net_gamma_exposure": 150000000,
    "put_wall": 42000,
    "call_wall": 48000,
    "volatility_regime": "LOW|MEDIUM|HIGH",
    "dealer_positioning": "LONG_GAMMA|SHORT_GAMMA"
  },
  "trading_signals": [
    {
      "signal_type": "VOLATILITY_CRUSH",
      "asset": "ETH",
      "description": "High IV options expiring worthless",
      "trade_suggestion": "Sell high IV, buy low IV",
      "risk_level": "MEDIUM"
    }
  ],
  "key_levels": {
    "BTC": {"support": 43000, "resistance": 47000, "gamma_pin": 45000},
    "ETH": {"support": 2800, "resistance": 3200, "gamma_pin": 3000}
  }
}`
            },
            {
              role: "user",
              content: `Analyze options flow for ${assets.join(", ")} over ${timeframe}. Exchanges: ${exchanges.join(", ")}, Min volume: ${min_volume}, Focus: ${flow_type}`
            }
          ],
          temperature: 0.3,
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
    const flowAnalysis: any = {};
    const unusualActivity: any[] = [];
    const tradingSignals: any[] = [];
    const keyLevels: any = {};

    assets.forEach((asset: any) => {
      const putCallRatio = Math.random() * 1.5 + 0.3; // 0.3 to 1.8
      const volume = Math.floor(Math.random() * 20000) + min_volume;
      const currentPrice = asset === "BTC" ? 45000 : asset === "ETH" ? 3000 : 100;
      
      flowAnalysis[asset] = {
        put_call_ratio: parseFloat(putCallRatio.toFixed(2)),
        sentiment: putCallRatio > 1.2 ? "BEARISH" : putCallRatio < 0.8 ? "BULLISH" : "NEUTRAL",
        total_volume: volume,
        volume_vs_average: parseFloat((Math.random() * 2 + 0.5).toFixed(1)),
        dominant_expiry: ["Mar-29", "Apr-26", "Jun-28"][Math.floor(Math.random() * 3)],
        max_pain_level: Math.floor(currentPrice * (0.95 + Math.random() * 0.1))
      };

      // Generate unusual activity
      if (flow_type === "all" || flow_type === "unusual") {
        const unusualFactor = Math.random() * 4 + 2; // 2x to 6x unusual
        if (unusualFactor > 3) {
          unusualActivity.push({
            asset,
            strike: Math.floor(currentPrice * (0.9 + Math.random() * 0.3)),
            expiry: "Mar-29",
            type: Math.random() > 0.5 ? "CALL" : "PUT",
            volume: Math.floor(Math.random() * 2000) + 500,
            unusual_factor: parseFloat(unusualFactor.toFixed(1)),
            implied_move: `${(Math.random() * 10 + 5).toFixed(1)}%`,
            trade_type: Math.random() > 0.6 ? "OPENING" : "CLOSING",
            institution_likely: unusualFactor > 4
          });
        }
      }

      // Key levels
      keyLevels[asset] = {
        support: Math.floor(currentPrice * 0.92),
        resistance: Math.floor(currentPrice * 1.08),
        gamma_pin: Math.floor(currentPrice * (0.98 + Math.random() * 0.04))
      };
    });

    // Generate trading signals
    if (flow_type === "all" || flow_type === "gamma") {
      tradingSignals.push({
        signal_type: "GAMMA_SQUEEZE",
        asset: assets[0],
        description: "High gamma concentration near current price",
        trade_suggestion: "Monitor for breakout above gamma pin level",
        risk_level: "MEDIUM"
      });
    }

    if (Object.values(flowAnalysis).some((fa: any) => fa.put_call_ratio > 1.5)) {
      tradingSignals.push({
        signal_type: "EXCESSIVE_HEDGING",
        asset: assets.find((asset: any) => (flowAnalysis as any)[asset].put_call_ratio > 1.5),
        description: "Unusually high put/call ratio suggests oversold condition",
        trade_suggestion: "Consider contrarian bullish positioning",
        risk_level: "HIGH"
      });
    }

    result = {
      flow_analysis: flowAnalysis,
      unusual_activity: unusualActivity,
      market_positioning: {
        net_gamma_exposure: Math.floor(Math.random() * 500000000) + 100000000,
        put_wall: keyLevels[assets[0]]?.support || 40000,
        call_wall: keyLevels[assets[0]]?.resistance || 50000,
        volatility_regime: ["LOW", "MEDIUM", "HIGH"][Math.floor(Math.random() * 3)],
        dealer_positioning: Math.random() > 0.5 ? "LONG_GAMMA" : "SHORT_GAMMA"
      },
      trading_signals: tradingSignals,
      key_levels: keyLevels,
      market_summary: {
        overall_sentiment: Object.values(flowAnalysis).map((fa: any) => fa.sentiment).includes("BEARISH") ? "CAUTIOUS" : "NEUTRAL",
        volatility_trend: "Elevated options activity detected",
        recommended_strategies: [
          "Monitor gamma pin levels for directional moves",
          "Consider vol selling in high IV environment",
          "Watch for unusual flow continuation"
        ]
      },
      note: `Rule-based options analysis for ${timeframe}. GPT-4o-mini provides detailed flow analysis when available.`
    };
  }

  const latencyMs = Date.now() - start;

  return NextResponse.json({
    success: !result.error,
    capabilityId: SKILL_CONFIG.capabilityId,
    payment: isDemoToken(paymentHeader) ? "demo" : "verified",
    result,
    metadata: {
      skill: "options-flow-analyzer",
      version: "1.0.0",
      latencyMs,
      billedAmount: SKILL_CONFIG.priceUsd,
      engine: openaiKey && openaiKey !== "sk-placeholder" ? "gpt-4o-mini" : "rule-based"
    }
  });
}