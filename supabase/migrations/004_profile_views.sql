-- Track profile views for analytics
create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  referrer text default '',
  user_agent text default '',
  created_at timestamp with time zone default now()
);

-- Index for fast queries by profile and date
create index if not exists idx_profile_views_profile_id on public.profile_views(profile_id);
create index if not exists idx_profile_views_created_at on public.profile_views(created_at);
create index if not exists idx_profile_views_profile_date on public.profile_views(profile_id, created_at desc);

-- RLS
alter table public.profile_views enable row level security;

-- Anyone can insert a view (anonymous or authenticated)
create policy "Anyone can log a view" on public.profile_views
  for insert with check (true);

-- Profile owners can read their own view stats
create policy "Owners can read own views" on public.profile_views
  for select using (profile_id = auth.uid());

-- Admins can read all views (for leaderboard / popular members)
create policy "Admins can read all views" on public.profile_views
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Aggregate view for quick stats (materialized-style, using a regular view)
create or replace view public.profile_view_stats as
select
  profile_id,
  count(*) as total_views,
  count(*) filter (where created_at > now() - interval '7 days') as views_7d,
  count(*) filter (where created_at > now() - interval '30 days') as views_30d,
  count(distinct viewer_id) as unique_viewers,
  max(created_at) as last_viewed_at
from public.profile_views
group by profile_id;
