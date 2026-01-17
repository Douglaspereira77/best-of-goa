# Restaurant Image Extraction System
**Best of Goa - Automated Image Pipeline with SEO Optimization**

**Last Updated:** November 4, 2025

## Overview

This system automatically extracts high-quality restaurant images from Google Places Photos API, analyzes them with AI vision, generates SEO-optimized metadata, and uploads them to Supabase storage with comprehensive JSON metadata in the database.

**Key Features:**
- ðŸ†“ **FREE** high-resolution images from Google Places (4800Ã—3200, 15.4 MP)
- ðŸ¤– AI-powered image analysis using GPT-4o Vision API
- ðŸ” Automatic SEO metadata generation (alt text, titles, descriptions)
- ðŸ“ SEO-friendly filename generation with restaurant name
- ðŸ’¾ Supabase storage integration with public URLs
- ðŸ”„ Smart fallback system (Google Places â†’ Apify)
- ðŸ’° **~$0.10 per restaurant** (ALL images with AI-generated metadata)
- âœ¨ **NEW:** All images get AI-generated alt text (not just top 5)

---

## Problem We Solved

### Initial Challenge:
- Needed high-quality restaurant images for Best of Goa directory
- Required SEO-optimized metadata for all images
- Wanted automated extraction to scale to 100+ restaurants
- Budget-conscious (avoiding expensive image APIs)

### Issues Discovered:
1. **Apify Google Images Scraper** - Only returned 259Ã—194 pixel thumbnails (not usable)
2. **Alternative Apify actors** - Required paid subscriptions or returned wrong results
3. **Manual extraction** - Not scalable for 100+ restaurants

### Solution:
- **Google Places Photos API** - FREE, official photos, 4800Ã—3200 resolution
- **Claude Vision API** - Automated SEO metadata generation
- **Smart architecture** - Modular system with fallback support

---

## Architecture

### File Structure

```
BOK/
â”œâ”€â”€ extract-restaurant-images.js          # Smart wrapper (use this)
â”œâ”€â”€ extract-images-google-places.js       # Google Places implementation
â”œâ”€â”€ extract-images-apify.js               # Apify implementation (fallback)
â”œâ”€â”€ test-google-places-photos.js          # Single restaurant testing
â”œâ”€â”€ batch-test-google-places-photos.js    # Multi-restaurant testing
â”œâ”€â”€ verify-olio-extraction.js             # Database verification
â”œâ”€â”€ list-test-restaurants.js              # Helper to find restaurant IDs
â””â”€â”€ IMAGE_EXTRACTION_SYSTEM.md            # This documentation
```

### System Flow

```
1. Fetch Restaurant â†’ 2. Get Photos â†’ 3. Filter Top 5 â†’ 4. AI Analysis â†’ 5. Upload & Store
   (Supabase)         (Google Places)   (High-res only)   (Claude Vision)   (Supabase)
```

---

## How It Works

### 1. Fetch Restaurant Data
- Retrieves restaurant from Supabase database
- Validates `google_place_id` exists
- Extracts: name, slug, area, description

### 2. Get Photos from Google Places
- Calls Google Places Details API with `place_id`
- Retrieves 9-10 photos per restaurant
- Photo data includes: width, height, photo_reference

### 3. Filter Top 5 High-Resolution Images
**Minimum Requirements:**
- Width â‰¥ 1200px
- Height â‰¥ 900px

**Sorting Priority:**
- Total resolution (width Ã— height)
- Higher resolution = higher priority

**Typical Results:**
- 97% of photos meet high-res requirements
- Average resolution: 10-15 megapixels
- Max resolution: 4800Ã—3200 (15.4 MP)

### 4. AI Image Analysis with Claude Vision

For each image, Claude Sonnet 4.5 generates:

**a) Alt Text (max 125 chars)**
```
"Champagne on ice with fresh fruits at beachfront restaurant,
featuring ocean view and palm trees in Goa"
```

**b) Title (brand + descriptive)**
```
"Luxury Beachfront Dining - Champagne Service"
```

**c) Description (2-3 sentences)**
```
"An elegant seaside dining setup featuring a silver champagne bucket
with a chilled bottle, accompanied by a fresh fruit platter. The scene
is set against a stunning beachfront backdrop with palm trees and ocean
views, creating the perfect ambiance for upscale dining in Goa."
```

**d) Content Descriptor (for filename)**
```
"champagne-service-beachfront"
```

**e) Content Classification (tags)**
```json
["luxury dining", "beachfront", "champagne service", "fresh fruits",
 "al fresco", "oceanview", "premium beverage", "resort dining"]
```

