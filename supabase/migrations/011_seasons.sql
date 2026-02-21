-- Seasons / curated collections
create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  cover_image_url text default '',
  season_type text not null default 'season' check (season_type in ('season', 'collection', 'showcase', 'event_collection')),
  is_published boolean default false,
  is_featured boolean default false,
  sort_order integer default 0,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Season items — links portfolio items or standalone content to a season
create table if not exists public.season_items (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  portfolio_item_id uuid references public.portfolio_items(id) on delete cascade,
  profile_id uuid references auth.users(id) on delete cascade,
  title text default '',
  description text default '',
  media_url text default '',
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_seasons_published on public.seasons(is_published) where is_published = true;
create index if not exists idx_seasons_featured on public.seasons(is_featured) where is_featured = true;
create index if not exists idx_season_items_season on public.season_items(season_id);
create index if not exists idx_season_items_portfolio on public.season_items(portfolio_item_id);

-- RLS
alter table public.seasons enable row level security;
alter table public.season_items enable row level security;

-- Anyone authenticated can view published seasons
create policy "Authenticated users can view published seasons" on public.seasons
  for select using (is_published = true and auth.uid() is not null);

-- Officers/admins can view all seasons (including drafts)
create policy "Officers can view all seasons" on public.seasons
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Officers/admins can create seasons
create policy "Officers can create seasons" on public.seasons
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Officers/admins can update seasons
create policy "Officers can update seasons" on public.seasons
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Officers/admins can delete seasons
create policy "Officers can delete seasons" on public.seasons
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Season items: viewable by authenticated users if season is published
create policy "Authenticated users can view season items" on public.season_items
  for select using (
    auth.uid() is not null
    and exists (select 1 from public.seasons where id = season_id and is_published = true)
  );

-- Officers can view all season items
create policy "Officers can view all season items" on public.season_items
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Officers can manage season items
create policy "Officers can create season items" on public.season_items
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

create policy "Officers can update season items" on public.season_items
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

create policy "Officers can delete season items" on public.season_items
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

NOTIFY pgrst, 'reload schema';
