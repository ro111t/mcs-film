-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null default '',
  bio text default '',
  role text default '', -- e.g. Director, Cinematographer, Editor, Actor
  headshot_url text default '',
  website_url text default '',
  is_admin boolean default false,
  is_visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Portfolio items (photos, video embeds)
create table public.portfolio_items (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles on delete cascade not null,
  title text not null default '',
  description text default '',
  media_type text not null check (media_type in ('image', 'video')),
  media_url text default '',       -- for uploaded images (Supabase Storage URL)
  video_embed_url text default '',  -- for YouTube/Vimeo embed URLs
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.portfolio_items enable row level security;

-- Profiles policies
-- Anyone can view visible profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (is_visible = true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can insert their own profile (on signup)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Portfolio policies
-- Anyone can view portfolio items of visible profiles
create policy "Portfolio items are viewable by everyone"
  on public.portfolio_items for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = portfolio_items.profile_id
      and profiles.is_visible = true
    )
  );

-- Users can manage their own portfolio items
create policy "Users can insert own portfolio items"
  on public.portfolio_items for insert
  with check (auth.uid() = profile_id);

create policy "Users can update own portfolio items"
  on public.portfolio_items for update
  using (auth.uid() = profile_id);

create policy "Users can delete own portfolio items"
  on public.portfolio_items for delete
  using (auth.uid() = profile_id);

-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage buckets (run these in the Supabase dashboard SQL editor)
-- insert into storage.buckets (id, name, public) values ('headshots', 'headshots', true);
-- insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true);

-- Storage policies for headshots bucket
-- create policy "Anyone can view headshots" on storage.objects for select using (bucket_id = 'headshots');
-- create policy "Authenticated users can upload headshots" on storage.objects for insert with check (bucket_id = 'headshots' and auth.role() = 'authenticated');
-- create policy "Users can update own headshots" on storage.objects for update using (bucket_id = 'headshots' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Users can delete own headshots" on storage.objects for delete using (bucket_id = 'headshots' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for portfolio bucket
-- create policy "Anyone can view portfolio files" on storage.objects for select using (bucket_id = 'portfolio');
-- create policy "Authenticated users can upload portfolio files" on storage.objects for insert with check (bucket_id = 'portfolio' and auth.role() = 'authenticated');
-- create policy "Users can update own portfolio files" on storage.objects for update using (bucket_id = 'portfolio' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Users can delete own portfolio files" on storage.objects for delete using (bucket_id = 'portfolio' and auth.uid()::text = (storage.foldername(name))[1]);
-- Add banner, social links to profiles
alter table public.profiles add column if not exists banner_url text default '';
alter table public.profiles add column if not exists instagram_url text default '';
alter table public.profiles add column if not exists vimeo_url text default '';
alter table public.profiles add column if not exists youtube_url text default '';
alter table public.profiles add column if not exists imdb_url text default '';

-- Add category to portfolio items
alter table public.portfolio_items add column if not exists category text default '';

-- Storage bucket for banners
insert into storage.buckets (id, name, public) values ('banners', 'banners', true)
on conflict (id) do nothing;

-- Storage policies for banners bucket
create policy "Anyone can view banners" on storage.objects for select using (bucket_id = 'banners');
create policy "Authenticated users can upload banners" on storage.objects for insert with check (bucket_id = 'banners' and auth.role() = 'authenticated');
create policy "Users can update own banners" on storage.objects for update using (bucket_id = 'banners' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own banners" on storage.objects for delete using (bucket_id = 'banners' and auth.uid()::text = (storage.foldername(name))[1]);
-- Profile sections table for customizable profile layout
create table if not exists public.profile_sections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  section_type text not null default 'custom',
  title text not null default '',
  subtitle text not null default '',
  layout text not null default 'grid-2',
  content text not null default '',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamp with time zone default now()
);

-- RLS for profile_sections
alter table public.profile_sections enable row level security;

create policy "Users can view visible sections" on public.profile_sections
  for select using (
    is_visible = true
    or profile_id = auth.uid()
  );

create policy "Users can insert own sections" on public.profile_sections
  for insert with check (profile_id = auth.uid());

create policy "Users can update own sections" on public.profile_sections
  for update using (profile_id = auth.uid());

create policy "Users can delete own sections" on public.profile_sections
  for delete using (profile_id = auth.uid());

-- Add section_id to portfolio_items so items can be assigned to sections
alter table public.portfolio_items
  add column if not exists section_id uuid references public.profile_sections(id) on delete set null;

-- Per-item display controls: size in grid and info visibility
alter table public.portfolio_items
  add column if not exists grid_size text not null default 'medium';

alter table public.portfolio_items
  add column if not exists show_info text not null default 'hover';
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
-- Content reporting / flagging system
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null check (content_type in ('portfolio_item', 'profile', 'post', 'comment')),
  content_id uuid not null,
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_content on public.reports(content_type, content_id);

-- RLS
alter table public.reports enable row level security;

-- Authenticated users can submit reports
create policy "Authenticated users can report content" on public.reports
  for insert with check (auth.uid() = reporter_id);

-- Admins can read all reports
create policy "Admins can read reports" on public.reports
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Admins can update report status
create policy "Admins can update reports" on public.reports
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

NOTIFY pgrst, 'reload schema';
-- Add member_role column to profiles (admin, officer, member)
-- Keeps is_admin for backward compat; member_role is the source of truth going forward
alter table public.profiles
  add column if not exists member_role text not null default 'member'
  check (member_role in ('admin', 'officer', 'member'));

-- Backfill: sync existing is_admin = true → member_role = 'admin'
update public.profiles set member_role = 'admin' where is_admin = true;

-- Add RLS policy: admins can read ALL profiles (including hidden ones)
create policy "Admins can read all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.member_role = 'admin')
  );

-- Admins can update any profile (for role assignment, visibility, etc.)
create policy "Admins can update any profile" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.member_role = 'admin')
  );

