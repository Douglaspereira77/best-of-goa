# Schema.org Implementation Documentation
**Best of Goa Directory Platform**

*Last Updated: January 2025*

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Universal Schema Fields](#universal-schema-fields)
4. [Restaurant-Specific Schemas](#restaurant-specific-schemas)
5. [Global Schemas](#global-schemas)
6. [Field Mappings](#field-mappings)
7. [Implementation Guide](#implementation-guide)
8. [Testing & Validation](#testing--validation)
9. [SEO Impact](#seo-impact)
10. [Future Expansion](#future-expansion)

---

## Overview

### Purpose

This Schema.org implementation provides structured data markup for the Best of Goa directory platform, optimizing for:

- **Traditional Search**: Google, Bing rich results (star ratings, breadcrumbs, FAQs)
- **LLM Search**: ChatGPT, Perplexity, Claude conversational AI training
- **Image Search**: Google Images optimization
- **Local Search**: Google Maps, Apple Maps integration
- **Knowledge Graph**: Brand recognition and authority signals

### Strategy

Following **BestDubai.com** proven practices:

1. **Universal Required Fields**: Applied across all place types
2. **Category-Specific Fields**: Unique to restaurants, hotels, attractions
3. **Reusable Components**: FAQs, images, reviews shared across types
4. **Validation First**: All schemas tested with validator.schema.org
5. **Documentation-Driven**: Comprehensive field mappings

### Key Benefits

- **25-40% CTR Increase** from star ratings in search results
- **Rich FAQs** train LLM models for conversational queries
- **Image Search Visibility** via ImageObject schemas
- **Sitelinks Search Box** (2-4 months after deployment)
- **Knowledge Graph Eligibility** via Organization schema

---

## Architecture

### Design Pattern: Composition Over Inheritance

**Philosophy**: Wait for 2nd place type before extracting shared components

```
src/lib/schema/
â”œâ”€â”€ types.ts                      # TypeScript interfaces
â”œâ”€â”€ index.ts                      # Main orchestrator
â”œâ”€â”€ generators/                   # Schema generators
â”‚   â”œâ”€â”€ restaurant.ts            # Restaurant schema (Priority 1)
â”‚   â”œâ”€â”€ review.ts                # AggregateRating + Review (Priority 1)
â”‚   â”œâ”€â”€ image.ts                 # ImageObject (Priority 3)
â”‚   â”œâ”€â”€ faq.ts                   # FAQPage (Priority 1)
â”‚   â”œâ”€â”€ breadcrumb.ts            # BreadcrumbList (Priority 1)
â”‚   â””â”€â”€ menu.ts                  # Menu (Priority 2)
â””â”€â”€ global/                       # Site-wide schemas
    â”œâ”€â”€ organization.ts          # Best of Goa Organization
    â””â”€â”€ website.ts               # WebSite + SearchAction
```

### Schema Priority Levels

**Priority 1 (Critical for SEO)**:
- Restaurant schema with embedded AggregateRating
- BreadcrumbList (navigation)
- FAQPage (LLM training gold)

**Priority 2 (Recommended)**:
- Menu schema
- Individual Review schemas (up to 10)

**Priority 3 (Enhanced)**:
- ImageObject schemas (image search)

---

## Universal Schema Fields

### Required for ALL Place Types

These fields MUST be present regardless of place type (restaurant, hotel, attraction):

| Field | Schema.org Property | Database Column | Example |
|-------|-------------------|-----------------|---------|
| **Name** | `name` | `name` | "Le Relais De l'EntrecÃ´te" |
| **Description** | `description` | `description` | "Classic French steakhouse..." |
| **URL** | `url` | `slug` â†’ `/places-to-eat/restaurants/{slug}` | "https://bestofgoa.com/places-to-eat/restaurants/le-relais-..." |
| **Image** | `image` | `hero_image` OR `images[0]` | "https://..." |
| **Address** | `address` | `address`, `area`, `neighborhood` | See PostalAddress below |
| **Geo Coordinates** | `geo` | `latitude`, `longitude` | 29.3759Â° N, 47.9774Â° E |
| **Phone** | `telephone` | `phone` | "+965 2228 8888" |
| **Website** | `sameAs` | `website` | "https://..." |
| **Aggregate Rating** | `aggregateRating` | `overall_rating`, `total_reviews_aggregated` | 8.5/10 (250 reviews) |
| **Opening Hours** | `openingHoursSpecification` | `hours` (JSON) | See below |

### PostalAddress Structure

```typescript
{
  "@type": "PostalAddress",
  "streetAddress": "Gulf Street",           // address
  "addressLocality": "Salmiya",             // area
  "addressRegion": "Hawalli Governorate",   // neighborhood.name
  "addressCountry": "KW"                    // Goa ISO code
}
```

### GeoCoordinates Structure

```typescript
{
  "@type": "GeoCoordinates",
  "latitude": 29.3759,   // latitude (decimal)
  "longitude": 47.9774   // longitude (decimal)
}
```

### OpeningHoursSpecification Structure

```typescript
// Consecutive days with same hours are grouped
[
  {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],
    "opens": "12:00",
    "closes": "23:00"
  },
  {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": "Friday",
    "opens": "14:00",
    "closes": "23:30"
  }
]

// Source data format in database (hours column - JSON):
{
  "monday": { "open": "12:00", "close": "23:00", "closed": false },
  "tuesday": { "open": "12:00", "close": "23:00", "closed": false },
  "friday": { "open": "14:00", "close": "23:30", "closed": false },
  "saturday": { "closed": true }
}
```

### AggregateRating Structure

**CRITICAL FOR SEO** - Star ratings in search results increase CTR by 25-40%

```typescript
{
  "@type": "AggregateRating",
  "ratingValue": "8.50",        // overall_rating (0-10 scale)
  "bestRating": "10",           // Always "10" for our system
  "worstRating": "0",           // Always "0"
  "ratingCount": 250            // total_reviews_aggregated
}

// Embedded in Restaurant schema - NOT a separate schema
// Google requires minimum 2 reviews to display stars
```

---

## Restaurant-Specific Schemas

### 1. Restaurant Schema

**File**: `src/lib/schema/generators/restaurant.ts`

**Database â†’ Schema Mapping**:

| Schema.org Property | Type | Database Source | Notes |
|-------------------|------|-----------------|-------|
| `@context` | String | Static: "https://schema.org" | Required |
| `@type` | String | Static: "Restaurant" | Required |
| `name` | String | `name` | Required |
| `description` | String | `description` | Recommended |
| `image` | String OR Array | `hero_image` OR `images[]` | See image logic |
| `logo` | String | `logo_image` | Optional |
| `url` | String | Generated: `/places-to-eat/restaurants/{slug}` | Required |
| `address` | PostalAddress | `address`, `area`, `neighborhood` | Required |
| `geo` | GeoCoordinates | `latitude`, `longitude` | Recommended |
| `telephone` | String | `phone` | Recommended |
| `email` | String | `email` | Optional |
| `openingHoursSpecification` | Array | `hours` (JSON) | Recommended |
| `aggregateRating` | AggregateRating | `overall_rating`, `total_reviews_aggregated` | Critical |
| `servesCuisine` | String[] | `cuisines[].name` | Recommended |
| `priceRange` | String | `price_level` â†’ "$$" | Recommended |
| `acceptsReservations` | Boolean | `reservations_policy` !== "Walk-ins only" | Optional |
| `paymentAccepted` | String | `payment_methods[]` â†’ "Cash, Credit Card" | Optional |
| `currenciesAccepted` | String | `currency` â†’ "KWD" | Optional |
| `hasMenu` | String | Generated: `{url}/menu` | Optional |
| `sameAs` | String[] | `instagram`, `facebook`, `twitter` | Recommended |
| `amenityFeature` | Array | `features[]` â†’ LocationFeatureSpecification | Optional |
| `knowsAbout` | String[] | Generated from cuisines, categories, dishes, good_for | LLM optimization |
| `smokingAllowed` | Boolean | Static: `false` (Goa law) | Informational |
| `hasMap` | String | Generated: Google Maps link | Recommended |

#### Image Selection Logic

```typescript
// Priority order:
1. hero_image (if exists) - primary
2. images[] with is_hero=true (if exists)
3. All images[] (up to 5)

// Output format:
Single image:  "https://..."
Multiple:      ["https://...", "https://...", ...]
```

#### knowsAbout Property Generation

**Purpose**: LLM search optimization - tells AI what the restaurant specializes in

```typescript
// Generated from:
1. Cuisines: "Italian cuisine", "Mediterranean cuisine"
2. Categories: "Fine Dining", "Seafood Restaurant" (skip generic "Restaurant")
3. Top 3 Dishes: "Wagyu Steak", "Truffle Pasta", "Seafood Platter"
4. Good For: "Business Lunch", "Romantic Dinner", "Family Dining"

// Example output:
"knowsAbout": [
  "French cuisine",
  "Fine Dining",
  "Steak Frites",
  "BÃ©arnaise Sauce",
  "Business Lunch",
  "Romantic Dinner"
]
```

#### Price Range Mapping

```typescript
// Database: price_level (1-4)
1 â†’ "$"      (Budget)
2 â†’ "$$"     (Moderate)
3 â†’ "$$$"    (Upscale)
4 â†’ "$$$$"   (Fine Dining)
```

---

### 2. FAQPage Schema

**File**: `src/lib/schema/generators/faq.ts`

**CRITICAL FOR LLM SEARCH** - FAQs train conversational AI models

**Database â†’ Schema Mapping**:

| Schema.org Property | Type | Database Source |
|-------------------|------|-----------------|
| `@context` | String | Static: "https://schema.org" |
| `@type` | String | Static: "FAQPage" |
| `mainEntity` | Question[] | `faqs[]` array (JSON) |

#### FAQ Data Structure

```typescript
// Database column: faqs (JSONB)
[
  {
    "question": "What are the opening hours?",
    "answer": "We're open Monday-Thursday 12:00-23:00...",
    "display_order": 1
  },
  {
    "question": "Do you take reservations?",
    "answer": "Yes, we accept reservations via phone or our website.",
    "display_order": 2
  }
]

// Schema output:
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are the opening hours?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We're open Monday-Thursday 12:00-23:00..."
      }
    }
  ]
}
```

**Validation Rules**:
- Minimum 1 FAQ required to generate schema
- Recommended: 3-5 FAQs per restaurant
- Questions must end with "?"
- Answers must be 50+ characters (Google requirement)
- No duplicate questions

---

### 3. Menu Schema

**File**: `src/lib/schema/generators/menu.ts`

**Database â†’ Schema Mapping**:

| Schema.org Property | Database Source | Notes |
|-------------------|-----------------|-------|
| `@type` | Static: "Menu" | Required |
| `url` | Generated: `{restaurant_url}/menu` | Required |
| `hasMenuSection` | `menu_sections[]` + `dishes[]` | Optional |

#### Menu Section Structure

```typescript
// Database: menu_sections table
{
  id: UUID,
  name: "Appetizers",
  name_ar: "Ø§Ù„Ù…Ù‚Ø¨Ù„Ø§Øª",
  description: "Start your meal with...",
  display_order: 1
}

// Database: restaurants_dishes table
{
  id: UUID,
  name: "Caesar Salad",
  slug: "caesar-salad",
  description: "Fresh romaine lettuce...",
  price: 3.5,
  currency: "KWD",
  category: "Appetizers",
  is_signature: false,
  menu_section_id: UUID
}

// Schema output:
{
  "@type": "Menu",
  "url": "https://bestofgoa.com/places-to-eat/restaurants/le-relais/menu",
  "hasMenuSection": [
    {
      "@type": "MenuSection",
      "name": "Appetizers",
      "description": "Start your meal with...",
      "hasMenuItem": [
        {
          "@type": "MenuItem",
          "name": "Caesar Salad",
          "description": "Fresh romaine lettuce...",
          "offers": {
            "@type": "Offer",
            "price": 3.5,
            "priceCurrency": "KWD"
          }
        }
      ]
    }
  ]
}
```

---

### 4. Review Schemas

**File**: `src/lib/schema/generators/review.ts`

**Two Types**:
1. **AggregateRating** - Embedded in Restaurant schema (critical)
2. **Individual Reviews** - Separate schemas (up to 10)

#### Individual Review Structure

```typescript
// Database: apify_output.reviews[] (from Google Places)
{
  author: "John Smith",
  date: "2024-12-15",
  text: "Amazing food and service! The steak was perfectly cooked...",
  rating: 5
}

// Schema output:
{
  "@type": "Review",
  "author": {
    "@type": "Person",
    "name": "John Smith"
  },
  "datePublished": "2024-12-15",
  "reviewBody": "Amazing food and service! The steak was perfectly cooked...",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5",
    "worstRating": "1"
  }
}
```

**Notes**:
- Display up to 10 most recent reviews
- Google rating scale (1-5 stars)
- Fallback: "Anonymous" if author missing

---

### 5. ImageObject Schemas

**File**: `src/lib/schema/generators/image.ts`

**Database â†’ Schema Mapping**:

```typescript
// Database: restaurants_images table
{
  id: UUID,
  url: "https://storage.supabase.co/...",
  alt_text: "Interior view of Le Relais restaurant",
  type: "interior",
  is_hero: false
}

// Schema output:
{
  "@type": "ImageObject",
  "url": "https://storage.supabase.co/...",
  "contentUrl": "https://storage.supabase.co/...",
  "caption": "Interior view of Le Relais restaurant",
  "description": "Interior view of Le Relais restaurant",
  "width": 1920,  // Optional
  "height": 1080  // Optional
}
```

**Image Priority**:
1. Hero image first
2. Additional images with `is_hero: false`
3. Generate up to 5 ImageObject schemas per restaurant

---

### 6. BreadcrumbList Schema

**File**: `src/lib/schema/generators/breadcrumb.ts`

**Purpose**: Navigation hierarchy in search results

```typescript
// For restaurant page:
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://bestofgoa.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Places to Eat",
      "item": "https://bestofgoa.com/places-to-eat"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Restaurants",
      "item": "https://bestofgoa.com/places-to-eat/restaurants"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Le Relais De l'EntrecÃ´te",
      "item": "https://bestofgoa.com/places-to-eat/restaurants/le-relais-..."
    }
  ]
}
```

---

## Global Schemas

### 1. Organization Schema

**File**: `src/lib/schema/global/organization.ts`

**Purpose**: Knowledge Graph eligibility, brand recognition

**Placement**: Root layout (app/layout.tsx) - site-wide

```typescript
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Best of Goa",
  "alternateName": "BOK",
  "url": "https://bestofgoa.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://bestofgoa.com/logo.png",
    "width": 600,
    "height": 60
  },
  "description": "Goa's premier directory for discovering the best restaurants, hotels, attractions...",
  "foundingDate": "2025",
  "areaServed": {
    "@type": "Country",
    "name": "Goa",
    "sameAs": "https://en.wikipedia.org/wiki/Goa"
  },
  "knowsAbout": [
    "Restaurants in Goa",
    "Goa Dining",
    "Goa Tourism",
    "Goa Attractions"
  ],
  "sameAs": [
    // Add social media URLs when available
  ]
}
```

---

### 2. WebSite Schema

**File**: `src/lib/schema/global/website.ts`

**Purpose**: Sitelinks search box in Google (2-4 months after deployment)

**Placement**: Homepage ONLY (app/page.tsx)

```typescript
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Best of Goa",
  "url": "https://bestofgoa.com",
  "description": "Discover the best restaurants, hotels, attractions...",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://bestofgoa.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "inLanguage": ["en", "ar"]
}
```

**Benefits**:
- Search box appears directly in Google results
- Users can search your site from SERPs
- Enhanced brand presence

---

## Field Mappings

### Complete Restaurant Data Flow

```
Database (restaurants table)
    â†“
Query Helper (src/lib/queries/restaurant.ts)
    â†“
RestaurantData Type (src/lib/schema/types.ts)
    â†“
Schema Generators (src/lib/schema/generators/*)
    â†“
JSON-LD Output (app/places-to-eat/restaurants/[slug]/page.tsx)
    â†“
Google Search Results / LLM Training
```

### Field Coverage Matrix

| Database Field | Restaurant | FAQ | Menu | Review | Image | Breadcrumb |
|---------------|-----------|-----|------|--------|-------|-----------|
| `name` | âœ… | - | - | - | - | âœ… |
| `description` | âœ… | - | - | - | - | - |
| `slug` | âœ… | - | - | - | - | âœ… |
| `address` | âœ… | - | - | - | - | - |
| `area` | âœ… | - | - | - | - | - |
| `neighborhood` | âœ… | - | - | - | - | - |
| `latitude` | âœ… | - | - | - | - | - |
| `longitude` | âœ… | - | - | - | - | - |
| `phone` | âœ… | - | - | - | - | - |
| `email` | âœ… | - | - | - | - | - |
| `website` | âœ… | - | - | - | - | - |
| `instagram` | âœ… | - | - | - | - | - |
| `facebook` | âœ… | - | - | - | - | - |
| `twitter` | âœ… | - | - | - | - | - |
| `hero_image` | âœ… | - | - | - | - | - |
| `logo_image` | âœ… | - | - | - | - | - |
| `overall_rating` | âœ… | - | - | - | - | - |
| `total_reviews_aggregated` | âœ… | - | - | - | - | - |
| `hours` | âœ… | - | - | - | - | - |
| `price_level` | âœ… | - | - | - | - | - |
| `currency` | âœ… | - | âœ… | - | - | - |
| `reservations_policy` | âœ… | - | - | - | - | - |
| `payment_methods` | âœ… | - | - | - | - | - |
| `cuisines[]` | âœ… | - | - | - | - | - |
| `categories[]` | âœ… | - | - | - | - | âœ… |
| `features[]` | âœ… | - | - | - | - | - |
| `meals[]` | âœ… | - | - | - | - | - |
| `good_for[]` | âœ… | - | - | - | - | - |
| `faqs[]` | - | âœ… | - | - | - | - |
| `dishes[]` | âœ… | - | âœ… | - | - | - |
| `menu_sections[]` | - | - | âœ… | - | - | - |
| `images[]` | âœ… | - | - | - | âœ… | - |
| `apify_output.reviews[]` | - | - | - | âœ… | - | - |

---

## Implementation Guide

### Step 1: Generate Schemas

```typescript
// In restaurant page: src/app/places-to-eat/restaurants/[slug]/page.tsx
import { generateRestaurantPageSchemas, DEFAULT_SCHEMA_OPTIONS } from '@/lib/schema';
import { getRestaurantBySlug } from '@/lib/queries/restaurant';

export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  const restaurant = await getRestaurantBySlug(params.slug);

  if (!restaurant) {
    return <div>Restaurant not found</div>;
  }

  // Generate all schemas for this restaurant
  const schemas = generateRestaurantPageSchemas(restaurant, {
    ...DEFAULT_SCHEMA_OPTIONS,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://bestofgoa.com',
  });

  // schemas contains:
  // - schemas.restaurant (SchemaRestaurant)
  // - schemas.breadcrumb (SchemaBreadcrumbList)
  // - schemas.faq (SchemaFAQPage | undefined)
  // - schemas.menu (SchemaMenu | undefined)
  // - schemas.reviews (Review[] | undefined)
  // - schemas.images (ImageObject[] | undefined)

  return (
    <>
      {/* Insert JSON-LD in head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(formatSchemasForHead(schemas))
        }}
      />

      {/* Restaurant page content */}
      <div>{/* ... */}</div>
    </>
  );
}
```

### Step 2: Add Global Schemas

```typescript
// In root layout: src/app/layout.tsx
import { generateGlobalSchemas } from '@/lib/schema';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const globalSchemas = generateGlobalSchemas();

  return (
    <html lang="en">
      <head>
        {/* Organization and WebSite schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              globalSchemas.organization,
              globalSchemas.website
            ])
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Step 3: Validate Data Quality

```typescript
// In admin panel or build process
import { validateRestaurantSchemaData } from '@/lib/schema';

const validation = validateRestaurantSchemaData(restaurant);

if (!validation.valid) {
  console.error('Schema validation errors:', validation.errors);
  // Errors: missing required fields
}

if (validation.warnings.length > 0) {
  console.warn('Schema validation warnings:', validation.warnings);
  // Warnings: missing recommended fields
}

// Example output:
{
  valid: true,
  errors: [],
  warnings: [
    "Only 2 FAQ(s) found. Recommended: 3-5 for better SEO",
    "Only 3 image(s) found. Recommended: 5+ for better image search visibility"
  ]
}
```

---

## Testing & Validation

### Validation Tools

1. **Schema.org Validator** (PRIMARY)
   - URL: https://validator.schema.org/
   - Copy JSON-LD output and paste
   - Checks: syntax, required fields, types

2. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Tests: eligibility for rich results
   - Live URL or code snippet

3. **Google Structured Data Testing Tool** (DEPRECATED)
   - URL: https://search.google.com/structured-data/testing-tool
   - Use Rich Results Test instead

### Testing Workflow

```bash
# 1. Start dev server
npm run dev

# 2. Visit restaurant page
http://localhost:3000/places-to-eat/restaurants/le-relais-de-lentrecte-subhan

# 3. View page source (Ctrl+U)
# 4. Find <script type="application/ld+json">
# 5. Copy JSON-LD content
# 6. Paste into validator.schema.org
# 7. Fix any errors/warnings
```

### Common Validation Issues

| Error | Cause | Fix |
|-------|-------|-----|
| "Missing required field: name" | Restaurant name not in database | Add name to database |
| "Invalid rating value" | Rating outside 0-10 range | Validate rating calculation |
| "Invalid date format" | Review date not ISO 8601 | Use `.toISOString()` |
| "Image URL not accessible" | Broken image link | Check Supabase storage URL |
| "Opening hours invalid" | Incorrect time format | Use "HH:MM" format (24-hour) |

---

## SEO Impact

### Expected Results Timeline

**Week 1-2**: Google indexes new schema markup
**Week 3-4**: Star ratings appear in search results (if 2+ reviews)
**Month 2-3**: FAQ rich results appear
**Month 3-6**: Sitelinks search box (WebSite schema)
**Month 6+**: Knowledge Graph consideration (Organization schema)

### Metrics to Track

1. **CTR (Click-Through Rate)**
   - Before schema: baseline
   - After schema: expect 25-40% increase (star ratings)

2. **Impressions**
   - Rich results get more SERP real estate
   - FAQ snippets increase visibility

3. **Position**
   - Better engagement signals improve rankings
   - LLM training improves conversational AI results

4. **Traffic Sources**
   - Organic search (traditional)
   - ChatGPT, Perplexity (LLM search)
   - Google Images (ImageObject schemas)

### LLM Search Optimization

**Why FAQs Matter for AI**:
- ChatGPT, Perplexy, Claude train on structured data
- FAQ format is ideal for Q&A models
- 7+ FAQs per restaurant = competitive advantage
- Natural language answers train conversational responses

**Example LLM Query**:
```
User: "What are the best French restaurants in Goa for a business lunch?"

AI Response (trained on our schemas):
"Le Relais De l'EntrecÃ´te is highly rated (8.5/10) and excellent for business lunches.
They specialize in French cuisine and steak frites. They accept reservations and are
located in Salmiya. Opening hours are..."

Source: Best of Goa FAQs + knowsAbout properties
```

---

## Future Expansion

### Planned Place Types

When adding hotels, attractions, schools:

1. **Keep Restaurant Structure** - Don't refactor yet
2. **Create New Generators** - hotel.ts, attraction.ts
3. **Identify Shared Components** - After 2nd type
4. **Extract to Shared** - Only when pattern clear

### Shared Components (Future)

Likely candidates for extraction:
- Address generation (PostalAddress)
- Rating generation (AggregateRating)
- Image selection logic
- FAQ validation
- Breadcrumb generation

### Schema Types for Future Expansion

| Place Type | Primary Schema | Additional Schemas |
|-----------|---------------|-------------------|
| **Hotels** | `Hotel` (LocalBusiness) | LodgingBusiness, Review, Image, FAQ |
| **Attractions** | `TouristAttraction` | Event, Review, Image, FAQ |
| **Schools** | `EducationalOrganization` | School, Review, FAQ |
| **Shopping Malls** | `ShoppingCenter` | Store, Event, Review, Image |

### Best Practices for Expansion

1. **Universal fields remain universal** (name, description, address, etc.)
2. **New category-specific fields** documented in this file
3. **Test each new type** with validator.schema.org
4. **Update this documentation** with new mappings
5. **Maintain BestDubai.com practices** (proven strategy)

---

## Appendix

### Complete Schema.org Type Hierarchy

```
Thing
  â””â”€â”€ Place
      â””â”€â”€ LocalBusiness
          â”œâ”€â”€ Restaurant âœ… (Implemented)
          â”œâ”€â”€ Hotel â³ (Future)
          â”œâ”€â”€ TouristAttraction â³ (Future)
          â””â”€â”€ EducationalOrganization â³ (Future)
  â””â”€â”€ Organization âœ… (Implemented)
  â””â”€â”€ WebSite âœ… (Implemented)
  â””â”€â”€ CreativeWork
      â”œâ”€â”€ FAQPage âœ… (Implemented)
      â””â”€â”€ Menu âœ… (Implemented)
  â””â”€â”€ Review âœ… (Implemented)
  â””â”€â”€ ImageObject âœ… (Implemented)
  â””â”€â”€ BreadcrumbList âœ… (Implemented)
```

### References

- **Schema.org Restaurant**: https://schema.org/Restaurant
- **Schema.org LocalBusiness**: https://schema.org/LocalBusiness
- **Google Search Central - Structured Data**: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- **BestDubai.com Reference**: User-provided schema practices
- **Goa Neighborhoods Reference**: `docs/GOA_NEIGHBORHOODS_REFERENCE.md`

---

**Document Status**: Complete
**Implementation Status**: Ready for deployment
**Next Steps**: Integrate schemas into restaurant pages, test with validator.schema.org, deploy to production

---

*This documentation follows the 5 Day Sprint Framework principles: systematic, security-first, comprehensive.*
