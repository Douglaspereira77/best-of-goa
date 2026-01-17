# Queue Status System - Complete Explanation

## Overview

The Best of Goa extraction system uses a **two-layer status system**:
1. **Database Layer**: Stores practical workflow states
2. **Display Layer**: Shows semantic user-friendly states

This document explains how they work together.

---

## The Two Layers

### Database Layer (What's Actually Stored)

The `restaurants` table stores these **3 actual status values**:

| Database Status | Meaning | Set By |
|----------------|---------|--------|
| `'processing'` | Extraction is currently running | Orchestrator at start (Line 55) |
| `'active'` | Extraction completed successfully | Orchestrator at end (Line 749) |
| `'failed'` | Extraction failed with errors | Orchestrator on error (Line 756) |

**Additional Fields:**
- `verified` (boolean) - Whether restaurant has been manually reviewed/approved
- `active` (boolean) - Whether restaurant is published on site

### Display Layer (What Users See)

The queue page shows these **5 semantic statuses**:

| Display Status | Meaning for Users |
|---------------|-------------------|
| `'all'` | Show everything regardless of state |
| `'pending'` | Extracted, waiting for verification |
| `'processing'` | Currently being extracted |
| `'completed'` | Extracted and verified |
| `'failed'` | Extraction failed |

---

## Status Lifecycle Journey

Let's follow a restaurant through the entire extraction process:

### Stage 1: Creation
```
User adds restaurant â†’ Database created
â”œâ”€ status: NULL (not set yet)
â”œâ”€ verified: false
â””â”€ active: false
```

### Stage 2: Extraction Starts
```
Orchestrator begins extraction
â”œâ”€ status: 'processing' âœ…
â”œâ”€ verified: false
â””â”€ active: false

DISPLAY: "processing" tab
```

**What happens here:**
- `executeExtraction()` is called
- Line 55 in extraction-orchestrator.ts sets `status='processing'`
- 12 extraction steps run (Apify, Firecrawl, AI Enhancement, etc.)
- `job_progress` JSON tracks each step

### Stage 3: Extraction Completes Successfully
```
All 12 steps complete without errors
â”œâ”€ status: 'active' âœ…
â”œâ”€ verified: false
â””â”€ active: false

DISPLAY: "pending" tab
```

**What happens here:**
- Line 749 in extraction-orchestrator.ts sets `status='active'`
- Restaurant has all data extracted
- BUT not verified by admin yet
- **This is "pending" from user perspective**

### Stage 4: Admin Verification
```
Admin reviews and verifies restaurant
â”œâ”€ status: 'active' (unchanged)
â”œâ”€ verified: true âœ…
â””â”€ active: true âœ…

DISPLAY: "completed" tab
```

**What happens here:**
- Admin reviews data quality
- Clicks "Verify" button (in admin interface)
- Database updated: `verified=true, active=true`
- **This is "completed" from user perspective**

### Alternative: Extraction Fails
```
Error occurs during extraction
â”œâ”€ status: 'failed' âœ…
â”œâ”€ verified: false
â””â”€ active: false

DISPLAY: "failed" tab
```

**What happens here:**
- Any step throws an error
- Line 756 in extraction-orchestrator.ts sets `status='failed'`
- Error details stored in `error_logs` JSON column
- Extraction can be retried

---

## Filter Tab Logic (How It Works Now)

### "All" Tab
```typescript
// No filter applied
query = supabase.from('restaurants').select('*')
```
**Shows**: Everything in database regardless of status

---

### "Pending" Tab
```typescript
// Filter: Extracted but not verified
query = query.eq('status', 'active').eq('verified', false)
```

**Database Query**: `WHERE status='active' AND verified=false`

**Shows**: Restaurants that have been:
- âœ… Successfully extracted (status='active')
- âŒ NOT yet verified by admin (verified=false)

**Typical Count**: Most of your restaurants (96 out of 100)

**User Action**: Review these and verify them

---

### "Processing" Tab
```typescript
// Filter: Currently extracting
query = query.eq('status', 'processing')
```

