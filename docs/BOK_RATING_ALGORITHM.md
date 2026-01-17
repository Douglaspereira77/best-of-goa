# Best of Goa Rating Algorithm Documentation

**Version:** 3.1 (Balanced)
**Last Updated:** November 13, 2025
**Status:** Production

---

## Overview

The Best of Goa (BOK) Rating Algorithm is a sophisticated, multi-component scoring system designed to provide honest, balanced ratings for restaurants in Goa. Unlike simple rating conversions, the BOK algorithm combines quantitative metrics with qualitative sentiment analysis to produce accurate 10-point scores.

---

## Core Principles

### 1. **Transparency**
Every rating is explainable through clear component breakdowns showing exactly how scores are calculated.

### 2. **Balance**
Ratings respect both positive achievements and legitimate concerns, avoiding both artificial inflation and excessive penalties.

### 3. **Honesty**
Customer sentiment directly impacts scores - restaurants with cleanliness concerns, poor service, or inconsistent quality receive appropriate penalties.

### 4. **Fairness**
Basic features (delivery, takeout) don't inflate scores. Only premium offerings and verified quality earn boosts.

---

## Algorithm Components

### Weighted Breakdown (10-point scale)

| Component | Weight | Description |
|-----------|--------|-------------|
| **Food Quality** | 35% | Taste, freshness, menu creativity, ingredient quality |
| **Service** | 25% | Staff professionalism, wait times, attentiveness |
| **Ambience** | 20% | Atmosphere, decor, comfort, noise level |
| **Value for Money** | 15% | Price-to-quality ratio, portion sizes |
| **Accessibility & Amenities** | 5% | Parking, wheelchair access, payment options |

---

## Rating Calculation Process

### Step 1: Source Aggregation

**Normalize all ratings to 10-point scale:**
- Google: `(rating / 5) Ã— 10`
- TripAdvisor: `(rating / 5) Ã— 10`
- OpenTable: `(rating / 5) Ã— 10`

**Calculate weighted average:**
```
Base Rating = Î£(source_rating Ã— review_count) / Î£(review_count)
```

**Example:**
- Google: 4.1/5 (1,453 reviews) â†’ 8.2/10
- Base Rating = 8.2/10

---

### Step 2: Sentiment Analysis (v3.1 Balanced)

Analyze `review_sentiment` text for keywords and apply modifiers.

#### Negative Keywords

| Severity | Penalty | Keywords |
|----------|---------|----------|
| **Critical** | -0.8 | dirty, filthy, unsanitary, cleanliness, hygiene, health code, food poisoning, sick, rude, worst, avoid, never again, terrible, awful, disgusting, horrible |
| **Moderate** | -0.4 | outdated, old, worn, uncomfortable, cramped, noisy, slow service, poor service, unprofessional, overpriced, disappointing, mediocre, bland, cold food, inconsistent |
| **Minor** | -0.2 | average, okay, nothing special, could be better, needs improvement, hit or miss |

#### Positive Keywords

| Boost | Keywords |
|-------|----------|
| **+0.3** | excellent, amazing, wonderful, fantastic, delicious, outstanding, perfect, best, love, highly recommend |

**Sentiment Modifier Formula:**
```
modifier = -(critical_count Ã— 0.8) - (moderate_count Ã— 0.4) - (minor_count Ã— 0.2) + (positive_count Ã— 0.3)
```

**Example (Oriental Restaurant):**
- Sentiment: "Customers love the delicious food, variety, and nostalgic memories. However, common concerns include the outdated decor, uncomfortable seating, and inconsistent food quality, with some expressing doubts about cleanliness and kitchen standards."
- Critical: 1 (cleanliness) â†’ -0.8
- Moderate: 3 (outdated, uncomfortable, inconsistent) â†’ -1.2
- Positive: 2 (love, delicious) â†’ +0.6
- **Sentiment Modifier: -1.4**

---

### Step 3: Component Calculation

Apply sentiment adjustments with component-specific impact multipliers.

#### Impact Multipliers (v3.1)

| Component | Multiplier | Rationale |
|-----------|------------|-----------|
| Food Quality | 1.0 | Direct impact from sentiment |
| Service | 0.8 | Moderate impact (reduced from 1.2) |
| Ambience | 0.8 | Moderate impact (reduced from 1.2) |
| Value for Money | 0.6 | Lower impact (reduced from 0.8) |
| Accessibility | 0.3 | Minimal impact (factual features) |

**Formula:**
```
Component Score = Base Rating + (Sentiment Modifier Ã— Impact Multiplier) + Feature Boosts
```

