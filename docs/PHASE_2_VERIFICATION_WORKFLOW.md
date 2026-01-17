# Phase 2: Manual Verification Workflow - Implementation Guide

## Overview

This document outlines the implementation plan for Phase 2, which adds manual verification workflow to the restaurant extraction system.

**Status**: Future Implementation (After Initial Setup Complete)

---

## Current State (Phase 1)

### How It Works Now
```
Extraction Complete
    ↓
status='active' (auto-published)
verified=false (never changes)
active=true (auto-set)
    ↓
Restaurant immediately visible on website
```

**Characteristics:**
- ✅ Fast workflow - no bottleneck
- ✅ Good for initial data loading
- ❌ No quality control gate
- ❌ All restaurants permanently in "Pending" tab

---

## Desired State (Phase 2)

### How It Should Work
```
Extraction Complete
    ↓
status='active' (extraction done)
verified=false (awaiting review)
active=false (NOT published yet)
    ↓
Admin reviews in queue
    ↓
Clicks "Verify & Publish" button
    ↓
verified=true (reviewed)
active=true (published)
    ↓
Restaurant now visible on website
Moves to "Completed" tab
```

**Benefits:**
- ✅ Quality control before publishing
- ✅ Review AI-extracted data
- ✅ Catch errors before going live
- ✅ Meaningful workflow progression

---

## Implementation Checklist

### Step 1: Modify Extraction Orchestrator
**File**: `src/lib/services/extraction-orchestrator.ts`

**Current (Line 749-753):**
```typescript
// PHASE 1: Auto-publish
await this.updateRestaurantStatus(job.restaurantId, 'active');
// No active field set - defaults to false or set elsewhere
```

**Change To:**
```typescript
// PHASE 2: Require verification
await this.updateRestaurantStatus(job.restaurantId, 'active');
await this.updateRestaurantField(job.restaurantId, 'active', false);
await this.updateRestaurantField(job.restaurantId, 'verified', false);
// Restaurant extracted but NOT published yet
```

---

### Step 2: Create Verification API Endpoint
**File**: `src/app/api/admin/restaurants/[id]/verify/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/admin/restaurants/[id]/verify
 *
 * Verifies and publishes a restaurant
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update restaurant to verified and active
    const { data, error } = await supabase
      .from('restaurants')
      .update({
        verified: true,
        active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to verify restaurant:', error)
      return NextResponse.json(
        { error: 'Failed to verify restaurant' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      restaurant: data,
      message: 'Restaurant verified and published successfully'
    })

  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/restaurants/[id]/verify
 *
 * Unverifies and unpublishes a restaurant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Unpublish restaurant
    const { data, error } = await supabase
      .from('restaurants')
      .update({
        verified: false,
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to unverify restaurant:', error)
      return NextResponse.json(
        { error: 'Failed to unverify restaurant' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      restaurant: data,
      message: 'Restaurant unpublished successfully'
    })

  } catch (error) {
    console.error('Unverify error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

### Step 3: Add Verify Button to Queue Page
**File**: `src/app/admin/queue/page.tsx`

**Location**: In the restaurant list item rendering (around Line 300-400)

```typescript
// Add this function
const handleVerify = async (restaurantId: string) => {
  try {
    const response = await fetch(`/api/admin/restaurants/${restaurantId}/verify`, {
      method: 'POST'
    })

    const data = await response.json()

    if (data.success) {
      // Refresh the list
      await loadRestaurants()
      // Show success message
      alert('Restaurant verified and published!')
    } else {
      alert('Failed to verify restaurant: ' + data.error)
    }
  } catch (error) {
    console.error('Verify error:', error)
    alert('Failed to verify restaurant')
  }
}

// In the restaurant card/row rendering
<div className="flex items-center gap-2">
  {restaurant.status === 'pending' && (
    <Button
      size="sm"
      variant="default"
      onClick={() => handleVerify(restaurant.id)}
    >
      <CheckCircle className="w-4 h-4 mr-1" />
      Verify & Publish
    </Button>
  )}

  <Button
    size="sm"
    variant="outline"
    onClick={() => router.push(`/admin/restaurants/${restaurant.id}`)}
  >
    <Eye className="w-4 h-4 mr-1" />
    Review
  </Button>
</div>
```

---

### Step 4: Add Verify Button to Restaurant Detail Page
**File**: `src/app/admin/restaurants/[id]/page.tsx`

```typescript
// In the header actions section
{!restaurant.verified && restaurant.status === 'active' && (
  <Button
    onClick={handleVerify}
    disabled={verifying}
  >
    {verifying ? (
      <>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Verifying...
      </>
    ) : (
      <>
        <CheckCircle className="w-4 h-4 mr-2" />
        Verify & Publish
      </>
    )}
  </Button>
)}

{restaurant.verified && (
  <Badge variant="success" className="ml-2">
    <CheckCircle className="w-4 h-4 mr-1" />
    Verified & Published
  </Badge>
)}
```

---

### Step 5: Update Public-Facing Queries
**Files**: All pages that show restaurants to public

**Current (Probably):**
```typescript
const { data } = await supabase
  .from('restaurants')
  .select('*')
  // No active check - shows everything
