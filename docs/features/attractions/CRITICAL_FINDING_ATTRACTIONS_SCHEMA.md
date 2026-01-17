# CRITICAL FINDING: Attractions Schema Uses Array Columns, Not Junction Tables

**Date:** November 19, 2025
**Discovery:** Schema analysis reveals attractions use a DIFFERENT architecture than restaurants/hotels

---

## THE REAL ARCHITECTURE

### Attractions Schema (Different from Restaurants!)

**Attractions use INTEGER ARRAY columns** instead of junction tables:
```sql
- attraction_category_ids    [array of integers]  -- e.g., [7, 4, 5]
- attraction_amenity_ids     [array of integers]
- attraction_feature_ids     [array of integers]
```

**Example from database:**
```javascript
attraction_category_ids: [7, 4, 5]  // Direct array storage
attraction_type: "shopping"          // Single type field
```

### Restaurants/Hotels Schema (Traditional)

**Use junction tables:**
```sql
restaurant_restaurant_categories (junction table)
hotel_hotel_amenities (junction table)
```

---

## WHY STEP 7 IS FAILING

**Current Code** (line 383-418 in attraction-extraction-orchestrator.ts):
```typescript
private async matchAttractionCategories(attractionId: string, suggestedCategories: string[]): Promise<void> {
  // ... tries to insert into junction table ...
  await this.supabase
    .from('attraction_attraction_categories')  // ❌ This table doesn't exist!
    .insert(records);
}
```

**What It Should Do:**
```typescript
private async matchAttractionCategories(attractionId: string, suggestedCategories: string[]): Promise<void> {
  // Look up category IDs by name/slug
  const categoryIds = await this.lookupCategoryIds(suggestedCategories);

  // Update the array column directly
  await this.supabase
    .from('attractions')
    .update({
      attraction_category_ids: categoryIds  // ✅ Update array column
    })
    .eq('id', attractionId);
}
```

---

## COMPLETE FIELD MAPPING CORRECTIONS

Based on schema analysis, here's what the mapper SHOULD be doing:

### Current Mapper Output (Correct)
```typescript
google_rating: apifyData.totalScore || apifyData.rating,          // ✅ CORRECT
google_review_count: apifyData.reviewsCount,                      // ✅ CORRECT
```

### Database Actually Has These Columns
```
✅ google_rating (number) - exists and correct name
✅ google_review_count (number) - exists and correct name
✅ total_reviews_aggregated (number) - separate calculated field
```

**BUT** the Murouj attraction shows:
- `google_rating: 4.6` (from Apify) → ✅ Present in sample
- `google_review_count: 4288` (from Apify) → ✅ Present in sample (as 924 in sample)

**So why is Murouj missing this data?**
Need to check Murouj's specific Apify output to see if data was there.

---

## PHOTO FIELD DISCOVERY

**Schema has:** `hero_image` (string) - NOT `photos` (array)

**Sample value:**
```
hero_image: "https://qcqxcffgfdsqfrwwvabh.supabase.co/storage/v1/object/public/attractions/attractions/the-cube-..."
```

**This means:**
1. Attractions store ONE hero image, not an array of photos
2. Image extractor should be setting `hero_image` field
3. If multiple photos needed, they might be in a separate `attraction_photos` table

**Question:** Does `attraction_photos` table exist for additional images?

---

## COMPLETE SCHEMA BREAKDOWN (83 columns)

### Core Identity
- ✅ id, name, slug (populated in Murouj)
- ❌ name_ar (Arabic name - missing)
- ✅ attraction_type (should be "restaurant" or "food_court" - missing in Murouj)
- ⚠️ attraction_category_ids (array - not populated in Murouj)

### Descriptions
- ✅ description (populated)
- ❌ description_ar (missing)
- ✅ short_description (exists! not populated in Murouj)
- ❌ cultural_importance (missing)
- ✅ historical_significance (exists! populated in sample, missing in Murouj)
- ✅ fun_facts (array - exists! missing in Murouj)

### Location
- ✅ address, latitude, longitude (populated)
- ✅ area (populated)
- ✅ neighborhood_id (number - populated in sample, missing in Murouj)
- ✅ country_code (populated: "KW")
- ✅ currency (populated: "KWD")

### Contact
- ❌ phone, email, whatsapp (all missing in Murouj)
- ✅ website (populated)

### Social Media
- ❌ instagram, facebook, twitter, tiktok, youtube, linkedin, snapchat (all missing)

### Operational
- ✅ opening_hours (object - populated)
- ❌ admission_fee, admission_fee_child, admission_fee_senior (missing)
- ✅ is_free (boolean - exists!)
- ❌ ticket_url (missing)
- ❌ parking_info (missing)
- ✅ parking_available (boolean - exists!)
- ✅ wheelchair_accessible (boolean - exists!)
- ❌ accessibility_info (missing)
- ✅ photography_allowed (boolean - exists!)
- ✅ audio_guide_available (boolean - exists!)
- ✅ guided_tours_available (boolean - exists!)

