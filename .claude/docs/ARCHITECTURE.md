# Best of Goa - Project Architecture

## Tech Stack
- **Framework:** Next.js 15.5.4 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4 (CSS-first configuration)
- **UI Components:** shadcn/ui (70+ pre-installed components)
- **Database:** Supabase (PostgreSQL + Edge Functions)
- **External APIs:**
  - Apify (Google Places scraping)
  - Firecrawl (Web scraping + AI extraction)
  - OpenAI (GPT-4o for AI enhancement)
  - Anthropic (Claude API for advanced processing)

## Directory Structure

```
src/
â”œâ”€â”€ app/                          # Next.js App Router
â”‚   â”œâ”€â”€ admin/                   # Admin dashboard & management
â”‚   â”‚   â”œâ”€â”€ page.tsx            # Main dashboard
â”‚   â”‚   â”œâ”€â”€ restaurants/        # Restaurant management section
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx       # All restaurants list
â”‚   â”‚   â”‚   â”œâ”€â”€ add/           # Add new restaurants
â”‚   â”‚   â”‚   â”œâ”€â”€ queue/         # Extraction job queue
â”‚   â”‚   â”‚   â””â”€â”€ [id]/review/   # Restaurant review pages
â”‚   â”‚   â”œâ”€â”€ hotels/             # Hotel management section
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx       # All hotels list
â”‚   â”‚   â”‚   â”œâ”€â”€ add/            # Add new hotels
â”‚   â”‚   â”‚   â”œâ”€â”€ queue/          # Hotel extraction queue
â”‚   â”‚   â”‚   â””â”€â”€ [id]/review/    # Hotel review pages
â”‚   â”‚   â”œâ”€â”€ malls/              # Mall management section
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx       # All malls list
â”‚   â”‚   â”‚   â”œâ”€â”€ add/            # Add new malls
â”‚   â”‚   â”‚   â”œâ”€â”€ queue/          # Mall extraction queue
â”‚   â”‚   â”‚   â””â”€â”€ [id]/review/    # Mall review pages
â”‚   â”‚   â”œâ”€â”€ fitness/            # Fitness management section
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx       # All fitness places list
â”‚   â”‚   â”‚   â”œâ”€â”€ add/            # Add new fitness places
â”‚   â”‚   â”‚   â”œâ”€â”€ queue/          # Fitness extraction queue
â”‚   â”‚   â”‚   â””â”€â”€ [id]/review/    # Fitness review pages
â”‚   â”‚   â””â”€â”€ attractions/        # Attractions management section
â”‚   â”‚       â”œâ”€â”€ page.tsx       # All attractions list
â”‚   â”‚       â”œâ”€â”€ add/            # Add new attractions
â”‚   â”‚       â”œâ”€â”€ queue/          # Attraction extraction queue
â”‚   â”‚       â””â”€â”€ [id]/review/    # Attraction review pages (with delete)
â”‚   â”œâ”€â”€ api/                     # API routes & endpoints
â”‚   â”‚   â””â”€â”€ admin/               # Admin API endpoints
â”‚   â”œâ”€â”€ places-to-eat/          # PUBLIC: Restaurant directory
â”‚   â”‚   â”œâ”€â”€ page.tsx            # Hub page (/places-to-eat)
â”‚   â”‚   â”œâ”€â”€ [cuisine]/          # Cuisine category pages (/japanese, /indian)
â”‚   â”‚   â”œâ”€â”€ dishes/             # Dish type pages
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx       # Dishes hub (/places-to-eat/dishes)
â”‚   â”‚   â”‚   â””â”€â”€ [dish]/        # Individual dish pages (/dishes/steak)
â”‚   â”‚   â”œâ”€â”€ in/                 # Governorate pages
â”‚   â”‚   â”‚   â””â”€â”€ [governorate]/ # Individual governorate pages (/in/goa-city)
â”‚   â”‚   â””â”€â”€ restaurants/[slug]/ # Individual restaurant pages
â”‚   â”œâ”€â”€ places-to-stay/         # PUBLIC: Hotel directory
â”‚   â”‚   â”œâ”€â”€ page.tsx            # Hub page (/places-to-stay)
â”‚   â”‚   â”œâ”€â”€ [category]/         # Category pages (luxury, budget, etc.)
â”‚   â”‚   â””â”€â”€ hotels/[slug]/      # Individual hotel pages
â”‚   â”œâ”€â”€ places-to-shop/         # PUBLIC: Mall directory
â”‚   â”‚   â”œâ”€â”€ page.tsx            # Hub page (/places-to-shop)
â”‚   â”‚   â””â”€â”€ malls/[slug]/       # Individual mall pages
â”‚   â”œâ”€â”€ hotels/[slug]/          # LEGACY: Redirects to /places-to-stay/hotels/[slug]
â”‚   â”œâ”€â”€ blog/                    # PUBLIC: Blog articles
â”‚   â”‚   â”œâ”€â”€ page.tsx            # Blog index (/blog)
â”‚   â”‚   â””â”€â”€ [category]/         # Category pages
â”‚   â”‚       â”œâ”€â”€ page.tsx        # Category listing (/blog/restaurants)
â”‚   â”‚       â””â”€â”€ [slug]/         # Individual articles (/blog/restaurants/best-breakfast)
â”‚   â”œâ”€â”€ application/             # Public application pages
â”‚   â”œâ”€â”€ dashboard/               # User dashboard
â”‚   â””â”€â”€ login/                   # Authentication
â”‚
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ admin/                   # Admin-specific UI components
â”‚   â”œâ”€â”€ layout/                  # Navigation & layout components
â”‚   â”‚   â”œâ”€â”€ PublicHeader.tsx    # Main site header (sticky, navigation, search)
â”‚   â”‚   â”œâ”€â”€ PublicFooter.tsx     # Site footer (links, newsletter, social)
â”‚   â”‚   â”œâ”€â”€ Breadcrumbs.tsx      # Breadcrumb navigation component
â”‚   â”‚   â””â”€â”€ PublicLayout.tsx     # Layout wrapper (excludes admin routes)
â”‚   â”œâ”€â”€ cuisine/                 # Restaurant category components
â”‚   â”‚   â”œâ”€â”€ RestaurantCard.tsx  # Restaurant grid card
â”‚   â”‚   â”œâ”€â”€ QuickFilterPills.tsx # Filter navigation
â”‚   â”‚   â””â”€â”€ GovernorateCard.tsx # Governorate display
â”‚   â”œâ”€â”€ hotel/                   # Hotel category components
â”‚   â”‚   â”œâ”€â”€ HotelCard.tsx       # Hotel grid card
â”‚   â”‚   â”œâ”€â”€ QuickFilterPills.tsx # Filter navigation
â”‚   â”‚   â”œâ”€â”€ GovernorateCard.tsx # Governorate cards
â”‚   â”‚   â”œâ”€â”€ HOKScoreCard.tsx    # Hotel score breakdown
â”‚   â”‚   â””â”€â”€ HotelPhotoGallery.tsx # Hotel photo gallery
â”‚   â”œâ”€â”€ mall/                    # Mall category components
â”‚   â”‚   â””â”€â”€ MallCard.tsx        # Mall grid card
â”‚   â”œâ”€â”€ fitness/                 # Fitness category components
â”‚   â”‚   â””â”€â”€ FitnessCard.tsx     # Fitness grid card (pending)
â”‚   â”œâ”€â”€ attraction/              # Attraction category components
â”‚   â”‚   â”œâ”€â”€ AttractionCard.tsx  # Attraction grid card
â”‚   â”‚   â””â”€â”€ AttractionGovernorateCard.tsx # Governorate cards with stats
â”‚   â”œâ”€â”€ blog/                    # Blog article components
â”‚   â”‚   â”œâ”€â”€ BlogCard.tsx        # Article preview card (regular + featured)
â”‚   â”‚   â””â”€â”€ BlogArticle.tsx     # Article content renderer + TableOfContents
â”‚   â””â”€â”€ ui/                      # shadcn/ui components (pre-installed)
â”‚
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ queries/                 # Database query helpers
â”‚   â”‚   â”œâ”€â”€ places-to-eat.ts    # Restaurant hub queries + governorate queries
â”‚   â”‚   â”‚   â”œâ”€â”€ getRestaurantsByGovernorate() # Get restaurants by governorate slug
â”‚   â”‚   â”‚   â”œâ”€â”€ getGovernorateBySlug()        # Get governorate data by slug
â”‚   â”‚   â”‚   â””â”€â”€ goaGovernorates            # Exported governorate list
â”‚   â”‚   â”œâ”€â”€ cuisine-pages.ts    # Cuisine category queries
â”‚   â”‚   â”œâ”€â”€ dish-pages.ts       # Dish type queries (sushi, burger, steak, etc.)
â”‚   â”‚   â”‚   â”œâ”€â”€ getRestaurantsByDish()        # Get restaurants serving a dish
â”‚   â”‚   â”‚   â”œâ”€â”€ getPopularDishesWithCounts()  # Get dishes with restaurant counts
â”‚   â”‚   â”‚   â””â”€â”€ dishTypes                     # Dish definitions with keywords
â”‚   â”‚   â”œâ”€â”€ restaurant.ts       # Individual restaurant queries
â”‚   â”‚   â”œâ”€â”€ places-to-stay.ts   # Hotel hub queries
â”‚   â”‚   â”œâ”€â”€ hotel-category-pages.ts # Hotel category queries
â”‚   â”‚   â”œâ”€â”€ hotel.ts            # Individual hotel queries
â”‚   â”‚   â”œâ”€â”€ mall.ts             # Mall queries
â”‚   â”‚   â”œâ”€â”€ fitness.ts          # Fitness queries
â”‚   â”‚   â”œâ”€â”€ places-to-visit.ts  # Attractions queries with category/governorate filters
â”‚   â”‚   â””â”€â”€ blog.ts             # Blog article queries + category definitions
â”‚   â”‚
â”‚   â”œâ”€â”€ services/                # Business logic services
â”‚   â”‚   â”œâ”€â”€ extraction-orchestrator.ts  # Multi-stage restaurant extraction
â”‚   â”‚   â”œâ”€â”€ hotel-extraction-orchestrator.ts # Hotel extraction pipeline
â”‚   â”‚   â”œâ”€â”€ mall-extraction-orchestrator.ts # Mall extraction pipeline
â”‚   â”‚   â”œâ”€â”€ fitness-extraction-orchestrator.ts # Fitness extraction pipeline
â”‚   â”‚   â”œâ”€â”€ attraction-extraction-orchestrator.ts # Attraction extraction pipeline
â”‚   â”‚   â”œâ”€â”€ social-media-search.ts      # 4-stage social media discovery
â”‚   â”‚   â”œâ”€â”€ firecrawl-client.ts         # Firecrawl API wrapper
â”‚   â”‚   â”œâ”€â”€ apify-client.ts             # Apify API wrapper
â”‚   â”‚   â”œâ”€â”€ openai-client.ts            # OpenAI integration
â”‚   â”‚   â”œâ”€â”€ anthropic-client.ts         # Anthropic Claude integration
â”‚   â”‚   â”œâ”€â”€ data-mapper.ts              # Restaurant data transformation
â”‚   â”‚   â”œâ”€â”€ fitness-data-mapper.ts      # Fitness data transformation
â”‚   â”‚   â”œâ”€â”€ image-extractor.ts          # Image processing
â”‚   â”‚   â”œâ”€â”€ mall-image-extractor.ts     # Mall image processing
â”‚   â”‚   â”œâ”€â”€ attraction-image-extractor.ts # Attraction image processing
â”‚   â”‚   â””â”€â”€ rating-service.ts           # Rating calculation
â”‚   â”‚
â”‚   â”œâ”€â”€ schema/                  # Schema.org structured data
â”‚   â”‚   â”œâ”€â”€ index.ts            # Main orchestrator & exports
â”‚   â”‚   â”œâ”€â”€ types.ts            # TypeScript interfaces
â”‚   â”‚   â”œâ”€â”€ generators/          # Schema.org generators
â”‚   â”‚   â”‚   â”œâ”€â”€ breadcrumb.ts   # Breadcrumb schemas
â”‚   â”‚   â”‚   â”œâ”€â”€ collection-page.ts # Collection page schemas
â”‚   â”‚   â”‚   â”œâ”€â”€ faq.ts          # FAQ schemas
â”‚   â”‚   â”‚   â”œâ”€â”€ hotel.ts        # Hotel schema generator
â”‚   â”‚   â”‚   â”œâ”€â”€ image.ts        # ImageObject schemas
â”‚   â”‚   â”‚   â”œâ”€â”€ mall.ts         # Mall schema generator
â”‚   â”‚   â”‚   â”œâ”€â”€ menu.ts         # Menu schemas
â”‚   â”‚   â”‚   â”œâ”€â”€ place.ts        # Place schemas
â”‚   â”‚   â”‚   â”œâ”€â”€ restaurant.ts   # Restaurant schema generator
â”‚   â”‚   â”‚   â”œâ”€â”€ review.ts       # Review schemas
â”‚   â”‚   â”‚   â””â”€â”€ school.ts       # School schema generator
â”‚   â”‚   â””â”€â”€ global/              # Site-wide schemas
â”‚   â”‚       â”œâ”€â”€ organization.ts # Organization schema
â”‚   â”‚       â””â”€â”€ website.ts      # WebSite schema
â”‚   â”‚
â”‚   â””â”€â”€ utils/                   # Utility functions
â”‚       â”œâ”€â”€ image-validation.ts  # Image validation
â”‚       â”œâ”€â”€ slug-generator.ts    # URL slug generation
â”‚       â””â”€â”€ restaurant-queries.ts # Database query helpers (legacy)
â”‚
â””â”€â”€ hooks/                       # React hooks
```

