# Restaurant Slug Investigation Report - November 11, 2025

**Investigation Date:** November 11, 2025
**Investigator:** Best of Goa Project Doctor (Claude Code)
**Scope:** All restaurants created on 2025-11-11
**Type:** Analysis Only (No Database Modifications)

---

## Executive Summary

**CRITICAL FINDING:** All 27 restaurants created today (100%) have slugs that do NOT follow the established slug generation rules. Every single slug is missing its required location suffix.

**Status:** The slug generation system has a significant issue preventing the automatic slug regeneration mechanism from executing properly.

**Impact:** High - All new restaurant URLs lack location information, making them non-unique and non-SEO-friendly.

---

## Investigation Results

### Overview Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Restaurants Created Today** | 27 | 100% |
| **Compliant Slugs** | 0 | 0% |
| **Non-Compliant Slugs** | 27 | 100% |

### Issue Pattern

**Common Issue Across All Restaurants:**
- Current slugs contain only the restaurant name (e.g., `jamies-italian`, `gusto`, `brick-pizza`)
- Expected slugs should include location suffix (e.g., `jamies-italian-south-sabahiya`, `gusto-goa-city`, `brick-pizza-salmiya`)
- All restaurants have `neighborhood_id` properly linked
- All restaurants have `neighborhood.slug` available in database

---

## Detailed Issue Analysis

### Format Issues Found

1. **Missing Location Suffix** - 27 restaurants (100%)
   - Slugs lack the required location component
   - Two restaurants also flagged for "missing location suffix" due to no dashes at all:
     - `gusto` (should be `gusto-goa-city`)
     - `delizio` (should be `delizio-goa-city`)

### Representative Examples

| Restaurant Name | Current Slug | Expected Slug | Neighborhood | Issue |
|----------------|--------------|---------------|--------------|-------|
| Jamie's Italian | `jamies-italian` | `jamies-italian-south-sabahiya` | South Sabahiya (ID: 23) | Missing location |
| Mughal Mahal Exotica | `mughal-mahal-exotica` | `mughal-mahal-exotica-salmiya` | Salmiya (ID: 2) | Missing location |
| Ù‚ÙˆØ³ØªÙˆ Gusto | `gusto` | `gusto-goa-city` | Goa City (ID: 1) | No dash + missing location |
| Brick Pizza | `brick-pizza` | `brick-pizza-salmiya` | Salmiya (ID: 2) | Missing location |
| Vigonovo | `vigonovo-sharq` | `vigonovo-goa-city` | Goa City (ID: 1) | Wrong location (area vs neighborhood) |
| Cantina | `cantina-shuwaikh` | `cantina-goa-city` | Goa City (ID: 1) | Wrong location (area vs neighborhood) |
| MELENZANÃ‰ (Al-Kout Mall) | `melenzan-al-kout-mall` | `melenzan-al-kout-mall-fahaheel` | Fahaheel (ID: 98) | Missing location |

### Notable Case: Location Mismatch

Two restaurants have location suffixes, but they're using the `area` field instead of the `neighborhood.slug`:

1. **Vigonovo**
   - Current: `vigonovo-sharq` (using area "Sharq")
   - Expected: `vigonovo-goa-city` (using neighborhood slug "goa-city")

2. **Cantina**
   - Current: `cantina-shuwaikh` (using area "Shuwaikh Industrial")
   - Expected: `cantina-goa-city` (using neighborhood slug "goa-city")

This indicates the initial slug generation is sometimes using the area field instead of waiting for neighborhood data.

---

## Root Cause Analysis

### Issue 1: Initial Slug Generation (Creation Time)

**File:** `src/app/api/admin/start-extraction/route.ts`
**Lines:** 223-241

