# Leila Min Lebnen - Extraction Analysis Report

**Date:** October 29, 2025  
**Restaurant:** Leila Min Lebnen - Ù„ÙŠÙ„Ù‰ Ù…Ù† Ù„Ø¨Ù†Ø§Ù†  
**Status:** Extraction completed but **many fields not populated** despite data being available in sources

---

## Executive Summary

The extraction completed successfully (all 11 steps finished), but **critical fields are missing** even though the source data (Apify, Firecrawl) contains the information. The main issues are:

1. **Field mapping failures** - Data exists but wasn't mapped to database fields
2. **Hours normalization bug** - Hours contain "NaN" values due to parsing failure
3. **Social media extraction working** - But website field not populated
4. **Missing mall information** - Mall name visible in address but not extracted
5. **Missing ratings aggregation** - TripAdvisor/OpenTable data exists but not mapped

---

## Field-by-Field Analysis

### âœ… POPULATED FIELDS (Working Correctly)

**Basic Identity:**
- âœ… `name`: "Leila Min Lebnen - Ù„ÙŠÙ„Ù‰ Ù…Ù† Ù„Ø¨Ù†Ø§Ù†"
- âœ… `slug`: "leila-min-lebnen-the-avenues" (correctly uses neighborhood slug)
- âœ… `address`: "The Avenues Mall, Sheikh Zayed Bin Sultan Al Nahyan Rd, 13063, Goa"
- âœ… `area`: "Rai"
- âœ… `latitude`, `longitude`: Present
- âœ… `postal_code`: "13063"
- âœ… `neighborhood_id`: 142 (The Avenues) âœ… **Correctly mapped**

**Contact:**
- âœ… `phone`: "+965 9696 2668"

**Ratings:**
- âœ… `google_rating`: "4.9"
- âœ… `google_review_count`: 8593

**Content:**
- âœ… `description`: AI-generated description exists
- âœ… `short_description`: Present
- âœ… `meta_title`, `meta_description`: Present
- âœ… `review_sentiment`: Present

**Operational:**
- âœ… `dress_code`: "Casual"
- âœ… `reservations_policy`: "Recommended"
- âœ… `parking_info`: Present
- âœ… `average_visit_time_mins`: 90
- âœ… `payment_methods`: Array present

**Pricing:**
- âœ… `currency`: "KWD"
- âœ… `average_meal_price`: "25.50"

---

### âŒ MISSING FIELDS (Data Available But Not Mapped)

#### 1. **Website Field** âŒ
- **Status:** Missing in DB (`website: null`)
- **Data Available:**
  - âœ… Apify: `"url": "https://www.google.com/maps/..."` (Google Maps URL, not website)
  - âœ… Firecrawl: Multiple website URLs found:
    - `https://leila-me.com/`
    - `https://www.leila-kw.com/`
- **Root Cause:** 
  - Apify `url` field contains Google Maps URL, not actual website
  - Website extraction from Firecrawl results not being mapped to `website` field
  - `extractWebsiteOperationalData()` only runs on website scrape step, but website URL should be extracted from Firecrawl search results

#### 2. **Instagram** âŒ
- **Status:** Missing in DB (`instagram: null`)
- **Data Available:**
  - âœ… Firecrawl search results contain:
    - `https://www.instagram.com/leilaminlebnengoa/?hl=en`
    - `https://www.instagram.com/leilaminlebnen/?hl=en`
- **Root Cause:**
  - `extractSocialMediaFromFirecrawl()` is called in `firecrawl_general` step (line 93)
  - Should update database at line 104-115, but update might be failing silently
  - OR extraction logic is not finding Instagram URLs in results array

#### 3. **Facebook/Twitter** âŒ
- **Status:** Missing (`facebook: null`, `twitter: null`)
- **Data Available:** Need to check Firecrawl output for these
- **Root Cause:** Similar to Instagram - extraction logic may not be finding URLs

#### 4. **Email** âŒ
- **Status:** Missing (`email: null`)
- **Data Available:** Need to check website scrape content
- **Root Cause:** Email extraction might not be working from website content