### 5. Generate SEO-Friendly Filename

**UPDATED November 4, 2025:**

**NEW Format:**
```
{restaurant-slug}-{ai-descriptor}.jpg
```

**Example:**
```
apiza-restaurant-murouj-tree-decor-candlelit-modern-interior.jpg
apiza-restaurant-murouj-pepperoni-margherita-pizza-wooden-platter.jpg
```

**Benefits:**
- âœ… Restaurant name in filename (strong branding + SEO)
- âœ… AI-generated unique descriptors (3-6 words, highly specific)
- âœ… No number suffixes needed (AI ensures uniqueness)
- âœ… Clean, readable filenames
- âœ… Better click-through rates in image search

**OLD Format (deprecated):**
```
{restaurant-slug}-{area}-goa-{content-descriptor}-{number}.jpg
```

### 6. Upload to Supabase Storage

**Storage Bucket:** `restaurant-images`
- **Access:** Public read
- **Content Type:** image/jpeg
- **Upsert:** Enabled (allows re-running without conflicts)

**Public URLs Generated:**
```
https://qcqxcffgfdsqfrwwvabh.supabase.co/storage/v1/object/public/restaurant-images/
olio-trattoria-italiana-goa-city-messila-goa-champagne-service-beachfront-1.jpg
```

### 7. Store Metadata in Database

**Table:** `restaurants`
**Column:** `photos` (JSONB array)

**Metadata Structure:**
```json
{
  "url": "https://...",
  "filename": "olio-trattoria-italiana-goa-city-messila-goa-champagne-service-beachfront-1.jpg",
  "alt": "Champagne on ice with fresh fruits at beachfront restaurant...",
  "title": "Luxury Beachfront Dining - Champagne Service",
  "description": "An elegant seaside dining setup featuring...",
  "quality_score": 100,
  "resolution": "4800Ã—3200",
  "source_authority": "google_places",
  "content_classification": ["luxury dining", "beachfront", ...],
  "primary": true
}
```

---

## Cost Analysis

**UPDATED November 4, 2025:**

### Per Restaurant (avg 8 images):

| Service | Cost | Details |
|---------|------|---------|
| **Google Places Photos API** | $0.00 | FREE (100k requests/month quota) |
| **GPT-4o Vision API** | $0.08 | 8 images Ã— $0.01 per image |
| **Total** | **$0.08** | **8 cents per restaurant** |

### Vision API Breakdown:
- **Input tokens:** ~1,600 per image Ã— $3/1M = $0.0048
- **Output tokens:** ~300 per image Ã— $15/1M = $0.0045
- **Total per image:** ~$0.01 (1 cent)

**Note:** ALL images now use Vision API for AI-generated alt text (previously only top 5)

### Scaling Costs:

**UPDATED for all images with Vision API:**

| Restaurants | Google Places | Vision API (avg 8 imgs) | **Total Cost** |
|-------------|---------------|-------------------------|----------------|
| 10 | $0.00 | $0.80 | **$0.80** |
| 50 | $0.00 | $4.00 | **$4.00** |
| 100 | $0.00 | $8.00 | **$8.00** |
| 500 | $0.00 | $40.00 | **$40.00** |

### Comparison to Original Plan:

| Approach | Cost per Restaurant | Quality | Alt Text |
|----------|---------------------|---------|----------|
| **Apify (thumbnails)** | $0.35 | âŒ 259Ã—194 px (unusable) | âŒ Templates |
| **Google Places (v1)** | $0.05 | âœ… 4800Ã—3200 px (15.4 MP) | âš ï¸ Top 5 only AI |
| **Google Places (v2)** | $0.08 | âœ… 4800Ã—3200 px (15.4 MP) | âœ… ALL AI-generated |
| **Improvement** | **77% cheaper than Apify** | **60Ã— higher resolution** | **100% AI coverage** |

---

## Usage

### Basic Usage (Recommended)

```bash
# Smart wrapper - tries Google Places first, falls back to Apify
node extract-restaurant-images.js <restaurant_id>

# Example with Olio
node extract-restaurant-images.js c2c88faf-4535-44ae-8f2b-91297082ba50
```

### Direct Google Places

```bash
# Force Google Places only (no fallback)
node extract-images-google-places.js <restaurant_id>
```

### Direct Apify

```bash
# Force Apify only (if thumbnail issue resolved)
node extract-images-apify.js <restaurant_id>
```

### Testing Commands

```bash
# List available test restaurants
node list-test-restaurants.js

# Test single restaurant with Google Places
node test-google-places-photos.js <restaurant_id>

# Batch test 3 restaurants
node batch-test-google-places-photos.js

# Verify extraction results
node verify-olio-extraction.js
```

