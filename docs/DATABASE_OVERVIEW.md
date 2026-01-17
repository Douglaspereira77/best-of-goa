# Best of Goa - Database Architecture Overview

## Project Scope

Best of Goa is a comprehensive directory platform covering multiple categories of locations and services across Goa. The platform is designed to rank #1 in organic search (both traditional and LLM search) by providing rich, structured, SEO-optimized content.

---

## Content Categories

The platform covers the following main categories:

1. **Restaurants** - Dining establishments, cafes, food trucks
2. **Hotels** - Hotels, resorts, serviced apartments
3. **Attractions** - Tourist attractions, landmarks, entertainment venues
4. **Malls** - Shopping malls and retail centers
5. **Schools** - Educational institutions (primary, secondary, higher education)
6. **Gyms** - Fitness centers, sports facilities, wellness centers

Each category has its own specialized schema while sharing common core functionality.

---

## Architecture Philosophy

### Shared vs. Specialized

- **Shared Core**: Location data, ratings, reviews, images, SEO fields
- **Specialized Fields**: Each category has unique attributes (e.g., hotels have rooms, schools have grade levels)
- **Reference Tables**: Shared across all categories (areas, features, awards)
- **Content Tables**: Category-specific (restaurant dishes, hotel rooms, school programs)

### Naming Convention

All database tables, folders, and documentation follow this pattern:

```
restaurants_*        // Restaurant-specific
hotels_*            // Hotel-specific
attractions_*       // Attraction-specific
malls_*            // Mall-specific
schools_*          // School-specific
gyms_*             // Gym-specific
shared_*           // Shared across all categories
```

---

## Folder Structure

```
/docs
  â”œâ”€â”€ DATABASE_OVERVIEW.md                    (This file - high-level overview)
  â”œâ”€â”€ DATABASE_ARCHITECTURE_RESTAURANTS.md    (Restaurant schema)
  â”œâ”€â”€ DATABASE_ARCHITECTURE_HOTELS.md         (Hotel schema)
  â”œâ”€â”€ DATABASE_ARCHITECTURE_ATTRACTIONS.md    (Attraction schema)
  â”œâ”€â”€ DATABASE_ARCHITECTURE_MALLS.md          (Mall schema)
  â”œâ”€â”€ DATABASE_ARCHITECTURE_SCHOOLS.md        (School schema)
  â”œâ”€â”€ DATABASE_ARCHITECTURE_GYMS.md           (Gym schema)
  â”œâ”€â”€ DATABASE_SHARED_TABLES.md               (Shared reference tables)
  â”œâ”€â”€ API_INTEGRATION.md                      (API docs)
  â”œâ”€â”€ ADMIN_WORKFLOW.md                       (Admin process)
  â”œâ”€â”€ SEO_STRATEGY.md                         (SEO approach)
  â””â”€â”€ DATA_SCRAPING.md                        (Scraping workflows)
```

---

## Database Table Naming

### Restaurants
```
restaurants                 // Main table
restaurants_cuisines        // Cuisine types
restaurants_categories      // Categories (casual, fine dining)
restaurants_good_for        // Experience tags (date night, family)
restaurants_features        // Features & amenities
restaurants_meals           // Meal types (breakfast, lunch)
restaurants_dishes          // Menu items
restaurants_menu_sections   // Menu organization
restaurants_images          // Image gallery
restaurants_faqs            // FAQ content
restaurants_dish_types      // Global dish categories
```

### Hotels
```
hotels                      // Main table
hotels_categories           // Categories (luxury, budget, resort)
hotels_room_types           // Room categories (standard, suite, villa)
hotels_rooms                // Individual room types
hotels_amenities            // Hotel amenities
hotels_facilities           // Facilities (pool, spa, gym)
hotels_images               // Image gallery
hotels_faqs                 // FAQ content
hotels_policies             // Cancellation, check-in policies
```

### Attractions
```
attractions                 // Main table
attractions_categories      // Categories (museum, theme park, landmark)
attractions_types           // Attraction types
attractions_features        // Features & amenities
attractions_tickets         // Ticket types & pricing
attractions_images          // Image gallery
attractions_faqs            // FAQ content
attractions_events          // Special events
```

