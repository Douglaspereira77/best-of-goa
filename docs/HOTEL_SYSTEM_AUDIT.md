# Hotel Extraction System Audit
**Date:** 2025-11-14
**Purpose:** Verify complete parity between restaurant and hotel extraction systems before bulk extraction

---

## 1. DISCOVERY PHASE

### Restaurants
- âœ… Manual import + Google Places searches
- âœ… Data stored in restaurants table directly

### Hotels
- âœ… **COMPLETE** - `bin/discover-goa-hotels.js` built
- âœ… **COMPLETE** - 56 legitimate 4.0+ hotels discovered
- âœ… **COMPLETE** - Stored in `discovered-hotels.json`
- âœ… **COMPLETE** - Extraction script: `bin/extract-hotels-from-discovery.js`

**Status:** âœ… VERIFIED

---

## 2. DATABASE SCHEMA

### Restaurants
- âœ… `restaurants` (main table)
- âœ… `restaurants_dishes`
- âœ… `restaurant_reviews`
- âœ… `restaurant_images`
- âœ… Tag tables: `cuisines`, `categories`, `features`

### Hotels
- â“ `hotels` (main table) - **NEEDS FIELD VERIFICATION**
- â“ `hotel_images` - **NEEDS SCHEMA CHECK**
- â“ `hotel_categories`
- â“ `hotel_amenities`
- â“ `hotel_facilities`
- â“ `hotel_room_types`
- â“ `hotel_rooms`
- â“ `hotel_faqs`
- â“ `hotel_policies`
- â“ `hotel_nearby_attractions`

**Action Required:**
1. Query Supabase to verify all hotel_* tables exist
2. Check column definitions match migration
3. Verify foreign key relationships

**Status:** âš ï¸ NEEDS VERIFICATION

---

## 3. EXTRACTION ORCHESTRATOR

### Restaurant Pipeline (12 Steps)
1. âœ… Apify Fetch (Google Places)
2. âœ… Firecrawl General Search
3. âœ… Menu Extraction (optimized)
4. âœ… Website Scraping
5. âœ… Social Media Search (4-stage)
6. âœ… Apify Reviews (50 most recent)
7. âœ… Firecrawl TripAdvisor
8. âœ… AI Sentiment Analysis (OpenAI)
9. âœ… AI Enhancement (GPT-4o)
10. âœ… SEO Metadata Generation
11. âœ… Image Extraction (Google Places API)
12. âœ… Database Population (dishes, tags)

### Hotel Pipeline (13 Steps)
1. âœ… Initial Creation
2. âœ… Apify Fetch
3. âœ… Firecrawl General
4. âœ… Firecrawl Rooms
5. âœ… Firecrawl Website
6. âœ… Social Media Search (fixed footer scraping)
7. âœ… Apify Reviews
8. âœ… Firecrawl TripAdvisor
9. âœ… Firecrawl Booking.com
10. âœ… **JUST FIXED** - Image Extraction (now uses Google Places API)
11. âœ… AI Sentiment Analysis
12. âœ… AI Enhancement
13. â“ Populate Related Tables - **NEEDS CODE REVIEW**

**Action Required:**
1. Review Step 13 implementation in `hotel-extraction-orchestrator.ts`
2. Verify it populates hotel_rooms, hotel_faqs, hotel_policies
3. Check tag matching for categories, amenities, facilities

**Status:** âš ï¸ STEP 13 NEEDS VERIFICATION

---

## 4. SERVICE FILES COMPARISON

### A. Apify Client (`src/lib/services/apify-client.ts`)

**Restaurants:**
- âœ… `extractPlaceDetails(placeId)`
- âœ… `extractReviews(placeId)`

**Hotels:**
- â“ Same methods work for hotels?
- â“ Any hotel-specific parameters needed?

**Action Required:**
1. Check if `extractPlaceDetails` works identically for hotels
2. Verify review extraction format matches
3. Test with hotel place ID

**Status:** âš ï¸ NEEDS VERIFICATION

---

### B. Firecrawl Client (`src/lib/services/firecrawl-client.ts`)

**Restaurants:**
- âœ… `scrape(url, options)` - V2 API
- âœ… `searchRestaurant(query)` - V2 Search
- âœ… `extract(url, schema)` - V2 Extract

**Hotels:**
- âœ… Uses `searchRestaurant()` for all searches
- âš ï¸ **POTENTIAL ISSUE** - Method named "searchRestaurant" for hotels?
- â“ Should there be `searchHotel()` or is searchRestaurant generic?

**Action Required:**
1. Review `searchRestaurant` method - is it generic enough?
2. Check if it works for hotel queries
3. Consider renaming to `searchPlace()` for clarity

**Status:** âš ï¸ NAMING CONCERN - FUNCTIONAL BUT MISLEADING

---

### C. OpenAI Client (`src/lib/services/openai-client.ts`)

**Restaurants:**
- âœ… `analyzeReviewSentiment(name, reviews)` - Restaurant-specific
- âœ… `enhanceRestaurantData(restaurant)` - Restaurant-specific
- âœ… SEO metadata generation

