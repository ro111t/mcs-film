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
