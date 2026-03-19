-- Custom named roles with granular permissions
-- e.g. "President" with all permissions, "Developer" with manage_members, etc.

alter table public.profiles
  add column if not exists team_role_name text default null;

alter table public.profiles
  add column if not exists team_permissions jsonb default '{}'::jsonb;

-- Permissions stored as JSON keys:
--   can_manage_events    (create/edit events)
--   can_manage_jobs      (post job listings)
--   can_manage_feed      (pin/delete posts, post announcements)
--   can_manage_members   (toggle visibility, view all profiles)
--   can_manage_seasons   (create/edit curated seasons)
--   can_manage_roles     (assign roles to others — admin-level only)

NOTIFY pgrst, 'reload schema';
