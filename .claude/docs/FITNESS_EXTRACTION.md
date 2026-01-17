# Fitness Place Extraction Pipeline

**File:** `src/lib/services/fitness-extraction-orchestrator.ts`

## Overview

The fitness extraction system provides automated data collection and AI enhancement for fitness centers, gyms, yoga studios, and other fitness facilities in Goa. It follows the same pattern as attractions extraction but includes fitness-specific features like gender policies and amenities.

## Extraction Process

### 1. Apify Fetch (Google Places Fitness Details)
- Stores raw JSON in `apify_output` (REQUIRED for AI content generation)
- Maps: email, opening hours, phone number, website
- Extracts fitness types from categories and tags
- Detects gender policy from name and description
- Parses amenities from `additionalInfo` fields
- Auto slug generation from name

### 2. Firecrawl Website (Website Scraping)
- Stores in `firecrawl_output` (REQUIRED for AI content generation)
- Extracts detailed class schedules
- Captures pricing information
- Finds trainer certifications
- Discovers membership options

### 3. Multi-Stage Social Media Search
- Same 4-stage discovery as restaurants and hotels
- Updates: instagram, facebook, twitter, tiktok
- Discovers official fitness center social media profiles
- Finds promotional content and class updates

### 4. Apify Reviews
- Google reviews (50 most recent)
- Appends to `apify_output.reviews`
- Used for sentiment analysis
- Captures member experiences

### 5. Image Extraction & Processing
- **Direct Google Places Photos API** integration
- Fetches up to 10 photos per fitness place
- **Resolution:** 1200px width for high-quality images
- Vision API analysis for each image:
  - AI-generated SEO filenames
  - Accessibility-optimized alt text
  - Hero image selection (first image)
  - Content classification tags
- Uploads to Supabase Storage (`fitness` bucket)
- **Path Structure:** `fitness/{slug}/images/{slug}-image-{n}.jpg`
- Stores all images in `fitness_images` table
- Automatically sets first image as hero image

### 6. AI Enhancement (OpenAI GPT-4o)
- Generates `description`, `short_description`
- Creates SEO metadata: `meta_title`, `meta_description`
- Generates `meta_keywords` array
- Extracts operational details
- Suggests fitness types and amenities
- Analyzes member reviews for quality insights

### 7. Category & Amenity Matching
- Maps fitness types to standard categories
- Normalizes amenity data
- Validates gender policy classifications
- Opening hours formatting
- Contact information normalization

## Database Schema

### Main Tables
- **fitness_places** - Fitness center listings with location, contact, operational data
- **fitness_images** - Gallery images with metadata
- **fitness_categories** - 10 standard fitness categories
- **fitness_amenities** - 31 amenity types
- **fitness_features** - 22 facility features

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | text | Fitness place name |
| `slug` | text | URL-friendly identifier |
| `google_place_id` | text | Google Places ID |
| `area` | text | Location area in Goa |
| `fitness_types` | text[] | Array of fitness categories (tags) |
| `gender_policy` | text | co-ed, women-only, men-only, separate-hours |
| `amenities` | jsonb | Facilities available (pool, sauna, parking, etc.) |
| `pricing_summary` | text | General pricing information (optional) |
| `class_schedule` | text | Class schedule details (optional) |
| `description` | text | AI-generated full description |
| `short_description` | text | Summary for listings |
| `hero_image` | text | Main display image URL |
| `opening_hours` | jsonb | Operating hours by day |
| `apify_output` | jsonb | Complete raw data from Apify (REQUIRED) |
| `firecrawl_output` | jsonb | Complete raw data from Firecrawl |
| `extraction_status` | text | pending/processing/completed/failed |
| `extraction_progress` | jsonb | Step-by-step progress tracking |

### Fitness Types (Categories)

The system supports 10 standard fitness types stored as TEXT[] for flexible categorization:

1. **gym** - General fitness gyms with weights and cardio
2. **yoga** - Yoga studios and classes
3. **pilates** - Pilates studios and reformer classes
4. **crossfit** - CrossFit boxes and functional training
5. **martial-arts** - Karate, jiu-jitsu, MMA, etc.
6. **boxing** - Boxing and kickboxing gyms
7. **dance** - Dance studios and fitness classes
8. **cycling** - Cycling studios and spin classes
9. **swimming** - Swimming pools and aquatic centers
10. **personal-training** - Personal training facilities

### Gender Policy Classifications

Critical for Goa market cultural considerations:

- **co-ed** - Mixed gender (default)
- **women-only** - Women-only facility
- **men-only** - Men-only facility
- **separate-hours** - Separate timings for men and women

### Amenities Structure (JSONB)

```json
{
  "pool": true,
  "sauna": true,
  "steam_room": false,
  "jacuzzi": true,
  "locker_rooms": true,
  "showers": true,
  "personal_training": true,
  "group_classes": true,
  "childcare": false,
  "cafe": true,
  "pro_shop": true,
  "free_parking": true,
  "paid_parking": false,
  "valet_parking": false,
  "wheelchair_accessible": true,
  "elevator": true
}
```

## Data Mapping Logic

**File:** `src/lib/services/fitness-data-mapper.ts`

### Smart Amenities Parsing

Extracts amenities from Apify's nested `additionalInfo` structure:

- **Amenities** - Pool, sauna, steam room, jacuzzi
- **Parking** - Free, paid, valet, street parking
- **Accessibility** - Wheelchair accessible, elevator
- **Offerings** - Personal training, group classes, childcare
- **Atmosphere** - Cafe, pro shop, lounge areas

### Gender Policy Detection

Analyzes name and description for keywords:
- Women: "women only", "ladies only", "female only", "for women"
- Men: "men only", "male only", "for men"
- Separate: "separate hours", "separate timings", "segregated"