## URL Structure

### Restaurants
```
/places-to-eat                           # Hub page
/places-to-eat/[cuisine]                 # Cuisine category (e.g., /japanese, /indian)
/places-to-eat/dishes/[dish]             # Dish type pages (e.g., /dishes/steak, /dishes/sushi)
/places-to-eat/in/[governorate]          # Governorate pages (e.g., /in/goa-city, /in/hawalli)
/places-to-eat/restaurants/[slug]        # Individual restaurant
```

**Governorate Slugs:**
- `goa-city` - Areas: Goa City, Sharq, Dasma, Murouj, Salmiya
- `hawalli` - Areas: Hawalli, Salmiya, Rumaithiya, Jabriya, Mishref, Bayan, Salwa
- `farwaniya` - Areas: Farwaniya, Khaitan, Andalous
- `ahmadi` - Areas: Ahmadi, Fintas, Fahaheel, Mahboula, Mangaf
- `jahra` - Areas: Jahra, Sulaibiya, Saad Al Abdullah, Qasr
- `mubarak-al-kabeer` - Areas: Abu Halifa, Abu Fatira, Sabah Al Salem, Adan, Qurain, Qusour, Messila

**Dish Slugs:**
- `sushi`, `burger`, `shawarma`, `biryani`, `pizza`, `pasta`, `steak`, `seafood`
- `falafel`, `hummus`, `kebab`, `ramen`, `curry`, `tacos`, `fried_chicken`
- `dessert`, `breakfast`, `salad`

