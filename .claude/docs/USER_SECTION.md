# User Section Documentation

## Overview
The User Section provides authenticated user features including favorites, itineraries, and submission tracking. Built with Supabase Auth for authentication and Row Level Security (RLS) for data protection.

## Authentication

### Methods
- **Google OAuth** - Primary sign-in method
- **Email/Password** - Alternative sign-in with email verification

### Google OAuth Setup

#### 1. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project "Best of Goa"
3. Navigate to **APIs & Services â†’ Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Configure:
   - **Authorized JavaScript origins:**
     ```
     http://localhost:3000
     https://bestofgoa.com
     ```
   - **Authorized redirect URIs:**
     ```
     https://qcqxcffgfdsqfrwwvabh.supabase.co/auth/v1/callback
     ```
6. Copy **Client ID** and **Client Secret**

#### 2. Supabase Dashboard
1. Go to **Authentication â†’ Providers â†’ Google**
2. Enable Google provider
3. Paste Client ID and Client Secret
4. Verify **Site URL** in Authentication â†’ URL Configuration:
   - Site URL: `https://www.bestofgoa.com`
   - Redirect URLs: `http://localhost:3000/**`, `https://bestofgoa.com/**`

### Environment Variables (Vercel)

**Critical for auth to work in production:**

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qcqxcffgfdsqfrwwvabh.supabase.co` | **YES** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (from Supabase dashboard) | **YES** |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | (for maps) | Recommended |
| `NEXT_PUBLIC_BASE_URL` | `https://www.bestofgoa.com` | Recommended |

**Server-side variables (also needed in Vercel):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `FIRECRAWL_API_KEY`
- `APIFY_API_TOKEN`
- `RESEND_API_KEY`
- `GOOGLE_PLACES_API_KEY`

> **Note:** Without `NEXT_PUBLIC_SUPABASE_*` variables in Vercel, the auth will show infinite loading spinner.

### Components
- `src/contexts/AuthContext.tsx` - Auth state management with React Context
- `src/components/auth/UserMenu.tsx` - User dropdown menu in header
- `src/app/login/page.tsx` - Sign in/sign up page
- `src/app/auth/callback/route.ts` - OAuth callback handler
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/supabase/server-auth.ts` - Server-side auth client
- `src/middleware.ts` - Session refresh middleware

### OAuth Profile Creation (Triple Redundancy - January 2026)
To ensure every OAuth user gets a profile entry, we use **three layers** of profile creation:

1. **Database Trigger** (Primary) - `supabase/migrations/20250105_fix_oauth_profile_creation.sql`
   - Runs automatically on `auth.users` INSERT
   - Extracts full_name and avatar_url from `raw_user_meta_data`
   - Uses `ON CONFLICT DO UPDATE` for safety

2. **Callback Route Check** (Secondary) - `src/app/auth/callback/route.ts`
   - Verifies profile exists after OAuth exchange
   - Creates profile manually if missing
   - Logs warnings for debugging

3. **AuthContext Fallback** (Tertiary) - `src/contexts/AuthContext.tsx`
   - Catches PGRST116 errors (profile not found)
   - Creates profile on-the-fly during session hydration
   - Last-resort safety net

**Migration**: `20250105_fix_oauth_profile_creation.sql`
- Also backfills existing users without profiles
- Safe to run multiple times (idempotent)

### Sign-Out Enhancement (January 2026)
Sign-out uses **hard browser reload** to ensure complete session clearing:

**Implementation** (`src/contexts/AuthContext.tsx`):
```tsx
const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setSession(null);
    // Hard reload clears all cached state/cookies
    window.location.href = '/';
  } catch (error) {
    console.error('[AuthContext] Sign out failed:', error);
    // Force redirect even on error
    window.location.href = '/';
  }
};
```

**Why not `router.push('/')`?**
- Client-side navigation doesn't clear browser cookies/cache
- Can leave stale auth state in memory
- Hard reload ensures clean slate

### Database Tables
```sql
-- profiles table (auto-created on user signup via trigger)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  preferred_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,  -- Admin access flag
  notification_preferences JSONB
)
```

### Admin Security (December 2025)
The admin section (`/admin/*`) is protected with multi-layer security:

**Protection Layers:**
1. **Middleware** - Checks `is_admin` flag before allowing access
2. **RLS Policies** - Database-level access control via `is_admin()` function
3. **AuthContext** - Exposes `isAdmin` boolean to components
4. **Server Utilities** - `src/lib/auth/admin.ts` for server-side checks
5. **Client Hook** - `src/hooks/useAdminGuard.ts` for component protection

**Admin Users:**
- Initial admin: `info@bestofgoa.com`
- Add admins: `UPDATE profiles SET is_admin = TRUE WHERE email = 'new@email.com';`

**Usage in Components:**
```tsx
// Client components
const { isAdmin } = useAuth();
if (isAdmin) { /* show admin features */ }

