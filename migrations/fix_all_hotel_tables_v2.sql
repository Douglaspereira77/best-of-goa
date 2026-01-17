-- Migration: Fix ALL hotel related tables (FAQs, Rooms, Policies) - V2 SIMPLIFIED
-- Created: 2025-11-14
-- Purpose: Add missing columns needed by hotel-extraction-orchestrator.ts Step 12

-- ========================================
-- HOTEL_FAQS TABLE
-- ========================================
-- Add source column
ALTER TABLE hotel_faqs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ai_generated';

-- Add display_order column
ALTER TABLE hotel_faqs ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add is_featured column
ALTER TABLE hotel_faqs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add last_updated column
ALTER TABLE hotel_faqs ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- ========================================
-- HOTEL_ROOMS TABLE
-- ========================================
-- Add hotel_room_type_id column (foreign key)
ALTER TABLE hotel_rooms ADD COLUMN IF NOT EXISTS hotel_room_type_id UUID REFERENCES hotel_room_types(id);

-- Add max_occupancy column
ALTER TABLE hotel_rooms ADD COLUMN IF NOT EXISTS max_occupancy INTEGER;

-- Add bed_configuration column
ALTER TABLE hotel_rooms ADD COLUMN IF NOT EXISTS bed_configuration TEXT;

-- Add size_sqm column
ALTER TABLE hotel_rooms ADD COLUMN IF NOT EXISTS size_sqm DECIMAL(8,2);

-- Add amenities column (array)
ALTER TABLE hotel_rooms ADD COLUMN IF NOT EXISTS amenities TEXT[];

-- Add display_order column
ALTER TABLE hotel_rooms ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add is_available column
ALTER TABLE hotel_rooms ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- ========================================
-- HOTEL_POLICIES TABLE
-- ========================================
-- Add policy_type column
ALTER TABLE hotel_policies ADD COLUMN IF NOT EXISTS policy_type TEXT DEFAULT 'general';

-- Add description column
ALTER TABLE hotel_policies ADD COLUMN IF NOT EXISTS description TEXT;

-- Add display_order column
ALTER TABLE hotel_policies ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add is_strict column
ALTER TABLE hotel_policies ADD COLUMN IF NOT EXISTS is_strict BOOLEAN DEFAULT false;

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

-- Done!
SELECT 'Migration complete! All hotel tables fixed.' AS status;
