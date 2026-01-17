# Schema.org Implementation Guide

## Overview

This document describes the Schema.org structured data implementation for Best of Goa restaurant pages. All schema generation is handled dynamically at page render time using centralized generator functions.

---

## Architecture

### **Dynamic Generation Approach**

We use **dynamic generation** instead of storing pre-computed schemas in the database:

**Benefits:**
- âœ… Always up-to-date with latest data
- âœ… No data duplication
- âœ… Easy to update schema formats globally
- âœ… Can add new schema types without database changes
- âœ… Cached at CDN level (Vercel Edge)

---

## File Structure

```
src/lib/schema/
â”œâ”€â”€ index.ts                    # Main orchestrator & exports
â”œâ”€â”€ types.ts                    # TypeScript type definitions
â””â”€â”€ generators/
    â”œâ”€â”€ restaurant.ts           # Restaurant schema generator
    â”œâ”€â”€ faq.ts                  # FAQPage schema generator
    â”œâ”€â”€ breadcrumb.ts           # BreadcrumbList schema generator
    â””â”€â”€ menu.ts                 # Menu schema generator
```

---

## Schema Types Implemented

### Priority 1 (Always Generated)

1. **Restaurant** - Complete restaurant information
2. **BreadcrumbList** - Navigation hierarchy
3. **AggregateRating** - Embedded in Restaurant schema

### Priority 2 (Conditional)

4. **FAQPage** - If restaurant has FAQs
5. **Menu** - If restaurant has dishes

---

## Usage in Next.js Pages

### Basic Implementation

```typescript
// app/places-to-eat/restaurants/[slug]/page.tsx

import { generateRestaurantPageSchemas } from '@/lib/schema';

export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  // Fetch restaurant data from database
  const restaurant = await getRestaurant(params.slug);

  // Generate schemas
  const schemas = generateRestaurantPageSchemas(restaurant, {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://bestgoa.com'
  });

  return (
    <>
      {/* Insert JSON-LD schemas in head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemas.restaurant)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemas.breadcrumb)
        }}
      />
      {schemas.faq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemas.faq)
          }}
        />
      )}
      {schemas.menu && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemas.menu)
          }}
        />
      )}

      {/* Page content */}
      <main>
        <h1>{restaurant.name}</h1>
        {/* ... */}
      </main>
    </>
  );
}
```

### Using Metadata API (Recommended for Next.js 13+)

```typescript
// app/places-to-eat/restaurants/[slug]/page.tsx

import { generateRestaurantPageSchemas, formatSchemasForHead } from '@/lib/schema';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const restaurant = await getRestaurant(params.slug);

  const schemas = generateRestaurantPageSchemas(restaurant, {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://bestgoa.com'
  });

  return {
    title: restaurant.name,
    description: restaurant.description,
    openGraph: {
      title: restaurant.name,
      description: restaurant.description,
      images: [restaurant.hero_image],
    },
    // Add JSON-LD schemas
    other: {
      'application/ld+json': JSON.stringify(formatSchemasForHead(schemas))
    }
  };
}
```

---

## Generated Schema Examples

### Restaurant Schema Output

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "The Cheesecake Factory",
  "description": "American restaurant chain known for extensive menu...",
  "image": ["https://bestgoa.com/images/cheesecake-factory-hero.jpg"],
  "logo": "https://bestgoa.com/images/cheesecake-factory-logo.png",
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
  "telephone": "+96522595555",
  "email": "contact@cheesecakefactory.com.kw",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],
      "opens": "12:00",
      "closes": "23:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Friday", "Saturday"],
      "opens": "12:00",
      "closes": "00:00"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "9.65",
    "bestRating": "10",
    "worstRating": "0",
    "ratingCount": 1247
  },
  "servesCuisine": ["American", "Italian", "Mexican"],
  "priceRange": "$$$",
  "acceptsReservations": true,
  "paymentAccepted": "Cash, KNET, Visa, Mastercard",
  "currenciesAccepted": "KWD",
  "hasMenu": "https://bestgoa.com/places-to-eat/restaurants/the-cheesecake-factory-avenues/menu",
  "sameAs": [
    "https://instagram.com/cheesecakefactory",
    "https://facebook.com/cheesecakefactory"
  ]
}
```

### FAQPage Schema Output

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Does The Cheesecake Factory accept reservations?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, reservations are recommended, especially on weekends and during peak hours."
      }
    },
    {
      "@type": "Question",
      "name": "What are the opening hours?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Open Sunday-Thursday 12:00 PM - 11:00 PM, Friday-Saturday 12:00 PM - 12:00 AM."
      }
    }
  ]
}
```

