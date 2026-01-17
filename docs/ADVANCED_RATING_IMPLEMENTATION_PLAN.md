# Advanced Rating System - Implementation Plan
**Date:** 2025-11-13
**Project:** Best of Goa
**Priority:** High

---

## OVERVIEW

Implementing sophisticated Best of Goa scoring algorithm with:
- 5-component weighted breakdown (Food, Service, Ambience, Value, Accessibility)
- Multi-source aggregation (Google + TripAdvisor)
- Transparent display showing both BOK Score and source ratings

---

## PHASE 1: DATABASE SCHEMA UPDATES

### New Fields Needed

```sql
-- Add to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS bok_score NUMERIC(3,1), -- Best of Goa Score (0-10)
ADD COLUMN IF NOT EXISTS bok_score_breakdown JSONB, -- Component scores
ADD COLUMN IF NOT EXISTS bok_score_calculated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS bok_score_version TEXT DEFAULT '2.0';

-- Rename existing field to avoid confusion
ALTER TABLE restaurants
RENAME COLUMN rating_breakdown TO star_distribution;

-- Add missing fields for advanced algorithm
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS average_meal_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS accessibility_features TEXT[];

-- Add comments
COMMENT ON COLUMN restaurants.bok_score IS 'Best of Goa proprietary rating (0-10 scale)';
COMMENT ON COLUMN restaurants.bok_score_breakdown IS 'Component scores: food_quality, service, ambience, value_for_money, accessibility_amenities';
COMMENT ON COLUMN restaurants.star_distribution IS 'Google star distribution (1-5 star counts)';
COMMENT ON COLUMN restaurants.overall_rating IS 'DEPRECATED: Use bok_score instead';
```

### Field Mapping

| Old Field | New Field | Purpose |
|-----------|-----------|---------|
| `rating_breakdown` | `star_distribution` | Star count distribution (1-5 stars) |
| `overall_rating` | Keep temporarily | Legacy field for backward compatibility |
| N/A | `bok_score` | New Best of Goa score |
| N/A | `bok_score_breakdown` | Component scores (food, service, etc.) |

---

## PHASE 2: UPDATE RATING SERVICE

### Current Issues to Fix

**Issue #1: Scale Normalization**
- Google uses 0-5 scale
- TripAdvisor uses 0-5 scale
- RatingService expects 0-10 scale

**Fix:** Add normalization in `aggregateReviewSources()`

```typescript
// Normalize all ratings to 0-10 scale
if (restaurantData.google_rating && restaurantData.google_review_count) {
  sources.push({
    source: 'google',
    rating: (restaurantData.google_rating / 5) * 10, // Normalize to 10
    review_count: restaurantData.google_review_count,
    last_updated: new Date().toISOString()
  })
}
```

**Issue #2: Missing Data Handling**
- `average_meal_price` might be null
- `accessibility_features` might be empty

**Fix:** Add fallback logic in calculation methods

---

## PHASE 3: EXTRACTION PIPELINE INTEGRATION

### Add to Extraction Orchestrator

**New Step: Calculate BOK Score (after Step 9 - AI Enhancement)**

```typescript
// Step 10: Calculate Best of Goa Score
await this.runStep(job.restaurantId, 'bok_score', async () => {
  restaurant = await this.getRestaurant(job.restaurantId);

  console.log('[Orchestrator] Calculating Best of Goa Score');

  const ratingData = {
    google_rating: restaurant.google_rating,
    google_review_count: restaurant.google_review_count,
    tripadvisor_rating: restaurant.tripadvisor_rating,
    tripadvisor_review_count: restaurant.tripadvisor_review_count,
    review_sentiment: restaurant.review_sentiment,
    price_level: restaurant.price_level,
    average_meal_price: restaurant.average_meal_price,
    accessibility_features: restaurant.accessibility_features,
    features: restaurant.features,
    awards: restaurant.awards,
    description: restaurant.description,
    short_description: restaurant.short_description
  };

  const ratingResult = await this.ratingService.calculateRestaurantRating(ratingData);

  await this.updateRestaurantFields(job.restaurantId, {
    bok_score: ratingResult.overall_rating,
    bok_score_breakdown: ratingResult.rating_breakdown,
    total_reviews_aggregated: ratingResult.total_reviews_aggregated,
    bok_score_calculated_at: new Date().toISOString(),
    bok_score_version: '2.0'
  });

  console.log(`[Orchestrator] BOK Score: ${ratingResult.overall_rating}/10`);
  console.log('[Orchestrator] Component Breakdown:', ratingResult.rating_breakdown);
});
```

---

## PHASE 4: UI UPDATES

### Restaurant Detail Page Updates

**File:** `src/app/places-to-eat/restaurants/[slug]/page.tsx`

**Current Display:**
- Shows `overall_rating` (0-10)
- Shows Google rating
- Shows star distribution chart

**New Display:**

