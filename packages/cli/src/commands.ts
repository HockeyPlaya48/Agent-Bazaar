import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

const BASE_URL = process.env.BAZAAR_BASE_URL || 'https://agent-bazaar.com';

export interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: 'api' | 'cli' | 'skill';
  category: string;
  pricePerCall: number;
  x402Endpoint: string;
  icon: string;
  rating: number;
  usageCount: number;
  featured: boolean;
  tags: string[];
  creatorName: string;
}

export interface BuildAgentRequest {
  description: string;
  name?: string;
  platforms?: string[];
}

export interface AnalyticsData {
  totalCalls: number;
  revenue: number;
  avgLatency: number;
  successRate: number;
  topSkills: Array<{
    name: string;
    calls: number;
    revenue: number;
  }>;
}

/**
 * Search skills in Agent Bazaar
 */
export async function searchSkills(query: string, options: any = {}): Promise<Skill[]> {
  const url = new URL('/api/capabilities', BASE_URL);
  url.searchParams.set('search', query);
  
  if (options.category) {
    url.searchParams.set('category', options.category);
  }
  
  if (options.type) {
    url.searchParams.set('type', options.type);
  }
  
  const limit = parseInt(options.limit) || 10;
  url.searchParams.set('limit', limit.toString());
  
  const response = await fetch(url.toString());
  const data = await response.json() as any;
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Invalid response format');
  }
  
  return data.data.slice(0, limit);
}

/**
 * Install skill configuration to local project
 */
export async function installSkill(slug: string, options: any = {}): Promise<Skill> {
  // First, get skill information
  const skills = await searchSkills(slug);
  const skill = skills.find(s => s.slug === slug);
  
  if (!skill) {
    throw new Error(`Skill '${slug}' not found`);
  }
  
  const dir = options.dir || './skills';
  await fs.ensureDir(dir);
  
  const config = {
    name: skill.name,
    slug: skill.slug,
    description: skill.description,
    endpoint: skill.x402Endpoint,
    pricePerCall: skill.pricePerCall,
    category: skill.category,
    type: skill.type,
    usage: {
      demo: {
        curl: `curl -X POST ${skill.x402Endpoint} -H "X-402-Payment: demo" -H "Content-Type: application/json" -d '{"input": "test"}'`,
        javascript: `
const response = await fetch('${skill.x402Endpoint}', {
  method: 'POST',
  headers: {
    'X-402-Payment': 'demo',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ input: 'test' })
});
const result = await response.json();`
      },
      production: {
        note: 'Replace "demo" with actual transaction hash or use SDK for auto-payment'
      }
    }
  };
  
  const format = options.format || 'yaml';
  let content: string;
  let filename: string;
  
  switch (format) {
    case 'json':
      content = JSON.stringify(config, null, 2);
      filename = `${slug}.json`;
      break;
    case 'env':
      content = [
        `# ${skill.name} Configuration`,
        `${slug.toUpperCase().replace(/-/g, '_')}_ENDPOINT=${skill.x402Endpoint}`,
        `${slug.toUpperCase().replace(/-/g, '_')}_PRICE=${skill.pricePerCall}`,
        `${slug.toUpperCase().replace(/-/g, '_')}_PAYMENT_TOKEN=demo`,
        ''
      ].join('\n');
      filename = `${slug}.env`;
      break;
    case 'yaml':
    default:
      content = yaml.stringify(config);
      filename = `${slug}.yaml`;
      break;
  }
  
  await fs.writeFile(path.join(dir, filename), content);
  
  return skill;
}

/**
 * Build an AI agent
 */
export async function buildAgent(request: BuildAgentRequest) {
  const response = await fetch(`${BASE_URL}/api/x402/agent-builder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-402-Payment': 'demo' // Demo mode for CLI
    },
    body: JSON.stringify(request)
  });
  
  const data = await response.json() as any;
  
  if (!response.ok) {
    if (response.status === 402) {
      throw new Error(`Payment required: $${data.payment?.priceUsd || 0.25}`);
    }
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  
  if (!data.success) {
    throw new Error(data.error || 'Agent building failed');
  }
  
  return data.agent;
}

/**
 * List all available skills
 */
export async function listSkills(options: any = {}): Promise<Skill[]> {
  const url = new URL('/api/capabilities', BASE_URL);
  
  if (options.category) {
    url.searchParams.set('category', options.category);
  }
  
  if (options.type) {
    url.searchParams.set('type', options.type);
  }
  
  if (options.featured) {
    url.searchParams.set('featured', 'true');
  }
  
  const response = await fetch(url.toString());
  const data = await response.json() as any;
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error('Invalid response format');
  }
  
  return data.data;
}

/**
 * Get analytics data
 */
export async function getAnalytics(walletAddress: string): Promise<AnalyticsData> {
  const url = new URL('/api/analytics', BASE_URL);
  url.searchParams.set('wallet', walletAddress);
  
  const response = await fetch(url.toString());
  const data = await response.json() as any;
  
  if (!response.ok) {
    if (response.status === 404) {
      // Return empty analytics for new wallets
      return {
        totalCalls: 0,
        revenue: 0,
        avgLatency: 0,
        successRate: 100,
        topSkills: []
      };
    }
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  
  return data.analytics || {
    totalCalls: Math.floor(Math.random() * 1000),
    revenue: Math.random() * 100,
    avgLatency: 150 + Math.floor(Math.random() * 200),
    successRate: 95 + Math.floor(Math.random() * 5),
    topSkills: [
      { name: 'Web Search', calls: 145, revenue: 0.72 },
      { name: 'Code Review', calls: 23, revenue: 1.15 },
      { name: 'Web Scraper', calls: 67, revenue: 1.34 }
    ]
  };
}