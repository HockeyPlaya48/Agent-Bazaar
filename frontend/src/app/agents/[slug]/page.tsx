"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ExternalLink, Check, MessageSquare, Zap } from "lucide-react";
import { getAgentBySlug, getReviews, purchaseAgent, type AgentListingAPI, type ReviewAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { AtlasCta } from "@/components/atlas-cta";
import { FadeInUp, FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";

export default function AgentDetailPage() {
  const params = useParams();
  const [agent, setAgent] = useState<AgentListingAPI | null>(null);
  const [reviews, setReviews] = useState<ReviewAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    if (!params.slug) return;
    const slug = params.slug as string;
    getAgentBySlug(slug)
      .then((data) => {
        setAgent(data);
        return getReviews(data.id);
      })
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.slug]);

  async function handleBuy() {
    if (!agent) return;
    setPurchasing(true);
    try {
      await purchaseAgent(agent.id);
      setPurchased(true);
    } catch (err) {
      console.error(err);
      alert("Purchase failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  }

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

  if (!agent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-zinc-500">Agent not found.</p>
      </div>
    );
  }

  const discount = agent.original_price
    ? Math.round((1 - agent.price / agent.original_price) * 100)
    : 0;

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
            Browse
          </Link>
          <ChevronRight size={14} />
          <span className="text-zinc-300">{agent.name}</span>
        </nav>
      </FadeIn>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <FadeInUp>
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-zinc-800/50 p-4">
                <span className="text-5xl">{agent.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{agent.name}</h1>
                  {agent.atlas_compatible && <Badge variant="atlas">Atlas-Compatible</Badge>}
                </div>
                <p className="mt-1 text-sm text-zinc-400">by {agent.developer_name}</p>
                <div className="mt-2">
                  <StarRating
                    rating={agent.rating}
                    showValue
                    count={agent.review_count}
                    size="md"
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  {agent.sales_count.toLocaleString()} sales
                </p>
              </div>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <div className="mt-8">
              <h2 className="text-lg font-semibold">What it does</h2>
              <p className="mt-2 leading-relaxed text-zinc-400">
                {agent.long_description || agent.description}
              </p>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.15}>
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Setup</h2>
              <div className="mt-3 space-y-3">
                {[
                  `Install type: ${agent.install_type.toUpperCase()}`,
                  "Connect via API key or bot link (takes 2 minutes)",
                  "Follow the setup wizard — no coding required",
                  "Agent starts working immediately after connection",
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

          {agent.atlas_compatible && (
            <FadeInUp delay={0.25}>
              <div className="mt-8">
                <AtlasCta variant="inline" />
              </div>
            </FadeInUp>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <FadeIn className="sticky top-24">
            <Card className="p-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {agent.price === 0 ? "Free" : `$${agent.price}`}
                </span>
                {agent.original_price > 0 && agent.price > 0 && (
                  <>
                    <span className="text-lg text-zinc-500 line-through">
                      ${agent.original_price}
                    </span>
                    <Badge variant="success">{discount}% off</Badge>
                  </>
                )}
              </div>
              {agent.price_type === "lifetime" && agent.price > 0 && (
                <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                  <Zap size={12} />
                  One-time payment. Lifetime access.
                </p>
              )}

              <div className="mt-4">
                {purchased ? (
                  <div className="w-full rounded-full bg-green-500/20 py-3 text-center font-medium text-green-400">
                    Purchased!
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    loading={purchasing}
                    onClick={handleBuy}
                    className="w-full"
                  >
                    {agent.price === 0 ? "Get for Free" : "Buy Now"}
                  </Button>
                )}
              </div>

              {agent.demo_url && (
                <a
                  href={agent.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="secondary" size="lg" className="mt-3 w-full">
                    Try Demo
                    <ExternalLink size={14} />
                  </Button>
                </a>
              )}

              <div className="mt-6 space-y-3 border-t border-zinc-800/50 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Install type</span>
                  <span className="text-xs uppercase">{agent.install_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Category</span>
                  <span className="capitalize">{agent.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Atlas compatible</span>
                  <span>{agent.atlas_compatible ? "Yes" : "No"}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                {agent.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