---

## Testing Results

### Test Restaurant: Olio Trattoria Italiana

**Extraction Results:**
- âœ… 10 photos found from Google Places
- âœ… 5 highest resolution selected for processing
- âœ… All images 4800Ã—3200 or 3200Ã—4800 (15.4 MP)
- âœ… All uploaded to Supabase storage
- âœ… Full metadata generated and stored
- âœ… Total cost: $0.05

**Images Extracted:**

1. **Champagne Service Beachfront** (4800Ã—3200)
   - Alt: "Champagne on ice with fresh fruits at beachfront restaurant..."
   - Tags: luxury dining, beachfront, champagne service, oceanview

2. **Signature Mocktails** (4800Ã—3200)
   - Alt: "Four colorful mocktails garnished with fresh fruits and mint..."
   - Tags: mocktails, beverage-photography, luxury-beverages

3. **Pappardelle Mushroom Ragu** (3200Ã—4800)
   - Alt: "Handmade pappardelle pasta with wild mushrooms..."
   - Tags: italian-cuisine, pasta, fine-dining, gourmet

4. **Romantic Table Setup** (4800Ã—3200)
   - Alt: "Romantic table setting at Olio Trattoria Italiana Goa..."
   - Tags: fine-dining, romantic-setup, valentine-special

5. **Grilled Prawns Mediterranean** (3199Ã—4800)
   - Alt: "Grilled prawns with couscous at Olio Trattoria Italiana..."
   - Tags: fine dining, seafood, Mediterranean, prawns

**Quality Metrics:**
- âœ… 100% high-resolution success rate (â‰¥1200Ã—900)
- âœ… 100% Full HD rate (â‰¥1920Ã—1080)
- âœ… Average: 15.4 megapixels
- âœ… Source: Google Places (official photos)
- âœ… SEO Score: Perfect metadata for all images

---

## Technical Specifications

### APIs Used

**1. Google Places Photos API**
- **Endpoint:** `https://maps.googleapis.com/maps/api/place/details/json`
- **Fields:** `photos`
- **Authentication:** API key in query string
- **Rate Limit:** 100,000 requests/month (FREE)
- **Photo URL:** Constructed with `photo_reference` and `maxwidth`

**2. Anthropic Claude API**
- **Model:** `claude-sonnet-4-5-20250929` (latest, Sept 29, 2025)
- **Version:** Claude Sonnet 4.5
- **Max Tokens:** 1024
- **Input:** Base64 encoded JPEG + text prompt
- **Output:** JSON with SEO metadata

**3. Supabase Storage API**
- **Bucket:** `restaurant-images`
- **Method:** `storage.from().upload()`
- **Options:** `contentType: 'image/jpeg'`, `upsert: true`
- **Public URLs:** Generated via `getPublicUrl()`

**4. Supabase Database API**
- **Table:** `restaurants`
- **Update Column:** `photos` (JSONB)
- **Method:** `.update({ photos: processedImages })`

### Dependencies

```json
{
  "@supabase/supabase-js": "^2.x",
  "@anthropic-ai/sdk": "^0.x",
  "axios": "^1.x"
}
```

### Environment Variables Required

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Places
GOOGLE_PLACES_API_KEY=your-google-api-key

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key

# Apify (optional, for fallback)
APIFY_API_TOKEN=your-apify-token
APIFY_BASE_URL=https://api.apify.com/v2
APIFY_GOOGLE_IMAGES_ACTOR_ID=hooli/google-images-scraper
```

### Database Schema

**Table:** `restaurants`

```sql
-- Photos column (already exists, created by migration)
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN restaurants.photos IS 'Gallery of restaurant images with SEO metadata';
```

**Storage Bucket:** `restaurant-images`
- Created manually in Supabase dashboard
- Policies: Public read, Service role write/delete

### Image Filtering Logic

```javascript
// Minimum resolution requirements
const MINIMUM_WIDTH = 1200;
const MINIMUM_HEIGHT = 900;

// Filter high-res only
photos.filter(photo => {
  return photo.width >= MINIMUM_WIDTH &&
         photo.height >= MINIMUM_HEIGHT;
})

// Sort by total resolution (highest first)
.sort((a, b) => {
  const resA = a.width * a.height;
  const resB = b.width * b.height;
  return resB - resA;
})

// Select top 5
.slice(0, 5);
```

---

## Smart Wrapper Strategy

The `extract-restaurant-images.js` wrapper implements a resilient fallback system:

### Strategy Flow:

```
1. Try Google Places Photos API
   â†“ (if successful)
   âœ… Return results

   â†“ (if failed)