-- Officers can read all visible profiles (same as public, but also see own hidden)
-- (already covered by existing "Public profiles are viewable" + "Users can update own profile")

NOTIFY pgrst, 'reload schema';
-- Events / meetings / screenings
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  event_date timestamp with time zone not null,
  end_date timestamp with time zone,
  location text default '',
  location_url text default '',
  event_type text not null default 'meeting' check (event_type in ('meeting', 'shoot', 'screening', 'workshop', 'social', 'other')),
  cover_image_url text default '',
  created_by uuid not null references auth.users(id) on delete cascade,
  is_published boolean default true,
  created_at timestamp with time zone default now()
);

-- RSVPs
create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'maybe', 'not_going')),
  created_at timestamp with time zone default now(),
  unique(event_id, user_id)
);

-- Indexes
create index if not exists idx_events_date on public.events(event_date desc);
create index if not exists idx_events_type on public.events(event_type);
create index if not exists idx_event_rsvps_event on public.event_rsvps(event_id);
create index if not exists idx_event_rsvps_user on public.event_rsvps(user_id);

-- RLS
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

-- Anyone authenticated can view published events
create policy "Authenticated users can view events" on public.events
  for select using (is_published = true and auth.uid() is not null);

-- Officers and admins can create events
create policy "Officers can create events" on public.events
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Officers and admins can update events
create policy "Officers can update events" on public.events
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Officers and admins can delete events
create policy "Officers can delete events" on public.events
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Authenticated users can view RSVPs
create policy "Authenticated users can view rsvps" on public.event_rsvps
  for select using (auth.uid() is not null);

-- Users can manage their own RSVPs
create policy "Users can insert own rsvp" on public.event_rsvps
  for insert with check (auth.uid() = user_id);

create policy "Users can update own rsvp" on public.event_rsvps
  for update using (auth.uid() = user_id);