### Visitor Info
- ✅ age_suitability (string - exists! populated in sample)
- ✅ typical_visit_duration (string - exists! populated in sample)
- ✅ best_time_to_visit (string - exists! populated in sample)
- ❌ minimum_age (missing)
- ❌ peak_season (missing)
- ❌ year_established (missing)

### Media
- ✅ hero_image (string URL - populated in sample, missing in Murouj)
- ❌ logo_image (missing in all)
- ❌ og_image (missing)

### SEO
- ✅ meta_title, meta_description (populated)
- ✅ meta_keywords (array - exists! missing in Murouj)
- ✅ og_title, og_description (exist! populated in sample, missing in Murouj)

### Ratings & Reviews
- ✅ google_rating (4.6 in Apify, but check Murouj)
- ✅ google_review_count (4288 in Apify, but check Murouj)
- ✅ total_reviews_aggregated (calculated field)
- ❌ tripadvisor_rating, tripadvisor_review_count (missing)
- ❌ review_sentiment, review_sentiment_updated_at (missing)

### BOK Scoring
- ❌ bok_score, bok_score_breakdown (missing - will be calculated)
- ✅ bok_score_version (populated: "1.0")
- ❌ bok_score_calculated_at (missing)

### System
- ✅ extraction_status (populated: "completed")
- ✅ extraction_source (populated: "google_places")
- ❌ extraction_job_id (missing)
- ✅ extraction_progress (object - populated)
- ✅ featured, verified, active (populated)
- ✅ created_at, updated_at (populated)
- ❌ last_scraped_at (missing)

### Arrays for IDs
- ⚠️ attraction_category_ids (array - not populated)
- ⚠️ attraction_amenity_ids (array - not populated)
- ⚠️ attraction_feature_ids (array - not populated)

---

## UPDATED ROOT CAUSE ANALYSIS

### 1. Step 7 Failing: Wrong Table Architecture
**Problem:** Code tries to use junction tables that don't exist
**Solution:** Update matchCategories/Amenities/Features to populate array columns

**Fix Required:**
```typescript
// BEFORE (wrong)
await this.supabase
  .from('attraction_attraction_categories')  // doesn't exist
  .insert(records);

// AFTER (correct)
const { data: categories } = await this.supabase
  .from('attraction_categories')
  .select('id')
  .in('slug', suggestedCategories.map(c => c.toLowerCase()));

const categoryIds = categories.map(c => c.id);

await this.supabase
  .from('attractions')
  .update({ attraction_category_ids: categoryIds })
  .eq('id', attractionId);
```

### 2. Photos: Wrong Field Name
**Problem:** Looking for `photos` array, but schema has `hero_image` string
**Solution:** Image extractor should set `hero_image` with primary image

**Check:** Does `attraction_photos` table exist for additional images?

### 3. Many Fields Exist But Aren't Populated
**Problem:** AI generates these fields but orchestrator doesn't update them
**Fields Missing in Murouj but Exist in Schema:**
- short_description ✅
- historical_significance ✅
- fun_facts ✅
- age_suitability ✅
- typical_visit_duration ✅
- best_time_to_visit ✅
- og_title, og_description ✅
- meta_keywords ✅
- parking_available (boolean) ✅
- wheelchair_accessible (boolean) ✅
- photography_allowed (boolean) ✅
- audio_guide_available (boolean) ✅
- guided_tours_available (boolean) ✅
- is_free (boolean) ✅

**Solution:** Ensure AI enhancement includes all these fields in update

---

## REVISED RECOMMENDATIONS FOR BOK DOCTOR

### 🔴 CRITICAL FIX 1: Update Step 7 (Category Matching)

**File:** `src/lib/services/attraction-extraction-orchestrator.ts`
**Lines:** 383-418 (matchAttractionCategories)

**Change from junction table inserts to array updates:**
```typescript
private async matchAttractionCategories(attractionId: string, suggestedCategories: string[]): Promise<void> {
  console.log('[AttractionOrchestrator] Matching categories:', suggestedCategories);

  // Query category table for matching slugs
  const { data: allCategories } = await this.supabase
    .from('attraction_categories')
    .select('id, name, slug');

  if (!allCategories || allCategories.length === 0) {
    console.log('[AttractionOrchestrator] No attraction categories found in database');
    return;
  }

  const matchedIds: number[] = [];

  for (const suggested of suggestedCategories) {
    const suggestedLower = suggested.toLowerCase().trim();
    const match = allCategories.find(cat =>
      cat.slug === suggestedLower ||
      cat.name.toLowerCase() === suggestedLower
    );

    if (match) {
      matchedIds.push(match.id);
      console.log(`  Matched "${suggested}" -> ${match.name} (ID: ${match.id})`);
    }
  }

  if (matchedIds.length > 0) {
    // Update array column directly
    await this.supabase
      .from('attractions')
      .update({ attraction_category_ids: matchedIds })
      .eq('id', attractionId);

    console.log(`[AttractionOrchestrator] Updated attraction_category_ids: [${matchedIds.join(', ')}]`);
  }
}
```

