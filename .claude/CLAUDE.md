# 5 Day Sprint Framework - Claude Code Configuration
*Framework by Omar Choudhry | 5daysprint.com*

## PROJECT CONTEXT
**User**: Douglas
**Project**: Best of Goa
**Goal**: Directory of best places in Goa, ranking #1 in organic search (traditional + LLM)
**Reference**: bestdubai.com with enhanced features
**Tech Stack**: Next.js 15, TypeScript, Tailwind v4, shadcn/ui, Supabase

## DOCUMENTATION REFERENCES
For detailed information, see `.claude/docs/`:
- **ARCHITECTURE.md** - Project structure, tech stack, database schema
- **USER_SECTION.md** - User authentication and features (favorites, itineraries, submissions)
- **RESTAURANT_EXTRACTION.md** - 12-step restaurant extraction pipeline
- **HOTEL_EXTRACTION.md** - 13-step hotel extraction pipeline
- **MALL_EXTRACTION.md** - Mall extraction pipeline and documentation
- **ATTRACTION_EXTRACTION.md** - Attraction extraction with Vision AI
- **FITNESS_EXTRACTION.md** - 7-step fitness extraction pipeline with gender policies
- **SCHOOL_EXTRACTION.md** - 12-step school extraction pipeline with Vision AI
- **DEVELOPMENT_GUIDE.md** - Commands, workflows, design patterns

## MANDATORY FEEDBACK
**EVERY RESPONSE** must end with:
"COMPLETION SUMMARY: [1-line summary for Cursor Chat]"

Always address Douglas by name.

## CORE PRINCIPLES
- **Systematic Approach**: Follow structured development with clear priorities
- **Security-First**: ALL API keys in Supabase Edge Functions or `.env.local` only
- **shadcn/ui-First**: Use 70+ pre-installed components before custom solutions
- **Environment Parity**: Localhost must match production exactly
- **Web Search**: ALWAYS search for current API docs, library versions, best practices

## TAILWIND V4 + SHADCN/UI (CRITICAL)
- shadcn/ui officially supports Tailwind v4 (2025)
- CSS-first configuration with @theme directive
- OKLCH colors preferred over HSL
- DO NOT downgrade to v3

## SECURITY REQUIREMENTS
- **NEVER** store API keys in public files
- **ALL** secrets go in `.env.local` or Supabase Edge Functions
- Verify secure storage before any API integration

## SHADCN/UI ECOSYSTEM-FIRST
Before implementing ANY feature:
1. Check existing components in `src/components/ui/` first
2. Use official components AS-IS - never build custom when shadcn/ui exists
3. Complete ecosystem: 70+ components, dashboard blocks, sidebar variations

## AVAILABLE API CREDENTIALS
All in `.env.local` via `process.env.VARIABLE_NAME`:
- **Supabase**: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- **Vercel**: VERCEL_URL, VERCEL_PROJECT_ID
- **Firecrawl**: FIRECRAWL_API_KEY
- **OpenAI/Anthropic**: Individual API keys
- **Resend**: RESEND_API_KEY (for contact form email notifications)

Never ask Douglas to re-provide these.

## VERCEL ENVIRONMENT VARIABLES (CRITICAL)
These `NEXT_PUBLIC_` variables MUST be set in Vercel dashboard for production:

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth & database | **YES** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth & database | **YES** |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Maps embed | Recommended |
| `NEXT_PUBLIC_BASE_URL` | SEO schemas | Recommended |

**Without these, auth shows infinite spinner in production.**

Also add server-side vars: `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, `APIFY_API_TOKEN`, `RESEND_API_KEY`, `GOOGLE_PLACES_API_KEY`

**Note**: `GOOGLE_PLACES_API_KEY` (without `NEXT_PUBLIC_` prefix) is required for admin search-places API routes. The `NEXT_PUBLIC_` version is for client-side maps embed only.

## GOOGLE OAUTH SETUP
1. **Google Cloud Console**: Create OAuth 2.0 credentials with redirect URI: `https://qcqxcffgfdsqfrwwvabh.supabase.co/auth/v1/callback`
2. **Supabase Dashboard**: Enable Google provider with Client ID/Secret
3. See `.claude/docs/USER_SECTION.md` for detailed steps

## VERCEL DEPLOYMENT

### Live Site
- **Production URL**: Deployed on Vercel (auto-deploys from `main` branch)
- **Framework**: Next.js (must be set in Vercel Project Settings)

