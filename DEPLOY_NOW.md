# 🚀 Deploy Film Club Site - Quick Start Guide

**Time needed**: 20-30 minutes  
**Goal**: Get the site live and working 100% end-to-end

---

## Step 1: Set Up Supabase (5 minutes)

1. Go to **[supabase.com](https://supabase.com)** → Sign up (free)
2. Click **New Project**
   - Name: `film-club` (or whatever you want)
   - Database Password: Create a strong password (save it!)
   - Region: Choose closest to you
   - Click **Create new project** (takes ~2 minutes)

3. **Copy your credentials**:
   - Go to **Settings** (gear icon) → **API**
   - Copy **Project URL** (looks like `https://xxxxx.supabase.co`)
   - Copy **anon public** key (long string starting with `eyJ...`)
   - **SAVE THESE** - you'll need them in Step 3

4. **Run the database migration**:
   - Go to **SQL Editor** (left sidebar)
   - Click **New Query**
   - Open the file `supabase/all_migrations.sql` from this repo
   - Copy the **entire file** and paste into Supabase SQL Editor
   - Click **Run** (bottom right)
   - Wait for "Success" message (should take ~5 seconds)

---

## Step 2: Push Code to GitHub (3 minutes)

If you haven't already:

```bash
cd film-club
git init
git add .
git commit -m "Initial commit"
```

Then:
1. Go to **[github.com](https://github.com)** → Click **+** → **New repository**
2. Name it `film-club` (or whatever)
3. **Don't** initialize with README (we already have code)
4. Click **Create repository**
5. Copy the commands shown and run them:

```bash
git remote add origin https://github.com/YOUR-USERNAME/film-club.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel (5 minutes)

1. Go to **[vercel.com](https://vercel.com)** → Sign up with GitHub (free)
2. Click **Add New** → **Project**
3. Find your `film-club` repo → Click **Import**
4. **CRITICAL**: Add Environment Variables:
   - Click **Environment Variables** dropdown
   - Add these two variables:
   
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: [paste your Project URL from Step 1]
   
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: [paste your anon key from Step 1]
   ```

5. Click **Deploy**
6. Wait ~2 minutes for build to complete
7. **Copy your live URL** (looks like `https://film-club-xxxxx.vercel.app`)

---

## Step 4: Configure Supabase Auth (2 minutes)

**IMPORTANT**: Without this, login won't work!

1. Go back to **Supabase dashboard**
2. Click **Authentication** (left sidebar) → **URL Configuration**
3. Set **Site URL** to your Vercel URL: `https://film-club-xxxxx.vercel.app`
4. Under **Redirect URLs**, click **Add URL** and add:
   ```
   https://film-club-xxxxx.vercel.app/**
   ```
5. Click **Save**

---

## Step 5: Create Your Admin Account (3 minutes)

1. Go to your **live site** (the Vercel URL)
2. Click **Enter** → **Sign up**
3. Enter your email and password
4. **Check your email** for confirmation link (from Supabase)
5. Click the confirmation link
6. Go back to **Supabase dashboard** → **Table Editor** → **profiles** table
7. Find your row (should be the only one)
8. Click the `is_admin` cell → change `false` to `true`
9. Click the checkmark to save
10. **Refresh your site** → You should now see "Admin" button in dashboard

---

## Step 6: Test Everything (5 minutes)

### Test Upload Flow:
1. Go to **Dashboard** → **Edit Profile**
2. Drag & drop a headshot image (or click to upload)
3. Add your name, role, bio
4. Click **Save Profile**
5. Click **Next: Add Your Work**
6. Upload a portfolio image
7. Click **Save All**
8. Click **View Public Profile** (top right of dashboard)
9. Verify everything displays correctly

### Test Login Persistence:
1. **Close the browser tab completely**
2. Open a new tab and go to your site
3. Navigate to `/dashboard`
4. You should **still be logged in** (not redirected to login)

### Test Mobile:
1. Open site on your phone (or use browser dev tools)
2. Test uploading an image
3. Verify buttons are tappable

---

## ✅ You're Done!

Your site is now live at: `https://your-project.vercel.app`

Share this URL with members so they can:
- Sign up
- Build their profiles
- Upload their work

---

## 🐛 Troubleshooting

### "Bucket not found" when uploading images
- **Fix**: Go back to Step 1 and re-run `all_migrations.sql` in Supabase SQL Editor

### Can't stay logged in / redirected to login after refresh
- **Fix**: Verify environment variables are set in Vercel (Step 3)
- Go to Vercel → Your Project → Settings → Environment Variables
- Make sure both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are there
- If missing, add them and click **Redeploy** (Deployments tab → click ⋯ → Redeploy)

### Login redirects to wrong page
- **Fix**: Check Step 4 - make sure Site URL and Redirect URLs match your Vercel URL exactly

### Images upload but don't display
- **Fix**: Check Supabase → Storage → Buckets
- Should see: `headshots`, `portfolio`, `banners` (all public)
- If missing, re-run the migration

---

## 📞 Need Help?

Check the detailed `DEPLOY_CHECKLIST.md` for more troubleshooting steps.

**Common issues are usually**:
1. Environment variables not set in Vercel
2. Auth redirect URLs not configured in Supabase
3. Migration didn't run fully

---

**Last Updated**: After session persistence fix  
**Estimated Total Time**: 20-30 minutes  
**Status**: ✅ Ready to deploy