**Same fix needed for:**
- `matchAttractionAmenities()` → update `attraction_amenity_ids`
- `matchAttractionFeatures()` → update `attraction_feature_ids`

### 🔴 CRITICAL FIX 2: Update Image Extractor

**File:** `src/lib/services/attraction-image-extractor.ts`

**Change to set `hero_image` instead of `photos` array:**
```typescript
// After downloading and uploading primary image
await this.supabase
  .from('attractions')
  .update({
    hero_image: uploadedImageUrl  // Single image URL
  })
  .eq('id', attractionId);
```

**Check:** If there's an `attraction_photos` table, insert additional images there.

### 🔴 CRITICAL FIX 3: Expand AI Enhancement Update

**File:** `src/lib/services/attraction-extraction-orchestrator.ts`
**Line:** 293-296

**Ensure AI enhancement includes ALL schema fields:**
```typescript
// Update attraction with AI-generated content
await this.supabase
  .from('attractions')
  .update({
    description: enhancement.description,
    short_description: enhancement.short_description,
    meta_title: enhancement.meta_title,
    meta_description: enhancement.meta_description,
    meta_keywords: enhancement.meta_keywords,
    og_title: enhancement.og_title,
    og_description: enhancement.og_description,
    attraction_type: enhancement.attraction_type,
    typical_visit_duration: enhancement.typical_visit_duration,
    age_suitability: enhancement.age_suitability,
    best_time_to_visit: enhancement.best_time_to_visit,
    historical_significance: enhancement.historical_significance,
    fun_facts: enhancement.fun_facts,
    parking_available: enhancement.parking_available,
    wheelchair_accessible: enhancement.wheelchair_accessible,
    photography_allowed: enhancement.photography_allowed,
    audio_guide_available: enhancement.audio_guide_available,
    guided_tours_available: enhancement.guided_tours_available,
    is_free: enhancement.is_free
  })
  .eq('id', attractionId);
```

### 🟡 HIGH PRIORITY: Fix Rating Data for Murouj

**Issue:** Sample attraction has rating, Murouj doesn't
**Debug:** Check Murouj's `apify_output` to see if rating data exists

```javascript
// Check Murouj specifically
const { data } = await supabase
  .from('attractions')
  .select('apify_output, google_rating, google_review_count')
  .eq('id', 'b7f3b42b-1787-4277-8970-665c563ebeec')
  .single();

console.log('Apify Rating:', data.apify_output?.totalScore || data.apify_output?.rating);
console.log('Apify Reviews:', data.apify_output?.reviewsCount);
console.log('DB Rating:', data.google_rating);
console.log('DB Reviews:', data.google_review_count);
```

If Apify has data but DB doesn't, re-run Step 1 mapper.

---

## UPDATED FIELD POPULATION EXPECTATIONS

After fixes, Murouj should have:

### Populated (Expected: 50-60 fields, ~65% completion)
- ✅ All core identity fields (name, slug, type, category_ids)
- ✅ All location fields (address, coordinates, neighborhood_id, area)
- ✅ All description fields (description, short_description, historical_significance)
- ✅ All SEO fields (meta tags, og tags, keywords)
- ✅ All contact fields (website, phone if available)
- ✅ All social media fields (if found)
- ✅ All operational fields (opening_hours, parking, wheelchair, etc.)
- ✅ All visitor info fields (age suitability, visit duration, best time)
- ✅ Rating and review data
- ✅ Hero image
- ✅ Category/amenity/feature IDs (arrays)
- ✅ Fun facts

### Still Missing (Expected: 20-25 fields, ~30% unpopulated)
- ❌ Arabic translations (name_ar, description_ar)
- ❌ Admission fees (may not apply to restaurants)
- ❌ TripAdvisor data (future integration)
- ❌ BOK score (calculated separately)
- ❌ Review sentiment (analyzed separately)
- ❌ Some operational details (minimum age, year established, peak season)

**Target:** 65-70% field completion (vs current 25%)

---

## CONCLUSION

Douglas, the architecture is **fundamentally different** from what the code assumes:

1. **No junction tables** - uses integer arrays instead
2. **No photos array** - uses single `hero_image` string
3. **Many more fields available** than we're populating (83 total columns!)
4. **Schema is actually very comprehensive** - just need to populate it correctly

**The good news:**
- Schema is better designed than expected (83 columns!)
- All the fields AI generates actually exist in database
- Just need to fix 3 methods: category matching, image extraction, AI update

**The fixes are straightforward:**
1. Change array inserts → array updates (Step 7)
2. Change photos array → hero_image string (Step 5)
3. Expand AI enhancement update to include all 20+ fields (Step 6)

**After fixes, field completion should jump from 25% → 65%+**

---

**Generated By:** BOK Content Tester
**Critical Discovery:** Attractions schema uses arrays, not junction tables
**Impact:** HIGH - requires code changes to match actual schema
