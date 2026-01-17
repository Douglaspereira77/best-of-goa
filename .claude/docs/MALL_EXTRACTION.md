# Mall Extraction Pipeline

**File:** `src/lib/services/mall-extraction-orchestrator.ts`

## Overview

The mall extraction system provides automated data collection and AI enhancement for shopping malls in Goa, following a similar pattern to hotel and restaurant extraction but optimized for retail destinations.

## Extraction Process

### 1. Apify Fetch (Google Places Mall Details)
- Stores raw JSON in `apify_output`
- Maps: email, opening hours, phone number, website
- Maps area to `neighborhood_id` (141+ neighborhoods)
- Auto slug regeneration after area determined

### 2. Firecrawl General (Search mall info)
- Stores in `firecrawl_output.general`
- Extracts basic mall information
- Captures store count, facilities, and features

### 3. Website Scraping
- Extracts operational data from mall website
- Merges with existing data
- Captures special features and events

### 4. Multi-Stage Social Media Search
- Same 4-stage discovery as restaurants and hotels
- Updates: instagram, facebook, tiktok, twitter, youtube, linkedin
- Discovers official mall social media profiles

### 5. Apify Reviews
- Google reviews (50 most recent)
- Appends to `apify_output.reviews`
- Used for sentiment analysis

### 6. Image Extraction & Processing
- **Direct Google Places Photos API** integration
- Fetches up to 10 photos per mall
- **Resolution:** 1200px width for high-quality images
- Vision API analysis for each image:
  - AI-generated SEO filenames
  - Accessibility-optimized alt text
  - Hero image selection (first image)
  - Content classification tags
- Uploads to Supabase Storage (`malls` bucket)
- **Path Structure:** `malls/{slug}/images/{slug}-image-{n}.jpg`
- Stores all images in `mall_images` table
- Automatically sets first image as hero image

### 7. AI Enhancement (OpenAI GPT-4o mini)
- Generates `description`, `short_description`
- Creates SEO metadata: `meta_title`, `meta_description`
- Generates `meta_keywords` array
- Extracts operational details
- Suggests categories and features

### 8. Database Population
- Mall category matching
- Opening hours formatting
- Contact information normalization
- Location data validation

### 9. Final Status Update
- Mark extraction as completed or failed
- Update timestamps
- Set hero_image URL

## Database Schema

### Main Tables
- **malls** - Mall listings with location, contact, operational data
- **mall_images** - Gallery images with metadata
- **mall_categories** - Categories (luxury, outlet, hypermarket, etc.)

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | text | Mall name |
| `slug` | text | URL-friendly identifier |
| `google_place_id` | text | Google Places ID |
| `neighborhood_id` | uuid | Goa neighborhood reference |
| `description` | text | AI-generated full description |
| `short_description` | text | Summary for listings |
| `hero_image` | text | Main display image URL |
| `opening_hours` | jsonb | Operating hours by day |
| `mall_category_ids` | uuid[] | Category assignments |
| `extraction_status` | text | pending/processing/completed/failed |
| `extraction_progress` | jsonb | Step-by-step progress tracking |

### Mall Images Table

| Field | Type | Description |
|-------|------|-------------|
| `mall_id` | uuid | Reference to malls table |
| `url` | text | Supabase Storage URL |
| `alt_text` | text | AI-generated alt text |
| `type` | text | 'hero' or 'gallery' |
| `is_hero` | boolean | Hero image flag |
| `display_order` | integer | Gallery sort order |
| `approved` | boolean | Admin approval status |

## Admin Section

### URL Patterns
```
/admin/malls                    # All malls list
/admin/malls/add                # Add new mall
/admin/malls/queue              # Extraction queue
/admin/malls/[id]/review        # Review/edit mall data
```

### Features

**List Page** (`/admin/malls`)
- Table view of all malls
- Status filtering (Published, Draft, Processing, Failed)
- Name search
- Click-through to review pages
- Direct add button

**Add Page** (`/admin/malls/add`)
- Google Place ID input
- Duplicate detection
- One-click extraction start
- Queue monitoring link

**Queue Page** (`/admin/malls/queue`)
- Real-time progress tracking
- Current step indicator
- Error message display
- Auto-refresh every 5 seconds
- Filter by status

**Review Page** (`/admin/malls/[id]/review`)
- Complete data review and editing
- Image approval workflow
- Category assignment
- SEO metadata editing
- Actions: Save Draft, Publish Mall, Delete Mall

### API Endpoints

```
GET    /api/admin/malls/[id]                # Get mall data
PUT    /api/admin/malls/[id]                # Update mall
DELETE /api/admin/malls/[id]                # Delete mall
PUT    /api/admin/malls/[id]/publish        # Publish mall
POST   /api/admin/malls/start-extraction    # Start extraction
```

## Storage Structure

### Supabase Storage Bucket: `malls`

```
malls/
â”œâ”€â”€ {mall-slug}/
â”‚   â””â”€â”€ images/
â”‚       â”œâ”€â”€ {mall-slug}-image-1.jpg  (hero)
â”‚       â”œâ”€â”€ {mall-slug}-image-2.jpg
â”‚       â”œâ”€â”€ {mall-slug}-image-3.jpg
â”‚       â””â”€â”€ ... (up to 10 images)
```

### Public URL Format
```
https://{supabase-url}/storage/v1/object/public/malls/{mall-slug}/images/{filename}
```

## Testing & Verification Scripts

Located in `bin/`:

### Audit Scripts

