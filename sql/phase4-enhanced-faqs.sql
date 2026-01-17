-- Phase 4: Enhanced FAQ System
-- Update restaurants_faqs table with new columns for better FAQ management

-- Add new columns to restaurants_faqs table
ALTER TABLE restaurants_faqs
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'ai_generated',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_restaurants_faqs_category ON restaurants_faqs(restaurant_id, category);
CREATE INDEX IF NOT EXISTS idx_restaurants_faqs_relevance ON restaurants_faqs(restaurant_id, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_faqs_featured ON restaurants_faqs(restaurant_id, is_featured) WHERE is_featured = true;

-- Add comment for clarity
COMMENT ON COLUMN restaurants_faqs.category IS 'FAQ category: reservations, menu, parking, hours, pricing, dietary, service, payment, dress_code, delivery, location, atmosphere, wait_times, kids, loyalty';
COMMENT ON COLUMN restaurants_faqs.relevance_score IS 'Relevance 0-100 based on review mentions and customer concern frequency';
COMMENT ON COLUMN restaurants_faqs.source IS 'Source of FAQ: ai_generated, review_based, manual';
COMMENT ON COLUMN restaurants_faqs.is_featured IS 'Whether to display on restaurant homepage/featured section';

-- Migration: Update existing FAQs with default values (optional - run once)
-- UPDATE restaurants_faqs SET category = 'general' WHERE category IS NULL;
