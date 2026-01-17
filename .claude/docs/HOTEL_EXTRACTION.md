# Hotel Extraction Pipeline

**File:** `src/lib/services/hotel-extraction-orchestrator.ts`

## 13-Step Process

### 1. Apify Fetch (Google Places Hotel Details)
- Stores raw JSON in `apify_output`
- Maps: email, total_floors, year_opened, year_renovated
- Maps area to `neighborhood_id` (141+ neighborhoods)
- Auto slug regeneration after area determined

### 2. Firecrawl General (Search hotel info)
- Stores in `firecrawl_output.general`
- Extracts basic hotel information

### 3. Firecrawl Rooms (Room types & amenities)
- Stores in `firecrawl_output.rooms`
- Used for AI room extraction

### 4. Website Scraping
- Extracts operational data from hotel website
- Merges with existing data

### 5. Multi-Stage Social Media Search
- Same 4-stage discovery as restaurants
- Updates: instagram, facebook, tiktok, twitter, youtube, linkedin

### 6. Apify Reviews
- Google reviews (50 most recent)
- Appends to `apify_output.reviews`

### 7. Firecrawl TripAdvisor Search
- Stores in `firecrawl_output.tripadvisor`
- Parses: `tripadvisor_rating`, `tripadvisor_review_count`
- Flexible regex patterns with debug logging

### 8. Firecrawl Booking.com Search
- Stores in `firecrawl_output.booking_com`
- Parses: `booking_com_rating`, `booking_com_review_count`
- Handles "3593 Verified Hotel Reviews" format
- Extracts: `average_nightly_rate`, `cancellation_policy`

### 9. Image Extraction & Processing
- **Smart Quality Tier System** (Added Nov 2025):
  - **Premium tier**: Photos â‰¥1200Ã—900 pixels (preferred)
  - **Best Available tier**: Fallback when no premium photos exist
  - Ensures hotels with lower-res Google Photos still get images
- Vision API analysis for each image:
  - AI-generated SEO filenames
  - Accessibility-optimized alt text
  - Hero image scoring (0-100)
  - Content classification tags
- Hero image selection based on:
  - Content suitability (lobby, exterior, pool preferred)
  - Not abstract art or decorative elements
  - Highest hero score among suitable images
- Uploads to Supabase Storage (`hotels` bucket)
- Stores all images in `hotel_images` table
- **Gallery Display**: Shows 6 images with "View all photos" button

### 10. AI Sentiment Analysis (OpenAI GPT-4o mini)
- Analyzes guest reviews
- Generates `review_sentiment` summary
- **PRESERVED:** Not overwritten by subsequent steps

### 11. GPT-4o AI Enhancement
- Generates description, short_description
- `hotel_type` (luxury|business|resort|boutique|budget)
- `meta_keywords` array
- `og_title`, `og_description`
- Suggests categories, amenities
- Extracts check_in_time, check_out_time, pets_allowed, smoking_policy
- Debug logging verifies AI response fields

### 12. Database Population
- `parseApifyAmenities()` - Extracts from additionalInfo.Amenities
- hotel_category_ids matching
- hotel_amenity_ids matching (from AI + Apify)
- hotel_facility_ids matching (from Apify additionalInfo)
- `calculateTotalReviews()` - Sum all sources
- hotel_faqs generation
- hotel_rooms extraction

### 13. Final Status Update
- Mark extraction as completed or failed
- Update timestamps

## Hotel Review Page

**Page:** `/admin/hotels/[id]/review`

### Features
- Entity-aware UI (displays "Hotel" instead of "Restaurant")
- Hotel-specific rating breakdown component (HotelRatingBreakdown)
- Actions: Save Draft, Publish Hotel, Delete Hotel
- Room types management
- Hotel-specific FAQs
- Image approval workflow

### API Endpoints
- `GET /api/admin/hotels/[id]/review` - Fetch hotel data for review
- `DELETE /api/admin/hotels/[id]` - Delete hotel and all related data
  - Cascades: images, rooms, FAQs, reviews, amenities

### Entity Type Handling
The ReviewSidebar component uses `entityType` prop to:
- Render correct rating breakdown (HotelRatingBreakdown vs RatingBreakdown)
- Display correct action button labels ("Publish Hotel" vs "Publish Restaurant")
- Apply hotel-specific business logic

## Queue Monitoring

**Page:** `/admin/hotels/queue`

### Features
- Real percentage calculation (13 steps)
- Current step indicator
- Error message display for failures
- Auto-refresh every 5 seconds
- Filter by status (pending/processing/completed/failed)

