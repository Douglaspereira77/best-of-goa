# Field Population Plan - Best of Goa

## Current Status Summary

### âœ… COMPLETED (Phase 0 & 1)

**Phase 0 - Core Fields (100% populated):**
- âœ… id, name, slug, status, created_at, updated_at
- âœ… address, area, latitude, longitude, neighborhood_id
- âœ… website (10/10 - 100%)
- âœ… phone (9/10 - 90%)
- âœ… google_rating, google_review_count (10/10)
- âœ… currency (10/10)
- âœ… restaurant_category_ids, restaurant_feature_ids, restaurant_meal_ids, restaurant_good_for_ids

**Phase 1 - Google Places Extended Data:**
- âœ… postal_code (2/10 - 20%) - populated where available
- âœ… questions_and_answers (6/10 - 60%) - populated where available
- âœ… people_also_search (9/10 - 90%) - populated where available
- âœ… keywords/extracted_features (9/10 - 90%) - 251 features extracted from additionalInfo

---

## ðŸ“‹ REMAINING WORK

### Phase 2 - Apify Advanced Fields (HIGH PRIORITY)

**Can populate from existing Apify data:**

| Field | Source | Status | Notes |
|-------|--------|--------|-------|
| `hours` | `apify_output.openingHours` | âŒ 1/10 | All restaurants have this data |
| `visit_time_mins` | Calculate from price/category | âŒ 0/10 | Logic exists in extraction-orchestrator |
| `busy_times` | `apify_output.popularTimesHistogram` | âš ï¸ 1/10 | Available for most restaurants |
| `menu_url` | `apify_output.menu` | âŒ 0/10 | Available for restaurants with menus |
| `total_reviews` | `apify_output.reviews.length` | âŒ 0/10 | Calculate from reviews array |
| `email` | `apify_output.email` | âŒ 0/10 | Rarely available from Google |

**Migration Script:** `run-phase2-population.js` (needs to be created)

---

### Phase 3 - Firecrawl Social & External Data (HIGH PRIORITY)

**Can populate from existing Firecrawl data:**

| Field | Source | Status | Notes |
|-------|--------|--------|-------|
| `instagram` | `firecrawl_output.results[0].instagram_url` | âš ï¸ 1/10 | Available for restaurants with social |
| `facebook` | `firecrawl_output.results[0].facebook_url` | âŒ 0/10 | Available for restaurants with social |
| `twitter` | `firecrawl_output.results[0].twitter_url` | âŒ 0/10 | Available for restaurants with social |
| `opentable_rating` | `firecrawl_output.opentable.rating` | âš ï¸ 1/10 | Only for restaurants on OpenTable |
| `opentable_review_count` | `firecrawl_output.opentable.review_count` | âš ï¸ 1/10 | Only for restaurants on OpenTable |
| `reservation_url` | `firecrawl_output.opentable.url` | âŒ 0/10 | Only for restaurants on OpenTable |

**Migration Script:** `run-phase3-population.js` (needs to be created)

---

### Phase 4 - AI Enhancement Fields (MEDIUM PRIORITY)

**These fields exist in apify_output but need AI analysis/extraction:**

| Field | Approach | Status | Notes |
|-------|----------|--------|-------|
| `dress_code` | AI analysis of reviews/descriptions | âŒ 0/10 | Extract from review mentions |
| `kids_menu` | AI analysis of menu data | âŒ 0/10 | Check menu for kids sections |
| `parking_info` | AI extraction from reviews | âš ï¸ 1/10 | Extract from review mentions |
| `reservations_policy` | AI extraction | âš ï¸ 1/10 | Extract from descriptions |
| `payment_methods` | AI extraction | âš ï¸ 1/10 | Extract from reviews/descriptions |

**Approach:** Create AI enhancement step in extraction-orchestrator.ts

---

### Optional/Manual Fields (LOW PRIORITY)

**These fields require manual entry or external APIs:**

| Field | Why Not Auto-populated | Priority |
|-------|----------------------|----------|
| `mall_gate` | Not in Google data | Low |
| `average_price` | Could calculate from price_level | Medium |
| `tripadvisor_url` | Need TripAdvisor API | Low |
| `tripadvisor_rating` | Need TripAdvisor API | Low |
| `tripadvisor_review_count` | Need TripAdvisor API | Low |
| `michelin_stars` | Manual verification required | Low |
| `michelin_guide_award_id` | Manual verification required | Low |
| `promotions` | Time-sensitive, manual entry | Low |
| `restaurant_chain_id` | Requires chain database | Low |
| `parent_chain_id` | Requires chain database | Low |

---

## ðŸŽ¯ Recommended Execution Order

### Immediate Actions (Now):

1. **Phase 2 Migration** - Populate Apify advanced fields
   - Create `run-phase2-population.js`
   - Map: hours, visit_time_mins, busy_times, menu_url, total_reviews
   - Run on all 10 restaurants

2. **Phase 3 Migration** - Populate Firecrawl social media
   - Create `run-phase3-population.js`
   - Map: instagram, facebook, twitter, opentable data
   - Run on all 10 restaurants

### Short-term (Next Sprint):

3. **Update extraction-orchestrator.ts** - Ensure future extractions populate these fields
   - Add Phase 2 fields to `mapApifyFieldsToDatabase()`
   - Add Phase 3 fields to Firecrawl processing step
   - Test with new restaurant extraction

4. **AI Enhancement** - Add AI analysis step
   - Analyze reviews/descriptions for: dress_code, parking_info, payment_methods
   - Analyze menu for: kids_menu, dietary options
   - Generate improved descriptions where needed

### Long-term (Future):

5. **External API Integration**
   - TripAdvisor API for ratings/reviews
   - Chain database for franchise relationships

6. **Manual Data Entry Interface**
   - Admin form for: promotions, awards, michelin stars
   - Bulk edit capabilities

---

## ðŸ“Š Expected Coverage After All Migrations

| Category | Current | After Phase 2 | After Phase 3 | After AI |
|----------|---------|---------------|---------------|----------|
| Core Identity | 100% | 100% | 100% | 100% |
| Contact | 66% | 66% | 66% | 66% |
| Social Media | 10% | 10% | 70%+ | 70%+ |
| Hours & Logistics | 20% | 80%+ | 80%+ | 90%+ |
| Ratings | 40% | 50% | 80%+ | 80%+ |
| Policies | 30% | 30% | 30% | 60%+ |
| Special Features | 20% | 20% | 20% | 40%+ |

---

## ðŸš€ Next Steps

**What do you want to do, Douglas?**

Option 1: **Run Phase 2 + 3 migrations now** (recommended)
   - I'll create both migration scripts
   - Run them on all 10 restaurants
   - Update extraction-orchestrator.ts for future extractions
   - Estimated time: 15-20 minutes

Option 2: **Just Phase 2 (Apify fields)**
   - Focus on hours, visit_time_mins, busy_times first
   - Estimated time: 10 minutes

Option 3: **Review the plan first**
   - Discuss which fields are most important
   - Prioritize specific categories
   - Adjust the migration plan

---

## ðŸ“ Notes

- All migrations are **non-destructive** - they only populate empty fields
- Data already exists in `apify_output` and `firecrawl_output` JSON columns
- Migrations extract this data to dedicated columns for better querying
- Once extracted, we update `extraction-orchestrator.ts` to do this automatically for new restaurants
