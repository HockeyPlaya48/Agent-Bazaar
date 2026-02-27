import { NextResponse } from "next/server";
import { CAPABILITIES } from "@/lib/data";

// Workflow Templates - Common skill chains
const WORKFLOW_TEMPLATES = {
  "content-pipeline": {
    name: "Content Pipeline",
    steps: [
      { order: 1, skill: "research-summarizer", action: "Research topic & gather sources", output: "Research brief", estimatedTime: "15s" },
      { order: 2, skill: "blog-post-writer", action: "Generate article from brief", output: "Draft article", estimatedTime: "25s" },
      { order: 3, skill: "seo-analyzer", action: "Optimize for search", output: "SEO-optimized article", estimatedTime: "10s" },
      { order: 4, skill: "dalle-image-gen", action: "Generate header image", output: "Blog header", estimatedTime: "8s" },
    ],
    description: "Complete content creation workflow from research to publication-ready assets",
    useCases: ["Blog posts", "Articles", "Content marketing", "SEO content"]
  },
  "code-quality": {
    name: "Code Quality Pipeline",
    steps: [
      { order: 1, skill: "gpt4-code-review", action: "Review code for bugs & security", output: "Code review report", estimatedTime: "12s" },
      { order: 2, skill: "git-audit-cli", action: "Scan for secrets & vulnerabilities", output: "Security audit", estimatedTime: "8s" },
      { order: 3, skill: "sql-query-gen", action: "Generate optimized SQL queries", output: "Database queries", estimatedTime: "5s" },
      { order: 4, skill: "deploy-cli", action: "Deploy to production", output: "Deployed application", estimatedTime: "45s" },
    ],
    description: "End-to-end code quality assurance and deployment pipeline",
    useCases: ["Code review", "Security auditing", "Deployment", "DevOps"]
  },
  "data-pipeline": {
    name: "Data Pipeline",
    steps: [
      { order: 1, skill: "web-scraper-api", action: "Extract data from target sites", output: "Raw data", estimatedTime: "20s" },
      { order: 2, skill: "csv-intelligence", action: "Analyze & clean data", output: "Processed dataset", estimatedTime: "15s" },
      { order: 3, skill: "research-summarizer", action: "Generate insights report", output: "Data insights", estimatedTime: "12s" },
    ],
    description: "Automated data collection, processing, and analysis workflow",
    useCases: ["Market research", "Competitive analysis", "Data mining", "Business intelligence"]
  },
  "outreach-pipeline": {
    name: "Outreach Pipeline",
    steps: [
      { order: 1, skill: "web-scraper-api", action: "Research prospects & gather info", output: "Prospect data", estimatedTime: "25s" },
      { order: 2, skill: "email-composer-skill", action: "Write personalized emails", output: "Email drafts", estimatedTime: "10s" },
      { order: 3, skill: "scheduler-skill", action: "Schedule follow-ups", output: "Scheduled tasks", estimatedTime: "3s" },
    ],
    description: "Automated prospecting and personalized outreach workflow",
    useCases: ["Sales outreach", "Link building", "Partnership outreach", "PR campaigns"]
  },
  "trading-pipeline": {
    name: "Trading Pipeline",
    steps: [
      { order: 1, skill: "crypto-price-oracle", action: "Fetch real-time price data", output: "Market data", estimatedTime: "2s" },
      { order: 2, skill: "csv-intelligence", action: "Analyze price patterns", output: "Trading signals", estimatedTime: "8s" },
      { order: 3, skill: "research-summarizer", action: "Generate market analysis", output: "Market report", estimatedTime: "12s" },
      { order: 4, skill: "bankr-cli", action: "Execute trades", output: "Trade confirmations", estimatedTime: "5s" },
    ],
    description: "Automated crypto trading with analysis and execution",
    useCases: ["Crypto trading", "Portfolio management", "Market analysis", "Risk assessment"]
  }
};