```typescript
const neighborhoodId = await mapAreaToNeighborhoodId(area, address);
let neighborhoodName: string | undefined = undefined;
let neighborhoodSlug: string | undefined = undefined;

if (neighborhoodId) {
  const { data: neighborhood } = await supabase
    .from('restaurant_neighborhoods')
    .select('name, slug')
    .eq('id', neighborhoodId)
    .single();

  if (neighborhood) {
    neighborhoodName = neighborhood.name;
    neighborhoodSlug = neighborhood.slug;
  }
}

// Generate unique slug using neighborhood slug (preferred) or name/area/address fallback
let slug = generateRestaurantSlugWithArea(restaurantName, area, address, neighborhoodName, neighborhoodSlug);
```

**Analysis:**
- Code correctly maps area/address to neighborhood ID
- Code correctly fetches neighborhood name and slug
- Code correctly calls `generateRestaurantSlugWithArea()` with all required parameters
- **BUT:** The generated slugs are missing location suffixes

**Hypothesis:** The `mapAreaToNeighborhoodId()` function may not be finding matches for many areas, resulting in `neighborhoodId = null`, which means `neighborhoodName` and `neighborhoodSlug` remain `undefined`, causing `generateRestaurantSlugWithArea()` to return just the base slug.

### Issue 2: Automatic Slug Regeneration (Post-Extraction)

**File:** `src/lib/services/extraction-orchestrator.ts`
**Lines:** 871-969

**Purpose:** Automatically fix slugs missing location suffixes after neighborhood_id is determined by Apify data.

**Detection Logic:**
```typescript
const hasLocationSuffix = restaurant.slug.includes('-');

if (hasLocationSuffix) {
  console.log('[Orchestrator] Slug already has location suffix:', restaurant.slug);
  return; // SKIP regeneration
}
```

**Critical Bug Identified:**

The detection logic checks if the slug contains ANY dash (`-`), assuming a dash means a location suffix is present. However:

- âœ… Correct detection for: `gusto` (no dash â†’ needs regeneration)
- âœ… Correct detection for: `delizio` (no dash â†’ needs regeneration)
- âŒ **FALSE POSITIVE:** `jamies-italian` (has dash from "jamie's" â†’ incorrectly assumes location is present)
- âŒ **FALSE POSITIVE:** `brick-pizza` (has dash between words â†’ incorrectly assumes location is present)
- âŒ **FALSE POSITIVE:** All multi-word restaurant names with dashes

**Result:** The auto-regeneration system is **silently failing** for 25 out of 27 restaurants because it incorrectly thinks they already have location suffixes.

---

## Why This Matters

### SEO Impact
- Restaurant URLs are not unique across locations
- Missing location context hurts local search rankings
- URLs like `jamies-italian` could refer to ANY Jamie's Italian location globally

### User Experience Impact
- Users cannot distinguish between different locations from the URL
- URLs are less memorable and less shareable
- Inconsistent URL structure across the platform

### Data Integrity Impact
- Slug uniqueness relies on location suffixes
- Risk of duplicate slugs if chains have multiple locations
- Inconsistent with documented slug generation standards

---

## Verification: Neighborhood Mappings

To verify that neighborhood data IS available, sample check:

| Restaurant | Area | Address Contains | Neighborhood ID | Neighborhood Slug |
|-----------|------|------------------|----------------|-------------------|
| Jamie's Italian | South Sabahiya | "40ØŒ Goa" | 23 | south-sabahiya |
| Mughal Mahal Exotica | Salmiya | "Terrace Mall, Salem Al Mubarak St, Salmiya" | 2 | salmiya |
| Brick Pizza | Salmiya | "Salem Al Mubarak St, Salmiya" | 2 | salmiya |

**Conclusion:** Neighborhood data IS correctly linked and available. The issue is in the slug generation/regeneration logic.

---

## Complete List of Non-Compliant Restaurants

