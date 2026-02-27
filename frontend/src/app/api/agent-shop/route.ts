import { NextResponse } from "next/server";
import { CAPABILITIES } from "@/lib/data";

// Intent patterns — map broad user goals to relevant skill categories and specific recommendations
const INTENT_PATTERNS: { patterns: string[]; categories: string[]; slugs: string[]; suggestion: string }[] = [
  {
    patterns: ["build an app", "build app", "create an app", "make an app", "building an app", "new app", "web app", "mobile app", "saas", "startup", "mvp", "product"],
    categories: ["code-generation", "automation", "image-generation"],
    slugs: ["gpt4-code-review", "sql-query-gen", "deploy-cli", "dalle-image-gen", "blog-post-writer"],
    suggestion: "To build an app, you'll need code review for quality, SQL generation for your database, deployment automation, and image generation for assets. Here's a recommended stack:",
  },
  {
    patterns: ["content", "blog", "write", "writing", "article", "marketing", "social media", "post", "newsletter", "copywriting"],
    categories: ["content-writing", "image-generation"],
    slugs: ["blog-post-writer", "seo-analyzer", "dalle-image-gen", "email-composer-skill", "research-summarizer"],
    suggestion: "For a content pipeline, you'll want a blog writer, SEO optimization, image generation for visuals, and research capabilities. Here's what I recommend:",
  },
  {
    patterns: ["scrape", "scraping", "extract data", "crawl", "web data", "harvest", "monitor website"],
    categories: ["web-scraping", "data-analysis"],
    slugs: ["web-scraper-api", "csv-intelligence", "research-summarizer"],
    suggestion: "For web scraping and data extraction, here are the best tools on the platform:",
  },
  {
    patterns: ["trade", "trading", "crypto", "bitcoin", "defi", "price", "market", "invest", "finance", "stock"],
    categories: ["trading", "data-analysis", "research"],
    slugs: ["crypto-price-oracle", "csv-intelligence", "research-summarizer", "web-scraper-api"],
    suggestion: "For trading and market analysis, here's a powerful combination of skills:",
  },
  {
    patterns: ["automate", "automation", "workflow", "pipeline", "schedule", "bot", "agent", "deploy", "devops", "ci/cd"],
    categories: ["automation", "code-generation"],
    slugs: ["deploy-cli", "scheduler-skill", "git-audit-cli", "email-composer-skill", "gpt4-code-review"],
    suggestion: "For automation and workflow building, these skills will give you a solid foundation:",
  },
  {
    patterns: ["research", "analyze", "study", "report", "paper", "summarize", "learn about", "find out"],
    categories: ["research", "data-analysis", "web-scraping"],
    slugs: ["research-summarizer", "web-scraper-api", "csv-intelligence"],
    suggestion: "For research and analysis tasks, here are the most powerful capabilities:",
  },
  {
    patterns: ["code", "programming", "develop", "debug", "review", "refactor", "sql", "database", "security"],
    categories: ["code-generation"],
    slugs: ["gpt4-code-review", "sql-query-gen", "git-audit-cli", "deploy-cli"],
    suggestion: "For development and coding workflows, these are the top-rated developer tools:",
  },
  {
    patterns: ["image", "picture", "design", "visual", "art", "graphic", "logo", "illustration", "creative"],
    categories: ["image-generation"],
    slugs: ["dalle-image-gen"],
    suggestion: "For image generation and visual design:",
  },
  {
    patterns: ["email", "outreach", "communication", "send", "notify", "message"],
    categories: ["automation", "content-writing"],
    slugs: ["email-composer-skill", "blog-post-writer", "scheduler-skill"],
    suggestion: "For email and communication automation:",
  },
  {
    patterns: ["seo", "search engine", "rank", "optimize", "traffic", "google"],
    categories: ["content-writing"],
    slugs: ["seo-analyzer", "blog-post-writer", "web-scraper-api"],
    suggestion: "For SEO and search optimization:",
  },
  {
    patterns: ["data", "csv", "analytics", "chart", "spreadsheet", "numbers", "stats", "dashboard"],
    categories: ["data-analysis"],
    slugs: ["csv-intelligence", "research-summarizer", "web-scraper-api"],
    suggestion: "For data analysis and visualization:",
  },
];

