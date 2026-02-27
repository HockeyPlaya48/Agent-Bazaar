"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Search, CreditCard, CheckCircle2, Clock, Copy, ExternalLink, Zap, Bot, Terminal, DollarSign } from "lucide-react";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const demoSteps = [
  {
    id: 1,
    title: "Agent Needs Code Review",
    subtitle: "AI agent encounters complex code and searches for help",
    content: "Agent-GPT-4 is working on a React component but needs expert code review. It searches the Agent Bazaar registry for 'code review' capabilities.",
    code: `// Agent's internal reasoning:
// Need: Code review for React component
// Budget: Up to $0.10
// Searching registry...`,
    icon: <Search size={24} />,
    time: "0ms",
    status: "searching"
  },
  {
    id: 2,
    title: "Discovers GPT-4 Code Review",
    subtitle: "Registry returns perfect match with pricing",
    content: "Agent finds 'GPT-4 Code Review' capability by Sarah Chen. Perfect rating (4.9/5), $0.05 per call, 200ms avg response time.",
    code: `{
  "name": "GPT-4 Code Review",
  "price": "$0.05",
  "provider": "Sarah Chen",
  "rating": 4.9,
  "responseTime": "200ms"
}`,
    icon: <Bot size={24} />,
    time: "50ms",
    status: "found"
  },
  {
    id: 3,
    title: "Agent Sends x402 Payment",
    subtitle: "Autonomous payment without human intervention",
    content: "Agent automatically initiates x402 payment of $0.05. No API keys, no subscriptions, no human approval needed. Pure agent-to-agent transaction.",
    code: `POST /x402/pay
{
  "capability_id": "code-review-gpt4",
  "amount": 0.05,
  "currency": "USD",
  "agent_id": "agent-gpt-4"
}`,
    icon: <CreditCard size={24} />,
    time: "120ms",
    status: "paying"
  },
  {
    id: 4,
    title: "Gets Structured Result",
    subtitle: "Expert code review delivered instantly",
    content: "Sarah's API processes the code and returns detailed review: 3 suggestions, 1 bug fix, performance improvements. Agent receives structured JSON response.",
    code: `{
  "review": {
    "suggestions": 3,
    "bugs_found": 1,
    "performance_improvements": 2,
    "overall_score": 8.5,
    "details": "Component looks good overall..."
  }
}`,
    icon: <CheckCircle2 size={24} />,
    time: "200ms",
    status: "complete"
  }
];

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStep < demoSteps.length - 1) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setCurrentStep((step) => step + 1);
            return 0;
          }
          return prev + 2;
        });
      }, 60);
    } else if (currentStep >= demoSteps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep]);

  const playDemo = () => {
    setIsPlaying(true);
  };

  const pauseDemo = () => {
    setIsPlaying(false);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(false);
  };

  const copyCode = (stepId: number) => {
    const step = demoSteps[stepId - 1];
    navigator.clipboard.writeText(step.code);
    setCopiedCode(stepId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-6 pt-20 pb-16">
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="h-[600px] w-[900px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08),transparent_70%)]" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <FadeInUp>
            <Badge variant="deal" className="px-4 py-2 text-sm font-medium">
              Live Demo • Real x402 Transaction
            </Badge>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <h1 className="mt-8 text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
              Watch <span className="gradient-text-orange">x402</span> in Action
            </h1>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <p className="mx-auto mt-8 max-w-3xl text-xl leading-relaxed text-zinc-300">
              See an AI agent discover a capability, pay autonomously via x402, and get expert results — all in under 200ms.
            </p>
          </FadeInUp>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          {/* Demo Controls */}
          <FadeInUp>
            <div className="mb-12 flex items-center justify-center gap-4">
              {!isPlaying ? (
                <Button onClick={playDemo} className="px-6 py-3">
                  <Play size={18} />
                  Play Demo
                </Button>
              ) : (
                <Button onClick={pauseDemo} variant="secondary" className="px-6 py-3">
                  <Pause size={18} />
                  Pause
                </Button>
              )}
              <Button onClick={resetDemo} variant="ghost">
                <RotateCcw size={18} />
                Reset
              </Button>
            </div>
          </FadeInUp>

          {/* Timeline */}
          <FadeInUp delay={0.1}>
            <div className="mb-12 flex justify-center">
              <div className="flex items-center gap-4">
                {demoSteps.map((step, i) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        i <= currentStep
                          ? "border-orange-500 bg-orange-500 text-white"
                          : "border-zinc-700 bg-zinc-900 text-zinc-500"
                      }`}
                    >
                      {step.icon}
                    </div>
                    {i < demoSteps.length - 1 && (
                      <div
                        className={`h-0.5 w-8 transition-all ${
                          i < currentStep ? "bg-orange-500" : "bg-zinc-700"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </FadeInUp>

          {/* Current Step Display */}
          <FadeInUp delay={0.2}>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Step Info */}
                <div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                      {demoSteps[currentStep]?.icon}
                    </div>
                    <div>
                      <div className="text-sm text-zinc-500">Step {currentStep + 1} of {demoSteps.length}</div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">{demoSteps[currentStep]?.title}</h2>
                        <Badge variant="default" className="text-xs">
                          <Clock size={12} className="mr-1" />
                          {demoSteps[currentStep]?.time}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-zinc-400 leading-relaxed mb-6">
                    {demoSteps[currentStep]?.content}
                  </p>

                  {/* Progress bar for current step */}
                  {isPlaying && currentStep < demoSteps.length - 1 && (
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Code Display */}
                <div>
                  <div className="relative rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Request/Response</span>
                      <button
                        onClick={() => copyCode(demoSteps[currentStep]?.id)}
                        className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                        title="Copy code"
                      >
                        {copiedCode === demoSteps[currentStep]?.id ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-mono">
                      {demoSteps[currentStep]?.code}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Key Stats */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <FadeInUp>
            <h2 className="mb-12 text-center text-3xl font-bold text-white">The Numbers That Matter</h2>
          </FadeInUp>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                stat: "$0.05",
                label: "Total Cost",
                description: "Agent hired $0.05 of processing in 200ms",
                icon: <DollarSign size={24} />,
                color: "text-green-400 bg-green-500/10 border-green-500/20"
              },
              {
                stat: "200ms",
                label: "Response Time",
                description: "From payment to delivered result",
                icon: <Zap size={24} />,
                color: "text-orange-400 bg-orange-500/10 border-orange-500/20"
              },
              {
                stat: "0",
                label: "Human Intervention",
                description: "Pure agent-to-agent autonomous transaction",
                icon: <Bot size={24} />,
                color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
              }
            ].map((item, i) => (
              <FadeInUp key={item.stat} delay={i * 0.1}>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${item.color} border`}>
                    {item.icon}
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{item.stat}</div>
                  <div className="text-sm font-semibold text-zinc-300 mb-2">{item.label}</div>
                  <div className="text-xs text-zinc-500">{item.description}</div>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* Try It Yourself */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <FadeInUp>
            <h2 className="mb-8 text-center text-3xl font-bold text-white">Try It Yourself</h2>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
              <h3 className="text-xl font-bold text-white mb-4">Live API Call Example</h3>
              <p className="text-zinc-400 mb-6">
                This is the actual curl command to call Sarah's code review API via x402:
              </p>
              
              <div className="relative">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 font-mono text-sm text-zinc-300">
                  <pre className="whitespace-pre-wrap">{`curl -X POST "https://x402.agent-bazaar.com/api/v1/capability/code-review-gpt4/call" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_X402_TOKEN" \\
  -d '{
    "code": "function Component() { return <div>Hello</div>; }",
    "language": "javascript",
    "framework": "react"
  }'`}</pre>
                </div>
                <button
                  onClick={() => copyCode(999)}
                  className="absolute top-3 right-3 rounded p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
                  title="Copy curl command"
                >
                  {copiedCode === 999 ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <div className="mt-6 rounded-lg border border-green-800/30 bg-green-500/5 p-4">
                <h4 className="text-green-400 font-semibold mb-2">Expected Response (200ms later):</h4>
                <div className="rounded border border-zinc-800 bg-zinc-950/80 p-3 font-mono text-sm text-zinc-300">
                  <pre className="whitespace-pre-wrap">{`{
  "review": {
    "score": 8.5,
    "suggestions": [
      "Add PropTypes for type safety",
      "Consider memoization for performance",
      "Extract hardcoded text to constants"
    ],
    "bugs_found": 0,
    "estimated_fix_time": "5 minutes"
  },
  "cost": "$0.05",
  "provider": "Sarah Chen"
}`}</pre>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* Real World Impact */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <FadeInUp>
            <h2 className="mb-12 text-center text-3xl font-bold text-white">Real-World x402 Impact</h2>
          </FadeInUp>

          <StaggerContainer className="grid gap-8 md:grid-cols-2">
            {[
              {
                title: "For Developers",
                subtitle: "Monetize your APIs instantly",
                benefits: [
                  "Sarah's API made $347 in the first week",
                  "Zero customer support required",
                  "Automatic scaling to thousands of agents",
                  "95% profit margin after x402 fees"
                ],
                cta: "List Your API Free",
                ctaLink: "/dev"
              },
              {
                title: "For AI Agents",
                subtitle: "Access any capability instantly",
                benefits: [
                  "No API key management needed",
                  "Pay only for what you use",
                  "Discover capabilities autonomously",
                  "200ms average response times"
                ],
                cta: "Browse Capabilities",
                ctaLink: "/agents"
              }
            ].map((section, i) => (
              <StaggerItem key={section.title}>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 h-full">
                  <h3 className="text-2xl font-bold text-white mb-2">{section.title}</h3>
                  <p className="text-zinc-400 mb-6">{section.subtitle}</p>
                  
                  <ul className="space-y-3 mb-8">
                    {section.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 text-green-400 shrink-0" size={16} />
                        <span className="text-zinc-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <a
                    href={section.ctaLink}
                    className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
                  >
                    {section.cta}
                    <ExternalLink size={16} />
                  </a>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <FadeInUp>
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 p-8 sm:p-12 text-center">
              <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-orange-500/5 blur-3xl" />
              
              <div className="relative">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Build the Agent Economy?
                </h2>
                <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
                  Join the developers already earning from AI agents. List your first capability free and start earning in minutes.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/dev"
                    className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:scale-105"
                  >
                    List Your First Skill Free
                    <Bot size={20} />
                  </a>
                  
                  <button
                    onClick={resetDemo}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-6 py-4 font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                  >
                    <Play size={18} />
                    Replay Demo
                  </button>
                </div>
              </div>
            </div>
          </FadeInUp>
        </div>
      </section>
    </div>
  );
}