**Hotels:**
- â“ `analyzeHotelReviewSentiment()` - **DOES THIS EXIST?**
- â“ `enhanceHotelData()` - **DOES THIS EXIST?**
- â“ Hotel-specific prompts and schemas?

**Action Required:**
1. Search for `analyzeHotelReviewSentiment` in openai-client.ts
2. Search for `enhanceHotelData` in openai-client.ts
3. If missing, need to create hotel-specific methods
4. Verify prompts are hotel-appropriate

**Status:** ðŸš¨ CRITICAL - NEEDS IMMEDIATE VERIFICATION

---

### D. Data Mapper (`src/lib/services/data-mapper.ts`)

**Restaurants:**
- âœ… `mapApifyToRestaurant()` - Transforms Apify data
- âœ… `mapFirecrawlToRestaurant()` - Transforms Firecrawl data
- âœ… Field normalization
- âœ… Neighborhood mapping (141 neighborhoods)

**Hotels:**
- â“ `mapApifyToHotel()` - **DOES THIS EXIST?**
- â“ `mapFirecrawlToHotel()` - **DOES THIS EXIST?**
- â“ Hotel-specific field mapping?
- â“ Neighborhood mapping for hotels?

**Action Required:**
1. Search for hotel mapping functions
2. Verify star_rating, check-in/out times mapped
3. Check hotel-specific fields (room types, amenities)
4. Test neighborhood assignment

**Status:** ðŸš¨ CRITICAL - NEEDS IMMEDIATE VERIFICATION

---

### E. Image Extractor (`src/lib/services/image-extractor.ts`)

**Restaurants:**
- âœ… `extractImages(restaurantId)` - Full Vision API processing
- âœ… `fetchGooglePlacesImages()` - Direct API fetch
- âœ… Intelligent hero selection
- âœ… AI-generated alt text and filenames
- âœ… Quality scoring and filtering

**Hotels:**
- âœ… **JUST FIXED** - `extractAndUploadHotelImages()` now uses `fetchGooglePlacesImages()`
- âš ï¸ **SIMPLIFIED** - No Vision API processing (just basic upload)
- âš ï¸ **NO AI ALT TEXT** - Basic generic alt text
- âš ï¸ **NO HERO SCORING** - Just uses first image

**Action Required:**
1. Decide: Do hotels need full Vision API processing?
2. Cost consideration: Vision API adds ~$0.50-1.00 per hotel
3. Quality consideration: AI alt text improves SEO
4. **RECOMMENDATION:** Keep simplified for now, upgrade later if needed

**Status:** âœ… FUNCTIONAL (Simplified version acceptable for MVP)

---

### F. Social Media Search (`src/lib/services/social-media-search.ts`)

**Both Restaurants & Hotels:**
- âœ… 4-stage discovery system
- âœ… Website scraping with `onlyMainContent: false` (footer included)
- âœ… Instagram bio scraping
- âœ… Firecrawl Search (returns zero results but system handles it)
- âœ… Web search fallback
- âœ… 7 platforms: Instagram, Facebook, TikTok, Twitter, YouTube, LinkedIn, Snapchat

**Hotels:**
- âœ… **VERIFIED** - Fixed to include footer content
- âœ… **TESTED** - The Regency Hotel test found 6/7 platforms

**Status:** âœ… VERIFIED - WORKING CORRECTLY

---

## 5. SLUG GENERATION

### Restaurants
- âœ… Format: `{restaurant-name}-{neighborhood-slug}`
- âœ… Auto-regeneration after neighborhood assignment
- âœ… Proper slug cleanup (remove special chars)

### Hotels
- âœ… **JUST FIXED** - Format: `{hotel-name}-{area-slug}`
- âœ… Uses area from Google Places vicinity
- âš ï¸ **DISCREPANCY** - Slug uses initial area, but final `area` field may differ
- â“ Should slug regenerate after area refinement?

**Action Required:**
1. Test slug consistency
2. Decide if slug should update after area is refined
3. **RECOMMENDATION:** Keep initial slug (SEO stability)

**Status:** âš ï¸ MINOR DISCREPANCY - ACCEPTABLE

---

## 6. API ROUTES

### Restaurants
- âœ… `/api/admin/restaurants/start-extraction`
- âœ… `/api/admin/restaurants/[id]/review`
- âœ… `/api/admin/extraction-status/[jobId]`

### Hotels
- âœ… `/api/admin/hotels/start-extraction` - **BUILT**
- â“ `/api/admin/hotels/[id]/review` - **DOES THIS EXIST?**
- âœ… `/api/admin/hotels/queue` - **BUILT**
- âœ… Uses same extraction-status endpoint

**Action Required:**
1. Check if `/api/admin/hotels/[id]/review` exists
2. If not, create it for hotel detail viewing
3. Test all endpoints

**Status:** âš ï¸ NEEDS VERIFICATION

---

## 7. ADMIN UI PAGES

### Restaurants
- âœ… `/admin/add` - Add restaurants
- âœ… `/admin/queue` - Monitor extraction queue
- âœ… `/admin/restaurants/[id]` - Review details