#### Feature Boosts (Conservative)

**Food Quality:**
- Awards/recognition: +0.3 (reduced from 0.5)
- Detailed description (200+ chars): +0.1 (reduced from 0.2)

**Service:**
- Table service: +0.15 (reduced from 0.3)
- Reservations: +0.1 (reduced from 0.2)
- âŒ Removed: dine-in, delivery, takeout boosts (basic features)

**Ambience:**
- Premium atmosphere (elegant, romantic, upscale): +0.1 each (reduced from 0.2)
- Outdoor seating: +0.15 (reduced from 0.3)

**Value for Money:**
- Price adjustment: `(3 - price_level) Ã— 0.1` (reduced from 0.2)

**Accessibility:**
- Wheelchair features: +0.3 each (reduced from 0.4)
- Parking options: +0.15 each, max 0.4 (reduced from 0.6 max)
- Payment options (3+): +0.2 (reduced from 0.3)

---

### Step 4: Overall Rating

Calculate weighted average of all components:

```
BOK Score = (Food Ã— 0.35) + (Service Ã— 0.25) + (Ambience Ã— 0.20) + (Value Ã— 0.15) + (Accessibility Ã— 0.05)
```

Round to 2 decimal places, capped at 0.0 minimum and 10.0 maximum.

---

## Real-World Example: Oriental Restaurant

### Input Data
- **Google Rating:** 4.1/5 (1,453 reviews)
- **Sentiment:** "Customers love the delicious food, variety, and nostalgic memories. However, common concerns include the outdated decor, uncomfortable seating, and inconsistent food quality, with some expressing doubts about cleanliness and kitchen standards."

### Calculation Steps

**1. Base Rating:**
```
(4.1 / 5) Ã— 10 = 8.2/10
```

**2. Sentiment Analysis:**
```
Critical: 1 (cleanliness) = -0.8
Moderate: 3 (outdated, uncomfortable, inconsistent) = -1.2
Positive: 2 (love, delicious) = +0.6
Modifier = -1.4
```

**3. Component Scores:**
```
Food Quality:    8.2 + (-1.4 Ã— 1.0) + 0.1 = 6.9/10
Service:         8.2 + (-1.4 Ã— 0.8) + 0.15 = 7.23/10
Ambience:        8.2 + (-1.4 Ã— 0.8) + 0.0 = 7.18/10
Value:           8.2 + (-1.4 Ã— 0.6) + 0.2 = 7.36/10
Accessibility:   8.2 + (-1.4 Ã— 0.3) + 1.3 = 9.5/10
```

**4. Overall BOK Score:**
```
(6.9 Ã— 0.35) + (7.23 Ã— 0.25) + (7.18 Ã— 0.20) + (7.36 Ã— 0.15) + (9.5 Ã— 0.05)
= 2.415 + 1.808 + 1.436 + 1.104 + 0.475
= 7.24/10
```

**Final Rating:** **7.2/10 - "Very Good"**

---

## Rating Descriptions

| Score Range | Label | Description |
|-------------|-------|-------------|
| 9.0 - 10.0 | **Exceptional** | World-class quality, Goa's premier dining |
| 8.0 - 8.9 | **Excellent** | Outstanding experience, highly recommended |
| 7.0 - 7.9 | **Very Good** | Quality dining with minor flaws |
| 6.0 - 6.9 | **Good** | Solid option with some notable issues |
| 5.0 - 5.9 | **Average** | Mixed experience, proceed with caution |
| 4.0 - 4.9 | **Below Average** | Significant concerns, not recommended |
| 0.0 - 3.9 | **Poor** | Major quality/safety issues |

---

## Version History

### v3.1 (November 13, 2025) - CURRENT
**Status:** Production
**Changes:**
- âœ… Reduced sentiment penalties by ~50% (balanced approach)
  - Critical: -1.5 â†’ -0.8
  - Moderate: -0.8 â†’ -0.4
  - Minor: -0.3 â†’ -0.2
- âœ… Increased positive boosts: +0.2 â†’ +0.3
- âœ… Reduced impact multipliers for service/ambience (1.2 â†’ 0.8)
- âœ… Further reduced feature boosts (awards, service options, etc.)
- **Result:** 4.1/5 Google â†’ 7.24/10 BOK (realistic, balanced)

### v3.0 (November 13, 2025) - DEPRECATED
**Status:** Too aggressive
**Changes:**
- âŒ Implemented sentiment-based penalties (too harsh)
- âœ… Removed excessive feature boosts
- **Problem:** 4.1/5 Google â†’ 4.8/10 BOK (too punishing)

