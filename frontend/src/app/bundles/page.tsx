"use client";

import Link from "next/link";
import { BUNDLES } from "@/lib/data";

export default function BundlesPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link href="/" className="text-xl font-bold">Agent Bazaar</Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm text-zinc-400">Bundles</span>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-bold">Agent Bundles</h1>
        <p className="mt-2 text-zinc-400">
          Save 60-75% with curated agent packs. One purchase, multiple agents.
        </p>

        <div className="mt-8 space-y-6">
          {BUNDLES.map((bundle) => {
            const discount = Math.round(
              (1 - bundle.price / bundle.originalPrice) * 100
            );
            return (
              <div
                key={bundle.id}
                className="rounded-2xl border border-orange-500/20 bg-zinc-900 p-8"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {bundle.agents.map((a) => (
                        <span key={a.id} className="text-3xl">{a.icon}</span>
                      ))}
                    </div>
                    <h2 className="mt-4 text-2xl font-bold">{bundle.name}</h2>
                    <p className="mt-2 text-zinc-400">{bundle.description}</p>

                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-zinc-500 uppercase">
                        Includes:
                      </p>
                      {bundle.agents.map((agent) => (
                        <Link
                          key={agent.id}
                          href={`/agents/${agent.slug}`}
                          className="flex items-center gap-2 text-sm text-zinc-300 hover:text-orange-400 transition-colors"
                        >
                          <span>{agent.icon}</span>
                          <span>{agent.name}</span>
                          <span className="text-zinc-600">
                            (${agent.originalPrice} value)
                          </span>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
                      <p className="text-xs text-blue-400">
                        {bundle.atlasHint}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          ${bundle.price}
                        </span>
                        <span className="text-lg text-zinc-500 line-through">
                          ${bundle.originalPrice}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-green-400">
                        Save {discount}%
                      </span>
                    </div>
                    <button className="rounded-full bg-orange-500 px-8 py-3 font-medium text-white hover:bg-orange-400 transition-colors">
                      Buy Bundle
                    </button>
                    <p className="text-xs text-zinc-500">
                      One-time payment. Lifetime access.
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