### Hotels
```
/places-to-stay                          # Hub page
/places-to-stay/[category]               # Category page (e.g., /luxury-hotels)
/places-to-stay/hotels/[slug]            # Individual hotel
```

### Malls
```
/places-to-shop                          # Hub page
/places-to-shop/malls/[slug]             # Individual mall
```

### Fitness
```
/things-to-do/fitness                    # Hub page (pending)
/things-to-do/fitness/[slug]             # Individual fitness place (pending)
```

### Attractions
```
/places-to-visit                         # Hub page
/places-to-visit?category=[slug]         # Category filter (e.g., ?category=cultural)
/places-to-visit?governorate=[slug]      # Governorate filter (e.g., ?governorate=goa-city)
/places-to-visit/attractions/[slug]      # Individual attraction
```

### Blog
```
/blog                                    # Blog index page
/blog/[category]                         # Category listing (e.g., /blog/restaurants)
/blog/[category]/[slug]                  # Individual article (e.g., /blog/restaurants/best-breakfast-spots-in-goa)
```

**Blog Categories:**
- `restaurants` - Food & dining guides
- `hotels` - Accommodation guides
- `malls` - Shopping guides
- `attractions` - Things to see guides
- `fitness` - Health & wellness guides
- `schools` - Education guides
- `guides` - General comprehensive guides

