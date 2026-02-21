-- Chapters (multi-tenant: each school/club gets a chapter)
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  school text default '',
  description text default '',
  logo_url text default '',
  banner_url text default '',
  accent_color text default '#4ecdc4',
  website_url text default '',
  instagram_url text default '',
  is_active boolean default true,
  is_public boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Add chapter_id to profiles (nullable for backward compat — existing MCS users get assigned later)
alter table public.profiles
  add column if not exists chapter_id uuid references public.chapters(id) on delete set null;

-- Add chapter_id to events
alter table public.events
  add column if not exists chapter_id uuid references public.chapters(id) on delete cascade;

-- Add chapter_id to posts
alter table public.posts
  add column if not exists chapter_id uuid references public.chapters(id) on delete cascade;

-- Add chapter_id to job_listings
alter table public.job_listings
  add column if not exists chapter_id uuid references public.chapters(id) on delete cascade;

-- Add chapter_id to seasons
alter table public.seasons
  add column if not exists chapter_id uuid references public.chapters(id) on delete cascade;

-- Indexes
create index if not exists idx_chapters_slug on public.chapters(slug);
create index if not exists idx_chapters_active on public.chapters(is_active) where is_active = true;
create index if not exists idx_profiles_chapter on public.profiles(chapter_id);
create index if not exists idx_events_chapter on public.events(chapter_id);
create index if not exists idx_posts_chapter on public.posts(chapter_id);
create index if not exists idx_job_listings_chapter on public.job_listings(chapter_id);
create index if not exists idx_seasons_chapter on public.seasons(chapter_id);

-- RLS for chapters
alter table public.chapters enable row level security;

-- Anyone can view active public chapters (for the directory)
create policy "Anyone can view public chapters" on public.chapters
  for select using (is_active = true and is_public = true);

-- Authenticated users can view all active chapters
create policy "Authenticated users can view active chapters" on public.chapters
  for select using (is_active = true and auth.uid() is not null);

-- Only super-admins (admins with no chapter, or platform admins) can create chapters
-- For now, any admin can create a chapter
create policy "Admins can create chapters" on public.chapters
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and member_role = 'admin')
  );

-- Chapter admins can update their own chapter
create policy "Chapter admins can update own chapter" on public.chapters
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and member_role = 'admin'
      and chapter_id = chapters.id
    )
  );

NOTIFY pgrst, 'reload schema';
