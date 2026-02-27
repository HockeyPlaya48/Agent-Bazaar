import { NextResponse } from "next/server";
import { CAPABILITIES } from "@/lib/data";

// POST /api/agent-shop — AI agent that recommends capabilities based on a task description
export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ success: false, error: "Provide a query" }, { status: 400 });
    }

    const q = query.toLowerCase();

    // Smart keyword matching (would be LLM-powered in production)
    const scored = CAPABILITIES.map((cap) => {
      let score = 0;
      const fields = [cap.name, cap.description, cap.longDescription, ...cap.tags, cap.category].join(" ").toLowerCase();

      // Keyword relevance
      const words = q.split(/\s+/);
      for (const word of words) {
        if (word.length < 3) continue;
        if (fields.includes(word)) score += 10;
        // Partial match
        if (cap.tags.some(t => t.includes(word))) score += 5;
      }

      // Category matching
      if (q.includes("code") || q.includes("bug") || q.includes("review") || q.includes("develop")) {
        if (cap.category === "code-generation") score += 15;
      }
      if (q.includes("image") || q.includes("picture") || q.includes("design") || q.includes("visual")) {
        if (cap.category === "image-generation") score += 15;
      }
      if (q.includes("scrape") || q.includes("extract") || q.includes("crawl") || q.includes("web data")) {
        if (cap.category === "web-scraping") score += 15;
      }
      if (q.includes("seo") || q.includes("search engine") || q.includes("rank")) {
        if (cap.category === "content-writing" && cap.tags.includes("seo")) score += 15;
      }
      if (q.includes("write") || q.includes("blog") || q.includes("content") || q.includes("article")) {
        if (cap.category === "content-writing") score += 15;
      }
      if (q.includes("data") || q.includes("csv") || q.includes("analyz") || q.includes("chart")) {
        if (cap.category === "data-analysis") score += 15;
      }
      if (q.includes("trade") || q.includes("crypto") || q.includes("price") || q.includes("bitcoin")) {
        if (cap.category === "trading") score += 15;
      }
      if (q.includes("research") || q.includes("paper") || q.includes("summar")) {
        if (cap.category === "research") score += 15;
      }
      if (q.includes("deploy") || q.includes("automate") || q.includes("email")) {
        if (cap.category === "automation") score += 15;
      }

      // Boost by quality signals
      score += cap.rating * 2;
      score += Math.log10(cap.usageCount + 1) * 2;

      // Boost promoted listings slightly (they paid for visibility)
      if (cap.listingTier === "spotlight") score += 3;
      if (cap.listingTier === "featured") score += 1;

      return { capability: cap, score };
    })
    .filter(s => s.score > 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

    const recommendations = scored.map((s, i) => ({
      rank: i + 1,
      capability: {
        id: s.capability.id,
        name: s.capability.name,
        slug: s.capability.slug,
        type: s.capability.type,
        description: s.capability.description,
        pricePerCall: s.capability.pricePerCall,
        rating: s.capability.rating,
        usageCount: s.capability.usageCount,
        x402Endpoint: s.capability.x402Endpoint,
      },
      relevanceScore: s.score,
      reasoning: generateReasoning(s.capability, q),
    }));

    return NextResponse.json({
      success: true,
      query,
      recommendations,
      totalMatches: scored.length,
      suggestion: recommendations.length > 0
        ? `Based on your request, I recommend "${recommendations[0].capability.name}" — ${recommendations[0].reasoning}`
        : "No matching capabilities found. Try a different description.",
      timestamp: Date.now(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

function generateReasoning(cap: typeof CAPABILITIES[0], query: string): string {
  const reasons: Record<string, string> = {
    "gpt4-code-review": "Best-in-class code review with security analysis. High rating and massive usage.",
    "dalle-image-gen": "Industry-leading image generation. Agents can generate images autonomously via x402.",
    "web-scraper-api": "Handles JS-rendered pages and anti-bot measures. Most used scraper on the platform.",
    "seo-analyzer": "Comprehensive SEO audits with actionable recommendations. Great for content optimization.",
    "sql-query-gen": "Converts natural language to production SQL. Supports all major databases.",
    "git-audit-cli": "Essential for security-conscious teams. Scans entire git history for leaked secrets.",
    "csv-intelligence": "Upload data, ask questions, get charts. No code required.",
    "blog-post-writer": "SEO-optimized content at scale. Used by content agencies and solo creators.",
    "crypto-price-oracle": "Real-time and historical prices with 50+ technical indicators. Built for trading agents.",
    "research-summarizer": "Distills papers and reports into structured key findings with citations.",
    "deploy-cli": "Zero-config deploys to any cloud. One command, any framework.",
    "email-composer-skill": "Context-aware email drafting. Drop into any agent as a composable skill.",
  };
  return reasons[cap.slug] || `Highly rated (${cap.rating}★) with ${cap.usageCount.toLocaleString()} uses. Fits your needs.`;
}
