"use client";

import Link from "next/link";
import { type BundleAPI } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BundleCardProps {
  bundle: BundleAPI;
  compact?: boolean;
  onBuy?: (bundleId: string) => void;
  purchasing?: boolean;
  purchased?: boolean;
}

export function BundleCard({
  bundle,
  compact = false,
  onBuy,
  purchasing = false,
  purchased = false,
}: BundleCardProps) {
  const discount = Math.round(
    (1 - bundle.price / bundle.original_price) * 100
  );

  const content = (
    <>
      <div className="flex items-center gap-2">
        {bundle.agents.map((a) => (
          <span key={a.id} className="text-2xl">
            {a.icon}
          </span>
        ))}
      </div>
      <h3 className={`mt-3 font-semibold ${compact ? "text-lg" : "text-2xl font-bold"}`}>
        {bundle.name}
      </h3>
      <p className="mt-1 text-sm text-zinc-400">{bundle.description}</p>
      <div className="mt-4 flex items-center gap-2">
        <span className={`font-bold ${compact ? "text-2xl" : "text-3xl"}`}>
          ${bundle.price}
        </span>
        <span className="text-sm text-zinc-500 line-through">
          ${bundle.original_price}
        </span>
        <Badge variant="success">{discount}% off</Badge>
      </div>

      {!compact && bundle.agents.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase text-zinc-500">Includes:</p>
          {bundle.agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.slug}`}
              className="flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-orange-400"
            >
              <span>{agent.icon}</span>
              <span>{agent.name}</span>
              <span className="text-zinc-600">(${agent.original_price} value)</span>
            </Link>
          ))}
        </div>
      )}

      {bundle.atlas_hint && (
        <p className="mt-3 text-xs text-blue-400">{bundle.atlas_hint}</p>
      )}

      {!compact && onBuy && (
        <div className="mt-6 flex items-center gap-3">
          {purchased ? (
            <Badge variant="success" className="px-6 py-2.5 text-sm">
              Purchased!
            </Badge>
          ) : (
            <Button
              variant="primary"
              size="lg"
              loading={purchasing}
              onClick={(e) => {
                e.preventDefault();
                onBuy(bundle.id);
              }}
            >
              Buy Bundle
            </Button>
          )}
          <p className="text-xs text-zinc-500">One-time payment. Lifetime access.</p>
        </div>
      )}
    </>
  );

  if (compact) {
    return (
      <Link
        href="/bundles"
        className="group rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent p-6 transition-all duration-200 hover:border-orange-500/40 block"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent p-8">
      {content}
    </div>
  );
}
