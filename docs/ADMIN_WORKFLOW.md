# Best of Goa - Admin Workflow Documentation

*Last Updated: January 2025*
*Version: 1.2*

**Recent Updates:**
- Fixed extraction status API to include all database fields in response
- Updated extraction report to accurately reflect database data
- See [EXTRACTION_REPORT_DATA_FIX.md](./EXTRACTION_REPORT_DATA_FIX.md) for details

---

## Overview

This document outlines the complete admin workflow for adding and managing restaurant entries in the Best of Goa platform. The workflow emphasizes automation while maintaining quality control through admin review.

---

## Table of Contents

1. [Workflow Overview](#workflow-overview)
2. [Step 1: Search Interface](#step-1-search-interface)
3. [Step 2: Results Selection](#step-2-results-selection)
4. [Step 3: Background Data Extraction](#step-3-background-data-extraction)
   - [Extraction Report Card](#extraction-report-card)
5. [Step 4: Admin Review & Publish](#step-4-admin-review--publish)
6. [Data Source Mapping](#data-source-mapping)
7. [Technical Implementation](#technical-implementation)
8. [Error Handling](#error-handling)
9. [Admin Dashboard](#admin-dashboard)

---

## Workflow Overview

**Goal:** Simple, clean workflow that automates data extraction while ensuring quality through admin review.

**Process Flow:**
```
/admin/add
  â†’ Search Google Places (Google Places API)
  â†’ Select location from results
  â†’ Trigger background extraction jobs
  â†’ Job extracts from Apify + Firecrawl
  â†’ Admin reviews in /admin/restaurants/[id]/review
  â†’ Approve & Publish â†’ Live on site
```

**Key Principles:**
- âœ… **Fully automated extraction** - System does the heavy lifting
- âœ… **Admin reviews everything** - Quality control before publish
- âœ… **Clean UX** - Simple search and select interface
- âœ… **Background processing** - Non-blocking operations
- âœ… **Scalable** - Can add batch import later

---

## Step 1: Search Interface

**Route:** `/admin/add`

### UI Components

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸ” Add New Restaurant                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Search Location:                            â”‚
â”‚  [The Cheesecake Factory Goa     ] [ðŸ”]   â”‚
â”‚                                              â”‚
â”‚  ðŸ’¡ Tip: Include location for better results â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Technical Details

**API Used:** Google Places API - Autocomplete/Search endpoint

**Request:**
```typescript
POST /api/admin/search-places

{
  query: "The Cheesecake Factory Goa"
}
```

**Response:**
```typescript
{
  results: [
    {
      place_id: "ChIJxxxxxxxxxxxxx",
      name: "The Cheesecake Factory",
      formatted_address: "Avenues Mall, Ground Floor, Goa City",
      rating: 4.5,
      user_ratings_total: 1247,
      photos: [...],
      geometry: {
        location: { lat: 29.3085, lng: 47.9317 }
      }
    }
  ]
}
```

### User Actions

1. Admin enters restaurant name (with optional location)
2. Clicks search button
3. System queries Google Places API
4. Results displayed in Step 2

---

## Step 2: Results Selection

### UI Components

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Search Results (3 found)                    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  [Photo] The Cheesecake Factory              â”‚
â”‚          ðŸ“ Avenues Mall, Goa City        â”‚
â”‚          â­ 4.5 (1,247 reviews)              â”‚
â”‚          ðŸ†” ChIJxxxxxxxxxxxxx                â”‚
â”‚          [Import This Location â†’]            â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  [Photo] The Cheesecake Factory              â”‚
â”‚          ðŸ“ 360 Mall, Goa City            â”‚
â”‚          â­ 4.4 (892 reviews)                â”‚
â”‚          ðŸ†” ChIJyyyyyyyyyyy                  â”‚
â”‚          [Import This Location â†’]            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Duplicate Detection

**Before import, system checks:**
```sql
SELECT id, name, slug
FROM restaurants
WHERE google_place_id = 'ChIJxxxxxxxxxxxxx'
LIMIT 1;
```

**If duplicate found:**
- Show warning: "âš ï¸ This restaurant already exists"
- Provide link: [View Existing Restaurant â†’]
- Option: [Update Existing] or [Cancel]

**If new:**
- Proceed to Step 3 (Background Extraction)

### User Actions

1. Admin reviews search results
2. Identifies correct location
3. Clicks "Import This Location"
4. System checks for duplicates
5. If new, triggers background jobs

---

## Step 3: Background Data Extraction

### UI Feedback

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  âœ… Import Started!                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Restaurant: The Cheesecake Factory          â”‚
â”‚  Place ID: ChIJxxxxxxxxxxxxx                 â”‚
â”‚                                              â”‚
â”‚  ðŸ“Š Extraction Progress:                     â”‚
â”‚  âœ… Fetching place details... (completed)    â”‚
â”‚  â³ Scraping reviews... (45%)                â”‚
â”‚  â³ Downloading images... (pending)          â”‚
â”‚  â³ Finding menu data... (pending)           â”‚
â”‚                                              â”‚
â”‚  You'll be notified when ready for review    â”‚
â”‚  [View Queue] [Add Another]                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Extraction Report Card

After extraction completes, the Admin/add page displays a comprehensive **Extraction Report** card at the top of the extracted data view. This report provides a complete overview of all extracted fields and their data sources.

#### Report Components

**Location:** Appears at the top of the extracted data section in `/admin/add` page

**Features:**

1. **Statistics Summary**
   - Total fields tracked
   - Fields populated count
   - Overall completeness percentage
   - Number of data sources used

2. **Field Categories**
   - **Core Identity**: Name, slug, Arabic name, status
     - Slug automatically regenerated after extraction if missing location suffix (see `SLUG_REGENERATION_IMPLEMENTATION.md`)
   - **Location**: Address, area, coordinates, neighborhood
   - **Contact**: Phone, email, website, social media
   - **Pricing**: Price level, currency, average meal price
   - **Descriptions**: AI-generated descriptions
   - **Images**: Hero image (auto-selected from best photo), logo, total image count
   - **Ratings**: Overall rating, Google rating, review counts
   - **Relationships**: Cuisines, categories, features, meals, good for
   - **Content**: Dishes count, FAQs count
   - **Operational**: Hours, menu URL, dress code, policies

3. **Field Status Indicators**
   - âœ… **Green checkmark**: Field is populated
   - âŒ **Red X**: Field is missing/empty
   - Each field shows its **data source** (apify, firecrawl, ai_enhancement, etc.)

4. **Source Breakdown**
   - Completion percentage by source (e.g., "apify: 14/21 (67%)")
   - Helps identify which extraction steps succeeded
   - Highlights missing data sources

5. **Raw Data Availability**
   - âœ… **Green checkmark**: Raw JSON output available
   - âŒ **Red X**: Raw data missing
   - Tracks: Apify Output, Firecrawl Output, AI Enhancement Output

#### Example Report Display

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸ“Š Extraction Report                                â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Statistics:                                         â”‚
â”‚  36/57 Fields Populated  |  63% Complete  |  5 Sources â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Core Identity:                                      â”‚
â”‚  âœ… Name: The Cheesecake Factory         [manual]   â”‚
â”‚  âœ… Slug: the-cheesecake-factory-avenues [generated]â”‚
â”‚  âŒ Arabic Name: Missing                  [apify]   â”‚
â”‚                                                      â”‚
â”‚  Location:                                          â”‚
â”‚  âœ… Address: Avenues Mall, Ground Floor   [apify]   â”‚
â”‚  âœ… Area: Goa City                     [apify]   â”‚
â”‚  âœ… Coordinates: 29.3085, 47.9317        [apify]   â”‚
â”‚                                                      â”‚
â”‚  Contact:                                           â”‚
â”‚  âœ… Phone: +965 XXXX XXXX               [apify]   â”‚
â”‚  âœ… Website: www.thecheesecakefactory.com [apify]  â”‚
â”‚  âŒ Email: Missing                      [firecrawl]â”‚
â”‚                                                      â”‚
â”‚  ... (more categories) ...                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  ðŸ“ˆ By Source:                                       â”‚
â”‚  apify           14/21 (67%)                        â”‚
â”‚  firecrawl        0/8 (0%)                          â”‚
â”‚  ai_enhancement   9/10 (90%)                        â”‚
â”‚  data_mapping     7/7 (100%)                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  ðŸ’¾ Raw Data:                                        â”‚
â”‚  Apify Output: âœ… Available                         â”‚
â”‚  Firecrawl Output: âœ… Available                     â”‚
â”‚  AI Enhancement Output: âœ… Available                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### Benefits

- **Quick Quality Check**: Immediately see which fields were successfully extracted
- **Source Tracking**: Understand where each piece of data came from
- **Missing Data Identification**: Easily spot fields that need manual input
- **Completeness Monitoring**: Track overall extraction quality
- **Troubleshooting**: Identify which extraction steps may have failed

#### Technical Details

**Component:** `src/components/admin/add/ExtractionReportCard.tsx`

**Data Flow:**
1. Extraction orchestrator completes all steps
2. Restaurant data is fetched from database
3. Relationship data resolved (cuisines, categories, etc.)
4. Counts calculated (dishes, FAQs, images)
5. Report card receives all data and renders statistics

**Real-time Updates:**
- Report updates automatically as extraction progresses
- Reflects changes when extraction steps complete
- Shows final state when extraction is finished

### Background Jobs Pipeline

Jobs run sequentially to ensure proper data dependencies:

#### **Job 1: Apify - Google Places Details**

**Actor:** `compass/crawler-google-places`

**Input:**
```json
{
  "placeId": "ChIJxxxxxxxxxxxxx",
  "maxReviews": 0,
  "maxImages": 0,
  "includeOpeningHours": true
}
```

**Extracts:**
- âœ… Name, address, area
- âœ… Phone, website, opening hours
- âœ… Coordinates (latitude, longitude)
- âœ… Google rating & review count
- âœ… Price level ($ to $$$$)
- âœ… Primary category (e.g., "American Restaurant")
- âœ… Popular times (busy_times JSON)

**Populates:**
- `restaurants.name`
- `restaurants.address`
- `restaurants.area`
- `restaurants.phone`
- `restaurants.website`
- `restaurants.latitude`
- `restaurants.longitude`
- `restaurants.google_place_id`
- `restaurants.google_rating`
- `restaurants.google_review_count`
- `restaurants.price_level`
- `restaurants.hours` (JSONB)
- `restaurants.busy_times` (JSONB)

---

#### **Job 2: Apify - Google Reviews**

**Actor:** `compass/Google-Maps-Reviews-Scraper`

**Input:**
```json
{
  "placeId": "ChIJxxxxxxxxxxxxx",
  "maxReviews": 500,
  "language": "en"
}
```

**Extracts:**
- âœ… Review text (for sentiment analysis)
- âœ… Individual ratings (if available)
- âœ… User mentions of dishes
- âœ… Feature mentions (WiFi, parking, etc.)
- âœ… Total aggregated review count

**Populates:**
- `restaurants.total_reviews_aggregated`
- `restaurants.review_sentiment` (AI-generated summary)
- `restaurants_dishes.mentions_count` (dish popularity)

**AI Processing:**
- Send reviews to Anthropic Claude API
- Generate sentiment summary
- Extract popular dish mentions
- Identify features (outdoor seating, vegan options, etc.)

---

#### **Job 3: Image Extraction & Processing**

**Sources:** Google Places Photos + Damilo Images

**Input:**
```json
{
  "restaurantId": "uuid",
  "google_place_id": "ChIJxxxxxxxxxxxxx",
  "maxImages": 10
}
```

**Extracts:**
- âœ… Restaurant exterior photos
- âœ… Interior/ambiance photos
- âœ… Food/dish photos
- âœ… Menu board photos

**Processing (Automated):**
1. Download high-resolution images (1200x900 minimum)
2. **Claude Vision API Analysis** - Each image scored 0-100 on:
   - Quality and composition
   - Food appeal and presentation
   - Shows actual restaurant (not abstract art)
   - Hero image suitability
3. **Smart Hero Selection** - Image with highest hero_score automatically marked as primary
4. Upload to Supabase Storage
5. Generate descriptive alt text for SEO

**Populates:**
- `restaurants.photos` (JSONB array with metadata)
- `restaurants.hero_image` âœ¨ **Auto-selected from best photo**
- `restaurants.photos_count`

**Photo Array Structure:**
```json
[
  {
    "url": "https://storage.supabase.co/.../image.jpg",
    "filename": "restaurant-name-dish.jpg",
    "alt": "Delicious pasta dish with fresh ingredients",
    "quality_score": 95,
    "hero_score": 87,
    "primary": true,  // â† Auto-selected as hero_image
    "shows_actual_restaurant": true,
    "content_classification": ["food", "plated-dish"]
  }
]
```

**Image Storage Path:**
```
supabase-bucket/restaurants/{slug}/images/{filename}.jpg
```

**âœ¨ New Feature (November 2025):**
- Hero image automatically set during extraction
- No manual selection required
- Smart AI-based selection ensures best photo is used
- See [IMAGE_EXTRACTOR_HERO_IMAGE_AUTO.md](IMAGE_EXTRACTOR_HERO_IMAGE_AUTO.md)

---

#### **Job 4: Firecrawl - TripAdvisor (if available)**

**API:** Firecrawl `/scrape` endpoint

**Target URL:** Search TripAdvisor for restaurant
```
https://www.tripadvisor.com/Search?q=The+Cheesecake+Factory+Goa
```

**Extracts:**
- âš ï¸ TripAdvisor rating & review count
- âš ï¸ TripAdvisor rankings (e.g., "#5 of 1,234 restaurants in Goa")
- âš ï¸ Awards (Travelers' Choice, Certificate of Excellence)
- âš ï¸ Cuisine tags
- âš ï¸ Features (outdoor seating, reservations, etc.)
- âš ï¸ Additional menu items (fallback if website unavailable)

**Populates:**
- `restaurants.tripadvisor_rating`
- `restaurants.tripadvisor_review_count`
- `restaurants.awards` (JSONB array)
- Array relationships for cuisines/features (Omar's pattern)

**Awards JSON Structure:**
```json
[
  {
    "name": "Travelers' Choice 2025",
    "source": "TripAdvisor",
    "year": 2025,
    "badge_url": "https://...",
    "rank": 5,
    "category": "Best Restaurant in Goa"
  }
]
```

---

#### **Job 5: Firecrawl - Restaurant Website**

**API:** Firecrawl `/scrape` endpoint

**Target URL:** Restaurant's official website (from Google Places)

**Extracts:**
- âœ… **Full Menu** (primary source!)
  - Menu sections (Appetizers, Main Courses, etc.)
  - Dish names, descriptions, prices
  - Dietary tags (vegetarian, gluten-free, etc.)
  - Signature dishes

- âœ… Operational Details:
  - Dress code
  - Reservation policy
  - Parking information
  - Payment methods

- âœ… Special Features:
  - Kids promotions ("Kids eat free Wednesday")
  - Happy hour deals
  - Special events

- âœ… Visual Assets:
  - High-resolution logo
  - Hero images
  - Food photography

**Populates:**
- `restaurants_menu_sections` (Appetizers, Main Courses, etc.)
- `restaurants_dishes` (full menu items)
- `restaurants.dress_code`
- `restaurants.reservations_policy`
- `restaurants.parking_info`
- `restaurants.payment_methods`
- `restaurants.kids_promotions`
- `restaurants.logo_image`
- `restaurants.hero_image`

**Menu Extraction Logic:**
```
1. Identify menu structure (sections/categories)
2. Extract dish names
3. Extract descriptions
4. Extract prices (with currency)
5. Identify dietary tags (ðŸŒ± vegan, ðŸŒ¾ gluten-free)
6. Flag signature dishes (marked with â­ or "Chef's Special")
```

---

#### **Job 6: AI Enhancement (Anthropic Claude)**

**API:** Anthropic Claude API

**Inputs:**
- All extracted data from previous jobs
- Reviews text
- Menu items
- Images

**Generates:**

1. **SEO Description (500-800 chars):**
```
"The Cheesecake Factory at Avenues Mall offers an extensive menu
featuring American classics, Italian favorites, and over 30 varieties
of legendary cheesecakes. Located on the ground floor with convenient
parking, this family-friendly restaurant serves generous portions in
a stylish ambiance perfect for lunch, dinner, or special celebrations.
With outdoor seating, vegan options, and accommodating service, it's
a top choice for diverse groups seeking quality dining in Goa City."
```

2. **Short Description (100-150 chars):**
```
"American casual dining with 30+ cheesecakes, generous portions,
and family-friendly atmosphere at Avenues Mall."
```

3. **Meta Title:**
```
"The Cheesecake Factory Avenues Mall - Menu, Reviews & Hours | Best Goa"
```

4. **Meta Description:**
```
"Discover The Cheesecake Factory at Avenues Mall Goa. View full menu,
customer reviews, opening hours, and book reservations. Rated 4.5â˜… by
1,247 diners."
```

5. **FAQ Generation (Schema.org):**
```json
[
  {
    "question": "Does The Cheesecake Factory accept reservations?",
    "answer": "Yes, reservations are recommended especially during weekends and holidays. You can book online or call +965 XXXX XXXX."
  },
  {
    "question": "What are the opening hours?",
    "answer": "Open daily from 10:00 AM to 11:00 PM, with extended hours on weekends."
  },
  {
    "question": "Is parking available?",
    "answer": "Yes, free parking is available at Avenues Mall with multiple entrances. The restaurant is located on the ground floor near Gate 3."
  },
  {
    "question": "Does the menu have vegan options?",
    "answer": "Yes, The Cheesecake Factory offers several vegan dishes including salads, pasta, and plant-based alternatives."
  },
  {
    "question": "What is the average meal price?",
    "answer": "Average meal price is 8-12 KWD per person for main courses, with appetizers from 3-6 KWD."
  }
]
```

6. **Review Sentiment Summary (200-300 chars):**
```
"Diners consistently praise the generous portion sizes, diverse menu
options, and exceptional service. The extensive cheesecake selection
is a crowd favorite. Some note wait times during peak hours, but most
agree it's worth it for the quality and variety."
```

7. **Dish Popularity Analysis:**
- Extract most-mentioned dishes from reviews
- Mark as `is_popular = true`
- Update `mentions_count`

8. **Cuisine Inference:**
- Analyze menu items
- Suggest cuisine tags: American, Italian, Desserts
- Auto-map to `restaurant_cuisine_ids` array

9. **Feature Extraction:**
- Parse reviews for feature mentions
- Suggest features: WiFi, Parking, Vegan Options, Family-Friendly
- Auto-map to `restaurant_feature_ids` array

**Populates:**
- `restaurants.description`
- `restaurants.short_description`
- `restaurants.meta_title`
- `restaurants.meta_description`
- `restaurants.review_sentiment`
- `restaurants_faqs` table
- `restaurants_dishes.is_popular`
- `restaurants_dishes.mentions_count`
- Array relationships (cuisines, features)

---

#### **Job 7: Database Population**

**Final data assembly and storage:**

1. **Create Restaurant Record:**
```sql
INSERT INTO restaurants (
  slug,
  name,
  address,
  area,
  google_place_id,
  -- ... all extracted fields
  verified,
  active,
  created_at
) VALUES (
  'the-cheesecake-factory-avenues',
  'The Cheesecake Factory',
  'Avenues Mall, Ground Floor',
  'Goa City',
  'ChIJxxxxxxxxxxxxx',
  -- ... extracted values
  false,  -- Not verified yet
  false,  -- Not published yet
  NOW()
);
```

2. **Map Cuisines (Omar's Pattern):**
```sql
UPDATE restaurants 
SET restaurant_cuisine_ids = ARRAY[1, 2] -- American, Italian IDs
WHERE google_place_id = 'ChIJxxxxxxxxxxxxx';
```

3. **Map Categories (Omar's Pattern):**
```sql
UPDATE restaurants 
SET restaurant_category_ids = ARRAY[2] -- Casual Dining ID
WHERE google_place_id = 'ChIJxxxxxxxxxxxxx';
```

4. **Map Features (Omar's Pattern):**
```sql
UPDATE restaurants 
SET restaurant_feature_ids = ARRAY[1, 2, 15, 3] -- WiFi, Parking, Vegan Options, Outdoor Seating IDs
WHERE google_place_id = 'ChIJxxxxxxxxxxxxx';
```

5. **Map Meals (Omar's Pattern):**
```sql
UPDATE restaurants 
SET restaurant_meal_ids = ARRAY[3, 5, 6] -- Lunch, Dinner, Dessert IDs
WHERE google_place_id = 'ChIJxxxxxxxxxxxxx';
```

6. **Create Menu Sections:**
```sql
INSERT INTO restaurants_menu_sections (restaurant_id, name, display_order)
VALUES
  (restaurant_id, 'Appetizers', 1),
  (restaurant_id, 'Main Courses', 2),
  (restaurant_id, 'Desserts', 3),
  (restaurant_id, 'Beverages', 4);
```

7. **Create Dishes:**
```sql
INSERT INTO restaurants_dishes (
  restaurant_id,
  menu_section_id,
  name,
  description,
  price,
  is_popular,
  dietary_tags
) VALUES
  (restaurant_id, section_id, 'Four Cheese Pasta', '...', 7.50, true, ARRAY['vegetarian']),
  -- ... more dishes
```

8. **Store Images:**
```sql
INSERT INTO restaurants_images (
  restaurant_id,
  url,
  storage_path,
  type,
  ai_quality_score,
  source,
  approved
) VALUES
  (restaurant_id, 'https://...', 'restaurants/slug/image1.jpg', 'exterior', 9.2, 'google', false),
  -- ... more images
```

9. **Create FAQs:**
```sql
INSERT INTO restaurants_faqs (restaurant_id, question, answer, display_order)
VALUES
  (restaurant_id, 'Does the restaurant accept reservations?', '...', 1),
  -- ... more FAQs
```

10. **Update Job Status:**
```sql
UPDATE admin_jobs
SET status = 'completed',
    completed_at = NOW(),
    result = '{"restaurantId": "uuid", "itemsExtracted": {"dishes": 47, "images": 23}}'
WHERE id = job_id;
```

---

### Job Status Tracking

**Table:** `admin_jobs` (needs to be created)

```sql
CREATE TABLE admin_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'restaurant_import'
  status TEXT NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  restaurant_id UUID REFERENCES restaurants(id),
  place_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0, -- 0-100
  current_step TEXT, -- 'Fetching place details', 'Scraping reviews', etc.
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

**Progress Updates:**
```sql
UPDATE admin_jobs
SET
  progress = 25,
  current_step = 'Scraping reviews'
WHERE id = job_id;
```

---

## Step 4: Admin Review & Publish

**Route:** `/admin/restaurants/[id]/review`

### UI Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸ“ Review: The Cheesecake Factory - Avenues        â”‚
â”‚  Status: âš ï¸ Pending Review                          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  [Basic Info] [Menu] [Images] [Reviews] [Publish]  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Basic Information:                                 â”‚
â”‚  âœ… Name: The Cheesecake Factory                    â”‚
â”‚  âœ… Address: Avenues Mall, Ground Floor             â”‚
â”‚  âš ï¸ Cuisines: American, Italian [Edit Tags]         â”‚
â”‚  âš ï¸ Features: WiFi, Parking [Add More]              â”‚
â”‚  âœ… Hours: Mon-Sun 10:00-23:00                      â”‚
â”‚  âœ… Phone: +965 XXXX XXXX                           â”‚
â”‚  âœ… Website: www.thecheesecakefactory.com           â”‚
â”‚                                                     â”‚
â”‚  Menu (47 items found):                             â”‚
â”‚  âœ… Appetizers (12) [View]                          â”‚
â”‚  âœ… Main Courses (25) [View]                        â”‚
â”‚  âš ï¸ Desserts (10) - Need prices [Edit]              â”‚
â”‚                                                     â”‚
â”‚  Images (23 collected):                             â”‚
â”‚  âœ… Approved: 18                                    â”‚
â”‚  âš ï¸ Needs Review: 5 [Review Images â†’]               â”‚
â”‚                                                     â”‚
â”‚  SEO Content:                                       â”‚
â”‚  âœ… Description: "The Cheesecake Factory at..."     â”‚
â”‚  âœ… FAQs: 5 generated                               â”‚
â”‚  âœ… Meta Tags: Optimized                            â”‚
â”‚                                                     â”‚
â”‚  Reviews & Ratings:                                 â”‚
â”‚  âœ… Google: 4.5â˜… (1,247 reviews)                    â”‚
â”‚  âœ… TripAdvisor: 4.0â˜… (892 reviews)                 â”‚
â”‚  âœ… Sentiment: Positive                             â”‚
â”‚                                                     â”‚
â”‚  [âŒ Reject & Delete] [ðŸ’¾ Save Draft] [âœ… Publish]  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Admin Review Checklist

**Basic Information:**
- [ ] Name is correct
- [ ] Address is accurate
- [ ] Cuisines properly tagged
- [ ] Features/amenities selected
- [ ] Hours are correct
- [ ] Contact info verified

**Menu Review:**
- [ ] Menu sections organized
- [ ] Dish names correct
- [ ] Prices accurate
- [ ] Dietary tags applied
- [ ] Signature dishes marked

**Image Review:**
- [ ] All images relevant
- [ ] Quality is acceptable
- [ ] Hero image selected
- [ ] Image types categorized
- [ ] Alt text generated

**SEO Content:**
- [ ] Description is engaging
- [ ] FAQs are helpful
- [ ] Meta tags optimized
- [ ] Keywords appropriate

### Admin Actions

1. **Edit Basic Info:**
```typescript
PUT /api/admin/restaurants/[id]
{
  cuisines: ['american', 'italian', 'desserts'],
  features: ['wifi', 'parking', 'vegan-options'],
  // ... other edits
}
```

2. **Approve Images:**
```typescript
PUT /api/admin/restaurants/[id]/images/[imageId]
{
  approved: true,
  is_hero: false
}
```

3. **Edit Menu:**
```typescript
PUT /api/admin/restaurants/[id]/dishes/[dishId]
{
  price: 7.50,
  is_signature: true
}
```

4. **Save as Draft:**
```typescript
PUT /api/admin/restaurants/[id]
{
  active: false,
  verified: false
}
```

5. **Publish:**
```typescript
PUT /api/admin/restaurants/[id]/publish
{
  verified: true,
  active: true
}
```

**What happens on publish:**
- `restaurants.verified` = true
- `restaurants.active` = true
- Restaurant appears on public site
- Available at: `/places-to-eat/restaurants/{slug}`
- Listed in category pages
- Indexed by search

---

## Data Source Mapping

Comprehensive mapping of where each field comes from:

| Database Field | Primary Source | Fallback | AI Enhanced |
|----------------|----------------|----------|-------------|
| **Basic Info** |
| `name` | Apify Places | - | - |
| `address` | Apify Places | - | - |
| `area` | Apify Places | Manual | - |
| `phone` | Apify Places | Website | - |
| `email` | Website | - | - |
| `website` | Apify Places | - | - |
| `instagram` | Manual | - | - |
| `facebook` | Manual | - | - |
| **Location** |
| `latitude` | Apify Places | - | - |
| `longitude` | Apify Places | - | - |
| `google_place_id` | Google Places API | - | - |
| `mall_name` | Apify Places | Manual | - |
| `mall_floor` | Website | Manual | - |
| `nearby_landmarks` | - | Manual | âœ… |
| **Pricing** |
| `price_level` | Apify Places | - | - |
| `average_meal_price` | Menu Analysis | - | âœ… |
| **Content** |
| `description` | - | - | âœ… AI Generated |
| `short_description` | - | - | âœ… AI Generated |
| **Ratings** |
| `google_rating` | Apify Places | - | - |
| `google_review_count` | Apify Places | - | - |
| `tripadvisor_rating` | Firecrawl TripAdvisor | - | - |
| `tripadvisor_review_count` | Firecrawl TripAdvisor | - | - |
| `overall_rating` | - | - | âœ… Calculated |
| `rating_breakdown` | Reviews | - | âœ… Calculated |
| **Sentiment** |
| `review_sentiment` | Apify Reviews | - | âœ… AI Generated |
| **Operational** |
| `hours` | Apify Places | Website | - |
| `dress_code` | Website | - | - |
| `reservations_policy` | Website | TripAdvisor | - |
| `parking_info` | Website | - | - |
| `payment_methods` | Website | - | - |
| **Special** |
| `awards` | Firecrawl TripAdvisor | - | - |
| `secret_menu_items` | - | Manual | - |
| `staff_picks` | Website | Manual | - |
| `kids_promotions` | Website | - | - |
| **Menu** |
| `restaurants_dishes` | Website (Firecrawl) | Manual | âœ… Popularity |
| `restaurants_menu_sections` | Website (Firecrawl) | Manual | - |
| **Images** |
| `restaurants_images` | Apify Images | Website | âœ… Quality Score |
| **SEO** |
| `meta_title` | - | - | âœ… AI Generated |
| `meta_description` | - | - | âœ… AI Generated |
| `keywords` | - | - | âœ… AI Generated |
| `restaurants_faqs` | - | - | âœ… AI Generated |

---

## Technical Implementation

### API Endpoints

```typescript
// Step 1: Search
POST /api/admin/search-places
Body: { query: string }
Response: GooglePlacesResult[]

// Step 2: Import
POST /api/admin/import-restaurant
Body: { placeId: string }
Response: { jobId: string, restaurantId: string }

// Step 3: Job Status
GET /api/admin/jobs/[jobId]
Response: {
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: number,
  currentStep: string,
  restaurantId?: string
}

// Step 4: Review
GET /api/admin/restaurants/[id]/review
Response: RestaurantReviewData

PUT /api/admin/restaurants/[id]
Body: Partial<Restaurant>
Response: Restaurant

PUT /api/admin/restaurants/[id]/publish
Body: { verified: boolean, active: boolean }
Response: Restaurant

// Images
GET /api/admin/restaurants/[id]/images
Response: RestaurantImage[]

PUT /api/admin/restaurants/[id]/images/[imageId]
Body: { approved: boolean, is_hero: boolean }
Response: RestaurantImage

// Menu
GET /api/admin/restaurants/[id]/dishes
Response: Dish[]

PUT /api/admin/restaurants/[id]/dishes/[dishId]
Body: Partial<Dish>
Response: Dish
```

### Background Job Queue

**Implementation Options:**

1. **Supabase Edge Functions** (Recommended)
   - Serverless functions
   - Integrated with Supabase DB
   - Easy secret management

2. **Vercel Serverless Functions**
   - Already on Vercel
   - API routes
   - 10-minute timeout limit

3. **Upstash Queue** (For long-running jobs)
   - Redis-based queue
   - Handles retries
   - Good for rate limiting

**Job Management Table:**

```sql
CREATE TABLE admin_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'restaurant_import'
  status TEXT NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  restaurant_id UUID REFERENCES restaurants(id),
  place_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0, -- 0-100
  current_step TEXT,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_admin_jobs_status ON admin_jobs(status);
CREATE INDEX idx_admin_jobs_restaurant ON admin_jobs(restaurant_id);
```

### Environment Variables Required

```env
# Google Places API
GOOGLE_PLACES_API_KEY=your_key_here

# Apify
APIFY_API_TOKEN=your_token_here
APIFY_GOOGLE_PLACES_ACTOR_ID=compass/crawler-google-places
APIFY_GOOGLE_REVIEWS_ACTOR_ID=compass/Google-Maps-Reviews-Scraper
APIFY_GOOGLE_IMAGES_ACTOR_ID=hooli/google-images-scraper

# Firecrawl
FIRECRAWL_API_KEY=your_key_here

# Anthropic
ANTHROPIC_API_KEY=your_key_here

# Supabase
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Rate Limiting Considerations

**Google Places API:**
- Free tier: 1,000 requests/month
- Paid: Pay per request
- Strategy: Cache results

**Apify:**
- Pay per compute units
- Concurrent runs: Based on plan
- Strategy: Queue jobs, don't run all at once

**Firecrawl:**
- Rate limits vary by plan
- Strategy: Add delay between requests

**Anthropic Claude:**
- Rate limits by tier
- Strategy: Batch operations where possible

---

## Error Handling

### To Be Decided (Placeholder Strategies)

**1. Restaurant Not Found in Google Places**
- Show "No results found" message
- Suggest manual entry option
- Allow retry with different search terms

**2. Extraction Job Fails**
```
Possible Reasons:
- API rate limit exceeded
- Website blocking scraper
- Invalid URL/Place ID
- Network timeout

Actions:
- Mark job as 'failed'
- Log error details
- Show [Retry] button in admin
- Option to skip failed step
```

**3. Duplicate Detected**
```sql
SELECT id, slug, name
FROM restaurants
WHERE google_place_id = 'ChIJxxxxxxxxxxxxx'
OR (name ILIKE '%Cheesecake Factory%' AND area = 'Goa City')
LIMIT 5;
```

Actions:
- Show existing restaurant(s)
- Offer [View Existing] link
- Offer [Update Data] option
- Offer [This is Different Location] override

**4. Partial Data Extraction**
- Some sources succeed, others fail
- Mark incomplete fields
- Allow admin to fill gaps manually
- Still allow publish

**5. API Rate Limits**
- Detect 429 errors
- Implement exponential backoff
- Queue for retry
- Show "Rate limited - retrying in X minutes"

**6. Invalid Menu Format**
- Website menu not parseable
- Fallback to manual entry
- Flag for admin attention

---

## Admin Dashboard

**Route:** `/admin`

### Overview Interface

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Best of Goa - Admin Dashboard           â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Quick Stats:                                â”‚
â”‚  ðŸ“ Pending Review: 3                        â”‚
â”‚  âœ… Published: 127                           â”‚
â”‚  â³ Processing: 2                            â”‚
â”‚  âŒ Failed: 1                                â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Recent Imports:                             â”‚
â”‚  âœ… The Cheesecake Factory                   â”‚
â”‚     Ready to Review [Review â†’]               â”‚
â”‚                                              â”‚
â”‚  â³ Texas Roadhouse                          â”‚
â”‚     Extracting data (45%) [View Progress]    â”‚
â”‚                                              â”‚
â”‚  âŒ Shake Shack                              â”‚
â”‚     Failed: Website unreachable [Retry]      â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Quick Actions:                              â”‚
â”‚  [+ Add Restaurant] [View Queue] [Settings]  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Queue Management

**Route:** `/admin/queue`

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Import Queue                                â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Status: [All] [Pending] [Processing] [...]  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  âœ… The Cheesecake Factory - Avenues         â”‚
â”‚     Completed: 2 mins ago                    â”‚
â”‚     [Review â†’] [Delete]                      â”‚
â”‚                                              â”‚
â”‚  â³ Texas Roadhouse - 360 Mall               â”‚
â”‚     Progress: 45% - Scraping reviews         â”‚
â”‚     [View Details] [Cancel]                  â”‚
â”‚                                              â”‚
â”‚  âŒ Shake Shack - Marina Mall                â”‚
â”‚     Failed: Website unreachable              â”‚
â”‚     [Retry] [Edit] [Delete]                  â”‚
â”‚                                              â”‚
â”‚  â¸ï¸ Burger King - Avenues                    â”‚
â”‚     Paused: Duplicate detected               â”‚
â”‚     [View Existing] [Continue] [Cancel]      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Future Enhancements

**Phase 2 Features:**

1. **Batch Import**
   - Upload CSV with multiple restaurants
   - Process overnight
   - Email notification when complete

2. **Scheduled Updates**
   - Auto-refresh data monthly
   - Update ratings, reviews
   - Detect closed restaurants

3. **AI-Powered Suggestions**
   - "Similar restaurants to add"
   - "Trending restaurants in [Area]"
   - "Competitors of [Restaurant]"

4. **Advanced Analytics**
   - Import success rate
   - Average processing time
   - Most common errors
   - Data completeness scores

5. **Multi-Admin Workflow**
   - Assign restaurants to admins
   - Review approval chain
   - Activity log

6. **Smart Duplicates**
   - Fuzzy matching
   - Chain detection
   - Auto-merge suggestions

---

## Appendix: Data Quality Checks

**Before Publishing, Verify:**

### Critical Fields (Must Have)
- âœ… Name
- âœ… Address
- âœ… Area
- âœ… Google Place ID
- âœ… At least 1 cuisine tag
- âœ… At least 1 image
- âœ… Opening hours

### Important Fields (Should Have)
- âš ï¸ Phone number
- âš ï¸ Website
- âš ï¸ Description
- âš ï¸ Price level
- âš ï¸ At least 1 feature tag
- âš ï¸ Menu items (minimum 5)

### Optional Fields (Nice to Have)
- â„¹ï¸ TripAdvisor rating
- â„¹ï¸ FAQs
- â„¹ï¸ Awards
- â„¹ï¸ Social media links
- â„¹ï¸ Parking info

**Quality Score Calculation:**
```typescript
const qualityScore = (
  (criticalFieldsComplete / totalCriticalFields) * 70 +
  (importantFieldsComplete / totalImportantFields) * 20 +
  (optionalFieldsComplete / totalOptionalFields) * 10
);

// 90-100: Excellent
// 70-89: Good
// 50-69: Fair (publishable with warning)
// < 50: Poor (block publish)
```

---

## Related Documentation

- [Database Architecture - Restaurants](./DATABASE_ARCHITECTURE_RESTAURANTS.md)
- [Data Scraping Strategies](./DATA_SCRAPING.md) _(Coming soon)_
- [API Integration Guide](./API_INTEGRATION.md) _(Coming soon)_
- [SEO Strategy](./SEO_STRATEGY.md) _(Coming soon)_

---

*For questions or improvements to this workflow, update this document and notify the team.*
