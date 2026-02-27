import { NextResponse } from "next/server";
import { CAPABILITIES } from "@/lib/data";

const REGISTRY_BASE = process.env.NEXT_PUBLIC_REGISTRY_URL || "http://localhost:4002";

// GET /api/capabilities — list all capabilities with optional filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();
  const minRating = parseFloat(searchParams.get("minRating") || "0");

  // Try to fetch from registry first
  try {
    const registryUrl = `${REGISTRY_BASE}/api/capabilities${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const registryResponse = await fetch(registryUrl);
    
    if (registryResponse.ok) {
      const registryData = await registryResponse.json();
      
      // Map registry data to expected format if needed
      const mappedData = Array.isArray(registryData) ? registryData : registryData.data || [];
      
      return NextResponse.json({
        success: true,
        data: mappedData,
        total: mappedData.length,
        timestamp: Date.now(),
        source: "registry",
      });
    }
  } catch (error) {
    console.warn("Registry not available, falling back to local data:", error);
  }

  // Fallback to local data
  let results = CAPABILITIES.filter((c) => {
    if (type && c.type !== type) return false;
    if (category && c.category !== category) return false;
    if (minRating && c.rating < minRating) return false;
    if (q && !c.name.toLowerCase().includes(q) && !c.tags.some((t) => t.includes(q)) && !c.description.toLowerCase().includes(q)) return false;
    return true;
  });

  // Sort by tier, then rating
  const tierOrder = { spotlight: 0, featured: 1, free: 2, undefined: 2 };
  results.sort((a, b) => {
    const ta = tierOrder[a.listingTier || "free"] ?? 2;
    const tb = tierOrder[b.listingTier || "free"] ?? 2;
    if (ta !== tb) return ta - tb;
    return b.rating - a.rating;
  });

  return NextResponse.json({
    success: true,
    data: results,
    total: results.length,
    timestamp: Date.now(),
    source: "local",
  });
}
