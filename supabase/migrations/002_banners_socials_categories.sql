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