### Extraction Steps Tracked
```
1. initial_creation
2. apify_fetch
3. firecrawl_general
4. firecrawl_rooms
5. firecrawl_website
6. firecrawl_social_media_search
7. apify_reviews
8. firecrawl_tripadvisor
9. firecrawl_booking_com
10. process_images
11. ai_sentiment
12. ai_enhancement
13. data_mapping
```

## Duplicate Detection

**Page:** `/admin/hotels/add`

### Features
- Checks Google Place ID against existing database
- Amber background + "Already in DB" badge
- Action buttons: View Hotel, Review Data, Re-extract
- Re-extraction deletes existing data first

## Testing Commands

```bash
# Inspect existing hotel data
node bin/inspect-hilton-data.js

# Verify field population
node bin/verify-hotel-field-population.js

# Check specific hotel
node bin/check-regency-extraction.js

# Re-extract images for a hotel (with smart fallback)
npx tsx bin/extract-park-inn-images.ts

# Check hotel image status
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('hotels').select('name, hero_image').not('hero_image', 'is', null).then(r => {
  console.log('Hotels with images:', r.data?.length);
});
"
```

## Full Extraction Test

1. Run `npm run dev`
2. Go to `/admin/hotels/add`
3. Enter hotel details (Google Place ID)
4. Monitor console for `[HotelOrchestrator]` logs:
   - Neighborhood mapping
   - AI Enhancement Response Keys
   - hotel_type from AI
   - TripAdvisor/Booking.com text parsing
   - Found Apify amenities

## Verification Checklist

- [ ] `neighborhood_id` populated
- [ ] `hotel_type` set (luxury|business|resort|boutique|budget)
- [ ] `hotel_amenity_ids` and `hotel_facility_ids` arrays populated
- [ ] `tripadvisor_rating`, `booking_com_rating` extracted
- [ ] `total_reviews_aggregated` calculated
- [ ] `meta_keywords`, `og_title`, `og_description` generated
- [ ] `hero_image` URL populated (Supabase Storage)
- [ ] `hotel_images` table has records for this hotel
- [ ] Images have AI-generated `alt_text` and SEO filenames

## Image Quality Tier System

**File:** `src/lib/services/hotel-image-extractor.ts`

### Quality Tiers

| Tier | Resolution | Validation | Use Case |
|------|-----------|------------|----------|
| **Premium** | â‰¥1200Ã—900 | Full ImageValidator checks | Hotels with high-res Google Photos |
| **Best Available** | Any size | File size only (â‰¤10MB) | Fallback for lower-res photos |

### How It Works

1. **Fetch**: Gets all photos from Google Places API
2. **Classify**: Tags each photo as `premium` or `best_available`
3. **Select**: Uses premium if available, otherwise falls back to best available
4. **Process**: All photos get Vision API analysis regardless of tier
5. **Upload**: Skips strict resolution validation for best_available tier

### Gallery Display

- **Hotel pages show 6 images** in a 2x3 grid
- "View all X photos" button appears when more than 6 photos exist
- Lightbox modal for full-screen browsing with navigation
- Maintains consistency with restaurant page pattern

### Re-extracting Images