```tsx
{/* Best of Goa Score - Primary */}
<div className="mb-6">
  <div className="flex items-center gap-3">
    <div className="text-5xl font-bold text-green-600">
      {restaurant.bok_score || restaurant.overall_rating}
    </div>
    <div>
      <div className="text-lg font-semibold">
        {getRatingDescription(restaurant.bok_score || restaurant.overall_rating)}
      </div>
      <div className="text-sm text-gray-600">
        Best of Goa Score
      </div>
    </div>
  </div>

  {/* Component Breakdown - Expandable */}
  {restaurant.bok_score_breakdown && (
    <details className="mt-4">
      <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
        Show Rating Breakdown â–¼
      </summary>
      <div className="mt-3 space-y-2">
        <RatingBar label="Food Quality" score={restaurant.bok_score_breakdown.food_quality} />
        <RatingBar label="Service" score={restaurant.bok_score_breakdown.service} />
        <RatingBar label="Ambience" score={restaurant.bok_score_breakdown.ambience} />
        <RatingBar label="Value for Money" score={restaurant.bok_score_breakdown.value_for_money} />
        <RatingBar label="Accessibility" score={restaurant.bok_score_breakdown.accessibility_amenities} />
      </div>
    </details>
  )}
</div>

{/* Source Ratings - Secondary */}
<div className="mt-4 p-4 bg-gray-50 rounded-lg">
  <div className="text-sm font-medium text-gray-700 mb-2">
    Based on {restaurant.total_reviews_aggregated} reviews from:
  </div>
  <div className="space-y-1 text-sm">
    {restaurant.google_rating && (
      <div className="flex items-center gap-2">
        <span className="font-medium">Google:</span>
        <span>{restaurant.google_rating}/5</span>
        <span className="text-gray-500">({restaurant.google_review_count} reviews)</span>
      </div>
    )}
    {restaurant.tripadvisor_rating && (
      <div className="flex items-center gap-2">
        <span className="font-medium">TripAdvisor:</span>
        <span>{restaurant.tripadvisor_rating}/5</span>
        <span className="text-gray-500">({restaurant.tripadvisor_review_count} reviews)</span>
      </div>
    )}
  </div>
</div>
```

**New Component:** `RatingBar`

```tsx
interface RatingBarProps {
  label: string
  score: number
}

function RatingBar({ label, score }: RatingBarProps) {
  const percentage = (score / 10) * 100

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-semibold">{score}/10</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
```

---

## PHASE 5: MIGRATION SCRIPT

### Backfill Existing Restaurants

**File:** `bin/migrate-to-advanced-rating.js`

```javascript
import { createClient } from '@supabase/supabase-js'
import { RatingService } from '../src/lib/services/rating-service.ts'

// Fetch all restaurants
// For each restaurant:
//   1. Calculate BOK score using RatingService
//   2. Update bok_score, bok_score_breakdown fields
//   3. Log progress
```

---

## IMPLEMENTATION SEQUENCE

### Step 1: Database Migration (15 min)
- Create SQL migration file
- Run migration on Supabase
- Verify new columns exist

### Step 2: Update RatingService (30 min)
- Fix scale normalization
- Add missing data fallbacks
- Test with sample data

### Step 3: Update Extraction Orchestrator (20 min)
- Add Step 10: Calculate BOK Score
- Import RatingService
- Test with one restaurant extraction

### Step 4: Create UI Components (45 min)
- Create RatingBar component
- Update restaurant detail page
- Test display with various data states

### Step 5: Migration Script (30 min)
- Create backfill script
- Run on all existing restaurants
- Verify results

### Step 6: Testing & Validation (30 min)
- Test 10 sample restaurants
- Verify component scores make sense
- Check UI displays correctly

**Total Estimated Time:** 2.5-3 hours

---

## QUESTIONS BEFORE STARTING

1. **Average Meal Price:** Do we have this data anywhere? Or should we estimate from `price_level`?

2. **Accessibility Features:** Should we extract from descriptions or leave empty for now?

3. **Backward Compatibility:** Should we keep displaying `overall_rating` for restaurants without BOK scores yet?

4. **TripAdvisor Data:** We have the field but it's rarely populated. Should we:
   - Extract TripAdvisor during pipeline (adds time/cost)
   - Use only when available
   - Ignore for now

5. **Display Priority:** Should BOK Score completely replace Google rating in the primary display? Or show both prominently?

---

## SUCCESS CRITERIA

- âœ… All restaurants have `bok_score` calculated
- âœ… Component breakdown displays correctly
- âœ… BOK Score differs from simple Google Ã— 2 conversion
- âœ… UI shows transparent source attribution
- âœ… Algorithm considers food quality, service, ambience, value, accessibility
- âœ… Score recalculates during future extractions

---

**Ready to proceed, Douglas?**

Let me know your answers to the questions above, and I'll start with Phase 1 immediately!
