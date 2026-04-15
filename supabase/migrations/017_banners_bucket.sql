-- Add banners storage bucket (critical for banner image uploads)
insert into storage.buckets (id, name, public) values ('banners', 'banners', true)
on conflict (id) do nothing;

-- Storage policies for banners bucket
create policy "Anyone can view banners" on storage.objects for select using (bucket_id = 'banners');
create policy "Authenticated users can upload banners" on storage.objects for insert with check (bucket_id = 'banners' and auth.role() = 'authenticated');
create policy "Users can update own banners" on storage.objects for update using (bucket_id = 'banners' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own banners" on storage.objects for delete using (bucket_id = 'banners' and auth.uid()::text = (storage.foldername(name))[1]);

NOTIFY pgrst, 'reload schema';
