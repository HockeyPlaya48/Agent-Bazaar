"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowUpDown } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { getCapabilities, apiToCapability } from "@/lib/api";
import { Capability } from "@/types";
import { CapabilityCard } from "@/components/capability-card";
import { CategoryFilter } from "@/components/category-filter";
import { StaggerContainer, StaggerItem, FadeInUp } from "@/components/motion";

export default function BrowseSkills() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("popular");
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCapabilities() {
      try {
        setLoading(true);
        const apiCapabilities = await getCapabilities();
        const mappedCapabilities = apiCapabilities.map(apiToCapability);
        setCapabilities(mappedCapabilities);
      } catch (error) {
        console.error("Failed to fetch capabilities:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCapabilities();
  }, []);

  const skills = useMemo(() => {
    let filtered = selectedCategory
      ? capabilities.filter((a) => a.category === selectedCategory)
      : [...capabilities];

    if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "price-low") filtered.sort((a, b) => a.pricePerCall - b.pricePerCall);
    else if (sortBy === "price-high") filtered.sort((a, b) => b.pricePerCall - a.pricePerCall);
    else {
      const tierOrder = { spotlight: 0, featured: 1, free: 2 };
      filtered.sort((a, b) => {
        const ta = tierOrder[a.listingTier || "free"] ?? 2;
        const tb = tierOrder[b.listingTier || "free"] ?? 2;
        if (ta !== tb) return ta - tb;
        return b.usageCount - a.usageCount;
      });
    }

    return filtered;
  }, [selectedCategory, sortBy, capabilities]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <FadeInUp>
        <h1 className="text-3xl font-bold">Browse Skills</h1>
        <p className="mt-1 text-zinc-400">APIs, CLI tools, and agent skills — x402-enabled, pay per use</p>
      </FadeInUp>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          categories={CATEGORIES}
        />
        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown size={14} className="text-zinc-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-white focus:border-orange-500/50 focus:outline-none"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <p className="mt-6 text-sm text-zinc-500">
        {loading ? "Loading..." : `${skills.length} skills found`}
      </p>

      {loading ? (
        /* Loading Skeleton */
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 animate-pulse">
              <div className="h-8 w-8 bg-zinc-700 rounded-full mb-3"></div>
              <div className="h-5 bg-zinc-700 rounded mb-2"></div>
              <div className="h-4 bg-zinc-700 rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-zinc-700 rounded mb-2"></div>
              <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <StaggerContainer
          key={`${selectedCategory}-${sortBy}`}
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {skills.map((skill) => (
            <StaggerItem key={skill.id}>
              <CapabilityCard capability={skill} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {!loading && skills.length === 0 && (
        <p className="py-12 text-center text-zinc-500">
          No skills found. Try a different category.
        </p>
      )}
    </div>
  );
}