```bash
# Create a script to re-extract images for a specific hotel
npx tsx bin/extract-park-inn-images.ts
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Neighborhood not mapping | Add area variation to `getAddressMapping()` and `getAreaMapping()` |
| TripAdvisor/Booking ratings missing | Firecrawl Search returns descriptions, not structured data |
| Amenities not populating | Check Apify additionalInfo.Amenities exists in raw output |
| **No images extracted** | All Google Photos below 1200Ã—900; smart fallback uses best available |
| **hero_image is NULL** | Check extraction_progress.process_images status; may need re-extraction |
| **Low quality images** | Using best_available tier; consider manual upload for key hotels |

## Best Practices for Bulk Extraction

- Run 2-5 hotels concurrently (avoid API rate limits)
- Monitor Firecrawl credits (5+ calls per hotel)
- Watch for common failures: neighborhood mapping, TripAdvisor parsing
- Keep queue page open for real-time monitoring
- Failed hotels can be retried from `/admin/hotels/[id]/review`

---

## Bulk Extraction Pipeline (November 2025)

### Overview

Successfully extracted **72 out of 73 hotels** (98.6% success rate) for Goa directory using automated pipeline combining Google Places discovery, TripAdvisor list merge, and batch extraction.

### Bulk Extraction Scripts

```bash
bin/discover-goa-hotels.js          # Discover hotels via Google Places API
bin/filter-legitimate-hotels.js        # Filter non-hotel listings
bin/merge-hotel-lists.js               # Merge TripAdvisor CSV with Google Places
bin/fetch-missing-hotel-place-ids.js   # Fetch Place IDs for missing hotels
bin/extract-hotels-from-discovery.js   # Batch extraction orchestrator
bin/verify-hotel-extraction.js         # Verify extraction results
```

### Step 1: Discovery (Google Places API)

```bash
node bin/discover-goa-hotels.js
```

- Searches 12 geographic zones in Goa
- Uses Google Places Nearby Search API (`type: lodging`)
- Filters: Active hotels with 10+ reviews, 4.0+ rating
- Outputs: `discovered-hotels.json`, `hotels-4.0-plus.json`
- Cost: ~$1-2

### Step 2: Merge with TripAdvisor List

```bash
node bin/merge-hotel-lists.js
```

- Parses TripAdvisor CSV export (name, rating, price)
- Fuzzy matches against Google Places (40% similarity threshold)
- Identifies missing hotels (17 found in Nov 2025)
- Outputs: `hotels-missing-from-discovery.json`, `hotels-comprehensive-list.json`

### Step 3: Fetch Missing Place IDs

```bash
node bin/fetch-missing-hotel-place-ids.js
```

- Uses Google Places Text Search API
- Searches: `{hotel_name} Goa hotel`
- Auto-merges into `hotels-legitimate-4.0-plus.json`
- Cost: ~$0.54 for 17 hotels

### Step 4: Batch Extraction

```bash
# Test with 2 hotels first
node bin/extract-hotels-from-discovery.js 2

# Full extraction
node bin/extract-hotels-from-discovery.js
```

**Configuration:**
- Batch size: 2 hotels
- Batch delay: 3 minutes between batches
- Request delay: 3 seconds between hotels
- Auto-skips existing hotels (checks `google_place_id`)

### Step 5: Verify Results

```bash
node bin/verify-hotel-extraction.js
```

Checks: basic info, ratings, contact, social media, AI content, images, amenities

### Cost Breakdown (73 hotels)

| Step | Cost |
|------|------|
| Discovery | ~$2 |
| Place ID Lookup | ~$0.54 |
| Extraction (Apify + Firecrawl + AI) | ~$73 |
| **Total** | **~$75** |

### Final Results (November 2025)

**72/73 hotels extracted successfully (98.6%)**

Each hotel includes:
- âœ… AI-generated descriptions & sentiment analysis
- âœ… Hero images uploaded to Supabase Storage
- âœ… Social media profiles (Instagram, Facebook, TikTok, Twitter, YouTube, LinkedIn)
- âœ… SEO metadata (meta_title, meta_description)
- âœ… Check-in/check-out times, smoking policy, pet policy
- âœ… 14+ amenities mapped per hotel average
- âœ… Categories assigned

**Failed:** Wahaj Boulevard Hotel (can retry from admin)

### Data Files Generated

```
hotels-legitimate-4.0-plus.json       # Final extraction list (73 hotels)
hotels-missing-from-discovery.json     # Hotels not in Google Places discovery
hotels-missing-with-place-ids.json     # Missing hotels with Place IDs fetched
hotels-comprehensive-list.json         # All hotels merged from both sources
hotels-matched.json                     # Matched between TripAdvisor & Google
```

### Monitoring During Extraction

1. **Queue Page:** http://localhost:3000/admin/hotels/queue
2. **Console:** Batch progress, success/failure counts
3. **Database Check:**
```bash
node -e "
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('hotels').select('extraction_status').then(({data}) => {
  console.log('Completed:', data.filter(h => h.extraction_status === 'completed').length);
});
"
```

### Next Steps After Bulk Extraction

1. Review hotels at `/admin/hotels/queue`
2. Publish approved hotels
3. Retry any failed extractions
4. Add additional hotels using same pipeline

---

## Hotel List Comparison & Gap Analysis (November 2025)

### Overview

Compare a list of hotel names against the existing database to identify:
- Hotels already in the database
- Hotels with similar names (fuzzy matching)
- Missing hotels that need extraction

### Scripts

```bash
bin/check-hotel-list.js              # Compare hotel list against database (fuzzy matching)
bin/extract-missing-hotels-bulk.js   # Queue missing hotels + fetch Place IDs
bin/run-hotel-extractions.js         # Trigger extraction for pending hotels
```

### Workflow: Check and Extract Missing Hotels

#### Step 1: Check Current Database Coverage

```bash
node bin/check-hotel-list.js
```

Uses fuzzy string matching (Levenshtein distance) to:
- Find exact matches in database
- Identify possible matches (60%+ similarity)
- List hotels not in database
- Report extraction status (completed/pending/failed)

**Output:**
- Confirmed matches with database names
- Possible matches requiring manual review
- Missing hotels list

#### Step 2: Queue Missing Hotels for Extraction

```bash
node bin/extract-missing-hotels-bulk.js
```

This script:
1. **Fetches Google Place IDs** for missing hotels via Text Search API (~$0.03/hotel)
2. **Generates slugs** from hotel names
3. **Extracts area** from address
4. **Creates database records** with pending status
5. **Reports** queued hotels, skipped hotels (already exist), and failures

**Database Fields Set:**
- `name` - Hotel name from Google
- `slug` - URL-friendly slug
- `area` - Extracted from address
- `google_place_id` - For extraction orchestrator
- `google_rating` - Rating from Google Places
- `google_review_count` - Number of reviews
- `address` - Full address
- `latitude/longitude` - Coordinates
- `extraction_status` - Set to 'pending'
- `extraction_progress` - Initial creation step

**Cost:** ~$0.70 for 22 hotels

#### Step 3: Run Extractions

```bash
# Ensure dev server is running first
npm run dev

