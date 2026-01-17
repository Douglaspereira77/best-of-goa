-- ============================================================================
-- CUISINE SLUG STANDARDIZATION - PRE-LAUNCH MIGRATION
-- ============================================================================
--
-- Purpose: Remove "-restaurants" suffix from all cuisine slugs
-- Timing: Pre-launch (no SEO impact, no redirects needed)
-- Date: 2025-11-06
--
-- BEFORE (Inconsistent):
--   - japanese-restaurants, italian-restaurants, etc. (10 cuisines)
--   - asian-fusion, goai, turkish, goai-american-fusion (4 cuisines)
--
-- AFTER (Consistent):
--   - japanese, italian, asian-fusion, goai, etc. (all 14 cuisines)
--
-- SEO Rationale:
--   - Clean URLs rank better: /places-to-eat/japanese vs /places-to-eat/japanese-restaurants
--   - Context already clear from parent path: /places-to-eat/
--   - Follows industry leaders (Yelp, Google Maps use short category slugs)
--   - Better keyword targeting for "best japanese goa" queries
-- ============================================================================

-- Step 1: Preview changes (run this first to verify)
SELECT
  id,
  name,
  slug AS old_slug,
  REPLACE(slug, '-restaurants', '') AS new_slug,
  CASE
    WHEN slug LIKE '%-restaurants' THEN 'WILL CHANGE'
    ELSE 'NO CHANGE'
  END AS status
FROM restaurants_cuisines
ORDER BY name;

-- Step 2: Execute the migration (run after verifying preview)
UPDATE restaurants_cuisines
SET slug = REPLACE(slug, '-restaurants', '')
WHERE slug LIKE '%-restaurants';

-- Step 3: Verify results
SELECT
  id,
  name,
  slug,
  created_at,
  CASE
    WHEN slug LIKE '%-restaurants' THEN 'âŒ STILL HAS SUFFIX'
    ELSE 'âœ… CLEAN'
  END AS validation_status
FROM restaurants_cuisines
ORDER BY name;

-- Step 4: Check affected restaurant counts
SELECT
  c.slug AS cuisine_slug,
  c.name AS cuisine_name,
  COUNT(r.id) AS restaurant_count
FROM restaurants_cuisines c
LEFT JOIN restaurants r ON c.id = ANY(r.restaurant_cuisine_ids)
GROUP BY c.id, c.slug, c.name
ORDER BY restaurant_count DESC;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
--
-- 10 cuisines updated:
--   japanese-restaurants    â†’ japanese
--   italian-restaurants     â†’ italian
--   american-restaurants    â†’ american
--   indian-restaurants      â†’ indian
--   chinese-restaurants     â†’ chinese
--   middle-eastern-restaurants â†’ middle-eastern
--   mexican-restaurants     â†’ mexican
--   thai-restaurants        â†’ thai
--   lebanese-restaurants    â†’ lebanese
--   french-restaurants      â†’ french
--
-- 4 cuisines unchanged (already clean):
--   asian-fusion
--   goai
--   turkish
--   goai-american-fusion
--
-- ============================================================================
-- ROLLBACK (if needed - NOT recommended, but available):
-- ============================================================================
--
-- UPDATE restaurants_cuisines
-- SET slug = slug || '-restaurants'
-- WHERE slug IN (
--   'japanese', 'italian', 'american', 'indian', 'chinese',
--   'middle-eastern', 'mexican', 'thai', 'lebanese', 'french'
-- );
--
-- ============================================================================
