-- ============================================================================
-- Best of Goa - Migration to Omar's Pattern
-- Purpose: Convert from junction tables to array-based relationships
-- Date: 2025-01-27
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. DROP JUNCTION TABLES
-- ============================================================================

-- Drop all junction tables that are no longer needed
DROP TABLE IF EXISTS restaurants_cuisines_junction CASCADE;
DROP TABLE IF EXISTS restaurants_categories_junction CASCADE;
DROP TABLE IF EXISTS restaurants_good_for_junction CASCADE;
DROP TABLE IF EXISTS restaurants_features_junction CASCADE;
DROP TABLE IF EXISTS restaurants_meals_junction CASCADE;
DROP TABLE IF EXISTS restaurants_dish_types_junction CASCADE;

-- ============================================================================
-- 2. ADD ARRAY COLUMNS TO RESTAURANTS TABLE
-- ============================================================================

-- Add array columns for many-to-many relationships (Omar's pattern)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS restaurant_cuisine_ids int4[] DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS restaurant_category_ids int4[] DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS restaurant_feature_ids int4[] DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS restaurant_meal_ids int4[] DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS restaurant_good_for_ids int4[] DEFAULT '{}';

-- Add comments explaining the pattern
COMMENT ON COLUMN restaurants.restaurant_cuisine_ids IS 'Array of cuisine IDs - Omar pattern for many-to-many without junction tables';
COMMENT ON COLUMN restaurants.restaurant_category_ids IS 'Array of category IDs - Omar pattern for many-to-many without junction tables';
COMMENT ON COLUMN restaurants.restaurant_feature_ids IS 'Array of feature IDs - Omar pattern for many-to-many without junction tables';
COMMENT ON COLUMN restaurants.restaurant_meal_ids IS 'Array of meal IDs - Omar pattern for many-to-many without junction tables';
COMMENT ON COLUMN restaurants.restaurant_good_for_ids IS 'Array of good_for IDs - Omar pattern for many-to-many without junction tables';

-- ============================================================================
-- 3. CREATE NEIGHBORHOOD TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS restaurant_neighborhoods (
  id int4 PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT UNIQUE NOT NULL, -- "Goa City", "Salmiya", "Hawally"
  slug TEXT UNIQUE NOT NULL, -- "goa-city", "salmiya", "hawally"
  name_ar TEXT, -- Arabic name
  description TEXT, -- For SEO landing pages
  area_code TEXT, -- Optional area code
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE restaurant_neighborhoods IS 'Goa neighborhoods/areas - single foreign key relationship to restaurants';

-- ============================================================================
-- 4. CREATE MICHELIN GUIDE AWARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS michelin_guide_awards (
  id int4 PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT UNIQUE NOT NULL, -- "Michelin Star", "Bib Gourmand", "Green Star"
  description TEXT, -- Award description
  stars INTEGER CHECK (stars BETWEEN 0 AND 3), -- 0=no star, 1-3=stars
  year INTEGER, -- Year awarded
  is_active BOOLEAN DEFAULT true, -- Still current award
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE michelin_guide_awards IS 'Michelin Guide awards - single foreign key relationship to restaurants';

-- ============================================================================
-- 5. ADD FOREIGN KEY COLUMNS TO RESTAURANTS
-- ============================================================================

-- Add foreign key columns for single relationships
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS neighborhood_id int4 REFERENCES restaurant_neighborhoods(id);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS michelin_guide_award_id int4 REFERENCES michelin_guide_awards(id);

-- Add comments
COMMENT ON COLUMN restaurants.neighborhood_id IS 'Single neighborhood reference - foreign key to restaurant_neighborhoods';
COMMENT ON COLUMN restaurants.michelin_guide_award_id IS 'Single Michelin award reference - foreign key to michelin_guide_awards';

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- GIN indexes for array columns (Omar's pattern)
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine_ids ON restaurants USING GIN (restaurant_cuisine_ids);
CREATE INDEX IF NOT EXISTS idx_restaurants_category_ids ON restaurants USING GIN (restaurant_category_ids);
CREATE INDEX IF NOT EXISTS idx_restaurants_feature_ids ON restaurants USING GIN (restaurant_feature_ids);
CREATE INDEX IF NOT EXISTS idx_restaurants_meal_ids ON restaurants USING GIN (restaurant_meal_ids);
CREATE INDEX IF NOT EXISTS idx_restaurants_good_for_ids ON restaurants USING GIN (restaurant_good_for_ids);

-- Indexes for foreign key columns
CREATE INDEX IF NOT EXISTS idx_restaurants_neighborhood ON restaurants(neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_michelin_award ON restaurants(michelin_guide_award_id);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_restaurant_neighborhoods_slug ON restaurant_neighborhoods(slug);
CREATE INDEX IF NOT EXISTS idx_michelin_guide_awards_name ON michelin_guide_awards(name);
CREATE INDEX IF NOT EXISTS idx_michelin_guide_awards_stars ON michelin_guide_awards(stars);

-- ============================================================================
-- 7. SEED REFERENCE DATA
-- ============================================================================

-- Insert common neighborhoods in Goa
INSERT INTO restaurant_neighborhoods (name, slug, name_ar, description, display_order) VALUES
('Goa City', 'goa-city', 'Ù…Ø¯ÙŠÙ†Ø© Ø§Ù„ÙƒÙˆÙŠØª', 'The capital and commercial center of Goa', 1),
('Salmiya', 'salmiya', 'Ø§Ù„Ø³Ø§Ù„Ù…ÙŠØ©', 'Popular residential and commercial area', 2),
('Hawally', 'hawally', 'Ø­ÙˆÙ„ÙŠ', 'Central residential district', 3),
('Jahra', 'jahra', 'Ø§Ù„Ø¬Ù‡Ø±Ø§Ø¡', 'Northern governorate of Goa', 4),
('Ahmadi', 'ahmadi', 'Ø§Ù„Ø£Ø­Ù…Ø¯ÙŠ', 'Southern governorate with oil industry', 5),
('Farwaniya', 'farwaniya', 'Ø§Ù„ÙØ±ÙˆØ§Ù†ÙŠØ©', 'Western governorate', 6),
('Mubarak Al-Kabeer', 'mubarak-al-kabeer', 'Ù…Ø¨Ø§Ø±Ùƒ Ø§Ù„ÙƒØ¨ÙŠØ±', 'Southern governorate', 7)
ON CONFLICT (slug) DO NOTHING;

-- Insert common Michelin Guide awards
INSERT INTO michelin_guide_awards (name, description, stars, year, is_active, display_order) VALUES
('No Award', 'Not currently recognized by Michelin Guide', 0, NULL, true, 1),
('Bib Gourmand', 'Good quality, good value cooking', 0, 2024, true, 2),
('Michelin Star', 'High quality cooking, worth a stop', 1, 2024, true, 3),
('Two Michelin Stars', 'Excellent cooking, worth a detour', 2, 2024, true, 4),
('Three Michelin Stars', 'Exceptional cuisine, worth a special journey', 3, 2024, true, 5),
('Green Star', 'Restaurant at the forefront of sustainable gastronomy', 0, 2024, true, 6)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 8. UPDATE REFERENCE TABLES TO USE INT4 IDs
-- ============================================================================

-- Note: The reference tables (cuisines, categories, etc.) should already exist
-- and should use int4 IDs to match the array pattern. If they use UUIDs,
-- we would need to convert them, but for now we assume they're already int4.

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Verify the migration was successful
DO $$
DECLARE
    junction_count INTEGER;
    array_columns_count INTEGER;
    neighborhood_count INTEGER;
    michelin_count INTEGER;
BEGIN
    -- Check junction tables are gone
    SELECT COUNT(*) INTO junction_count
    FROM information_schema.tables 
    WHERE table_name LIKE '%_junction' 
    AND table_schema = 'public';
    
    -- Check array columns exist
    SELECT COUNT(*) INTO array_columns_count
    FROM information_schema.columns 
    WHERE table_name = 'restaurants' 
    AND column_name LIKE '%_ids'
    AND data_type = 'ARRAY';
    
    -- Check new tables exist
    SELECT COUNT(*) INTO neighborhood_count
    FROM information_schema.tables 
    WHERE table_name = 'restaurant_neighborhoods';
    
    SELECT COUNT(*) INTO michelin_count
    FROM information_schema.tables 
    WHERE table_name = 'michelin_guide_awards';
    
    -- Report results
    RAISE NOTICE 'Migration Results:';
    RAISE NOTICE 'Junction tables remaining: %', junction_count;
    RAISE NOTICE 'Array columns added: %', array_columns_count;
    RAISE NOTICE 'Neighborhood table created: %', neighborhood_count;
    RAISE NOTICE 'Michelin table created: %', michelin_count;
    
    -- Verify success
    IF junction_count = 0 AND array_columns_count = 5 AND neighborhood_count = 1 AND michelin_count = 1 THEN
        RAISE NOTICE 'SUCCESS: Migration to Omar pattern completed successfully!';
    ELSE
        RAISE NOTICE 'WARNING: Migration may not have completed successfully. Please check the results above.';
    END IF;
END $$;

-- ============================================================================
-- 10. EXAMPLE QUERIES (COMMENTED OUT)
-- ============================================================================

/*
-- Example queries using the new Omar pattern:

-- Find restaurants by cuisine (using array)
SELECT r.name, r.restaurant_cuisine_ids
FROM restaurants r
WHERE 1 = ANY(r.restaurant_cuisine_ids); -- Japanese cuisine (ID 1)

-- Find restaurants by multiple features
SELECT r.name, r.restaurant_feature_ids
FROM restaurants r
WHERE r.restaurant_feature_ids && ARRAY[1, 2, 3]; -- Has any of these features

-- Find restaurants in a specific neighborhood
SELECT r.name, n.name as neighborhood
FROM restaurants r
JOIN restaurant_neighborhoods n ON r.neighborhood_id = n.id
WHERE n.slug = 'goa-city';

-- Find Michelin-starred restaurants
SELECT r.name, m.name as award, m.stars
FROM restaurants r
JOIN michelin_guide_awards m ON r.michelin_guide_award_id = m.id
WHERE m.stars > 0;

-- Count restaurants by cuisine (using array)
SELECT c.name, COUNT(*)
FROM restaurants r
JOIN restaurants_cuisines c ON c.id = ANY(r.restaurant_cuisine_ids)
GROUP BY c.id, c.name;
*/

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'MIGRATION TO OMAR PATTERN COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '- Dropped 6 junction tables';
  RAISE NOTICE '- Added 5 array columns to restaurants table';
  RAISE NOTICE '- Created restaurant_neighborhoods table';
  RAISE NOTICE '- Created michelin_guide_awards table';
  RAISE NOTICE '- Added foreign key columns to restaurants';
  RAISE NOTICE '- Created GIN indexes for array performance';
  RAISE NOTICE '- Seeded reference data';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update your application code to use array queries';
  RAISE NOTICE '2. Test the new pattern with sample data';
  RAISE NOTICE '3. Update documentation';
  RAISE NOTICE '============================================================================';
END $$;
