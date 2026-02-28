-- Agent Bazaar — Security Fixes (9 issues)
-- Run in Supabase SQL Editor

-- ═══════════════════════════════════════════
-- 1. Fix capability_stats view: SECURITY INVOKER instead of DEFINER
-- ═══════════════════════════════════════════
DROP VIEW IF EXISTS capability_stats;
CREATE OR REPLACE VIEW capability_stats WITH (security_invoker = true) AS
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

-- ═══════════════════════════════════════════
-- 2. Fix agent_listings RLS policies (restrict to service_role)
-- ═══════════════════════════════════════════
DROP POLICY IF EXISTS "Service insert agent_listings" ON agent_listings;
DROP POLICY IF EXISTS "Service update agent_listings" ON agent_listings;

CREATE POLICY "Service insert agent_listings" ON agent_listings 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service update agent_listings" ON agent_listings 
  FOR UPDATE USING (auth.role() = 'service_role') 
  WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════
-- 3. Fix atlas_waitlist RLS policy
-- ═══════════════════════════════════════════
DROP POLICY IF EXISTS "Service insert atlas_waitlist" ON atlas_waitlist;

CREATE POLICY "Service insert atlas_waitlist" ON atlas_waitlist 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════
-- 4. Fix bundle_agents RLS policy
-- ═══════════════════════════════════════════
DROP POLICY IF EXISTS "Service insert bundle_agents" ON bundle_agents;

CREATE POLICY "Service insert bundle_agents" ON bundle_agents 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════
-- 5. Fix bundles RLS policy
-- ═══════════════════════════════════════════
DROP POLICY IF EXISTS "Service insert bundles" ON bundles;

CREATE POLICY "Service insert bundles" ON bundles 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════
-- 6. Fix payments RLS policy
-- ═══════════════════════════════════════════
DROP POLICY IF EXISTS "Service insert payments" ON payments;

CREATE POLICY "Service insert payments" ON payments 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════
-- 7. Fix purchases RLS policy
-- ═══════════════════════════════════════════
DROP POLICY IF EXISTS "Service insert purchases" ON purchases;

CREATE POLICY "Service insert purchases" ON purchases 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════
-- 8. Fix usage_logs RLS policy
-- ═══════════════════════════════════════════
DROP POLICY IF EXISTS "Service insert usage" ON usage_logs;

CREATE POLICY "Service insert usage" ON usage_logs 
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