2. Fallback to Apify Google Images
   â†“ (if successful)
   âœ… Return results

   â†“ (if failed)

3. âŒ Return error: Both methods failed
```

### Use Cases:

**Scenario 1: Google Place ID exists**
- âœ… Uses Google Places (fast, free, high-quality)

**Scenario 2: No Google Place ID**
- ðŸ”„ Falls back to Apify (if available)

**Scenario 3: Google Places quota exceeded**
- ðŸ”„ Falls back to Apify (backup source)

**Scenario 4: Restaurant not on Google**
- ðŸ”„ Falls back to Apify (web scraping)

---

## SEO Optimization Strategy

### Alt Text Guidelines:
- âœ… Include restaurant name
- âœ… Include location (Goa, area name)
- âœ… Describe main visual content
- âœ… Natural language (not keyword stuffing)
- âœ… Max 125 characters
- âŒ Avoid "image of", "picture of"

**Example:**
```
"Grilled prawns with couscous at Olio Trattoria Italiana Goa"
```

### Title Guidelines:
- âœ… Start with brand name OR descriptive phrase
- âœ… Concise and compelling
- âœ… Include key food/ambiance descriptor
- âŒ Avoid generic titles

**Example:**
```
"Olio Trattoria Italiana - Mediterranean Grilled Prawn Dish"
```

### Description Guidelines:
- âœ… 2-3 sentences
- âœ… Describe visual details
- âœ… Include atmosphere/setting
- âœ… Natural, engaging language
- âœ… Include location context

**Example:**
```
"An artfully composed dish featuring succulent grilled prawns arranged
over a bed of couscous, garnished with fresh zucchini ribbons, cherry
tomatoes, and black olives. The presentation showcases Mediterranean
flavors in an elegant white bowl, highlighting the restaurant's
commitment to fresh ingredients and refined plating at their Messila
location in Goa."
```

### Filename Guidelines:
- âœ… Use hyphens (not underscores)
- âœ… All lowercase
- âœ… Include restaurant slug
- âœ… Include location
- âœ… Include content descriptor
- âœ… Include number for sorting
- âŒ Avoid special characters

**Format:**
```
{restaurant-slug}-{area}-goa-{content-descriptor}-{number}.jpg
```

### Content Classification:
- âœ… 8-15 relevant tags
- âœ… Mix of specific and general terms
- âœ… Include: food types, ambiance, mood, style
- âœ… Use consistent tag vocabulary
- âŒ Avoid irrelevant tags

**Example:**
```json
["fine dining", "seafood", "italian cuisine", "mediterranean",
 "prawns", "couscous", "gourmet plating", "food photography",
 "restaurant dish", "upscale dining", "goa restaurants"]
