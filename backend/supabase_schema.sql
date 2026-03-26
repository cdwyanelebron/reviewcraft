-- ============================================================
-- ReviewCraft AI — Supabase Database Schema
-- by DL Caliwan
-- Run this entire file in Supabase > SQL Editor > New Query
-- ============================================================

-- ── REVIEWERS TABLE ──────────────────────────────────────────
create table if not exists public.reviewers (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade,
  title          text not null default 'Reviewer',
  course_code    text default '',
  theme_id       text default 'cyan',
  purpose        text default 'general',
  detail_level   text default 'standard',
  reviewer_data  jsonb not null,           -- full AI-generated JSON
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

-- Index for fast user lookups
create index if not exists idx_reviewers_user_id    on public.reviewers(user_id);
create index if not exists idx_reviewers_created_at on public.reviewers(created_at desc);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
alter table public.reviewers enable row level security;

-- Users can only read their own reviewers
create policy "Users read own reviewers"
  on public.reviewers for select
  using (auth.uid() = user_id or user_id is null);

-- Users can only insert as themselves
create policy "Users insert own reviewers"
  on public.reviewers for insert
  with check (auth.uid() = user_id or user_id is null);

-- Users can only delete their own
create policy "Users delete own reviewers"
  on public.reviewers for delete
  using (auth.uid() = user_id);

-- Service role bypasses RLS (used by our backend API)
-- This is automatic for the SERVICE KEY — no extra policy needed.

-- ── AUTO-UPDATE updated_at ───────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger reviewers_updated_at
  before update on public.reviewers
  for each row execute function public.handle_updated_at();

-- ── OPTIONAL: USAGE STATS VIEW ───────────────────────────────
create or replace view public.reviewer_stats as
select
  count(*) as total_reviewers,
  count(distinct user_id) as total_users,
  count(*) filter (where user_id is null) as anonymous_reviewers,
  count(*) filter (where created_at > now() - interval '7 days') as last_7_days
from public.reviewers;

-- ── VERIFY ───────────────────────────────────────────────────
-- After running, check the table was created:
select * from public.reviewers limit 1;
