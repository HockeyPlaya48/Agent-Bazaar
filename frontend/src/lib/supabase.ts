import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase (uses service role, bypasses RLS)
export function getServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey);
}

// ── Types ──
export interface DbCapability {
  id: string;
  provider_id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  type: "api" | "cli" | "skill";
  category: string;
  price_per_call: number;
  x402_endpoint: string;
  icon: string;
  tags: string[];
  featured: boolean;
  listing_tier: "free" | "featured" | "spotlight";
  verified: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbProvider {
  id: string;
  name: string;
  email: string;
  wallet_address: string;
  bio: string;
  avatar_url: string;
  verified: boolean;
  created_at: string;
}

export interface DbUsageLog {
  id: string;
  capability_id: string;
  payer_address: string;
  payment_tx: string;
  amount_usd: number;
  latency_ms: number;
  success: boolean;
  error_message: string;
  created_at: string;
}

export interface DbReview {
  id: string;
  capability_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface DbPayment {
  id: string;
  capability_id: string;
  provider_id: string;
  payer_address: string;
  receiver_address: string;
  tx_hash: string;
  network: string;
  token: string;
  amount_usd: number;
  amount_wei: string;
  verified: boolean;
  verified_at: string;
  created_at: string;
}

// ── Query helpers ──

export async function getCapabilities(filters?: {
  category?: string;
  type?: string;
  search?: string;
  featured?: boolean;
}) {
  let query = supabase
    .from("capabilities")
    .select("*, providers(name, verified)")
    .eq("active", true);

  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.featured) query = query.eq("featured", true);
  if (filters?.search) query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCapabilityBySlug(slug: string) {
  const { data, error } = await supabase
    .from("capabilities")
    .select("*, providers(name, email, verified, wallet_address)")
    .eq("slug", slug)
    .eq("active", true)
    .single();
  if (error) throw error;
  return data;
}

export async function getCapabilityStats(capabilityId: string) {
  const { data, error } = await supabase
    .from("capability_stats")
    .select("*")
    .eq("capability_id", capabilityId)
    .single();
  if (error) throw error;
  return data;
}

export async function getReviews(capabilityId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("capability_id", capabilityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function logUsage(log: Omit<DbUsageLog, "id" | "created_at">) {
  const supa = getServiceSupabase();
  const { error } = await supa.from("usage_logs").insert(log);
  if (error) throw error;
}

export async function recordPayment(payment: Omit<DbPayment, "id" | "created_at">) {
  const supa = getServiceSupabase();
  const { data, error } = await supa.from("payments").insert(payment).select().single();
  if (error) throw error;
  return data;
}