### Fitness Type Categorization

Maps from multiple Apify fields:
- `categories` - Google Places categories
- `categoryName` - Primary category
- `placesTags` - User-generated tags

### Opening Hours Transformation

Converts from 12-hour format to 24-hour JSON:
```json
{
  "monday": {"open": "06:00", "close": "22:00"},
  "tuesday": {"open": "06:00", "close": "22:00"},
  ...
}
```

## API Endpoints

### Admin Management
- `GET /api/admin/fitness/list` - Fetch all fitness places with filters
- `GET /api/admin/fitness/search-places` - Google Places search
- `POST /api/admin/fitness/start-extraction` - Begin extraction pipeline
- `GET /api/admin/fitness/queue` - Monitor extraction queue
- `GET /api/admin/fitness/[id]/review` - Load fitness place for review
- `PUT /api/admin/fitness/[id]/review` - Update fitness place data
- `POST /api/admin/fitness/[id]/publish` - Publish fitness place

### Public Pages
- `GET /things-to-do/fitness` - Fitness directory listing
- `GET /things-to-do/fitness/[slug]` - Individual fitness place page

## Admin Pages

### List View (`/admin/fitness`)
- Table view with search and filters
- Shows: name, area, fitness types, gender policy, rating, status
- Color-coded gender policy badges:
  - Pink: Women Only
  - Blue: Men Only
  - Green: Co-Ed
  - Purple: Separate Hours

### Add Form (`/admin/fitness/add`)
- Google Places autocomplete search
- One-click extraction start
- Auto-redirects to queue monitor

### Queue Monitor (`/admin/fitness/queue`)
- Real-time extraction progress
- 7-step pipeline visualization
- Auto-refreshes every 5 seconds
- Shows overall progress percentage
- Links to review page when complete

### Review Page (`/admin/fitness/[id]/review`)
- 6 tabs: Basic Info, Fitness Details, Amenities, Contact, SEO, Raw Data
- Editable fields for all fitness place data
- Fitness types multi-select (checkbox grid)
- Gender policy dropdown
- Amenities checkbox grid (categorized)
- Optional pricing summary and class schedule
- Collapsible JSON viewers for raw Apify/Firecrawl data
- Save/Publish actions

## Key Features

### 1. Goa Market Optimization
- Gender policy classification for cultural considerations
- Arabic name support (future enhancement)
- Area-based filtering for Goa locations

### 2. Flexible Categorization
- Multiple fitness types per location (TEXT[] approach)
- No junction tables - simplified tag-based system
- Easy to add new fitness categories

### 3. Amenities Intelligence
- Auto-extracts from Apify additionalInfo
- JSONB storage for flexible querying
- Categorized display in admin UI

### 4. Content Generation Ready
- Stores complete Apify and Firecrawl JSON
- Enables AI-powered descriptions and SEO
- Preserves all source data for future enhancements

### 5. Visual Content Management
- Direct Google Places Photos API integration
- AI-generated alt text for accessibility
- Automatic hero image selection
- Supabase Storage for CDN delivery

## Development Workflow

1. **Add Fitness Place** (`/admin/fitness/add`)
   - Search Google Places
   - Start extraction

2. **Monitor Progress** (`/admin/fitness/queue`)
   - Watch 7-step pipeline
   - Wait for completion

3. **Review & Edit** (`/admin/fitness/[id]/review`)
   - Verify extracted data
   - Edit descriptions and details
   - Set fitness types and amenities
   - Configure gender policy

4. **Publish** (`/admin/fitness/[id]/review`)
   - Click "Publish" button
   - Makes visible on public site

## Testing

**Script:** `scripts/test-fitness-import.js`

Tests data mapping with real Apify data:
- Imports from CSV file
- Validates amenities parsing
- Checks gender policy detection
- Verifies fitness type categorization

## Maintenance Scripts

### Image Deduplication

**Script:** `scripts/dedupe-fitness-images.js`

Identifies and removes duplicate images from the fitness storage bucket while updating database references.

```bash
# Preview changes (dry run)
node scripts/dedupe-fitness-images.js --dry-run

# Execute deduplication
node scripts/dedupe-fitness-images.js --execute
```

**How it works:**
1. Lists all files in the `fitness` bucket
2. Groups files by size (identical size = duplicate)
3. Selects a "keeper" for each duplicate cluster
4. Updates `fitness_images` URLs to point to keepers
5. Updates `fitness_places.hero_image` references
6. Deletes duplicate files from storage
7. Saves a mapping JSON for rollback reference

### Broken Image Cleanup

**Script:** `scripts/cleanup-broken-fitness-images.js`

Removes database records pointing to non-existent storage files.

```bash
# Preview what will be deleted
node scripts/cleanup-broken-fitness-images.js --dry-run

# Delete broken records
node scripts/cleanup-broken-fitness-images.js --execute
```

**Features:**
- Paginates through ALL records (overcomes Supabase 1000 row limit)
- HEAD requests to verify each image URL
- Groups broken images by fitness place for reporting
- Updates `hero_image` references for affected places
- Sets `hero_image` to next available image or null

### Link Checker

**Script:** `scripts/check-all-links.js`

Comprehensive link checker for all image tables.

```bash
# Check all image URLs
node scripts/check-all-links.js

# Check only images (skip page links)
node scripts/check-all-links.js --images-only
```

**Tables checked:**
- `hotel_images`
- `mall_images`
- `attraction_images`
- `school_images`
- `fitness_images`

## Future Enhancements

- [ ] Membership pricing integration
- [ ] Class schedule API integration
- [ ] Trainer profiles and certifications
- [ ] Member reviews and ratings
- [ ] Workout program catalogs
- [ ] Real-time class availability
- [ ] Integration with fitness apps (MyFitnessPal, Strava, etc.)