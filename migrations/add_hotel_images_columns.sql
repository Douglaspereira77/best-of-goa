-- Migration: Add missing columns to hotel_images table
-- Created: 2025-11-14
-- Purpose: Fix hotel image extraction - add columns needed by hotel-image-extractor.ts

-- Add missing columns to hotel_images table
-- Using DO block for IF NOT EXISTS logic (PostgreSQL 9.6+)

DO $$
BEGIN
    -- Add title column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'title'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN title TEXT;
        RAISE NOTICE 'Added column: title';
    END IF;

    -- Add description column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'description'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN description TEXT;
        RAISE NOTICE 'Added column: description';
    END IF;

    -- Add type column (hero, gallery, etc.)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'type'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN type TEXT DEFAULT 'gallery';
        RAISE NOTICE 'Added column: type';
    END IF;

    -- Add source column (google_places, website, etc.)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'source'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN source TEXT DEFAULT 'manual';
        RAISE NOTICE 'Added column: source';
    END IF;

    -- Add display_order column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN display_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Added column: display_order';
    END IF;

    -- Add approved column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'approved'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN approved BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added column: approved';
    END IF;

    -- Ensure is_hero column exists (should already exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'is_hero'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN is_hero BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added column: is_hero';
    END IF;

    -- Add storage_path column if missing (used by extractor)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'storage_path'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN storage_path TEXT;
        RAISE NOTICE 'Added column: storage_path';
    END IF;

    -- Add hero_score column if missing (used for hero selection)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'hero_score'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN hero_score INTEGER DEFAULT 50;
        RAISE NOTICE 'Added column: hero_score';
    END IF;

    -- Add content_descriptor column if missing (SEO slug from Vision API)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'content_descriptor'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN content_descriptor TEXT;
        RAISE NOTICE 'Added column: content_descriptor';
    END IF;

    -- Add width column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'width'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN width INTEGER;
        RAISE NOTICE 'Added column: width';
    END IF;

    -- Add height column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'height'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN height INTEGER;
        RAISE NOTICE 'Added column: height';
    END IF;

    -- Add file_size_kb column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_images' AND column_name = 'file_size_kb'
    ) THEN
        ALTER TABLE hotel_images ADD COLUMN file_size_kb INTEGER;
        RAISE NOTICE 'Added column: file_size_kb';
    END IF;

END $$;

-- Create index on hotel_id for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_hotel_images_hotel_id ON hotel_images(hotel_id);

-- Create index on is_hero for quick hero image lookups
CREATE INDEX IF NOT EXISTS idx_hotel_images_is_hero ON hotel_images(is_hero) WHERE is_hero = true;

-- Create index on display_order for sorting
CREATE INDEX IF NOT EXISTS idx_hotel_images_display_order ON hotel_images(display_order);

-- Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'hotel_images'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration complete! hotel_images table now has all required columns.';
END $$;
