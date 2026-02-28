-- Agent Bazaar — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ══════════════════════════════════════
-- PROVIDERS (skill creators/companies)
-- ══════════════════════════════════════
CREATE TABLE providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  wallet_address text,
  bio text,
  avatar_url text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════
-- CAPABILITIES (the skills/APIs listed)
-- ══════════════════════════════════════
CREATE TABLE capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  long_description text,
  type text DEFAULT 'api' CHECK (type IN ('api', 'cli', 'skill')),
  category text NOT NULL,
  price_per_call numeric(10,4) NOT NULL DEFAULT 0.01,
  x402_endpoint text,
  icon text DEFAULT '🔧',
  tags text[] DEFAULT '{}',
  featured boolean DEFAULT false,
  listing_tier text DEFAULT 'free' CHECK (listing_tier IN ('free', 'featured', 'spotlight')),
  verified boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════
-- USAGE LOGS (every x402 call tracked)
-- ══════════════════════════════════════
CREATE TABLE usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id uuid REFERENCES capabilities(id) ON DELETE CASCADE,
  payer_address text,
  payment_tx text,
  amount_usd numeric(10,4),
  latency_ms integer,
  success boolean DEFAULT true,
  error_message text,
  request_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════
-- REVIEWS
-- ══════════════════════════════════════
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id uuid REFERENCES capabilities(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════
-- PAYMENTS (x402 payment records)
-- ══════════════════════════════════════
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id uuid REFERENCES capabilities(id),
  provider_id uuid REFERENCES providers(id),
  payer_address text NOT NULL,
  receiver_address text NOT NULL,
  tx_hash text UNIQUE NOT NULL,
  network text DEFAULT 'base',
  token text DEFAULT 'USDC',
  amount_usd numeric(10,4) NOT NULL,
  amount_wei text,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════
-- NODEMARK RECEIPTS (verification results)
-- ══════════════════════════════════════
CREATE TABLE nodemark_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id uuid REFERENCES capabilities(id) ON DELETE CASCADE,
  suite_id text NOT NULL,
  version text DEFAULT '1.0',
  agent_id text,
  wallet text,
  passed integer DEFAULT 0,
  failed integer DEFAULT 0,
  skipped integer DEFAULT 0,
  receipt_json jsonb NOT NULL DEFAULT '{}',
  soulbound_nft_tx text,
  created_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════
CREATE INDEX idx_capabilities_slug ON capabilities(slug);
CREATE INDEX idx_capabilities_category ON capabilities(category);
CREATE INDEX idx_capabilities_provider ON capabilities(provider_id);
CREATE INDEX idx_usage_logs_capability ON usage_logs(capability_id);
CREATE INDEX idx_usage_logs_created ON usage_logs(created_at);
CREATE INDEX idx_payments_tx ON payments(tx_hash);
CREATE INDEX idx_payments_capability ON payments(capability_id);
CREATE INDEX idx_reviews_capability ON reviews(capability_id);
CREATE INDEX idx_nodemark_capability ON nodemark_receipts(capability_id);

-- ══════════════════════════════════════
-- VIEWS (computed stats)
-- ══════════════════════════════════════
CREATE OR REPLACE VIEW capability_stats AS
SELECT 
  c.id as capability_id,
  c.slug,
  c.name,
  COUNT(u.id) as total_calls,
  COALESCE(AVG(u.latency_ms), 0)::integer as avg_latency_ms,
  CASE WHEN COUNT(u.id) > 0 
    THEN (SUM(CASE WHEN u.success THEN 1 ELSE 0 END)::numeric / COUNT(u.id) * 100)::numeric(5,1)
    ELSE 100.0 
  END as success_rate,
  COALESCE(SUM(u.amount_usd), 0)::numeric(10,2) as total_revenue,
  COUNT(u.id) FILTER (WHERE u.created_at > now() - interval '24 hours') as calls_24h,
  COALESCE(AVG(r.rating), 0)::numeric(2,1) as avg_rating,
  COUNT(DISTINCT r.id) as review_count
FROM capabilities c
LEFT JOIN usage_logs u ON u.capability_id = c.id
LEFT JOIN reviews r ON r.capability_id = c.id
GROUP BY c.id, c.slug, c.name;

-- ══════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════
ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodemark_receipts ENABLE ROW LEVEL SECURITY;

-- Public read for capabilities and providers
CREATE POLICY "Public read capabilities" ON capabilities FOR SELECT USING (active = true);
CREATE POLICY "Public read providers" ON providers FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Public read nodemark" ON nodemark_receipts FOR SELECT USING (true);

-- Service role can do everything (for our API routes)
CREATE POLICY "Service insert usage" ON usage_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service read usage" ON usage_logs FOR SELECT USING (true);
CREATE POLICY "Service insert payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Service read payments" ON payments FOR SELECT USING (true);

-- ══════════════════════════════════════
-- SEED DATA (migrate from static data.ts)
-- ══════════════════════════════════════
INSERT INTO providers (id, name, email, wallet_address, verified) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'DevForge', 'hello@devforge.ai', '0x1234...', true),
  ('a1000000-0000-0000-0000-000000000002', 'PixelMint', 'team@pixelmint.io', '0x2345...', true),
  ('a1000000-0000-0000-0000-000000000003', 'DataPipe Labs', 'info@datapipe.dev', '0x3456...', true),
  ('a1000000-0000-0000-0000-000000000004', 'SynthWrite', 'contact@synthwrite.ai', '0x4567...', true),
  ('a1000000-0000-0000-0000-000000000005', 'CrawlBase', 'dev@crawlbase.io', '0x5678...', false),
  ('a1000000-0000-0000-0000-000000000006', 'ChainSignal', 'alpha@chainsignal.xyz', '0x6789...', true),
  ('a1000000-0000-0000-0000-000000000007', 'DeepScan Research', 'lab@deepscan.ai', '0x7890...', false),
  ('a1000000-0000-0000-0000-000000000008', 'FlowOps', 'ops@flowops.dev', '0x8901...', true),
  ('a1000000-0000-0000-0000-000000000009', 'BankrDAO', 'gm@bankrdao.xyz', '0x9012...', true),
  ('a1000000-0000-0000-0000-000000000010', 'NexusDev', 'build@nexusdev.ai', '0xa123...', true);

