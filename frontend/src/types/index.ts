export type Category =
  | "productivity"
  | "marketing"
  | "personal"
  | "ecommerce"
  | "dev-tools"
  | "finance";

export type PriceType = "lifetime" | "monthly" | "free";
export type InstallType = "api" | "telegram" | "zapier" | "nocode" | "custom";

export interface AgentListing {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  category: Category;
  price: number;
  priceType: PriceType;
  originalPrice: number;
  icon: string;
  screenshots: string[];
  demoUrl: string;
  installType: InstallType;
  atlasCompatible: boolean;
  developerName: string;
  rating: number;
  reviewCount: number;
  salesCount: number;
  featured: boolean;
  tags: string[];
}

export interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string;
  agents: AgentListing[];
  price: number;
  originalPrice: number;
  category: string;
  atlasHint: string;
  featured: boolean;
}

export interface Review {
  id: string;
  agentId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}
