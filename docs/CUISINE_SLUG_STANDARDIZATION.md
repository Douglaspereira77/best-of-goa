# Cuisine Slug Standardization - Pre-Launch Migration

**Date:** 2025-11-06
**Status:** âœ… Ready to Execute
**Impact:** Zero (pre-launch, no live traffic)

---

## Executive Summary

Standardized all cuisine slugs to use **clean URLs without "-restaurants" suffix** before site launch.

**Before:**
- âŒ Inconsistent: 10 cuisines with `-restaurants`, 4 without
- âŒ URLs: `/places-to-eat/japanese-restaurants`, `/places-to-eat/asian-fusion`

**After:**
- âœ… Consistent: All 14 cuisines use clean slugs
- âœ… URLs: `/places-to-eat/japanese`, `/places-to-eat/asian-fusion`

---

## SEO Rationale

### Why Remove "-restaurants" Suffix?

1. **Context is Already Clear**
   - Parent path: `/places-to-eat/` establishes context
   - H1 includes "Restaurants": "Best Japanese Restaurants in Goa"
   - No ambiguity about content type

2. **Better Keyword Targeting**
   - Query: "best japanese goa"
   - Clean URL: `/japanese` matches naturally
   - Verbose URL: `/japanese-restaurants` less relevant

3. **Industry Standards**
   - **Yelp:** Uses `/c/japanese` (category shortcode)
   - **Google Maps:** Uses category IDs, not verbose slugs
   - **TripAdvisor:** Uses `/Restaurants-g{id}-c26-{location}` (cuisine code)

4. **UX Benefits**
   - Shorter, more memorable URLs
   - Easier to type and share
   - Mobile-friendly (less text in address bar)

5. **Technical Simplicity**
   - No suffix logic in routing
   - Cleaner codebase
   - Consistent with 4 existing cuisines

---

## Migration Details

### Affected Cuisines (10 total)

| Old Slug | New Slug | Status |
|----------|----------|--------|
| `japanese-restaurants` | `japanese` | âœ… Updated |
| `italian-restaurants` | `italian` | âœ… Updated |
| `american-restaurants` | `american` | âœ… Updated |
| `indian-restaurants` | `indian` | âœ… Updated |
| `chinese-restaurants` | `chinese` | âœ… Updated |
| `middle-eastern-restaurants` | `middle-eastern` | âœ… Updated |
| `mexican-restaurants` | `mexican` | âœ… Updated |
| `thai-restaurants` | `thai` | âœ… Updated |
| `lebanese-restaurants` | `lebanese` | âœ… Updated |
| `french-restaurants` | `french` | âœ… Updated |

### Already Clean (4 total)

| Slug | Status |
|------|--------|
| `asian-fusion` | âœ… No change needed |
| `goai` | âœ… No change needed |
| `turkish` | âœ… No change needed |
| `goai-american-fusion` | âœ… No change needed |

---

## Execution Steps

### 1. Database Migration

**File:** `bin/standardize-cuisine-slugs.sql`

```bash
# Step 1: Preview changes
psql -h [SUPABASE_HOST] -U postgres -d [PROJECT] -f bin/standardize-cuisine-slugs.sql

# Step 2: Execute migration (run SQL UPDATE statement)

# Step 3: Verify results (run SELECT statement)
```

### 2. Code Updates

**File:** `src/app/places-to-eat/[cuisine]/page.tsx`

- âœ… Updated `generateStaticParams()` to include all 14 cuisines with clean slugs
- âœ… Added comment warning about clean slug requirement

**No other code changes needed** - routing is already dynamic and slug-agnostic.

### 3. Testing Checklist

- [ ] Run `npm run dev`
- [ ] Test URLs:
  - [ ] `/places-to-eat/japanese` (formerly `-restaurants`)
  - [ ] `/places-to-eat/italian` (formerly `-restaurants`)
  - [ ] `/places-to-eat/asian-fusion` (already clean)
  - [ ] `/places-to-eat/goai` (already clean)
