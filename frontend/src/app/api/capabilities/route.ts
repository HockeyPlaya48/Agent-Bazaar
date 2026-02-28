import { NextResponse } from "next/server";
import { CAPABILITIES } from "@/lib/data";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// GET /api/capabilities — list all capabilities with optional filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();
  const minRating = parseFloat(searchParams.get("minRating") || "0");

  // Try Supabase first
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      let query = supabase
        .from("capabilities")
        .select("*, providers(name, verified)")
        .eq("active", true);

      if (type) query = query.eq("type", type);
      if (category) query = query.eq("category", category);
      if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);

      const { data, error } = await query.order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // Map Supabase data to frontend format
        let results = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          longDescription: c.long_description,
          type: c.type,
          category: c.category,
          pricePerCall: parseFloat(c.price_per_call),
          x402Endpoint: c.x402_endpoint,
          icon: c.icon,
          rating: 0, // computed from reviews
          usageCount: 0, // computed from usage_logs
          featured: c.featured,
          tags: c.tags || [],
          creatorName: c.providers?.name || "Unknown",
          listingTier: c.listing_tier,
          verified: c.verified,
        }));

        if (minRating) results = results.filter((c: any) => c.rating >= minRating);

        // Sort by tier, then name
        const tierOrder: Record<string, number> = { spotlight: 0, featured: 1, free: 2 };
        results.sort((a: any, b: any) => {
          const ta = tierOrder[a.listingTier || "free"] ?? 2;
          const tb = tierOrder[b.listingTier || "free"] ?? 2;
          if (ta !== tb) return ta - tb;
          return a.name.localeCompare(b.name);
        });

        // Fetch real stats from usage_logs
        try {
          const { data: stats } = await supabase.from("capability_stats").select("*");
          if (stats) {
            const statsMap = new Map(stats.map((s: any) => [s.capability_id, s]));
            results = results.map((c: any) => {
              const s = statsMap.get(c.id);
              return s ? { ...c, rating: parseFloat(s.avg_rating) || 0, usageCount: parseInt(s.total_calls) || 0 } : c;
            });
          }
        } catch {}

        return NextResponse.json({
          success: true,
          data: results,
          total: results.length,
          timestamp: Date.now(),
          source: "supabase",
        });
      }
    } catch (error) {
      console.warn("Supabase not available, falling back to local data:", error);
    }
  }

  // Fallback to local static data
  let results = CAPABILITIES.filter((c) => {
    if (type && c.type !== type) return false;
    if (category && c.category !== category) return false;
    if (minRating && c.rating < minRating) return false;
    if (q && !c.name.toLowerCase().includes(q) && !c.tags.some((t) => t.includes(q)) && !c.description.toLowerCase().includes(q)) return false;
    return true;
  });

  const tierOrder: Record<string, number> = { spotlight: 0, featured: 1, free: 2 };
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
