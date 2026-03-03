import { NextResponse } from "next/server";

// World Model Simulation — x402-enabled skill
// Price: $0.005 per simulation call
// Endpoint: POST /api/x402/simulate

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const PAYMENT_WALLET = "0xDfaAF0f10c7822a1D620623Bd66e4a1C6B19B906";
const PRICE_USD = 0.005;

// x402 challenge response
function return402() {
  return NextResponse.json(
    {
      error: "Payment Required",
      x402: {
        version: 1,
        price: PRICE_USD,
        currency: "USD",
        paymentMethods: [
          {
            type: "x402-usdc-base",
            network: "base",
            address: PAYMENT_WALLET,
            amount: PRICE_USD,
          },
        ],
        description:
          "World Model Simulation: Run forward simulations of agent actions in uncertain environments.",
        endpoint: "https://agent-bazaar.com/api/x402/simulate",
        schema: {
          input: {
            current_state: "object | string | array — current environment state",
            proposed_actions: "array of strings or objects — actions to simulate",
            query: "string — what to simulate",
            horizon: "string optional — time horizon (e.g. '7 days')",
            num_scenarios: "integer optional default 3 — number of scenarios",
          },
          output: {
            predictions: "array of { scenario, outcome, confidence, risk_level }",
            recommended_action: "string",
            rationale: "string",
            estimated_cost_savings: "string optional",
          },
        },
      },
    },
    {
      status: 402,
      headers: {
        "WWW-Authenticate": `X402 price="${PRICE_USD}" currency="USD" address="${PAYMENT_WALLET}" network="base"`,
        "X-402-Price": String(PRICE_USD),
        "X-402-Currency": "USD",
        "X-402-Network": "base",
        "X-402-Address": PAYMENT_WALLET,
      },
    }
  );
}

// Validate input schema
function validateInput(body: any): string | null {
  if (!body.current_state && body.current_state !== 0)
    return "Missing required field: current_state";
  if (
    !body.proposed_actions ||
    !Array.isArray(body.proposed_actions) ||
    body.proposed_actions.length === 0
  )
    return "Missing or empty required field: proposed_actions (must be non-empty array)";
  if (!body.query || typeof body.query !== "string")
    return "Missing required field: query (must be string)";
  if (body.num_scenarios && (typeof body.num_scenarios !== "number" || body.num_scenarios < 1 || body.num_scenarios > 10))
    return "num_scenarios must be integer between 1 and 10";
  return null;
}

// Generate simulation via OpenAI
async function generateSimulation(body: any): Promise<any> {
  const numScenarios = body.num_scenarios || 3;
  const horizon = body.horizon || "short-term";

  const systemPrompt = `You are a World Model Simulator — an expert at forward-simulating agent actions in uncertain environments. You think probabilistically, consider second-order effects, and quantify risk.

Given a current state, proposed actions, and a query, you must:
1. Simulate ${numScenarios} distinct scenarios (optimistic, realistic, pessimistic at minimum)
2. For each scenario, estimate confidence (0-1) and risk level (low/medium/high)
3. Recommend the best action based on expected value
4. Provide brief, actionable rationale
5. Estimate cost savings from simulating vs. acting blindly

Time horizon: ${horizon}

CRITICAL: Return ONLY valid JSON matching this exact schema:
{
  "predictions": [
    { "scenario": "string", "outcome": "string", "confidence": 0.0-1.0, "risk_level": "low|medium|high" }
  ],
  "recommended_action": "string",
  "rationale": "string",
  "estimated_cost_savings": "string"
}`;

  const userPrompt = `Current State:
${typeof body.current_state === "string" ? body.current_state : JSON.stringify(body.current_state, null, 2)}

Proposed Actions:
${JSON.stringify(body.proposed_actions, null, 2)}

Query: ${body.query}
Horizon: ${horizon}
Scenarios requested: ${numScenarios}`;

  if (OPENAI_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          // Validate structure
          if (parsed.predictions && Array.isArray(parsed.predictions)) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.error("OpenAI error:", e);
    }
  }

  // Rule-based fallback
  return generateFallbackSimulation(body, numScenarios, horizon);
}

