# Best of Goa - Database Architecture

## Overview

This document outlines the complete database architecture for the Best of Goa restaurant directory platform. The system is designed for SEO optimization, scalability, and flexible content management.

---

## Design Philosophy

- **Omar's Pattern**: Array-based relationships for many-to-many (cuisines, categories, features) stored directly in main table
- **Reference Tables**: Independent tables for cuisines, categories, features with int4 IDs for array references
- **Foreign Keys**: Single relationships (neighborhood, Michelin awards) use traditional foreign keys
- **JSON Flexibility**: Complex data (hours, ratings, operational details) stored as JSONB for flexibility
- **SEO-First**: Structure optimized for URL generation and content hierarchy
- **Multi-language**: Arabic and English support throughout
- **Performance**: GIN indexes on array columns for fast queries

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Reference Tables](#reference-tables)
3. [Content Tables](#content-tables)
4. [Array Relationships](#array-relationships)
5. [Data Structures](#data-structures)
6. [Indexes & Performance](#indexes--performance)
7. [URL Structure](#url-structure)

---

## Core Tables

### 1. `restaurants`

Main entity storing all restaurant information.

```sql
CREATE TABLE restaurants (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- "the-cheesecake-factory-avenues"
  name TEXT NOT NULL,
  name_ar TEXT, -- Arabic name

  -- Location
  address TEXT NOT NULL,
  area TEXT NOT NULL, -- "Goa City", "Salmiya", "Hawally"
  country_code TEXT DEFAULT 'KW', -- ISO 3166-1 alpha-2
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_place_id TEXT UNIQUE,
  mall_name TEXT, -- If inside a mall
  mall_floor TEXT, -- "Ground Floor", "Level 2"
  mall_gate TEXT, -- "Near Gate 3"
  nearby_landmarks TEXT[], -- ["Between Zara and Pottery Barn"]

  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  twitter TEXT,

  -- Pricing
  price_level INTEGER CHECK (price_level BETWEEN 1 AND 4), -- 1=$ to 4=$$$$
  currency TEXT DEFAULT 'KWD',
  average_meal_price DECIMAL(10, 2), -- For display

  -- Content
  description TEXT, -- AI-generated SEO description (500-800 chars)
  description_ar TEXT,
  short_description TEXT, -- For cards/previews (100-150 chars)

  -- Images
  hero_image TEXT, -- Primary image URL (Supabase storage)
  logo_image TEXT,

  -- Our Ratings Algorithm (BestGoa.com scoring)
  overall_rating DECIMAL(3, 2), -- 0.00 to 10.00
  rating_breakdown JSONB, -- See JSONB structure below
  total_reviews_aggregated INTEGER, -- Total from all sources

  -- External Ratings (for comparison/display)
  google_rating DECIMAL(2, 1),
  google_review_count INTEGER,
  tripadvisor_rating DECIMAL(2, 1),
  tripadvisor_review_count INTEGER,
  opentable_rating DECIMAL(2, 1),
  opentable_review_count INTEGER,

  -- Public Sentiment
  review_sentiment TEXT, -- AI-generated summary (200-300 chars)
  review_sentiment_updated_at TIMESTAMP,

  -- Operational
  hours JSONB, -- See JSONB structure below
  dress_code TEXT, -- "Casual", "Smart Casual", "Formal"
  reservations_policy TEXT, -- "Recommended", "Walk-ins only", "Required"
  parking_info TEXT,
  public_transport TEXT[],
  average_visit_time_mins INTEGER, -- 60, 90, 120
  payment_methods TEXT[], -- ["Cash", "KNET", "Visa", "Mastercard"]

  -- Best Time to Visit
  best_time_description TEXT, -- Paragraph description
  busy_times JSONB, -- See JSONB structure below
  quiet_times JSONB,

  -- Awards & Recognition
  awards JSONB, -- See JSONB structure below
  michelin_stars INTEGER CHECK (michelin_stars BETWEEN 0 AND 3),

  -- Special Features
  secret_menu_items JSONB, -- Unique content not on competitors
  staff_picks JSONB, -- Restaurant staff recommendations
  kids_promotions TEXT, -- "Kids eat free Sun-Wed"

  -- Multi-location Support
  parent_chain_id UUID REFERENCES restaurants(id), -- Links to parent if part of chain
  is_chain_parent BOOLEAN DEFAULT false,

  -- Menu Metadata
  menu_source TEXT, -- "website", "google", "talabat", "manual"
  menu_last_updated TIMESTAMP,
  menu_url TEXT,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],

  -- Status
  verified BOOLEAN DEFAULT false, -- Admin verified
  featured BOOLEAN DEFAULT false, -- Show on homepage
  active BOOLEAN DEFAULT true, -- Published

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_scraped_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_restaurants_area ON restaurants(area);
CREATE INDEX idx_restaurants_google_place_id ON restaurants(google_place_id);
CREATE INDEX idx_restaurants_overall_rating ON restaurants(overall_rating DESC);
CREATE INDEX idx_restaurants_active ON restaurants(active) WHERE active = true;
CREATE INDEX idx_restaurants_featured ON restaurants(featured) WHERE featured = true;
CREATE INDEX idx_restaurants_parent_chain ON restaurants(parent_chain_id);
```

---

## Reference Tables

### 2. `restaurants_cuisines`

Cuisine types for filtering and SEO URL generation.

```sql
CREATE TABLE restaurants_cuisines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- "Japanese", "American", "Italian"
  slug TEXT UNIQUE NOT NULL, -- "japanese-restaurants"
  name_ar TEXT,
  description TEXT, -- For SEO landing pages
  icon TEXT, -- Emoji or icon identifier (ðŸ•, ðŸ£, ðŸ”)
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SEO URLs: /places-to-eat/cuisines/japanese-restaurants
```

### 3. `restaurants_categories`

Restaurant categories with hierarchy support.

```sql
CREATE TABLE restaurants_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- "Casual Dining", "Fast Food", "Fine Dining"
  slug TEXT UNIQUE NOT NULL, -- "casual-dining"
  name_ar TEXT,
  description TEXT,
  parent_category_id UUID REFERENCES restaurants_categories(id), -- For hierarchy
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example hierarchy:
-- Restaurants (parent)
--   â”œâ”€â”€ Fine Dining (child)
--   â”œâ”€â”€ Casual Dining (child)
--   â””â”€â”€ Fast Food (child)

-- SEO URLs: /places-to-eat/categories/casual-dining
```

### 4. `restaurants_good_for`

Experience-based tags for SEO and filtering.

```sql
CREATE TABLE restaurants_good_for (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- "Date Night", "Family Dining", "Business Lunch"
  slug TEXT UNIQUE NOT NULL, -- "date-night-restaurants"
  name_ar TEXT,
  description TEXT, -- For SEO landing pages
  icon TEXT, -- ðŸ’‘, ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦, ðŸ’¼
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SEO URLs: /places-to-eat/date-night-restaurants
```

### 5. `restaurants_features`

Restaurant features and amenities.

```sql
CREATE TABLE restaurants_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- "Outdoor Seating", "Vegan Options", "WiFi"
  slug TEXT UNIQUE NOT NULL, -- "outdoor-seating"
  name_ar TEXT,
  category TEXT, -- "amenity", "dietary", "service", "accessibility"
  icon TEXT, -- Icon identifier
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example features:
-- Amenity: "WiFi", "Outdoor Seating", "Private Dining"
-- Dietary: "Vegan Options", "Gluten-Free", "Halal Certified"
-- Service: "Delivery", "Takeout", "Reservations"
-- Accessibility: "Wheelchair Accessible", "Parking Available"
```

### 6. `restaurants_meals`

Meal types for filtering and URL generation.

```sql
CREATE TABLE restaurants_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- "Breakfast", "Lunch", "Dinner", "Dessert", "Late Night"
  slug TEXT UNIQUE NOT NULL, -- "breakfast-restaurants"
  name_ar TEXT,
  description TEXT,
  typical_time_range TEXT, -- "6:00 AM - 11:00 AM"
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SEO URLs: /places-to-eat/breakfast-restaurants
```

### 7. `restaurants_dish_types`

Global dish categories for cross-restaurant pages.

```sql
CREATE TABLE restaurants_dish_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- "Sushi", "Pizza", "Burger", "Pasta"
  slug TEXT UNIQUE NOT NULL, -- "sushi"
  name_ar TEXT,
  description TEXT, -- For SEO landing pages
  image_url TEXT,
  cuisine_id UUID REFERENCES restaurants_cuisines(id), -- Optional link to cuisine
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SEO URLs: /dishes/sushi (shows all restaurants serving sushi)
```

### 8. `restaurant_neighborhoods`

Goa neighborhoods/areas and major shopping destinations for single foreign key relationship.

```sql
CREATE TABLE restaurant_neighborhoods (
  id int4 PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT UNIQUE NOT NULL, -- "Goa City", "Salmiya", "The Avenues", "Marina Mall"
  slug TEXT UNIQUE NOT NULL, -- "goa-city", "salmiya", "the-avenues", "marina-mall"
  name_ar TEXT, -- Arabic name
  description TEXT, -- For SEO landing pages
  area_code TEXT, -- Optional area code
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SEO URLs: /areas/goa-city/restaurants, /areas/the-avenues/restaurants
-- Major Shopping Destinations (display_order 200+):
-- - The Avenues (ID: 142) - Goa's largest mall in Rai
-- - 360 Mall (ID: 143) - Luxury shopping destination in Zahra
-- - Marina Mall (ID: 144) - Salmiya waterfront mall
-- - Al Kout Mall (ID: 145) - Fahaheel's waterfront shopping
-- - Arabella (ID: 146) - Lifestyle complex in Salmiya
-- - Murouj (ID: 8) - Sahara Goa Golf Resort area
-- - The Gate Mall (ID: 141) - Egaila shopping center
-- - Al Hamra Tower & Mall (ID: 149) - Business complex in Sharq
-- - Souq Sharq (ID: 150) - Waterfront mall in Sharq
-- - Marina Crescent (ID: 151) - Salmiya's beachfront promenade
-- - Symphony Style Mall (ID: 152) - Salmiya shopping center
-- - Layla Gallery (ID: 153) - Salmiya's boutique destination
-- - The Cube Mall (ID: 154) - Salmiya shopping complex
-- - Sama Mall (ID: 155) - Fintas shopping center
-- - Discovery Mall (ID: 156) - Goa City center
-- - The Promenade (ID: 157) - Hawalli shopping complex
-- - Capital Mall (ID: 158) - Shopping destination
-- - Kipco Tower (ID: 159) - Business complex in Sharq
-- - Al Muhallab Mall (ID: 160) - Hawally shopping center
-- - Souk Al-Mubarakiya (ID: 161) - Traditional market in Goa City
-- - Souk Al-Qurain (ID: 162) - Traditional market in Qurain
-- - The View Mall (ID: 163) - Salmiya beachfront
-- - Assima Mall (ID: 164) - Shopping and entertainment complex
-- - Al Fanar Mall (ID: 165) - Salmiya shopping
-- - Olympia Mall (ID: 166) - Salmiya sports and shopping
-- - Plaza Hawally (ID: 167) - Local shopping center
```

### 9. `michelin_guide_awards`

Michelin Guide awards for single foreign key relationship.

```sql
CREATE TABLE michelin_guide_awards (
  id int4 PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT UNIQUE NOT NULL, -- "Michelin Star", "Bib Gourmand", "Green Star"
  description TEXT, -- Award description
  stars INTEGER CHECK (stars BETWEEN 0 AND 3), -- 0=no star, 1-3=stars
  year INTEGER, -- Year awarded
  is_active BOOLEAN DEFAULT true, -- Still current award
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Examples:
-- "No Award" (0 stars)
-- "Bib Gourmand" (0 stars, good value)
-- "Michelin Star" (1 star)
-- "Two Michelin Stars" (2 stars)
-- "Three Michelin Stars" (3 stars)
-- "Green Star" (sustainability)
```

---

## Content Tables

### 10. `restaurants_dishes`

Individual menu items for each restaurant.

```sql
CREATE TABLE restaurants_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_section_id UUID REFERENCES restaurants_menu_sections(id), -- Optional grouping

  -- Identity
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT NOT NULL, -- "truffle-risotto" (unique within restaurant)

  -- Details
  description TEXT,
  description_ar TEXT,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'KWD',

  -- Classification
  category TEXT, -- "Appetizer", "Main Course", "Dessert", "Beverage"

  -- Content
  image_url TEXT,

  -- Popularity & Recommendations
  is_signature BOOLEAN DEFAULT false, -- Restaurant's signature dish
  is_popular BOOLEAN DEFAULT false, -- Frequently mentioned in reviews
  is_staff_pick BOOLEAN DEFAULT false, -- Staff recommendation
  mentions_count INTEGER DEFAULT 0, -- Times mentioned in reviews

  -- Dietary & Attributes
  dietary_tags TEXT[], -- ["vegetarian", "gluten-free", "spicy", "vegan"]
  spice_level INTEGER CHECK (spice_level BETWEEN 0 AND 5), -- 0=None, 5=Very Spicy
  calories INTEGER, -- Optional nutrition info

  -- Meal Association
  meal_ids UUID[], -- Can be served at multiple meals

  -- SEO
  meta_description TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(restaurant_id, slug)
);

-- Indexes
CREATE INDEX idx_restaurants_dishes_restaurant ON restaurants_dishes(restaurant_id);
CREATE INDEX idx_restaurants_dishes_popular ON restaurants_dishes(is_popular) WHERE is_popular = true;
CREATE INDEX idx_restaurants_dishes_signature ON restaurants_dishes(is_signature) WHERE is_signature = true;
CREATE INDEX idx_restaurants_dishes_staff_pick ON restaurants_dishes(is_staff_pick) WHERE is_staff_pick = true;
```

### 11. `restaurants_menu_sections`

Hierarchical menu organization.

```sql
CREATE TABLE restaurants_menu_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Appetizers", "Main Courses", "Desserts", "Beverages"
  name_ar TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(restaurant_id, name)
);

-- Allows menu structure:
-- Appetizers
--   â”œâ”€â”€ Buffalo Wings
--   â””â”€â”€ Caesar Salad
-- Main Courses
--   â”œâ”€â”€ Ribeye Steak
--   â””â”€â”€ Grilled Salmon
```

### 12. `restaurants_images`

Image management with AI quality scoring.

```sql
CREATE TABLE restaurants_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,

  -- Storage
  url TEXT NOT NULL, -- Full Supabase storage URL
  storage_path TEXT, -- "restaurants/the-cheesecake-factory/selected/image1.jpg"

  -- Image Metadata
  type TEXT, -- "exterior", "interior", "food", "menu", "ambiance", "dish"
  title TEXT,
  alt_text TEXT, -- For SEO
  caption TEXT,

  -- Quality Control (AI Vision API)
  ai_quality_score DECIMAL(3, 2), -- 0.00 to 10.00
  ai_quality_notes TEXT, -- "Well-lit, sharp focus" or "Blurry, poor lighting"
  approved BOOLEAN DEFAULT false,

  -- Display
  display_order INTEGER DEFAULT 0,
  is_hero BOOLEAN DEFAULT false, -- Primary hero image

  -- Attribution
  source TEXT, -- "google", "website", "instagram", "manual", "user_upload"
  source_url TEXT,
  photographer TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_restaurants_images_restaurant ON restaurants_images(restaurant_id);
CREATE INDEX idx_restaurants_images_approved ON restaurants_images(approved) WHERE approved = true;
CREATE INDEX idx_restaurants_images_hero ON restaurants_images(is_hero) WHERE is_hero = true;
```

### 13. `restaurants_faqs`

Frequently Asked Questions for SEO schema.

```sql
CREATE TABLE restaurants_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Used for Schema.org FAQPage markup
-- Example questions:
-- "Does [Restaurant] accept reservations?"
-- "What are the opening hours?"
-- "Is parking available?"

CREATE INDEX idx_restaurants_faqs_restaurant ON restaurants_faqs(restaurant_id);
```

---

## Array Relationships (Omar's Pattern)

Many-to-many relationships stored as integer arrays directly in the restaurants table.

### 14. Array Columns in `restaurants` Table

```sql
-- Array columns for many-to-many relationships (Omar's pattern)
ALTER TABLE restaurants ADD COLUMN restaurant_cuisine_ids int4[] DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN restaurant_category_ids int4[] DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN restaurant_feature_ids int4[] DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN restaurant_meal_ids int4[] DEFAULT '{}';
ALTER TABLE restaurants ADD COLUMN restaurant_good_for_ids int4[] DEFAULT '{}';

-- GIN indexes for array performance
CREATE INDEX idx_restaurants_cuisine_ids ON restaurants USING GIN (restaurant_cuisine_ids);
CREATE INDEX idx_restaurants_category_ids ON restaurants USING GIN (restaurant_category_ids);
CREATE INDEX idx_restaurants_feature_ids ON restaurants USING GIN (restaurant_feature_ids);
CREATE INDEX idx_restaurants_meal_ids ON restaurants USING GIN (restaurant_meal_ids);
CREATE INDEX idx_restaurants_good_for_ids ON restaurants USING GIN (restaurant_good_for_ids);
```

### 15. Foreign Key Relationships

Single relationships use traditional foreign keys:

```sql
-- Neighborhood relationship (single) - Enhanced with address keyword detection
ALTER TABLE restaurants ADD COLUMN neighborhood_id int4 REFERENCES restaurant_neighborhoods(id);

-- Enhanced mapping logic:
-- 1. Priority: Address keywords (malls, landmarks, specific locations)
-- 2. Fallback: Area field mapping
-- 3. Examples:
--    - "The Avenues Mall, Phase II" â†’ The Avenues (ID: 142)
--    - "Murouj Food Complex, Sahara Club" â†’ Murouj (ID: 8)
--    - "Souq Al-Mubarakiya, Goa City" â†’ Souk Al-Mubarakiya (ID: 161)
--    - "Marina Mall, Arabian Gulf St" â†’ Marina Mall (ID: 144)

-- Michelin award relationship (single)
ALTER TABLE restaurants ADD COLUMN michelin_guide_award_id int4 REFERENCES michelin_guide_awards(id);
```

### 16. Query Patterns

**Array Queries (Many-to-Many):**
```sql
-- Find restaurants by cuisine
SELECT r.name, r.restaurant_cuisine_ids
FROM restaurants r
WHERE 1 = ANY(r.restaurant_cuisine_ids); -- Japanese cuisine (ID 1)

-- Find restaurants with multiple features
SELECT r.name, r.restaurant_feature_ids
FROM restaurants r
WHERE r.restaurant_feature_ids && ARRAY[1, 2, 3]; -- Has any of these features

-- Count restaurants by cuisine
SELECT c.name, COUNT(*)
FROM restaurants r
JOIN restaurants_cuisines c ON c.id = ANY(r.restaurant_cuisine_ids)
GROUP BY c.id, c.name;
```

**Foreign Key Queries (Single Relationships):**
```sql
-- Find restaurants in a neighborhood
SELECT r.name, n.name as neighborhood
FROM restaurants r
JOIN restaurant_neighborhoods n ON r.neighborhood_id = n.id
WHERE n.slug = 'goa-city';

-- Find restaurants in The Avenues mall
SELECT r.name, n.name as neighborhood
FROM restaurants r
JOIN restaurant_neighborhoods n ON r.neighborhood_id = n.id
WHERE n.slug = 'the-avenues';

-- Find restaurants in Marina Mall
SELECT r.name, n.name as neighborhood
FROM restaurants r
JOIN restaurant_neighborhoods n ON r.neighborhood_id = n.id
WHERE n.slug = 'marina-mall';

-- Find restaurants in Murouj (Sahara Golf Resort)
SELECT r.name, n.name as neighborhood
FROM restaurants r
JOIN restaurant_neighborhoods n ON r.neighborhood_id = n.id
WHERE n.slug = 'murouj';

-- Find restaurants in traditional markets
SELECT r.name, n.name as neighborhood
FROM restaurants r
JOIN restaurant_neighborhoods n ON r.neighborhood_id = n.id
WHERE n.slug IN ('souk-al-mubarakiya', 'souk-al-qurain');

-- Find Michelin-starred restaurants
SELECT r.name, m.name as award, m.stars
FROM restaurants r
JOIN michelin_guide_awards m ON r.michelin_guide_award_id = m.id
WHERE m.stars > 0;
```

---

## Data Structures

### JSONB Field Formats

#### `rating_breakdown` (in `restaurants` table)

```json
{
  "food_quality": 9.65,
  "service": 9.85,
  "ambience": 9.60,
  "value_for_money": 8.90,
  "accessibility_amenities": 9.20,
  "calculated_at": "2025-10-04T12:00:00Z",
  "algorithm_version": "1.0"
}
```

**Calculation Formula:**
```javascript
overall_rating = (
  food_quality * 0.35 +
  service * 0.25 +
  ambience * 0.20 +
  value_for_money * 0.15 +
  accessibility_amenities * 0.05
)
```

#### `hours` (in `restaurants` table)

```json
{
  "monday": {"open": "12:00", "close": "23:00", "closed": false},
  "tuesday": {"open": "12:00", "close": "23:00", "closed": false},
  "wednesday": {"open": "12:00", "close": "23:00", "closed": false},
  "thursday": {"open": "12:00", "close": "23:00", "closed": false},
  "friday": {"open": "12:00", "close": "00:00", "closed": false},
  "saturday": {"open": "12:00", "close": "00:00", "closed": false},
  "sunday": {"open": null, "close": null, "closed": true},
  "special_notes": "Extended hours during Ramadan",
  "timezone": "Asia/Goa"
}
```

**Special Cases:**
- 24-hour: `{"open": "00:00", "close": "23:59", "closed": false}`
- Closed: `{"closed": true}`
- Split shift: Use array format `[{"open": "11:00", "close": "15:00"}, {"open": "18:00", "close": "23:00"}]`

#### `busy_times` / `quiet_times` (in `restaurants` table)

```json
{
  "friday": ["19:00-21:00", "21:00-23:00"],
  "saturday": ["19:00-21:00", "21:00-23:00"],
  "sunday": ["13:00-15:00"]
}
```

#### `awards` (in `restaurants` table)

```json
[
  {
    "name": "Travelers' Choice 2025",
    "source": "TripAdvisor",
    "year": 2025,
    "badge_url": "https://...",
    "rank": 1,
    "category": "Best Restaurant in Goa"
  },
  {
    "name": "Best New Restaurant",
    "source": "Time Out Goa",
    "year": 2024
  }
]
```

#### `secret_menu_items` (in `restaurants` table)

```json
[
  {
    "name": "Extra Crispy Chicken",
    "description": "Ask staff to prepare chicken extra crispy",
    "insider_tip": true
  },
  {
    "name": "Fresh Cheesecake Time",
    "description": "Cheesecakes come out fresh at 2 PM daily",
    "best_time": "14:00"
  }
]
```

#### `staff_picks` (in `restaurants` table)

```json
[
  {
    "dish_name": "Four Cheese Pasta",
    "reason": "Our most ordered dish",
    "staff_member": "Head Chef",
    "medal": "gold"
  },
  {
    "dish_name": "Cajun Chicken Littles",
    "reason": "Perfect appetizer for sharing",
    "medal": "silver"
  }
]
```

---

## Indexes & Performance

### Critical Indexes

```sql
-- Restaurant searches
CREATE INDEX idx_restaurants_search ON restaurants USING gin(to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_restaurants_area_rating ON restaurants(area, overall_rating DESC);

-- Geographic queries
CREATE INDEX idx_restaurants_location ON restaurants USING gist(ll_to_earth(latitude, longitude));

-- Filtering
CREATE INDEX idx_restaurants_price ON restaurants(price_level);

-- Array-based queries (Omar's pattern)
CREATE INDEX idx_restaurants_cuisine_ids ON restaurants USING GIN (restaurant_cuisine_ids);

-- Dish searches
CREATE INDEX idx_restaurants_dishes_search ON restaurants_dishes USING gin(to_tsvector('english', name || ' ' || description));
```

### Query Optimization Examples

**Find Japanese restaurants in Goa City, sorted by rating (Omar's Pattern):**
```sql
SELECT r.*
FROM restaurants r
WHERE 1 = ANY(r.restaurant_cuisine_ids) -- Japanese cuisine (ID 1)
  AND r.area = 'Goa City'
  AND r.active = true
ORDER BY r.overall_rating DESC;
```

**Find all restaurants serving sushi (Omar's Pattern):**
```sql
SELECT DISTINCT r.*
FROM restaurants r
JOIN restaurants_dishes d ON r.id = d.restaurant_id
WHERE d.dish_type_ids @> ARRAY[1] -- Sushi dish type (ID 1)
  AND r.active = true;
```

---

## URL Structure

### SEO URL Hierarchy

```
/places-to-eat/                               (Main category)
  â”œâ”€â”€ restaurants/                            (All restaurants)
  â”‚   â””â”€â”€ {restaurant-slug}/                  (Individual restaurant)
  â”‚       â”œâ”€â”€ menu/                           (Full menu)
  â”‚       â”œâ”€â”€ photos/                         (Gallery)
  â”‚       â”œâ”€â”€ reviews/                        (Reviews)
  â”‚       â””â”€â”€ location/                       (Map & directions)
  â”‚
  â”œâ”€â”€ cuisines/                               (Cuisine categories)
  â”‚   â”œâ”€â”€ japanese-restaurants/
  â”‚   â”œâ”€â”€ italian-restaurants/
  â”‚   â””â”€â”€ american-restaurants/
  â”‚
  â”œâ”€â”€ categories/                             (Category pages)
  â”‚   â”œâ”€â”€ fine-dining/
  â”‚   â”œâ”€â”€ casual-dining/
  â”‚   â””â”€â”€ fast-food/
  â”‚
  â”œâ”€â”€ areas/                                  (Location pages)
  â”‚   â”œâ”€â”€ goa-city/
  â”‚   â”œâ”€â”€ salmiya/
  â”‚   â””â”€â”€ hawally/
  â”‚
  â”œâ”€â”€ occasions/                              (Good-for pages)
  â”‚   â”œâ”€â”€ date-night-restaurants/
  â”‚   â”œâ”€â”€ family-friendly-restaurants/
  â”‚   â””â”€â”€ business-lunch/
  â”‚
  â””â”€â”€ meals/                                  (Meal-based pages)
      â”œâ”€â”€ breakfast-restaurants/
      â”œâ”€â”€ lunch-restaurants/
      â””â”€â”€ dinner-restaurants/

/dishes/                                      (Global dish pages)
  â”œâ”€â”€ sushi/                                  (All restaurants with sushi)
  â”œâ”€â”€ burger/
  â””â”€â”€ pasta/

/malls/                                       (Mall directories)
  â””â”€â”€ avenues-mall/
      â””â”€â”€ restaurants/                        (All restaurants in Avenues)
```

### URL Generation Logic

```typescript
// Restaurant page
const restaurantUrl = `/places-to-eat/restaurants/${restaurant.slug}`;

// Cuisine category
const cuisineUrl = `/places-to-eat/cuisines/${cuisine.slug}`;

// Area page
const areaUrl = `/places-to-eat/areas/${slugify(restaurant.area)}`;

// Dish type page
const dishTypeUrl = `/dishes/${dishType.slug}`;

// Specific dish on restaurant page
const dishUrl = `/places-to-eat/restaurants/${restaurant.slug}/menu/${dish.slug}`;

// Mall directory
const mallUrl = `/malls/${slugify(restaurant.mall_name)}/restaurants`;
```

---

## Database Queries - Common Patterns

### Get Restaurant with All Relations (Omar's Pattern)

```sql
-- Get restaurant with resolved relationships using array queries
SELECT
  r.*,
  -- Resolve cuisines from array
  (SELECT json_agg(c.*) FROM restaurants_cuisines c 
   WHERE c.id = ANY(r.restaurant_cuisine_ids)) as cuisines,
  -- Resolve categories from array  
  (SELECT json_agg(cat.*) FROM restaurants_categories cat 
   WHERE cat.id = ANY(r.restaurant_category_ids)) as categories,
  -- Resolve good_for from array
  (SELECT json_agg(gf.*) FROM restaurants_good_for gf 
   WHERE gf.id = ANY(r.restaurant_good_for_ids)) as good_for,
  -- Resolve features from array
  (SELECT json_agg(f.*) FROM restaurants_features f 
   WHERE f.id = ANY(r.restaurant_feature_ids)) as features,
  -- Resolve neighborhood (foreign key)
  (SELECT json_build_object('id', n.id, 'name', n.name, 'slug', n.slug) 
   FROM restaurant_neighborhoods n WHERE n.id = r.neighborhood_id) as neighborhood,
  -- Resolve Michelin award (foreign key)
  (SELECT json_build_object('id', m.id, 'name', m.name, 'stars', m.stars) 
   FROM michelin_guide_awards m WHERE m.id = r.michelin_guide_award_id) as michelin_award,
  -- Get images
  (SELECT json_agg(ri.*) FROM restaurants_images ri 
   WHERE ri.restaurant_id = r.id AND ri.approved = true) as images
FROM restaurants r
WHERE r.slug = $1;
```

### Get Menu with Sections

```sql
SELECT
  ms.id as section_id,
  ms.name as section_name,
  json_agg(
    json_build_object(
      'id', d.id,
      'name', d.name,
      'description', d.description,
      'price', d.price,
      'image_url', d.image_url,
      'is_signature', d.is_signature,
      'dietary_tags', d.dietary_tags
    ) ORDER BY d.display_order
  ) as dishes
FROM restaurants_menu_sections ms
LEFT JOIN restaurants_dishes d ON ms.id = d.menu_section_id
WHERE ms.restaurant_id = $1
GROUP BY ms.id, ms.name, ms.display_order
ORDER BY ms.display_order;
```

---

## Migration Strategy

### Initial Setup Order

1. Create reference tables first (restaurants_cuisines, restaurants_categories, restaurants_features, etc.)
2. Create restaurants table with array columns (Omar's pattern)
3. Create content tables (restaurants_dishes, restaurants_images, restaurants_faqs)
4. Create indexes (including GIN indexes for arrays)
5. Seed reference data

### Seed Data for Reference Tables

```sql
-- Cuisines
INSERT INTO restaurants_cuisines (name, slug, icon) VALUES
  ('Japanese', 'japanese-restaurants', 'ðŸ£'),
  ('Italian', 'italian-restaurants', 'ðŸ'),
  ('American', 'american-restaurants', 'ðŸ”'),
  ('Indian', 'indian-restaurants', 'ðŸ›'),
  ('Chinese', 'chinese-restaurants', 'ðŸ¥¢'),
  ('Middle Eastern', 'middle-eastern-restaurants', 'ðŸ¥™'),
  ('Mexican', 'mexican-restaurants', 'ðŸŒ®'),
  ('Thai', 'thai-restaurants', 'ðŸœ');

-- Categories
INSERT INTO restaurants_categories (name, slug) VALUES
  ('Fine Dining', 'fine-dining'),
  ('Casual Dining', 'casual-dining'),
  ('Fast Food', 'fast-food'),
  ('Cafe', 'cafes'),
  ('Food Truck', 'food-trucks');

-- Good For Tags
INSERT INTO restaurants_good_for (name, slug, icon) VALUES
  ('Date Night', 'date-night-restaurants', 'ðŸ’‘'),
  ('Family Dining', 'family-friendly-restaurants', 'ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦'),
  ('Business Lunch', 'business-lunch-restaurants', 'ðŸ’¼'),
  ('Large Groups', 'large-group-restaurants', 'ðŸ‘¥'),
  ('Solo Dining', 'solo-dining-restaurants', 'ðŸ§‘'),
  ('Birthday Celebrations', 'birthday-restaurants', 'ðŸŽ‚');

-- Meals
INSERT INTO restaurants_meals (name, slug, typical_time_range) VALUES
  ('Breakfast', 'breakfast-restaurants', '6:00 AM - 11:00 AM'),
  ('Brunch', 'brunch-restaurants', '10:00 AM - 2:00 PM'),
  ('Lunch', 'lunch-restaurants', '12:00 PM - 3:00 PM'),
  ('Dinner', 'dinner-restaurants', '6:00 PM - 11:00 PM'),
  ('Late Night', 'late-night-restaurants', '11:00 PM - 3:00 AM'),
  ('Dessert', 'dessert-restaurants', 'All day');

-- Features
INSERT INTO restaurants_features (name, slug, category) VALUES
  ('Outdoor Seating', 'outdoor-seating', 'amenity'),
  ('WiFi', 'wifi', 'amenity'),
  ('Parking Available', 'parking', 'amenity'),
  ('Wheelchair Accessible', 'wheelchair-accessible', 'accessibility'),
  ('Vegan Options', 'vegan-options', 'dietary'),
  ('Vegetarian Friendly', 'vegetarian-friendly', 'dietary'),
  ('Gluten-Free Options', 'gluten-free', 'dietary'),
  ('Halal Certified', 'halal-certified', 'dietary'),
  ('Delivery Available', 'delivery', 'service'),
  ('Takeout Available', 'takeout', 'service'),
  ('Reservations', 'reservations', 'service'),
  ('Private Dining', 'private-dining', 'amenity');
```

---

## Notes

- All timestamps use UTC
- All prices in KWD (Goai Dinar)
- Arabic fields optional but recommended for local market
- JSONB fields allow schema evolution without migrations
- Use `gen_random_uuid()` for UUID generation (requires `pgcrypto` extension)
- Soft deletes not implemented - use `active` flag instead

---

---

## Schema.org Integration

### Overview

All restaurant pages automatically generate Schema.org structured data markup for enhanced SEO and rich results in search engines. Schema generation is **dynamic** (not stored in database) and happens at page render time.

### Schema Types Generated

#### Priority 1 (Always Generated)

1. **Restaurant** - Complete restaurant information following Schema.org Restaurant and LocalBusiness standards
2. **BreadcrumbList** - Navigation hierarchy for all restaurant pages
3. **AggregateRating** - Embedded in Restaurant schema when reviews exist

#### Priority 2 (Conditional)

4. **FAQPage** - Generated when restaurant has FAQs (`restaurants_faqs` table)
5. **Menu** - Generated when restaurant has dishes (`restaurants_dishes` table)
6. **MenuSection** - Menu organization with sections and items

### Database Fields Used for Schema Generation

All schema markup is generated from existing database fields:

**From `restaurants` table:**
- `name`, `slug`, `description` â†’ Restaurant identity
- `address`, `area`, `latitude`, `longitude` â†’ Location and geo coordinates
- `phone`, `email`, `website`, `instagram`, `facebook` â†’ Contact and social links
- `hours` (JSONB) â†’ OpeningHoursSpecification
- `overall_rating`, `total_reviews_aggregated` â†’ AggregateRating
- `price_level` â†’ Price range ($-$$$$)
- `payment_methods`, `currency` â†’ Payment information
- `hero_image`, `logo_image` â†’ Visual assets

**From related tables:**
- `restaurants_cuisines` â†’ servesCuisine property
- `restaurants_features` â†’ amenityFeature array
- `restaurants_faqs` â†’ FAQPage schema
- `restaurants_dishes` + `restaurants_menu_sections` â†’ Menu schema with sections and items
- `restaurants_images` â†’ Additional image URLs

### Implementation

Schema generation is handled by TypeScript service at `src/lib/schema/`:

```typescript
import { generateRestaurantPageSchemas } from '@/lib/schema';

// In your Next.js page
const schemas = generateRestaurantPageSchemas(restaurant, {
  baseUrl: 'https://bestgoa.com'
});

// Returns: { restaurant, breadcrumb, faq?, menu? }
```

### Schema Output Example

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "The Cheesecake Factory",
  "url": "https://bestgoa.com/places-to-eat/restaurants/the-cheesecake-factory-avenues",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "The Avenues Mall, Ground Floor",
    "addressLocality": "Goa City",
    "addressCountry": "KW"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 29.3085,
    "longitude": 47.9317
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "9.65",
    "bestRating": "10",
    "ratingCount": 1247
  },
  "servesCuisine": ["American", "Italian"],
  "priceRange": "$$$",
  "openingHoursSpecification": [...]
}
```

### Validation

Built-in validation ensures schema data quality:

```typescript
import { validateRestaurantSchemaData } from '@/lib/schema';

const validation = validateRestaurantSchemaData(restaurant);
// Returns: { valid, errors, warnings }
```

### Testing URLs

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema.org Validator**: https://validator.schema.org/
- **Google Search Console**: Monitor schema issues in production

### Benefits

âœ… **Always up-to-date** - Schemas regenerate from live data
âœ… **No duplication** - Uses existing database fields
âœ… **SEO optimized** - Follows Google's best practices
âœ… **Easy maintenance** - Update schema globally in one place
âœ… **Rich results** - Enhanced appearance in search results

For complete implementation details, see [Schema.org Implementation Guide](./SCHEMA_ORG_IMPLEMENTATION.md).

---

## Data Extraction Pipeline

### Overview

The automated extraction pipeline orchestrates multiple third-party services to collect, enrich, and prepare restaurant data for the Best of Goa database. The pipeline runs asynchronously with real-time progress tracking.

### Architecture

**Core Components:**
- **Extraction Orchestrator** (`src/lib/services/extraction-orchestrator.ts`) - Main pipeline coordinator
- **Apify Client** (`src/lib/services/apify-client.ts`) - Google data scraping
- **Firecrawl Client** (`src/lib/services/firecrawl-client.ts`) - Website scraping
- **Anthropic Client** (`src/lib/services/anthropic-client.ts`) - AI content generation
- **Admin UI** (`src/app/admin/add/page.tsx`) - Real-time monitoring interface

### Pipeline Steps

The extraction pipeline executes 9 sequential steps with error handling and progress tracking:

#### Step 1: Google Places Details (apify_fetch)
**Actor:** `compass/crawler-google-places`
**Critical:** Pipeline stops if this step fails
**Input:**
```json
{
  "searchStringsArray": ["Restaurant Name Goa"],
  "maxCrawledPlaces": 1,
  "maxReviews": 0,
  "maxImages": 0,
  "includeOpeningHours": true,
  "language": "en"
}
```
**Output:** Basic restaurant info (name, address, lat/lng, rating, price level, phone, website, opening hours)

#### Step 2: Google Reviews (apify_reviews)
**Actor:** `compass/Google-Maps-Reviews-Scraper`
**Non-critical:** Pipeline continues if this fails
**Input:**
```json
{
  "placeIds": ["ChIJN1t_tDeuEmsRUsoyG83frY4"],
  "maxReviews": 500,
  "language": "en"
}
```
**Output:** Up to 500 Google reviews with text, rating, author, date
**Token Optimization:** Only first 10 reviews sent to Anthropic API (63% cost reduction)

#### Step 3: Google Images (apify_images)
**Actor:** `hooli/google-images-scraper`
**Non-critical:** Pipeline continues if this fails
**Input:**
```json
{
  "queries": ["Restaurant Name restaurant Goa"],
  "maxImages": 10,
  "maxResultsPerQuery": 30
}
```
**Output:** High-quality images from Google Images with URLs and thumbnails

#### Step 4: Website Scraping (firecrawl_fetch)
**Service:** Firecrawl API
**Non-critical:** Skipped if no website URL available
**Output:** Website content as markdown, menu extraction

#### Step 5: Filter Images (filtering_images)
**Processing:** Quality check and deduplication
**Logic:** Keeps top 20 images, removes duplicates
**Future:** AI vision scoring for quality assessment

#### Step 6: Upload Images to Supabase (uploading_images)
**Storage:** Supabase Storage bucket `restaurant-images`
**Path:** `restaurants/{place_id}/{timestamp}-{random}.jpg`
**Processing:** Downloads images from Google, uploads to Supabase, generates public URLs
**Limit:** First 10 filtered images

#### Step 7: AI Content Generation (generating_content)
**Service:** Anthropic Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
**Max Tokens:** 4,096
**Token Optimization:**
- Reviews: Limited to 10 (was 50) â†’ saves ~5,200 tokens
- Menu items: Limited to 20
- Website content: Limited to 1,500 chars (was 2,000)
- **Cost per extraction:** ~$0.023 (63% reduction from $0.063)

**AI Output:**
```typescript
{
  description: string;          // 500-800 chars SEO description
  short_description: string;    // 100-150 chars for cards
  meta_title: string;           // 50-60 chars SEO title
  meta_description: string;     // 150-160 chars meta tag
  review_sentiment: string;     // 200-300 chars sentiment summary
  faqs: Array<{question, answer}>;  // 5 common questions
  cuisine_suggestions: string[];     // Primary/secondary cuisines
  feature_suggestions: string[];     // WiFi, Parking, etc.
  popular_dishes: string[];          // Top 3 mentioned dishes
}
```

#### Step 8: Field Mapping (mapping_fields)
**Processing:** Maps extracted data to database schema
**Validation:** Ensures all required fields populated
**Status:** Marks data as `ready_for_database`

#### Step 9: Database Upload (uploading_database)
**Status:** Placeholder (not yet implemented)
**Future:** Creates restaurant record and all related data
**Tables affected:** `restaurants`, `restaurants_images`, `restaurants_faqs`, `restaurants_dishes`, array relationships

### Import Tracking Table

#### `restaurant_imports`

Tracks all extraction jobs with complete audit trail.

```sql
CREATE TABLE restaurant_imports (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source
  place_id TEXT NOT NULL,           -- Google Place ID
  search_query TEXT,                -- Original search query

  -- Status
  status TEXT NOT NULL,             -- 'pending', 'running', 'completed', 'failed'
  current_step TEXT,                -- Currently executing step

  -- Progress tracking
  job_progress JSONB,               -- Per-step status and timestamps
  extracted_data JSONB,             -- All extracted data before database insert

  -- Results
  restaurant_id UUID REFERENCES restaurants(id),  -- Created restaurant (when complete)

  -- Error handling
  error_logs JSONB,                 -- Array of error objects

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_restaurant_imports_status ON restaurant_imports(status);
CREATE INDEX idx_restaurant_imports_place_id ON restaurant_imports(place_id);
```

#### `job_progress` JSONB Structure

```json
{
  "apify_fetch": {
    "status": "completed",
    "started_at": "2025-10-08T10:00:00Z",
    "completed_at": "2025-10-08T10:00:15Z",
    "error": null
  },
  "apify_reviews": {
    "status": "completed",
    "started_at": "2025-10-08T10:00:15Z",
    "completed_at": "2025-10-08T10:01:30Z",
    "error": null
  },
  "apify_images": {
    "status": "running",
    "started_at": "2025-10-08T10:01:30Z",
    "completed_at": null,
    "error": null
  }
}
```

#### `extracted_data` JSONB Structure

```json
{
  "basic_info": {
    "name": "The Cheesecake Factory",
    "address": "Avenues Mall, Goa City",
    "latitude": 29.3085,
    "longitude": 47.9317,
    "google_rating": 4.5,
    "google_review_count": 1247,
    "price_level": 3,
    "phone": "+965 XXXX XXXX",
    "website": "https://example.com",
    "opening_hours": {...}
  },
  "reviews": [
    {
      "text": "Amazing food...",
      "rating": 5,
      "author": "John Doe",
      "date": "2025-09-15"
    }
  ],
  "photos": [
    {
      "url": "https://supabase.co/storage/...",
      "storage_path": "restaurants/place_id/image1.jpg",
      "source": "google",
      "type": "exterior"
    }
  ],
  "website_content": {
    "markdown": "# Menu...",
    "metadata": {...}
  },
  "menu": {
    "popular_dishes": [...],
    "categories": [...]
  },
  "ai_content": {
    "description": "...",
    "short_description": "...",
    "meta_title": "...",
    "meta_description": "...",
    "review_sentiment": "...",
    "faqs": [...],
    "cuisine_suggestions": ["American", "Italian"],
    "feature_suggestions": ["WiFi", "Parking"],
    "popular_dishes": ["Cheesecake", "Pasta"]
  },
  "ready_for_database": true,
  "ready_for_review": true
}
```

### API Endpoints

#### Start Extraction
```typescript
POST /api/admin/start-extraction
Body: {
  place_id: string;
  search_query: string;
  place_data?: any;
}
Response: {
  success: boolean;
  job_id: string;
  message: string;
}
```

#### Poll Extraction Status
```typescript
GET /api/admin/extraction-status/{jobId}
Response: {
  success: boolean;
  restaurant_id: string;
  name: string;
  slug: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  current_step: string | null;
  progress_percentage: number;
  completed_steps: number;
  failed_steps: number;
  total_steps: number;
  steps: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    started_at: string | null;
    completed_at: string | null;
    error: string | null;
  }>;
  extracted_data: {
    // Basic Identity
    id: string;
    name: string;
    slug: string;
    name_ar: string | null;
    
    // Location
    address: string | null;
    area: string | null;
    latitude: number | null;
    longitude: number | null;
    google_place_id: string | null;
    postal_code: string | null;
    neighborhood_id: number | null;
    
    // Contact
    phone: string | null;
    email: string | null;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
    twitter: string | null;
    
    // Pricing
    price_level: number | null;
    currency: string | null;
    average_meal_price: number | null;
    
    // AI-Generated Content
    description: string | null;
    description_ar: string | null;
    short_description: string | null;
    meta_title: string | null;
    meta_description: string | null;
    review_sentiment: string | null;
    
    // Ratings
    overall_rating: number | null;
    google_rating: number | null;
    google_review_count: number | null;
    tripadvisor_rating: number | null;
    tripadvisor_review_count: number | null;
    opentable_rating: number | null;
    opentable_review_count: number | null;
    total_reviews_aggregated: number | null;
    rating_breakdown: any;
    
    // Images
    hero_image: string | null;
    logo_image: string | null;
    
    // Operational
    hours: any;
    menu_url: string | null;
    dress_code: string | null;
    reservations_policy: string | null;
    parking_info: string | null;
    payment_methods: string[] | null;
    average_visit_time_mins: number | null;
    
    // Relationships (IDs)
    restaurant_cuisine_ids: number[] | null;
    restaurant_category_ids: number[] | null;
    restaurant_feature_ids: number[] | null;
    restaurant_meal_ids: number[] | null;
    restaurant_good_for_ids: number[] | null;
    
    // Relationships (Resolved Objects)
    cuisines: Array<{ id: number; name: string; }> | [];
    categories: Array<{ id: number; name: string; }> | [];
    features: Array<{ id: number; name: string; }> | [];
    meals: Array<{ id: number; name: string; }> | [];
    good_for: Array<{ id: number; name: string; }> | [];
    neighborhood: { id: number; name: string; } | null;
    
    // Related Data
    dishes: Array<any> | [];
    faqs: Array<any> | [];
    images: Array<{ id: string; url: string; alt_text: string; }> | [];
    
    // Raw Data
    apify_output: any;
    firecrawl_output: any;
    firecrawl_menu_output: any;
    menu_data: any;
    ai_enhancement_output: any;
  };
  dishes: Array<any>;
  faqs: Array<any>;
  images: Array<any>;
  error_logs: any[];
}
```

**Note:** The `extracted_data` object includes all database fields when extraction status is `completed` or `failed`. During `in_progress` status, only minimal data is returned to reduce payload size.

### Admin UI Implementation

**Location:** `/admin/add`

**Layout:** 3-panel horizontal layout with fixed-width panels

#### Left Panel (w-80): Context & Progress
- **Context Section**
  - Page description and instructions
- **Restaurant Sources**
  - Google Places search input
  - Search results list with thumbnails
  - Selected restaurant card display
- **Run Button**
  - Triggers extraction pipeline
  - Shows loading state during extraction
- **Progress Tracker**
  - Real-time step status with icons
  - Progress percentage bar
  - Visual dividers between step groups
  - Completion/failure status messages

**Progress Indicators:**
- â­• Pending (gray circle)
- ðŸ”µ Running (blue spinner)
- âœ… Completed (green checkmark)
- âŒ Failed (red X with error message)

#### Center Panel (w-80): Extracted Data
Real-time display of all extracted restaurant data:

**Basic Info Section:**
- Google Place ID (monospace)
- Name (bold)
- Slug (monospace)
- Cuisine (comma-separated)
- Address (multi-line)
- Neighborhood/Area
- Phone number
- Latitude (4 decimals)
- Longitude (4 decimals)
- Price Range ($-$$$$)
- Website (clickable link, opens in new tab)
- Instagram (clickable "Visit" link)
- Facebook (clickable "Visit" link)
- Menu Source (clickable "View" link)

**Photos Section:**
- 4-column grid of restaurant images
- Grey placeholder boxes when no images
- Aspect-square sizing

**Ratings Section:**
- Google (rating â˜… + review count)
- TripAdvisor (rating â˜… + review count)
- OpenTable (rating â˜… + review count)

**Operation Info Section:**
- Hours (formatted time range)
- Reservations Required (Yes/No)
- Dress Code (text)

**Features Section:**
- List format (left-aligned text only)
- WiFi, Outdoor Seating, Parking Available, Family Friendly, etc.
- Separated by dividers

**Restaurant Meals Section:**
- List format (left-aligned text only)
- Breakfast, Lunch, Dinner, Brunch, Dessert, etc.
- Separated by dividers

**Accessibility Features Section:**
- List format (left-aligned text only)
- Wheelchair Accessible, Accessible Restrooms, etc.
- Separated by dividers

#### Right Panel (w-80): Menu
Complete menu organized by categories:

**Menu Sections:** (Appetizers, Main Courses, Desserts, Beverages)

Each menu item displays:
- **Header row:** Item name (left) + Price in KWD (right)
- **Description:** Full-width text below header
- **Divider:** Border between items

**Example Layout:**
```
Appetizers
â”œâ”€â”€ Buffalo Wings          3.500 KWD
â”‚   Spicy buffalo wings served with celery...
â”œâ”€â”€ Fried Calamari         4.200 KWD
â”‚   Crispy calamari with spicy marinara...
```

**Features:**
1. **Google Places Search** - Search and select restaurant by name
2. **One-Click Extraction** - "Run" button starts 9-step pipeline
3. **Real-time Progress** - Auto-polls every 2 seconds, updates all panels
4. **Live Data Display** - Shows extracted data as each step completes
5. **Error Handling** - Displays errors per step, continues on non-critical failures
6. **External Links** - All URLs open in new tabs (website, social media, menu sources)

### Error Handling

**Critical Failures (stop pipeline):**
- `apify_fetch` - No restaurant data available

**Non-Critical Failures (continue pipeline):**
- `apify_reviews` - Proceed without reviews
- `apify_images` - Use Google Places photos
- `firecrawl_fetch` - Skip website content
- `uploading_images` - Proceed with Google photos
- `generating_content` - Skip AI enhancement

**Error Logging:**
```json
{
  "error_logs": [
    {
      "timestamp": "2025-10-08T10:01:45Z",
      "step": "apify_reviews",
      "message": "Actor run failed",
      "stack": "..."
    }
  ]
}
```

### Cost Optimization

**Anthropic API Token Usage:**
- Input tokens: ~6,500 per extraction (after optimization)
- Output tokens: ~1,500 per extraction
- Cost per extraction: ~$0.023
- Monthly cost (100 restaurants): ~$2.30

**Optimization Strategies:**
1. Limited reviews to 10 (from 50) â†’ 63% cost reduction
2. Truncate website content to 1,500 chars
3. Limit menu items to 20
4. Use efficient prompt structure

**Apify Credits:**
- Google Places Details: ~0.01 credits
- Google Reviews (500): ~0.5 credits
- Google Images (10): ~0.05 credits
- Cost per extraction: ~0.56 credits (~$0.056)

### Performance

**Average Extraction Time:**
- Step 1 (Places): 10-15 seconds
- Step 2 (Reviews): 60-90 seconds (500 reviews)
- Step 3 (Images): 30-45 seconds
- Step 4 (Website): 15-30 seconds
- Step 5 (Filter): <1 second
- Step 6 (Upload): 30-45 seconds (10 images)
- Step 7 (AI): 15-20 seconds
- Step 8 (Mapping): <1 second
- Step 9 (Database): 5-10 seconds

**Total:** ~3-5 minutes per restaurant

### Implementation Files

```
src/
â”œâ”€â”€ lib/
â”‚   â””â”€â”€ services/
â”‚       â”œâ”€â”€ extraction-orchestrator.ts   # Main pipeline coordinator
â”‚       â”œâ”€â”€ apify-client.ts              # Apify API integration
â”‚       â”œâ”€â”€ firecrawl-client.ts          # Website scraping
â”‚       â””â”€â”€ anthropic-client.ts          # AI content generation
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ admin/
â”‚   â”‚   â””â”€â”€ add/
â”‚   â”‚       â””â”€â”€ page.tsx                 # Admin UI
â”‚   â””â”€â”€ api/
â”‚       â””â”€â”€ admin/
â”‚           â”œâ”€â”€ search-places/
â”‚           â”‚   â””â”€â”€ route.ts             # Google Places search
â”‚           â”œâ”€â”€ start-extraction/
â”‚           â”‚   â””â”€â”€ route.ts             # Start pipeline
â”‚           â””â”€â”€ extraction-status/
â”‚               â””â”€â”€ [jobId]/
â”‚                   â””â”€â”€ route.ts         # Poll status
```

### Future Enhancements

1. **AI Vision Quality Scoring** - Automatic image quality assessment
2. **Menu AI Extraction** - Structured menu data from website/images
3. **Duplicate Detection** - Prevent adding same restaurant twice
4. **Batch Processing** - Queue multiple restaurants
5. **Webhook Notifications** - Notify admin when extraction completes
6. **TripAdvisor Integration** - Scrape TripAdvisor data
7. **Instagram Integration** - Pull recent posts and photos
8. **Retry Logic** - Automatic retry for transient failures
9. **Cost Tracking** - Monitor API costs per extraction

---

## Related Documentation

- [Schema.org Implementation](./SCHEMA_ORG_IMPLEMENTATION.md)
- [Admin Workflow](./ADMIN_WORKFLOW.md)
- [API Integration](./API_INTEGRATION.md)
- [SEO Strategy](./SEO_STRATEGY.md)
- [Data Scraping](./DATA_SCRAPING.md)

---

*Last Updated: 2025-10-08*
*Version: 1.2*
