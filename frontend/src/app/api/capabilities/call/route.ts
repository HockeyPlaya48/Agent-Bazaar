import { NextResponse } from "next/server";
import { CAPABILITIES } from "@/lib/data";

// Transaction log (in-memory for now — would be Supabase/Redis in prod)
const txLog: Array<{
  id: string;
  capabilityId: string;
  input: unknown;
  output: unknown;
  latencyMs: number;
  success: boolean;
  cost: number;
  timestamp: number;
}> = [];

// POST /api/capabilities/call — actually call a capability
export async function POST(request: Request) {
  const start = Date.now();
  
  try {
    const body = await request.json();
    const { capabilityId, input, paymentMethod } = body;

    if (!capabilityId || !input) {
      return NextResponse.json({ success: false, error: "Missing capabilityId or input" }, { status: 400 });
    }

    const capability = CAPABILITIES.find((c) => c.id === capabilityId || c.slug === capabilityId);
    if (!capability) {
      return NextResponse.json({ success: false, error: "Capability not found" }, { status: 404 });
    }

    // Quality gate: check if capability is "healthy"
    // In production, this checks circuit breaker state
    const healthScore = capability.rating >= 4.0 ? "healthy" : capability.rating >= 3.0 ? "degraded" : "unhealthy";
    if (healthScore === "unhealthy") {
      return NextResponse.json({ 
        success: false, 
        error: "This capability has been temporarily disabled due to quality issues.",
        healthScore,
      }, { status: 503 });
    }

    // Execute the capability (real implementations for our live ones)
    let result: unknown;

    switch (capability.slug) {
      case "web-scraper-api": {
        // Real web scraper using fetch
        const url = input.url || input;
        if (!url || typeof url !== "string") {
          return NextResponse.json({ success: false, error: "Provide a URL to scrape" }, { status: 400 });
        }
        try {
          const res = await fetch(url, { 
            headers: { "User-Agent": "AgentBazaar-Scraper/1.0" },
            signal: AbortSignal.timeout(10000),
          });
          const html = await res.text();
          // Extract title, meta description, headings, links
          const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
          const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
          const h1s = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '')).slice(0, 5);
          const links = [...html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map(m => m[1]).slice(0, 20);
          
          result = {
            url,
            title: titleMatch?.[1] || null,
            description: descMatch?.[1] || null,
            headings: h1s,
            externalLinks: [...new Set(links)].slice(0, 10),
            contentLength: html.length,
            statusCode: res.status,
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Scrape failed";
          return NextResponse.json({ success: false, error: `Scrape failed: ${msg}` }, { status: 500 });
        }
        break;
      }

      case "research-summarizer": {
        // Simple summarizer — extracts key sentences
        const text = input.text || input;
        if (!text || typeof text !== "string") {
          return NextResponse.json({ success: false, error: "Provide text to summarize" }, { status: 400 });
        }
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const topSentences = sentences.slice(0, 5).map(s => s.trim() + ".");
        result = {
          summary: topSentences.join(" "),
          sentenceCount: sentences.length,
          keyPoints: topSentences,
          wordCount: text.split(/\s+/).length,
        };
        break;
      }

      case "seo-analyzer": {
        // Real SEO audit
        const url = input.url || input;
        if (!url || typeof url !== "string") {
          return NextResponse.json({ success: false, error: "Provide a URL to audit" }, { status: 400 });
        }
        try {
          const res = await fetch(url, { 
            headers: { "User-Agent": "AgentBazaar-SEO/1.0" },
            signal: AbortSignal.timeout(10000),
          });
          const html = await res.text();
          const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || "";
          const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] || "";
          const h1s = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, ''));
          const h2s = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '')).slice(0, 10);
          const imgsMissingAlt = [...html.matchAll(/<img(?![^>]*alt=)[^>]*>/gi)].length;
          const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);
          const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
          
          const issues: string[] = [];
          const score = (() => {
            let s = 100;
            if (!title) { issues.push("Missing <title> tag"); s -= 20; }
            else if (title.length > 60) { issues.push(`Title too long (${title.length} chars, max 60)`); s -= 5; }
            if (!metaDesc) { issues.push("Missing meta description"); s -= 15; }
            else if (metaDesc.length > 160) { issues.push(`Meta description too long (${metaDesc.length} chars)`); s -= 5; }
            if (h1s.length === 0) { issues.push("No H1 tag found"); s -= 15; }
            if (h1s.length > 1) { issues.push(`Multiple H1 tags (${h1s.length})`); s -= 5; }
            if (imgsMissingAlt > 0) { issues.push(`${imgsMissingAlt} images missing alt text`); s -= Math.min(15, imgsMissingAlt * 3); }
            if (!hasCanonical) { issues.push("Missing canonical link"); s -= 5; }
            if (!hasViewport) { issues.push("Missing viewport meta"); s -= 10; }
            return Math.max(0, s);
          })();

          result = {
            url, score, issues,
            title: { text: title, length: title.length, optimal: title.length <= 60 },
            metaDescription: { text: metaDesc, length: metaDesc.length, optimal: metaDesc.length <= 160 },
            headings: { h1: h1s, h2: h2s.slice(0, 5) },
            technical: { hasCanonical, hasViewport, contentLength: html.length },
            imagesMissingAlt: imgsMissingAlt,
          };
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Audit failed";
          return NextResponse.json({ success: false, error: `SEO audit failed: ${msg}` }, { status: 500 });
        }
        break;
      }

      case "crypto-price-oracle": {
        // Real crypto prices from CoinGecko free API
        const symbol = (input.symbol || input || "bitcoin").toLowerCase();
        try {
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`, {
            signal: AbortSignal.timeout(5000),
          });
          const data = await res.json();
          const coin = data[symbol];
          if (!coin) {
            return NextResponse.json({ success: false, error: `Coin "${symbol}" not found` }, { status: 404 });
          }
          result = {
            symbol,
            price: coin.usd,
            change24h: coin.usd_24h_change,
            marketCap: coin.usd_market_cap,
            volume24h: coin.usd_24h_vol,
            timestamp: Date.now(),
          };
        } catch {
          return NextResponse.json({ success: false, error: "Price feed unavailable" }, { status: 503 });
        }
        break;
      }

      default: {
        // For capabilities without a real backend yet, return a structured mock
        result = {
          message: `Capability "${capability.name}" executed successfully (demo mode)`,
          input,
          note: "This capability is in demo mode. Real execution coming soon.",
          capability: { name: capability.name, type: capability.type, pricePerCall: capability.pricePerCall },
        };
      }
    }

    const latencyMs = Date.now() - start;
    const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Log transaction (data moat)
    txLog.push({
      id: txId,
      capabilityId: capability.id,
      input,
      output: result,
      latencyMs,
      success: true,
      cost: capability.pricePerCall,
      timestamp: Date.now(),
    });

    // Return x402-style response
    return NextResponse.json({
      success: true,
      transactionId: txId,
      capability: { id: capability.id, name: capability.name, slug: capability.slug },
      result,
      meta: {
        latencyMs,
        cost: capability.pricePerCall,
        paymentMethod: paymentMethod || "demo",
        healthScore,
      },
      timestamp: Date.now(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// GET /api/capabilities/call — return transaction stats (data moat)
export async function GET() {
  return NextResponse.json({
    success: true,
    stats: {
      totalTransactions: txLog.length,
      avgLatencyMs: txLog.length > 0 ? Math.round(txLog.reduce((s, t) => s + t.latencyMs, 0) / txLog.length) : 0,
      successRate: txLog.length > 0 ? (txLog.filter(t => t.success).length / txLog.length * 100).toFixed(1) + "%" : "N/A",
      totalRevenue: txLog.reduce((s, t) => s + t.cost, 0).toFixed(4),
    },
    recentTransactions: txLog.slice(-10).reverse(),
  });
}
