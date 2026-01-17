# Anthropic Data Processing Documentation

## Overview

This document provides a comprehensive breakdown of all data processed by Anthropic Claude in the Best of Goa restaurant extraction pipeline. The system uses Anthropic for three main purposes: content generation, data mapping, and image analysis.

## Enhanced Neighborhood Mapping System

### Overview

The extraction pipeline now includes an enhanced neighborhood mapping system that treats major shopping destinations as dedicated neighborhoods. This system uses priority-based address keyword detection to ensure accurate location mapping.

### Mapping Logic

#### 1. Address Keyword Detection (Priority 1)
- **Mall Names**: "The Avenues", "Marina Mall", "Al Kout Mall"
- **Landmarks**: "Liberation Tower", "Scientific Center", "Sahara Golf Resort"
- **Specific Locations**: "Murouj", "Souk Al-Mubarakiya"

#### 2. Area Field Mapping (Priority 2)
- **General Areas**: "Goa City", "Salmiya", "Hawally"
- **Governorates**: "Jahra", "Ahmadi", "Farwaniya"

### Data Sent to Anthropic

**Enhanced Location Data:**
- **Address:** `${input.address || 'N/A'}` (used for keyword detection)
- **Area:** `${input.area || 'N/A'}` (fallback mapping)
- **Neighborhood ID:** Automatically mapped based on address keywords
- **Neighborhood Name:** Resolved from neighborhood_id

**Examples:**
```
Address: "The Avenues Mall, Phase II, 13052 5th Ring Road"
â†’ Neighborhood: "The Avenues" (ID: 142)

Address: "Murouj Food Complex, Sahara Club - Chalets Rd"
â†’ Neighborhood: "Murouj" (ID: 8)

Address: "Souq Al-Mubarakiya, Goa City"
â†’ Neighborhood: "Souk Al-Mubarakiya" (ID: 161)
```

### Neighborhood Statistics

- **Total Neighborhoods**: 140
- **Traditional Areas**: 116
- **Major Shopping Destinations**: 24
- **Population Rate**: 100% (all restaurants have neighborhood_id)

### SEO Benefits

Each neighborhood gets its own SEO-optimized URL:
- `/areas/the-avenues/restaurants`
- `/areas/marina-mall/restaurants`
- `/areas/murouj/restaurants`
- `/areas/souk-al-mubarakiya/restaurants`

---

## Two Main Anthropic Processing Flows

### 1. Content Generation (Step 7) - `anthropic-client.ts`

**Purpose:** Generate SEO content, descriptions, FAQs, and menu items

**Data Input Structure (`RestaurantAIInput`):**
```typescript
{
  name: string;                    // Restaurant name
  address?: string;                // Full address
  area?: string;                   // Area/neighborhood
  place_data?: any;                // Google Places data
  reviews?: any[];                 // Customer reviews (limited to 3)
  menu_items?: any[];              // Menu items (limited to 10)
  website_content?: string;        // Website content (limited to 1000 chars)
  tripadvisor_data?: any;          // TripAdvisor data
  apify_data?: any;                // Full Apify extraction data
  firecrawl_data?: any;            // Firecrawl website data
  firecrawl_menu_data?: any;       // Firecrawl menu extraction
  menu_data?: any;                 // Structured menu data
}
```

**Specific Data Sent to Anthropic:**
- **Restaurant Name:** `${input.name}`
- **Address:** `${input.address || 'N/A'}`
- **Area:** `${input.area || 'N/A'}`
- **Google Rating:** `${input.place_data?.google_rating || 'N/A'}`
- **Price Level:** `${input.place_data?.price_level ? '$'.repeat(input.place_data.price_level) : 'N/A'}`
- **Customer Reviews:** First 3 reviews (text only)
- **Menu Items:** First 10 menu items with descriptions
- **Popular Dishes:** From Google Places data
- **Menu Data:** Structured menu items from Firecrawl
- **Raw Menu Content:** First 500 characters of Firecrawl menu markdown
- **Website Content:** First 1000 characters of website content
- **TripAdvisor Data:** Full JSON of TripAdvisor data

**Token Optimization Applied:**
- Reviews: Limited to 3 (was 10) â†’ saves ~5,200 tokens
- Menu items: Limited to 10 (was 20)
- Website content: Limited to 1,000 chars (was 1,500)
- **Cost per extraction:** ~$0.023 (63% reduction from $0.063)

