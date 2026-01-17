-- ============================================================================
-- Best of Goa - Database Migration Script
-- Purpose: Add JSON columns for Apify/Firecrawl outputs and remove imports table
-- ============================================================================

-- Backup existing data (if any)
CREATE TABLE IF NOT EXISTS restaurants_backup AS SELECT * FROM restaurants WHERE false;
INSERT INTO restaurants_backup SELECT * FROM restaurants ON CONFLICT DO NOTHING;

-- Drop old import table
DROP TABLE IF EXISTS restaurant_imports CASCADE;

-- Add new columns to restaurants (one at a time to avoid syntax issues)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS apify_output JSONB;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS firecrawl_output JSONB;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS firecrawl_menu_output JSONB;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS menu_data JSONB;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS hours JSONB;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS import_started_at TIMESTAMPTZ;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS import_completed_at TIMESTAMPTZ;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS job_progress JSONB DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS error_logs JSONB DEFAULT '[]';

-- Update restaurants_dishes table
ALTER TABLE restaurants_dishes ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
ALTER TABLE restaurants_dishes ADD COLUMN IF NOT EXISTS source VARCHAR(50);
ALTER TABLE restaurants_dishes ADD COLUMN IF NOT EXISTS confidence_score FLOAT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_google_place_id ON restaurants(google_place_id);
CREATE INDEX IF NOT EXISTS idx_dishes_popular ON restaurants_dishes(is_popular) WHERE is_popular = true;

-- Update existing restaurants to have 'active' status if NULL
UPDATE restaurants SET status = 'active' WHERE status IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'New columns added to restaurants table';
  RAISE NOTICE 'restaurant_imports table dropped';
  RAISE NOTICE 'restaurants_dishes updated with popular dish tracking';
END $$;