### v2.0 (November 12, 2025) - DEPRECATED
**Status:** Too generous
**Changes:**
- âœ… Multi-source aggregation
- âœ… Component-based breakdown
- âŒ Excessive feature boosts (+1.0+ points possible)
- **Problem:** 4.1/5 Google â†’ 8.9/10 BOK (inflated)

### v1.0 (Initial) - DEPRECATED
**Status:** Too simplistic
**Formula:** `overall_rating = google_rating Ã— 2`
- **Problem:** Direct multiplication, no nuance

---

## Technical Implementation

### Database Schema

**Table:** `restaurants`

| Column | Type | Description |
|--------|------|-------------|
| `bok_score` | NUMERIC(3,1) | Overall BOK rating (0.0-10.0) |
| `bok_score_breakdown` | JSONB | Component scores object |
| `bok_score_calculated_at` | TIMESTAMP | Last calculation time |
| `bok_score_version` | TEXT | Algorithm version used |

**Example `bok_score_breakdown`:**
```json
{
  "food_quality": 6.9,
  "service": 7.23,
  "ambience": 7.18,
  "value_for_money": 7.36,
  "accessibility_amenities": 9.5,
  "calculated_at": "2025-11-13T19:45:00.000Z",
  "algorithm_version": "3.1"
}
```

### Service Files

**`src/lib/services/rating-service.ts`**
- Core algorithm implementation
- Sentiment analysis
- Component calculations
- Version: 3.1

**`src/lib/services/extraction-orchestrator.ts`**
- Step 11: BOK Score Calculation
- Auto-calculates during restaurant extraction
- Version: 3.1

**`bin/migrate-to-advanced-rating.ts`**
- Migration script for bulk recalculation
- Used when algorithm versions change
- Last run: November 13, 2025 (v3.1)

---

## Usage in UI

**Component:** `src/components/restaurant/BOKScoreCard.tsx`

**Features:**
- Large score display (e.g., "7.2/10")
- "Best of Goa Verified" badge
- Rating description ("Very Good")
- Expandable component breakdown
- Source attribution (Google + TripAdvisor)
- Progress bars with color coding

**Display on:** `src/app/places-to-eat/restaurants/[slug]/page.tsx`

---

## Migration Process

When updating algorithm versions:

1. **Update RatingService**
   - Modify `ALGORITHM_VERSION` constant
   - Adjust penalty/boost values
   - Update formulas

2. **Update Extraction Orchestrator**
   - Change `bok_score_version` in Step 11

3. **Update Migration Script**
   - Change version in `migrate-to-advanced-rating.ts`

4. **Test on Sample Restaurant**
   ```bash
   node bin/test-oriental-rating.js
   ```

5. **Run Full Migration**
   ```bash
   npx tsx bin/migrate-to-advanced-rating.ts
   ```

6. **Verify Results**
   - Check restaurant pages
   - Verify score ranges
   - Confirm no errors

---

## Quality Assurance

### Expected Score Distribution

| Google Range | Expected BOK Range | Status |
|--------------|-------------------|--------|
| 4.9/5 (98%) | 9.5-10/10 (95-100%) | âœ… Excellent |
| 4.5-4.8/5 (90-96%) | 8.5-9.5/10 (85-95%) | âœ… Very Good |
| 4.0-4.4/5 (80-88%) | 7.0-8.5/10 (70-85%) | âœ… Realistic |
| 3.5-3.9/5 (70-78%) | 5.5-7.0/10 (55-70%) | âœ… Fair |
| < 3.5/5 (< 70%) | < 5.5/10 (< 55%) | âœ… Honest |

### Validation Checkpoints

- âœ… No restaurant with serious cleanliness concerns > 8.0/10
- âœ… No 4-star Google restaurant > 8.5/10 BOK
- âœ… High-rated restaurants (4.8-4.9/5) achieve 9.0-10/10
- âœ… Sentiment penalties are proportional, not devastating
- âœ… Positive sentiment provides modest boosts

---

## Support & Maintenance

**Primary Developer:** Douglas
**Framework:** 5 Day Sprint Framework
**Project:** Best of Goa Directory

**Issues/Questions:**
- Review this documentation
- Check `src/lib/services/rating-service.ts` for implementation details
- Run test script: `node bin/test-oriental-rating.js`
- Contact project maintainer

---

**Last Reviewed:** November 13, 2025
**Next Review:** When adding new rating sources or significant algorithm changes