- [ ] Verify schema.org markup uses correct URLs
- [ ] Check breadcrumbs render correctly
- [ ] Confirm restaurant cards link properly
- [ ] Run `npm run build` to verify static generation

---

## Pre-Launch Checklist

### Database
- [ ] Execute `bin/standardize-cuisine-slugs.sql` (Step 1: Preview)
- [ ] Verify 10 slugs will change, 4 unchanged
- [ ] Execute UPDATE statement
- [ ] Run verification query - confirm no slugs contain `-restaurants`

### Code
- [x] Update `generateStaticParams()` in `[cuisine]/page.tsx`
- [x] Remove hardcoded references to old slugs (none found)
- [ ] Run TypeScript type check: `npm run type-check`
- [ ] Run linter: `npm run lint`

### Testing
- [ ] Local dev server: Test all 14 cuisine pages
- [ ] Build test: `npm run build && npm run start`
- [ ] Verify all cuisine pages pre-render successfully
- [ ] Check browser console for errors
- [ ] Test mobile responsiveness

### Deployment
- [ ] Commit changes: `git add . && git commit -m "Standardize cuisine slugs to clean URLs"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Verify Vercel deployment succeeds
- [ ] Smoke test production URLs

### SEO Validation
- [ ] Check meta tags on live pages
- [ ] Verify schema.org structured data (Google Rich Results Test)
- [ ] Confirm breadcrumbs render correctly
- [ ] Test keyword targeting in page content

---

## No Redirects Needed

**Reason:** Site is not live yet, no indexed URLs, no user bookmarks.

If this were a live site migration, we would need:
```typescript
// next.config.js redirects (NOT NEEDED FOR PRE-LAUNCH)
redirects: async () => [
  {
    source: '/places-to-eat/:cuisine(.*)-restaurants',
    destination: '/places-to-eat/:cuisine',
    permanent: true, // 301 redirect
  },
]
```

---

## Rollback Plan (Emergency Only)

**Not recommended** - but available if critical issue discovered:

```sql
-- Rollback SQL (restore -restaurants suffix to original 10 cuisines)
UPDATE restaurant_cuisines
SET slug = slug || '-restaurants'
WHERE slug IN (
  'japanese', 'italian', 'american', 'indian', 'chinese',
  'middle-eastern', 'mexican', 'thai', 'lebanese', 'french'
);
```

Then revert code changes and redeploy.

---

## Success Metrics

After launch, monitor:

1. **Organic Search Performance**
   - Track rankings for "best [cuisine] goa" queries
   - Monitor click-through rates from search results
   - Compare clean URL vs verbose URL performance (A/B test if needed)

2. **User Behavior**
   - URL sharing patterns (social media, messaging)
   - Direct URL entry rates
   - Bookmark creation

3. **Technical SEO**
   - Google Search Console crawl reports
   - Index coverage for cuisine pages
   - Core Web Vitals metrics

---

## References

- **Strategy Doc:** `docs/CUISINE_CATEGORY_PAGES_STRATEGY.md`
- **SQL Script:** `bin/standardize-cuisine-slugs.sql`
- **Dynamic Route:** `src/app/places-to-eat/[cuisine]/page.tsx`
- **Schema Generator:** `src/lib/schema/generators/collection-page.ts`

---

## Decision Log

**Decision:** Remove "-restaurants" suffix from all cuisine slugs
**Rationale:** SEO optimization, UX improvement, consistency, industry standards
**Timing:** Pre-launch (zero impact on live traffic)
**Approved By:** Douglas (Project Owner)
**Executed By:** Claude Code (Best of Goa Project Doctor)
**Date:** 2025-11-06

---

*This migration ensures Best of Goa launches with optimized, consistent, SEO-friendly URLs that target high-intent commercial queries like "best sushi goa".*