### Admin URLs
```
/admin                                   # Main dashboard
/admin/submissions                       # Business submissions from public form
/admin/restaurants                       # Restaurant list, add, queue, review
/admin/hotels                            # Hotel list, add, queue, review
/admin/malls                             # Mall list, add, queue, review
/admin/fitness                           # Fitness list, add, queue, review
/admin/attractions                       # Attraction list, add, queue, review
/admin/schools                           # School list, add, queue, review
/admin/blog                              # Blog article management
```

### Public Pages
```
/application                             # Public business submission form
/about                                   # About Us page with stats, story, contact
```

## Database Schema

### Main Tables
- **restaurants** - Restaurant listings with ratings, social media, operational data
- **hotels** - Hotel listings with star ratings, amenities, room info
- **malls** - Mall listings with ratings, categories, store count
- **fitness_places** - Fitness centers with gender policies, amenities, fitness types
- **attractions** - Tourist attractions with admission fees, visit duration, accessibility info

### Related Tables (CASCADE DELETE)
- **restaurants_dishes** - Menu items with popularity scores
- **restaurant_images** - Restaurant photos
- **restaurant_categories** - Restaurant category links
- **hotel_rooms** - Room types with pricing and features
- **hotel_images** - Hotel photos (CASCADE DELETE)
- **hotel_faqs** - Hotel FAQ content (CASCADE DELETE)
- **hotel_reviews** - Hotel reviews (CASCADE DELETE)
- **hotel_amenities** - Hotel amenities (CASCADE DELETE)
- **mall_stores** - Mall stores and tenants (CASCADE DELETE)
- **mall_images** - Mall photos (CASCADE DELETE)
- **mall_reviews** - Mall reviews (CASCADE DELETE)
- **mall_events** - Mall events (CASCADE DELETE)
- **mall_faqs** - Mall FAQ content (CASCADE DELETE)
- **mall_categories** - Mall category classifications
- **fitness_images** - Fitness place photos (CASCADE DELETE)
- **fitness_reviews** - Fitness reviews (CASCADE DELETE)
- **fitness_faqs** - Fitness FAQ content (CASCADE DELETE)
- **fitness_special_hours** - Special operating hours (CASCADE DELETE)
- **fitness_categories** - 10 standard fitness types (gym, yoga, crossfit, etc.)
- **fitness_amenities** - 31 amenity types (pool, sauna, parking, etc.)
- **fitness_features** - 22 facility features
- **attraction_images** - Attraction photo gallery (CASCADE DELETE)
- **attraction_reviews** - Attraction reviews from multiple sources (CASCADE DELETE)
- **attraction_faqs** - Attraction FAQ content (CASCADE DELETE)
- **attraction_special_hours** - Special opening hours (CASCADE DELETE)
- **business_submissions** - Public form submissions for admin review
- **blog_articles** - Blog article content with JSONB structured content
- **blog_article_listings** - Junction table linking articles to directory listings

