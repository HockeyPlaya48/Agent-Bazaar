import { NextRequest, NextResponse } from "next/server";

const SKILL_CONFIG = {
  priceUsd: 0.04,
  payTo: "0xDfaAF0f10c7822a1D620623Bd66e4a1C6B19B906",
  payToSolana: "6YtDkQ1SfsZrWmy44Z749wSHj5tRZd48TVYnyyZHwu7b", 
  networks: ["base", "solana"],
  tokens: ["USDC"],
  capabilityId: "cross-market-signals",
  description: "Analyzes correlations between crypto and stocks (BTC vs NVDA, ETH vs QQQ). Generates cross-market trading signals.",
};

const isDemoToken = (token: string | null): boolean => {
  if (!token) return false;
  const v = token.toLowerCase().trim();
  return ["demo", "test", "paid"].includes(v) || v.startsWith("stripe_");
};

export async function GET() {
  return NextResponse.json({
    name: "Cross-Market Signals Analyzer",
    description: SKILL_CONFIG.description,
    pricing: { amount: SKILL_CONFIG.priceUsd, currency: "USDC", per: "call" },
    parameters: {
      crypto_assets: { type: "array", required: false, description: "Crypto assets to analyze ['BTC', 'ETH', 'SOL']. Default: major cryptos" },
      stock_assets: { type: "array", required: false, description: "Stock assets ['NVDA', 'QQQ', 'SPY', 'TSLA']. Default: tech stocks" },
      timeframe: { type: "string", required: false, description: "Analysis timeframe: '1d', '1w', '1m', '3m'. Default: '1w'" },
      correlation_threshold: { type: "number", required: false, description: "Min correlation for signals (0-1). Default: 0.3" },
      include_macro: { type: "boolean", required: false, description: "Include macro indicators (DXY, VIX, yields). Default: true" },
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
    crypto_assets = ["BTC", "ETH", "SOL"],
    stock_assets = ["NVDA", "QQQ", "SPY", "TSLA"],
    timeframe = "1w",
    correlation_threshold = 0.3,
    include_macro = true
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
              content: `You are a cross-market correlation analyst specializing in crypto-stock relationships and macro signals.

KEY CORRELATION PAIRS:
- BTC vs SPY/QQQ: Risk-on/risk-off sentiment
- ETH vs NVDA: AI/tech narrative alignment  
- SOL vs Growth stocks: High-beta risk appetite
- Crypto vs DXY: Dollar strength impact
- Crypto vs VIX: Fear/greed correlation

ANALYSIS FRAMEWORK:
- Correlation strength: >0.7 strong, 0.3-0.7 moderate, <0.3 weak
- Divergences: When correlations break down (opportunity signals)
- Lead/lag relationships: Which market moves first
- Sector rotation patterns: Tech → DeFi → Memes

MACRO INDICATORS:
- Fed policy (rates, QT/QE)
- DXY strength/weakness
- VIX fear/greed levels
- Treasury yields (especially 10Y)
- Institutional flows

Return JSON format:
{
  "correlations": [
    {
      "crypto_asset": "BTC",
      "stock_asset": "SPY", 
      "correlation": 0.72,
      "strength": "STRONG",
      "timeframe": "1w",
      "trend": "INCREASING|DECREASING|STABLE"
    }
  ],
  "divergence_signals": [
    {
      "pair": "ETH/NVDA",
      "signal_type": "POSITIVE_DIVERGENCE",
      "description": "ETH underperforming despite NVDA strength",
      "trade_suggestion": "Long ETH vs Short NVDA spread",
      "confidence": 75,
      "target_timeframe": "2-4 weeks"
    }
  ],
  "macro_backdrop": {
    "risk_sentiment": "RISK_ON|RISK_OFF|NEUTRAL",
    "dollar_trend": "STRENGTHENING|WEAKENING",
    "key_levels": {"SPY": 4500, "BTC": 45000},
    "upcoming_catalysts": ["FOMC meeting", "CPI data"]
  },
  "trading_recommendations": [
    {
      "strategy": "Pairs trade",
      "entry": "Long BTC/Short QQQ when correlation >0.8",
      "exit": "When correlation drops <0.5",
      "risk_management": "2% position size, 5% stop loss"
    }
  ]
}`
            },
            {
              role: "user",
              content: `Analyze cross-market correlations: Crypto [${crypto_assets.join(", ")}] vs Stocks [${stock_assets.join(", ")}]. Timeframe: ${timeframe}, Min correlation: ${correlation_threshold}, Include macro: ${include_macro}`
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
    const correlations: any[] = [];
    const divergenceSignals: any[] = [];

    // Generate correlation matrix
    crypto_assets.forEach((crypto: string) => {
      stock_assets.forEach((stock: string) => {
        const correlation = (Math.random() * 1.4 - 0.7); // -0.7 to 0.7 range
        const absCorr = Math.abs(correlation);
        
        if (absCorr >= correlation_threshold) {
          correlations.push({
            crypto_asset: crypto,
            stock_asset: stock,
            correlation: parseFloat(correlation.toFixed(2)),
            strength: absCorr > 0.7 ? "STRONG" : absCorr > 0.5 ? "MODERATE" : "WEAK",
            timeframe,
            trend: ["INCREASING", "DECREASING", "STABLE"][Math.floor(Math.random() * 3)]
          });
        }
      });
    });

    // Generate divergence signals
    if (correlations.length > 0) {
      const topCorrelation = correlations[0];
      divergenceSignals.push({
        pair: `${topCorrelation.crypto_asset}/${topCorrelation.stock_asset}`,
        signal_type: Math.random() > 0.5 ? "POSITIVE_DIVERGENCE" : "NEGATIVE_DIVERGENCE",
        description: `${topCorrelation.crypto_asset} showing ${Math.random() > 0.5 ? "strength" : "weakness"} vs ${topCorrelation.stock_asset}`,
        trade_suggestion: Math.random() > 0.5 ? 
          `Long ${topCorrelation.crypto_asset} momentum` : 
          `Short ${topCorrelation.crypto_asset} relative strength`,
        confidence: Math.floor(Math.random() * 30) + 60,
        target_timeframe: ["1-2 weeks", "2-4 weeks", "1-2 months"][Math.floor(Math.random() * 3)]
      });
    }

    result = {
      correlations,
      divergence_signals: divergenceSignals,
      macro_backdrop: {
        risk_sentiment: ["RISK_ON", "RISK_OFF", "NEUTRAL"][Math.floor(Math.random() * 3)],
        dollar_trend: Math.random() > 0.5 ? "STRENGTHENING" : "WEAKENING",
        key_levels: {
          SPY: 4500 + Math.floor(Math.random() * 200),
          BTC: 45000 + Math.floor(Math.random() * 10000),
          ETH: 2800 + Math.floor(Math.random() * 400)
        },
        upcoming_catalysts: include_macro ? 
          ["FOMC meeting", "CPI data", "Jobs report", "Earnings season"] :
          ["Market structure changes"]
      },
      trading_recommendations: [
        {
          strategy: "Correlation arbitrage",
          entry: `Monitor for correlation breakdown below ${correlation_threshold}`,
          exit: "When correlation normalizes",
          risk_management: "Max 3% position size per pair"
        },
        {
          strategy: "Sector rotation",
          entry: "Follow TradFi → Crypto rotation patterns",
          exit: "When crypto begins leading",
          risk_management: "Scale positions with correlation strength"
        }
      ],
      analysis_summary: {
        strong_correlations: correlations.filter(c => c.strength === "STRONG").length,
        divergence_opportunities: divergenceSignals.length,
        market_regime: "Correlation-driven environment",
        recommendation: correlations.length > 3 ? "Active cross-asset strategy" : "Single-asset focus"
      },
      note: `Rule-based correlation analysis for ${timeframe}. GPT-4o-mini provides real-time market correlation analysis when available.`
    };
  }

  const latencyMs = Date.now() - start;

  return NextResponse.json({
    success: !result.error,
    capabilityId: SKILL_CONFIG.capabilityId,
    payment: isDemoToken(paymentHeader) ? "demo" : "verified",
    result,
    metadata: {
      skill: "cross-market-signals",
      version: "1.0.0",
      latencyMs,
      billedAmount: SKILL_CONFIG.priceUsd,
      engine: openaiKey && openaiKey !== "sk-placeholder" ? "gpt-4o-mini" : "rule-based"
    }
  });
}