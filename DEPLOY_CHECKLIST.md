# 🚀 Deployment Checklist for Film Club Platform

**Goal**: Deploy a 100% functional site today with intuitive navigation and working uploads.

---

## ✅ Pre-Deployment Checklist

### 1. Supabase Setup

#### Database Migrations
- [ ] Create a new Supabase project at [supabase.com](https://supabase.com)
- [ ] Copy Project URL and anon key from **Settings → API**
- [ ] Go to **SQL Editor** in Supabase dashboard
- [ ] Run the entire `supabase/all_migrations.sql` file (click **Run**)
- [ ] Verify no errors in the output
- [ ] **CRITICAL**: Storage buckets (`headshots`, `portfolio`, `banners`) are now created automatically by the migration

#### Auth Configuration
- [ ] Go to **Authentication → URL Configuration**
- [ ] Set **Site URL** to your deployment URL (e.g., `https://your-site.vercel.app`)
- [ ] Add to **Redirect URLs**: `https://your-site.vercel.app/**`
- [ ] Save changes

#### Verify Storage Buckets (Optional Check)
- [ ] Go to **Storage** in Supabase dashboard
- [ ] Confirm these buckets exist:
  - `headshots` (public)
  - `portfolio` (public)
  - `banners` (public)
- [ ] If missing, the migration didn't run fully — re-run `all_migrations.sql`

---

### 2. Code Repository

- [ ] Push code to GitHub (create new repo if needed)
- [ ] Ensure `.env.local` is in `.gitignore` (it already is)
- [ ] Verify `netlify.toml` or Vercel config is present

---

### 3. Hosting Deployment (Vercel or Netlify)

#### For Vercel:
- [ ] Go to [vercel.com](https://vercel.com) and sign in with GitHub
- [ ] Click **Add New → Project**
- [ ] Import your GitHub repo
- [ ] Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJ...` (your anon key)
- [ ] Click **Deploy**
- [ ] Wait ~2 minutes for build to complete

#### For Netlify:
- [ ] Go to [netlify.com](https://netlify.com) and sign in with GitHub
- [ ] Click **Add new site → Import an existing project**
- [ ] Select your GitHub repo
- [ ] Build settings should auto-detect (Next.js)
- [ ] Add environment variables (same as Vercel above)
- [ ] Click **Deploy**

---

### 4. Post-Deployment Configuration

- [ ] Copy your live site URL (e.g., `https://your-project.vercel.app`)
- [ ] Go back to Supabase → **Authentication → URL Configuration**
- [ ] Update **Site URL** to your live URL
- [ ] Update **Redirect URLs** to `https://your-live-url.com/**`
- [ ] Save changes

---

### 5. Create Admin Account

- [ ] Visit your live site
- [ ] Click **Enter** → **Sign Up**
- [ ] Use your email and create a password
- [ ] Check your email for confirmation link (Supabase sends it)
- [ ] Click the confirmation link
- [ ] Go to Supabase dashboard → **Table Editor → profiles**
- [ ] Find your profile row
- [ ] Set `is_admin` to `true`
- [ ] Refresh your site
- [ ] Verify you can access **Admin** panel from dashboard

---

## 🧪 End-to-End Testing (Critical!)

### Test 1: Sign Up & Profile Creation
- [ ] Sign up with a test account
- [ ] Verify profile is auto-created (check dashboard)
- [ ] Edit profile: add name, role, bio
- [ ] Upload headshot (drag & drop or click)
- [ ] Upload banner image
- [ ] Save profile
- [ ] Verify no errors in browser console

### Test 2: Portfolio Upload
- [ ] Go to **Dashboard → Portfolio**
- [ ] Click **Upload Images** or drag images
- [ ] Verify upload progress indicator shows
- [ ] Verify images appear after upload
- [ ] Add title and description to an item
- [ ] Click **Save All**
- [ ] Verify no errors

### Test 3: Public Profile View
- [ ] Go to **Dashboard**
- [ ] Click **View Public Profile**
- [ ] Verify headshot, banner, bio all display
- [ ] Verify portfolio items are visible
- [ ] Click **Back to Members**
- [ ] Verify you return to members page

### Test 4: Page Builder (Sections)
- [ ] Go to **Dashboard → Customize Layout** (or `/dashboard/sections`)
- [ ] Upload headshot/banner if not done
- [ ] Click **Add Work** → upload an image
- [ ] Create a new section (click presets)
- [ ] Drag an item into the section
- [ ] Click **Save All**
- [ ] View public profile to verify layout

### Test 5: Mobile Experience
- [ ] Open site on mobile (or use browser dev tools)
- [ ] Test navigation menu (hamburger)
- [ ] Test image upload (file picker should work)
- [ ] Verify buttons are tappable (not too small)
- [ ] Test scrolling and touch interactions

---

## 🐛 Common Issues & Fixes

### "Bucket not found" error when uploading
**Cause**: Storage buckets weren't created  
**Fix**: Re-run `supabase/all_migrations.sql` in SQL Editor

### Login redirects to wrong URL
**Cause**: Auth redirect URLs not configured  
**Fix**: Update Site URL and Redirect URLs in Supabase → Authentication → URL Configuration

### Images upload but don't display
**Cause**: Bucket is not public or RLS policies missing  
**Fix**: Check Storage → Policies in Supabase dashboard. Policies should exist for `headshots`, `portfolio`, `banners`

### "Could not find table in schema cache"
**Cause**: PostgREST cache needs refresh  
**Fix**: Run `NOTIFY pgrst, 'reload schema';` in SQL Editor

### Members not appearing on public page
**Cause**: Profile `is_visible` is false  
**Fix**: Admin panel → toggle visibility, or user sets it in profile settings

### Users can't stay logged in / session expires immediately
**Cause**: Environment variables not set in deployment → middleware can't refresh sessions  
**Fix**: **CRITICAL** - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel/Netlify environment variables. Redeploy after adding them.

---

## 📱 Navigation Flow Reference

### User Journey (New Member):
1. **Home** → Click "Enter" → **Sign Up**
2. **Dashboard** → Shows profile completeness
3. **Dashboard** → "Edit Profile" → **Profile Editor**
   - Breadcrumb: `Dashboard / Edit Profile`
   - Save → "Next: Add Your Work" button
4. **Portfolio** → Upload images/videos
   - Breadcrumb: `Dashboard / Portfolio`
   - After adding work → "Customize Layout" CTA appears
5. **Page Builder** → Arrange sections, customize layout
   - Breadcrumb: `Dashboard / Page Builder`
6. **View Public Profile** → See final result
   - "Back to Members" button returns to gallery

### Admin Journey:
1. **Dashboard** → "Admin" button (top right)
2. **Admin Panel** → Manage members, roles, visibility
3. Back to **Dashboard** via breadcrumb

---

## ✨ UX Improvements Implemented

- **Breadcrumb navigation** on all dashboard pages (Dashboard / Page Name)
- **Larger touch targets** for mobile (44px minimum)
- **Active state feedback** on buttons (`active:scale-95`)
- **Progressive CTAs**: "Next: Add Your Work" → "Customize Layout"
- **Clear back buttons** with hover states
- **Consistent spacing** between action buttons
- **Visual hierarchy**: Primary actions use accent color, secondary use borders

---

## 🎯 Final Pre-Launch Checklist

- [ ] All environment variables set in hosting provider
- [ ] Supabase Auth URLs match live site
- [ ] Admin account created and verified
- [ ] Test uploads work (headshot, banner, portfolio)
- [ ] Public profiles are viewable
- [ ] Mobile navigation works
- [ ] No console errors on key pages
- [ ] README updated with correct deployment steps

---

## 🚨 Emergency Rollback

If something breaks after deployment:

1. **Vercel/Netlify**: Go to Deployments → click previous deployment → "Promote to Production"
2. **Supabase**: Database changes are harder to rollback — test thoroughly before deploying!
3. **Check logs**: Vercel/Netlify Functions logs, Browser console, Supabase logs

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Support**: https://vercel.com/support
- **Netlify Support**: https://docs.netlify.com

---

**Last Updated**: After storage bucket fix and navigation improvements
**Status**: ✅ Ready for deployment
