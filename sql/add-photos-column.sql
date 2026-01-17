-- Add photos column to restaurants table for image gallery
-- This will store an array of image metadata as JSONB

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN restaurants.photos IS 'Gallery of restaurant images with SEO metadata (alt, title, description, quality scores)';

-- Verify the column was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'restaurants'
    AND column_name = 'photos'
  ) THEN
    RAISE NOTICE 'SUCCESS: photos column added to restaurants table';
  ELSE
    RAISE EXCEPTION 'FAILED: photos column was not added';
  END IF;
END $$;
