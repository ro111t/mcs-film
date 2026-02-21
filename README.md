# Frank — MCS Club Platform

A community platform for film & media club members to create profiles, showcase portfolios, and be discovered. Members create/edit their own content; anyone can browse publicly.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Database & Auth:** Supabase (PostgreSQL + Auth + Storage)
- **Icons:** Lucide React
- **Hosting:** Vercel (free tier)

---

## Deployment Guide

> Everything below uses **free tiers**. Total cost: $0/month.

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free).
2. Click **New Project**. Pick any name and region. Set a database password (save it somewhere).
3. Wait for the project to finish provisioning (~1 min).
4. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### Step 2 — Run Database Migrations

Go to **SQL Editor** in your Supabase dashboard. Run these files **in order**, one at a time. Copy the full contents of each file and click **Run**:

1. `supabase/migrations/001_init.sql` — creates profiles & portfolio tables
2. `supabase/migrations/002_banners_socials_categories.sql` — adds banners, social links, categories
3. `supabase/migrations/003_profile_sections.sql` — adds customizable profile sections & per-item display controls
4. `supabase/migrations/004_profile_views.sql` — adds profile view tracking & analytics
5. `supabase/migrations/005_reports.sql` — content reporting / flagging system
6. `supabase/migrations/006_roles.sql` — 3-tier role system (admin / officer / member)
7. `supabase/migrations/007_events.sql` — events, meetings, RSVPs
8. `supabase/migrations/008_skills_gear.sql` — member skills, gear, availability
9. `supabase/migrations/009_job_listings.sql` — crew board, job listings & applications
10. `supabase/migrations/010_community_feed.sql` — posts, comments, likes
11. `supabase/migrations/011_seasons.sql` — curated seasons & collections
12. `supabase/migrations/012_notifications.sql` — in-app notification system
13. `supabase/migrations/013_chapters.sql` — multi-chapter / multi-school tenancy

After running all 13, run this one extra command to refresh the API cache:

```sql
NOTIFY pgrst, 'reload schema';
```

### Step 3 — Create Storage Buckets

Still in the **SQL Editor**, run this to create all three storage buckets and their access policies:

```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('headshots', 'headshots', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;

-- Headshots policies
CREATE POLICY "Anyone can view headshots" ON storage.objects FOR SELECT USING (bucket_id = 'headshots');
CREATE POLICY "Authenticated users can upload headshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'headshots' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own headshots" ON storage.objects FOR UPDATE USING (bucket_id = 'headshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own headshots" ON storage.objects FOR DELETE USING (bucket_id = 'headshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Portfolio policies
CREATE POLICY "Anyone can view portfolio files" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "Authenticated users can upload portfolio files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolio' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own portfolio files" ON storage.objects FOR UPDATE USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own portfolio files" ON storage.objects FOR DELETE USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Banners policies
CREATE POLICY "Anyone can view banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Authenticated users can upload banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own banners" ON storage.objects FOR UPDATE USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own banners" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
```

> If you get "policy already exists" errors, that's fine — it means the migration already created some of these. Just continue.

### Step 4 — Deploy to Vercel

1. Push this repo to **GitHub** (create a new repo, push all files).
2. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account (free).
3. Click **Add New → Project** and import the repo.
4. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL` → paste your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → paste your anon key
5. Click **Deploy**. Wait ~2 minutes.
6. Your site is now live at `https://your-project.vercel.app`.

### Step 5 — Configure Supabase Auth (Important!)

1. In Supabase, go to **Authentication → URL Configuration**.
2. Set **Site URL** to your Vercel URL: `https://your-project.vercel.app`
3. Add these to **Redirect URLs**:
   - `https://your-project.vercel.app/**`

> Without this step, login/signup won't redirect properly.

### Step 6 — Create Your Admin Account

1. Go to your live site and click **Enter** → sign up with your email.
2. Check your email and confirm the signup (Supabase sends a confirmation link).
3. In the Supabase dashboard, go to **Table Editor → profiles**.
4. Find your row and set `is_admin` to `true`.
5. Refresh the site. You now have access to the **Admin Panel** from the dashboard.

### Step 7 — Invite Members