**Database Query**: `WHERE status='processing'`

**Shows**: Restaurants that are:
- ðŸ”„ Currently running through extraction pipeline
- â±ï¸ Active extraction job in progress

**Typical Count**: 0-10 (only while extractions are running)

**User Action**: Wait for completion, monitor progress

---

### "Completed" Tab
```typescript
// Filter: Extracted and verified
query = query.eq('status', 'active').eq('verified', true)
```

**Database Query**: `WHERE status='active' AND verified=true`

**Shows**: Restaurants that have been:
- âœ… Successfully extracted (status='active')
- âœ… Verified by admin (verified=true)
- ðŸŒ Published on website (active=true)

**Typical Count**: Initially 0, grows as you verify restaurants

**User Action**: These are production-ready

---

### "Failed" Tab
```typescript
// Filter: Extraction failed
query = query.eq('status', 'failed')
```

**Database Query**: `WHERE status='failed'`

**Shows**: Restaurants where:
- âŒ Extraction encountered errors
- ðŸ“ Error details in `error_logs` column
- ðŸ” Can be retried

**Typical Count**: Ideally 0 (no failures)

**User Action**: Investigate errors, retry extraction

---

## Status Normalization (Lines 111-118)

The API normalizes database statuses for display:

```typescript
let displayStatus = restaurant.status

// Map database â†’ display
if (restaurant.status === 'importing') {
  displayStatus = 'processing'  // Legacy support
}
else if (restaurant.status === 'active' && restaurant.verified) {
  displayStatus = 'completed'   // âœ… Verified
}
else if (restaurant.status === 'active' && !restaurant.verified) {
  displayStatus = 'pending'     // â³ Awaiting verification
}
// 'failed' and 'processing' pass through unchanged
```

**Why Normalize?**
- Database stores practical workflow states (`'active'`)
- Users see semantic meaningful states (`'pending'`, `'completed'`)
- Separation allows flexible future changes

---

## Real-World Example

Let's track "Burger Boutique" through the system:

### Day 1: 10:00 AM - Admin adds restaurant
```
Database: status=NULL, verified=false, active=false
Display: Not shown yet (no status)
```

### Day 1: 10:01 AM - Extraction starts
```
Database: status='processing', verified=false, active=false
Display: Shows in "Processing" tab
Admin sees: Progress bar, current step
```

### Day 1: 10:15 AM - Extraction completes (12 steps done)
```
Database: status='active', verified=false, active=false
Display: Shows in "Pending" tab
Admin sees: Full data extracted, awaiting review
```

### Day 1: 11:00 AM - Admin reviews and verifies
```
Database: status='active', verified=true, active=true
Display: Shows in "Completed" tab
Website: Restaurant now visible to public
```

### If Extraction Failed at 10:10 AM
```
Database: status='failed', verified=false, active=false
Display: Shows in "Failed" tab
Admin sees: Error message, retry button
Error: "Firecrawl API timeout at step 3"
```

---

## Common Scenarios Explained

### Why are most restaurants in "Pending"?

Because:
1. âœ… Extraction completed successfully (`status='active'`)
2. âŒ Admin hasn't verified them yet (`verified=false`)
3. This is normal workflow - you extract first, verify later

### When does "Processing" show restaurants?

Only while extractions are actively running:
- You start extraction at `/admin/add`
- Orchestrator sets `status='processing'`
- 12 steps run (takes 2-5 minutes)
- Status changes to `'active'` when done
- **Brief window**: Only visible during extraction

### How do restaurants move to "Completed"?

You need to manually verify them:
1. Go to restaurant detail page
2. Review extracted data
3. Click "Verify" button
4. Database updates: `verified=true, active=true`
5. Restaurant moves from "Pending" â†’ "Completed"

### What causes "Failed" status?

Common causes:
- API timeout (Firecrawl, Apify)
- Invalid restaurant URL
- Network errors
- Rate limiting
- Parsing errors

