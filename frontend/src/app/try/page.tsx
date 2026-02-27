"use client";

import Link from "next/link";
import { ArrowRight, Code, DollarSign, Zap, CheckCircle2, Globe, ChevronDown, Play, Copy, ExternalLink } from "lucide-react";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function TryPage() {
  const [copiedCode, setCopiedCode] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText('curl -X POST "https://x402.agent-bazaar.com/api/v1/capability/[ID]/call" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"input": "your data here"}\'');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16">
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="h-[600px] w-[900px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08),transparent_70%)]" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <FadeInUp>
            <Badge variant="deal" className="px-4 py-2 text-sm font-medium">
              Developer SDK • Free Trial
            </Badge>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <h1 className="mt-8 text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
              Your AI Just Became
              <br />
              <span className="gradient-text-orange">Omniscient.</span>
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <p className="mx-auto mt-8 max-w-3xl text-xl leading-relaxed text-zinc-300">
              Agent Bazaar lets your API earn money from every AI agent on the internet. 
              List your first capability free.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.3}>
            <div className="mx-auto mt-10 max-w-sm">
              <Link 
                href="/dev"
                className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:scale-105"
              >
                List Your First Skill Free
                <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
              </Link>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.4}>
            <div className="mx-auto mt-12 flex max-w-lg justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">200+</p>
                <p className="text-sm text-zinc-500">skills listed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">4.8M+</p>
                <p className="text-sm text-zinc-500">calls</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">$0</p>
                <p className="text-sm text-zinc-500">to get started</p>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* 3-Step Visual */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <FadeInUp>
            <h2 className="mb-16 text-center text-3xl font-bold text-white">Three Steps to Agent Revenue</h2>
          </FadeInUp>
          
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                step: "01",
                icon: <Code size={32} />,
                title: "Wrap Your API",
                description: "Add one endpoint wrapper. We handle x402 payments, auth, and routing automatically.",
                code: `// Your existing API
app.post('/analyze', handler);

// Wrap with x402
x402.wrap('/analyze', {
  price: 0.05,
  handler: handler
});`
              },
              {
                step: "02",
                icon: <DollarSign size={32} />,
                title: "Set Your Price",
                description: "Choose your rate per call. Agents pay automatically via x402. You keep 95% of revenue.",
                highlight: "$0.05 per call"
              },
              {
                step: "03",
                icon: <Zap size={32} />,
                title: "Agents Pay Automatically",
                description: "AI agents discover and pay for your API autonomously. No subscriptions, no API keys, no human intervention.",
                highlight: "200ms response time"
              }
            ].map((step, i) => (
              <FadeInUp key={step.step} delay={i * 0.1}>
                <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
                  <div className="absolute -top-3 left-8">
                    <span className="rounded-full bg-orange-500 px-3 py-1 text-sm font-bold text-white">
                      {step.step}
                    </span>
                  </div>
                  
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                    {step.icon}
                  </div>
                  
                  <h3 className="mb-4 text-xl font-bold text-white">{step.title}</h3>
                  <p className="mb-6 text-zinc-400 leading-relaxed">{step.description}</p>
                  
                  {step.code && (
                    <div className="rounded-lg bg-zinc-950/80 p-4 font-mono text-sm text-zinc-300 border border-zinc-800">
                      <pre className="whitespace-pre-wrap">{step.code}</pre>
                    </div>
                  )}
                  
                  {step.highlight && (
                    <div className="inline-flex rounded-full bg-green-500/10 px-4 py-2 text-green-400 font-semibold border border-green-500/20">
                      {step.highlight}
                    </div>
                  )}
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <FadeInUp>
            <h2 className="mb-16 text-center text-3xl font-bold text-white">Developers Are Already Earning</h2>
          </FadeInUp>

          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote: "My code review API made $347 in the first week. Agents just... find it and pay. It's wild.",
                author: "Sarah Chen",
                title: "Ex-GitHub, CodeReview API",
                avatar: "SC"
              },
              {
                quote: "I wrapped my image generation model and it's getting hit 200+ times per day. Passive income from AI agents.",
                author: "Marcus Rodriguez",
                title: "ML Engineer, ImageGen Pro",
                avatar: "MR"
              },
              {
                quote: "The x402 integration took 20 minutes. Now my trading signals API serves hundreds of agents autonomously.",
                author: "Alex Kim",
                title: "Quant Dev, TradingSignals",
                avatar: "AK"
              },
              {
                quote: "Best part? No customer support. Agents pay, use the API, and move on. Pure automation.",
                author: "Priya Patel",
                title: "Data Scientist, WebScraper+",
                avatar: "PP"
              },
              {
                quote: "$1,200 last month from my PDF parsing API. I literally forgot it existed until I checked earnings.",
                author: "David Thompson",
                title: "Backend Dev, DocProcessor",
                avatar: "DT"
              },
              {
                quote: "Agent Bazaar turned my side project into a business. 95% profit margin, zero overhead.",
                author: "Lisa Wang",
                title: "Full-stack Dev, QR Code API",
                avatar: "LW"
              }
            ].map((testimonial, i) => (
              <StaggerItem key={testimonial.author}>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 h-full">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-400 font-bold">
                      {testimonial.avatar}
                    </div>
                    <div className="flex-1">
                      <blockquote className="text-zinc-300 mb-4">"{testimonial.quote}"</blockquote>
                      <div>
                        <div className="font-semibold text-white">{testimonial.author}</div>
                        <div className="text-sm text-zinc-500">{testimonial.title}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <FadeInUp>
            <h2 className="mb-16 text-center text-3xl font-bold text-white">Common Questions</h2>
          </FadeInUp>

          <StaggerContainer className="space-y-6">
            {[
              {
                question: "What is x402?",
                answer: "x402 is the payment rail for AI agents. It enables autonomous micropayments between agents and APIs without human intervention. Think Stripe for AI-to-AI transactions."
              },
              {
                question: "How do I get paid?",
                answer: "Revenue is deposited to your wallet daily. We support crypto (ETH, USDC) and traditional bank transfers. You keep 95% of all revenue - we only take 5% to cover payment processing."
              },
              {
                question: "What APIs work with this?",
                answer: "Any REST API can be wrapped with x402. Popular categories include AI/ML models, data processing, file conversion, web scraping, authentication services, and specialized tools."
              },
              {
                question: "Do I need to handle payments myself?",
                answer: "No. x402 handles all payment processing, authentication, and billing. Your API just receives the request and sends a response. We handle everything else."
              },
              {
                question: "How do agents discover my API?",
                answer: "Listed APIs appear in the Agent Bazaar registry. AI agents search this registry autonomously when they need capabilities. Popular skills get discovered and used more frequently."
              },
              {
                question: "Can humans use my API too?",
                answer: "Yes! Both AI agents and human developers can discover and use your API through the same x402 endpoint. You get paid the same rate regardless of who calls it."
              }
            ].map((faq, i) => (
              <StaggerItem key={faq.question}>
                <details className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                  <summary className="flex cursor-pointer items-center justify-between font-semibold text-white">
                    {faq.question}
                    <ChevronDown className="transition-transform group-open:rotate-180" size={20} />
                  </summary>
                  <p className="mt-4 text-zinc-400 leading-relaxed">{faq.answer}</p>
                </details>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <FadeInUp>
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-8 sm:p-12">
              <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-orange-500/5 blur-3xl" />
              
              <div className="relative text-center">
                <h2 className="text-3xl font-bold text-white mb-4">See x402 in Action</h2>
                <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
                  Watch an AI agent discover a capability, pay via x402, and get results — all autonomously in under 200ms.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    href="/demo"
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 font-semibold text-white transition-all hover:bg-white/20 backdrop-blur-sm border border-white/20"
                  >
                    <Play size={18} />
                    Watch Demo
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    <code className="rounded-lg bg-zinc-950/80 px-4 py-2 text-sm text-zinc-300 font-mono border border-zinc-800">
                      curl x402.agent-bazaar.com/api/...
                    </code>
                    <button
                      onClick={copyCode}
                      className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-400 transition hover:text-white hover:bg-zinc-800"
                      title="Copy API example"
                    >
                      {copiedCode ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <FadeInUp>
            <h2 className="text-4xl font-bold text-white mb-6">
              Turn Your API Into an Agent Revenue Stream
            </h2>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
              Join 200+ developers already earning from AI agents. List your first capability free and start earning today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dev"
                className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:scale-105"
              >
                List Your First Skill Free
                <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
              </Link>
              
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-6 py-4 font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              >
                <ExternalLink size={18} />
                View Demo First
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>
    </div>
  );
}