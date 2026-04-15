# 🚀 Deployment Notes for Tomorrow's Meeting

**Date**: April 14, 2026  
**Meeting**: 30 people testing the site  
**Deadline**: Tomorrow

---

## ✅ What's Been Added (New Features)

### 1. Shared Gallery
- **Public page**: `/gallery` - Everyone can view
- **Upload page**: `/dashboard/gallery` - Members upload, admins edit all
- **Features**:
  - Members can upload images with title/description
  - Admins can feature items (star icon)
  - Admins can edit/delete any item
  - Shows uploader name on hover
  - Drag & drop upload support

### 2. Page Export for Gallery Book
- **Export page**: `/members/[id]/export` - Print-ready layout
- **Features**:
  - Click "Export" button on any member profile
  - Optimized for 8.5x11" printing
  - Clean black & white layout
  - Includes headshot, bio, portfolio grid
  - "Download PDF" button triggers browser print dialog
  - Perfect for creating a physical gallery book

### 3. Navigation Updates
- Added "Gallery" link to navbar (desktop & mobile)
- Export button on member profiles
- Gallery upload accessible from dashboard

---

## 📋 Deployment Steps for Your Teammate

### 1. Pull Latest Code
```bash
cd film-club
git pull origin main
```

### 2. Run New Migration in Supabase
**CRITICAL**: The `gallery_items` table and `gallery` storage bucket must be created.

**Option A - Run full migration** (if fresh database):
- Go to Supabase → SQL Editor
- Run entire `supabase/all_migrations.sql` file

**Option B - Run only new migration** (if database already exists):
- Go to Supabase → SQL Editor
- Run `supabase/migrations/016_shared_gallery.sql` file

**Verify**:
- Go to Supabase → Table Editor → Check `gallery_items` table exists
- Go to Supabase → Storage → Check `gallery` bucket exists (should be public)

### 3. Deploy to Vercel/Netlify
If already deployed, Vercel should auto-deploy from GitHub push.

**Manual deploy**:
- Vercel: Go to project → Deployments → Redeploy
- Netlify: Go to Deploys → Trigger deploy

**Verify environment variables are still set**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Test Before Meeting
**Critical tests** (5 minutes):
1. Sign up with test account
2. Upload to shared gallery (`/dashboard/gallery`)
3. View gallery (`/gallery`)
4. Go to member profile → click "Export" → verify PDF download works
5. Test on mobile browser

---

## 🎯 What to Tell the 30 People Tomorrow

### Quick Onboarding (5 min presentation):
1. **Sign up**: Go to site → Enter → Sign up → confirm email
2. **Complete profile**: Upload headshot, add role & bio
3. **Add work**: Upload to portfolio OR shared gallery
4. **Export**: Click "Export" on your profile to get print-ready page

### Hand out the USER_GUIDE.md
- It's in the repo root
- Print copies or share link
- Covers all features step-by-step

---

## 🔥 Known Issues / Edge Cases

### Session Persistence
- **Fixed**: Middleware now properly refreshes sessions
- Users should stay logged in across page refreshes
- If not, verify env vars are set in deployment

### Storage Buckets
- **Fixed**: All buckets auto-created by migration
- If uploads fail, re-run migration in Supabase

### Mobile Upload
- Works on iOS Safari and Android Chrome
- Drag & drop works on mobile browsers
- Camera roll access works

---

## 📊 Expected Load Tomorrow

**30 people simultaneously**:
- Supabase free tier: 500MB database, 1GB storage (should be fine)
- Vercel free tier: 100GB bandwidth/month (plenty for 30 users)
- If site is slow, it's likely image sizes (ask users to compress)

**Recommendations**:
- Ask users to keep images under 2MB
- If many people upload at once, uploads may queue (normal)
- Have backup plan: collect emails if site goes down

---

## 🎨 Features Working End-to-End

✅ Sign up & login (session persists)  
✅ Profile editing (headshot, banner, bio)  
✅ Portfolio uploads (images & video embeds)  
✅ Page builder (custom sections, drag & drop)  
✅ **Shared gallery** (member uploads, admin editing)  
✅ **Page export** (print-ready PDF)  
✅ Public member profiles  
✅ Admin panel (member management)  
✅ Mobile responsive  

---

## 🆘 Troubleshooting During Meeting

### "Can't upload to gallery"
- Check: Is user logged in?
- Check: Did migration run? (gallery_items table exists?)
- Check: Storage bucket exists and is public?

### "Export button doesn't work"
- Should open new tab with print layout
- Click "Download PDF" to trigger print dialog
- Works in all modern browsers

### "Images not loading"
- Check: Supabase storage buckets are public
- Check: RLS policies allow SELECT for everyone
- Try: Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### "Can't stay logged in"
- Check: Environment variables set in Vercel/Netlify
- Check: Auth redirect URLs configured in Supabase
- Workaround: Keep tab open, don't close browser

---

## 📞 Emergency Contacts

**If site goes down during meeting**:
1. Check Vercel/Netlify status page
2. Check Supabase status page
3. Redeploy from Vercel dashboard
4. Worst case: Collect emails, follow up later

---

## ✨ Post-Meeting TODO

After the meeting, consider:
- [ ] Review uploaded gallery items
- [ ] Feature best gallery items (admin)
- [ ] Export all member pages for physical book
- [ ] Collect feedback on UX
- [ ] Add any requested features

---

**Repository**: https://github.com/ro111t/mcs-film  
**Latest Commit**: "Add shared gallery, member uploads, and page export for gallery book"

**Status**: ✅ Ready for deployment  
**Tested**: Core features working  
**Documentation**: USER_GUIDE.md included
