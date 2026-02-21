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
