export type CapabilityType = "api" | "cli" | "skill";

export type CapabilityCategory =
  | "code-generation"
  | "image-generation"
  | "data-analysis"
  | "content-writing"
  | "web-scraping"
  | "trading"
  | "research"
  | "automation";

export type ListingTier = "free" | "featured" | "spotlight";

export interface Capability {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  type: CapabilityType;
  category: CapabilityCategory;
  pricePerCall: number;
  x402Endpoint: string;
  icon: string;
  rating: number;
  usageCount: number;
  featured: boolean;
  tags: string[];
  creatorName: string;
  listingTier?: ListingTier; // free (default), featured ($49/mo), spotlight ($149/mo)
}

export interface Review {
  id: string;
  capabilityId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

// Legacy compat
export type Category = CapabilityCategory;
export type AgentListing = Capability;
export type Bundle = never;
