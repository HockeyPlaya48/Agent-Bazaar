-- ============================================
-- Agent Bazaar: Outreach Tracker + Social Posts
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Outreach Contacts
create type outreach_status as enum ('sent', 'replied', 'call_scheduled', 'integrated', 'no_response');

create table outreach_contacts (
  id uuid default gen_random_uuid() primary key,
  company text not null,
  contact_email text,
  twitter text,
  status outreach_status not null default 'sent',
  sent_at timestamptz,
  follow_up_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

alter table outreach_contacts enable row level security;

create policy "Public read outreach_contacts"
  on outreach_contacts for select
  using (true);

create policy "Service role insert outreach_contacts"
  on outreach_contacts for insert
  with check ((select auth.role()) = 'service_role');

create policy "Service role update outreach_contacts"
  on outreach_contacts for update
  using ((select auth.role()) = 'service_role');

-- Seed data
insert into outreach_contacts (company, contact_email, twitter, status, sent_at) values
  ('E2B', 'partnerships@e2b.dev', '@e2aboratory', 'sent', now()),
  ('Resend', 'hello@resend.com', '@resaboratory', 'sent', now()),
  ('Firecrawl', 'help@firecrawl.com', '@firecrawl_dev', 'sent', now()),
  ('Neon', 'partnerships@neon.tech', '@neaborabase', 'sent', now()),
  ('Trigger.dev', 'hello@trigger.dev', '@triggerdotdev', 'sent', now());

-- 2. Social Posts
create type social_platform as enum ('x_personal', 'x_bazaar', 'instagram', 'tiktok');

create table social_posts (
  id uuid default gen_random_uuid() primary key,
  platform social_platform not null,
  post_content text,
  posted_at timestamptz,
  impressions int default 0,
  likes int default 0,
  replies int default 0,
  reposts int default 0,
  clicks int default 0,
  notes text,
  created_at timestamptz default now()
);

alter table social_posts enable row level security;

create policy "Public read social_posts"
  on social_posts for select
  using (true);

create policy "Service role insert social_posts"
  on social_posts for insert
  with check ((select auth.role()) = 'service_role');

create policy "Service role update social_posts"
  on social_posts for update
  using ((select auth.role()) = 'service_role');
