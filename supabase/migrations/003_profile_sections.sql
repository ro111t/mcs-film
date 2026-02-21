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
