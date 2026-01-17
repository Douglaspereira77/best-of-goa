# Restaurant Extraction Pipeline

**File:** `src/lib/services/extraction-orchestrator.ts`

## 12-Step Process

### 1. Apify Fetch (Google Places Details)
- Stores raw JSON in `apify_output`
- Maps area to `neighborhood_id` using comprehensive mapping (141 neighborhoods)
- Updates normalized fields
- Auto slug regeneration if location suffix needed

### 2. Firecrawl General (Search restaurant info)
- Stores results in `firecrawl_output`
- Extracts contact info

### 3. Optimized Menu Extraction
- **Strategy 1:** Extract menu from restaurant's website first
- **Strategy 2:** If no menu, smart search with delivery app filtering
- Stores in `firecrawl_menu_output`

### 4. Website Scraping
- Extracts operational data from restaurant website
- Merges with existing data

### 5. Multi-Stage Social Media Search
- Stage 1: Website/Google Maps extraction
- Stage 2: Instagram bio scraping
- Stage 3: Firecrawl Search (platform-specific queries)
- Stage 4: Web search fallback
- Updates: instagram, facebook, tiktok, twitter, youtube, linkedin, snapchat

### 6. Apify Reviews
- Google reviews (50 most recent)
- Appends to `apify_output.reviews`

### 7. Firecrawl TripAdvisor Search
- Rating, reviews, features

### 8. AI Sentiment Analysis (OpenAI GPT-4o mini)
- Analyzes actual customer reviews (top 10)
- Generates 200-300 character sentiment summary
- Stores in `review_sentiment` field
- **PRESERVED:** Not overwritten by subsequent steps

### 9. GPT-4o AI Enhancement
- Generates description, short_description, meta tags
- Suggests cuisines, categories, features
- Extracts location details (mall, floor, gate)
- Identifies signature dishes
- **NOTE:** `review_sentiment` NOT included (Step 8 handles it)

### 10. SEO Metadata Generation (OpenAI GPT-4o)
- Generates meta_title (50-60 chars)
- Generates meta_description (150-160 chars)
- Generates og_description (120 chars)
- Stores in `seo_metadata` field

### 11. Image Extraction & Processing
- Google Places + Damilo images
- Hero image selection (highest resolution)
- Uploads to Supabase Storage

### 12. Database Population
- `restaurants_dishes` (signature & popular items)
- Tag matching for cuisines, categories, features

## Social Media Search Service

**File:** `src/lib/services/social-media-search.ts`

### Supported Platforms (7)
Instagram, Facebook, TikTok, Twitter/X, YouTube, LinkedIn, Snapchat

### Discovery Stages
1. Website extraction (Firecrawl Extract endpoint)
2. Firecrawl Search (platform-specific optimized queries)
3. Google Maps/TripAdvisor parsing
4. Web search fallback

### Output Structure
```json
{
  "handle": "@username",
  "url": "https://platform.com/...",
  "found": true,
  "source": "website|firecrawl_search|google_maps|web_search",
  "confidence": 85
}
```

### Storage
- Stored in: `firecrawl_output.social_media_search`
- Auto-updates restaurant table fields

### Known Limitation
Stage 2 (Firecrawl Search) returns zero results for social media queries - this is expected. System falls back to Stage 3/4 which work reliably.

## Testing Commands

```bash
# Quick test for specific restaurant
node bin/test-khaneen-extraction.js

# Diagnose Firecrawl Search API
node bin/diagnose-firecrawl-search.js
```

## Full Extraction Test

1. Run `npm run dev`
2. Go to `/admin/add`
3. Enter restaurant details
4. Monitor console for `[SocialMediaSearch]` logs
5. Check database: `SELECT instagram, facebook, firecrawl_output FROM restaurants WHERE id = ?`

## Debugging

1. Check `extraction-orchestrator.ts` logs
2. Look at `firecrawl_output` and `apify_output` JSON columns
3. Verify API credentials in `.env.local`
4. Test specific services in `/bin/` scripts
