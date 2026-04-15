# 🗑️ How to Delete Test Accounts

**When to use**: Before tomorrow's demo to clean up old test accounts and start fresh with 30 real SFSU students.

---

## ✅ Easiest Method: Supabase Dashboard

### Step 1: Go to Authentication
1. Open your Supabase dashboard
2. Click **Authentication** in left sidebar
3. Click **Users** tab

### Step 2: Delete Users One by One
1. Find each test account in the list
2. Click the **three dots (⋯)** next to the user
3. Click **Delete user**
4. Confirm deletion

**This automatically deletes**:
- ✅ Auth user
- ✅ Profile (cascade delete)
- ✅ Portfolio items (cascade delete)
- ✅ Sections (cascade delete)

---

## 🧹 Nuclear Option: Delete ALL Accounts

If you want to completely reset and start fresh, run this in **Supabase SQL Editor**:

```sql
-- WARNING: This deletes EVERYTHING
-- Only run if you want a completely clean slate

-- Delete all auth users (cascades to profiles, portfolio, sections)
DELETE FROM auth.users;

-- Clean up gallery items (they don't cascade)
DELETE FROM public.gallery_items;

-- Clean up storage files (optional)
DELETE FROM storage.objects WHERE bucket_id IN ('headshots', 'banners', 'portfolio', 'gallery');
```

---

## 🎯 Recommended Approach for Tomorrow

### Before the Demo:

1. **Delete all test accounts** (use either method above)
2. **Clean storage** (optional - saves space)
3. **Let 30 students create fresh accounts tomorrow**
4. **After first person signs up**, make them admin:
   ```sql
   UPDATE profiles 
   SET is_admin = true, member_role = 'admin'
   WHERE email = 'admin@sfsu.edu';
   ```

---

## ✅ After Deletion

- Old emails are freed up
- Can sign up again with same emails
- No conflicts with old data
- Clean slate for testing
- Database is ready for 30 fresh accounts

---

## ⚠️ Important Notes

1. **Cascade deletes work** - Deleting auth user automatically deletes profile, portfolio, and sections
2. **Storage files don't auto-delete** - Clean manually if you want to free up space
3. **Gallery items persist** - They just lose the uploader reference (set to null)
4. **Can't recover deleted users** - Make sure you want to delete before confirming

---

## 🚀 Quick Reset Script

For a complete reset before tomorrow:

```sql
-- COMPLETE RESET - Deletes everything
DELETE FROM auth.users;
DELETE FROM public.gallery_items;
DELETE FROM storage.objects WHERE bucket_id IN ('headshots', 'banners', 'portfolio', 'gallery');
```

**Done! Database is clean and ready for 30 fresh SFSU student accounts tomorrow.** 🎉
