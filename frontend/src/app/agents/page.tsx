"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowUpDown, ShieldCheck } from "lucide-react";
import { CAPABILITIES, CATEGORIES } from "@/lib/data";
import { Capability } from "@/types";
import { getVerificationData } from "@/lib/verification";
import { CapabilityCard } from "@/components/capability-card";
import { CategoryFilter } from "@/components/category-filter";
import { SectionHeader } from "@/components/section-header";
import { StaggerContainer, StaggerItem, FadeInUp } from "@/components/motion";

export default function BrowseSkills() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("popular");
  const [allCapabilities, setAllCapabilities] = useState<Capability[]>(CAPABILITIES);

  useEffect(() => {
    fetch("/api/capabilities")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) setAllCapabilities(data.data);
      })
      .catch(() => {});
  }, []);

  const skills = useMemo(() => {
    let filtered = selectedCategory
      ? allCapabilities.filter((a) => a.category === selectedCategory)
      : [...allCapabilities];

    if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "price-low") filtered.sort((a, b) => a.pricePerCall - b.pricePerCall);
    else if (sortBy === "price-high") filtered.sort((a, b) => b.pricePerCall - a.pricePerCall);
    else {
      const tierOrder: Record<string, number> = { spotlight: 0, featured: 1, free: 2 };
      filtered.sort((a, b) => {
        const ta = tierOrder[a.listingTier || "free"] ?? 2;
        const tb = tierOrder[b.listingTier || "free"] ?? 2;
        if (ta !== tb) return ta - tb;
        return b.usageCount - a.usageCount;
      });
    }

    return filtered;
  }, [selectedCategory, sortBy]);

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

      {/* Recently Verified Section */}
      {!selectedCategory && sortBy === "popular" && (() => {
        const verified = allCapabilities.filter(
          (cap) => getVerificationData(cap).status === "verified"
        );
        if (verified.length === 0) return null;
        return (
          <div className="mt-8 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={18} className="text-green-400" />
              <h2 className="text-lg font-bold text-white">Recently Verified</h2>
              <span className="text-xs text-zinc-500">Skills that passed automated verification</span>
            </div>
            <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {verified.slice(0, 4).map((cap) => (
                <StaggerItem key={cap.id}>
                  <CapabilityCard capability={cap} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        );
      })()}

      <p className="mt-6 text-sm text-zinc-500">
        {skills.length} skills found
      </p>

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

      {skills.length === 0 && (
        <p className="py-12 text-center text-zinc-500">
          No skills found. Try a different category.
        </p>
      )}
    </div>
  );
}
