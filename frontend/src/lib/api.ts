import { CAPABILITIES } from "./data";

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