**AI Output Generated:**
```typescript
{
  description: string;              // 500-800 chars SEO description
  short_description: string;        // 100-150 chars for cards
  meta_title: string;               // 50-60 chars SEO title
  meta_description: string;         // 150-160 chars meta tag
  review_sentiment: string;         // 200-300 chars sentiment summary
  faqs: Array<{question, answer}>;  // 5 common questions
  cuisine_suggestions: string[];    // Primary/secondary cuisines
  feature_suggestions: string[];    // WiFi, Parking, etc.
  popular_dishes: string[];         // Top 3 mentioned dishes
  dishes: Array<{                   // 8-12 generated dishes
    name: string;
    description: string;
    price: string;                  // KWD format
    category: string;               // main, appetizer, dessert, etc.
  }>
}
```

### 2. Data Mapping (Step 8) - `data-mapper.ts`

**Purpose:** Map restaurant data to database relationships (cuisines, categories, features, etc.)

**Data Input Structure:**
```typescript
// Reference Data (from database)
{
  cuisines: Array<{id: number; name: string; slug: string}>;
  categories: Array<{id: number; name: string; slug: string}>;
  features: Array<{id: number; name: string; slug: string}>;
  meals: Array<{id: number; name: string; slug: string}>;
  good_for: Array<{id: number; name: string; slug: string}>;
  neighborhoods: Array<{id: number; name: string; slug: string}>;
  michelin_awards: Array<{id: number; name: string; slug: string}>;
}

// Restaurant Data
{
  name: string;
  address: string;
  area: string;
  description: string;
  keywords: any;                    // Extracted features from Google
  apify_output: any;               // Full Apify data
  firecrawl_output: any;           // Full Firecrawl data
}
```

**Specific Data Sent to Anthropic:**
- **Reference Data:** Complete JSON of all cuisines, categories, features, meals, good_for, neighborhoods, and awards
- **Restaurant Name:** `${restaurant.name}`
- **Address:** `${restaurant.address || 'N/A'}`
- **Area:** `${restaurant.area || 'N/A'}`
- **Description:** `${restaurant.description || 'N/A'}`
- **Extracted Features:** `${restaurant.keywords ? JSON.stringify(restaurant.keywords) : 'N/A'}`
- **Apify Data:** `${JSON.stringify(restaurant.apify_output || {})}`
- **Firecrawl Data:** `${JSON.stringify(restaurant.firecrawl_output || {})}`

**AI Output Generated:**
```typescript
{
  cuisine_ids: string[];           // UUID strings for cuisines
  category_ids: string[];          // UUID strings for categories
  feature_ids: string[];           // UUID strings for features
  meal_ids: string[];              // UUID strings for meals
  good_for_ids: string[];          // UUID strings for good_for
  neighborhood_match: string;      // Neighborhood name
  michelin_award_match: string;    // Award name or null
  awards: Array<{                  // Extracted awards
    name: string;
    year: number;
    organization: string;
  }>;
  new_entries: {                   // New entries to create
    cuisines: string[];
    features: string[];
    categories: string[];
  }
}
```

### 3. Image Analysis (Optional) - `extract-images-*.js`

**Purpose:** Analyze restaurant images for SEO metadata

**Data Input:**
- **Image Buffer:** Base64 encoded image data
- **Restaurant Info:** Name, area, location

**AI Output Generated:**
```typescript
{
  alt: string;                     // Alt text (max 125 chars)
  title: string;                   // Image title
  description: string;             // 2-3 sentence description
  contentDescriptor: string;       // 1-3 words for filename
  contentClassification: string[]; // Content tags
}
```

## Key Processing Details

### Token Limits & Costs
- **Content Generation:** 4,096 max tokens, ~$0.023 per extraction
- **Data Mapping:** 1,024 max tokens
- **Image Analysis:** 1,024 max tokens per image

### Data Sources
1. **Google Places API** â†’ place_data, reviews, popular_dishes
2. **Apify Actors** â†’ apify_data (comprehensive restaurant data)
3. **Firecrawl API** â†’ firecrawl_data, firecrawl_menu_data, website_content
4. **TripAdvisor** â†’ tripadvisor_data
5. **Database** â†’ reference_data for mapping

### Processing Order
1. **Content Generation** (Step 7) - Creates SEO content and menu items
2. **Data Mapping** (Step 8) - Maps to database relationships
3. **Image Analysis** (Optional) - Analyzes uploaded images

## Files Involved

- `src/lib/services/anthropic-client.ts` - Content generation
- `src/lib/services/data-mapper.ts` - Data mapping
- `extract-images-apify.js` - Image analysis (Apify)
- `extract-images-google-places.js` - Image analysis (Google Places)
- `extract-images-combined.js` - Combined image analysis

## API Configuration

- **Model:** claude-3-5-sonnet-20241022
- **Base URL:** https://api.anthropic.com/v1
- **Authentication:** ANTHROPIC_API_KEY environment variable

---

*Last Updated: January 2025*
*Created for Best of Goa project documentation*