### Deployment Workflow
```bash
# 1. Make changes locally
# 2. Test with: npm run dev
# 3. Commit and push:
git add .
git commit -m "Description of changes"
git push
# 4. Vercel auto-deploys in 1-2 minutes
```

### Required Vercel Environment Variables
Set these in Vercel Dashboard â†’ Settings â†’ Environment Variables:
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (client-side) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-side) |
| `SUPABASE_URL` | Supabase project URL (server-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |

### Lazy Supabase Initialization (Build Compatibility)
All Supabase clients use lazy initialization to allow builds without env vars:
- `src/lib/supabase/server.ts` - Server-side client with placeholder fallback
- `src/lib/supabase/client.ts` - Browser client with placeholder fallback
- `src/lib/supabase/server-auth.ts` - Auth client with placeholder fallback
- `src/lib/supabase/middleware.ts` - Middleware skips if no credentials

**Pattern**: Check for env vars at runtime, return placeholder client during build.

## CORE COMMANDS
```bash
npm run dev           # Dev server (localhost:3000)
npm run build         # Production build
npm run type-check    # TypeScript checking
npm run lint:fix      # Fix linting
npm run format        # Format with Prettier
```

## HOMEPAGE DESIGN (Dec 2025)

### Design Overview
The homepage (`src/app/page.tsx`) features a custom design inspired by visitgoa.gov.kw:
- **Color Palette**: Royal Blue (#1e40af) + Gold (#f59e0b)
- **Font**: Google Font Inter (loaded via @import)
- **Custom Header/Footer**: Homepage uses its own header/footer, NOT PublicHeader/PublicFooter

### Hero Section
- **5 slides** with auto-advance (6 seconds)
- **Video support**: Slide 2 uses MP4 video (`/images/hero/BOK.mp4`)
- **Ken Burns effect**: 15% zoom + 2% pan over 10 seconds on images
- **Watermark**: Subtle "Best of Goa" text at 3% opacity
- **Universal Search**: Integrated search with debounce (300ms), grouped dropdown results by category

### Homepage Sections
1. **Hero Carousel** - Full viewport with search bar
2. **Categories** - 6 category cards with image overlays
3. **Destinations** - 6 governorate cards
4. **Stats** - 6 stat cards with icons
5. **Newsletter** - Email signup + app teaser
6. **Footer** - Links, social, legal

### Hero Images Location
```
public/images/hero/
â”œâ”€â”€ goa-city-dusk-skyline.jpg
â”œâ”€â”€ BOK.mp4                      # 720p video (5.9 MB)
â”œâ”€â”€ city-park-sunset-view.jpg
â”œâ”€â”€ luxury-infinity-pool-sunset.jpg
â””â”€â”€ sunset-marina-cityscape.jpg
```

### Category Images Location
```
public/images/categories/
â”œâ”€â”€ restaurants.jpg
â”œâ”€â”€ hotels.jpg
â”œâ”€â”€ malls.jpg
â”œâ”€â”€ attractions.jpg
â”œâ”€â”€ schools.jpg
â””â”€â”€ fitness.jpg
```

### Destination Images Location
```
public/images/destinations/
â”œâ”€â”€ goa-city.jpg
â”œâ”€â”€ hawalli.jpg
â”œâ”€â”€ salmiya.jpg
â”œâ”€â”€ farwaniya.jpg
â”œâ”€â”€ ahmadi.jpg
â””â”€â”€ jahra.jpg
```

### Brand Assets Location
```
public/Brandassets/
â”œâ”€â”€ text-white.png      # Compass logo (white) - used in homepage header/footer
â”œâ”€â”€ logo-white-h.png    # Horizontal logo with text (white)
â”œâ”€â”€ logo-blue.png       # Blue logo variant
â””â”€â”€ logo-blue-h.png     # Horizontal logo with text (blue)
```

### PublicLayout Exclusions
`src/components/layout/PublicLayout.tsx` excludes these routes from PublicHeader/PublicFooter:
- `/admin/*` - Admin pages (have their own layout)
- `/preview/*` - Preview pages (have custom header/footer)
- `/` - Homepage (has custom header/footer)

### CSS Animations (in page.tsx)
- `animate-ken-burns` - Zoom in + pan left
- `animate-ken-burns-alt` - Zoom out + pan right
- `animate-fade-in-up` - Fade in from bottom
- `animation-delay-200` / `animation-delay-400` - Staggered delays

### Scroll Animations
Uses Intersection Observer via `useScrollAnimation()` hook and `AnimatedSection` component for scroll-triggered animations.

## KEY DIRECTORIES
```
src/app/admin/                  # Admin dashboard
  submissions/                  # Business submissions review (from public form)
  restaurants/                  # Restaurant management (list, add, queue, review)
  hotels/                       # Hotel management (list, add, queue, review)
  malls/                        # Mall management (list, add, queue, review)
  fitness/                      # Fitness management (list, add, queue, review)
  attractions/                  # Attractions management (list, add, queue, review)
  schools/                      # School management (list, add, queue, review)
src/app/application/            # Public business submission form
src/app/places-to-eat/          # Restaurant directory (public)
src/app/places-to-stay/         # Hotel directory (public)
src/app/places-to-shop/         # Mall directory (public)
src/app/places-to-visit/        # Attractions directory (public) with filtering
src/app/places-to-learn/        # Schools directory (public) with search
src/app/things-to-do/           # Activities directory (public) with fitness
src/app/dashboard/              # User dashboard (authenticated)
src/app/favorites/              # User favorites page
src/app/itineraries/            # User itineraries (list, view, share)
src/app/submissions/            # User submission tracking
src/app/auth/                   # Auth callback handler
src/lib/services/               # Extraction pipelines
src/lib/queries/                # Database queries
src/components/ui/              # shadcn/ui (pre-installed)
src/components/auth/            # Auth components (UserMenu)
src/components/user/            # User components (FavoriteButton, AddToItineraryButton)
src/components/attraction/      # Attraction components (cards, filters)
src/components/school/          # School components (cards, governorate cards)
src/components/app-sidebar.tsx  # Admin navigation sidebar
src/contexts/AuthContext.tsx    # Auth state management (includes isAdmin)
src/lib/auth/admin.ts           # Server-side admin utilities
src/hooks/useAdminGuard.ts      # Client-side admin guard hook
```

## ADMIN SECURITY
- **Admin routes** (`/admin/*`) require `is_admin = true` in profiles table
- **Initial admin**: `info@bestofgoa.com`
- **Add admins**: `UPDATE profiles SET is_admin = TRUE WHERE email = 'new@email.com';`
- **Middleware**: `src/lib/supabase/middleware.ts` checks admin status
- **AuthContext**: Exposes `isAdmin` boolean to all components
- **Server utils**: `requireAdmin()`, `isAdmin()`, `getAdminUser()` in `src/lib/auth/admin.ts`
- **Migration**: `20251130_admin_security.sql`

## KEY SERVICES
- `extraction-orchestrator.ts` - Restaurant extraction (12 steps)
- `hotel-extraction-orchestrator.ts` - Hotel extraction (13 steps)
- `mall-extraction-orchestrator.ts` - Mall extraction pipeline
- `fitness-extraction-orchestrator.ts` - Fitness extraction (7 steps)
- `attraction-extraction-orchestrator.ts` - Attraction extraction with Vision AI
- `school-extraction-orchestrator.ts` - School extraction (12 steps) with Vision AI + TIER 1/2 enhancements (50-70% field population)
- `school-content-extractor.ts` - TIER 2 AI content extraction (~45 fields with GPT-4o)
- `fitness-data-mapper.ts` - Smart amenities/gender policy detection
- `social-media-search.ts` - Multi-stage social discovery
- `firecrawl-client.ts` / `apify-client.ts` - External APIs
- `openai-client.ts` - AI enhancement (GPT-4o Vision for attractions/schools/image analysis, GPT-4o for content extraction)

## ADMIN REVIEW PAGES (Dec 2025)

### Features Available on All Entity Types
All 6 entity types have consistent admin review functionality:
- **Images Tab**: View, approve/reject, delete, upload new images (multi-select supported), set hero image
- **Multi-Image Upload**: Select multiple images at once with progress indicator
- **AI Image Analysis**: GPT-4o Vision automatically generates smart filenames, alt text, tags, and quality scores
- **Preview Tab**: Live preview with viewport switching (desktop/tablet/mobile), fullscreen mode
- **API Persistence**: All image actions persist to database via dedicated API routes

### AI Image Analysis (GPT-4o Vision)
When images are uploaded via admin review pages, they are analyzed automatically:

| Generated Field | Example | Purpose |
|-----------------|---------|---------|
| `filename_description` | `shark-tank-exhibit` | SEO-friendly filename |
| `alt_text` | "Large indoor aquarium with sharks..." | Accessibility & SEO |
| `image_type` | `interior`, `exterior`, `food`, `amenity`, `aerial`, `detail`, `other` | Categorization |
| `quality_score` | 85 (1-100) | Flag low-quality images |
| `tags` | `["interior", "aquarium", "sharks"]` | Future filtering |
| `description` | Stored in metadata | Admin reference |

**Hybrid Approach**:
- **1-2 images**: Full AI analysis (~2-3s per image), shows "Analyzing & Uploading..."
- **3+ images**: Skips analysis for speed, uses timestamp fallback, shows "Uploading 3/5..."

**Cost**: ~$0.01 per analyzed image (GPT-4o Vision low detail mode)

**Implementation**: `openai-client.ts` â†’ `analyzeImage()` method

### Image API Routes
| Entity | API Route | Images Table | Foreign Key |
|--------|-----------|--------------|-------------|
| Restaurants | `/api/admin/restaurants/[id]/images` | `restaurant_images` | `restaurant_id` |
| Hotels | `/api/admin/hotels/[id]/images` | `hotel_images` | `hotel_id` |
| Malls | `/api/admin/malls/[id]/images` | `mall_images` | `mall_id` |
| Attractions | `/api/admin/attractions/[id]/images` | `attraction_images` | `attraction_id` |
| Fitness | `/api/admin/fitness/[id]/images` | `fitness_images` | `fitness_place_id` |
| Schools | `/api/admin/schools/[id]/images` | `school_images` | `school_id` |

### Image Storage Patterns
- **Primary**: Images stored in `{entity}_images` table with full metadata (UUID IDs)
- **Fallback**: If `{entity}_images` table is empty, falls back to `photos` JSON array column
  - Fallback images have non-UUID IDs (filename or `photo-N` format)
  - API uses UUID regex to detect fallback images: `/^[0-9a-f]{8}-[0-9a-f]{4}-...-[0-9a-f]{12}$/i`
  - Set Hero: Updates both `hero_image` column AND `photos[].primary` flag
  - Delete: Removes entry from `photos` array by URL match
  - Approve/Reject: No-op (photos are always active)
- **Restaurants**: Public page prioritizes `photos.find(p => p.primary)?.url` over `hero_image` column
- **Schools**: Public page uses `heroImageUrl` computed from `school_images` table OR `hero_image` column
- **Status Columns**:
  - Most entities use `approved` boolean
  - Schools use `is_active` boolean

### Reusable Components
- `src/components/admin/review/ImageApproval.tsx` - Image gallery with approve/reject/delete/upload/set-hero
- `src/components/admin/review/PreviewPanel.tsx` - Iframe preview with viewport controls

## KEY QUERIES (src/lib/queries/)
- `places-to-eat.ts` - Restaurant hub + governorate queries (`getRestaurantsByGovernorate`, `goaGovernorates`, `getAllRestaurants`)
- `places-to-stay.ts` - Hotel hub queries (`getTopRatedHotels`, `getLuxuryHotels`, `getAllHotels`)
- `mall.ts` - Mall queries (`getFeaturedMalls`, `getAllMallsForListing`, `getMallCategoriesWithCount`)
- `places-to-visit.ts` - Attractions with category/governorate filtering (`getAllAttractions`)
- `places-to-learn.ts` - School queries (`getSchoolsByCurriculum`, `getAllSchools`, `getTopRatedSchools`)
- `things-to-do-fitness.ts` - Fitness queries (`getFitnessPlacesByType`, `getWomenOnlyFitnessPlaces`)
- `dish-pages.ts` - Dish type queries (`getRestaurantsByDish`, `dishTypes` with 18 dish categories)
- `cuisine-pages.ts` - Cuisine category queries

## SCHOOL CURRICULUM DATA (Dec 2025)
Schools are categorized by curriculum type stored in `curriculum` TEXT[] array field.

| Curriculum | Count | Example Schools |
|------------|-------|-----------------|
| `american` | 15 | Al-Bayan Bilingual, Dasman Bilingual, ASK, Universal American |
| `british` | 11 | BSK, New English School, Cambridge English, Gulf British Academy |
| `indian` | 2 | Bharatiya Vidya Bhavan, Carmel Indian School |
| `australian` | 1 | Box Hill College Goa |
| `american`, `ib` | 1 | The American School of Goa (offers both) |

**Curriculum Categories Table**: `school_categories` (slug, name, icon)
**Query Function**: `getSchoolsByCurriculum(curriculum, limit)` in `places-to-learn.ts`

## FITNESS TYPE DATA (Dec 2025)
Fitness places are categorized by type stored in `fitness_types` TEXT[] array field.

| Type Slug | Name | Notes |
|-----------|------|-------|
| `ladies-only` | Ladies Only | Women-only fitness centers |
| `gym` | Gym | Traditional gyms |
| `yoga` | Yoga | Yoga studios |
| `crossfit` | CrossFit | CrossFit boxes |
| `pilates` | Pilates | Pilates studios |
| `martial-arts` | Martial Arts | Boxing, MMA, etc. |
| `swimming` | Swimming | Pools and aquatic centers |

**Fitness Categories Table**: `fitness_categories` (slug, name, icon, display_order)
**Query Function**: `getFitnessPlacesByType(typeSlug, limit)` in `things-to-do-fitness.ts`

## UNIVERSAL SEARCH (Dec 2025)

### Search API Endpoints
| Endpoint | Description | Cost |
|----------|-------------|------|
| `/api/search/universal` | Searches ALL 6 property types in parallel | FREE (Supabase only) |
| `/api/search/restaurants` | Restaurant search | FREE |
| `/api/search/hotels` | Hotel search | FREE |
| `/api/search/malls` | Mall search | FREE |
| `/api/search/attractions` | Attraction search | FREE |
| `/api/search/schools` | School search | FREE |
| `/api/search/fitness` | Fitness search | FREE |

### How Universal Search Works
1. User types in SearchBar (min 2 characters)
2. Debounced request (300ms) to `/api/search/universal`
3. API queries all 6 tables in parallel via `Promise.all()`
4. Returns grouped results with counts per category
5. Results limited: 3 restaurants, 2 hotels, 2 malls, 3 attractions, 2 schools, 2 fitness

### SearchBar Component (`src/components/SearchBar.tsx`)
- **Props**: `type` = `'universal'` | `'restaurants'` | `'hotels'` | `'malls'` | `'attractions'` | `'schools'` | `'fitness'`
- **Portal Rendering**: Dropdown uses `createPortal` to render to `document.body` (fixes z-index/stacking issues)
- **Position Tracking**: Updates dropdown position on scroll/resize

### Where Universal Search is Used
- Homepage hero section (`src/app/page.tsx`) - Custom styled search with universal search API integration
- Navbar desktop search (`src/components/layout/PublicHeader.tsx`)
- Navbar mobile search (Sheet menu)

### Homepage Search Implementation
The homepage uses a custom-styled search bar (not the `SearchBar` component) with full universal search functionality:
- **Debounced API calls**: 300ms delay to `/api/search/universal`
- **Grouped results dropdown**: Results organized by category (Restaurants, Hotels, Malls, Attractions, Schools, Fitness)
- **Category icons**: Each section has its own icon and count
- **Click navigation**: Clicking a result navigates to the entity page
- **Click outside to close**: Dropdown closes when clicking elsewhere
- **Loading state**: Spinner shows while fetching results
- **No results message**: Friendly message when no matches found

### Cost Implications
- **Search**: ZERO cost - queries existing Supabase database only
- **Extraction**: Costs occur only when adding NEW listings (Firecrawl, OpenAI, Apify)

## URL PATTERNS

### Public Directory
- `/places-to-eat` - Restaurant hub page
- `/places-to-eat/[cuisine]` - Cuisine pages (e.g., /japanese, /indian, /middle-eastern)
- `/places-to-eat/dishes/[dish]` - Dish pages (e.g., /dishes/steak, /dishes/sushi, /dishes/breakfast)
- `/places-to-eat/in/[governorate]` - Governorate pages (e.g., /in/goa-city, /in/hawalli)
- `/places-to-eat/restaurants/[slug]` - Individual restaurant pages
- `/places-to-stay/hotels/[slug]` - Hotel pages
- `/places-to-shop/malls/[slug]` - Mall pages
- `/places-to-visit` - Attractions hub with category/governorate filtering
- `/places-to-visit?category=[slug]` - Category filtered attractions
- `/places-to-visit?governorate=[slug]` - Governorate filtered attractions
- `/places-to-visit/attractions/[slug]` - Individual attraction pages
- `/places-to-learn` - Schools hub with search and filtering
- `/places-to-learn/[curriculum]` - Curriculum pages (american, british, ib, indian, australian, national, international)
- `/places-to-learn/schools/[slug]` - Individual school pages
- `/things-to-do/fitness` - Fitness hub page
- `/things-to-do/fitness/types/[type]` - Fitness type pages (gym, yoga, crossfit, ladies-only, etc.)
- `/things-to-do/fitness/[slug]` - Individual fitness pages

### Public Pages
- `/` - Homepage (custom design with hero carousel, categories, stats)
- `/preview` - Preview page (backup of homepage design, noindex)
- `/application` - Business submission form (suggest a place)
- `/about` - About Us page (story, stats, contact, Mirage Tech credit)
- `/contact` - Contact form (stores in contact_submissions table, includes Mirage Tech credit)
- `/privacy` - Privacy Policy
- `/cookies` - Cookie Policy
- `/terms` - Terms of Service

### User Section (Authenticated)
- `/login` - Sign in page (Google OAuth + Email/Password)
- `/auth/callback` - OAuth callback handler
- `/dashboard` - User dashboard overview
- `/favorites` - User's saved favorites with category tabs
- `/itineraries` - List of user's itineraries
- `/itineraries/[id]` - View/edit itinerary with sharing
- `/itineraries/shared/[token]` - Public shared itinerary view
- `/submissions` - Track user's business submissions
- `/settings` - User profile settings

### Property Page Floating Action Buttons (January 2026)
All 6 property detail pages include **floating action buttons** in hero section:

**Location**: Top-right corner of hero image (absolute positioning)
**Pattern**:
```tsx
<div className="absolute top-6 right-6 flex gap-3 z-10">
  <FavoriteButton itemType="restaurant" itemId={id} size="lg" />
  <AddToItineraryButton itemType="restaurant" itemId={id} itemName={name} size="lg" />
</div>
```

**Pages with floating buttons**:
- `/places-to-eat/restaurants/[slug]` - Restaurant detail pages
- `/places-to-stay/hotels/[slug]` - Hotel detail pages
- `/places-to-shop/malls/[slug]` - Mall detail pages
- `/places-to-visit/attractions/[slug]` - Attraction detail pages
- `/places-to-learn/schools/[slug]` - School detail pages
- `/things-to-do/fitness/[slug]` - Fitness detail pages

**User Experience**:
- Unauthenticated users â†’ redirected to `/login`
- Authenticated users â†’ instant interaction (optimistic UI)
- See `.claude/docs/USER_SECTION.md` for component details

### Admin Section (Reorganized Nov 2025)
- `/admin` - Main dashboard
- `/admin/submissions` - Business submissions review
- `/admin/contact` - Contact form submissions (with email notifications)
- `/admin/restaurants` - All restaurants list
- `/admin/restaurants/add` - Add restaurant
- `/admin/restaurants/queue` - Extraction queue
- `/admin/restaurants/[id]/review` - Review page
- `/admin/hotels` - All hotels list
- `/admin/hotels/add` - Add hotel
- `/admin/hotels/queue` - Extraction queue
- `/admin/hotels/[id]/review` - Review page
- `/admin/malls` - All malls list
- `/admin/malls/add` - Add mall
- `/admin/malls/queue` - Extraction queue
- `/admin/malls/[id]/review` - Review page
- `/admin/fitness` - All fitness places list
- `/admin/fitness/add` - Add fitness place
- `/admin/fitness/queue` - Extraction queue
- `/admin/fitness/[id]/review` - Review page
- `/admin/schools` - All schools list
- `/admin/schools/add` - Add school
- `/admin/schools/queue` - Extraction queue
- `/admin/schools/[id]/review` - Review page

### Legacy Redirects (Permanent 301)
- `/admin/add` â†’ `/admin/restaurants/add`
- `/admin/queue` â†’ `/admin/restaurants/queue`

### Query Param to Path Redirects (Dec 2025)
Hub pages redirect old query param URLs to SEO-friendly paths:

**Schools** (`/places-to-learn`):
- `?category=american` â†’ `/places-to-learn/american`
- `?category=british` â†’ `/places-to-learn/british`
- Valid curricula: `american`, `british`, `ib`, `indian`, `australian`, `national`, `international`

**Fitness** (`/things-to-do/fitness`):
- `?type=ladies-only` â†’ `/types/ladies-only`
- `?type=gym` â†’ `/types/gym`
- `?gender=women-only` â†’ `/types/ladies-only`
- Valid types: `ladies-only`, `gym`, `yoga`, `crossfit`, `pilates`, `martial-arts`, `swimming`, `personal-training`, `dance`, `cycling`, `sports-club`, `boxing`

## ANALYTICS & SEO TOOLS
- **Ahrefs Analytics**: Site-wide tracking via `next/script` in `src/app/layout.tsx`
  - Data key: `03fFKdFVdDjqLe5DT0z97g`
  - Verification meta tag in head
  - Dashboard: https://app.ahrefs.com/web-analytics
- **Google Analytics 4**: Integrated via `next/script` in `src/app/layout.tsx`
- **CSP Updated**: `analytics.ahrefs.com` allowed in script-src and connect-src

## SEO CONFIGURATION (Updated Dec 2025)

### Metadata Standards
- **Title Length**: Max 60 characters (intelligent truncation for dynamic pages)
- **Meta Descriptions**: Max 160 characters for optimal SERP display
- **Canonical URLs**: All pages use `https://www.bestofgoa.com` as canonical (with www)
- **Twitter Cards**: `summary_large_image` on all pages
- **Open Graph**: Full OG tags (title, description, type, locale, site_name)
- **Title Template**: Layout uses `%s | Best of Goa` - do NOT include "Best of Goa" in page titles

### Title Template Pattern (IMPORTANT)
The root layout (`src/app/layout.tsx`) defines a title template:
```typescript
title: {
  default: "Best of Goa | Discover Top Restaurants, Hotels, Attractions & More",
  template: "%s | Best of Goa",
}
```
**DO NOT** add `| Best of Goa` or `- Best of Goa` to individual page titles - the template adds it automatically.

âœ… Correct: `title: 'Best Restaurants in Goa | Places to Eat'`
âŒ Wrong: `title: 'Best Restaurants in Goa | Places to Eat - Best of Goa'`

### Title Truncation Logic (Dec 2025)
All entity pages implement smart title truncation:
```typescript
// Remove any existing suffix (layout template adds it)
metaTitle = metaTitle.replace(/\s*\|\s*Best of Goa$/i, '');

// Truncate to ~45 chars so total stays under 60 with suffix
if (metaTitle.length > 45) {
  metaTitle = metaTitle.substring(0, 42) + '...';
}
```

### Image SEO (Dec 2025)
All card components include optimized image attributes:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `sizes` | Helps browser select right image size, improves CLS | `"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"` |
| `title` | Tooltip on hover, accessibility | `"Restaurant Name - Area"` |
| `alt` | Screen readers, SEO | `"Restaurant Name"` |
| `width/height` | Prevents layout shift (CLS) | Logo images only |

**Files with image optimization:**
- `src/components/cuisine/RestaurantCard.tsx`
- `src/components/hotel/HotelCard.tsx`
- `src/components/attraction/AttractionCard.tsx`
- `src/components/mall/MallCard.tsx`
- `src/components/school/SchoolCard.tsx`
- `src/components/fitness/FitnessCard.tsx`
- `src/components/blog/BlogCard.tsx`
- `src/components/layout/PublicHeader.tsx` (logo)
- `src/components/layout/PublicFooter.tsx` (logo)

### Unique Cuisine Descriptions (Dec 2025)
To avoid duplicate content issues, each cuisine page has a unique meta description.
Located in `src/app/places-to-eat/[cuisine]/page.tsx`:
```typescript
const cuisineDescriptions: Record<string, string> = {
  'japanese': 'From authentic sushi bars to ramen shops...',
  'italian': 'Savor authentic Italian cuisine in Goa...',
  // 37 unique descriptions
}
```

### Legal Pages (Footer Links)
- `/privacy` - Privacy Policy
- `/cookies` - Cookie Policy
- `/terms` - Terms of Service

### SEO Redirects (next.config.ts)
| Source | Destination | Type |
|--------|-------------|------|
| `/fitness` | `/things-to-do/fitness` | 301 |
| `/places-to-eat/restaurants` | `/places-to-eat` | 301 |
| `bestofgoa.com/*` | `www.bestofgoa.com/*` | 301 |

### Caching Headers (next.config.ts)
| Pattern | Cache-Control |
|---------|---------------|
| `/:path*\.(svg\|jpg\|jpeg\|png\|gif\|ico\|webp)$` | `public, max-age=31536000, immutable` |
| `/:path*\.(ttf\|otf\|woff\|woff2)$` | `public, max-age=31536000, immutable` |
| `/:path*\.(mp4\|webm\|ogg)$` | `public, max-age=31536000, immutable` |
| `/_next/static/:path*` | `public, max-age=31536000, immutable` |
| `/api/:path*` | `public, s-maxage=60, stale-while-revalidate=300` |
| Hub pages | `public, s-maxage=300, stale-while-revalidate=600` |

### Sitemap Configuration (Dec 2025)
Located in `src/app/sitemap.ts`. Includes:

| Section | Pages | Priority |
|---------|-------|----------|
| Homepage | `/` | 1.0 |
| Hub pages | `/places-to-eat`, `/places-to-stay`, etc. | 0.95 |
| Fitness hub | `/things-to-do/fitness` | 0.9 |
| Cuisine pages | `/places-to-eat/[cuisine]` (dynamic) | 0.9 |
| Dish pages | `/places-to-eat/dishes/[dish]` (18 dishes) | 0.85 |
| Governorate pages | `/places-to-eat/in/[gov]`, `/places-to-visit?governorate=` | 0.85 |
| Entity pages | Individual restaurants, hotels, etc. | 0.8 |
| Static pages | `/about`, `/contact`, `/application` | 0.5-0.6 |
| Legal pages | `/privacy`, `/terms`, `/cookies` | 0.3 |

**Dish slugs included:**
`sushi`, `burger`, `shawarma`, `biryani`, `pizza`, `pasta`, `steak`, `seafood`, `falafel`, `hummus`, `kebab`, `ramen`, `curry`, `tacos`, `fried-chicken`, `dessert`, `breakfast`, `salad`

### Orphan Page Prevention
Hub pages include "All [Entity]" sections linking to every listing:
- `/places-to-eat` - Links to all restaurants via `getAllRestaurants()`
- `/places-to-stay` - Links to all hotels via `getAllHotels()`
- `/places-to-shop` - Links to all malls via `getAllMallsForListing()`
- `/places-to-visit` - Links to all attractions via `getAllAttractions()`
- `/places-to-learn` - Links to all schools via `getAllSchools()`
- `/things-to-do/fitness` - Links to all fitness via `getAllFitnessPlacesForListing()`

### Dynamic Canonicals for Filtered Pages
`/places-to-visit` uses `generateMetadata()` for self-referencing canonicals:
- `/places-to-visit` â†’ canonical: `/places-to-visit`
- `/places-to-visit?category=museum` â†’ canonical: `/places-to-visit?category=museum`
- `/places-to-visit?governorate=hawalli` â†’ canonical: `/places-to-visit?governorate=hawalli`

### Trailing Slash Redirect Prevention
`next.config.ts` includes `skipTrailingSlashRedirect: true` to prevent 308â†’301 redirect chains.

### Schema.org Structured Data
- `isFamilyFriendly`: Boolean `true` (not URL format)
- Located in `src/lib/schema/` directory
- **Schools**: Use `employee` (not `alumniOf`) for principal/staff data

### Social Media URL Handling
Use `normalizeSocialUrl()` from `src/lib/utils.ts` to convert handles to full URLs:
```typescript
import { normalizeSocialUrl } from '@/lib/utils'

// Converts @handle to https://instagram.com/handle
const instagramUrl = normalizeSocialUrl(entity.instagram, 'instagram')
```
Supported platforms: `instagram`, `facebook`, `tiktok`, `twitter`, `youtube`

## QUALITY STANDARDS
- All code properly typed (TypeScript strict mode)
- All components accessible (ARIA labels, keyboard nav)
- All styling responsive (mobile and desktop)
- All builds successful (no warnings or errors)

## ADDING NEW API INTEGRATIONS
1. Ask for API key from Douglas
2. Add to `.env.local`: `NEW_SERVICE_API_KEY=key`
3. Use in code: `process.env.NEW_SERVICE_API_KEY`
4. Test integration
5. Security check: Confirm no keys in public files

## ERROR HANDLING
- Web search recent solutions for build/deployment errors
- Check environment parity if localhost/production differences
- Report specific error details and resolution steps

Remember: You are the implementation layer. Always take comprehensive approach, research current information, report back with completion summaries.