### Malls
```
malls                       // Main table
malls_categories            // Categories (luxury, outlet, mixed-use)
malls_stores                // Store directory
malls_dining                // Dining options (links to restaurants)
malls_amenities             // Mall amenities
malls_parking               // Parking details
malls_images                // Image gallery
malls_faqs                  // FAQ content
malls_events                // Mall events & promotions
```

### Schools
```
schools                     // Main table
schools_categories          // Categories (private, public, international)
schools_types               // School types (primary, secondary, university)
schools_curricula           // Curriculum types (British, American, IB)
schools_programs            // Academic programs
schools_facilities          // School facilities
schools_extracurricular     // Sports, clubs, activities
schools_admission           // Admission requirements
schools_images              // Image gallery
schools_faqs                // FAQ content
```

### Gyms
```
gyms                        // Main table
gyms_categories             // Categories (boutique, chain, crossfit)
gyms_types                  // Gym types (24/7, women-only, premium)
gyms_facilities             // Facilities & equipment
gyms_classes                // Class types offered
gyms_trainers               // Personal trainers
gyms_memberships            // Membership tiers & pricing
gyms_amenities              // Amenities (sauna, pool, parking)
gyms_images                 // Image gallery
gyms_faqs                   // FAQ content
```

### Shared Tables (Used by All)
```
shared_areas                // Goa areas/neighborhoods + major shopping destinations
shared_features             // Common features (parking, wifi, accessibility)
shared_awards               // Awards & recognitions
shared_reviews              // User reviews (polymorphic)
shared_ratings              // Rating system
shared_sentiment            // Review sentiment analysis
shared_mentions             // Social media & blog mentions
```

**Enhanced Areas/Neighborhoods System:**
- **140 total neighborhoods** including traditional areas and major shopping destinations
- **24 major malls** treated as dedicated neighborhoods (The Avenues, Marina Mall, etc.)
- **Address keyword detection** for precise mapping (e.g., "The Avenues Mall" â†’ The Avenues neighborhood)
- **Priority-based mapping**: Mall keywords override general area mappings
- **SEO-optimized**: Each mall gets its own neighborhood page (/areas/the-avenues/restaurants)

---

## URL Structure

### Category-Based URLs

```
/places-to-eat/                             (Restaurants)
  â”œâ”€â”€ restaurants/
  â”œâ”€â”€ cuisines/
  â””â”€â”€ dishes/

/places-to-stay/                            (Hotels)
  â”œâ”€â”€ hotels/
  â”œâ”€â”€ resorts/
  â””â”€â”€ serviced-apartments/

/things-to-do/                              (Attractions)
  â”œâ”€â”€ attractions/
  â”œâ”€â”€ museums/
  â”œâ”€â”€ theme-parks/
  â””â”€â”€ landmarks/

/shopping/                                  (Malls)
  â”œâ”€â”€ malls/
  â”œâ”€â”€ outlet-malls/
  â””â”€â”€ shopping-centers/

/education/                                 (Schools)
  â”œâ”€â”€ schools/
  â”œâ”€â”€ universities/
  â”œâ”€â”€ kindergartens/
  â””â”€â”€ curricula/

/fitness/                                   (Gyms)
  â”œâ”€â”€ gyms/
  â”œâ”€â”€ fitness-centers/
  â”œâ”€â”€ yoga-studios/
  â””â”€â”€ crossfit/

/areas/{area-name}/                         (Location pages)
  â”œâ”€â”€ restaurants/
  â”œâ”€â”€ hotels/
  â”œâ”€â”€ attractions/
  â”œâ”€â”€ malls/
  â”œâ”€â”€ schools/
  â””â”€â”€ gyms/
```

---

## Shared Core Schema

All main category tables share these core fields:

```sql
-- Common to all: restaurants, hotels, attractions, malls, schools, gyms
CREATE TABLE {category}_base (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,

  -- Location
  address TEXT NOT NULL,
  area TEXT NOT NULL,
  country_code TEXT DEFAULT 'KW',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_place_id TEXT UNIQUE,

  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,

  -- Content
  description TEXT,
  description_ar TEXT,
  short_description TEXT,

  -- Images
  hero_image TEXT,
  logo_image TEXT,

  -- Ratings (BestGoa.com algorithm)
  overall_rating DECIMAL(3, 2),
  rating_breakdown JSONB,
  total_reviews_aggregated INTEGER,

  -- External Ratings
  google_rating DECIMAL(2, 1),
  google_review_count INTEGER,
  tripadvisor_rating DECIMAL(2, 1),
  tripadvisor_review_count INTEGER,

  -- Sentiment
  review_sentiment TEXT,
  review_sentiment_updated_at TIMESTAMP,

  -- Operational
  hours JSONB,
  best_time_description TEXT,
  busy_times JSONB,
  quiet_times JSONB,

  -- Awards
  awards JSONB,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],

  -- Status
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_scraped_at TIMESTAMP
);
```

