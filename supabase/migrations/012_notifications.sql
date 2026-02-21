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