```

**Change To:**
```typescript
const { data } = await supabase
  .from('restaurants')
  .select('*')
  .eq('active', true)  // Only show published restaurants
  .eq('verified', true)  // Only show verified restaurants
```

**Files to Update:**
- `src/app/places-to-eat/restaurants/[slug]/page.tsx`
- `src/app/places-to-eat/[cuisine]/page.tsx`
- `src/lib/queries/restaurant.ts`
- Any other public-facing queries

---

### Step 6: Update Queue Filter Comments
**File**: `src/app/api/admin/restaurants/queue/route.ts`

**Remove Phase 1 comments, update to reflect Phase 2:**

```typescript
if (status === 'pending') {
  // Pending = extracted but awaiting verification
  // Shows restaurants with status='active', verified=false, active=false
  query = query
    .eq('status', 'active')
    .eq('verified', false)
    .eq('active', false)
}
else if (status === 'completed') {
  // Completed = verified and published
  // Shows restaurants with status='active', verified=true, active=true
  query = query
    .eq('status', 'active')
    .eq('verified', true)
    .eq('active', true)
}
```

---

## Testing Plan

### Test 1: New Extraction
1. Add a new restaurant via `/admin/add`
2. Wait for extraction to complete
3. Check database:
   - `status` should be `'active'`
   - `verified` should be `false`
   - `active` should be `false`
4. Restaurant should appear in "Pending" tab
5. Restaurant should NOT be visible on public website

### Test 2: Verification
1. Go to "Pending" tab
2. Click "Verify & Publish" on a restaurant
3. Check database:
   - `verified` should be `true`
   - `active` should be `true`
4. Restaurant should move to "Completed" tab
5. Restaurant should now be visible on public website

### Test 3: Public Visibility
1. Before verification: Access public URL
   - Should get 404 or "Not Found"
2. After verification: Access public URL
   - Should show restaurant page

### Test 4: Unverification
1. Click "Unpublish" on a completed restaurant
2. Restaurant should move back to "Pending"
3. Should disappear from public website

---

## Rollback Plan

If Phase 2 causes issues, rollback is simple:

### Immediate Rollback (Database)
```sql
-- Publish all restaurants immediately
UPDATE restaurants
SET active = true, verified = true
WHERE status = 'active';
```

### Code Rollback
1. Revert `extraction-orchestrator.ts` Line 752
2. Remove verification API endpoint
3. Remove Verify buttons from UI
4. Revert public query filters

---

## Migration Script

When ready to implement Phase 2, run this to handle existing restaurants:

**File**: `bin/migrate-to-phase2.js`

```javascript
/**
 * Migrate existing restaurants to Phase 2 workflow
 *
 * Options:
 * 1. Auto-verify all existing (recommended for initial setup)
 * 2. Set all to unverified (forces manual review)
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrate(autoVerify = true) {
  console.log('Starting Phase 2 migration...')

  if (autoVerify) {
    // Option 1: Auto-verify all existing restaurants
    const { data, error } = await supabase
      .from('restaurants')
      .update({
        verified: true,
        active: true
      })
      .eq('status', 'active')

    console.log(`Auto-verified ${data?.length || 0} existing restaurants`)
  } else {
    // Option 2: Set all to unverified (requires manual review)
    const { data, error } = await supabase
      .from('restaurants')
      .update({
        verified: false,
        active: false
      })
      .eq('status', 'active')

    console.log(`Set ${data?.length || 0} restaurants to unverified`)
  }

  console.log('Migration complete!')
}

// Run with: node bin/migrate-to-phase2.js
migrate(true)  // Change to false if you want manual review
```

---

## Estimated Implementation Time

| Task | Time |
|------|------|
| Modify extraction orchestrator | 5 minutes |
| Create verify API endpoint | 15 minutes |
| Add verify button to queue page | 20 minutes |
| Add verify button to detail page | 20 minutes |
| Update public queries | 30 minutes |
| Testing | 30 minutes |
| **Total** | **~2 hours** |

---

## When to Implement

**Recommended Triggers:**
1. ✅ Initial data load complete (100+ restaurants)
2. ✅ Quality issues discovered in auto-published data
3. ✅ Ready to open website to public
4. ✅ Have time for manual review workflow

**Not Recommended If:**
- ❌ Still bulk-loading hundreds of restaurants
- ❌ Don't have time for manual reviews
- ❌ AI extraction quality is consistently high

---

## Current Phase 1 Status (Nov 11, 2025)

**Implementation Complete:**
- ✅ Tab order fixed (All → Processing → Pending → Completed → Failed)
- ✅ Phase 1/Phase 2 comments added to code
- ✅ Phase 2 implementation guide created
- ✅ Auto-publish behavior documented

**Current Data:**
- ~96 restaurants in "Pending" (auto-published)
- ~4 restaurants "Processing" (extracting)
- 0 restaurants "Completed" (no verification workflow yet)

---

**Document Created**: 2025-11-11
**Status**: Implementation guide for future Phase 2
**Related Files**:
- `src/lib/services/extraction-orchestrator.ts` (marked with Phase 2 TODO)
- `src/app/api/admin/restaurants/queue/route.ts` (marked with Phase 2 TODO)
- `src/app/admin/queue/page.tsx` (will need verify button)

---

**Ready to implement when Douglas gives the signal!**