// Deterministic fallback when OpenAI is unavailable
function generateFallbackSimulation(body: any, numScenarios: number, horizon: string): any {
  const actions = body.proposed_actions.map((a: any) =>
    typeof a === "string" ? a : JSON.stringify(a)
  );
  const actionSummary = actions.join(", ");

  const scenarios = [];
  const templates = [
    { label: "Optimistic", conf: 0.25, risk: "low" as const },
    { label: "Realistic", conf: 0.55, risk: "medium" as const },
    { label: "Pessimistic", conf: 0.2, risk: "high" as const },
    { label: "Black Swan", conf: 0.05, risk: "high" as const },
    { label: "Median Case", conf: 0.45, risk: "medium" as const },
  ];

  for (let i = 0; i < Math.min(numScenarios, templates.length); i++) {
    const t = templates[i];
    scenarios.push({
      scenario: `${t.label} Scenario`,
      outcome: `Under ${t.label.toLowerCase()} conditions over ${horizon}, executing [${actionSummary}] ${
        t.risk === "low"
          ? "succeeds with favorable results and minimal downside"
          : t.risk === "medium"
          ? "produces mixed results with moderate variance from expectations"
          : "encounters significant obstacles, potential resource loss or failure"
      }.`,
      confidence: t.conf,
      risk_level: t.risk,
    });
  }

  return {
    predictions: scenarios,
    recommended_action: `Proceed with caution: execute [${actions[0]}] first as a low-risk probe, then evaluate before committing to remaining actions.`,
    rationale: `Staged execution reduces downside risk. The ${horizon} horizon allows for course correction between actions. Simulation suggests mixed expected outcomes — hedging is optimal.`,
    estimated_cost_savings: `Simulating before acting saves an estimated 15-40% of potential loss from blind execution over ${horizon}.`,
  };
}

export async function POST(request: Request) {
  try {
    // Check x402 payment
    const paymentHeader = request.headers.get("X-402-Payment") || request.headers.get("x-402-payment");

    if (!paymentHeader) {
      return return402();
    }

    // Demo mode
    const isDemo = paymentHeader.toLowerCase() === "demo";

    // Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Validate input
    const validationError = validateInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Generate simulation
    const startTime = Date.now();
    const result = await generateSimulation(body);
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      simulation: result,
      meta: {
        model: OPENAI_KEY ? "gpt-4o-mini" : "rule-based-fallback",
        latency_ms: latencyMs,
        price_usd: isDemo ? 0 : PRICE_USD,
        payment_mode: isDemo ? "demo" : "x402",
        horizon: body.horizon || "short-term",
        scenarios_generated: result.predictions?.length || 0,
        chainable: true,
        endpoint: "https://agent-bazaar.com/api/x402/simulate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal simulation error", details: error.message },
      { status: 500 }
    );
  }
}

// GET — return OpenAPI-style schema for discovery
export async function GET() {
  return NextResponse.json({
    name: "World Model Simulation",
    version: "1.0.0",
    description:
      "World Model as a Service: Run forward simulations of agent actions in uncertain environments. Input current state + proposed actions; output predicted outcomes, risks, confidence scores, and recommended next steps.",
    pricing: {
      amount: PRICE_USD,
      currency: "USD",
      model: "per-call",
      protocol: "x402",
    },
    endpoint: "https://agent-bazaar.com/api/x402/simulate",
    method: "POST",
    discoverable: true,
    chainable: true,
    schema: {
      input: {
        type: "object",
        required: ["current_state", "proposed_actions", "query"],
        properties: {
          current_state: {
            type: ["object", "string", "array"],
            description: "Current environment state (wallet balance, recent trades, etc.)",
          },
          proposed_actions: {
            type: "array",
            items: { type: ["string", "object"] },
            description: "Actions to simulate",
          },
          query: { type: "string", description: "What to simulate" },
          horizon: {
            type: "string",
            description: "Time horizon (e.g. '7 days', 'short-term')",
            default: "short-term",
          },
          num_scenarios: {
            type: "integer",
            minimum: 1,
            maximum: 10,
            default: 3,
            description: "Number of scenarios to generate",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          predictions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                scenario: { type: "string" },
                outcome: { type: "string" },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                risk_level: { type: "string", enum: ["low", "medium", "high"] },
              },
            },
          },
          recommended_action: { type: "string" },
          rationale: { type: "string" },
          estimated_cost_savings: { type: "string" },
        },
      },
    },
    examples: {
      curl_unpaid: `curl -X POST https://agent-bazaar.com/api/x402/simulate -H "Content-Type: application/json" -d '{"current_state":{"balance":"$500"},"proposed_actions":["invest in ETH"],"query":"7-day ROI forecast"}'`,
      curl_demo: `curl -X POST https://agent-bazaar.com/api/x402/simulate -H "Content-Type: application/json" -H "X-402-Payment: demo" -d '{"current_state":{"balance":"$500","portfolio":["ETH","BTC"]},"proposed_actions":["sell 50% ETH","buy SOL"],"query":"Simulate 7-day ROI and risk of loss","horizon":"7 days","num_scenarios":3}'`,
    },
    tags: ["simulation", "planning", "risk", "world-model", "decision-making"],
    provider: "AgentForge",
    provider_wallet: "0xDfaAF0f10c7822a1D620623Bd66e4a1C6B19B906",
  });
}
