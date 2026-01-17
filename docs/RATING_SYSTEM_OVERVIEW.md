# Best of Goa - Rating System Overview
**Date:** 2025-11-13
**Analyst:** Claude Code

---

## EXECUTIVE SUMMARY

The Best of Goa rating system currently has **TWO IMPLEMENTATIONS** that are not aligned:

1. **Advanced Rating Service** (`rating-service.ts`) - Sophisticated weighted algorithm (NOT IN USE)
2. **Current Simple System** - Basic Google ratings display (CURRENTLY ACTIVE)

**Coverage:** 68% of restaurants (321 out of 469) have rating data

---

## CURRENT IMPLEMENTATION (Active)

### Database Fields

| Field | Type | Purpose | Coverage |
|-------|------|---------|----------|
| `google_rating` | number | Google Maps rating (0-5 scale) | High |
| `google_review_count` | number | Number of Google reviews | High |
| `tripadvisor_rating` | number | TripAdvisor rating | Low |
| `tripadvisor_review_count` | number | TripAdvisor review count | Low |
| `rating_breakdown` | JSON | Star distribution (1-5 stars) | 68% |
| `overall_rating` | number | Overall calculated rating (0-10 scale) | 68% |
| `review_sentiment` | string | AI-generated sentiment summary | High |

### Sample Data (MR CAT BURGER)

```json
{
  "google_rating": 4.5,
  "google_review_count": 168,
  "overall_rating": 9,
  "rating_breakdown": {
    "oneStar": 10,
    "twoStar": 6,
    "threeStar": 7,
    "fourStar": 16,
    "fiveStar": 129
  },
  "review_sentiment": "Customers love the friendly and attentive staff..."
}
```

### Current Rating Display

**What Users See:**
- Google rating (4.5 â­) with review count
- Star rating distribution chart
- Review sentiment summary

**What's NOT Being Used:**
- Advanced weighted algorithm
- Multi-source aggregation
- Category-specific breakdowns (food, service, ambience, etc.)

---

## ADVANCED RATING SERVICE (Not Active)

### Algorithm Details

**Location:** `src/lib/services/rating-service.ts`
**Version:** 2.0
**Status:** Built but not integrated into extraction pipeline

### Weighted Components

| Component | Weight | What It Measures |
|-----------|--------|------------------|
| **Food Quality** | 35% | Reviews, awards, description quality |
| **Service** | 25% | Review sentiment, multiple sources |
| **Ambience** | 20% | Features, descriptions, atmosphere keywords |
| **Value for Money** | 15% | Price level vs ratings |
| **Accessibility/Amenities** | 5% | Features, accessibility options |

### Advanced Features

1. **Multi-Source Aggregation**
   - Google Reviews
   - TripAdvisor
   - OpenTable
   - AI Sentiment Analysis

2. **Weighted Averaging**
   - More reviews = more weight
   - Multiple sources increase confidence

3. **Component Scoring**
   - Food Quality: Base + awards + content quality
   - Service: Base + review sources + contact info
   - Ambience: Base + features + descriptions
   - Value: Base + price level adjustments
   - Accessibility: Base + features count

4. **Rating Descriptions**
   - 9.0+: "Exceptional"
   - 8.0-8.9: "Excellent"
   - 7.0-7.9: "Very Good"
   - 6.0-6.9: "Good"
   - 5.0-5.9: "Average"

---

## ISSUES & OBSERVATIONS

### Issue #1: Two Systems, One Database
**Problem:** The sophisticated `RatingService` class exists but the extraction pipeline uses a simpler approach.

**Current Flow:**
```
Apify Extract â†’ Google rating â†’ Store in google_rating field
     â†“
Calculate overall_rating (simple conversion from 5-point to 10-point scale)
     â†“
Store rating_breakdown (star distribution)
```

**Advanced Flow (Not Used):**
```
Multiple Sources â†’ RatingService.calculateRestaurantRating()
     â†“
Weighted Algorithm â†’ 5 Component Scores
     â†“
Store comprehensive rating_breakdown + overall_rating
```

### Issue #2: Rating Scale Confusion
- **Google:** 0-5 scale
- **Overall Rating:** 0-10 scale
- **Conversion Method:** Not documented

Example: MR CAT BURGER
- Google: 4.5/5 (90%)
- Overall: 9/10 (90%)
- Appears to be: `overall_rating = google_rating * 2`

### Issue #3: rating_breakdown Purpose Mismatch

**Currently Stores:** Star distribution (1-5 star counts)
```json
{
  "oneStar": 10,
  "twoStar": 6,
  "threeStar": 7,
  "fourStar": 16,
  "fiveStar": 129
}
```

**Advanced Service Expects:** Component scores
```json
{
  "food_quality": 8.5,
  "service": 8.2,
  "ambience": 7.9,
  "value_for_money": 8.0,
  "accessibility_amenities": 7.5,
  "calculated_at": "2025-11-13T...",
  "algorithm_version": "2.0"
}
```

