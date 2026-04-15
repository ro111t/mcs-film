# 🧪 Pre-Deployment Test Checklist

**Testing locally at**: http://localhost:3001  
**Date**: April 14, 2026

---

## ⚠️ CRITICAL: Run Migration First

Before testing, you MUST run the new migration in Supabase:

1. Go to https://supabase.com → Your project
2. Click **SQL Editor**
3. Copy contents of `supabase/migrations/016_shared_gallery.sql`
4. Paste and click **Run**
5. Verify success (no errors)

**Or** run the entire `supabase/all_migrations.sql` if you haven't already.

---

## 📋 Test Plan

### Phase 1: New Features (Shared Gallery)

#### Test 1.1: Public Gallery View
- [ ] Go to http://localhost:3001/gallery
- [ ] Page loads without errors
- [ ] Shows empty state if no items
- [ ] "Upload to Gallery" button visible if logged in
- [ ] Navigation links work

**Expected**: Clean gallery page, no console errors

#### Test 1.2: Gallery Upload (Member)
- [ ] Sign up or log in as regular user
- [ ] Go to /dashboard/gallery
- [ ] Breadcrumb shows "Dashboard / Gallery"
- [ ] Upload area visible
- [ ] Drag & drop an image
- [ ] Image uploads successfully
- [ ] Can add title and description
- [ ] Click "Save All"
- [ ] Changes persist after refresh

**Expected**: Upload works, no errors, image appears in gallery

#### Test 1.3: Gallery Admin Features
- [ ] Log in as admin (set is_admin=true in Supabase)
- [ ] Go to /dashboard/gallery
- [ ] Can see all uploaded items (not just own)
- [ ] Star icon visible on items
- [ ] Click star to feature item
- [ ] Can edit any item's title/description
- [ ] Can delete any item
- [ ] Featured items show "Featured" badge on public gallery

**Expected**: Admin can manage all gallery items

---

### Phase 2: Page Export Feature

#### Test 2.1: Export Button Visibility
- [ ] Go to /members
- [ ] Click any member profile
- [ ] "Export" button visible next to name
- [ ] Button has download icon

**Expected**: Export button present and styled correctly

#### Test 2.2: Export Page Rendering
- [ ] Click "Export" button
- [ ] New tab opens with /members/[id]/export
- [ ] Page shows print-optimized layout
- [ ] Headshot displays (if uploaded)
- [ ] Bio and role display
- [ ] Portfolio images display in grid
- [ ] Custom sections display
- [ ] "Download PDF" button visible (top right)

**Expected**: Clean print layout, all content visible

#### Test 2.3: PDF Download
- [ ] On export page, click "Download PDF"
- [ ] Browser print dialog opens
- [ ] Preview shows clean layout
- [ ] Can save as PDF
- [ ] PDF looks professional (black & white, good spacing)

**Expected**: Print dialog works, PDF exports cleanly

---

### Phase 3: Existing Features (Regression Testing)

#### Test 3.1: Sign Up & Login
- [ ] Sign up with new email
- [ ] Receive confirmation email
- [ ] Click confirmation link
- [ ] Redirected to dashboard
- [ ] Log out
- [ ] Log back in
- [ ] Session persists (don't get logged out on refresh)

**Expected**: Auth flow works, sessions persist

#### Test 3.2: Profile Editing
- [ ] Go to /dashboard/profile
- [ ] Upload headshot (drag & drop)
- [ ] Upload banner
- [ ] Fill in name, role, bio
- [ ] Click "Save Profile"
- [ ] Success message appears
- [ ] Changes persist after refresh
- [ ] "Next: Add Your Work" button visible

**Expected**: Profile editing works, uploads successful

#### Test 3.3: Portfolio Upload
- [ ] Go to /dashboard/portfolio
- [ ] Upload multiple images
- [ ] Add titles and descriptions
- [ ] Add video embed (YouTube URL)
- [ ] Click "Save All"
- [ ] Items appear in grid
- [ ] "Customize Layout" CTA appears

**Expected**: Portfolio uploads work, no errors

#### Test 3.4: Page Builder (Sections)
- [ ] Go to /dashboard/sections
- [ ] Create new section (click preset)
- [ ] Drag portfolio item into section
- [ ] Reorder sections
- [ ] Click "Save All"
- [ ] View public profile
- [ ] Sections display correctly

**Expected**: Sections work, drag & drop functional

#### Test 3.5: Public Profile View
- [ ] Go to /members
- [ ] Click your profile
- [ ] Headshot displays
- [ ] Banner displays
- [ ] Bio displays
- [ ] Portfolio items display
- [ ] Custom sections display
- [ ] "Back to Members" button works

**Expected**: Public profile renders correctly

---

### Phase 4: Navigation & UX

#### Test 4.1: Navbar Links
- [ ] "Members" link works
- [ ] "Gallery" link works (NEW)
- [ ] "Chapters" link works
- [ ] Dashboard links work (Feed, Events, Jobs)
- [ ] Mobile menu works (hamburger icon)
- [ ] All links in mobile menu work

**Expected**: All navigation functional

#### Test 4.2: Breadcrumbs
- [ ] Profile page: "Dashboard / Edit Profile"
- [ ] Portfolio page: "Dashboard / Portfolio"
- [ ] Sections page: "Dashboard / Page Builder"
- [ ] Gallery page: "Dashboard / Gallery" (NEW)
- [ ] Breadcrumb links clickable

**Expected**: Breadcrumbs show correct paths

#### Test 4.3: Mobile Responsiveness
- [ ] Open dev tools → mobile view (iPhone 12)
- [ ] Test image upload on mobile
- [ ] Test navigation menu
- [ ] Test buttons (touch targets adequate)
- [ ] Test gallery grid on mobile
- [ ] Test export page on mobile

**Expected**: Site works well on mobile

---

### Phase 5: Error Handling

#### Test 5.1: Upload Errors
- [ ] Try uploading non-image file to gallery
- [ ] Error message displays
- [ ] Try uploading very large file (>10MB)
- [ ] Appropriate error handling

**Expected**: Graceful error messages

#### Test 5.2: Network Errors
- [ ] Disconnect internet
- [ ] Try to save profile
- [ ] Error message displays
- [ ] Reconnect internet
- [ ] Retry works

**Expected**: Network errors handled gracefully

#### Test 5.3: Permission Errors
- [ ] Log in as non-admin
- [ ] Try to access /admin
- [ ] Redirected to dashboard
- [ ] Try to edit another user's gallery item
- [ ] Should not be able to

**Expected**: Permissions enforced correctly

---

## 🐛 Bug Tracking

### Bugs Found:
1. 
2. 
3. 

### Bugs Fixed:
1. 
2. 
3. 

---

## ✅ Final Checklist Before Deployment

- [ ] All new features tested and working
- [ ] All existing features still work (no regressions)
- [ ] No console errors on any page
- [ ] Mobile experience tested
- [ ] All bugs fixed
- [ ] Code committed and pushed to GitHub
- [ ] Migration file ready for teammate
- [ ] USER_GUIDE.md reviewed and accurate

---

## 🚀 Ready to Deploy?

If all tests pass:
1. Commit any bug fixes
2. Push to GitHub
3. Send teammate DEPLOYMENT_NOTES.md
4. Have them run migration and deploy

**Estimated testing time**: 30-45 minutes for thorough testing
