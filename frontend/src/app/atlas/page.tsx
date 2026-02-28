"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Search, Zap, Send, DollarSign, Clock, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CapabilityCard } from "@/components/capability-card";
import { CAPABILITIES } from "@/lib/data";
import { FadeInUp, FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";

// Workflow template cards
const WORKFLOW_TEMPLATES = [
  {
    id: "content-pipeline",
    name: "Content Pipeline",
    description: "Research → Write → Optimize → Visual assets",
    icon: "✍️",
    estimatedCost: "$0.35",
    estimatedTime: "58s",
    skills: ["research-summarizer", "blog-post-writer", "seo-analyzer", "dalle-image-gen"],
    query: "build a content pipeline for blogs and articles"
  },
  {
    id: "code-quality",
    name: "Code Quality",
    description: "Review → Audit → Optimize → Deploy",
    icon: "🔍",
    estimatedCost: "$0.10",
    estimatedTime: "70s",
    skills: ["gpt4-code-review", "git-audit-cli", "sql-query-gen", "deploy-cli"],
    query: "set up code quality and deployment pipeline"
  },
  {
    id: "data-pipeline",
    name: "Data Analysis",
    description: "Scrape → Process → Analyze → Report",
    icon: "📊",
    estimatedCost: "$0.22",
    estimatedTime: "47s",
    skills: ["web-scraper-api", "csv-intelligence", "research-summarizer"],
    query: "create data analysis and reporting workflow"
  },
  {
    id: "trading-pipeline",
    name: "Trading Bot",
    description: "Price data → Analysis → Signals → Execute",
    icon: "📈",
    estimatedCost: "$0.03",
    estimatedTime: "27s",
    skills: ["crypto-price-oracle", "csv-intelligence", "research-summarizer", "bankr-cli"],
    query: "build automated crypto trading system"
  }
];

export default function AtlasPage() {
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  async function handleSearch(e?: React.FormEvent, templateQuery?: string) {
    if (e) e.preventDefault();
    const searchQuery = templateQuery || query;
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/agent-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: searchQuery,
          budget: budget ? parseFloat(budget) : null
        }),
      });
      const data = await res.json();
      setResults(data);
      if (templateQuery) {
        setQuery(templateQuery);
      }
    } catch {
      // Fallback: show popular skills
      const fallback = CAPABILITIES.slice(0, 4).map((c) => ({
        id: c.id, name: c.name, slug: c.slug, description: c.description,
        type: c.type, category: c.category, pricePerCall: c.pricePerCall,
        x402Endpoint: c.x402Endpoint, icon: c.icon, rating: c.rating,
        usageCount: c.usageCount, creatorName: c.creatorName,
      }));
      setResults({
        success: true,
        recommendations: fallback.map(cap => ({ capability: cap, relevanceScore: 80, reasoning: "Popular choice" })),
        suggestion: "Here are our most popular skills to get you started:",
        confidence: 50
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Hero */}
      <div className="relative text-center">
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center -top-32">
          <div className="h-[400px] w-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.06),transparent_70%)]" />
        </div>

        <FadeInUp>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
            <Bot size={32} />
          </div>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <Badge variant="deal" className="mb-4">
            ⚡ First marketplace where agents shop for you
          </Badge>
          <h1 className="text-4xl font-bold sm:text-5xl">
            AI Workflow Shopping
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
            Describe your goal. Our AI discovers skills, chains them into workflows, shows cost breakdowns, and generates deployment-ready code.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.2}>
          <form onSubmit={handleSearch} className="mx-auto mt-8 space-y-4">
            <div className="flex max-w-2xl gap-3">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., I need to build a content pipeline that generates and optimizes blog posts..."
                className="flex-1 rounded-full"
              />
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Budget"
                className="w-28 rounded-full"
                step="0.01"
                min="0"
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="rounded-full"
              >
                <Search size={16} />
                Shop
              </Button>
            </div>
            
            {/* Budget Slider */}
            {budget && (
              <div className="flex items-center gap-3 max-w-md mx-auto">
                <DollarSign size={16} className="text-zinc-500" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none slider"
                />
                <span className="text-sm text-zinc-400 w-20">${budget || "0.00"}</span>
              </div>
            )}
          </form>
        </FadeInUp>
      </div>

      {/* Workflow Templates */}
      {!results && (
        <section className="mt-16">
          <FadeInUp>
            <h2 className="text-2xl font-bold text-center mb-2">Pre-built Workflows</h2>
            <p className="text-zinc-400 text-center mb-8">Click a template to see how skills chain together</p>
          </FadeInUp>
          
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_TEMPLATES.map((template) => (
              <StaggerItem key={template.id}>
                <button 
                  className="w-full text-left"
                  onClick={() => handleSearch(undefined, template.query)}
                >
                  <Card className="p-5 cursor-pointer transition-all hover:border-orange-500/30 hover:bg-zinc-800/50">
                    <div className="text-center">
                      <div className="text-3xl mb-3">{template.icon}</div>
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-zinc-400 mb-3">{template.description}</p>
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <DollarSign size={12} />
                          {template.estimatedCost}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {template.estimatedTime}
                        </div>
                      </div>
                      <div className="flex items-center justify-center mt-2">
                        <Badge className="text-xs">{template.skills.length} skills</Badge>
                      </div>
                    </div>
                  </Card>
                </button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      )}

      {/* Results */}
      {results && (
        <FadeIn>
          <div className="mt-12 space-y-6">
            {/* AI Analysis */}
            {results.suggestion && (
              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <Bot size={20} className="mt-0.5 shrink-0 text-orange-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-orange-400">AI Analysis</h3>
                      {results.confidence && (
                        <Badge variant={results.confidence > 80 ? "success" : "default"} className="text-xs">
                          {results.confidence}% confidence
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-300">{results.suggestion}</p>
                    {results.estimatedCostPerUse && (
                      <p className="text-xs text-zinc-400 mt-2">
                        Total cost per run: <span className="text-orange-400 font-medium">{results.estimatedCostPerUse}</span>
                        {results.budgetUtilization && (
                          <span className="ml-2">({results.budgetUtilization} of budget)</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Workflow Visualization */}
            {results.workflow && (
              <Card className="p-6 bg-gradient-to-br from-zinc-800/30 to-zinc-900/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-orange-500/10 rounded-xl">
                    <Zap size={20} className="text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{results.workflow.name}</h3>
                    <p className="text-zinc-400">{results.workflow.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-400">{results.workflow.estimatedCostPerRun}</p>
                    <p className="text-sm text-zinc-500">{results.workflow.estimatedTime}</p>
                  </div>
                </div>

                {/* Workflow Steps */}
                <div className="relative">
                  {results.workflow.steps?.map((step: any, i: number) => (
                    <div key={step.order} className="flex gap-4 mb-6 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-orange-500/20 border-2 border-orange-500 rounded-full flex items-center justify-center font-bold text-orange-400">
                          {step.order}
                        </div>
                        {i < results.workflow.steps.length - 1 && (
                          <div className="w-0.5 h-12 bg-zinc-700 mt-2"></div>
                        )}
                      </div>
                      <Card className="flex-1 p-4 bg-zinc-800/50">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{step.skill_data?.icon || "🔧"}</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{step.skill_data?.name || step.skill}</h4>
                            <p className="text-sm text-zinc-300">{step.action}</p>
                          </div>
                          <div className="text-right">
                            <Badge>${step.skill_data?.pricePerCall || "0.00"}</Badge>
                            <p className="text-xs text-zinc-500 mt-1">{step.estimatedTime}</p>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-500">→ {step.output}</p>
                      </Card>
                    </div>
                  ))}
                </div>

                {/* Use Cases & Deploy */}
                <div className="mt-6 pt-6 border-t border-zinc-700">
                  {results.workflow.useCases?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-white mb-2">Perfect for:</p>
                      <div className="flex flex-wrap gap-2">
                        {results.workflow.useCases.map((useCase: string) => (
                          <Badge key={useCase} variant="category" className="text-xs">
                            {useCase}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => {
                        const steps = results.workflow?.steps || [];
                        const code = steps.map((s: any) => {
                          const cap = CAPABILITIES.find((c: any) => c.slug === s.skill);
                          return `// Step ${s.order}: ${s.action}\nconst step${s.order} = await fetch("${cap?.x402Endpoint || s.skill}", {\n  method: "POST",\n  headers: { "Content-Type": "application/json", "X-402-Payment": paymentToken },\n  body: JSON.stringify({ input: ${s.order > 1 ? `step${s.order - 1}Result` : '"your input"'} })\n});\nconst step${s.order}Result = await step${s.order}.json();`;
                        }).join('\n\n');
                        navigator.clipboard.writeText(code);
                        alert('✅ Workflow code copied to clipboard!\n\nPaste into your agent to deploy. Each call pays automatically via x402.');
                      }}
                    >
                      Deploy This Workflow — Copy Code
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const steps = results.workflow?.steps || [];
                        const endpoints = steps.map((s: any) => {
                          const cap = CAPABILITIES.find((c: any) => c.slug === s.skill);
                          return `Step ${s.order}: ${s.action}\n  Endpoint: ${cap?.x402Endpoint || s.skill}\n  Cost: ${s.cost || 'N/A'}`;
                        }).join('\n\n');
                        navigator.clipboard.writeText(endpoints);
                        alert('✅ Endpoint list copied!');
                      }}
                    >
                      Copy Endpoints
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Individual Skills */}
            {results.recommendations?.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {results.workflow ? "Skills in this Workflow:" : "Recommended Skills:"}
                </h3>
                <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.recommendations.map((rec: any) => {
                    const cap = CAPABILITIES.find(c => c.slug === rec.capability.slug) || rec.capability;
                    return (
                      <StaggerItem key={cap.id}>
                        <Link href={`/agents/${cap.slug}`}>
                          <Card className="p-5 transition-all hover:border-orange-500/30">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{cap.icon}</span>
                              <div className="flex-1">
                                <h4 className="font-semibold">{cap.name}</h4>
                                <p className="text-xs text-zinc-500 mt-1">
                                  ${cap.pricePerCall}/call · {cap.rating} ★
                                </p>
                                <p className="text-sm text-zinc-400 mt-2">{cap.description}</p>
                                <div className="mt-3 flex items-center justify-between">
                                  <Badge>{cap.type}</Badge>
                                  {rec.relevanceScore && (
                                    <Badge variant="success" className="text-xs">
                                      {rec.relevanceScore}% match
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              </div>
            )}

            {/* Alternatives */}
            {results.alternatives?.length > 0 && (
              <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                  <Target size={16} />
                  Alternative Options:
                </h4>
                <ul className="text-sm text-zinc-300 space-y-1">
                  {results.alternatives.map((alt: string, i: number) => (
                    <li key={i}>• {alt}</li>
                  ))}
                </ul>
              </Card>
            )}

            {results.recommendations?.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-zinc-500">
                  No matching skills found within your criteria. Try adjusting your budget or search terms.
                </p>
              </Card>
            )}
          </div>
        </FadeIn>
      )}

      {/* How it works */}
      {!results && (
        <FadeInUp delay={0.4}>
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { icon: <Search size={24} />, title: "Describe Your Goal", desc: "Tell us what you're building and set an optional budget" },
              { icon: <Bot size={24} />, title: "AI Builds Workflows", desc: "Our AI chains skills together and shows cost/time estimates" },
              { icon: <Zap size={24} />, title: "Deploy & Integrate", desc: "Get working code and x402 endpoints ready to use" },
            ].map((step) => (
              <Card key={step.title} className="p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-orange-400">
                  {step.icon}
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{step.desc}</p>
              </Card>
            ))}
          </div>
        </FadeInUp>
      )}
    </div>
  );
}