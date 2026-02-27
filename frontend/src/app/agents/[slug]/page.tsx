"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Check, MessageSquare, Zap } from "lucide-react";
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

  useEffect(() => {
    if (!params.slug) return;
    const slug = params.slug as string;
    getCapabilityBySlug(slug)
      .then((data) => {
        setSkill(data);
        return getReviews(data.id);
      })
      .then(setReviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.slug]);

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
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                <Zap size={12} />
                x402-enabled — agents pay automatically
              </p>

              <div className="mt-4">
                <a
                  href={skill.x402_endpoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-full bg-orange-500 py-3 text-center text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Use This Skill
                </a>
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
    </div>
  );
}