#### 5. **Hours Field** âš ï¸ **CRITICAL BUG**
- **Status:** Contains "NaN" values (`"open": "NaN:00"`)
- **Data Available:**
  - âœ… Apify: `openingHours` array with format: `[{"day":"Monday","hours":"8 AM to 11:30 PM"}, ...]`
- **Root Cause:**
  - `normalizeHours()` function (line 990) parses "8 AM to 11:30 PM"
  - `convertTo24Hour()` function (line 1026) is failing to parse "8 AM" correctly
  - Returns `NaN` instead of "08:00"
  - Bug likely in time conversion regex/parsing logic

#### 6. **Price Level** âŒ
- **Status:** Missing (`price_level: null`)
- **Data Available:**
  - âŒ Apify: `"price": null` - No price data in Apify output
- **Root Cause:**
  - Apify data doesn't contain price information
  - Could potentially extract from reviews (mentions "KWD 15â€“20", "KWD 50+")

#### 7. **Menu URL** âŒ
- **Status:** Missing (`menu_url: null`)
- **Data Available:**
  - âœ… Firecrawl menu search found 5 menu pages:
    - `https://leila-me.com/menu` (primary menu page)
    - Other menu pages found
- **Root Cause:**
  - Menu extraction happens in `firecrawl_menu` step
  - Menu URL not being extracted and stored in `menu_url` field
  - Only menu_data and menu_source are set

#### 8. **Mall Name** âŒ
- **Status:** Missing (`mall_name: null`)
- **Data Available:**
  - âœ… Address contains: "The Avenues Mall"
- **Root Cause:**
  - `extractMallName()` function should extract from address
  - May not be detecting "The Avenues Mall" correctly

#### 9. **Overall Rating** âŒ
- **Status:** Missing (`overall_rating: null`)
- **Data Available:**
  - âœ… Has `google_rating`: 4.9
- **Root Cause:**
  - Overall rating should be calculated/aggregated from Google + TripAdvisor + OpenTable
  - Calculation logic not running or fields not populated

#### 10. **Rating Breakdown** âŒ
- **Status:** Missing (`rating_breakdown: null`)
- **Data Available:**
  - âœ… Apify: `reviewsDistribution` might exist
- **Root Cause:**
  - Should be mapped from Apify `rating_breakdown` or calculated from reviews

#### 11. **Total Reviews Aggregated** âŒ
- **Status:** 0 (`total_reviews_aggregated: 0`)
- **Data Available:**
  - âœ… Apify: 50 detailed reviews extracted
- **Root Cause:**
  - Should be set to `apifyData.reviews.length` (line 934)
  - Might be failing because reviews array structure is different

#### 12. **TripAdvisor Rating** âŒ
- **Status:** Missing (`tripadvisor_rating: null`, `tripadvisor_review_count: null`)
- **Data Available:**
  - âœ… Firecrawl TripAdvisor step completed
  - Need to check if TripAdvisor data was extracted from Firecrawl
- **Root Cause:**
  - TripAdvisor extraction might not be parsing data correctly
  - Data might exist in `firecrawl_output.tripadvisor` but not mapped to restaurant fields

#### 13. **OpenTable Rating** âŒ
- **Status:** Missing (`opentable_rating: null`, `opentable_review_count: null`)
- **Data Available:**
  - âœ… Firecrawl OpenTable data exists in output
- **Root Cause:**
  - OpenTable extraction completed but ratings not mapped to restaurant fields
  - Similar to TripAdvisor - data extraction working but field mapping failing

#### 14. **Photos** âŒ
- **Status:** 0 photos (`photos: []`)
- **Data Available:**
  - âœ… Image extraction step completed: `images_processed: 10/10`
  - Photos were processed but not stored in `photos` JSONB field
- **Root Cause:**
  - Image extraction completed successfully (10 images)
  - But `photos` array is empty - upload/storage step may have failed
  - Or photos stored in `restaurants_images` table but not in `photos` JSONB field