Then each category adds its specialized fields:

```sql
-- Restaurants add:
ALTER TABLE restaurants ADD COLUMN price_level INTEGER;
ALTER TABLE restaurants ADD COLUMN currency TEXT DEFAULT 'KWD';
ALTER TABLE restaurants ADD COLUMN dress_code TEXT;

-- Hotels add:
ALTER TABLE hotels ADD COLUMN star_rating INTEGER;
ALTER TABLE hotels ADD COLUMN check_in_time TIME;
ALTER TABLE hotels ADD COLUMN check_out_time TIME;

-- Attractions add:
ALTER TABLE attractions ADD COLUMN ticket_required BOOLEAN;
ALTER TABLE attractions ADD COLUMN ticket_price_range TEXT;
ALTER TABLE attractions ADD COLUMN duration_mins INTEGER;

-- And so on...
```

---

## Rating System (Shared)

All categories use the same rating methodology but with category-appropriate metrics:

### Restaurants
```json
{
  "food_quality": 9.65,
  "service": 9.85,
  "ambience": 9.60,
  "value_for_money": 8.90,
  "accessibility_amenities": 9.20
}
```

### Hotels
```json
{
  "room_quality": 9.50,
  "service": 9.70,
  "cleanliness": 9.80,
  "location": 9.30,
  "value_for_money": 8.90,
  "amenities": 9.40
}
```

### Attractions
```json
{
  "experience": 9.60,
  "value_for_money": 9.00,
  "facilities": 8.80,
  "accessibility": 9.20,
  "staff_service": 9.40
}
```

### Malls
```json
{
  "store_variety": 9.30,
  "dining_options": 9.20,
  "ambience": 9.50,
  "facilities": 9.40,
  "accessibility": 9.60,
  "parking": 8.90
}
```

### Schools
```json
{
  "academic_quality": 9.70,
  "facilities": 9.40,
  "teachers": 9.60,
  "extracurricular": 9.20,
  "value_for_money": 8.80,
  "parent_satisfaction": 9.50
}
```

### Gyms
```json
{
  "equipment_quality": 9.30,
  "cleanliness": 9.60,
  "staff_service": 9.40,
  "facilities": 9.20,
  "value_for_money": 8.90,
  "location": 9.10
}
```

---

## Implementation Priority

### Phase 1: Restaurants (Current)
- Complete schema
- Admin workflow
- Data scraping pipeline
- SEO optimization

### Phase 2: Hotels
- Schema design
- Hotel-specific features (rooms, amenities)
- Booking integration consideration

### Phase 3: Attractions
- Schema design
- Ticketing system
- Event calendar integration

### Phase 4: Malls
- Schema design
- Store directory integration
- Link to restaurants within malls

### Phase 5: Schools
- Schema design
- Curriculum tracking
- Admission process info

### Phase 6: Gyms
- Schema design
- Class schedules
- Membership tiers

---

## Polymorphic Relationships

Some tables need to work across multiple categories:

### Reviews (Polymorphic)
```sql
CREATE TABLE shared_reviews (
  id UUID PRIMARY KEY,
  reviewable_type TEXT, -- 'restaurant', 'hotel', 'attraction', etc.
  reviewable_id UUID,   -- ID of the reviewed entity
  user_name TEXT,
  rating DECIMAL(2, 1),
  review_text TEXT,
  created_at TIMESTAMP
);

CREATE INDEX idx_reviews_polymorphic ON shared_reviews(reviewable_type, reviewable_id);
```

### Images (Polymorphic)
```sql
CREATE TABLE shared_images (
  id UUID PRIMARY KEY,
  imageable_type TEXT, -- 'restaurant', 'hotel', 'attraction', etc.
  imageable_id UUID,   -- ID of the entity
  url TEXT,
  type TEXT,
  approved BOOLEAN,
  created_at TIMESTAMP
);

CREATE INDEX idx_images_polymorphic ON shared_images(imageable_type, imageable_id);
```

