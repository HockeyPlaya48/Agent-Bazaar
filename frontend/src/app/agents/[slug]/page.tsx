"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Check, MessageSquare, Zap, Copy, X } from "lucide-react";
import { getCapabilityBySlug, getReviews, type CapabilityAPI, type ReviewAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeInUp, FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";

export default function SkillDetailPage() {
  const params = useParams();
  const [skill, setSkill] = useState<CapabilityAPI | null>(null);
  const [reviews, setReviews] = useState<ReviewAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!params.slug) return;
    const slug = params.slug as string;
    getCapabilityBySlug(slug)
      .then((data) => {
        setSkill(data);
        // Reviews may fail (no backend) — that's fine
        return getReviews(data.id).catch(() => []);
      })
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Skeleton className="h-4 w-48" />
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-zinc-500">Skill not found.</p>
      </div>
    );
  }

  const typeLabel = skill.type === "api" ? "API" : skill.type === "cli" ? "CLI Tool" : "Agent Skill";

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Breadcrumb */}
      <FadeIn>
        <nav className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="transition-colors hover:text-white">
            Agent Bazaar
          </Link>
          <ChevronRight size={14} />
          <Link href="/agents" className="transition-colors hover:text-white">
            Browse Skills
          </Link>
          <ChevronRight size={14} />
          <span className="text-zinc-300">{skill.name}</span>
        </nav>
      </FadeIn>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <FadeInUp>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-zinc-800/50 p-4">
                <span className="text-5xl">{skill.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{skill.name}</h1>
                  <Badge>{typeLabel}</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-400">by {skill.creator_name}</p>
                <div className="mt-2">
                  <StarRating rating={skill.rating} showValue size="md" />
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  {skill.usage_count.toLocaleString()} calls made
                </p>
              </div>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <div className="mt-8">
              <h2 className="text-lg font-semibold">What it does</h2>
              <p className="mt-2 leading-relaxed text-zinc-400">
                {skill.long_description || skill.description}
              </p>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.15}>
            <div className="mt-8">
              <h2 className="text-lg font-semibold">How to use</h2>
              <div className="mt-3 space-y-3">
                {[
                  `Type: ${typeLabel} — call via the x402 endpoint below`,
                  "Make an x402-enabled HTTP call — agents pay automatically",
                  "Returns structured JSON response on every call",
                  "No subscription needed — pay only for what you use",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-400">
                      <Check size={14} />
                    </div>
                    <p className="text-sm text-zinc-400">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <div className="mt-8">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-zinc-500" />
                <h2 className="text-lg font-semibold">Reviews ({reviews.length})</h2>
              </div>
              {reviews.length > 0 ? (
                <StaggerContainer className="mt-3 space-y-3">
                  {reviews.map((review) => (
                    <StaggerItem key={review.id}>
                      <Card>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StarRating rating={review.rating} />
                            <span className="text-sm font-medium">{review.user_name}</span>
                          </div>
                          <span className="text-xs text-zinc-600">{review.date}</span>
                        </div>
                        <p className="mt-2 text-sm text-zinc-400">{review.comment}</p>
                      </Card>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">No reviews yet. Be the first!</p>
              )}
            </div>
          </FadeInUp>
        </div>

        {/* Sidebar */}
        <div>
          <FadeIn className="sticky top-24">
            <Card className="p-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  ${skill.price_per_call.toFixed(3)}
                </span>
                <span className="text-zinc-500 text-sm">per call</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                No subscription — pay only when your agents use this skill
              </p>
              <p className="flex items-center gap-1 text-xs text-green-400">
                <Zap size={12} />
                x402-enabled — automatic agent payments
              </p>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="block w-full rounded-full bg-orange-500 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Get This Skill
                </button>
                <button
                  onClick={() => {
                    // Simulate adding to dashboard
                    alert('Skill activated! Added to your dashboard.');
                  }}
                  className="block w-full rounded-full border border-zinc-700 py-3 text-center text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
                >
                  Add to My Skills
                </button>
              </div>

              <div className="mt-6 space-y-3 border-t border-zinc-800/50 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Type</span>
                  <span className="text-xs uppercase">{typeLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Category</span>
                  <span className="capitalize">{skill.category.replace("-", " ")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Usage</span>
                  <span>{skill.usage_count.toLocaleString()} calls</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                {skill.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>

      {/* Use This Skill Modal */}
      {showModal && skill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Use {skill.name}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {/* How x402 works */}
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                  <h3 className="text-sm font-semibold text-orange-400 mb-2">💡 How x402 Pay-Per-Call Works</h3>
                  <div className="text-sm text-zinc-300 space-y-1.5">
                    <p>The endpoint is <strong>public</strong> — anyone can discover it. But every call requires automatic payment.</p>
                    <p>When your agent calls the endpoint, x402 handles payment instantly:</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                      <span className="rounded bg-zinc-800 px-2 py-1">Agent calls endpoint</span>
                      <span>→</span>
                      <span className="rounded bg-zinc-800 px-2 py-1">x402 deducts ${skill.price_per_call.toFixed(3)}</span>
                      <span>→</span>
                      <span className="rounded bg-zinc-800 px-2 py-1">Result returned</span>
                    </div>
                    <p className="mt-2 text-zinc-500">No API keys. No subscriptions. No sign-up. Just call and pay.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">x402 Endpoint</h3>
                  <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-3">
                    <code className="flex-1 text-sm text-green-400 break-all">
                      {skill.x402_endpoint}
                    </code>
                    <button
                      onClick={() => handleCopy(skill.x402_endpoint)}
                      className="p-1 hover:bg-zinc-700 rounded"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">cURL Example</h3>
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <code className="text-sm text-zinc-300 whitespace-pre-wrap">
{`curl -X POST "${skill.x402_endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-402-Payment: <your-payment-token>" \\
  -d '{"query": "your input here"}'`}
                    </code>
                    <button
                      onClick={() => handleCopy(`curl -X POST "${skill.x402_endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "X-402-Payment: <your-payment-token>" \\
  -d '{"query": "your input here"}'`)}
                      className="mt-2 p-1 hover:bg-zinc-700 rounded float-right"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                {/* Simulated test call */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Try It (Simulated)</h3>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <button
                      onClick={() => {
                        setTesting(true);
                        setTestResult(null);
                        setTimeout(() => {
                          setTesting(false);
                          setTestResult(JSON.stringify({
                            status: 200,
                            billed: skill.price_per_call,
                            result: `[simulated] ${skill.name} executed successfully`,
                            latency_ms: Math.floor(Math.random() * 150) + 80,
                            x402_payment: "verified",
                          }, null, 2));
                        }, 1200);
                      }}
                      disabled={testing}
                      className="w-full rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 py-2.5 text-sm font-semibold text-white transition"
                    >
                      {testing ? "⏳ Calling endpoint..." : `▶ Simulate x402 Call ($${skill.price_per_call.toFixed(3)})`}
                    </button>
                    {testResult && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-green-400 text-xs font-semibold">✓ 200 OK</span>
                          <span className="text-zinc-500 text-xs">Payment verified via x402</span>
                        </div>
                        <pre className="text-xs text-zinc-300 bg-zinc-900 rounded p-3 overflow-x-auto">{testResult}</pre>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Integration Guide</h3>
                  <div className="bg-zinc-800 rounded-lg p-4 text-sm text-zinc-300 space-y-2">
                    <p><strong>1. Call the endpoint:</strong> POST to the x402 URL with your payload</p>
                    <p><strong>2. Payment is automatic:</strong> x402 deducts ${skill.price_per_call.toFixed(3)} USDC per call — no API keys needed</p>
                    <p><strong>3. Get your result:</strong> Structured JSON response, typically in &lt;200ms</p>
                    <p><strong>4. For agents:</strong> x402-compatible frameworks handle payment automatically</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div>
                    <p className="text-sm text-zinc-500">Cost per call</p>
                    <p className="text-lg font-bold text-orange-400">
                      ${skill.price_per_call.toFixed(3)} <span className="text-sm font-normal text-zinc-500">USDC</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {copied && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
