-- Phase 1 Field Mapping Improvements
-- Add postal_code, questions_and_answers, and people_also_search columns

-- Add postal_code column
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Add questions_and_answers JSON column
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS questions_and_answers JSONB;

-- Add people_also_search JSON column
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS people_also_search JSONB;

-- Add comments for documentation
COMMENT ON COLUMN restaurants.postal_code IS 'Postal/ZIP code from Google Places';
COMMENT ON COLUMN restaurants.questions_and_answers IS 'Google Places Q&A data (from questionsAndAnswers field)';
COMMENT ON COLUMN restaurants.people_also_search IS 'Related restaurants from Google Places (from peopleAlsoSearch field)';