create policy "Users can delete own rsvp" on public.event_rsvps
  for delete using (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
-- Skills and gear for member profiles (replaces Google Forms data)
alter table public.profiles
  add column if not exists skills text[] default '{}',
  add column if not exists gear text[] default '{}',
  add column if not exists availability text default '',
  add column if not exists experience_level text default 'beginner'
    check (experience_level in ('beginner', 'intermediate', 'advanced'));

-- Index for skill/gear matching queries
create index if not exists idx_profiles_skills on public.profiles using gin(skills);
create index if not exists idx_profiles_gear on public.profiles using gin(gear);

NOTIFY pgrst, 'reload schema';
-- Job listings for crew calls
create table if not exists public.job_listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  shoot_date timestamp with time zone,
  location text default '',
  required_skills text[] default '{}',
  required_gear text[] default '{}',
  status text not null default 'open' check (status in ('open', 'filled', 'closed')),
  event_id uuid references public.events(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Job applications
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.job_listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text default '',
  status text not null default 'applied' check (status in ('applied', 'accepted', 'rejected')),
  created_at timestamp with time zone default now(),
  unique(listing_id, user_id)
);

-- Indexes
create index if not exists idx_job_listings_status on public.job_listings(status);
create index if not exists idx_job_listings_skills on public.job_listings using gin(required_skills);
create index if not exists idx_job_listings_created on public.job_listings(created_at desc);
create index if not exists idx_job_applications_listing on public.job_applications(listing_id);
create index if not exists idx_job_applications_user on public.job_applications(user_id);

-- RLS
alter table public.job_listings enable row level security;
alter table public.job_applications enable row level security;

-- All authenticated users can view open listings
create policy "Authenticated users can view listings" on public.job_listings
  for select using (auth.uid() is not null);

-- Officers and admins can create listings
create policy "Officers can create listings" on public.job_listings
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Officers and admins can update listings
create policy "Officers can update listings" on public.job_listings
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Officers and admins can delete listings
create policy "Officers can delete listings" on public.job_listings
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Users can view applications on listings they created or their own applications
create policy "Users can view relevant applications" on public.job_applications
  for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.job_listings where id = listing_id and created_by = auth.uid()
    )
    or exists (
      select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer')
    )
  );

-- Users can apply to listings
create policy "Users can apply to listings" on public.job_applications
  for insert with check (auth.uid() = user_id);

-- Users can update their own applications
create policy "Users can update own applications" on public.job_applications
  for update using (auth.uid() = user_id);

-- Listing creators can update application status
create policy "Listing creators can update applications" on public.job_applications
  for update using (
    exists (
      select 1 from public.job_listings where id = listing_id and created_by = auth.uid()
    )
  );

-- Users can delete their own applications
create policy "Users can delete own applications" on public.job_applications
  for delete using (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
-- Community posts / feed
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  image_url text default '',
  post_type text not null default 'post' check (post_type in ('post', 'announcement', 'question')),
  is_pinned boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Post comments
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  created_at timestamp with time zone default now()
);

-- Post likes
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(post_id, user_id)
);

-- Indexes
create index if not exists idx_posts_created on public.posts(created_at desc);
create index if not exists idx_posts_author on public.posts(author_id);
create index if not exists idx_posts_pinned on public.posts(is_pinned) where is_pinned = true;
create index if not exists idx_post_comments_post on public.post_comments(post_id);
create index if not exists idx_post_likes_post on public.post_likes(post_id);
create index if not exists idx_post_likes_user on public.post_likes(user_id);

-- RLS
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_likes enable row level security;

-- Posts: all authenticated users can view
create policy "Authenticated users can view posts" on public.posts
  for select using (auth.uid() is not null);

-- Any authenticated user can create posts
create policy "Authenticated users can create posts" on public.posts
  for insert with check (auth.uid() = author_id);

-- Users can update own posts
create policy "Users can update own posts" on public.posts
  for update using (auth.uid() = author_id);

-- Users can delete own posts; admins/officers can delete any
create policy "Users can delete own posts" on public.posts
  for delete using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Announcements: only officers/admins can create
-- (enforced in app logic — post_type = 'announcement' checked client-side)

-- Officers/admins can pin posts
create policy "Officers can update any post" on public.posts
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Comments: all authenticated can view
create policy "Authenticated users can view comments" on public.post_comments
  for select using (auth.uid() is not null);

create policy "Authenticated users can create comments" on public.post_comments
  for insert with check (auth.uid() = author_id);

create policy "Users can update own comments" on public.post_comments
  for update using (auth.uid() = author_id);

create policy "Users can delete own comments" on public.post_comments
  for delete using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
  );

-- Likes
create policy "Authenticated users can view likes" on public.post_likes
  for select using (auth.uid() is not null);

create policy "Users can like posts" on public.post_likes
  for insert with check (auth.uid() = user_id);

create policy "Users can unlike posts" on public.post_likes
  for delete using (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
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
-- In-app notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text default '',
  link text default '',
  notification_type text not null default 'info' check (notification_type in ('info', 'event', 'job', 'rsvp', 'application', 'announcement', 'report')),
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

-- RLS
alter table public.notifications enable row level security;

-- Users can read their own notifications
create policy "Users can read own notifications" on public.notifications
  for select using (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Officers/admins can create notifications for anyone (for announcements, etc.)
create policy "Officers can create notifications" on public.notifications
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and member_role in ('admin', 'officer'))
    or auth.uid() = user_id
  );

