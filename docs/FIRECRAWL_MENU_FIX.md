# Firecrawl Menu Extraction Fix

## Problem Solved

The previous implementation was only returning search result metadata (URLs, titles, descriptions) instead of actual menu content with items and prices.

## Solution Implemented

### Two-Step Approach
1. **Search** - Use Firecrawl `/search` endpoint to find menu-related URLs
2. **Scrape** - Use Firecrawl `/scrape` endpoint to extract actual content from those URLs

### Changes Made

#### 1. Updated `src/lib/services/firecrawl-client.ts`
- Added support for Firecrawl v2 API (`/v2/scrape`)
- Created `scrapeV2()` method for content extraction
- Modified `searchRestaurantMenu()` to implement two-step process:
  - Search for menu URLs
  - Scrape top 2-3 URLs for actual content
- Added `FirecrawlScrapedContent` interface for structured data

#### 2. Updated `src/lib/services/extraction-orchestrator.ts`
- Modified `extractMenuData()` to prioritize `scraped_content` over search results
- Added better logging for debugging
- Enhanced content processing with fallback logic

### New Response Structure

**Before:**
```json
{
  "query": "KEI Downtown menu",
  "results": [
    {
      "url": "https://oddmenu.com/p/kei",
      "title": "KEI Menu",
      "description": "..."
    }
  ]
}
```

**After:**
```json
{
  "query": "KEI Downtown menu", 
  "results": [...],
  "scraped_content": [
    {
      "url": "https://oddmenu.com/p/kei",
      "markdown": "# KEI DOWNTOWN\n\n## APPETIZERS\n- Edamame - $3.500\n...",
      "html": "<h1>KEI DOWNTOWN</h1>...",
      "success": true,
      "metadata": {...}
    }
  ]
}
```

### Expected Results

Now when you run menu extraction, you should get:
- ✅ Actual menu content with items and prices
- ✅ Full markdown/HTML content from menu pages
- ✅ Structured menu data extraction
- ✅ Better error handling and logging

### Testing

Run the test script to verify:
```bash
node test-firecrawl-menu.js
```

This will test the KEI restaurant example and show you the extracted menu content.

## API Usage

The implementation now uses:
- **v1 API** for search: `https://api.firecrawl.dev/v1/search`
- **v2 API** for scraping: `https://api.firecrawl.dev/v2/scrape`

Both endpoints are documented at https://docs.firecrawl.dev/





