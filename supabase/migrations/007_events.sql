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
