# Cost Control Configuration

## Overview
This document outlines the cost control measures implemented to reduce API usage and expenses.

## Current Optimizations Applied

### 1. Anthropic Claude API (75% cost reduction)
- **Max Tokens**: Reduced from 4,096 to 1,024
- **Reviews**: Limited to 3 (was 10)
- **Menu Items**: Limited to 10 (was 20)
- **Website Content**: Limited to 1,000 chars (was 1,500)

### 2. Apify Actors (Disabled for cost control)
- **Google-Maps-Reviews-Scraper**: DISABLED
- **google-images-scraper**: DISABLED
- **Google Places Details**: Still active (essential)

### 3. Firecrawl API (Optimized)
- **General Search**: Active
- **Menu Search**: Active
- **Website Scraping**: Active

## Environment Variables for Cost Control

Add these to your `.env.local` file:

```env
# Anthropic Claude API Settings
ANTHROPIC_MAX_TOKENS=1024
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Apify Settings (DISABLED for cost control)
ENABLE_APIFY_REVIEWS=false
ENABLE_APIFY_IMAGES=false
APIFY_MAX_IMAGES=0

# Firecrawl Settings
ENABLE_FIRECRAWL_GENERAL=true
ENABLE_FIRECRAWL_MENU=true
ENABLE_FIRECRAWL_WEBSITE=true
FIRECRAWL_MAX_SEARCHES=2

# Data Limits for Token Control
MAX_REVIEWS_FOR_AI=3
MAX_MENU_ITEMS_FOR_AI=10
MAX_WEBSITE_CONTENT_LENGTH=1000

# Cost Control Flags
ENABLE_IMAGE_EXTRACTION=false
ENABLE_REVIEW_EXTRACTION=false
ENABLE_WEBSITE_SCRAPING=true
ENABLE_AI_ENHANCEMENT=true
```

## Cost Analysis

### Before Optimization
- **Anthropic**: ~$0.15-0.30 per restaurant
- **Apify**: ~$0.20-0.45 per restaurant
- **Firecrawl**: ~$0.05-0.13 per restaurant
- **Total**: ~$0.40-0.88 per restaurant

### After Optimization
- **Anthropic**: ~$0.05-0.10 per restaurant (75% reduction)
- **Apify**: ~$0.10-0.20 per restaurant (50% reduction)
- **Firecrawl**: ~$0.05-0.13 per restaurant (unchanged)
- **Total**: ~$0.20-0.43 per restaurant (50-60% reduction)

## Expected Savings

With these optimizations:
- **Cost per restaurant**: Reduced by 50-60%
- **$10 budget**: Can now process 23-50 restaurants (was 11-25)
- **Monthly savings**: ~$5-10 per month

## Re-enabling Features

To re-enable disabled features, update the extraction orchestrator:

```typescript
// In src/lib/services/extraction-orchestrator.ts
// Uncomment the sections marked as "DISABLED for cost control"
```

## Monitoring Usage

Check your API usage in:
- **Anthropic**: https://console.anthropic.com/
- **Apify**: https://console.apify.com/
- **Firecrawl**: https://firecrawl.dev/dashboard

## Further Optimizations

1. **Batch Processing**: Process multiple restaurants in one AI call
2. **Smart Caching**: Reuse data for similar restaurants
3. **Conditional Processing**: Skip steps if data already exists
4. **User Controls**: Let users choose extraction level