# In another terminal, run extractions
node bin/run-hotel-extractions.js [batchSize]
```

**Configuration:**
- Default batch size: 2 hotels
- Batch delay: 3 minutes (avoids API rate limits)
- Request delay: 5 seconds between hotels
- Uses `override: true` to re-extract pending hotels

**Features:**
- Checks if dev server is running
- Processes hotels in batches
- Real-time progress output
- Tracks successes and failures
- Reports estimated time and cost

**Example Output:**
```
BATCH 1/9 (2 hotels)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
[1/2] Starting: Al Kout Beach Hotel
[1/2]   Started - Hotel ID: 8f94998b-062f-416f-8d76-3eaca5e413c8
[2/2] Starting: Park Avenues Hotel
[2/2]   Started - Hotel ID: 27a6700a-089f-471d-ba21-49cfb6475708

Batch 1 complete: 2 started

Waiting 3 minutes before next batch...
```

### Cost Breakdown (17 hotels example)

| Step | Cost |
|------|------|
| Place ID Lookup (22 hotels) | ~$0.70 |
| Extraction (17 hotels) | ~$17.00 |
| **Total** | **~$17.70** |

### Common Issues

| Issue | Solution |
|-------|----------|
| `null value in column "slug"` | Script now auto-generates slugs |
| `null value in column "area"` | Script now extracts area from address |
| `duplicate key value violates unique constraint "hotels_slug_key"` | Hotel with same slug exists; manually adjust or skip |
| Hotels showing "already exists" | Use `override: true` to re-extract |
| Dev server not running | Start with `npm run dev` first |

### November 2025 Extraction Run

**Input:** 22 missing hotels from comprehensive list comparison

**Results:**
- 17 hotels queued for extraction
- 4 hotels skipped (already in database with different names)
- 1 hotel failed (duplicate slug conflict)

**Hotels Extracted:**
1. Al Kout Beach Hotel
2. Park Avenues Hotel
3. Swiss-Belinn Sharq Goa
4. Oasis Hotel
5. Ocean View Hotel Goa
6. Riggae Tower Hotel
7. Pyramiza Hotel Mangaf
8. Panorama Hotel Goa
9. The St. Regis Goa
10. Carlton Tower Hotel Goa
11. City View Hotel
12. Ray Hotel
13. Plaza Athenee Hotel Goa
14. Salmiya Grand Hotel
15. Salmiya Casa Hotel Apartments
16. Palazzo Hotel
17. Pyramiza Hotel Fahaheel

**Estimated Time:** 1.4 hours (17 hotels Ã— 3.5 min + batch delays)

### Best Practices

1. **Always check first** - Run comparison before extraction to avoid duplicates
2. **Review fuzzy matches** - Some hotels have different names in Google vs. your list
3. **Monitor queue page** - Watch for failures in real-time
4. **Batch delays matter** - 3-minute delays prevent API rate limits
5. **Keep dev server running** - Required for extraction API
6. **Track costs** - ~$1/hotel for full extraction pipeline

---

## Critical Fixes (November 2025)

### Status Filtering for Public Pages

**Problem:** Draft, failed, and processing hotels were visible on public pages.

**Solution:** Added status filtering to all public queries in `src/lib/queries/places-to-stay.ts`:

```typescript
.eq('active', true)
.eq('extraction_status', 'completed')
```

**Files Updated:**
- `getTopRatedHotels()` - Only shows completed, active hotels
- `getLuxuryHotels()` - Only shows completed, active hotels
- `getBudgetFriendlyHotels()` - Only shows completed, active hotels
- `getAllCategoriesWithCounts()` - Counts only active hotels
- `getGovernoratesWithHotelStats()` - Counts only active hotels
- `getTotalHotelCount()` - Counts only active hotels

### Category Page Query Fix

**Problem:** Queries used non-existent `hotels_categories` junction table.

**Solution:** Rewrote `src/lib/queries/hotel-category-pages.ts` to use array-based pattern:

```typescript
// Old (broken)
.eq('hotels_categories.categories.slug', categorySlug)

