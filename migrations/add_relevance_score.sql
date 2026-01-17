-- Add missing relevance_score column to hotel_faqs
ALTER TABLE hotel_faqs ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 50;

-- Add missing category column if needed
ALTER TABLE hotel_faqs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

SELECT 'Added relevance_score and category columns to hotel_faqs' AS status;