INSERT INTO capabilities (provider_id, name, slug, description, long_description, type, category, price_per_call, x402_endpoint, icon, tags, featured, listing_tier, verified) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'GPT-4 Code Review', 'gpt4-code-review', 'Automated code review via GPT-4. Submit a diff, get security analysis, bug detection, and style suggestions.', 'Production-grade code review powered by GPT-4. Catches security vulnerabilities, logic bugs, and style violations in any language.', 'api', 'code-generation', 0.05, 'https://api.agentbazaar.xyz/x402/code-review', '🔍', ARRAY['code-review','security','gpt-4','developer'], true, 'spotlight', true),
  ('a1000000-0000-0000-0000-000000000002', 'DALL-E Image Generator', 'dalle-image-gen', 'Generate images from text prompts. x402-enabled — agents can generate images autonomously.', 'High-quality image generation via DALL-E 3. Supports all aspect ratios, styles, and quality levels.', 'api', 'image-generation', 0.08, 'https://api.agentbazaar.xyz/x402/image-gen', '🎨', ARRAY['image','dalle','generation','creative'], true, 'spotlight', true),
  ('a1000000-0000-0000-0000-000000000003', 'Web Scraper API', 'web-scraper-api', 'Extract structured data from any URL. Handles JS-rendered pages, anti-bot, and pagination.', 'Enterprise-grade web scraping. Returns clean JSON from any webpage with automatic anti-detection.', 'api', 'web-scraping', 0.02, 'https://api.agentbazaar.xyz/x402/scraper', '🕸️', ARRAY['scraping','data','extraction','web'], true, 'featured', true),
  ('a1000000-0000-0000-0000-000000000004', 'AI Content Writer', 'ai-content-writer', 'Generate blog posts, social media content, and marketing copy with AI.', 'Multi-model content generation engine. Produces SEO-optimized articles, threads, and ad copy.', 'api', 'content-writing', 0.03, 'https://api.agentbazaar.xyz/x402/writer', '✍️', ARRAY['writing','content','seo','marketing'], false, 'featured', true),
  ('a1000000-0000-0000-0000-000000000005', 'Sentiment Analyzer', 'sentiment-analyzer', 'Analyze text sentiment, emotion detection, and brand monitoring at scale.', 'NLP-powered sentiment analysis supporting 40+ languages with confidence scores.', 'api', 'data-analysis', 0.01, 'https://api.agentbazaar.xyz/x402/sentiment', '📊', ARRAY['sentiment','nlp','analysis','brand'], false, 'free', false),
  ('a1000000-0000-0000-0000-000000000006', 'DeFi Yield Scanner', 'defi-yield-scanner', 'Real-time DeFi yield opportunities across 10+ chains. Finds the best APY for any token pair.', 'Scans 200+ protocols across Ethereum, Base, Arbitrum, Solana and more for optimal yield farming.', 'api', 'trading', 0.05, 'https://api.agentbazaar.xyz/x402/yield-scan', '📈', ARRAY['defi','yield','farming','crypto'], true, 'spotlight', true),
  ('a1000000-0000-0000-0000-000000000007', 'Research Paper Summarizer', 'research-summarizer', 'Summarize academic papers, extract key findings, and generate literature reviews.', 'AI-powered research assistant. Upload a PDF or paste a DOI to get structured summaries.', 'api', 'research', 0.04, 'https://api.agentbazaar.xyz/x402/research', '🔬', ARRAY['research','academic','papers','summary'], false, 'free', false),
  ('a1000000-0000-0000-0000-000000000008', 'CI/CD Pipeline Generator', 'cicd-pipeline-gen', 'Generate CI/CD configs for GitHub Actions, GitLab CI, or CircleCI from natural language.', 'Describe your build/deploy needs in plain English, get production-ready pipeline configs.', 'cli', 'automation', 0.03, 'https://api.agentbazaar.xyz/x402/cicd', '⚙️', ARRAY['cicd','devops','automation','github-actions'], false, 'featured', true),
  ('a1000000-0000-0000-0000-000000000009', 'bankr-cli', 'bankr-cli', 'On-chain financial agent toolkit. Portfolio tracking, DeFi position management, and automated rebalancing.', 'Full-stack DeFi agent CLI. Manages wallets, tracks positions, auto-compounds yields, and executes swaps.', 'cli', 'trading', 0.06, 'https://api.agentbazaar.xyz/x402/bankr', '🏦', ARRAY['defi','portfolio','trading','cli','onchain'], true, 'spotlight', true),
  ('a1000000-0000-0000-0000-000000000010', 'Smart Contract Auditor', 'smart-contract-auditor', 'AI-powered smart contract security analysis. Finds vulnerabilities before deployment.', 'Scans Solidity/Vyper contracts for reentrancy, overflow, access control issues and more.', 'api', 'code-generation', 0.10, 'https://api.agentbazaar.xyz/x402/audit', '🛡️', ARRAY['security','smart-contract','audit','solidity'], true, 'featured', true);