You can:
- View error details in error_logs
- Click "Retry" to run extraction again
- Fix data and retry

---

## The `verified` Flag Explained

This is the **key field** that determines Pending vs. Completed:

### `verified=false` (Default)
- Restaurant extracted but not reviewed
- Admin hasn't confirmed data quality
- May contain errors or incomplete data
- **Shows in "Pending"**

### `verified=true` (Admin Action Required)
- Admin manually reviewed the data
- Confirmed accuracy and completeness
- Safe to publish on website
- **Shows in "Completed"**

**Why Manual Verification?**
- AI extraction isn't 100% accurate
- Need human review for:
  - Menu items accuracy
  - Description quality
  - Image appropriateness
  - Contact info validity
- Ensures high-quality directory

---

## The `active` Flag Explained

Controls website visibility:

### `active=false`
- Restaurant exists in database
- NOT visible on public website
- Only visible in admin panel

### `active=true`
- Restaurant published
- Visible on website
- Appears in search results
- Has public URL

**Typical Flow:**
1. Extract â†’ `active=false`
2. Verify â†’ `active=true` (set together with verified)

---

## Progress Tracking

The `job_progress` JSON column tracks each step:

```json
{
  "apify_fetch": {
    "status": "completed",
    "started_at": "2025-11-11T10:01:00Z",
    "completed_at": "2025-11-11T10:02:00Z"
  },
  "firecrawl_general": {
    "status": "completed",
    "started_at": "2025-11-11T10:02:00Z",
    "completed_at": "2025-11-11T10:03:30Z"
  },
  "firecrawl_menu": {
    "status": "running",
    "started_at": "2025-11-11T10:03:30Z"
  }
  // ... 9 more steps
}
```

**Used For:**
- Progress bar calculation
- Current step display
- Performance monitoring
- Debugging stuck extractions

---

## Database Schema Reference

```sql
CREATE TABLE restaurants (
  -- Status fields
  status TEXT,              -- 'processing' | 'active' | 'failed'
  verified BOOLEAN,         -- Has admin verified?
  active BOOLEAN,           -- Is published on website?

  -- Progress tracking
  job_progress JSONB,       -- Per-step progress
  error_logs JSONB,         -- Error details if failed

  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  import_started_at TIMESTAMPTZ,
  import_completed_at TIMESTAMPTZ
);
```

---

## Filter Quick Reference

| Tab | Database Query | Typical Count | User Action |
|-----|---------------|---------------|-------------|
| **All** | No filter | 100 | Browse everything |
| **Pending** | `status='active' AND verified=false` | 96 | Review and verify |
| **Processing** | `status='processing'` | 4 | Wait for completion |
| **Completed** | `status='active' AND verified=true` | 0 (initially) | Production ready |
| **Failed** | `status='failed'` | 0 (ideally) | Investigate and retry |

---

## Summary

### Key Points to Remember

1. **Three Database States**: processing, active, failed
2. **Verified Flag**: Determines pending vs. completed
3. **Active Flag**: Controls website visibility
4. **Normalization**: Database stores workflow, display shows semantics
5. **Manual Verification**: Required to move pending â†’ completed

### Typical Workflow

```
Add Restaurant
    â†“
status='processing' (extraction running)
    â†“
status='active', verified=false (pending verification)
    â†“
status='active', verified=true (completed & published)
```

### Your Current State (Nov 11, 2025)

- **96 restaurants in Pending**: Need your verification
- **4 restaurants Processing**: Extraction in progress
- **0 restaurants Completed**: None verified yet
- **0 restaurants Failed**: All extractions successful âœ…

---

**Next Step**: Start verifying restaurants in the "Pending" tab to move them to "Completed" and publish them on the website!

---

**Document Created**: 2025-11-11
**Author**: Claude Code
**Related Files**:
- `src/app/api/admin/restaurants/queue/route.ts` (Filter logic)
- `src/lib/services/extraction-orchestrator.ts` (Status setting)
- `src/app/admin/queue/page.tsx` (Frontend display)