// New (working)
.contains('hotel_category_ids', [category.id])
```

### Hotel Publish API

**Created:** `src/app/api/admin/hotels/[id]/publish/route.ts`

```typescript
PUT /api/admin/hotels/[id]/publish
```

Features:
- Validates required fields (name, slug, address, area)
- Checks extraction_status is 'completed'
- Sets `active=true`, `verified=true`
- Returns success/error response

### Hotel Update API

**Created:** `src/app/api/admin/hotels/[id]/route.ts` (PUT method)

```typescript
PUT /api/admin/hotels/[id]
GET /api/admin/hotels/[id]
DELETE /api/admin/hotels/[id]
```

Features:
- Updates any hotel field
- Protects sensitive fields (google_place_id, extraction data)
- Auto-updates `updated_at` timestamp

---

## SEO-Optimized URL Structure (November 2025)

### Category URLs

**Format:** `/places-to-stay/[category]-hotels`

- `/places-to-stay/luxury-hotels`
- `/places-to-stay/business-hotels`
- `/places-to-stay/family-hotels`
- `/places-to-stay/boutique-hotels`
- `/places-to-stay/resort-hotels`
- `/places-to-stay/budget-hotels`

**Why -hotels suffix?**
- Keyword targeting: Users search "luxury hotels Goa"
- URL as ranking signal: Google sees "hotels" in URL
- Semantic clarity: Clear intent vs. generic "luxury"
- Consistency: Matches `/places-to-eat/[cuisine]-restaurants`

**Database:** `hotel_categories` table slugs updated to include `-hotels`:
```sql
luxury -> luxury-hotels
business -> business-hotels
family -> family-hotels
boutique -> boutique-hotels
resort -> resort-hotels
budget -> budget-hotels
```

### Hotel Detail URLs

**Format:** `/places-to-stay/hotels/[hotel-name]-[area]`

Examples:
- `/places-to-stay/hotels/waldorf-astoria-goa-rai`
- `/places-to-stay/hotels/four-seasons-hotel-goa-at-burj-alshaya-mirqab`
- `/places-to-stay/hotels/safir-marina-hotel-salmiya`

**Why area suffix?**
- Location-based SEO targeting
- Unique slugs (multiple hotels with same name in different areas)
- Clear geographic context for search engines
- Matches Goa's location-focused search patterns

### Page Titles

Category pages now display:
- **Hero:** "Best Luxury Hotels in Goa"
- **Subtitle:** "X top-rated luxury hotels in Goa"
- **Meta Title:** "Best Luxury Hotels in Goa (X Options) | Best of Goa"
- **OG Title:** "Best Luxury Hotels in Goa"

All titles include "Hotels" for better keyword targeting.

---

## Testing URLs

### Category Pages
```
http://localhost:3000/places-to-stay
http://localhost:3000/places-to-stay/luxury-hotels
http://localhost:3000/places-to-stay/business-hotels
http://localhost:3000/places-to-stay/family-hotels
http://localhost:3000/places-to-stay/boutique-hotels
http://localhost:3000/places-to-stay/resort-hotels
http://localhost:3000/places-to-stay/budget-hotels
```

### Hotel Detail Pages
```
http://localhost:3000/places-to-stay/hotels/[slug]-[area]
```

### Admin Pages
```
http://localhost:3000/admin/hotels/queue
http://localhost:3000/admin/hotels/add
http://localhost:3000/admin/hotels/[id]/review
```

### API Endpoints
```
GET    /api/admin/hotels/[id]           # Get hotel data
PUT    /api/admin/hotels/[id]           # Update hotel
DELETE /api/admin/hotels/[id]           # Delete hotel
PUT    /api/admin/hotels/[id]/publish   # Publish hotel
POST   /api/admin/hotels/start-extraction  # Start extraction
```