#### 15. **Best Time Description** âŒ
- **Status:** Missing (`best_time_description: null`)
- **Data Available:**
  - Should be generated from `busy_times` data
- **Root Cause:**
  - `busy_times` is also null
  - Should be mapped from Apify `popularTimesHistogram`

#### 16. **Busy Times** âŒ
- **Status:** Missing (`busy_times: null`)
- **Data Available:**
  - âœ… Apify: `popularTimesHistogram` should exist
- **Root Cause:**
  - Should be mapped at line 949: `busy_times: apifyData?.popularTimesHistogram || null`
  - Apify data might not contain this field, or mapping failed

#### 17. **Quiet Times** âŒ
- **Status:** Missing (`quiet_times: null`)
- **Root Cause:**
  - Should be derived from `busy_times` (inverse logic)
  - Not implemented in extraction orchestrator

#### 18. **Questions and Answers** âŒ
- **Status:** Missing (`questions_and_answers: null`)
- **Data Available:**
  - Should be in Apify: `questionsAndAnswers`
- **Root Cause:**
  - Should be mapped at line 945: `questions_and_answers: apifyData?.questionsAndAnswers || null`
  - Apify response might not contain this field

#### 19. **People Also Search** âŒ
- **Status:** Empty array (`people_also_search: "[]"`)
- **Data Available:**
  - Should be in Apify: `peopleAlsoSearch`
- **Root Cause:**
  - Should be mapped at line 946
  - Apify response might not contain this field, or it's empty

---

## Root Causes Identified

### 1. **Silent Update Failures**
The `updateRestaurantFields()` method (if it exists) or individual update calls may be failing silently without throwing errors, similar to the Olio extraction issue documented in `docs/OLIO_EXTRACTION_ANALYSIS.md`.

**Evidence:**
- Social media extraction code exists (lines 93-115)
- Update query is executed (line 104-107)
- But fields remain null in database

**Fix Needed:** Add error checking and logging to all database update operations.

### 2. **Hours Normalization Bug**
The `convertTo24Hour()` function is failing to parse "8 AM" format correctly, returning `NaN` instead of "08:00".

**Current Implementation:**
```typescript
private convertTo24Hour(time12h: string): string {
  // Parsing logic that's failing
}
```

**Expected Input:** "8 AM"  
**Expected Output:** "08:00"  
**Actual Output:** "NaN:00"

**Fix Needed:** Debug and fix time parsing regex/parsing logic.

### 3. **Website Field Not Extracted from Firecrawl**
Website URLs are found in Firecrawl search results, but:
- Apify `url` field contains Google Maps URL (not actual website)
- Firecrawl results contain website URLs but they're not being mapped to `website` field
- Website scraping step requires `websiteUrl` to already exist, creating a chicken-and-egg problem

**Fix Needed:** Extract website URL from Firecrawl search results and update `website` field before website scraping step.

### 4. **Menu URL Not Extracted**
Menu search finds multiple menu pages, but only `menu_data` is stored. The primary menu URL (`https://leila-me.com/menu`) should be stored in `menu_url` field.

**Fix Needed:** Extract first/best menu URL from Firecrawl menu search results and store in `menu_url` field.

### 5. **Mall Name Extraction Failing**
Address clearly contains "The Avenues Mall" but `mall_name` is null.

**Fix Needed:** Improve `extractMallName()` function to detect "The Avenues Mall" in address.

### 6. **Photos Not Stored in JSONB Field**
Image extraction completed (10 images processed), but `photos` JSONB field is empty. Photos might be stored in `restaurants_images` table but not in the `photos` field.

**Fix Needed:** Ensure photos are stored in both `restaurants_images` table AND `photos` JSONB field.

### 7. **Missing Data Aggregation**
- Overall rating should aggregate Google + TripAdvisor + OpenTable
- Total reviews should sum all sources
- Rating breakdown should be calculated

**Fix Needed:** Implement aggregation logic in data mapping step.

---

## Data Mapping Flow Analysis

