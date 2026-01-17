# ðŸš€ Cuisine Slug Standardization - Quick Start

**Status:** Ready to execute (pre-launch, zero risk)
**Time Required:** 15 minutes
**Impact:** Better SEO, cleaner URLs, consistent codebase

---

## Why This Matters

Your `restaurants_cuisines` table has inconsistent slugs:
- 10 cuisines with `-restaurants` suffix (verbose)
- 4 cuisines without suffix (clean)

This standardization will:
- âœ… Improve SEO rankings for "best japanese goa" queries
- âœ… Create cleaner, more shareable URLs
- âœ… Match industry standards (Yelp, Google Maps)
- âœ… Simplify codebase maintenance

---

## Quick Execution (3 Steps)

### Step 1: Update Database (2 minutes)

1. Open Supabase SQL Editor
2. Run this query to preview changes:

```sql
SELECT
  id,
  name,
  slug AS old_slug,
  REPLACE(slug, '-restaurants', '') AS new_slug,
  CASE
    WHEN slug LIKE '%-restaurants' THEN 'WILL CHANGE'
    ELSE 'NO CHANGE'
  END AS status
FROM restaurant_cuisines
ORDER BY name;
```

3. Verify 10 cuisines will change
4. Execute the update:

```sql
UPDATE restaurant_cuisines
SET slug = REPLACE(slug, '-restaurants', '')
WHERE slug LIKE '%-restaurants';
```

5. Verify results:

```sql
SELECT id, name, slug
FROM restaurant_cuisines
ORDER BY name;
```

**Expected:** All slugs should be clean (no `-restaurants` suffix)

### Step 2: Test Locally (5 minutes)

```bash
# Run dev server
npm run dev

# Test these URLs in browser:
http://localhost:3000/places-to-eat/japanese
http://localhost:3000/places-to-eat/italian
http://localhost:3000/places-to-eat/asian-fusion
http://localhost:3000/places-to-eat/goai

# Verify:
# - Pages load correctly
# - Schema.org markup shows clean URLs
# - Breadcrumbs render properly
# - Restaurant cards display
```

### Step 3: Deploy (8 minutes)

```bash
# Run production build test
npm run build

# Commit changes
git add .
git commit -m "Standardize cuisine slugs to clean URLs (pre-launch)"

# Push to GitHub (Vercel auto-deploys)
git push origin main
```

Monitor deployment at: https://vercel.com/dashboard

---

## Automated Execution (Alternative)

**Windows:**
```bash
bin\execute-slug-standardization.bat
```

**macOS/Linux:**
```bash
bash bin/execute-slug-standardization.sh
```

---

## What Changes

### Database (10 slugs updated)

| Before | After |
|--------|-------|
| `japanese-restaurants` | `japanese` |
| `italian-restaurants` | `italian` |
| `american-restaurants` | `american` |
| `indian-restaurants` | `indian` |
| `chinese-restaurants` | `chinese` |
| `middle-eastern-restaurants` | `middle-eastern` |
| `mexican-restaurants` | `mexican` |
| `thai-restaurants` | `thai` |
| `lebanese-restaurants` | `lebanese` |
| `french-restaurants` | `french` |

**Unchanged (already clean):** `asian-fusion`, `goai`, `turkish`, `goai-american-fusion`

### Code (1 file updated)

**File:** `src/app/places-to-eat/[cuisine]/page.tsx`
- Updated `generateStaticParams()` to include all 14 cuisines with clean slugs
- Added comment about clean slug requirement

### URLs (Before vs After)

| Before | After |
|--------|-------|
| `/places-to-eat/japanese-restaurants` | `/places-to-eat/japanese` |
| `/places-to-eat/italian-restaurants` | `/places-to-eat/italian` |
| `/places-to-eat/asian-fusion` | `/places-to-eat/asian-fusion` (no change) |

---

## Why No Redirects?

**Reason:** Site is not live yet!

- No indexed URLs in Google
- No user bookmarks
- No external links
- No traffic to redirect

**Result:** Zero impact, zero risk, perfect timing

---

## Post-Launch Verification

After Vercel deploys:

1. **Test Live URLs:**
   - https://bestofgoa.com/places-to-eat/japanese
   - https://bestofgoa.com/places-to-eat/italian

2. **Verify Schema.org:**
   - Test: https://search.google.com/test/rich-results
   - Check: CollectionPage markup, breadcrumbs, ItemList

3. **Check SEO:**
   - Inspect page titles and meta descriptions
   - Verify keywords in content
   - Confirm H1 includes "Restaurants" for context

---

## Rollback (Emergency Only)

**NOT recommended** - but available if critical issue:

```sql
-- Restore -restaurants suffix to original 10 cuisines
UPDATE restaurant_cuisines
SET slug = slug || '-restaurants'
WHERE slug IN (
  'japanese', 'italian', 'american', 'indian', 'chinese',
  'middle-eastern', 'mexican', 'thai', 'lebanese', 'french'
);
```

Then revert code changes and redeploy.

---

## Files Created

- `bin/standardize-cuisine-slugs.sql` - SQL migration script
- `docs/CUISINE_SLUG_STANDARDIZATION.md` - Full documentation
- `bin/execute-slug-standardization.bat` - Windows automation
- `bin/execute-slug-standardization.sh` - macOS/Linux automation

---

## Questions?

Refer to full documentation: `docs/CUISINE_SLUG_STANDARDIZATION.md`

---

**Ready to execute? Run Step 1 above or use the automated script.**
