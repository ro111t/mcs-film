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
