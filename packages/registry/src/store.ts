import type { CapabilityRecord, UsageEvent, CapabilityStats } from "./schema";

// ── In-memory store (swap to Supabase later) ──

const capabilities: Map<string, CapabilityRecord> = new Map();
const usageEvents: UsageEvent[] = [];
let nextId = 100;

// ── Capabilities CRUD ──

export function listCapabilities(params?: {
  category?: string;
  type?: string;
  search?: string;
}): CapabilityRecord[] {
  let results = Array.from(capabilities.values());
  if (params?.category) results = results.filter((c) => c.category === params.category);
  if (params?.type) results = results.filter((c) => c.type === params.type);
  if (params?.search) {
    const s = params.search.toLowerCase();
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s) ||
        c.tags.some((t) => t.toLowerCase().includes(s))
    );
  }
  return results;
}

export function getCapability(id: string): CapabilityRecord | undefined {
  return capabilities.get(id);
}

export function getCapabilityBySlug(slug: string): CapabilityRecord | undefined {
  return Array.from(capabilities.values()).find((c) => c.slug === slug);
}

export function addCapability(
  data: Omit<CapabilityRecord, "id" | "rating" | "usageCount">
): CapabilityRecord {
  const id = String(nextId++);
  const record: CapabilityRecord = { ...data, id, rating: 0, usageCount: 0 };
  capabilities.set(id, record);
  return record;
}

// ── Usage tracking ──

export function recordUsage(event: UsageEvent): void {
  usageEvents.push(event);
  const cap = capabilities.get(event.capabilityId);
  if (cap) cap.usageCount++;
}

export function getStats(capabilityId: string): CapabilityStats {
  const events = usageEvents.filter((e) => e.capabilityId === capabilityId);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const recent = events.filter((e) => now - e.timestamp < day);
  const successes = events.filter((e) => e.success).length;
  const totalLatency = events.reduce((s, e) => s + e.latencyMs, 0);
  const totalRevenue = events.reduce((s, e) => s + e.amountUsd, 0);

  return {
    capabilityId,
    totalCalls: events.length,
    successRate: events.length ? successes / events.length : 0,
    avgLatencyMs: events.length ? totalLatency / events.length : 0,
    totalRevenueUsd: totalRevenue,
    last24hCalls: recent.length,
  };
}

// ── Seed data ──

export function seed(records: Omit<CapabilityRecord, "id">[]): void {
  let seedId = 1;
  for (const r of records) {
    const id = String(seedId++);
    capabilities.set(id, { ...r, id });
  }
  nextId = Math.max(nextId, seedId);
}

// ── Seed 20 capabilities ──

