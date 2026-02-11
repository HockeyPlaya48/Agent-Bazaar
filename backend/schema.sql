-- ============================================
-- Agent Bazaar — Supabase Database Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABLES
-- ============================================

-- Agent listings (marketplace products)
CREATE TABLE IF NOT EXISTS agent_listings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT DEFAULT '',
    category TEXT NOT NULL CHECK (category IN ('productivity', 'marketing', 'personal', 'ecommerce', 'dev-tools', 'finance')),
    price NUMERIC NOT NULL DEFAULT 0,
    price_type TEXT NOT NULL DEFAULT 'lifetime' CHECK (price_type IN ('lifetime', 'monthly', 'free')),
    original_price NUMERIC DEFAULT 0,
    icon TEXT DEFAULT '',
    screenshots TEXT[] DEFAULT '{}',
    demo_url TEXT DEFAULT '',
    install_type TEXT NOT NULL DEFAULT 'api' CHECK (install_type IN ('api', 'telegram', 'zapier', 'nocode', 'custom')),
    atlas_compatible BOOLEAN DEFAULT false,
    developer_name TEXT DEFAULT '',
    rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Bundles (grouped agent packs)
CREATE TABLE IF NOT EXISTS bundles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    original_price NUMERIC DEFAULT 0,
    category TEXT DEFAULT '',
    atlas_hint TEXT DEFAULT '',
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Junction table: which agents belong to which bundles
CREATE TABLE IF NOT EXISTS bundle_agents (
    bundle_id TEXT NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES agent_listings(id) ON DELETE CASCADE,
    PRIMARY KEY (bundle_id, agent_id)
);