### Current Flow Issues:

1. **Apify Fetch Step (Lines 53-72):**
   - âœ… Stores raw `apify_output` JSON
   - âœ… Calls `mapApifyFieldsToDatabase()` to normalize data
   - âœ… Calls `updateRestaurantFields()` to update database
   - âš ï¸ **Problem:** If `updateRestaurantFields()` fails silently, fields remain null

2. **Firecrawl General Step (Lines 81-117):**
   - âœ… Extracts social media and email
   - âœ… Attempts to update contact fields
   - âš ï¸ **Problem:** Update might be failing silently

3. **Firecrawl Website Step (Lines 158-199):**
   - âš ï¸ **Problem:** Only runs if `websiteUrl` exists
   - But `websiteUrl` comes from Apify which has Google Maps URL, not actual website
   - Creates dependency issue

4. **Data Mapping Step (Lines 367-404):**
   - âœ… Handles relationships (cuisines, categories, etc.)
   - âŒ **Does NOT** handle basic field updates or aggregation

---

## Recommended Fixes (Priority Order)

### ðŸ”´ CRITICAL - Fix Hours Normalization Bug
**Issue:** Hours contain "NaN:00" instead of proper time values  
**Impact:** Operating hours completely broken  
**Fix:** Debug and fix `convertTo24Hour()` function to properly parse "8 AM" format

### ðŸ”´ CRITICAL - Fix Silent Update Failures
**Issue:** Database updates failing silently  
**Impact:** Many fields not populated despite extraction working  
**Fix:** Add proper error checking to all `updateRestaurantFields()` calls

### ðŸŸ¡ HIGH - Extract Website from Firecrawl Results
**Issue:** Website field not populated even though URLs exist in Firecrawl  
**Impact:** Missing website link  
**Fix:** Extract website URL from Firecrawl search results (not Apify URL field)

### ðŸŸ¡ HIGH - Fix Social Media Extraction
**Issue:** Instagram URLs found but not stored  
**Impact:** Missing social media links  
**Fix:** Debug why `extractSocialMediaFromFirecrawl()` update is failing

### ðŸŸ¡ HIGH - Store Menu URL
**Issue:** Menu pages found but URL not stored  
**Impact:** Missing menu link  
**Fix:** Extract menu URL from Firecrawl menu search results

### ðŸŸ¢ MEDIUM - Fix Mall Name Extraction
**Issue:** "The Avenues Mall" visible in address but not extracted  
**Impact:** Missing mall information  
**Fix:** Improve `extractMallName()` function

### ðŸŸ¢ MEDIUM - Aggregate Ratings
**Issue:** Separate ratings exist but no overall rating calculated  
**Impact:** Missing aggregated rating  
**Fix:** Add rating aggregation logic

### ðŸŸ¢ MEDIUM - Fix Photos Storage
**Issue:** Images extracted but not stored in `photos` JSONB field  
**Impact:** Missing photo gallery  
**Fix:** Ensure photos stored in both table and JSONB field

---

## Testing Checklist

After fixes, verify:
- [ ] Hours field contains valid times (no NaN)
- [ ] Website field populated from Firecrawl
- [ ] Instagram URL populated
- [ ] Menu URL populated
- [ ] Mall name extracted from address
- [ ] Overall rating calculated
- [ ] Photos array contains 10 images
- [ ] All database updates log errors if they fail

---

## Implementation Notes

1. **Error Handling:** All `updateRestaurantFields()` calls must check for errors and throw/log them
2. **Data Validation:** Add validation before database updates to ensure data format is correct
3. **Logging:** Add detailed logging to track which fields are being updated and why updates fail
4. **Testing:** Test fixes with Leila Min Lebnen re-extraction to verify all fields populate

---

**Next Steps:**
1. Fix `convertTo24Hour()` function for hours normalization
2. Add error checking to all database update operations
3. Extract website URL from Firecrawl results
4. Fix social media extraction and update logic
5. Test fixes with Leila Min Lebnen re-extraction
