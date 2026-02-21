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