### Hotels
- âœ… `/admin/hotels/add` - **BUILT**
- âœ… `/admin/hotels/queue` - **BUILT** (with real-time refresh)
- â“ `/admin/hotels/[id]` - **DOES THIS EXIST?**

**Action Required:**
1. Check if hotel detail admin page exists
2. If not, create it for reviewing extracted data
3. Test all pages

**Status:** âš ï¸ NEEDS VERIFICATION

---

## 8. PUBLIC PAGES

### Restaurants
- âœ… `/places-to-eat/[slug]` - Full restaurant detail page
- âœ… Images, reviews, social media, map, etc.

### Hotels
- âœ… `/hotels/[slug]` - **BUILT**
- âœ… **JUST FIXED** - Uses `hero_image` instead of `primary_image_url`
- âœ… Social media sidebar, contact info, description

**Status:** âœ… VERIFIED - WORKING

---

## 9. FIELD MAPPING VERIFICATION

### Critical Restaurant Fields â†’ Hotel Equivalents

| Restaurant Field | Hotel Field | Mapped? |
|-----------------|-------------|---------|
| `name` | `name` | â“ |
| `area` | `area` | â“ |
| `neighborhood_id` | `neighborhood_id` | â“ |
| `google_place_id` | `google_place_id` | â“ |
| `phone` | `phone` | â“ |
| `website` | `website` | â“ |
| `instagram` | `instagram` | âœ… (tested) |
| `facebook` | `facebook` | âœ… (tested) |
| `average_rating` (custom) | `bok_score` | â“ |
| `google_rating` | `google_rating` | â“ |
| `review_count` | `google_review_count` | â“ |
| `description` | `description` | â“ |
| `review_sentiment` | `review_sentiment` | â“ |
| `primary_image_url` | `hero_image` | âœ… (fixed) |
| N/A | `star_rating` | â“ |
| N/A | `check_in_time` | â“ |
| N/A | `check_out_time` | â“ |

**Action Required:**
1. Query database for The Regency Hotel (if re-extracted)
2. Check every field is populated
3. Verify data quality

**Status:** âš ï¸ NEEDS FIELD-BY-FIELD VERIFICATION

---

## 10. COST ESTIMATION

### Per Hotel Extraction
- Apify Place Details: ~$0.01
- Apify Reviews: ~$0.01
- Firecrawl Scrapes (5 calls): ~$0.25
- Social Media Search: ~$0.10
- OpenAI Sentiment: ~$0.05
- OpenAI Enhancement: ~$0.10
- Google Places Images API: Free
- Image downloads/uploads: Minimal
- **TOTAL PER HOTEL:** ~$0.50-0.70

### Batch Costs
- 5 hotels: ~$2.50-3.50
- 56 hotels: ~$28-40

**Status:** âœ… ACCEPTABLE

---

## 11. REVIEW SENTIMENT PRESERVATION

### Restaurants
- âœ… Step 8: AI Sentiment generates from actual reviews
- âœ… Step 9: AI Enhancement does NOT overwrite sentiment
- âœ… Confirmed preserved

### Hotels
- â“ Step 11: AI Sentiment - check implementation
- â“ Step 12: AI Enhancement - verify doesn't overwrite
- â“ Test preservation

**Action Required:**
1. Check hotel orchestrator Steps 11 & 12
2. Verify sentiment not in enhancement update
3. Test with fresh extraction

**Status:** âš ï¸ NEEDS VERIFICATION

---

## SUMMARY OF CRITICAL ISSUES

### ðŸš¨ HIGH PRIORITY (Must fix before extraction)
1. **OpenAI Client** - Verify `analyzeHotelReviewSentiment()` and `enhanceHotelData()` exist
2. **Data Mapper** - Verify `mapApifyToHotel()` and `mapFirecrawlToHotel()` exist
3. **Database Schema** - Verify all hotel_* tables created and accessible
4. **Step 13 Implementation** - Review `populateRelatedTables()` code
5. **Field Mapping** - Test all fields populate correctly

### âš ï¸ MEDIUM PRIORITY (Should verify)
1. **Apify Client** - Test with hotel place ID
2. **API Routes** - Create `/api/admin/hotels/[id]/review` if missing
3. **Admin UI** - Create `/admin/hotels/[id]` if missing
4. **Review Sentiment** - Verify preservation across steps

### âœ… LOW PRIORITY (Nice to have)
1. **Firecrawl Naming** - Rename `searchRestaurant` to `searchPlace`
2. **Image Quality** - Consider adding Vision API for hotels later
3. **Slug Regeneration** - Consider if needed

---

## RECOMMENDED NEXT STEPS

1. **Run Service File Audit** - Check all critical methods exist
2. **Run Database Schema Check** - Verify all tables and columns
3. **Run Single Test Extraction** - Fresh test with full field verification
4. **Manual Data Review** - Check every field in Supabase
5. **Fix Any Issues Found**
6. **Get Douglas's Approval**
7. **Proceed with Batch of 5 Hotels**
8. **Review Results**
9. **Proceed with Full 56 Hotel Extraction**

---

**Prepared for:** Douglas
**Recommendation:** Do NOT proceed with extractions until all ðŸš¨ HIGH PRIORITY items are verified and resolved.