// Server components/actions
import { requireAdmin } from '@/lib/auth/admin';
await requireAdmin(); // throws if not admin
```

## Features

### 1. Favorites (Phase 2)
Save places to favorites with heart button on all cards.

**Components:**
- `src/components/user/FavoriteButton.tsx` - Heart icon toggle button

**API Routes:**
- `GET /api/user/favorites` - List user's favorites with item details
- `POST /api/user/favorites` - Add item to favorites
- `DELETE /api/user/favorites` - Remove item from favorites

**Database:**
```sql
user_favorites (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  item_type TEXT CHECK (item_type IN ('restaurant', 'hotel', 'mall', 'attraction', 'fitness', 'school')),
  item_id UUID,
  created_at TIMESTAMPTZ,
  UNIQUE(user_id, item_type, item_id)
)
```

**Pages:**
- `/favorites` - View all favorites with category tabs

### 2. Itineraries (Phase 3)
Create and share wishlists/itineraries of places.

**Components:**
- `src/components/user/AddToItineraryButton.tsx` - Map icon with itinerary popover

**API Routes:**
- `GET /api/user/itineraries` - List user's itineraries
- `POST /api/user/itineraries` - Create new itinerary
- `GET /api/user/itineraries/[id]` - Get itinerary with items
- `PUT /api/user/itineraries/[id]` - Update itinerary (title, description, is_public)
- `DELETE /api/user/itineraries/[id]` - Delete itinerary
- `POST /api/user/itineraries/[id]/items` - Add item to itinerary
- `DELETE /api/user/itineraries/[id]/items` - Remove item from itinerary
- `GET /api/itineraries/shared/[token]` - Public shared itinerary

**Database:**
```sql
itineraries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

itinerary_items (
  id UUID PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  item_type TEXT CHECK (item_type IN ('restaurant', 'hotel', 'mall', 'attraction', 'fitness', 'school')),
  item_id UUID,
  notes TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ
)
```

**Pages:**
- `/itineraries` - List all user itineraries
- `/itineraries/[id]` - View/edit single itinerary
- `/itineraries/shared/[token]` - Public shared view (no auth required)

**Features:**
- Share itineraries via unique token URL
- Toggle public/private visibility
- Print/PDF export via browser print
- Drag-and-drop reordering (future)
- Add notes to items

### 3. Submission Tracking (Phase 4)
Track status of business submissions.

**API Routes:**
- `GET /api/user/submissions` - List user's submissions with status
- `POST /api/submissions` - Submit business (auto-links to logged-in user)

**Database:**
```sql
-- Added user_id column to existing table
business_submissions (
  ...existing columns...,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
)
```

**Pages:**
- `/submissions` - View submission history with status badges
- `/application` - Business submission form (auto-fills for logged-in users)

**Status Types:**
- `pending` - Awaiting review
- `in_review` - Being reviewed by admin
- `approved` - Added to Best of Goa
- `rejected` - Not approved (with reason)

### 4. User Dashboard
Overview page showing user activity.

**Pages:**
- `/dashboard` - Stats and quick links
- `/settings` - Profile settings and preferences

## Property Page Integration (January 2026)
All 6 property detail pages feature **floating action buttons** in the hero image for immediate user interaction:

**Location**: Top-right corner of hero section (absolute positioning with z-index 10)
**Pattern**: Two buttons side-by-side with gap spacing
**Buttons**:
- **FavoriteButton** - Heart icon (fills red when favorited)
- **AddToItineraryButton** - Map/Plus icon with popover UI

**Implementation Files**:
- `src/app/places-to-eat/restaurants/[slug]/page.tsx`
- `src/app/places-to-stay/hotels/[slug]/page.tsx`
- `src/app/places-to-shop/malls/[slug]/page.tsx`
- `src/app/places-to-visit/attractions/[slug]/page.tsx`
- `src/app/places-to-learn/schools/[slug]/page.tsx`
- `src/app/things-to-do/fitness/[slug]/page.tsx`

**Code Pattern**:
```tsx
import { FavoriteButton } from '@/components/user/FavoriteButton';
import { AddToItineraryButton } from '@/components/user/AddToItineraryButton';

// In hero section:
<div className="absolute top-6 right-6 flex gap-3 z-10">
  <FavoriteButton
    itemType="restaurant"  // or hotel, mall, attraction, school, fitness
    itemId={entity.id}
    size="lg"
  />
  <AddToItineraryButton
    itemType="restaurant"  // or hotel, mall, attraction, school, fitness
    itemId={entity.id}
    itemName={entity.name}
    size="lg"
  />
</div>
```

**User Experience**:
- **Unauthenticated users**: Clicking either button redirects to `/login`
- **Authenticated users**:
  - FavoriteButton toggles instantly (optimistic UI)
  - AddToItineraryButton opens popover with itinerary list
  - Can create new itinerary on-the-fly from popover
- **Visual feedback**: Loading states, success animations, error toasts

## Card Components Integration
All 6 card types include FavoriteButton and AddToItineraryButton:
- `src/components/restaurant/RestaurantCard.tsx`
- `src/components/hotel/HotelCard.tsx`
- `src/components/mall/MallCard.tsx`
- `src/components/attraction/AttractionCard.tsx`
- `src/components/fitness/FitnessCard.tsx`
- `src/components/school/SchoolCard.tsx`

## RLS Policies

### user_favorites
```sql
-- Users can only see/modify their own favorites
CREATE POLICY "Users can manage own favorites" ON user_favorites
  FOR ALL USING (auth.uid() = user_id);
```

### itineraries
```sql
-- Users can manage own itineraries
CREATE POLICY "Users can manage own itineraries" ON itineraries
  FOR ALL USING (auth.uid() = user_id);

-- Anyone can view public itineraries
CREATE POLICY "Public itineraries viewable" ON itineraries
  FOR SELECT USING (is_public = true);
```

### business_submissions
```sql
-- Users can see their own submissions
CREATE POLICY "Users can see own submissions" ON business_submissions
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');
```

## User Menu Items
Located in header via `UserMenu.tsx`:
1. Dashboard
2. My Favorites
3. My Itineraries
4. My Submissions
5. Settings
6. Sign Out

## Migration Files
- `20251130_user_section.sql` - User favorites, itineraries tables
- `20251130_add_user_id_to_submissions.sql` - Link submissions to users
- `20250105_fix_oauth_profile_creation.sql` - OAuth profile creation trigger + backfill