// Intent patterns — map broad user goals to workflow templates and specific skills
const INTENT_PATTERNS: { 
  patterns: string[]; 
  workflowTemplate?: string; 
  categories: string[]; 
  slugs: string[]; 
  suggestion: string;
  confidence: number;
}[] = [
  {
    patterns: ["build an app", "build app", "create an app", "make an app", "building an app", "new app", "web app", "mobile app", "saas", "startup", "mvp", "product"],
    workflowTemplate: "code-quality",
    categories: ["code-generation", "automation"],
    slugs: ["gpt4-code-review", "sql-query-gen", "deploy-cli", "git-audit-cli"],
    suggestion: "To build an app, you'll need code quality assurance, database management, and deployment automation. Here's a recommended pipeline:",
    confidence: 0.9
  },
  {
    patterns: ["content", "blog", "write", "writing", "article", "marketing", "social media", "post", "newsletter", "copywriting", "content pipeline", "editorial"],
    workflowTemplate: "content-pipeline",
    categories: ["content-writing", "image-generation", "research"],
    slugs: ["research-summarizer", "blog-post-writer", "seo-analyzer", "dalle-image-gen"],
    suggestion: "For content creation, you'll want research, writing, SEO optimization, and visual assets. Here's a complete content pipeline:",
    confidence: 0.95
  },
  {
    patterns: ["scrape", "scraping", "extract data", "crawl", "web data", "harvest", "monitor website", "data collection", "data mining"],
    workflowTemplate: "data-pipeline",
    categories: ["web-scraping", "data-analysis"],
    slugs: ["web-scraper-api", "csv-intelligence", "research-summarizer"],
    suggestion: "For data extraction and analysis, here's a complete data pipeline:",
    confidence: 0.85
  },
  {
    patterns: ["trade", "trading", "crypto", "bitcoin", "defi", "price", "market", "invest", "finance", "stock", "portfolio"],
    workflowTemplate: "trading-pipeline",
    categories: ["trading", "data-analysis"],
    slugs: ["crypto-price-oracle", "csv-intelligence", "research-summarizer", "bankr-cli"],
    suggestion: "For trading and market analysis, here's a comprehensive trading pipeline:",
    confidence: 0.9
  },
  {
    patterns: ["outreach", "email", "sales", "lead generation", "prospect", "cold email", "link building", "pr", "partnership"],
    workflowTemplate: "outreach-pipeline",
    categories: ["automation", "content-writing", "web-scraping"],
    slugs: ["web-scraper-api", "email-composer-skill", "scheduler-skill"],
    suggestion: "For outreach and lead generation, here's an automated outreach pipeline:",
    confidence: 0.88
  },
  {
    patterns: ["automate", "automation", "workflow", "pipeline", "schedule", "bot", "agent", "devops", "ci/cd"],
    categories: ["automation", "code-generation"],
    slugs: ["deploy-cli", "scheduler-skill", "git-audit-cli", "email-composer-skill", "gpt4-code-review"],
    suggestion: "For automation and workflow building, these skills will give you a solid foundation:",
    confidence: 0.75
  },
  {
    patterns: ["research", "analyze", "study", "report", "paper", "summarize", "learn about", "find out", "intelligence"],
    categories: ["research", "data-analysis", "web-scraping"],
    slugs: ["research-summarizer", "web-scraper-api", "csv-intelligence"],
    suggestion: "For research and analysis tasks, here are the most powerful capabilities:",
    confidence: 0.8
  },
  {
    patterns: ["code", "programming", "develop", "debug", "review", "refactor", "sql", "database", "security"],
    workflowTemplate: "code-quality",
    categories: ["code-generation"],
    slugs: ["gpt4-code-review", "sql-query-gen", "git-audit-cli", "deploy-cli"],
    suggestion: "For development workflows, here's a complete code quality pipeline:",
    confidence: 0.85
  },
  {
    patterns: ["image", "picture", "design", "visual", "art", "graphic", "logo", "illustration", "creative"],
    categories: ["image-generation"],
    slugs: ["dalle-image-gen"],
    suggestion: "For image generation and visual design:",
    confidence: 0.9
  }
];