### Issue #4: Missing Fields in Database

The advanced service expects these fields:
- `average_meal_price` - Not in database
- `accessibility_features` - Not in database
- `opentable_rating` / `opentable_review_count` - Exists but never populated

---

## RECOMMENDATIONS

### Option 1: Keep Simple System (Quick)
**Effort:** Minimal
**Impact:** Low

1. Document the current simple rating calculation
2. Ensure consistency across all restaurants
3. Keep using Google as primary source
4. Display star distribution + sentiment

**Pros:**
- Works now
- Simple to understand
- Easy to maintain

**Cons:**
- Misses sophisticated scoring
- Single source dependency
- No component breakdowns

### Option 2: Implement Advanced System (Comprehensive)
**Effort:** High
**Impact:** High

**Phase 1: Database Schema Update**
1. Rename `rating_breakdown` to `star_distribution`
2. Add new `rating_breakdown` field for component scores
3. Add `average_meal_price` field
4. Add `accessibility_features` array field

**Phase 2: Integration**
1. Integrate `RatingService` into extraction orchestrator
2. Call after AI enhancement step (has all needed data)
3. Store both star distribution AND component scores

**Phase 3: UI Updates**
1. Display component breakdown (food, service, ambience, etc.)
2. Show "Best of Goa Score" prominently
3. Add comparison vs Google/TripAdvisor

**Pros:**
- Sophisticated scoring algorithm
- Multi-source aggregation
- Category-specific insights
- Competitive advantage

**Cons:**
- Requires database migration
- UI redesign needed
- More complex maintenance

### Option 3: Hybrid Approach (Recommended)
**Effort:** Medium
**Impact:** Medium-High

**Keep What Works:**
- Simple Google rating display
- Star distribution visualization
- Review sentiment

**Add Gradually:**
1. **Phase 1:** Start calculating component scores in background (don't display yet)
2. **Phase 2:** Add TripAdvisor ratings from extraction data
3. **Phase 3:** Display "Best of Goa Score" alongside Google rating
4. **Phase 4:** Show component breakdown as expandable section

**Migration Path:**
```
Current: Google Rating (4.5/5) + Sentiment
   â†“
Add: BOK Score (8.5/10) calculated in background
   â†“
Display: Both ratings side-by-side
   â†“
Expand: Show component breakdown on click
```

---

## QUESTIONS FOR DOUGLAS

1. **Rating Philosophy:**
   - Do you want to create your own "Best of Goa" rating separate from Google?
   - Or stick with displaying Google ratings as the primary source?

2. **Multi-Source Strategy:**
   - Should we aggregate TripAdvisor + Google + others into one score?
   - Or display them separately?

3. **Component Breakdown:**
   - Do you want users to see food quality (8.5), service (8.2), etc.?
   - Or keep it simple with just overall rating?

4. **Rating Scale:**
   - Keep 5-star system like Google?
   - Or use 10-point system for more granularity?

5. **Priority:**
   - Is rating system improvement a priority now?
   - Or focus on content quality and coverage first?

---

## TECHNICAL NOTES

### Where Rating System Is Used

**Frontend Display:**
- `src/app/places-to-eat/restaurants/[slug]/page.tsx` - Restaurant detail page
- `src/components/cuisine/RestaurantCard.tsx` - Restaurant cards
- `src/app/places-to-eat/[cuisine]/page.tsx` - Cuisine pages

**Data Processing:**
- `src/lib/services/extraction-orchestrator.ts` - Extraction pipeline
- `src/lib/services/rating-service.ts` - Advanced algorithm (unused)

**Queries:**
- `src/lib/queries/restaurant.ts` - Restaurant data fetching
- `src/lib/queries/cuisine-pages.ts` - Cuisine page data

### Database Column Summary

```sql
-- Current Active Columns
google_rating              NUMERIC       -- 0-5 scale from Google
google_review_count        INTEGER       -- Review count
tripadvisor_rating         NUMERIC       -- 0-5 scale (rarely populated)
tripadvisor_review_count   INTEGER       -- Review count (rarely populated)
overall_rating             NUMERIC       -- 0-10 scale (simple conversion)
rating_breakdown           JSONB         -- Star distribution object
review_sentiment           TEXT          -- AI-generated summary

-- Not Currently Used
opentable_rating           NUMERIC       -- Always null
opentable_review_count     INTEGER       -- Always null
total_reviews_aggregated   INTEGER       -- Always 0
```

---

## NEXT STEPS

**Awaiting Douglas's input on:**
1. Which approach (Simple / Advanced / Hybrid)?
2. Rating philosophy and strategy
3. Priority level for rating system improvements

Once direction is confirmed, I can:
- Document current system properly
- OR implement advanced system
- OR create hybrid migration path
