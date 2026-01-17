-- Migration: Fix ALL hotel related tables (FAQs, Rooms, Policies)
-- Created: 2025-11-14
-- Purpose: Add missing columns needed by hotel-extraction-orchestrator.ts Step 12

-- ========================================
-- HOTEL_FAQS TABLE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '📋 Fixing hotel_faqs table...';

    -- Add source column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_faqs' AND column_name = 'source'
    ) THEN
        ALTER TABLE hotel_faqs ADD COLUMN source TEXT DEFAULT 'ai_generated';
        RAISE NOTICE '  ✅ Added column: source';
    END IF;

    -- Add display_order column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_faqs' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE hotel_faqs ADD COLUMN display_order INTEGER DEFAULT 0;
        RAISE NOTICE '  ✅ Added column: display_order';
    END IF;

    -- Add is_featured column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_faqs' AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE hotel_faqs ADD COLUMN is_featured BOOLEAN DEFAULT false;
        RAISE NOTICE '  ✅ Added column: is_featured';
    END IF;

    -- Add last_updated column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_faqs' AND column_name = 'last_updated'
    ) THEN
        ALTER TABLE hotel_faqs ADD COLUMN last_updated TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '  ✅ Added column: last_updated';
    END IF;

END $$;

-- ========================================
-- HOTEL_ROOMS TABLE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '🛏️  Fixing hotel_rooms table...';

    -- Add hotel_room_type_id column (foreign key)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_rooms' AND column_name = 'hotel_room_type_id'
    ) THEN
        ALTER TABLE hotel_rooms ADD COLUMN hotel_room_type_id UUID REFERENCES hotel_room_types(id);
        RAISE NOTICE '  ✅ Added column: hotel_room_type_id';
    END IF;

    -- Add max_occupancy column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_rooms' AND column_name = 'max_occupancy'
    ) THEN
        ALTER TABLE hotel_rooms ADD COLUMN max_occupancy INTEGER;
        RAISE NOTICE '  ✅ Added column: max_occupancy';
    END IF;

    -- Add bed_configuration column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_rooms' AND column_name = 'bed_configuration'
    ) THEN
        ALTER TABLE hotel_rooms ADD COLUMN bed_configuration TEXT;
        RAISE NOTICE '  ✅ Added column: bed_configuration';
    END IF;

    -- Add size_sqm column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_rooms' AND column_name = 'size_sqm'
    ) THEN
        ALTER TABLE hotel_rooms ADD COLUMN size_sqm DECIMAL(8,2);
        RAISE NOTICE '  ✅ Added column: size_sqm';
    END IF;

    -- Add amenities column (array)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_rooms' AND column_name = 'amenities'
    ) THEN
        ALTER TABLE hotel_rooms ADD COLUMN amenities TEXT[];
        RAISE NOTICE '  ✅ Added column: amenities';
    END IF;

    -- Add display_order column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_rooms' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE hotel_rooms ADD COLUMN display_order INTEGER DEFAULT 0;
        RAISE NOTICE '  ✅ Added column: display_order';
    END IF;

    -- Add is_available column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_rooms' AND column_name = 'is_available'
    ) THEN
        ALTER TABLE hotel_rooms ADD COLUMN is_available BOOLEAN DEFAULT true;
        RAISE NOTICE '  ✅ Added column: is_available';
    END IF;

END $$;

-- ========================================
-- HOTEL_POLICIES TABLE
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '📜 Fixing hotel_policies table...';

    -- Add policy_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_policies' AND column_name = 'policy_type'
    ) THEN
        ALTER TABLE hotel_policies ADD COLUMN policy_type TEXT NOT NULL DEFAULT 'general';
        RAISE NOTICE '  ✅ Added column: policy_type';
    END IF;

    -- Add description column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_policies' AND column_name = 'description'
    ) THEN
        ALTER TABLE hotel_policies ADD COLUMN description TEXT;
        RAISE NOTICE '  ✅ Added column: description';
    END IF;

    -- Add display_order column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_policies' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE hotel_policies ADD COLUMN display_order INTEGER DEFAULT 0;
        RAISE NOTICE '  ✅ Added column: display_order';
    END IF;

    -- Add is_strict column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hotel_policies' AND column_name = 'is_strict'
    ) THEN
        ALTER TABLE hotel_policies ADD COLUMN is_strict BOOLEAN DEFAULT false;
        RAISE NOTICE '  ✅ Added column: is_strict';
    END IF;

END $$;

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================
-- hotel_faqs indexes
CREATE INDEX IF NOT EXISTS idx_hotel_faqs_hotel_id ON hotel_faqs(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_faqs_display_order ON hotel_faqs(display_order);
CREATE INDEX IF NOT EXISTS idx_hotel_faqs_is_featured ON hotel_faqs(is_featured) WHERE is_featured = true;

-- hotel_rooms indexes
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel_id ON hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_display_order ON hotel_rooms(display_order);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_type_id ON hotel_rooms(hotel_room_type_id);

-- hotel_policies indexes
CREATE INDEX IF NOT EXISTS idx_hotel_policies_hotel_id ON hotel_policies(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_policies_type ON hotel_policies(policy_type);

-- ========================================
-- VERIFY CHANGES
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Summary:';
    RAISE NOTICE '  - hotel_faqs: 4 new columns (source, display_order, is_featured, last_updated)';
    RAISE NOTICE '  - hotel_rooms: 7 new columns (hotel_room_type_id, max_occupancy, bed_configuration, size_sqm, amenities, display_order, is_available)';
    RAISE NOTICE '  - hotel_policies: 4 new columns (policy_type, description, display_order, is_strict)';
    RAISE NOTICE '  - Performance indexes created for all tables';
    RAISE NOTICE '';
END $$;

-- Show updated schemas
\echo '📋 HOTEL_FAQS TABLE:';
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'hotel_faqs'
ORDER BY ordinal_position;

\echo '';
\echo '🛏️  HOTEL_ROOMS TABLE:';
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'hotel_rooms'
ORDER BY ordinal_position;

\echo '';
\echo '📜 HOTEL_POLICIES TABLE:';
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'hotel_policies'
ORDER BY ordinal_position;
