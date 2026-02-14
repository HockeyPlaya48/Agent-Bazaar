"use client";

import { useState, useEffect } from "react";
import { getBundles, purchaseBundle, type BundleAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { BundleCard } from "@/components/bundle-card";
import { StaggerContainer, StaggerItem, FadeInUp } from "@/components/motion";

export default function BundlesPage() {
  const [bundles, setBundles] = useState<BundleAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getBundles()
      .then(setBundles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleBuyBundle(bundleId: string) {
    setPurchasingId(bundleId);
    try {
      await purchaseBundle(bundleId);
      setPurchasedIds((prev) => new Set(prev).add(bundleId));
    } catch (err) {
      console.error(err);
      alert("Purchase failed. Please try again.");
    } finally {
      setPurchasingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <FadeInUp>
        <h1 className="text-3xl font-bold">Agent Bundles</h1>
        <p className="mt-2 text-zinc-400">
          Save 60-75% with curated agent packs. One purchase, multiple agents.
        </p>
      </FadeInUp>

      {loading ? (
        <div className="mt-8 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <StaggerContainer className="mt-8 space-y-6">
          {bundles.map((bundle) => (
            <StaggerItem key={bundle.id}>
              <BundleCard
                bundle={bundle}
                onBuy={handleBuyBundle}
                purchasing={purchasingId === bundle.id}
                purchased={purchasedIds.has(bundle.id)}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