Share the site URL. Members sign up, build their profiles, and upload work. As admin, you can:
- Toggle member visibility (who appears on the public members page)
- Assign admin roles to other officers
- Access the admin panel from the dashboard

---

## Running Locally (Optional)

Only needed if you want to develop or test changes before deploying.

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd film-club

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local and add your Supabase URL + anon key

# 4. Start dev server
npm run dev
# Open http://localhost:3000
```

---

## Custom Domain (Optional, ~$12/year)

1. Buy a domain (Namecheap, Google Domains, Cloudflare, etc.)
2. In Vercel → your project → **Settings → Domains** → add your domain
3. Update DNS records as Vercel instructs
4. Update the **Site URL** in Supabase Auth settings to match your new domain

---

## Project Structure

```
src/
  app/
    page.tsx                    # Public home page
    login/page.tsx              # Login / signup
    members/
      page.tsx                  # Public member gallery
      [id]/page.tsx             # Individual member profile
    dashboard/
      page.tsx                  # Member dashboard + analytics
      profile/page.tsx          # Edit profile (name, bio, socials)
      portfolio/page.tsx        # Manage portfolio items
      sections/page.tsx         # Visual page editor (unified)
      events/page.tsx           # Events & meetings calendar
      feed/page.tsx             # Community feed (posts, comments)
      jobs/page.tsx             # Crew board (job listings)
      skills/page.tsx           # Skills & gear editor
      seasons/page.tsx          # Seasons & curation (officers)
    admin/
      page.tsx                  # Admin panel + flagged content
  components/
    Navbar.tsx                  # Navigation bar
    ProfileCard.tsx             # Member card component
    PortfolioGrid.tsx           # Portfolio display grid
    SectionRenderer.tsx         # Renders custom profile sections
    ViewTracker.tsx             # Tracks profile views
    ReportButton.tsx            # Flag/report content button
  lib/
    supabase/                   # Supabase client helpers
    types.ts                    # TypeScript interfaces
supabase/
  migrations/
    001_init.sql                # Core tables
    002_banners_socials_categories.sql
    003_profile_sections.sql
    004_profile_views.sql
    005_reports.sql             # Content flagging
    006_roles.sql               # Role system
    007_events.sql              # Events & RSVPs
    008_skills_gear.sql         # Member skills & gear
    009_job_listings.sql        # Crew board
    010_community_feed.sql      # Posts, comments, likes
    011_seasons.sql             # Curated collections
    012_notifications.sql       # In-app notifications
    013_chapters.sql            # Multi-chapter tenancy
```

## Features

- **Public browsing** — anyone can view member profiles and portfolios
- **Member auth** — email/password signup and login
- **Profile editing** — name, bio, role, headshot, banner, website, social links
- **Portfolio management** — upload images, embed YouTube/Vimeo videos, categorize work
- **Visual page editor** — drag-and-drop widgets, 5 size presets, customizable layouts
- **Profile sections** — create custom sections (galleries, reels, text blocks, credits)
- **Profile analytics** — view counts, 7-day/30-day trends, unique visitors
- **3-tier roles** — admin, officer, member with role-gated features
- **Events & calendar** — create meetings/shoots/screenings, RSVP, calendar view
- **Community feed** — posts, announcements, questions, comments, likes
- **Skills & gear** — members list their skills and equipment
- **Crew board** — job listings with auto-matching by skills/gear, applications
- **Seasons & curation** — officers create themed collections from member work
- **Content moderation** — flag/report system with admin review panel
- **In-app notifications** — bell icon in navbar, unread badges, polling
- **Multi-chapter** — create chapters for different schools, chapter directory, per-chapter branding
- **Admin panel** — manage members, roles, visibility, flagged content
- **Responsive design** — works on mobile and desktop
- **Dark theme** — cinematic look built for film/media

## Troubleshooting

**"Could not find the table in the schema cache"**
→ Run `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor.

**"Bucket not found" when uploading**
→ Make sure you ran Step 3 (storage buckets). Check Supabase → Storage to confirm `headshots`, `portfolio`, and `banners` buckets exist.

**Login redirects to wrong URL**
→ Update the Site URL and Redirect URLs in Supabase → Authentication → URL Configuration (Step 5).

**Members not appearing on the public page**
→ Admin needs to toggle their visibility in the Admin Panel, or the member needs to set `is_visible` via profile settings.