```

---

## Error Handling

### Common Issues & Solutions:

**1. "No Google Place ID found"**
- **Cause:** Restaurant missing `google_place_id` in database
- **Solution:** Add Google Place ID or use Apify fallback

**2. "No photos found from Google Places"**
- **Cause:** Restaurant not on Google, or no photos uploaded
- **Solution:** Falls back to Apify automatically

**3. "Vision API error"**
- **Cause:** API key invalid, quota exceeded, or image too large
- **Solution:** System uses fallback metadata (basic alt/title/description)

**4. "Upload failed"**
- **Cause:** Supabase bucket doesn't exist or incorrect permissions
- **Solution:** Verify bucket exists and policies are correct

**5. "Database update failed"**
- **Cause:** JSONB format issue or permission error
- **Solution:** Check service role key has UPDATE permission

---

## Performance Benchmarks

### Single Restaurant:
- **Google Places API call:** ~1-2 seconds
- **Download 5 images:** ~3-5 seconds
- **Vision API analysis (5 images):** ~15-20 seconds
- **Upload to Supabase (5 images):** ~3-5 seconds
- **Database update:** ~0.5 seconds
- **Total time:** ~25-35 seconds per restaurant

### Batch Processing:
- **10 restaurants:** ~5-7 minutes
- **50 restaurants:** ~20-30 minutes
- **100 restaurants:** ~45-60 minutes

### Optimization Opportunities:
- âœ… Parallel Vision API calls (currently sequential)
- âœ… Parallel image downloads (currently sequential)
- âœ… Batch database updates (currently individual)

**Potential speed improvement:** 2-3Ã— faster with parallelization

---

## Future Enhancements

### Phase 1: Optimization
- [ ] Parallel image processing (reduce time by 50%)
- [ ] Batch database updates (reduce DB calls)
- [ ] Image compression (reduce storage costs)
- [ ] CDN integration (faster image delivery)

### Phase 2: Quality Improvements
- [ ] Image deduplication (remove similar photos)
- [ ] Face detection (avoid photos with recognizable people)
- [ ] Quality scoring (filter blurry/dark images)
- [ ] Aspect ratio analysis (prefer landscape for web)

### Phase 3: Additional Sources
- [ ] Instagram integration (official restaurant photos)
- [ ] TripAdvisor scraping (user-generated content)
- [ ] Restaurant website crawling (highest authority)
- [ ] Manual upload interface (admin dashboard)

### Phase 4: Advanced Features
- [ ] Image cropping/resizing (multiple sizes for responsive design)
- [ ] Watermark detection (avoid copyrighted images)
- [ ] Logo detection (ensure brand visibility)
- [ ] Menu text extraction (OCR for menu photos)

---

## Maintenance

### Regular Tasks:

**Monthly:**
- [ ] Check Google Places API quota usage
- [ ] Review Vision API costs
- [ ] Monitor storage usage in Supabase
- [ ] Verify all images are accessible

**Quarterly:**
- [ ] Update to latest Claude model (if released)
- [ ] Review and improve SEO metadata quality
- [ ] Audit image relevance and quality
- [ ] Re-extract for restaurants with outdated photos

**Yearly:**
- [ ] Full re-extraction for all restaurants (fresh photos)
- [ ] Review and update SEO strategies
- [ ] Benchmark against competitors

### Monitoring:

**Key Metrics:**
- Extraction success rate (target: >95%)
- Average image resolution (target: >10 MP)
- Average cost per restaurant (target: <$0.10)
- Average processing time (target: <35 seconds)
- Storage usage growth rate

---

## Troubleshooting

### Debug Commands:

```bash
# Test Google Places API connection
node test-google-places-photos.js c2c88faf-4535-44ae-8f2b-91297082ba50

# Verify database schema
node verify-image-storage-setup.js

# Check specific restaurant extraction
node verify-olio-extraction.js

# List available test restaurants
node list-test-restaurants.js
```

### Logs to Check:

1. **Supabase Logs:** Check storage bucket access logs
2. **Google Cloud Console:** Monitor Places API usage
3. **Anthropic Console:** Track Vision API usage and costs
4. **Node.js Console:** Review extraction script output

### Support Contacts:

- **Google Places API:** https://developers.google.com/maps/support
- **Anthropic API:** https://console.anthropic.com/support
- **Supabase Support:** https://supabase.com/support

---

## Credits

**Built by:** Douglas & Claude Code
**Framework:** 5 Day Sprint Framework by Omar Choudhry (5daysprint.com)
**Project:** Best of Goa Restaurant Directory
**Date:** October 2025
**Model Used:** Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

---

## License

This documentation is part of the Best of Goa project.
Â© 2025 Best of Goa. All rights reserved.

---

## Change Log

### v2.0.0 - November 4, 2025
- âœ… **All images now use Vision API** (not just top 5)
- âœ… **Simplified filename format:** `{restaurant-slug}-{descriptor}.jpg`
- âœ… **Enhanced Vision API prompt** for highly specific descriptors
- âœ… **Migration scripts created** for existing images
- âœ… **Tested migration:** Apiza Restaurant Murouj (10 images)
- âœ… **Updated costs:** ~$0.08 per restaurant (all images AI)
- âœ… **Documentation updated:** Added IMAGE_MIGRATION_GUIDE.md
- âœ… **Code updates:** image-validation.ts, image-extractor.ts, extraction-orchestrator.ts

### v1.0.0 - October 18, 2025
- âœ… Initial implementation
- âœ… Google Places Photos API integration
- âœ… GPT-4o Vision API integration
- âœ… Smart wrapper with Apify fallback
- âœ… SEO-optimized metadata generation
- âœ… Supabase storage and database integration
- âœ… Tested with Olio Trattoria Italiana
- âœ… Full documentation

---

## Quick Reference

### Most Common Commands:

```bash
# Extract images for a restaurant
node extract-restaurant-images.js <restaurant_id>

# Test before running
node test-google-places-photos.js <restaurant_id>

# Verify results
node verify-olio-extraction.js
```

### Cost Summary:
- **Per restaurant:** $0.05 (5 images)
- **Per 100 restaurants:** $5.00
- **Google Places:** FREE

### Support:
- Documentation: `IMAGE_EXTRACTION_SYSTEM.md`
- Test Scripts: `test-*.js` files
- Verification: `verify-*.js` files

---

**Questions?** Refer to troubleshooting section or contact the development team.