### BreadcrumbList Schema Output

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://bestgoa.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Places to Eat",
      "item": "https://bestgoa.com/places-to-eat"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Restaurants",
      "item": "https://bestgoa.com/places-to-eat/restaurants"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "The Cheesecake Factory",
      "item": "https://bestgoa.com/places-to-eat/restaurants/the-cheesecake-factory-avenues"
    }
  ]
}
```

---

## Validation

### Built-in Validation

```typescript
import { validateRestaurantSchemaData } from '@/lib/schema';

const validation = validateRestaurantSchemaData(restaurant);

if (!validation.valid) {
  console.error('Schema validation errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Schema validation warnings:', validation.warnings);
}
```

### External Validation Tools

1. **Google Rich Results Test**
   - https://search.google.com/test/rich-results
   - Test live URLs or paste schema JSON

2. **Schema.org Validator**
   - https://validator.schema.org/
   - Validates against Schema.org specifications

3. **Google Search Console**
   - Monitor schema issues in production
   - Track rich results performance

---

## Database Fields Required

### Essential Fields (from `restaurants` table)

- `name` - Restaurant name
- `slug` - URL slug
- `address` - Street address
- `area` - City/area name
- `latitude` - Geographic latitude
- `longitude` - Geographic longitude
- `overall_rating` - Our rating (0-10)
- `total_reviews_aggregated` - Total review count

### Recommended Fields

- `description` - SEO description
- `hero_image` - Primary image
- `logo_image` - Logo
- `phone` - Contact phone
- `email` - Contact email
- `website` - Official website
- `instagram` - Instagram profile
- `facebook` - Facebook profile
- `hours` - Opening hours (JSONB)
- `price_level` - Price range (1-4)
- `currency` - Currency code
- `payment_methods` - Accepted payment methods (array)
- `reservations_policy` - Reservation policy

### Relations Required

- `restaurant_cuisines` - Cuisine types
- `restaurant_features` - Amenities/features
- `restaurant_faqs` - FAQ questions/answers
- `restaurant_dishes` - Menu items
- `restaurant_menu_sections` - Menu organization

---

## Best Practices

### 1. Always Include Core Schemas

âœ… Restaurant + BreadcrumbList on every restaurant page

### 2. Add FAQs for Rich Results

âœ… Minimum 3-5 FAQs per restaurant
âœ… Clear questions with detailed answers

### 3. Complete Restaurant Data

âœ… Fill all recommended fields
âœ… Provide accurate opening hours
âœ… Include high-quality images

### 4. Keep Schemas Updated

âœ… Schemas regenerate on every page load
âœ… Changes to database reflect immediately
âœ… No manual schema updates needed

### 5. Test Regularly

âœ… Use Google Rich Results Test
âœ… Monitor Search Console for issues
âœ… Validate before deploying

---

## Adding New Schema Types

To add a new schema type (e.g., Review, Event, Offer):

1. **Add type definitions** in `src/lib/schema/types.ts`
2. **Create generator** in `src/lib/schema/generators/[name].ts`
3. **Export from index** in `src/lib/schema/index.ts`
4. **Update orchestrator** to include in `generateRestaurantPageSchemas()`
5. **Add to this documentation**

---

## Performance Considerations

### CDN Caching

- Vercel Edge caches rendered pages
- Schema generated once, cached at edge
- No performance impact on production

### ISR (Incremental Static Regeneration)

```typescript
// Regenerate page every 1 hour
export const revalidate = 3600;
```

### On-Demand Revalidation

```typescript
// When restaurant data updates
import { revalidatePath } from 'next/cache';

await updateRestaurant(id, data);
revalidatePath(`/places-to-eat/restaurants/${slug}`);
```

---

## Future Enhancements

### Planned Schema Types

- [ ] **Review** - Individual review markup
- [ ] **Event** - Special events/promotions
- [ ] **Offer** - Deals and discounts
- [ ] **VideoObject** - Video content
- [ ] **ImageObject** - Enhanced image metadata

### Future Features

- [ ] Schema preview in admin panel
- [ ] Automated testing pipeline
- [ ] Schema quality scoring
- [ ] A/B testing different schema formats

---

## Related Documentation

- [Database Architecture](./DATABASE_ARCHITECTURE_RESTAURANTS.md)
- [SEO Strategy](./SEO_STRATEGY.md)
- [Schema.org Restaurant](https://schema.org/Restaurant)
- [Google Rich Results Guide](https://developers.google.com/search/docs/appearance/structured-data)

---

*Last Updated: 2025-10-05*
*Version: 1.0*
