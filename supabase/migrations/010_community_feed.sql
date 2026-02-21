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
