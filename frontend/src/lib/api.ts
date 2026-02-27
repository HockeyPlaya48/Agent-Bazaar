import { CAPABILITIES } from "./data";

// Registry URL (x402 registry) takes priority, falls back to legacy backend
const REGISTRY_BASE = process.env.NEXT_PUBLIC_REGISTRY_URL || "http://localhost:4002";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ---- Capabilities ----

export async function getCapabilities(params?: {
  category?: string;
  type?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.type) query.set("type", params.type);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();

  // Try x402 registry first, then legacy backend, then local data
  try {
    const res = await fetch(`${REGISTRY_BASE}/api/capabilities${qs ? `?${qs}` : ""}`);
    if (res.ok) {
      const data = await res.json();
      return data.map(registryToAPI);
    }
  } catch { /* registry unavailable */ }

  try {
    return await fetchAPI<CapabilityAPI[]>(`/capabilities${qs ? `?${qs}` : ""}`);
  } catch {
    let fallback = CAPABILITIES.map(toAPI);
    if (params?.category) fallback = fallback.filter((c) => c.category === params.category);
    if (params?.type) fallback = fallback.filter((c) => c.type === params.type);
    if (params?.search) {
      const s = params.search.toLowerCase();
      fallback = fallback.filter(
        (c) => c.name.toLowerCase().includes(s) || c.tags.some((t) => t.includes(s))
      );
    }
    return fallback;
  }
}

export async function getCapabilityBySlug(slug: string) {
  try {
    return await fetchAPI<CapabilityAPI>(`/capabilities/${slug}`);
  } catch {
    const cap = CAPABILITIES.find((c) => c.slug === slug);
    if (!cap) throw new Error("Not found");
    return toAPI(cap);
  }
}

// ---- Reviews ----

export async function getReviews(capabilityId: string) {
  return fetchAPI<ReviewAPI[]>(`/reviews?capability_id=${capabilityId}`);
}

// ---- Agent Shopping ----

export async function agentShop(query: string) {
  return fetchAPI<{ recommendations: CapabilityAPI[]; reasoning: string }>("/agent-shop", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

// ---- Creator Portal ----

export async function submitCapability(capability: CapabilitySubmitAPI) {
  return fetchAPI<{ message: string }>("/capabilities", {
    method: "POST",
    body: JSON.stringify(capability),
  });
}

// ---- Registry → API adapter ----

function registryToAPI(c: any): CapabilityAPI {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    long_description: c.longDescription || c.long_description || "",
    type: c.type,
    category: c.category,
    price_per_call: c.pricePerCall ?? c.price_per_call ?? 0,
    x402_endpoint: c.x402Endpoint ?? c.x402_endpoint ?? "",
    icon: c.icon || "🔧",
    rating: c.rating || 0,
    usage_count: c.usageCount ?? c.usage_count ?? 0,
    featured: c.featured || false,
    tags: c.tags || [],
    creator_name: c.creatorName ?? c.creator_name ?? "Unknown",
  };
}

// ---- Helpers ----

function toAPI(c: (typeof CAPABILITIES)[number]): CapabilityAPI {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    long_description: c.longDescription,
    type: c.type,
    category: c.category,
    price_per_call: c.pricePerCall,
    x402_endpoint: c.x402Endpoint,
    icon: c.icon,
    rating: c.rating,
    usage_count: c.usageCount,
    featured: c.featured,
    tags: c.tags,
    creator_name: c.creatorName,
  };
}

// ---- Legacy aliases (for pages that pre-date the capability rename) ----

export const getAgentBySlug = getCapabilityBySlug;

export async function purchaseAgent(id: string) {
  return fetchAPI<{ message: string }>(`/capabilities/${id}/purchase`, { method: "POST" });
}

export async function getDevStats(devName: string) {
  return fetchAPI<DevStatsAPI>(`/dev/${devName}/stats`);
}

export async function getDevAgents(devName: string) {
  return fetchAPI<CapabilityAPI[]>(`/dev/${devName}/capabilities`);
}

export async function submitAgent(data: AgentSubmitAPI & { developer_name: string }) {
  return submitCapability({
    name: data.name,
    type: data.type || "skill",
    category: data.category,
    description: data.description,
    price_per_call: data.price_per_call ?? 0,
    x402_endpoint: data.x402_endpoint ?? "",
  });
}

// ---- API Types ----

export interface CapabilityAPI {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  type: string;
  category: string;
  price_per_call: number;
  x402_endpoint: string;
  icon: string;
  rating: number;
  usage_count: number;
  featured: boolean;
  tags: string[];
  creator_name: string;
}

export interface ReviewAPI {
  id: string;
  capability_id: string;
  user_name: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CapabilitySubmitAPI {
  name: string;
  type: string;
  category: string;
  description: string;
  price_per_call: number;
  x402_endpoint: string;
}

export type AgentListingAPI = CapabilityAPI;

export interface DevStatsAPI {
  total_revenue: number;
  total_sales: number;
  avg_rating: number;
  agent_count: number;
}

export interface AgentSubmitAPI {
  name: string;
  type?: string;
  category: string;
  description: string;
  price_per_call?: number;
  x402_endpoint?: string;
  // legacy fields (ignored on submission)
  price?: number;
  price_type?: string;
  demo_url?: string;
  install_type?: string;
  atlas_compatible?: boolean;
}
