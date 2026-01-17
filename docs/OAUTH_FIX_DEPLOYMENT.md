# Google OAuth Authentication Fix - Deployment Guide

## Problem Summary

Users clicking "Sign in with Google" were experiencing:
1. No redirect after Google auth completes
2. Second click showing "Reset Your Password" page with timeout error
3. Authentication not persisting despite successful OAuth

## Root Causes Identified

1. **Missing Profile Creation**: No database trigger to auto-create profiles for OAuth users
2. **Callback Handler Issues**: Wrong redirect paths for different auth types
3. **Session/Profile Mismatch**: Auth session existed but profile didn't, causing AuthContext to fail

## Solution Components

### 1. Database Migration (Required First)

**File**: `supabase/migrations/20250105_fix_oauth_profile_creation.sql`

This migration:
- Creates a trigger on `auth.users` table
- Automatically creates profiles when users sign up via any method
- Backfills any existing users without profiles
- Handles Google OAuth user metadata (name, avatar)

**Deploy**: Run this migration in Supabase Dashboard â†’ SQL Editor

### 2. Auth Callback Handler Enhancement

**File**: `src/app/auth/callback/route.ts`

Changes:
- Added detailed logging for debugging
- Added profile existence check after OAuth code exchange
- Manual profile creation as fallback if trigger fails
- Proper handling of recovery tokens (redirects to reset-password)
- Separated OAuth flow from email confirmation flow

### 3. AuthContext Resilience

**File**: `src/contexts/AuthContext.tsx`

Changes:
- Added profile creation fallback in `fetchProfile()`
- Detects missing profile error (PGRST116)
- Attempts to create profile with user metadata
- Logs all steps for debugging

## Deployment Steps

### Step 1: Run Database Migration

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `qcqxcffgfdsqfrwwvabh`
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy contents of `supabase/migrations/20250105_fix_oauth_profile_creation.sql`
6. Click **Run** button
7. Verify: Check for success message

### Step 2: Deploy Code Changes

```bash
# From project root
git add .
git commit -m "fix: Resolve Google OAuth authentication issues

- Add database trigger for auto-profile creation
- Enhance auth callback with profile fallback
- Add AuthContext resilience for missing profiles
- Separate OAuth and recovery flows"
git push origin main
```

Vercel will auto-deploy in 1-2 minutes.

### Step 3: Verify Google OAuth Configuration in Supabase

1. Go to Supabase Dashboard â†’ **Authentication** â†’ **Providers**
2. Check **Google** provider is enabled
3. Verify redirect URL: `https://qcqxcffgfdsqfrwwvabh.supabase.co/auth/v1/callback`
4. Confirm Client ID and Secret are set

### Step 4: Test the Fix

#### Test 1: New User OAuth Signup
1. Open incognito window
2. Go to https://www.bestofgoa.com/login
3. Click "Continue with Google"
4. Complete Google auth
5. Should redirect to `/dashboard` successfully
6. Check browser console for logs:
   - `[Auth Callback] Code exchange result: { success: true }`
   - `[AuthContext] Profile fetched: Success`

#### Test 2: Existing User OAuth Login
1. Use account that previously had issues
2. Click "Sign in with Google"
3. Should work immediately without profile creation logs

#### Test 3: Profile Existence Verification
```sql
-- Run in Supabase SQL Editor
SELECT
  u.id,
  u.email,
  u.created_at as auth_created,
  p.id as profile_id,
  p.full_name,
  p.is_admin
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 20;
```

All users should have matching profiles.

## Debugging

### Check Browser Console Logs

After clicking "Sign in with Google", look for these logs:

```
[Auth Callback] Received: { code: true, token_hash: false, type: null, next: '/dashboard' }
[Auth Callback] Processing PKCE code exchange...
[Auth Callback] Code exchange result: { success: true, userId: 'xxx' }
[Auth Callback] Redirecting to: https://www.bestofgoa.com/dashboard
[AuthContext] Starting auth initialization...
[AuthContext] Session retrieved: User logged in
[AuthContext] Fetching user profile...
[AuthContext] Profile fetched: Success
```

### Check Vercel Logs

1. Go to Vercel Dashboard
2. Select project
3. Click **Functions** tab
4. Filter for `/auth/callback` function
5. Look for error logs

### Check Supabase Logs

1. Go to Supabase Dashboard â†’ **Logs** â†’ **Postgres Logs**
2. Filter for "handle_new_user"
3. Verify trigger is firing on user creation

## Rollback Plan

If issues occur:

1. **Revert code changes**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Remove trigger** (SQL Editor):
   ```sql
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   DROP FUNCTION IF EXISTS public.handle_new_user();
   ```

## Known Limitations

1. **Existing broken sessions**: Users with existing broken sessions may need to sign out and sign in again
2. **Profile metadata**: Only pulls `full_name`, `name`, and `avatar_url` from Google
3. **Admin status**: New users default to `is_admin = false`

## Success Criteria

- âœ… New users can sign up with Google OAuth in one click
- âœ… Existing users can sign in with Google OAuth without errors
- âœ… All users have corresponding profiles in database
- âœ… No "Reset Password" page shown for OAuth users
- âœ… Dashboard loads immediately after OAuth
- âœ… User avatar and name display correctly

## Support

If issues persist:
1. Check browser console logs
2. Check Vercel function logs
3. Check Supabase auth logs
4. Verify environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Related Files

- `src/app/auth/callback/route.ts` - OAuth callback handler
- `src/contexts/AuthContext.tsx` - Client-side auth state
- `src/lib/supabase/server-auth.ts` - Server-side auth client
- `src/components/login-form.tsx` - Login UI
- `supabase/migrations/20250105_fix_oauth_profile_creation.sql` - Database trigger
