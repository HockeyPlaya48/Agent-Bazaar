import express from "express";

const app = express();
app.use(express.json());

const PAY_TO = process.env.X402_PAY_TO || "0xAa41DE518042eB5801081fA6580cFb7326162fe8";
const PRICE_USD = 0.02;
const CAPABILITY_ID = "keyword-extractor";

// Common English stop words to filter out
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

// x402 middleware
function x402Middleware(req, res, next) {
  const payment = req.headers["x-402-payment"] || req.headers["x-payment-token"];

  if (!payment) {
    return res.status(402).json({
      status: 402,
      error: "Payment Required",
      x402: {
        version: 1,
        price: PRICE_USD,
        currency: "USD",
        paymentMethods: [{
          type: "x402-usdc-base",
          network: "base",
          address: PAY_TO,
          amount: PRICE_USD,
        }],
        description: "Extract keywords, key phrases, and topics from any text. Returns ranked keywords with relevance scores.",
        endpoint: `/api/${CAPABILITY_ID}`,
        capabilityId: CAPABILITY_ID,
      },
      howToPay: {
        step1: `Send $${PRICE_USD} USDC to ${PAY_TO} on Base`,
        step2: "Include the transaction hash in the X-402-Payment header",
        step3: "Resend your request",
      },
    });
  }

  // Accept demo/test/stripe/paid tokens
  const isAllowed = payment === "demo" || payment === "test" || payment === "paid" || payment.startsWith("stripe_") || payment.startsWith("0x");
  if (!isAllowed) {
    return res.status(402).json({ error: "Invalid payment token" });
  }

  req.paymentMode = payment === "demo" || payment === "test" ? "demo" : "paid";
  next();
}

// Keyword extraction logic
function extractKeywords(text, options = {}) {
  const maxKeywords = options.maxKeywords || 15;
  const includeScores = options.includeScores !== false;
  const minWordLength = options.minWordLength || 3;

  // Tokenize and clean
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= minWordLength && !STOP_WORDS.has(w));

  // Word frequency
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

  // Score by frequency * position bonus (earlier = more important)
  const totalWords = words.length || 1;
  const scored = Object.entries(freq).map(([word, count]) => {
    const firstPos = words.indexOf(word);
    const positionBonus = 1 + (1 - firstPos / totalWords) * 0.5;
    const lengthBonus = Math.min(word.length / 10, 1);
    const score = (count / totalWords) * positionBonus * (1 + lengthBonus);
    return { keyword: word, count, score: Math.round(score * 1000) / 1000 };
  });

  // Sort by score, take top N
  scored.sort((a, b) => b.score - a.score);
  const keywords = scored.slice(0, maxKeywords);

  // Extract bigrams (2-word phrases)
  const bigrams = {};
  for (let i = 0; i < words.length - 1; i++) {
    const bg = `${words[i]} ${words[i + 1]}`;
    bigrams[bg] = (bigrams[bg] || 0) + 1;
  }
  const keyPhrases = Object.entries(bigrams)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase, count]) => ({ phrase, count }));

  // Categorize top keywords into topics
  const topics = keywords.slice(0, 5).map(k => k.keyword);

  return {
    keywords: includeScores ? keywords : keywords.map(k => k.keyword),
    keyPhrases,
    topics,
    stats: {
      totalWords: text.split(/\s+/).length,
      uniqueKeywords: Object.keys(freq).length,
      extracted: keywords.length,
    },
  };
}

// POST /api/keyword-extractor — Extract keywords from text
app.post("/api/keyword-extractor", x402Middleware, (req, res) => {
  const start = Date.now();

  try {
    const { text, maxKeywords, includeScores, minWordLength } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text field is required (string)" });
    }

    if (text.length > 50000) {
      return res.status(400).json({ error: "Text too long. Maximum 50,000 characters." });
    }

    const result = extractKeywords(text, { maxKeywords, includeScores, minWordLength });
    const latencyMs = Date.now() - start;

    res.json({
      success: true,
      ...result,
      meta: {
        skill: CAPABILITY_ID,
        version: "1.0.0",
        latencyMs,
        priceUsd: req.paymentMode === "demo" ? 0 : PRICE_USD,
        paymentMode: req.paymentMode,
        chainable: true,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Extraction failed", details: error.message });
  }
});

// GET /api/keyword-extractor — Discovery schema
app.get("/api/keyword-extractor", (req, res) => {
  res.json({
    name: "Keyword Extractor",
    version: "1.0.0",
    description: "Extract keywords, key phrases, and topics from any text. Returns ranked keywords with relevance scores.",
    pricing: { amount: PRICE_USD, currency: "USD", model: "per-call", protocol: "x402" },
    discoverable: true,
    chainable: true,
    schema: {
      input: {
        text: "string (required) — text to extract keywords from (max 50K chars)",
        maxKeywords: "integer (optional, default 15) — max keywords to return",
        includeScores: "boolean (optional, default true) — include relevance scores",
        minWordLength: "integer (optional, default 3) — minimum word length",
      },
      output: {
        keywords: "array of { keyword, count, score }",
        keyPhrases: "array of { phrase, count }",
        topics: "array of top keywords as topic labels",
        stats: "{ totalWords, uniqueKeywords, extracted }",
      },
    },
  });
});

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", skill: CAPABILITY_ID }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Keyword Extractor running on port ${PORT}`));