-- Reviews for agents
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agent_listings(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT '',
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Purchases (agent or bundle)
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'anonymous',
    agent_id TEXT REFERENCES agent_listings(id),
    bundle_id TEXT REFERENCES bundles(id),
    type TEXT NOT NULL CHECK (type IN ('agent', 'bundle')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Atlas waitlist signups
CREATE TABLE IF NOT EXISTS atlas_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    goals TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_agent_listings_slug ON agent_listings(slug);
CREATE INDEX IF NOT EXISTS idx_agent_listings_category ON agent_listings(category);
CREATE INDEX IF NOT EXISTS idx_agent_listings_featured ON agent_listings(featured);
CREATE INDEX IF NOT EXISTS idx_agent_listings_developer ON agent_listings(developer_name);
CREATE INDEX IF NOT EXISTS idx_agent_listings_sales ON agent_listings(sales_count DESC);
CREATE INDEX IF NOT EXISTS idx_agent_listings_rating ON agent_listings(rating DESC);
CREATE INDEX IF NOT EXISTS idx_bundles_slug ON bundles(slug);
CREATE INDEX IF NOT EXISTS idx_reviews_agent_id ON reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created ON purchases(created_at DESC);

-- ============================================
-- 3. ROW LEVEL SECURITY (optional but recommended)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE agent_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE atlas_waitlist ENABLE ROW LEVEL SECURITY;

-- Public read access for marketplace data
CREATE POLICY "Public read agent_listings" ON agent_listings FOR SELECT USING (true);
CREATE POLICY "Public read bundles" ON bundles FOR SELECT USING (true);
CREATE POLICY "Public read bundle_agents" ON bundle_agents FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);

-- Allow inserts from the API (using service role key)
CREATE POLICY "Service insert agent_listings" ON agent_listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update agent_listings" ON agent_listings FOR UPDATE USING (true);
CREATE POLICY "Service insert bundles" ON bundles FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert bundle_agents" ON bundle_agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert purchases" ON purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Service read purchases" ON purchases FOR SELECT USING (true);
CREATE POLICY "Service insert atlas_waitlist" ON atlas_waitlist FOR INSERT WITH CHECK (true);

-- ============================================
-- 4. SEED DATA
-- ============================================

-- 10 Agent Listings
INSERT INTO agent_listings (id, name, slug, description, long_description, category, price, price_type, original_price, icon, screenshots, demo_url, install_type, atlas_compatible, developer_name, rating, review_count, sales_count, featured, tags) VALUES
('1', 'Email Outreach Agent', 'email-outreach-agent', 'Automate cold email campaigns with personalized follow-ups. Connects to any SMTP or Gmail.', 'The Email Outreach Agent handles your entire cold email workflow. Set up campaigns, personalize at scale, and let the agent handle follow-ups, A/B testing, and deliverability optimization. Integrates with Gmail, Outlook, and any SMTP server. Track open rates, click rates, and replies in real-time.', 'marketing', 79, 'lifetime', 199, '📧', '{}', 'https://t.me/EmailOutreachDemoBot', 'api', true, 'IndieMailCo', 4.7, 234, 1842, true, ARRAY['email', 'outreach', 'cold-email', 'automation']),
('2', 'Calendar Optimizer', 'calendar-optimizer', 'AI-powered calendar management. Auto-schedules, blocks focus time, and handles rescheduling.', 'Never manually manage your calendar again. The Calendar Optimizer learns your preferences, blocks deep focus time, handles meeting scheduling with external contacts, and automatically reschedules conflicts. Works with Google Calendar and Outlook.', 'productivity', 49, 'lifetime', 129, '📅', '{}', 'https://t.me/CalendarOptDemoBot', 'nocode', true, 'TimeCraft', 4.5, 167, 1203, true, ARRAY['calendar', 'scheduling', 'productivity', 'time-management']),
('3', 'SEO Content Writer', 'seo-content-writer', 'Generate SEO-optimized blog posts, meta descriptions, and keyword clusters automatically.', 'Feed it a keyword, get a fully optimized article. The SEO Content Writer researches keywords, analyzes top-ranking competitors, and generates long-form content with proper heading structure, internal linking suggestions, and meta descriptions. Supports bulk generation.', 'marketing', 59, 'lifetime', 149, '✍️', '{}', 'https://t.me/SEOWriterDemoBot', 'api', true, 'ContentForge', 4.8, 312, 2156, true, ARRAY['seo', 'content', 'writing', 'blog']),
('4', 'Expense Tracker Agent', 'expense-tracker-agent', 'Scan receipts, categorize expenses, and generate monthly spending reports via Telegram.', 'Just forward receipts to the bot. It extracts amounts, dates, and categories using OCR and AI. Get monthly spending breakdowns, tax-ready reports, and budget alerts. Exports to CSV for your accountant.', 'finance', 39, 'lifetime', 99, '💳', '{}', 'https://t.me/ExpenseTrackerDemoBot', 'telegram', true, 'FinBot Labs', 4.6, 189, 987, false, ARRAY['finance', 'expenses', 'receipts', 'budgeting']),
('5', 'Social Media Scheduler', 'social-media-scheduler', 'Auto-post to Twitter, LinkedIn, and Instagram. AI generates captions and hashtags.', 'Schedule a week of content in minutes. The Social Media Scheduler generates platform-specific captions, suggests trending hashtags, and posts at optimal engagement times. Supports Twitter/X, LinkedIn, and Instagram with image generation.', 'marketing', 69, 'lifetime', 179, '📱', '{}', 'https://t.me/SocialSchedulerDemoBot', 'api', false, 'PostPilot', 4.4, 145, 876, false, ARRAY['social-media', 'scheduling', 'twitter', 'linkedin']),
('6', 'Customer Support Bot', 'customer-support-bot', 'Handle customer inquiries 24/7. Learns from your docs and escalates when needed.', 'Train it on your knowledge base in 5 minutes. Upload your docs, FAQs, and product guides — the bot learns and responds to customer questions accurately. Smart escalation routes complex issues to your team. Integrates via API widget or Telegram.', 'ecommerce', 89, 'lifetime', 249, '🤖', '{}', 'https://t.me/SupportBotDemoBot', 'api', true, 'HelpDeskAI', 4.3, 98, 654, false, ARRAY['support', 'customer-service', 'chatbot', 'ecommerce']),
('7', 'Code Review Agent', 'code-review-agent', 'Automated code reviews on every PR. Catches bugs, security issues, and style violations.', 'Connect to GitHub and get instant code reviews on every pull request. Catches common bugs, security vulnerabilities (OWASP Top 10), performance issues, and style inconsistencies. Supports Python, JavaScript, TypeScript, Go, and Rust.', 'dev-tools', 0, 'free', 0, '🔍', '{}', 'https://t.me/CodeReviewDemoBot', 'api', true, 'DevForge', 4.9, 456, 3421, true, ARRAY['code-review', 'github', 'security', 'developer']),
('8', 'Workout Planner', 'workout-planner', 'Personalized workout plans delivered daily. Adjusts based on your progress and feedback.', 'Tell it your goals and equipment, get daily workouts. The Workout Planner creates progressive overload programs, tracks your lifts, and adjusts difficulty based on your feedback. Supports home and gym workouts with video exercise links.', 'personal', 29, 'lifetime', 79, '💪', '{}', 'https://t.me/WorkoutPlannerDemoBot', 'telegram', true, 'FitBot Studio', 4.7, 278, 1567, false, ARRAY['fitness', 'workout', 'health', 'personal']),
('9', 'Invoice Generator', 'invoice-generator', 'Create and send professional invoices. Auto-tracks payments and sends reminders.', 'Generate invoices from a simple Telegram command. Specify client, amount, and items — get a professional PDF invoice emailed to your client. Tracks payment status, sends automatic reminders for overdue invoices, and generates monthly revenue reports.', 'finance', 49, 'lifetime', 129, '📄', '{}', 'https://t.me/InvoiceDemoBot', 'telegram', false, 'BillBot', 4.2, 87, 543, false, ARRAY['invoicing', 'payments', 'freelancer', 'finance']),
('10', 'Lead Scraper Pro', 'lead-scraper-pro', 'Find and enrich leads from LinkedIn, Twitter, and company websites. GDPR compliant.', 'Build targeted lead lists in minutes. Specify your ideal customer profile — industry, role, company size — and get enriched contact data. Includes email verification, company info, and social profiles. Fully GDPR compliant with consent tracking.', 'marketing', 99, 'lifetime', 299, '🎯', '{}', 'https://t.me/LeadScraperDemoBot', 'api', true, 'LeadLab', 4.6, 201, 1123, true, ARRAY['leads', 'scraping', 'linkedin', 'sales'])
ON CONFLICT (id) DO NOTHING;

-- 3 Bundles
INSERT INTO bundles (id, name, slug, description, price, original_price, category, atlas_hint, featured) VALUES
('b1', 'Productivity Pack', 'productivity-pack', 'Email + Calendar + Support agents — everything you need to run your business on autopilot.', 149, 577, 'productivity', 'Perfect for an Atlas Productivity Team — run all 3 agents autonomously 24/7', true),
('b2', 'Marketing Machine', 'marketing-machine', 'SEO Writer + Social Scheduler + Lead Scraper — your complete marketing engine.', 159, 627, 'marketing', 'Atlas can orchestrate these agents into automated marketing campaigns', true),
('b3', 'Solopreneur Starter', 'solopreneur-starter', 'Workout Planner + Expense Tracker + Calendar — take care of yourself while building.', 79, 307, 'personal', 'Let Atlas manage your health, finances, and schedule — all proactively', false)
ON CONFLICT (id) DO NOTHING;

-- 9 Bundle-Agent mappings
INSERT INTO bundle_agents (bundle_id, agent_id) VALUES
('b1', '1'), ('b1', '2'), ('b1', '6'),
('b2', '3'), ('b2', '5'), ('b2', '10'),
('b3', '8'), ('b3', '4'), ('b3', '2')
ON CONFLICT (bundle_id, agent_id) DO NOTHING;

-- 5 Reviews
INSERT INTO reviews (id, agent_id, user_name, rating, comment, date) VALUES
('r1', '1', 'Sarah M.', 5, 'Saved me 10+ hours per week on outreach. The follow-up sequences are incredible.', '2026-01-15'),
('r2', '1', 'James K.', 4, 'Great agent but needs more email templates. Otherwise solid.', '2026-01-22'),
('r3', '7', 'DevAlex', 5, 'Best free code review tool I''ve ever used. Catches bugs my team misses.', '2026-02-01'),
('r4', '3', 'ContentKing', 5, 'Generated 30 blog posts last month. All ranked on page 1. Insane ROI.', '2026-01-28'),
('r5', '8', 'FitTyler', 5, 'Like having a personal trainer in my pocket. Adjusts workouts based on my feedback.', '2026-02-05')
ON CONFLICT (id) DO NOTHING;
