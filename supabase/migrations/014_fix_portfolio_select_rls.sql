-- Fix: Allow users to view their own portfolio items regardless of profile visibility
-- The original policy only allowed viewing items of visible profiles,
-- which broke the portfolio editor for users whose profile isn't visible yet.

drop policy if exists "Portfolio items are viewable by everyone" on public.portfolio_items;

create policy "Portfolio items are viewable by everyone or owner"
  on public.portfolio_items for select
  using (
    auth.uid() = profile_id
    or exists (
      select 1 from public.profiles
      where profiles.id = portfolio_items.profile_id
      and profiles.is_visible = true
    )
  );

-- Also allow users to view their own profile (for dashboard, even if not visible)
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

NOTIFY pgrst, 'reload schema';
