-- ============================================================================
-- Fix Array Column Type Mismatch
-- Problem: Reference tables use UUID, but restaurants arrays expect int4
-- Solution: Convert all array columns from int4[] to uuid[]
-- Date: 2025-01-11
-- ============================================================================

BEGIN;

-- Drop existing GIN indexes (they'll be recreated after type change)
DROP INDEX IF EXISTS idx_restaurants_cuisine_ids;
DROP INDEX IF EXISTS idx_restaurants_category_ids;
DROP INDEX IF EXISTS idx_restaurants_feature_ids;
DROP INDEX IF EXISTS idx_restaurants_meal_ids;
DROP INDEX IF EXISTS idx_restaurants_good_for_ids;

-- Step 1: Drop default values (they prevent type conversion)
ALTER TABLE restaurants ALTER COLUMN restaurant_cuisine_ids DROP DEFAULT;
ALTER TABLE restaurants ALTER COLUMN restaurant_category_ids DROP DEFAULT;
ALTER TABLE restaurants ALTER COLUMN restaurant_feature_ids DROP DEFAULT;
ALTER TABLE restaurants ALTER COLUMN restaurant_meal_ids DROP DEFAULT;
ALTER TABLE restaurants ALTER COLUMN restaurant_good_for_ids DROP DEFAULT;

-- Step 2: Change array column types from int4[] to uuid[]
ALTER TABLE restaurants ALTER COLUMN restaurant_cuisine_ids TYPE uuid[] USING restaurant_cuisine_ids::text[]::uuid[];
ALTER TABLE restaurants ALTER COLUMN restaurant_category_ids TYPE uuid[] USING restaurant_category_ids::text[]::uuid[];
ALTER TABLE restaurants ALTER COLUMN restaurant_feature_ids TYPE uuid[] USING restaurant_feature_ids::text[]::uuid[];
ALTER TABLE restaurants ALTER COLUMN restaurant_meal_ids TYPE uuid[] USING restaurant_meal_ids::text[]::uuid[];
ALTER TABLE restaurants ALTER COLUMN restaurant_good_for_ids TYPE uuid[] USING restaurant_good_for_ids::text[]::uuid[];

-- Step 3: Restore default values (now as empty uuid arrays)
ALTER TABLE restaurants ALTER COLUMN restaurant_cuisine_ids SET DEFAULT '{}';
ALTER TABLE restaurants ALTER COLUMN restaurant_category_ids SET DEFAULT '{}';
ALTER TABLE restaurants ALTER COLUMN restaurant_feature_ids SET DEFAULT '{}';
ALTER TABLE restaurants ALTER COLUMN restaurant_meal_ids SET DEFAULT '{}';
ALTER TABLE restaurants ALTER COLUMN restaurant_good_for_ids SET DEFAULT '{}';

-- Update comments to reflect UUID arrays
COMMENT ON COLUMN restaurants.restaurant_cuisine_ids IS 'Array of cuisine UUIDs - Omar pattern for many-to-many without junction tables';
COMMENT ON COLUMN restaurants.restaurant_category_ids IS 'Array of category UUIDs - Omar pattern for many-to-many without junction tables';
COMMENT ON COLUMN restaurants.restaurant_feature_ids IS 'Array of feature UUIDs - Omar pattern for many-to-many without junction tables';
COMMENT ON COLUMN restaurants.restaurant_meal_ids IS 'Array of meal UUIDs - Omar pattern for many-to-many without junction tables';
COMMENT ON COLUMN restaurants.restaurant_good_for_ids IS 'Array of good_for UUIDs - Omar pattern for many-to-many without junction tables';

-- Recreate GIN indexes for UUID arrays
CREATE INDEX idx_restaurants_cuisine_ids ON restaurants USING GIN (restaurant_cuisine_ids);
CREATE INDEX idx_restaurants_category_ids ON restaurants USING GIN (restaurant_category_ids);
CREATE INDEX idx_restaurants_feature_ids ON restaurants USING GIN (restaurant_feature_ids);
CREATE INDEX idx_restaurants_meal_ids ON restaurants USING GIN (restaurant_meal_ids);
CREATE INDEX idx_restaurants_good_for_ids ON restaurants USING GIN (restaurant_good_for_ids);

-- Verification
DO $$
DECLARE
    cuisine_type text;
    category_type text;
    feature_type text;
    meal_type text;
    good_for_type text;
BEGIN
    -- Check column types
    SELECT data_type INTO cuisine_type
    FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'restaurant_cuisine_ids';

    SELECT data_type INTO category_type
    FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'restaurant_category_ids';

    SELECT data_type INTO feature_type
    FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'restaurant_feature_ids';

    SELECT data_type INTO meal_type
    FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'restaurant_meal_ids';

    SELECT data_type INTO good_for_type
    FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'restaurant_good_for_ids';

    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'COLUMN TYPE VERIFICATION';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'restaurant_cuisine_ids: %', cuisine_type;
    RAISE NOTICE 'restaurant_category_ids: %', category_type;
    RAISE NOTICE 'restaurant_feature_ids: %', feature_type;
    RAISE NOTICE 'restaurant_meal_ids: %', meal_type;
    RAISE NOTICE 'restaurant_good_for_ids: %', good_for_type;

    IF cuisine_type = 'ARRAY' AND category_type = 'ARRAY' AND feature_type = 'ARRAY'
       AND meal_type = 'ARRAY' AND good_for_type = 'ARRAY' THEN
        RAISE NOTICE 'SUCCESS: All array columns converted to uuid[]!';
    ELSE
        RAISE NOTICE 'WARNING: Some columns may not have converted correctly';
    END IF;
    RAISE NOTICE '============================================================================';
END $$;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ARRAY COLUMN TYPE FIX COMPLETED!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '- Converted restaurant_cuisine_ids from int4[] to uuid[]';
  RAISE NOTICE '- Converted restaurant_category_ids from int4[] to uuid[]';
  RAISE NOTICE '- Converted restaurant_feature_ids from int4[] to uuid[]';
  RAISE NOTICE '- Converted restaurant_meal_ids from int4[] to uuid[]';
  RAISE NOTICE '- Converted restaurant_good_for_ids from int4[] to uuid[]';
  RAISE NOTICE '- Recreated all GIN indexes for UUID arrays';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update TypeScript types in data-mapper.ts (id: number -> id: string)';
  RAISE NOTICE '2. Update restaurant-queries.ts types if needed';
  RAISE NOTICE '3. Test restaurant mapping workflow';
  RAISE NOTICE '============================================================================';
END $$;
