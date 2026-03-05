"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ShieldCheck, Filter, X } from "lucide-react";
import { CAPABILITIES, CATEGORIES } from "@/lib/data";
import { Capability } from "@/types";
import { getVerificationData } from "@/lib/verification";
import { CapabilityCard } from "@/components/capability-card";
import { CategoryFilter } from "@/components/category-filter";
import { SectionHeader } from "@/components/section-header";
import { StaggerContainer, StaggerItem, FadeInUp } from "@/components/motion";

export default function BrowseSkills() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>("popular");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const allCapabilities = CAPABILITIES;

  const skills = useMemo(() => {
    let filtered = [...allCapabilities];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter((a) => a.type === selectedType);
    }

    // Price range filter
    if (priceRange !== "all") {
      if (priceRange === "free") {
        filtered = filtered.filter((a) => a.pricePerCall === 0 || (a.listingTier === "free"));
      } else if (priceRange === "under-003") {
        filtered = filtered.filter((a) => a.pricePerCall < 0.03);
      } else if (priceRange === "under-005") {
        filtered = filtered.filter((a) => a.pricePerCall < 0.05);
      } else if (priceRange === "under-010") {
        filtered = filtered.filter((a) => a.pricePerCall < 0.10);
      }
    }

    // Rating filter
    if (ratingFilter !== "all") {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter((a) => a.rating >= minRating);
    }

    // Mode filter
    if (modeFilter !== "all") {
      filtered = filtered.filter((a) => {
        const modes = a.mode ? (Array.isArray(a.mode) ? a.mode : [a.mode]) : ["structured"];
        return modes.includes(modeFilter);
      });
    }

    // Verified only filter
    if (verifiedOnly) {
      filtered = filtered.filter((a) => {
        const verification = getVerificationData(a);
        return verification.status === "verified";
      });
    }

    // Sorting
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
  }, [selectedCategory, selectedType, priceRange, ratingFilter, verifiedOnly, modeFilter, sortBy, allCapabilities]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <FadeInUp>
        <h1 className="text-3xl font-bold">Browse Skills</h1>
        <p className="mt-1 text-zinc-400">APIs, CLI tools, and agent skills — x402-enabled, pay per use</p>
      </FadeInUp>

      <div className="mt-8 space-y-4">
        {/* Category and Type Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            categories={CATEGORIES}
          />
          
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">Type:</span>
            <div className="flex gap-1">
              {["api", "cli", "skill"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(selectedType === type ? null : type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    selectedType === type
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Mode:</span>
            <div className="flex gap-1">
              {[
                { key: "all", label: "All" },
                { key: "natural", label: "🗣 Natural Language" },
                { key: "structured", label: "⚙️ Structured" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setModeFilter(modeFilter === key ? "all" : key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    modeFilter === key
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Price Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Price:</span>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-white focus:border-orange-500/50 focus:outline-none"
            >
              <option value="all">All Prices</option>
              <option value="free">Free Trial</option>
              <option value="under-003">Under $0.03</option>
              <option value="under-005">Under $0.05</option>
              <option value="under-010">Under $0.10</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Rating:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs text-white focus:border-orange-500/50 focus:outline-none"
            >
              <option value="all">All Ratings</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
            </select>
          </div>

          {/* Verified Only Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
                verifiedOnly
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
              }`}
            >
              <ShieldCheck size={14} />
              Verified Only
            </button>
          </div>

          {/* Clear Filters */}
          {(selectedCategory || selectedType || priceRange !== "all" || ratingFilter !== "all" || verifiedOnly) && (
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedType(null);
                setPriceRange("all");
                setRatingFilter("all");
                setVerifiedOnly(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition"
            >
              <X size={14} />
              Clear All
            </button>
          )}

          {/* Sort Controls */}
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