-- Users can delete their own notifications
create policy "Users can delete own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
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
-- Fix: Allow users to view their own portfolio items regardless of profile visibility
-- The original policy only allowed viewing items of visible profiles,
-- which broke the portfolio editor for users whose profile isn't visible yet.

drop policy if exists "Portfolio items are viewable by everyone" on public.portfolio_items;

create policy "Portfolio items are viewable by everyone or owner"
  on public.portfolio_items for select
  using (
    auth.uid() = profile_id
    or exists (
      select 1 from public.profiles
      where profiles.id = portfolio_items.profile_id
      and profiles.is_visible = true
    )
  );

-- Also allow users to view their own profile (for dashboard, even if not visible)
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

NOTIFY pgrst, 'reload schema';
-- Custom named roles with granular permissions
-- e.g. "President" with all permissions, "Developer" with manage_members, etc.

alter table public.profiles
  add column if not exists team_role_name text default null;

alter table public.profiles
  add column if not exists team_permissions jsonb default '{}'::jsonb;

-- Permissions stored as JSON keys:
--   can_manage_events    (create/edit events)
--   can_manage_jobs      (post job listings)
--   can_manage_feed      (pin/delete posts, post announcements)
--   can_manage_members   (toggle visibility, view all profiles)
--   can_manage_seasons   (create/edit curated seasons)
--   can_manage_roles     (assign roles to others — admin-level only)

NOTIFY pgrst, 'reload schema';

-- Storage buckets for headshots, banners, and portfolio (critical for uploads)
insert into storage.buckets (id, name, public) values ('headshots', 'headshots', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('banners', 'banners', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

-- Storage policies for headshots bucket
create policy "Anyone can view headshots" on storage.objects for select using (bucket_id = 'headshots');
create policy "Authenticated users can upload headshots" on storage.objects for insert with check (bucket_id = 'headshots' and auth.role() = 'authenticated');
create policy "Users can update own headshots" on storage.objects for update using (bucket_id = 'headshots' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own headshots" on storage.objects for delete using (bucket_id = 'headshots' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for banners bucket
create policy "Anyone can view banners" on storage.objects for select using (bucket_id = 'banners');
create policy "Authenticated users can upload banners" on storage.objects for insert with check (bucket_id = 'banners' and auth.role() = 'authenticated');
create policy "Users can update own banners" on storage.objects for update using (bucket_id = 'banners' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own banners" on storage.objects for delete using (bucket_id = 'banners' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for portfolio bucket
create policy "Anyone can view portfolio files" on storage.objects for select using (bucket_id = 'portfolio');
create policy "Authenticated users can upload portfolio files" on storage.objects for insert with check (bucket_id = 'portfolio' and auth.role() = 'authenticated');
create policy "Users can update own portfolio files" on storage.objects for update using (bucket_id = 'portfolio' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own portfolio files" on storage.objects for delete using (bucket_id = 'portfolio' and auth.uid()::text = (storage.foldername(name))[1]);

-- Shared Gallery table
create table public.gallery_items (
  id uuid default gen_random_uuid() primary key,
  uploaded_by uuid references public.profiles on delete set null,
  title text not null default '',
  description text default '',
  image_url text not null,
  category text default 'general',
  is_featured boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.gallery_items enable row level security;

create policy "Gallery items are viewable by everyone"
  on public.gallery_items for select using (true);

create policy "Authenticated users can upload to gallery"
  on public.gallery_items for insert with check (auth.role() = 'authenticated');

create policy "Users can update own gallery items"
  on public.gallery_items for update using (auth.uid() = uploaded_by);

create policy "Users can delete own gallery items"
  on public.gallery_items for delete using (auth.uid() = uploaded_by);

create policy "Admins can update any gallery item"
  on public.gallery_items for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete any gallery item"
  on public.gallery_items for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Storage bucket for gallery
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "Anyone can view gallery images" on storage.objects for select using (bucket_id = 'gallery');
create policy "Authenticated users can upload gallery images" on storage.objects for insert with check (bucket_id = 'gallery' and auth.role() = 'authenticated');
create policy "Users can update own gallery images" on storage.objects for update using (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own gallery images" on storage.objects for delete using (bucket_id = 'gallery' and auth.uid()::text = (storage.foldername(name))[1]);

NOTIFY pgrst, 'reload schema';