```bash
# Complete audit of all malls
node bin/audit-mall-completeness.js
```

**Checks:**
- Failed extractions
- Missing images
- Missing descriptions
- Missing Google Place IDs
- Completely broken malls (multiple issues)

**Output:** Categorized issues + recommended actions

### Image Verification Scripts

```bash
# Count all images in storage vs database
node bin/count-all-mall-images.js

# Detailed image status check
node bin/check-mall-images-detailed.js

# Check storage buckets
node bin/check-storage-buckets.js
```

**Purpose:** Verify storage-to-database sync, identify missing images

### Data Sync Scripts

```bash
# Sync storage images to database
node bin/sync-storage-images-to-db.js
```

**Use Case:** When images exist in storage but not in `mall_images` table

**Features:**
- Auto-detects hero image (first image or contains 'hero' in filename)
- Generates alt text from filename
- Sets proper display order
- Updates mall `hero_image` field
- Skips malls already synced

### Re-extraction Scripts

```bash
# Re-extract images for failed malls
node bin/re-extract-failed-mall-images.js
```

**Purpose:** Retry image extraction for malls with `extraction_status='failed'`

**Features:**
- Fetches fresh photos from Google Places
- Direct upload to Supabase Storage
- Proper database record creation
- Status update to 'completed' on success
- Rate limiting (3 seconds between malls)

### Specific Mall Scripts

```bash
# Batch import malls from list
node bin/batch-import-malls.js

# Apply malls migration
node bin/apply-malls-migration.js

# Setup storage buckets
node bin/setup-malls-storage.js

# Test image extraction
node bin/test-mall-images.js

# Validate specific mall data
node bin/validate-avenues-data.js
```

## Public Pages

### URL Structure

```
/places-to-shop                          # Hub page
/places-to-shop/malls/[slug]             # Individual mall page
```

### Mall Detail Page Features

- Hero image with overlay
- BOK Score Card (location, facilities, variety, value)
- About section with AI description
- Store highlights
- Photo gallery
- Operating hours
- Contact information
- Location map (Google Maps embed)
- Social media links

## Goa Malls (November 2025)

### Current Status

**Total Malls:** 37
**Successfully Extracted:** 37 (100%)
**Total Images:** 349

### Major Malls Included

- **The Avenues Mall** - Goa's largest mall
- **360 Mall** - Luxury shopping destination
- **Al Kout Mall** - Seaside shopping center
- **Marina Mall** - Salmiya landmark
- **Grand Avenue - The Avenues** - Premium retail
- **Gate Mall** - Modern shopping center
- **Olympia Mall** - Family entertainment
- **Laila Gallery** - Traditional shopping
- **Al Hamra Luxury Center** - High-end retail
- **Murouj Complex** - Community shopping

### Data Quality

Each mall includes:
- âœ… AI-generated descriptions
- âœ… 8-10 high-quality images from Google Places
- âœ… Operating hours (structured format)
- âœ… Contact information (phone, email, website)
- âœ… Social media profiles (6 platforms)
- âœ… SEO metadata (title, description, keywords)
- âœ… Neighborhood mapping
- âœ… Category assignments

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Images in storage but not in database | Run `sync-storage-images-to-db.js` |
| Failed extraction status | Run `re-extract-failed-mall-images.js` |
| Missing Google Place ID | Cannot extract without Place ID; requires manual lookup |
| Neighborhood not mapping | Add area variation to neighborhood mapping |
| Duplicate slug | Manually adjust slug in database |
| Schema mismatch error | Ensure database inserts only use valid column names |

## Best Practices

### Before Extraction
1. Verify Google Place ID is correct
2. Check for existing duplicates
3. Ensure Supabase Storage bucket `malls` exists

### During Extraction
1. Monitor queue page for real-time progress
2. Watch console logs for detailed step tracking
3. Note any errors for troubleshooting

### After Extraction
1. Review mall data at `/admin/malls/[id]/review`
2. Verify all images loaded correctly
3. Check SEO metadata quality
4. Approve and publish when ready

### Bulk Operations
1. Process 2-5 malls concurrently (avoid API rate limits)
2. Use audit script to identify issues before bulk fixes
3. Keep queue page open for monitoring
4. Budget ~$1-2 per mall for API costs

## Migration from Hotels/Restaurants Pattern

The mall system follows the same architectural patterns:

**Similarities:**
- 13-step orchestrated extraction
- Supabase Storage for images
- AI enhancement with OpenAI
- Multi-stage social media discovery
- Admin review workflow
- Public detail pages with score cards

**Differences:**
- Simpler rating system (no multi-source aggregation)
- Focus on facilities vs. amenities/dishes
- Different category taxonomy (retail-focused)
- Store count vs. room count
- Operating hours more critical for public display

## Cost Breakdown (37 Malls)

| Step | Cost per Mall | Total (37 malls) |
|------|--------------|------------------|
| Google Places API | $0.10 | ~$3.70 |
| Firecrawl Scraping | $0.20 | ~$7.40 |
| OpenAI AI Enhancement | $0.15 | ~$5.55 |
| Image Processing | $0.05 | ~$1.85 |
| **Total** | **~$0.50** | **~$18.50** |

## Next Steps

- [ ] Add store directory feature for each mall
- [ ] Implement event calendar integration
- [ ] Add mall comparison tool
- [ ] Create mall category landing pages
- [ ] Integrate sales/promotions data

---

**Last Updated:** November 2025
**Status:** Production Ready - All 37 malls complete
