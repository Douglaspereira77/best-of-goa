-- Migration: Create restaurant_reviews table
-- Purpose: Store individual Google reviews for restaurants
-- Date: 2025-11-01

CREATE TABLE IF NOT EXISTS public.restaurant_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,

  -- Reviewer Information
  reviewer_name VARCHAR(255),
  reviewer_profile_url TEXT,
  reviewer_photo_url TEXT,
  reviewer_review_count INTEGER DEFAULT 0,

  -- Review Content
  review_text TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_date TIMESTAMP,
  review_url TEXT,
  review_id VARCHAR(255) UNIQUE,

  -- Review Metadata
  helpful_count INTEGER DEFAULT 0,
  detailed_ratings JSONB,           -- {Food: 5, Service: 5, Atmosphere: 5}
  review_context JSONB,             -- {Meal type, Wait time, Group size, Price}

  -- Owner Response
  owner_response_text TEXT,
  owner_response_date TIMESTAMP,

  -- Additional Info
  is_local_guide BOOLEAN DEFAULT false,
  original_language VARCHAR(10),

  -- Tracking
  extracted_from VARCHAR(50) DEFAULT 'apify',
  extracted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_review_per_restaurant UNIQUE(restaurant_id, review_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON public.restaurant_reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.restaurant_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON public.restaurant_reviews(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON public.restaurant_reviews(helpful_count DESC);

-- Add comment to table
COMMENT ON TABLE public.restaurant_reviews IS 'Individual Google reviews extracted from Apify. Max 50 reviews per restaurant, deduplicated by review_id.';
COMMENT ON COLUMN public.restaurant_reviews.review_id IS 'Unique Google review ID - used for deduplication on re-extraction';
COMMENT ON COLUMN public.restaurant_reviews.detailed_ratings IS 'JSON object with aspect ratings: {Food: int, Service: int, Atmosphere: int}';
COMMENT ON COLUMN public.restaurant_reviews.review_context IS 'JSON object with context info: {Meal type: string, Wait time: string, Group size: string, Price: string}';
