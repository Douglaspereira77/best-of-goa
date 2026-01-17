# Unpublish Bug Fix - Complete Resolution

## Issue Summary
**Reporter:** Douglas
**Date:** 2025-11-28
**Symptom:** Hustle gym was unpublished but still appeared on the public fitness page at http://localhost:3000/things-to-do/fitness

## Root Cause Analysis

### The Bug
The unpublish API endpoints across ALL categories had a critical logic error:

```typescript
// BEFORE (BUGGY CODE):
active: newPublishedStatus ? true : record.active
// When unpublishing, this preserved the existing 'active' value instead of setting it to false
```

### Why It Happened
When unpublishing a record:
- `published` was correctly set to `false`
- BUT `active` remained `true` (because the ternary preserved the existing value)
- All public page queries filter by `.eq('active', true)` - not by `published` field
- Result: Unpublished records still appeared on public pages

### Affected Categories
- âœ… Restaurants (fixed)
- âœ… Hotels (fixed)
- âœ… Malls (fixed)
- âœ… Fitness (fixed)
- âœ… Attractions (fixed)
- âœ… Schools (fixed)

## Files Modified

### API Route Fixes
1. `src/app/api/admin/fitness/[id]/publish/route.ts` - Line 45
2. `src/app/api/admin/restaurants/[id]/publish/route.ts` - Line 47
3. `src/app/api/admin/hotels/[id]/publish/route.ts` - Line 45
4. `src/app/api/admin/malls/[id]/publish/route.ts` - Line 45
5. `src/app/api/admin/attractions/[id]/publish/route.ts` - Line 45
6. `src/app/api/admin/schools/[id]/publish/route.ts` - Lines 48-49

### Fixed Code
```typescript
// AFTER (FIXED CODE):
active: newPublishedStatus // Set active to false when unpublishing
```

**Note:** Schools also had `verified` field with same issue - also fixed.

## Database Cleanup

### Hustle Gym (Original Issue)
- **Before:** `published: true, active: true`
- **After:** `published: false, active: false`
- **Status:** âœ… No longer visible on public page

### Additional Records Fixed
Found and fixed 26 school records that were unpublished but still active:
- American Creativity Academy Girls' Campus
- Al Noor Bilingual School
- Fahaheel Al Watanieh Indian Private School
- Salmiya Indian Model School (SIMS)
- ...and 22 more schools

**Total records cleaned:** 27 (1 fitness + 26 schools)

## Verification

### Audit Results
```
âœ… Restaurants: No issues found
âœ… Hotels: No issues found
âœ… Malls: No issues found
âœ… Fitness: No issues found
âœ… Attractions: No issues found
âœ… Schools: No issues found

âœ… All categories are clean! No unpublished records are active.
```

## Scripts Created

### Diagnostic Scripts
1. **`scripts/check-hustle-status.js`**
   - Checks specific Hustle gym record status

2. **`scripts/audit-unpublished-active-records.js`**
   - Audits all categories for unpublished but active records
   - Usage: `node scripts/audit-unpublished-active-records.js`

### Fix Scripts
3. **`scripts/fix-hustle-gym.js`**
   - Fixed Hustle gym specifically (initial fix)

4. **`scripts/fix-unpublished-active-records.js`**
   - Fixes all unpublished but active records across all categories
   - Usage: `node scripts/fix-unpublished-active-records.js`

## Testing Instructions

### 1. Verify Hustle Gym is Gone
```bash
# Start dev server
npm run dev

# Visit fitness page
# http://localhost:3000/things-to-do/fitness

# Verify "Hustle gym" is NOT in the Women-Only section
```

### 2. Test Unpublish Flow
```bash
# Navigate to admin fitness page
# http://localhost:3000/admin/fitness

# Find any published fitness place
# Click "Unpublish"
# Verify it disappears from public page immediately
```

### 3. Run Audit (Anytime)
```bash
node scripts/audit-unpublished-active-records.js
# Should show all categories clean
```

## Prevention Recommendations

### 1. Add Database Constraint
Consider adding a database constraint to ensure `published = true` implies `active = true`:
```sql
ALTER TABLE fitness_places
ADD CONSTRAINT published_must_be_active
CHECK (NOT published OR active);
```

### 2. Regular Audits
Run `audit-unpublished-active-records.js` script weekly to catch issues early.

### 3. Type Safety Enhancement
Create a shared publish/unpublish service to ensure consistency:

```typescript
// lib/services/publish-service.ts
export function getPublishUpdate(action: 'publish' | 'unpublish') {
  const isPublishing = action === 'publish'
  return {
    published: isPublishing,
    published_at: isPublishing ? new Date().toISOString() : null,
    active: isPublishing // Consistent logic
  }
}
```

## Impact Assessment

### Before Fix
- 27 records across 2 categories were unpublished but still visible to public
- Users could see content that should have been hidden
- Data inconsistency between `published` and `active` fields

### After Fix
- All 6 category publish/unpublish endpoints corrected
- All 27 problematic records cleaned up
- Database is consistent: `published: false` always means `active: false`
- Future unpublish operations will work correctly

## Next Steps

1. âœ… **COMPLETED:** Fix API endpoints (all 6 categories)
2. âœ… **COMPLETED:** Clean up database (27 records)
3. âœ… **COMPLETED:** Create audit scripts
4. â³ **OPTIONAL:** Add database constraint
5. â³ **OPTIONAL:** Create shared publish service
6. â³ **RECOMMENDED:** Test unpublish flow in production

## Resolution Status
**âœ… FULLY RESOLVED**

- Hustle gym is no longer visible on fitness page
- All category unpublish endpoints fixed
- Database cleaned and verified
- Audit scripts created for future monitoring

---

**Fixed by:** Claude Code (Best of Goa Project Doctor)
**Date:** 2025-11-28
**Files Modified:** 6 API routes, 27 database records
**Scripts Created:** 4 diagnostic and fix scripts
