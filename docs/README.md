# Best of Goa - Directory Platform

**Goa's premier directory for discovering the best restaurants, hotels, attractions, and places to visit.**

---

## ðŸš€ Project Overview

Best of Goa is a comprehensive directory and rating platform showcasing Goa's finest locations across multiple categories. Built for both locals and tourists seeking authentic recommendations with advanced filtering, real-time updates, and expert-verified content.

**Goal:** Rank #1 in organic search (traditional and LLM search) for Goa-related queries.

**Inspiration:** Best Dubai (bestdubai.com) with enhanced features and Goa-specific optimizations.

---

## ðŸ“‹ Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)
- [Development](#development)
- [Deployment](#deployment)
- [Brand Assets](#brand-assets)

---

## âš¡ Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Environment variables configured (`.env.local`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd BOK

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build for Production

```bash
npm run build
npm run start
```

---

## ðŸ“ Project Structure

```
src/
â”œâ”€â”€ app/                          # Next.js App Router
â”‚   â”œâ”€â”€ page.tsx                 # Homepage
â”‚   â”œâ”€â”€ layout.tsx               # Root layout with metadata
â”‚   â”œâ”€â”€ admin/                   # Admin dashboard
â”‚   â”œâ”€â”€ places-to-eat/           # Restaurant pages
â”‚   â”‚   â”œâ”€â”€ [cuisine]/          # Cuisine category pages
â”‚   â”‚   â””â”€â”€ restaurants/[slug]/ # Individual restaurant pages
â”‚   â””â”€â”€ api/                     # API routes
â”‚
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ui/                      # shadcn/ui components (70+ pre-installed)
â”‚   â”œâ”€â”€ admin/                   # Admin-specific components
â”‚   â””â”€â”€ cuisine/                 # Cuisine page components
â”‚
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ schema/                  # Schema.org structured data
â”‚   â”‚   â”œâ”€â”€ global/             # Website & Organization schemas
â”‚   â”‚   â”œâ”€â”€ generators/         # Restaurant, Place, Collection schemas
â”‚   â”‚   â””â”€â”€ types.ts            # TypeScript interfaces
â”‚   â”‚
â”‚   â”œâ”€â”€ services/                # Business logic
â”‚   â”‚   â”œâ”€â”€ extraction-orchestrator.ts  # Multi-stage extraction pipeline
â”‚   â”‚   â”œâ”€â”€ social-media-search.ts      # Social media discovery
â”‚   â”‚   â”œâ”€â”€ firecrawl-client.ts         # Firecrawl API wrapper
â”‚   â”‚   â””â”€â”€ data-mapper.ts              # Data transformation
â”‚   â”‚
â”‚   â”œâ”€â”€ utils/                   # Utility functions
â”‚   â”‚   â””â”€â”€ goa-locations.ts  # Governorate mapping
â”‚   â”‚
â”‚   â””â”€â”€ queries/                 # Database queries
â”‚       â””â”€â”€ cuisine-pages.ts     # Cuisine page data fetching
â”‚
â””â”€â”€ hooks/                       # React hooks

bin/                             # Utility scripts
â”œâ”€â”€ test-governorate-mapping.js  # Test governorate coverage
â”œâ”€â”€ standardize-cuisine-slugs.sql # SQL migrations
â””â”€â”€ check-*.js                   # Diagnostic scripts

docs/                            # Documentation
â”œâ”€â”€ HOMEPAGE_AND_BRANDING_IMPLEMENTATION.md
â”œâ”€â”€ SCHEMA_ORG_IMPLEMENTATION_COMPLETE.md
â”œâ”€â”€ CUISINE_CATEGORY_PAGES_STRATEGY.md
â””â”€â”€ [40+ additional documentation files]

public/
â””â”€â”€ Brandassets/                 # Local brand assets (if any)
```

---

## ðŸŽ¯ Key Features

### âœ… Implemented

#### Homepage
- **Modern Design**: Inspired by Best Dubai with Goa enhancements
- **Hero Section**: Search bar with popular suggestions
- **6 Categories**: Restaurants, Attractions, Malls, Hotels, Schools, Fitness
- **Browse by Cuisine**: 12+ cuisine filters
- **Browse by Governorate**: All 6 Goa regions
- **Sticky Header**: Professional navigation
- **Dark Footer**: Comprehensive links and branding

#### Navigation System âœ¨ *NEW*
- **Unified Header**: Sticky header with all 6 main sections, search bar, and mobile menu
- **Comprehensive Footer**: Multi-column footer with categories, newsletter, and social links
- **Breadcrumb Navigation**: Consistent breadcrumbs across all pages for SEO and UX
- **Mobile Responsive**: Hamburger menu for mobile devices
- **Route Exclusion**: Admin routes automatically excluded from public navigation
- **See**: [NAVIGATION_STRUCTURE.md](./NAVIGATION_STRUCTURE.md)

#### Schools System âœ¨ *NEW*
- **AI-Powered Content Extraction**: Automated principal info, programs, and activities (November 2025)
- **Intelligent Image Galleries**: Hero image + 6-image gallery with interior/exterior filtering
- **Enhanced Schema Markup**: EducationalOrganization with principal, languages, programs
- **Rich Content**: Mission statements, USPs, extracurriculars, sports, clubs
- **SEO Optimized**: Meta keywords, structured data, social media integration
- **See**: [SCHOOL_CONTENT_EXTRACTION_AND_SEO_2025_11_21.md](./SCHOOL_CONTENT_EXTRACTION_AND_SEO_2025_11_21.md)

#### Fitness System âœ¨ *NEW*
- **Complete Extraction Pipeline**: 8-step process (Apify, Firecrawl, Vision AI, OpenAI)
- **BOK Rating System**: 10-point weighted score (same logic as restaurants)
- **AI Enhancement**: 20+ fields including descriptions, FAQs, specialties, fun facts
- **AI Category Suggestions**: Intelligent categorization based on content analysis (December 2025)
- **Image Gallery**: Vision AI analysis with SEO-friendly filenames
- **Bulk Extraction**: All 97 fitness places extracted and published (December 2025)
- **Smart Slug Generation**: Hybrid approach with duplicate detection
- **Improved Categorization**: More specific matching, no default to "gym" (December 2025)
- **See**: [FITNESS_SYSTEM_COMPLETE.md](./FITNESS_SYSTEM_COMPLETE.md)

#### Brand Integration
- **Favicon**: Browser tab icon
- **Header Logo**: Blue horizontal logo
- **Footer Logo**: White footer logo
- **Schema.org Logo**: BOK-Logo for Knowledge Graph

#### SEO & Schema.org
- **WebSite Schema**: Sitelinks search box support
- **Organization Schema**: Knowledge Graph eligibility
- **Restaurant Schema**: Rich snippets with ratings, hours, location
- **CollectionPage Schema**: Cuisine category pages
- **Place Schema**: Tourist attractions, parks, museums
- **50+ SEO Keywords**: 7-tier keyword strategy

#### Goa-Specific Features
- **Governorate Mapping**: 100% coverage of all restaurants
- **Area Detection**: Automatic governorate derivation from area
- **6 Governorates**: Al Asimah, Hawalli, Al Farwaniyah, Al Ahmadi, Al Jahra, Mubarak Al-Kabeer

#### Cuisine Pages
- **14 Cuisine Categories**: Japanese, Italian, Seafood, etc.
- **Dynamic Routing**: `/places-to-eat/{cuisine}`
- **Clean URLs**: Standardized slugs (e.g., `/japanese` not `/japanese-restaurants`)
- **CollectionPage Schema**: SEO-optimized category pages

#### Restaurant Pages
- **Individual Pages**: `/places-to-eat/restaurants/{slug}`
- **Restaurant Schema**: Full structured data
- **Governorate in Address**: Enhanced location data

#### Image Extraction âœ¨ *NEW*
- **Auto Hero Image Selection**: Claude Vision AI automatically selects best photo (November 2025)
- **Smart Scoring**: Images analyzed for quality, composition, and food appeal (0-100)
- **No Manual Work**: Hero image populated automatically during extraction
- **High Quality**: 1200x900 minimum resolution with metadata
- **See**: [IMAGE_EXTRACTOR_HERO_IMAGE_AUTO.md](./IMAGE_EXTRACTOR_HERO_IMAGE_AUTO.md)

### ðŸš§ Planned

- Search functionality (backend integration)
- User authentication & accounts
- Review system (public reviews)
- Featured/trending restaurants
- Dynamic category counts
- Area/governorate landing pages
- Multi-language support (English/Arabic)
- Mobile navigation menu
- Dark mode toggle

---

## ðŸ“š Documentation

### Core Documentation

| Document | Purpose |
|----------|---------|
| [NAVIGATION_STRUCTURE.md](./NAVIGATION_STRUCTURE.md) | âœ¨ Header, footer, breadcrumbs, and navigation system |
| [HOMEPAGE_AND_BRANDING_IMPLEMENTATION.md](./HOMEPAGE_AND_BRANDING_IMPLEMENTATION.md) | Homepage redesign & brand assets |
| [SCHEMA_ORG_IMPLEMENTATION_COMPLETE.md](./SCHEMA_ORG_IMPLEMENTATION_COMPLETE.md) | Schema.org structured data guide |
| [CUISINE_CATEGORY_PAGES_STRATEGY.md](./CUISINE_CATEGORY_PAGES_STRATEGY.md) | Cuisine pages architecture |
| [PROJECT_README.md](./PROJECT_README.md) | Technical project overview |
| [DATABASE_OVERVIEW.md](./DATABASE_OVERVIEW.md) | Database schema reference |
| [NOVEMBER_21_2025_SCHOOL_ENHANCEMENTS.md](./NOVEMBER_21_2025_SCHOOL_ENHANCEMENTS.md) | âœ¨ School system enhancement summary |

### Feature Documentation

- **Schema.org**: `SCHEMA_ORG_IMPLEMENTATION_FINAL.md`, `SCHEMA_DOCUMENTATION.md`
- **Images**: `IMAGE_EXTRACTION_SYSTEM.md`, `IMAGE_POLICY_IMPLEMENTATION.md`, `IMAGE_EXTRACTOR_HERO_IMAGE_AUTO.md` âœ¨
- **Schools**: `SCHOOL_CONTENT_EXTRACTION_AND_SEO_2025_11_21.md` âœ¨ - AI content extraction & enhanced SEO
- **Fitness**: `FITNESS_SYSTEM_COMPLETE.md` âœ¨ - Complete fitness system with extraction pipeline, AI enhancement, BOK scores, AI category suggestions, and bulk extraction (December 2025)
- **Fitness Slugs**: `FITNESS_SLUG_IMPLEMENTATION.md` - Hybrid slug generation with duplicate detection
- **Social Media**: `SOCIAL_MEDIA_SEARCH_OPTIMIZATION.md`
- **Slugs**: `SLUG_GENERATION.md`, `SLUG_REGENERATION_IMPLEMENTATION.md`, `CUISINE_SLUG_STANDARDIZATION.md`
- **Admin**: `ADMIN_WORKFLOW.md`
- **CSV Generation**: `CSV_GENERATION_PROCESS.md` ðŸ“Š - Complete guide to creating cuisine-specific target lists
- **TripAdvisor**: `TRIPADVISOR_FINAL_EXTRACTION_PLAN.md`, `TRIPADVISOR_DUPLICATE_ANALYSIS.md`

### Testing & Scripts

- **Governorate Testing**: `bin/test-governorate-mapping.js`
- **Database Checks**: `bin/check-db-fields.js`
- **Slug Validation**: `bin/check-cuisine-slugs.js`
- **Extraction Scripts**: See `bin/README_EXTRACTION_SCRIPTS.md` for complete toolkit

---

## ðŸ› ï¸ Tech Stack

### Framework & Core
- **Next.js 15** - App Router, TypeScript
- **React 19** - Latest React features
- **TypeScript 5** - Type safety

### Styling & UI
- **Tailwind CSS v4** - CSS-first configuration
- **shadcn/ui** - 70+ pre-installed components
- **Lucide React** - Icon library

### Database & Backend
- **Supabase** - PostgreSQL database
- **Supabase Storage** - Brand assets & images
- **Supabase Auth** - Authentication (planned)

### External APIs
- **Apify** - Google Places scraping
- **Firecrawl** - Web scraping + AI extraction
- **OpenAI GPT-4o** - AI enhancement & school content extraction (function calling)
- **Anthropic Claude** - Advanced processing & image analysis

### SEO & Analytics
- **Schema.org** - Structured data markup
- **Next.js Metadata API** - SEO optimization

### Deployment
- **Vercel** - Hosting & deployment
- **GitHub** - Version control

---

## ðŸ’» Development

### Available Scripts

```bash
npm run dev           # Start development server (localhost:3000)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
npm run lint:fix      # Fix linting issues
npm run format        # Format code with Prettier
npm run type-check    # Run TypeScript type checking
```

### Environment Variables

Required in `.env.local`:

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# External APIs
FIRECRAWL_API_KEY=
APIFY_API_KEY=
OPENAI_API_KEY=          # Required for school content extraction
ANTHROPIC_API_KEY=

# Site Configuration
NEXT_PUBLIC_BASE_URL=https://www.bestofgoa.com
```

### Database Setup

1. Create Supabase project
2. Run migrations (if any)
3. Set up storage buckets:
   - `brand-assets` (public)
   - `restaurant-images` (public)

### Testing Scripts

```bash
# Test governorate mapping
node bin/test-governorate-mapping.js

# Check database fields
node bin/check-db-fields.js

# Check cuisine slugs
node bin/check-cuisine-slugs.js

# Extract school content (AI-powered)
npx tsx scripts/batch-extract-school-content.ts
```

---

## ðŸš€ Deployment

### Vercel Deployment

1. **Connect Repository**
   - Import GitHub repository to Vercel

2. **Configure Environment Variables**
   - Add all `.env.local` variables to Vercel project settings

3. **Deploy**
   ```bash
   git push origin main
   ```
   - Automatic deployment on push

### Build Settings

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

---

## ðŸŽ¨ Brand Assets

All brand assets stored in Supabase Storage: `brand-assets` bucket

### Asset Files

| File | Purpose | Used In |
|------|---------|---------|
| `favicon.png` | Browser favicon | `layout.tsx` |
| `logo-blue-h.png` | Header logo (light bg) | Homepage header |
| `logo-white-ft.png` | Footer logo (dark bg) | Homepage footer |
| `BOK-Logo.png` | Schema.org markup | Organization & WebSite schemas |

### Base URL

```
https://qcqxcffgfdsqfrwwvabh.supabase.co/storage/v1/object/public/brand-assets/
```

---

## ðŸ“Š Current Status

### Database Statistics
- **Restaurants**: 31 (100% with governorate mapping)
- **Hotels**: 80 total, all with BOK scores
- **Fitness Places**: 97 total, all places published and live
- **Cuisines**: 14 categories
- **Areas**: 19 unique locations
- **Governorates**: 6 regions covered

### Pages Live
- âœ… Homepage
- âœ… 14 Cuisine category pages
- âœ… Individual restaurant pages
- âœ… Hotels listing page (`/places-to-stay`) - 80 hotels with BOK ratings
- âœ… Individual hotel pages (`/places-to-stay/hotels/[slug]`)
- âœ… Attractions listing page (`/places-to-visit`)
- âœ… Fitness listing page (`/things-to-do/fitness`)
- âœ… 97 Fitness detail pages (all places published)
- â³ Governorate pages (planned)
- â³ Search results (planned)

### SEO Status
- âœ… WebSite schema with sitelinks search box
- âœ… Organization schema for Knowledge Graph
- âœ… Restaurant schema on all restaurant pages
- âœ… CollectionPage schema on cuisine pages
- âœ… 50+ SEO keywords integrated
- âœ… 100% governorate coverage in addresses

---

## ðŸ¤ Contributing

This is a private project developed by Douglas Pereira for Best of Goa.

For questions or support:
- **Email**: info@bestofgoa.com
- **Phone**: +965-67067633

---

## ðŸ“„ License

Proprietary - All rights reserved Â© 2025 Best of Goa

---

## ðŸ”— Links

- **Live Site**: https://www.bestofgoa.com (when deployed)
- **Admin Dashboard**: `/admin`
- **Documentation Index**: `docs/README.md`
- **GitHub Repository**: [Private]

---

**Last Updated**: November 28, 2025
**Version**: 1.3.1
**Status**: Development - Fitness System Complete, Hotels Display Fixed

---

## ðŸ“ Recent Changes (November 28, 2025)

### Bug Fixes
- **Hotels Display Fix**: Fixed `hok_score` â†’ `bok_score` column name mismatch in hotel queries
  - `src/lib/queries/places-to-stay.ts` - All hotel listing queries now use correct `bok_score` column
  - `src/lib/queries/hotel-category-pages.ts` - Category page queries fixed
  - `src/components/hotel/HotelCard.tsx` - Card component updated to display BOK ratings

### UI Improvements
- **Attractions Category Grid**: Changed from 6 to 5 columns on large screens (`lg:grid-cols-5`)
  - `src/app/places-to-visit/page.tsx` - "Browse by Category" section updated
