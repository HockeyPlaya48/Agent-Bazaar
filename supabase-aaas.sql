-- AaaS Supabase Schema
-- Run this in Supabase SQL Editor to create required tables

-- ─── aaas_clients ─────────────────────────────────────────────────────────────
-- Stores every confirmed purchase (x402 or Stripe)
CREATE TABLE IF NOT EXISTS aaas_clients (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  capability_id       TEXT NOT NULL DEFAULT 'automation-as-a-service',
  tier                TEXT NOT NULL CHECK (tier IN ('basic', 'standard', 'premium')),
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  x_handle            TEXT,
  phone               TEXT,
  automation_description TEXT NOT NULL,
  scope_id            TEXT,
  payment_tx          TEXT NOT NULL,
  payment_method      TEXT NOT NULL DEFAULT 'x402',
  amount_usd          INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'pending')),
  stripe_session_id   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── aaas_scopes ──────────────────────────────────────────────────────────────
-- Pre-checkout scope storage (links scope form to payment)
CREATE TABLE IF NOT EXISTS aaas_scopes (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scope_id            TEXT NOT NULL UNIQUE,
  tier                TEXT NOT NULL CHECK (tier IN ('basic', 'standard', 'premium')),
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  x_handle            TEXT,
  phone               TEXT,
  automation_description TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'expired')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── nexus_tweet_queue ────────────────────────────────────────────────────────
-- Tweet queue for @nexusx2026 to poll and post
CREATE TABLE IF NOT EXISTS nexus_tweet_queue (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_text  TEXT NOT NULL,
  event_type  TEXT NOT NULL DEFAULT 'new_aaas_purchase',
  purchase_id TEXT,
  tier        TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'skipped')),
  posted_at   TIMESTAMPTZ,
  tweet_id    TEXT,  -- X/Twitter tweet ID after posting
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── aaas_renewals ────────────────────────────────────────────────────────────
-- Stripe subscription renewal log
CREATE TABLE IF NOT EXISTS aaas_renewals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id TEXT NOT NULL,
  tier            TEXT,
  email           TEXT,
  amount_cents    INTEGER,
  period_start    TIMESTAMPTZ,
  period_end      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_aaas_clients_email  ON aaas_clients(email);
CREATE INDEX IF NOT EXISTS idx_aaas_clients_tier   ON aaas_clients(tier);
CREATE INDEX IF NOT EXISTS idx_aaas_clients_status ON aaas_clients(status);
CREATE INDEX IF NOT EXISTS idx_aaas_scopes_scope_id ON aaas_scopes(scope_id);
CREATE INDEX IF NOT EXISTS idx_nexus_tweet_status  ON nexus_tweet_queue(status);

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────
-- Service role key can read/write all. Anon has no access.
ALTER TABLE aaas_clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE aaas_scopes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_tweet_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE aaas_renewals     ENABLE ROW LEVEL SECURITY;

-- Service role bypass (used by server-side API routes)
CREATE POLICY "Service role full access on aaas_clients"
  ON aaas_clients FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on aaas_scopes"
  ON aaas_scopes FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on nexus_tweet_queue"
  ON nexus_tweet_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on aaas_renewals"
  ON aaas_renewals FOR ALL TO service_role USING (true) WITH CHECK (true);