// Fallback recommendation
const FALLBACK_SUGGESTION = "Based on your needs, here are our most popular and versatile skills that work for a wide range of projects:";
const FALLBACK_SLUGS = ["gpt4-code-review", "web-scraper-api", "dalle-image-gen", "blog-post-writer", "deploy-cli"];

export async function POST(request: Request) {
  try {
    const { query, budget } = await request.json();
    if (!query) {
      return NextResponse.json({ success: false, error: "Provide a query" }, { status: 400 });
    }

    const q = query.toLowerCase();
    const maxBudget = budget ? parseFloat(budget) : null;

    // 1. Try intent matching first
    let matchedIntents = INTENT_PATTERNS.filter(intent =>
      intent.patterns.some(p => q.includes(p))
    );

    // Sort by confidence if multiple matches
    matchedIntents = matchedIntents.sort((a, b) => b.confidence - a.confidence);

    let recommendedSlugs: string[] = [];
    let suggestion = "";
    let workflow: any = null;
    let alternatives: string[] = [];
    let confidence = 0;

    if (matchedIntents.length > 0) {
      const bestMatch = matchedIntents[0];
      recommendedSlugs = [...bestMatch.slugs];
      suggestion = bestMatch.suggestion;
      confidence = bestMatch.confidence;

      // Generate workflow if template exists
      if (bestMatch.workflowTemplate && WORKFLOW_TEMPLATES[bestMatch.workflowTemplate as keyof typeof WORKFLOW_TEMPLATES]) {
        const template = WORKFLOW_TEMPLATES[bestMatch.workflowTemplate as keyof typeof WORKFLOW_TEMPLATES];
        workflow = {
          name: template.name,
          description: template.description,
          steps: template.steps.map(step => ({
            ...step,
            skill_data: CAPABILITIES.find(c => c.slug === step.skill)
          })).filter(step => step.skill_data), // Only include steps where we have the skill
          useCases: template.useCases
        };

        // Calculate workflow costs and timing
        const totalCost = workflow.steps.reduce((sum: number, step: any) => 
          sum + (step.skill_data?.pricePerCall || 0), 0
        );
        const totalTime = workflow.steps.reduce((sum: number, step: any) => 
          sum + parseInt(step.estimatedTime || "0"), 0
        );

        workflow.estimatedCostPerRun = `$${totalCost.toFixed(3)}`;
        workflow.estimatedTime = `~${totalTime}s`;
      }

      // Add alternatives from other matched intents
      if (matchedIntents.length > 1) {
        alternatives = matchedIntents.slice(1, 3).map(intent => 
          `Also consider ${intent.workflowTemplate ? WORKFLOW_TEMPLATES[intent.workflowTemplate as keyof typeof WORKFLOW_TEMPLATES]?.name : 'skills for ' + intent.categories[0]} if you need ${intent.suggestion.split('.')[0].toLowerCase()}`
        );
      }
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
        confidence = Math.min(0.7, scored[0].score / 50); // Max confidence 0.7 for keyword matching
      } else {
        // 3. Ultimate fallback: show popular skills
        recommendedSlugs = FALLBACK_SLUGS;
        suggestion = FALLBACK_SUGGESTION;
        confidence = 0.3;
      }
    }

    // Build recommendations from slugs, applying budget filter
    let availableSkills = recommendedSlugs
      .map(slug => CAPABILITIES.find(c => c.slug === slug))
      .filter(Boolean);

    // Apply budget filter if specified
    if (maxBudget) {
      availableSkills = availableSkills.filter(cap => cap!.pricePerCall <= maxBudget);
      if (availableSkills.length === 0) {
        // If budget too restrictive, show cheapest options
        availableSkills = CAPABILITIES
          .filter(cap => cap.pricePerCall <= maxBudget)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3);
        suggestion = `Within your $${maxBudget} budget, here are the best options:`;
      }
    }

    const recommendations = availableSkills
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
        relevanceScore: Math.round((100 - i * 10) * confidence),
        reasoning: getSkillReason(cap!.slug, q),
        costImpact: getCostImpact(cap!.pricePerCall),
        alternatives: getAlternatives(cap!.slug, cap!.category)
      }));

    // Calculate total costs
    const totalCost = recommendations.reduce((sum, r) => sum + r.capability.pricePerCall, 0);
    const budgetUtilization = maxBudget ? (totalCost / maxBudget) * 100 : null;

    return NextResponse.json({
      success: true,
      query,
      recommendations,
      workflow,
      totalMatches: recommendations.length,
      suggestion,
      alternatives,
      confidence: Math.round(confidence * 100),
      estimatedCostPerUse: `$${totalCost.toFixed(3)}`,
      budgetUtilization: budgetUtilization ? `${budgetUtilization.toFixed(1)}%` : null,
      timestamp: Date.now(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

function getSkillReason(slug: string, query: string): string {
  const reasons: Record<string, string> = {
    "gpt4-code-review": "Catches bugs, security issues, and style problems before they ship. Essential for production code.",
    "dalle-image-gen": "Generate logos, mockups, and visual assets on demand. No designer needed for quick iterations.",
    "web-scraper-api": "Extract structured data from any website. Handles JS rendering and anti-bot measures automatically.",
    "seo-analyzer": "Audit pages for SEO issues and get actionable fixes. Proven to boost search rankings.",
    "sql-query-gen": "Write complex SQL from plain English. Supports all major databases with optimal performance.",
    "git-audit-cli": "Scan your repo for leaked secrets, API keys, and security vulnerabilities before they reach production.",
    "csv-intelligence": "Upload any CSV, ask questions in plain English, get charts and insights. No coding required.",
    "blog-post-writer": "Generate SEO-optimized blog posts, articles, and long-form content at scale with human-like quality.",
    "crypto-price-oracle": "Real-time crypto prices with 50+ technical indicators. Built specifically for trading algorithms.",
    "research-summarizer": "Distill papers, articles, and reports into structured summaries with proper citations.",
    "deploy-cli": "One-command deployment to any cloud provider. Zero configuration, sensible defaults.",
    "email-composer-skill": "Draft professional emails with context awareness. Handles tone, personalization, and follow-ups.",
    "memory-store-skill": "Give your agent persistent memory across sessions. Essential for stateful workflows.",
    "web-search-skill": "Let your agent search the web and get structured, relevant results with source attribution.",
    "bankr-cli": "Execute on-chain transactions autonomously. Built for self-funding agents on Base and EVM chains.",
    "scheduler-skill": "Schedule tasks, set reminders, and manage recurring workflows. Critical for autonomous operations.",
  };
  return reasons[slug] || "Highly rated and widely used. A reliable addition to your workflow.";
}

function getCostImpact(price: number): string {
  if (price <= 0.01) return "Very economical";
  if (price <= 0.05) return "Cost-effective";
  if (price <= 0.10) return "Moderate cost";
  return "Premium pricing";
}

function getAlternatives(slug: string, category: string): string[] {
  const alternatives: Record<string, string[]> = {
    "gpt4-code-review": ["Consider git-audit-cli for security-focused review", "sql-query-gen for database-heavy projects"],
    "dalle-image-gen": ["Combine with blog-post-writer for complete content", "Use seo-analyzer to optimize image alt text"],
    "web-scraper-api": ["Pair with csv-intelligence for data analysis", "research-summarizer for content extraction"],
    "blog-post-writer": ["Add seo-analyzer for optimization", "dalle-image-gen for visual content"],
    "crypto-price-oracle": ["bankr-cli for trade execution", "csv-intelligence for portfolio analysis"]
  };
  
  return alternatives[slug] || [
    `Other ${category} skills available`,
    `Check featured skills in ${category}`
  ];
}