// Fallback: broad recommendation for vague queries
const FALLBACK_SUGGESTION = "Based on your needs, here are our most popular and versatile skills that work for a wide range of projects:";
const FALLBACK_SLUGS = ["gpt4-code-review", "web-scraper-api", "dalle-image-gen", "blog-post-writer", "deploy-cli"];

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ success: false, error: "Provide a query" }, { status: 400 });
    }

    const q = query.toLowerCase();

    // 1. Try intent matching first
    let matchedIntents = INTENT_PATTERNS.filter(intent =>
      intent.patterns.some(p => q.includes(p))
    );

    let recommendedSlugs: string[] = [];
    let suggestion = "";

    if (matchedIntents.length > 0) {
      // Combine all matched intents
      const allSlugs = new Set<string>();
      const suggestions: string[] = [];
      for (const intent of matchedIntents) {
        intent.slugs.forEach(s => allSlugs.add(s));
        suggestions.push(intent.suggestion);
      }
      recommendedSlugs = [...allSlugs];
      suggestion = suggestions[0]; // Use the first matched intent's suggestion
    } else {
      // 2. Fall back to keyword scoring
      const scored = CAPABILITIES.map((cap) => {
        let score = 0;
        const fields = [cap.name, cap.description, cap.longDescription, ...cap.tags, cap.category].join(" ").toLowerCase();

        const words = q.split(/\s+/).filter((w: string) => w.length >= 3);
        for (const word of words) {
          if (fields.includes(word)) score += 10;
          if (cap.tags.some(t => t.includes(word))) score += 5;
        }

        score += cap.rating * 2;
        score += Math.log10(cap.usageCount + 1) * 2;
        if (cap.listingTier === "spotlight") score += 3;
        if (cap.listingTier === "featured") score += 1;

        return { slug: cap.slug, score };
      })
      .filter(s => s.score > 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

      if (scored.length > 0) {
        recommendedSlugs = scored.map(s => s.slug);
        suggestion = `Here are the skills that best match "${query}":`;
      } else {
        // 3. Ultimate fallback: show popular skills
        recommendedSlugs = FALLBACK_SLUGS;
        suggestion = FALLBACK_SUGGESTION;
      }
    }

    // Build recommendations from slugs
    const recommendations = recommendedSlugs
      .map(slug => CAPABILITIES.find(c => c.slug === slug))
      .filter(Boolean)
      .slice(0, 5)
      .map((cap, i) => ({
        rank: i + 1,
        capability: {
          id: cap!.id,
          name: cap!.name,
          slug: cap!.slug,
          type: cap!.type,
          category: cap!.category,
          description: cap!.description,
          pricePerCall: cap!.pricePerCall,
          rating: cap!.rating,
          usageCount: cap!.usageCount,
          x402Endpoint: cap!.x402Endpoint,
          icon: cap!.icon,
        },
        relevanceScore: 100 - i * 10,
        reasoning: getSkillReason(cap!.slug, q),
      }));

    // Calculate total cost
    const totalCost = recommendations.reduce((sum, r) => sum + r.capability.pricePerCall, 0);

    return NextResponse.json({
      success: true,
      query,
      recommendations,
      totalMatches: recommendations.length,
      suggestion,
      estimatedCostPerUse: `$${totalCost.toFixed(2)}`,
      timestamp: Date.now(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

function getSkillReason(slug: string, query: string): string {
  const reasons: Record<string, string> = {
    "gpt4-code-review": "Catches bugs, security issues, and style problems before they ship. Essential for any app.",
    "dalle-image-gen": "Generate logos, mockups, and visual assets on demand. No designer needed.",
    "web-scraper-api": "Extract structured data from any website. Handles JS rendering and anti-bot measures.",
    "seo-analyzer": "Audit pages for SEO issues and get actionable fixes. Boost your search rankings.",
    "sql-query-gen": "Write complex SQL from plain English. Supports PostgreSQL, MySQL, SQLite.",
    "git-audit-cli": "Scan your repo for leaked secrets, API keys, and security vulnerabilities.",
    "csv-intelligence": "Upload any CSV, ask questions in plain English, get charts and insights.",
    "blog-post-writer": "Generate SEO-optimized blog posts, articles, and long-form content at scale.",
    "crypto-price-oracle": "Real-time crypto prices with 50+ technical indicators. Built for trading bots.",
    "research-summarizer": "Distill papers, articles, and reports into structured summaries with citations.",
    "deploy-cli": "One-command deployment to Vercel, AWS, or Railway. Zero config required.",
    "email-composer-skill": "Draft professional emails — outreach, follow-ups, and responses. Context-aware.",
    "memory-store-skill": "Give your agent persistent memory. Store and retrieve context across sessions.",
    "web-search-skill": "Let your agent search the web. Returns structured, relevant results.",
    "bankr-cli": "Bankruptcy filing lookups and financial analysis from public records.",
    "scheduler-skill": "Schedule tasks, set reminders, and manage recurring workflows for your agent.",
  };
  return reasons[slug] || "Highly rated and widely used. A great addition to your workflow.";
}
