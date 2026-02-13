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

// ---- Agents ----

export async function getAgents(params?: {
  category?: string;
  sort?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return fetchAPI<AgentListingAPI[]>(`/agents${qs ? `?${qs}` : ""}`);
}

export async function getAgentBySlug(slug: string) {
  return fetchAPI<AgentListingAPI>(`/agents/${slug}`);
}

// ---- Bundles ----

export async function getBundles() {
  return fetchAPI<BundleAPI[]>("/bundles");
}

export async function getBundleBySlug(slug: string) {
  return fetchAPI<BundleAPI>(`/bundles/${slug}`);
}

// ---- Reviews ----

export async function getReviews(agentId: string) {
  return fetchAPI<ReviewAPI[]>(`/reviews?agent_id=${agentId}`);
}

// ---- Purchases ----

export async function purchaseAgent(agentId: string) {
  return fetchAPI<{ message: string }>("/purchases/agent", {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId }),
  });
}

export async function purchaseBundle(bundleId: string) {
  return fetchAPI<{ message: string }>("/purchases/bundle", {
    method: "POST",
    body: JSON.stringify({ bundle_id: bundleId }),
  });
}

// ---- Dev Portal ----

export async function getDevStats(developerName: string) {
  return fetchAPI<DevStatsAPI>(`/dev/stats?developer_name=${encodeURIComponent(developerName)}`);
}

export async function getDevAgents(developerName: string) {
  return fetchAPI<AgentListingAPI[]>(`/dev/agents?developer_name=${encodeURIComponent(developerName)}`);
}

export async function submitAgent(agent: AgentSubmitAPI) {
  return fetchAPI<{ message: string; agent: AgentListingAPI[] }>("/dev/agents", {
    method: "POST",
    body: JSON.stringify(agent),
  });
}

// ---- User Dashboard ----

export async function getUserAgents(userId: string) {
  return fetchAPI<AgentListingAPI[]>(`/purchases/agents?user_id=${encodeURIComponent(userId)}`);
}

// ---- Atlas Waitlist ----

export async function joinWaitlist(email: string, goals: string[]) {
  return fetchAPI<{ message: string }>("/atlas/waitlist", {
    method: "POST",
    body: JSON.stringify({ email, goals }),
  });
}

// ---- API Types (matching backend response shapes) ----

export interface AgentListingAPI {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  category: string;
  price: number;
  price_type: string;
  original_price: number;
  icon: string;
  screenshots: string[];
  demo_url: string;
  install_type: string;
  atlas_compatible: boolean;
  developer_name: string;
  rating: number;
  review_count: number;
  sales_count: number;
  featured: boolean;
  tags: string[];
}

export interface BundleAPI {
  id: string;
  name: string;
  slug: string;
  description: string;
  agents: AgentListingAPI[];
  price: number;
  original_price: number;
  category: string;
  atlas_hint: string;
  featured: boolean;
}

export interface ReviewAPI {
  id: string;
  agent_id: string;
  user_name: string;
  rating: number;
  comment: string;
  date: string;
}

export interface DevStatsAPI {
  developer_name: string;
  total_revenue: number;
  total_sales: number;
  avg_rating: number;
  agent_count: number;
}

export interface AgentSubmitAPI {
  name: string;
  category: string;
  description: string;
  price: number;
  price_type: string;
  demo_url?: string;
  install_type?: string;
  atlas_compatible?: boolean;
}
