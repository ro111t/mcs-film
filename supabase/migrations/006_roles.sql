-- Add member_role column to profiles (admin, officer, member)
-- Keeps is_admin for backward compat; member_role is the source of truth going forward
alter table public.profiles
  add column if not exists member_role text not null default 'member'
  check (member_role in ('admin', 'officer', 'member'));

-- Backfill: sync existing is_admin = true → member_role = 'admin'
update public.profiles set member_role = 'admin' where is_admin = true;

-- Add RLS policy: admins can read ALL profiles (including hidden ones)
create policy "Admins can read all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.member_role = 'admin')
  );

-- Admins can update any profile (for role assignment, visibility, etc.)
create policy "Admins can update any profile" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.member_role = 'admin')
  );

-- Officers can read all visible profiles (same as public, but also see own hidden)
-- (already covered by existing "Public profiles are viewable" + "Users can update own profile")

NOTIFY pgrst, 'reload schema';
