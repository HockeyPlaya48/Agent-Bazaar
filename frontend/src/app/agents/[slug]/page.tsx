"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAgentBySlug, getReviews, purchaseAgent, type AgentListingAPI, type ReviewAPI } from "@/lib/api";

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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500 animate-pulse">Loading agent...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Agent not found.</p>
      </div>
    );
  }

  const discount = agent.original_price
    ? Math.round((1 - agent.price / agent.original_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
            &larr; Agent Bazaar
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm">{agent.name}</span>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{agent.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{agent.name}</h1>
                  {agent.atlas_compatible && (
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                      Atlas-Compatible
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-400">by {agent.developer_name}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-yellow-400">{"★".repeat(Math.floor(agent.rating))}</span>
                  <span className="text-sm text-zinc-400">
                    {agent.rating} ({agent.review_count} reviews)
                  </span>
                  <span className="text-sm text-zinc-600">
                    {agent.sales_count.toLocaleString()} sales
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold">What it does</h2>
              <p className="mt-2 text-zinc-400 leading-relaxed">
                {agent.long_description || agent.description}
              </p>
            </div>

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
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                      {i + 1}
                    </div>
                    <p className="text-sm text-zinc-400">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-semibold">Reviews ({reviews.length})</h2>
              {reviews.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400 text-sm">{"★".repeat(review.rating)}</span>
                          <span className="text-sm font-medium">{review.user_name}</span>
                        </div>
                        <span className="text-xs text-zinc-600">{review.date}</span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">No reviews yet. Be the first!</p>
              )}
            </div>

            {agent.atlas_compatible && (
              <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
                <h3 className="font-semibold text-blue-400">This agent works with Atlas</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Purchase this agent and upgrade to Atlas to have it run autonomously 24/7 — no prompts needed.
                </p>
                <Link href="/atlas" className="mt-3 inline-block text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                  Learn about Atlas →
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar — Purchase Card */}
          <div>
            <div className="sticky top-24 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {agent.price === 0 ? "Free" : `$${agent.price}`}
                </span>
                {agent.original_price > 0 && agent.price > 0 && (
                  <>
                    <span className="text-lg text-zinc-500 line-through">${agent.original_price}</span>
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                      {discount}% off
                    </span>
                  </>
                )}
              </div>
              {agent.price_type === "lifetime" && agent.price > 0 && (
                <p className="mt-1 text-xs text-zinc-500">One-time payment. Lifetime access.</p>
              )}

              {purchased ? (
                <div className="mt-4 w-full rounded-full bg-green-500/20 py-3 text-center font-medium text-green-400">
                  Purchased!
                </div>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={purchasing}
                  className="mt-4 w-full rounded-full bg-orange-500 py-3 font-medium text-white hover:bg-orange-400 transition-colors disabled:opacity-50"
                >
                  {purchasing ? "Processing..." : agent.price === 0 ? "Get for Free" : "Buy Now"}
                </button>
              )}

              {agent.demo_url && (
                <a
                  href={agent.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block w-full rounded-full border border-zinc-700 py-3 text-center text-sm font-medium hover:bg-zinc-800 transition-colors"
                >
                  Try Demo on Telegram
                </a>
              )}

              <div className="mt-6 space-y-3 border-t border-zinc-800 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Install type</span>
                  <span className="uppercase text-xs">{agent.install_type}</span>
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
                  <span key={tag} className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
