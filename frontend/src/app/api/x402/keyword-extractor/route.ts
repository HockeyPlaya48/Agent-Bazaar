import { NextResponse } from "next/server";

const PAY_TO = "0xAa41DE518042eB5801081fA6580cFb7326162fe8";
const PRICE_USD = 0.02;
const CAPABILITY_ID = "keyword-extractor";

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "from","as","is","was","are","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall",
  "can","need","must","it","its","this","that","these","those","i","me","my",
  "we","our","you","your","he","him","his","she","her","they","them","their",
  "what","which","who","whom","when","where","why","how","all","each","every",
  "both","few","more","most","other","some","such","no","not","only","own",
  "same","so","than","too","very","just","about","above","after","again",
  "also","am","any","because","before","between","during","here","into",
  "if","then","there","through","under","up","down","out","off","over","s","t"
]);

function extractKeywords(text: string, options: any = {}) {
  const maxKeywords = options.maxKeywords || 15;
  const minWordLength = options.minWordLength || 3;
  const words = text.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/)
    .filter(w => w.length >= minWordLength && !STOP_WORDS.has(w));
  const freq: Record<string, number> = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const totalWords = words.length || 1;
  const scored = Object.entries(freq).map(([word, count]) => {
    const firstPos = words.indexOf(word);
    const positionBonus = 1 + (1 - firstPos / totalWords) * 0.5;
    const lengthBonus = Math.min(word.length / 10, 1);
    const score = (count / totalWords) * positionBonus * (1 + lengthBonus);
    return { keyword: word, count, score: Math.round(score * 1000) / 1000 };
  });
  scored.sort((a, b) => b.score - a.score);
  const keywords = scored.slice(0, maxKeywords);
  const bigrams: Record<string, number> = {};
  for (let i = 0; i < words.length - 1; i++) {
    const bg = `${words[i]} ${words[i + 1]}`;
    bigrams[bg] = (bigrams[bg] || 0) + 1;
  }
  const keyPhrases = Object.entries(bigrams).filter(([_, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([phrase, count]) => ({ phrase, count }));
  return {
    keywords: options.includeScores === false ? keywords.map(k => k.keyword) : keywords,
    keyPhrases, topics: keywords.slice(0, 5).map(k => k.keyword),
    stats: { totalWords: text.split(/\s+/).length, uniqueKeywords: Object.keys(freq).length, extracted: keywords.length },
  };
}

export async function POST(request: Request) {
  const start = Date.now();
  const payment = request.headers.get("x-402-payment") || request.headers.get("x-payment-token");
  if (!payment) {
    return NextResponse.json({
      status: 402, error: "Payment Required",
      x402: { version: 1, price: PRICE_USD, currency: "USD",
        paymentMethods: [{ type: "x402-usdc-base", network: "base", address: PAY_TO, amount: PRICE_USD }],
        description: "Extract keywords, key phrases, and topics from any text.",
        capabilityId: CAPABILITY_ID },
    }, { status: 402, headers: { "WWW-Authenticate": `X402 price="${PRICE_USD}" currency="USD" address="${PAY_TO}" network="base"` } });
  }
  const isDemoToken = payment === "demo" || payment === "test" || payment === "paid" || payment.startsWith("stripe_");
  if (!isDemoToken && !payment.startsWith("0x")) {
    return NextResponse.json({ error: "Invalid payment token" }, { status: 402 });
  }
  try {
    const body = await request.json();
    const { text, maxKeywords, includeScores, minWordLength } = body;
    if (!text || typeof text !== "string") return NextResponse.json({ error: "text field required" }, { status: 400 });
    if (text.length > 50000) return NextResponse.json({ error: "Text too long (max 50K chars)" }, { status: 400 });
    const result = extractKeywords(text, { maxKeywords, includeScores, minWordLength });

    // Log to reputation system
    try {
      const repUrl = new URL("/api/reputation", request.url);
      fetch(repUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capabilitySlug: CAPABILITY_ID, success: true, latencyMs: Date.now() - start, payerAddress: payment, amountUsd: isDemoToken ? 0 : PRICE_USD }),
      }).catch(() => {});
    } catch {}

    return NextResponse.json({
      success: true, ...result,
      meta: { skill: CAPABILITY_ID, version: "1.0.0", latencyMs: Date.now() - start, priceUsd: isDemoToken ? 0 : PRICE_USD, paymentMode: isDemoToken ? "demo" : "paid", chainable: true },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Extraction failed", details: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Keyword Extractor", version: "1.0.0",
    description: "Extract keywords, key phrases, and topics from any text. Returns ranked keywords with relevance scores.",
    pricing: { amount: PRICE_USD, currency: "USD", model: "per-call", protocol: "x402" },
    discoverable: true, chainable: true, capabilityId: CAPABILITY_ID,
    provider_wallet: PAY_TO,
  });
}