**Alternative:** Keep separate image tables per category for better query performance.

---

## Cross-Category Features

### Area Pages
```
/areas/goa-city/
  â”œâ”€â”€ restaurants/      (All restaurants in Goa City)
  â”œâ”€â”€ hotels/           (All hotels in Goa City)
  â”œâ”€â”€ attractions/      (All attractions in Goa City)
  â”œâ”€â”€ malls/            (All malls in Goa City)
  â”œâ”€â”€ schools/          (All schools in Goa City)
  â””â”€â”€ gyms/             (All gyms in Goa City)
```

### Search Functionality
Global search across all categories:
```
Search: "Avenues"
Results:
  - The Avenues Mall (Mall)
  - The Cheesecake Factory at Avenues (Restaurant)
  - VOX Cinemas Avenues (Attraction)
  - Holiday Inn Goa Avenues (Hotel)
```

### Related Entities
```sql
-- Example: Link restaurants to malls
ALTER TABLE restaurants ADD COLUMN mall_id UUID REFERENCES malls(id);

-- Example: Link hotels to nearby attractions
CREATE TABLE hotels_nearby_attractions (
  hotel_id UUID REFERENCES hotels(id),
  attraction_id UUID REFERENCES attractions(id),
  distance_km DECIMAL(5, 2)
);
```

---

## Migration Strategy

### Order of Implementation

1. **Create shared tables first**
   - `shared_areas`
   - `shared_features`
   - `shared_awards`

2. **Create category schemas** (one at a time)
   - Start with `restaurants_*` tables
   - Then `hotels_*` tables
   - Continue with remaining categories

3. **Seed reference data**
   - Areas/neighborhoods
   - Common features
   - Award types

4. **Build admin workflows** (per category)
   - Restaurant admin â†’ Hotel admin â†’ etc.

---

## Documentation Structure

Each category gets its own detailed documentation file:

- **DATABASE_ARCHITECTURE_RESTAURANTS.md** - Complete restaurant schema
- **DATABASE_ARCHITECTURE_HOTELS.md** - Complete hotel schema
- **DATABASE_ARCHITECTURE_ATTRACTIONS.md** - Complete attraction schema
- **DATABASE_ARCHITECTURE_MALLS.md** - Complete mall schema
- **DATABASE_ARCHITECTURE_SCHOOLS.md** - Complete school schema
- **DATABASE_ARCHITECTURE_GYMS.md** - Complete gym schema
- **DATABASE_SHARED_TABLES.md** - Shared reference tables

---

## Admin Interface Structure

```
/admin
  â”œâ”€â”€ dashboard/              (Overview of all categories)
  â”œâ”€â”€ restaurants/            (Restaurant management)
  â”œâ”€â”€ hotels/                 (Hotel management)
  â”œâ”€â”€ attractions/            (Attraction management)
  â”œâ”€â”€ malls/                  (Mall management)
  â”œâ”€â”€ schools/                (School management)
  â”œâ”€â”€ gyms/                   (Gym management)
  â”œâ”€â”€ shared/
  â”‚   â”œâ”€â”€ areas/              (Manage areas/neighborhoods)
  â”‚   â”œâ”€â”€ features/           (Manage features)
  â”‚   â””â”€â”€ awards/             (Manage awards)
  â””â”€â”€ settings/               (Global settings)
```

---

## API Endpoint Structure

```
/api/v1/restaurants/*
/api/v1/hotels/*
/api/v1/attractions/*
/api/v1/malls/*
/api/v1/schools/*
/api/v1/gyms/*
/api/v1/shared/areas/*
/api/v1/shared/features/*
/api/v1/search/*              (Global search)
```

---

## Next Steps

1. âœ… Complete `DATABASE_ARCHITECTURE_RESTAURANTS.md` (Done)
2. Create `DATABASE_SHARED_TABLES.md`
3. Create category-specific architecture docs as needed
4. Build Supabase migrations for restaurants
5. Implement admin workflow for restaurants
6. Expand to other categories

---

*Last Updated: 2025-10-04*
*Version: 1.0*