| # | Restaurant Name | Current Slug | Expected Slug | Neighborhood |
|---|----------------|--------------|---------------|--------------|
| 1 | Jamie's Italian | `jamies-italian` | `jamies-italian-south-sabahiya` | South Sabahiya |
| 2 | Mughal Mahal Exotica | `mughal-mahal-exotica` | `mughal-mahal-exotica-salmiya` | Salmiya |
| 3 | Fancy Pizzeria | `fancy-pizzeria` | `fancy-pizzeria-goa-city` | Goa City |
| 4 | Vigonovo | `vigonovo-sharq` | `vigonovo-goa-city` | Goa City |
| 5 | Lazio Restaurant | `lazio-restaurant` | `lazio-restaurant-goa-city` | Goa City |
| 6 | Mia Restaurant | `mia-restaurant` | `mia-restaurant-goa-city` | Goa City |
| 7 | Ù‚ÙˆØ³ØªÙˆ Gusto | `gusto` | `gusto-goa-city` | Goa City |
| 8 | Brick Pizza | `brick-pizza` | `brick-pizza-salmiya` | Salmiya |
| 9 | Nara Restocafe | `nara-restocafe` | `nara-restocafe-salmiya` | Salmiya |
| 10 | Altissimo Restaurant | `altissimo-restaurant` | `altissimo-restaurant-goa-city` | Goa City |
| 11 | Cafe Barbera Goa | `cafe-barbera-goa` | `cafe-barbera-goa-salmiya` | Salmiya |
| 12 | Cantina | `cantina-shuwaikh` | `cantina-goa-city` | Goa City |
| 13 | Cucina Restaurant | `cucina-restaurant` | `cucina-restaurant-salmiya` | Salmiya |
| 14 | Da Gusto-Trattoria Italiana | `da-gusto-trattoria-italiana` | `da-gusto-trattoria-italiana-salmiya` | Salmiya |
| 15 | Delizio | `delizio` | `delizio-goa-city` | Goa City |
| 16 | Delizio in the city | `delizio-in-the-city` | `delizio-in-the-city-goa-city` | Goa City |
| 17 | Fired Pizza | `fired-pizza` | `fired-pizza-goa-city` | Goa City |
| 18 | Giovanni Restaurant | `giovanni-restaurant` | `giovanni-restaurant-goa-city` | Goa City |
| 19 | Giulia by Vigonovo | `giulia-by-vigonovo` | `giulia-by-vigonovo-shuwaikh` | Shuwaikh |
| 20 | Il Terrazzo - Restaurant & Lounge | `il-terrazzo-restaurant-lounge` | `il-terrazzo-restaurant-lounge-salmiya` | Salmiya |
| 21 | italian house restaurant and cafe | `italian-house-restaurant-and-cafe` | `italian-house-restaurant-and-cafe-goa-city` | Goa City |
| 22 | La Mamma Pizzeria | `la-mamma-pizzeria` | `la-mamma-pizzeria-goa-city` | Goa City |
| 23 | Leccino Ristorante | `leccino-ristorante` | `leccino-ristorante-salmiya` | Salmiya |
| 24 | MELENZANÃ‰ (Al-Kout Mall) | `melenzan-al-kout-mall` | `melenzan-al-kout-mall-fahaheel` | Fahaheel |
| 25 | MELENZANÃ‰ (The Avenues) | `melenzan-the-avenues` | `melenzan-the-avenues-goa-city` | Goa City |
| 26 | Melenzane - Al Bidaa | `melenzane-al-bidaa` | `melenzane-al-bidaa-goa-city` | Goa City |
| 27 | Melenzane - Al Harma Mall | `melenzane-al-harma-mall` | `melenzane-al-harma-mall-goa-city` | Goa City |

---

## System Assessment

### Slug Generation Rules (from `docs/SLUG_GENERATION.md`)

According to the documentation:

1. **Format:** `restaurant-name-area/neighborhood`
2. **Location Priority:**
   1. Neighborhood Slug (highest priority)
   2. Neighborhood Name (fallback)
   3. Area (fallback)
   4. Address parsing (last resort)
3. **Duplicate Detection:** Prevents adding location if already in name
4. **Postal Code Filtering:** Automatically filters postal codes
5. **Automatic Regeneration:** Fixes bad slugs after extraction completes