seed([
  // Code (4)
  { name: "GPT-4 Code Review", slug: "gpt4-code-review", description: "Automated code review — security analysis, bug detection, and style suggestions.", longDescription: "Production-grade code review powered by GPT-4. Catches security vulnerabilities, logic bugs, and style violations in any language.", type: "api", category: "code-generation", pricePerCall: 0.05, x402Endpoint: "https://api.agentbazaar.xyz/x402/code-review", icon: "🔍", rating: 4.9, usageCount: 284000, featured: true, tags: ["code-review", "security", "gpt-4"], creatorName: "DevForge" },
  { name: "Bug Detective", slug: "bug-detective", description: "AI bug detection — finds logic errors, null refs, race conditions in your codebase.", longDescription: "Static + AI analysis hybrid. Scans code for common and subtle bugs across 15+ languages.", type: "api", category: "code-generation", pricePerCall: 0.03, x402Endpoint: "https://api.agentbazaar.xyz/x402/bug-detect", icon: "🐛", rating: 4.7, usageCount: 156000, featured: false, tags: ["bugs", "static-analysis", "debugging"], creatorName: "CodeSentry" },
  { name: "Refactor Engine", slug: "refactor-engine", description: "Automated refactoring suggestions — cleaner code, better patterns, reduced complexity.", longDescription: "Analyzes functions and suggests refactoring opportunities. Supports extract method, simplify conditionals, and design pattern application.", type: "api", category: "code-generation", pricePerCall: 0.04, x402Endpoint: "https://api.agentbazaar.xyz/x402/refactor", icon: "♻️", rating: 4.6, usageCount: 89000, featured: false, tags: ["refactoring", "clean-code", "patterns"], creatorName: "CleanStack" },
  { name: "SQL Genie", slug: "sql-genie", description: "Natural language to SQL — describe what you want, get optimized queries.", longDescription: "Converts plain English to production-ready SQL. Supports PostgreSQL, MySQL, SQLite. Includes query optimization hints.", type: "api", category: "code-generation", pricePerCall: 0.02, x402Endpoint: "https://api.agentbazaar.xyz/x402/sql-gen", icon: "🧞", rating: 4.8, usageCount: 203000, featured: true, tags: ["sql", "database", "natural-language"], creatorName: "QueryCraft" },

  // Content (4)
  { name: "Blog Architect", slug: "blog-architect", description: "AI blog post writer — SEO-optimized, long-form content from a topic or outline.", longDescription: "Generates well-structured blog posts with headers, meta descriptions, and internal linking suggestions. 500-3000 words.", type: "api", category: "content-writing", pricePerCall: 0.10, x402Endpoint: "https://api.agentbazaar.xyz/x402/blog-write", icon: "📝", rating: 4.5, usageCount: 167000, featured: true, tags: ["blog", "seo", "long-form", "writing"], creatorName: "ContentForge" },
  { name: "Email Composer", slug: "email-composer", description: "Professional email drafting — cold outreach, follow-ups, and responses.", longDescription: "Generates contextually appropriate emails. Supports cold outreach, follow-up sequences, customer support replies, and executive communications.", type: "api", category: "content-writing", pricePerCall: 0.02, x402Endpoint: "https://api.agentbazaar.xyz/x402/email-draft", icon: "✉️", rating: 4.6, usageCount: 312000, featured: false, tags: ["email", "outreach", "communication"], creatorName: "MailCraft" },
  { name: "Social Spark", slug: "social-spark", description: "Social media post generator — Twitter, LinkedIn, Instagram captions.", longDescription: "Creates platform-optimized social media content. Handles hashtags, character limits, engagement hooks, and A/B variants.", type: "api", category: "content-writing", pricePerCall: 0.01, x402Endpoint: "https://api.agentbazaar.xyz/x402/social-post", icon: "⚡", rating: 4.4, usageCount: 445000, featured: false, tags: ["social-media", "twitter", "linkedin", "marketing"], creatorName: "ViralKit" },
  { name: "SEO Optimizer", slug: "seo-optimizer", description: "On-page SEO analysis and keyword optimization for any webpage.", longDescription: "Analyzes content for SEO best practices. Provides keyword density, readability score, meta tag suggestions, and competitor gap analysis.", type: "api", category: "content-writing", pricePerCall: 0.05, x402Endpoint: "https://api.agentbazaar.xyz/x402/seo-optimize", icon: "🎯", rating: 4.7, usageCount: 198000, featured: false, tags: ["seo", "keywords", "optimization", "marketing"], creatorName: "RankBoost" },

  // Data (4)
  { name: "Web Harvester", slug: "web-harvester", description: "Intelligent web scraping — extract structured data from any URL.", longDescription: "AI-powered web scraper that handles dynamic pages, pagination, and anti-bot measures. Returns clean JSON/CSV.", type: "api", category: "web-scraping", pricePerCall: 0.01, x402Endpoint: "https://api.agentbazaar.xyz/x402/web-scrape", icon: "🕸️", rating: 4.6, usageCount: 523000, featured: true, tags: ["scraping", "data-extraction", "web"], creatorName: "DataMine" },
  { name: "PDF Parser Pro", slug: "pdf-parser-pro", description: "Extract text, tables, and structured data from PDF documents.", longDescription: "OCR + layout analysis for PDFs. Extracts text preserving structure, tables as JSON, and metadata. Handles scanned documents.", type: "api", category: "data-analysis", pricePerCall: 0.03, x402Endpoint: "https://api.agentbazaar.xyz/x402/pdf-parse", icon: "📄", rating: 4.5, usageCount: 178000, featured: false, tags: ["pdf", "ocr", "document", "extraction"], creatorName: "DocuSense" },
  { name: "CSV Analyst", slug: "csv-analyst", description: "Upload CSV data, ask questions in plain English, get charts and insights.", longDescription: "Natural language data analysis. Upload any CSV and ask questions — get statistical summaries, visualizations, and actionable insights.", type: "api", category: "data-analysis", pricePerCall: 0.02, x402Endpoint: "https://api.agentbazaar.xyz/x402/csv-analyze", icon: "📊", rating: 4.8, usageCount: 134000, featured: false, tags: ["csv", "analytics", "visualization", "data"], creatorName: "InsightLab" },
  { name: "Deep Researcher", slug: "deep-researcher", description: "Multi-source research agent — compiles reports from web, papers, and databases.", longDescription: "Autonomous research agent that searches multiple sources, cross-references findings, and produces structured research reports with citations.", type: "api", category: "research", pricePerCall: 0.50, x402Endpoint: "https://api.agentbazaar.xyz/x402/research", icon: "🔬", rating: 4.9, usageCount: 67000, featured: true, tags: ["research", "papers", "report", "autonomous"], creatorName: "ScholarAI" },

  // Media (4)
  { name: "DALL-E Image Generator", slug: "dalle-image-gen", description: "Generate images from text prompts — agents can create visuals autonomously.", longDescription: "High-quality image generation via DALL-E 3. Supports all aspect ratios, styles, and quality levels.", type: "api", category: "image-generation", pricePerCall: 0.08, x402Endpoint: "https://api.agentbazaar.xyz/x402/image-gen", icon: "🎨", rating: 4.7, usageCount: 512000, featured: true, tags: ["image", "dalle", "generation", "creative"], creatorName: "PixelMint" },
  { name: "Whisper Transcribe", slug: "whisper-transcribe", description: "Audio/video transcription with speaker diarization and timestamps.", longDescription: "Whisper-based transcription service. Supports 50+ languages, speaker identification, and SRT/VTT output formats.", type: "api", category: "media", pricePerCall: 0.05, x402Endpoint: "https://api.agentbazaar.xyz/x402/transcribe", icon: "🎙️", rating: 4.8, usageCount: 245000, featured: false, tags: ["transcription", "audio", "whisper", "speech-to-text"], creatorName: "AudioLens" },
  { name: "Video Summarizer", slug: "video-summarizer", description: "Summarize YouTube or uploaded videos — key points, timestamps, and takeaways.", longDescription: "Analyzes video content and produces structured summaries with key moments, quotes, and action items. Supports URLs and uploads.", type: "api", category: "media", pricePerCall: 0.15, x402Endpoint: "https://api.agentbazaar.xyz/x402/video-summary", icon: "🎬", rating: 4.5, usageCount: 89000, featured: false, tags: ["video", "summary", "youtube", "content"], creatorName: "ClipBrief" },
  { name: "Voice Cloner", slug: "voice-cloner", description: "Text-to-speech with custom voice cloning — 5 seconds of audio to clone.", longDescription: "Generate natural speech in any cloned voice. Provide a 5-second sample, get unlimited TTS. 28 languages supported.", type: "api", category: "media", pricePerCall: 0.03, x402Endpoint: "https://api.agentbazaar.xyz/x402/voice-clone", icon: "🗣️", rating: 4.4, usageCount: 156000, featured: false, tags: ["tts", "voice", "clone", "speech"], creatorName: "VoxForge" },

  // DevOps (4)
  { name: "Deploy Pilot", slug: "deploy-pilot", description: "One-command deploys — Vercel, AWS, Railway from a git repo.", longDescription: "Autonomous deployment agent. Analyzes your repo, picks the right platform, configures build settings, and deploys. Supports rollbacks.", type: "cli", category: "automation", pricePerCall: 0.10, x402Endpoint: "https://api.agentbazaar.xyz/x402/deploy", icon: "🚀", rating: 4.6, usageCount: 78000, featured: false, tags: ["deploy", "vercel", "aws", "ci-cd"], creatorName: "ShipIt" },
  { name: "Uptime Sentinel", slug: "uptime-sentinel", description: "Endpoint monitoring with AI anomaly detection and incident summaries.", longDescription: "Monitors HTTP endpoints, detects anomalies in response times and error rates, and generates plain-English incident reports.", type: "api", category: "automation", pricePerCall: 0.001, x402Endpoint: "https://api.agentbazaar.xyz/x402/monitor", icon: "📡", rating: 4.7, usageCount: 890000, featured: false, tags: ["monitoring", "uptime", "alerting", "devops"], creatorName: "WatchTower" },
  { name: "Log Whisperer", slug: "log-whisperer", description: "AI log analysis — paste logs, get root cause analysis and fix suggestions.", longDescription: "Analyzes application logs to identify errors, patterns, and root causes. Supports structured and unstructured logs from any source.", type: "api", category: "automation", pricePerCall: 0.04, x402Endpoint: "https://api.agentbazaar.xyz/x402/log-analyze", icon: "📋", rating: 4.5, usageCount: 123000, featured: false, tags: ["logs", "debugging", "root-cause", "devops"], creatorName: "LogLens" },
  { name: "Infra Scanner", slug: "infra-scanner", description: "Security scanning for cloud infrastructure — AWS, GCP, Azure misconfigs.", longDescription: "Scans cloud infrastructure configurations for security vulnerabilities, compliance violations, and cost optimization opportunities.", type: "api", category: "automation", pricePerCall: 0.20, x402Endpoint: "https://api.agentbazaar.xyz/x402/infra-scan", icon: "🛡️", rating: 4.8, usageCount: 45000, featured: false, tags: ["security", "cloud", "infrastructure", "compliance"], creatorName: "CloudGuard" },
]);