### Key Fields
| Restaurants | Hotels | Malls | Fitness |
|------------|--------|-------|---------|
| `overall_rating` (10-point) | `google_rating` (5-point) | `google_rating` (5-point) | `google_rating` (5-point) |
| `total_reviews_aggregated` | `google_review_count` | `google_review_count` | `google_review_count` |
| `price_level` (1-4 dollars) | `star_rating` (1-5 stars) | `store_count` | `gender_policy` (co-ed/women-only/men-only) |
| Cuisines (Japanese, Italian) | Categories (Luxury, Budget, Resort) | Categories (Shopping Mall, Outlet) | Types TEXT[] (gym, yoga, crossfit) |
| - | - | - | `amenities` JSONB (pool, sauna, parking) |

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/admin/extraction-status/[jobId]` | Check extraction job progress |
| `/api/admin/restaurants/[id]` | GET/PUT/DELETE restaurant |
| `/api/admin/restaurants/[id]/review` | Get restaurant review details |
| `/api/admin/restaurants/[id]/publish` | POST: Publish/unpublish restaurant (updates both `published` boolean and `status` field) |
| `/api/admin/hotels/[id]` | GET/PUT/DELETE hotel |
| `/api/admin/hotels/[id]/review` | Get hotel review details |
| `/api/admin/hotels/[id]/publish` | POST: Publish/unpublish hotel |
| `/api/admin/malls/[id]` | GET/PUT/DELETE mall |
| `/api/admin/malls/[id]/review` | Get mall review details |
| `/api/admin/malls/[id]/publish` | POST: Publish/unpublish mall |
| `/api/admin/fitness/[id]` | GET/PUT/DELETE fitness place |
| `/api/admin/fitness/[id]/review` | Get fitness review details |
| `/api/admin/fitness/[id]/publish` | POST: Publish/unpublish fitness place |
| `/api/admin/attractions/[id]` | GET/PUT/DELETE attraction |
| `/api/admin/attractions/[id]/review` | Get attraction review details |
| `/api/admin/attractions/[id]/publish` | POST: Publish/unpublish attraction |
| `/api/admin/schools/[id]/publish` | POST: Publish/unpublish school |
| `/api/admin/fitness/queue` | Get fitness extraction queue |
| `/api/admin/search-places` | Search Google Maps |
| `/api/admin/submissions/list` | List business submissions with filters |
| `/api/admin/submissions/[id]` | GET/PATCH/DELETE submission |
| `/api/submissions` | POST: Public submission form endpoint |
| `/api/search/restaurants` | Public restaurant search |
| `/api/search/hotels` | Public hotel search |

### Blog System

| Route | Purpose |
|-------|---------|
| `scripts/generate-blog-articles.js` | GPT-4o blog article generator |
| `/api/admin/blog/list` | GET: List all blog articles with filters |
| `/api/admin/blog/[id]` | GET/DELETE: Get or delete article |
| `/api/admin/blog/[id]/publish` | POST: Publish/unpublish article |

**Blog Admin Panel (`/admin/blog`):**
- Table view of all articles with thumbnails
- Filter by category (restaurants, hotels, malls, attractions, fitness, schools, guides)
- Filter by status (published, draft)
- Search by title
- Stats cards (Total, Published, Drafts, Featured)
- Publish/unpublish with confirmation dialog
- Delete with confirmation dialog
- External link to view published articles
- Star indicator for featured articles

**Blog Generation Script Features:**
- Fetches directory data (restaurants, hotels, attractions) with images
- Generates conversational content with GPT-4o
- Creates structured JSONB content (intro, listings, FAQs, conclusion)
- Links articles to directory listings via junction table
- Filters for listings with `hero_image` only

## Key Service Files

| Service | Purpose |
|---------|---------|
| `extraction-orchestrator.ts` | 12-step restaurant extraction |
| `hotel-extraction-orchestrator.ts` | 13-step hotel extraction |
| `mall-extraction-orchestrator.ts` | Mall extraction pipeline |
| `fitness-extraction-orchestrator.ts` | 7-step fitness extraction |
| `attraction-extraction-orchestrator.ts` | 7-step attraction extraction |
| `social-media-search.ts` | Multi-stage social discovery |
| `firecrawl-client.ts` | Firecrawl API wrapper |
| `apify-client.ts` | Apify API wrapper |
| `openai-client.ts` | OpenAI GPT-4o integration |
| `data-mapper.ts` | Restaurant data normalization |
| `fitness-data-mapper.ts` | Fitness data normalization |
| `image-extractor.ts` | Image processing & upload |
| `mall-image-extractor.ts` | Mall image processing & upload |
| `attraction-image-extractor.ts` | **Attraction Vision AI image processing** |

## Project Status (November 2025)

### Content Extracted

| Entity | Count | Success Rate | Status |
|--------|-------|--------------|--------|
| **Hotels** | 72 | 98.6% (72/73) | âœ… Complete |
| **Malls** | 37 | 100% (37/37) | âœ… Complete |
| **Restaurants** | 469 | - | âœ… Complete |
| **Attractions** | 52 | 100% (51/51 + Museum) | âœ… Complete with Vision AI |
| **Fitness** | 3 | 100% (3/3) | ðŸ”§ In Development |

### Hotel Extraction Details

Successfully bulk extracted 72 hotels for Goa directory:

**Top Hotels Include:**
- Waldorf Astoria Goa (4.9â­, 3,765 reviews)
- Grand Hyatt Goa Residences (5.0â­ TA)
- Four Seasons Hotel Goa (4.6â­, 5,021 reviews)
- Jumeirah Messilah Beach (4.5â­, 6,515 reviews)
- Hampton by Hilton Goa (4.7â­, 442 reviews)
- Sheraton Goa (4.6â­)
- Millennium Central Goa (4.8â­, 7,105 reviews)
- Radisson Blu Hotel Goa (4.6â­, 6,267 reviews)

**Data Quality:**
- AI-generated descriptions for each hotel
- Review sentiment analysis
- Hero images uploaded to Supabase Storage
- Social media profiles discovered (6 platforms)
- SEO metadata generated
- 14+ amenities mapped per hotel average

**Extraction Cost:** ~$75 (discovery + extraction)
**Time:** ~4 hours automated processing

### Bulk Extraction Scripts

Located in `bin/`:
- `discover-goa-hotels.js` - Google Places discovery
- `merge-hotel-lists.js` - Merge TripAdvisor + Google data
- `fetch-missing-hotel-place-ids.js` - Fetch missing Place IDs
- `extract-hotels-from-discovery.js` - Batch extraction orchestrator
- `verify-hotel-extraction.js` - Verify results

See `HOTEL_EXTRACTION.md` for full documentation.

### Mall Extraction Details

Successfully extracted 37 malls for Goa directory:

**Major Malls Include:**
- The Avenues Mall - Goa's largest mall
- 360 Mall - Luxury shopping destination
- Al Kout Mall - Seaside shopping center
- Marina Mall - Salmiya landmark
- Grand Avenue - The Avenues - Premium retail
- Gate Mall - Modern shopping center
- Olympia Mall - Family entertainment
- Laila Gallery - Traditional shopping

**Data Quality:**
- AI-generated descriptions for each mall
- 8-10 high-quality images per mall (349 total images)
- Operating hours in structured format
- Contact information (phone, email, website)
- Social media profiles discovered (6 platforms)
- SEO metadata generated
- Neighborhood mapping complete

**Extraction Cost:** ~$18.50 (37 malls)
**Time:** ~1-2 hours automated processing

### Mall Management Scripts

Located in `bin/`:
- `audit-mall-completeness.js` - Complete audit of all malls
- `count-all-mall-images.js` - Count images in storage vs database
- `sync-storage-images-to-db.js` - Sync storage images to database
- `re-extract-failed-mall-images.js` - Re-extract images for failed malls
- `batch-import-malls.js` - Batch import malls from list
- `setup-malls-storage.js` - Setup Supabase Storage buckets

See `MALL_EXTRACTION.md` for full documentation.

### Fitness System Implementation (November 2025)

**Status:** ðŸ”§ In Development - Admin system complete, public pages pending

Successfully implemented complete admin system for fitness category:

**Test Data:**
- 3 gyms imported from Apify data (Flare Fitness Women Downtown, The Scandinavian Gym, Oxygen Gym Sabah Salem)

**System Features:**
- Gender policy classification (co-ed, women-only, men-only, separate-hours)
- Flexible fitness types as TEXT[] tags (gym, yoga, crossfit, pilates, martial-arts, boxing, dance, cycling, swimming, personal-training)
- JSONB amenities for complex facility features
- Smart data mapping from Apify additionalInfo
- 7-step extraction pipeline
- Goa market optimization with cultural considerations

**Completed Components:**
- Database schema with migration (`20251118_fitness_system.sql`)
- Data mapper with smart amenities parsing (`fitness-data-mapper.ts`)
- Database queries with CRUD operations (`fitness.ts`)
- 7-step extraction orchestrator (`fitness-extraction-orchestrator.ts`)
- Admin list view with gender policy badges
- Admin add form with Google Places search
- Admin queue monitor with real-time progress
- Admin review page with 6 tabs (Basic Info, Fitness Details, Amenities, Contact, SEO, Raw Data)
- API endpoints for list, search, start extraction, review, publish, queue

**Pending:**
- Public listing page at `/things-to-do/fitness`
- Public detail page at `/things-to-do/fitness/[slug]`
- Bulk import scripts for Goa gyms

**Technical Highlights:**
- No junction tables - simplified tag-based categorization
- JSONB amenities for flexible querying
- Complete Apify/Firecrawl JSON storage for AI content generation
- Color-coded gender policy badges in admin UI
- Checkbox grid for amenities selection
- Multi-select fitness types with visual indicators

See `FITNESS_EXTRACTION.md` for full documentation.

### Attraction Extraction Details (November 2025)

Successfully extracted and processed 52 attractions with Vision AI for Goa directory:

**Major Attractions Include:**
- Goa Towers - Goa's iconic landmark (90/100 hero score)
- Grand Mosque of Goa - Magnificent Islamic architecture
- Al Shaheed Park - Modern urban park with skyline views
- Museum of Modern Art - Cultural heritage center
- Liberation Tower - Historical telecommunications tower
- Al Mubarakiya - Traditional souq marketplace
- Green Island - Family entertainment park
- Scientific Center - Educational marine life center

**Vision AI Processing (November 2025):**
- âœ… **All 51 attractions** processed with GPT-4o Vision API
- âœ… **~500 images** analyzed with AI-generated metadata
- âœ… **100% success rate** - zero failures across all batches
- âœ… **Clean SEO-friendly filenames** (no timestamps or index numbers)
- âœ… **Hero scores averaging 85-90/100** for selected primary images
- âœ… **Abstract art detection** - filtered from hero selection
- âœ… **Rich metadata in JSONB** - titles, descriptions, classifications

**Vision AI Metadata Generated:**
- **Alt Text:** SEO-optimized, max 125 chars (e.g., "Night view of Al-Muzaini Mosque in Goa City")
- **Title:** Stored in metadata JSONB (e.g., "Museum of Modern Art - Exterior View")
- **Description:** 2-3 sentence rich visual descriptions
- **Hero Score:** 0-100 AI assessment for primary image suitability
- **Content Classification:** Tagged arrays (museum, architecture, cultural, etc.)
- **Hero Selection:** AI-powered scoring with intelligent filtering

**Filename Format:**
```
{attraction-slug}-{ai-content-descriptor}.jpg
Examples:
- museum-of-modern-art-sharq-modern-exterior-skyline-background.jpg
- al-shaheed-park-al-soor-gardens-skyline-reflection-sunset-view.jpg
- goa-towers-iconic-illuminated-night-view.jpg
```

**Performance Metrics:**
- **Processing Time:** ~3 hours 5 minutes for 51 attractions
- **Vision API Success Rate:** 99.8% (11 timeouts out of ~500 images)
- **Average Images per Attraction:** ~9.8 images
- **Batch Processing:** 26 batches of 2 attractions each
- **Hero Score Distribution:** 42% scored 90-100, 31% scored 80-89

**Batch Extraction Script:**
```bash
npx tsx scripts/batch-reextract-attractions.js
```

**Technical Highlights:**
- GPT-4o Vision API integration with 45-second timeout protection
- Smart hero selection algorithm filtering abstract art
- Metadata stored in JSONB for flexibility
- Clean delete + re-extract approach for data freshness
- Automatic hero image URL updates on attractions table

**Category & Governorate Filtering (November 2025):**
- âœ… **Query parameter filtering** - `/places-to-visit?category=cultural`, `/places-to-visit?governorate=goa-city`
- âœ… **Dynamic filtered views** - Shows filtered results with result counts
- âœ… **Back navigation** - "Back to All Attractions" button on filtered views
- âœ… **Filter functions:**
  - `getAttractionsByCategorySlug(categorySlug)` - Filter by category slug
  - `getAttractionsByGovernorate(governorateSlug)` - Filter by governorate (maps to areas)
- âœ… **Governorate mapping** - Maps slugs to Goa areas (Goa City, Hawalli, Farwaniya, Ahmadi, Jahra, Mubarak Al-Kabeer)
- âœ… **Category cards** - Browse by category grid in premium dark section (#3) with glass-morphism styling
- âœ… **Governorate cards** - Browse by governorate in light section (#4) with attraction counts and average ratings

**Hub Page Visual Hierarchy:**
1. Hero Section - Search and introduction
2. Top Rated Attractions - Featured content
3. **Browse by Category** â­ - Dark gradient (slate-900/blue-900) with glass-morphism tiles - **Primary navigation**
4. **Best Attractions by Governorate** - Light gradient (gray-50/slate-50) - Secondary navigation
5. Family-Friendly Section - Themed content
6. Call to Action - Engagement

See `ATTRACTION_EXTRACTION.md` for complete Vision AI documentation.

## Admin Features

### Admin Security (December 2025)

**Status:** âœ… Complete

The admin section is protected with role-based access control:

**Protected Routes:**
- All `/admin/*` routes require authentication AND admin privileges
- Non-authenticated users â†’ Redirected to `/login`
- Authenticated but non-admin users â†’ Redirected to `/` with `?error=unauthorized`

**Implementation Layers:**

1. **Middleware Protection** (`src/lib/supabase/middleware.ts`)
   - Checks `is_admin` flag in profiles table
   - First line of defense for all admin routes

2. **Database RLS Policies** (`20251130_admin_security.sql`)
   - `is_admin()` function for RLS checks
   - Admins can view all business submissions
   - Admins can view all contact submissions
   - Users can only see their own submissions

3. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Exposes `isAdmin` boolean in auth context
   - Available to all client components

4. **Server Utilities** (`src/lib/auth/admin.ts`)
   - `isAdmin()` - Check if current user is admin
   - `getAdminUser()` - Get admin status with user info
   - `requireAdmin()` - Throw error if not admin (for server actions)

5. **Client Hook** (`src/hooks/useAdminGuard.ts`)
   - `useAdminGuard()` - Secondary protection for client components

**Admin Users:**
- Initial admin: `info@bestofgoa.com`
- Add more admins via SQL: `UPDATE profiles SET is_admin = TRUE WHERE email = 'new@email.com';`

**Database Schema:**
```sql
-- profiles table addition
is_admin BOOLEAN DEFAULT FALSE NOT NULL

-- Admin check function
CREATE FUNCTION public.is_admin() RETURNS BOOLEAN
```

**Migration:** `20251130_admin_security.sql`

### Publish/Unpublish Buttons on List Pages (November 2025)

All admin list pages now have **inline publish/unpublish buttons** for quick content management:

**Entities Supporting Publish/Unpublish:**
- âœ… Schools (`/admin/schools`)
- âœ… Hotels (`/admin/hotels`)
- âœ… Malls (`/admin/malls`)
- âœ… Fitness (`/admin/fitness`)
- âœ… Attractions (`/admin/attractions`)
- âœ… Restaurants (`/admin/restaurants`)

**UI Pattern:**
- **Green Eye icon** - Publish (shows for unpublished items)
- **Yellow EyeOff icon** - Unpublish (shows for published items)
- **Loading spinner** during publish/unpublish operation
- **Confirmation dialog** required for unpublish action
- **Toast notifications** for success/error feedback

**Database Fields Added:**
All entity tables now have:
- `published BOOLEAN DEFAULT false` - Publication status
- `published_at TIMESTAMP` - When entity was published
- Indexes: `idx_[entity]_published`, `idx_[entity]_active_published`

**API Pattern:**
All publish endpoints use `POST` with `{ action: 'publish' | 'unpublish' }`:
- `POST /api/admin/[entity]/[id]/publish`
- Updates `published`, `published_at`, and `active` fields
- Restaurants also update `status` field for backwards compatibility

**Migration:**
`supabase/migrations/20251128_add_published_fields_all_categories.sql`

### Publish and Redirect from Review Pages (November 2025)

Admin review pages **automatically redirect to the published page** after publishing:

**Entities Supporting Publish & Redirect:**
- âœ… Attractions (`/admin/attractions/[id]/review` â†’ `/places-to-visit/attractions/[slug]`)
- âœ… Restaurants (`/admin/restaurants/[id]/review` â†’ `/places-to-eat/restaurants/[slug]`)
- âœ… Hotels (`/admin/hotels/[id]/review` â†’ `/places-to-stay/hotels/[slug]`)
- âœ… Fitness (`/admin/fitness/[id]/review` â†’ `/things-to-do/fitness/[slug]`)
- âœ… Malls (`/admin/malls/[id]/review` â†’ `/places-to-shop/malls/[slug]`)
- âœ… Schools (`/admin/schools/[id]/review` â†’ `/places-to-learn/schools/[slug]`)

**Publish & Redirect Behavior:**
1. "Publish" button appears in status bar when entity is not active
2. On click: POST request to `/api/admin/[entity]/[id]/publish`
3. Success message: "Published successfully! Redirecting to published page..."
4. **1.5 second delay** to allow user to see confirmation
5. **Automatic redirect** to public page where end-users view the entity
6. User lands on published page to verify how it looks live

**UX Pattern:**
- Uses `isPublishing` state to track publish operation
- Shows different success message when publishing vs saving
- Redirect only happens on successful publish (errors keep user on review page)
- Requires entity to have a valid `slug` field for redirect

### Delete Functionality (November 2025)

All admin review pages now support **hard delete** with confirmation:

**Entities Supporting Delete:**
- âœ… Restaurants (`/admin/restaurants/[id]/review`)
- âœ… Hotels (`/admin/hotels/[id]/review`)
- âœ… Malls (`/admin/malls/[id]/review`)
- âœ… Fitness (`/admin/fitness/[id]/review`)
- âœ… Attractions (`/admin/attractions/[id]/review`)

**Delete Behavior:**
1. Red "Delete" button with trash icon in review page status bar
2. Native browser confirmation dialog: "Are you sure you want to delete this [entity]? This action cannot be undone."
3. DELETE request to `/api/admin/[entity]/[id]`
4. Database CASCADE DELETE removes all related data:
   - **Restaurants:** restaurant_images, menu_items, restaurant_categories
   - **Hotels:** hotel_images, hotel_rooms, hotel_faqs, hotel_reviews, hotel_amenities
   - **Malls:** mall_stores, mall_images, mall_reviews, mall_events, mall_faqs
   - **Fitness:** fitness_images, fitness_reviews, fitness_faqs, fitness_special_hours
   - **Attractions:** attraction_images, attraction_reviews, attraction_faqs, attraction_special_hours
5. Redirect to list page (`/admin/[entity]`) on success

**API Implementation:**
- Endpoint: `DELETE /api/admin/[entity]/[id]`
- Manual deletion of child records before parent (explicit CASCADE)
- Error handling with detailed error messages
- Success response: `{ success: true, message: '[Entity] deleted successfully' }`

### Business Submissions System (November 2025)

**Status:** âœ… Complete

Public-facing business submission form for users to suggest new places:

**Components:**
- `/application` - Public submission form with business details, location, contact info
- `/admin/submissions` - Admin panel to review, approve, reject submissions
- `business_submissions` table with RLS policies (public insert, admin read/update)

**Features:**
- Category selection (restaurant, hotel, mall, attraction, fitness, school)
- Business info (name, website, Google Maps link)
- Location (address, area, governorate)
- Contact info (phone, email, Instagram)
- Submitter info (name, email, relationship to business)
- Admin review workflow (pending â†’ in_review â†’ approved/rejected)
- Admin notes for internal tracking
- Status filter cards with counts
- Search by business or submitter name

**Security:**
- All "Submit/Suggest" buttons site-wide link to `/application` (not admin routes)
- RLS policies: Anyone can insert, only authenticated users can read/update
- No admin routes exposed on public-facing pages

**Links Updated (11 total):**
| Location | Button |
|----------|--------|
| PublicHeader (desktop) | Submit Business |
| PublicHeader (mobile) | Submit Business |
| PublicFooter | Submit Business |
| Homepage | Submit Your Business |
| `/places-to-eat` | Suggest a Restaurant |
| `/places-to-stay` | Suggest a Hotel |
| `/places-to-shop` | Suggest a Mall |
| `/places-to-visit` | Suggest an Attraction |
| `/places-to-learn` | Suggest a School |
| `/things-to-do` | Suggest an Activity |
| `/things-to-do/fitness` | Suggest a Fitness Place |

**Database Migration:**
`supabase/migrations/20251129_create_business_submissions.sql`

### SEO Implementation (December 2025)

**Status:** âœ… Complete

Comprehensive SEO infrastructure for ranking #1 in both traditional and LLM search results:

#### Phase 1: Infrastructure
- **`src/app/robots.ts`** - Programmatic robots.txt with LLM crawler support
  - Allows: GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot
  - Blocks: `/admin/`, `/api/`, `/dashboard/`, `/auth/`
  - References sitemap.xml
- **`src/app/sitemap.ts`** - Dynamic sitemap covering all entities
  - Restaurants, hotels, malls, attractions, schools, fitness
  - Cuisine pages, governorate pages
  - Hourly revalidation
- **Canonical URLs** - Added to cuisine, attraction, school, fitness pages

#### Phase 2: Schema.org Structured Data
- **Restaurant schema** - Full LocalBusiness + Restaurant markup
- **Hotel schema** - Hotel/LodgingBusiness with star ratings, amenities
- **School schema** - EducationalOrganization with curriculum, accreditation
- **Mall schema** - ShoppingCenter with store counts, operating hours
- **Breadcrumb schemas** - For all entity types
- **FAQ schemas** - For rich snippets
- **Review schemas** - AggregateRating embedded in entities

#### Phase 3: Dynamic OG Images
All entity types have branded social sharing images (`opengraph-image.tsx`):

| Entity | Location | Gradient |
|--------|----------|----------|
| Restaurants | `src/app/places-to-eat/restaurants/[slug]/` | Blue |
| Hotels | `src/app/places-to-stay/hotels/[slug]/` | Purple |
| Attractions | `src/app/places-to-visit/attractions/[slug]/` | Green |
| Schools | `src/app/places-to-learn/schools/[slug]/` | Cyan |
| Malls | `src/app/places-to-shop/malls/[slug]/` | Amber |
| Fitness | `src/app/things-to-do/fitness/[slug]/` | Red |

**OG Image Features:**
- 1200x630px standard size
- Entity name, location, rating
- Category-specific details (cuisines, star rating, curriculum, etc.)
- "Best of Goa" branding
- Next.js Edge Runtime for fast generation

### Next Milestones

- [ ] Review and publish 72 hotels from admin queue
- [ ] Public mall pages live at `/places-to-shop/malls/[slug]`
- [x] Public attractions hub page with category/governorate filtering
- [ ] Public attractions detail pages at `/places-to-visit/attractions/[slug]`
- [x] SEO optimization for directory pages
- [ ] Implement mall store directory feature