### Compliance Score

| Rule | Compliance | Notes |
|------|-----------|-------|
| Format (name-location) | âŒ 0% | All missing location |
| Location Priority | âš ï¸ Partial | Neighborhood IDs linked, but slugs not generated |
| Duplicate Detection | N/A | Cannot test without proper location suffix |
| Postal Code Filtering | âœ… Working | No postal codes in slugs |
| Automatic Regeneration | âŒ BROKEN | False positive detection logic |

### Overall System Health

**Status:** âŒ **MAJOR ISSUES**

- Over 50% (100%) of slugs created today have issues
- The slug generation system needs immediate attention
- Both initial generation AND automatic regeneration are failing

---

## Technical Deep Dive

### Bug in `regenerateSlugIfNeeded()` Detection Logic

**Current Code (Line 899):**
```typescript
const hasLocationSuffix = restaurant.slug.includes('-');
```

**Problem:**
- This checks if the slug contains ANY dash character
- Multi-word restaurant names naturally have dashes (e.g., `brick-pizza`, `fired-pizza`)
- The check returns `true` even when the slug has no location suffix
- Function exits early, skipping regeneration for 93% of restaurants

**Correct Logic Should Be:**
```typescript
// Check if slug has more than just name dashes
// Compare against base name slug to see if extra location was added
const baseNameSlug = restaurant.name
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-+|-+$/g, '');

const hasLocationSuffix = restaurant.slug !== baseNameSlug && restaurant.slug.startsWith(baseNameSlug + '-');
```

Or simpler:
```typescript
// Check if slug ends with neighborhood slug
const neighborhood = restaurant.restaurant_neighborhoods;
const hasLocationSuffix = neighborhood?.slug && restaurant.slug.endsWith('-' + neighborhood.slug);
```

---

## Recommendations

### Immediate Actions Required

1. **Fix Detection Logic in `regenerateSlugIfNeeded()`**
   - Replace simple dash check with proper base slug comparison
   - Or check if slug ends with the neighborhood slug

2. **Run Manual Slug Regeneration for Today's Restaurants**
   - Use existing script: `bin/fix-all-bad-slugs.js`
   - Or create targeted script for today's 27 restaurants

3. **Test Slug Generation Flow**
   - Add unit tests for `generateRestaurantSlugWithArea()`
   - Add integration tests for `regenerateSlugIfNeeded()`
   - Test with multi-word restaurant names

### Long-Term Improvements

1. **Add Logging to Initial Slug Generation**
   - Log when `neighborhoodId` is null
   - Log when neighborhood fetch fails
   - Log final slug generation inputs and outputs

2. **Add Validation to Extraction Pipeline**
   - Verify slug has location suffix before marking extraction complete
   - Add health check endpoint for slug quality

3. **Update Documentation**
   - Document the detection logic bug
   - Add troubleshooting guide for slug issues
   - Include examples of edge cases

---

## Conclusion

This investigation has identified a critical bug in the automatic slug regeneration system that is preventing all newly created restaurants from receiving proper location-based slugs. The issue is caused by a flawed detection mechanism that incorrectly assumes any dash in a slug indicates a location suffix is present.

**Impact:** 100% of restaurants created today have non-compliant slugs
**Root Cause:** False positive detection in `regenerateSlugIfNeeded()` (line 899)
**Fix Required:** Update detection logic to properly identify missing location suffixes
**Testing Needed:** Comprehensive testing of slug generation with multi-word restaurant names

---

## Investigation Script

The investigation was performed using:
- **Script:** `bin/investigate-todays-slugs-query.js`
- **Query Date Range:** 2025-11-11 00:00:00 to 2025-11-11 23:59:59 UTC
- **Database:** Supabase production database
- **No modifications:** Read-only investigation

---

**Report Generated:** November 11, 2025
**Report Author:** Best of Goa Project Doctor (Claude Code)
**Status:** INVESTIGATION COMPLETE - NO DATABASE CHANGES MADE
