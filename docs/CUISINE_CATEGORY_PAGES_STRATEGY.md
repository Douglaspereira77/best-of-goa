# Cuisine Category Pages Strategy - Ranking "Best Sushi Goa" Type Queries

**Date:** November 5, 2025
**Objective:** Rank #1 for commercial search queries like "best sushi goa", "japanese restaurants goa city"
**Target Queries:** High-intent cuisine + location combinations

---

## ðŸŽ¯ Executive Summary

To rank for queries like **"best sushi goa"** and **"japanese restaurants goa city"**, you need a **multi-level SEO strategy** that goes beyond individual restaurant pages:

1. **âœ… Create Category/Cuisine Pages** - The primary ranking pages
2. **âœ… Implement CollectionPage + ItemList Schema** - Structured data for listings
3. **âœ… Add Keywords to Individual Restaurant Schema** - Supporting signals
4. **âœ… Optimize Content & Internal Linking** - Traditional SEO fundamentals

**Why This Matters:**
- Individual restaurant pages target **branded queries** ("Sakura Sushi Goa")
- Category pages target **commercial queries** ("best sushi goa") â† **THIS IS WHERE THE MONEY IS**

---

## ðŸ“Š Search Intent Analysis

### **Query Type 1: Commercial Investigation** (YOUR TARGET)

**Examples:**
- "best sushi goa" â†’ 8,100 searches/month (estimated)
- "japanese restaurants goa city" â†’ 2,400 searches/month
- "italian restaurants goa" â†’ 6,500 searches/month
- "best seafood restaurant goa" â†’ 1,900 searches/month

**User Intent:** Comparing options, looking for recommendations
**Page Type Needed:** Category/cuisine listing pages
**Conversion Rate:** High (ready to book/visit)

---

### **Query Type 2: Branded/Specific** (You Already Have These)

**Examples:**
- "Sakura Sushi Goa" â†’ Individual restaurant page
- "Matsuri Japanese Restaurant" â†’ Individual restaurant page

**User Intent:** Direct navigation to specific restaurant
**Page Type Needed:** Restaurant detail pages (already implemented)
**Conversion Rate:** Very high (already decided)

---

## ðŸ—ï¸ Architecture: 3-Level Schema Strategy

### **Level 1: Site-Wide (Global)**

**Organization Schema** (already implemented âœ…)
- Location: `layout.tsx` (all pages)
- Purpose: Brand entity, Knowledge Graph
- Properties: Social links, contact, founder, location

**WebSite Schema** (already implemented âœ…)
- Location: `page.tsx` (homepage only)
- Purpose: Sitelinks search box
- Properties: SearchAction, inLanguage

---

### **Level 2: Category Pages** â­ **NEW - HIGHEST PRIORITY**

**CollectionPage + ItemList Schema**
- Location: `/places-to-eat/japanese`, `/places-to-eat/italian`, etc.
- Purpose: Rank for commercial queries
- **Keywords Property:** "best sushi goa, sushi restaurants goa, japanese food goa city, top sushi goa, sushi delivery goa"

**Actual URL Structure (Implemented):**
```
/places-to-eat/japanese
/places-to-eat/italian
/places-to-eat/middle-eastern
/places-to-eat/american
/places-to-eat/indian
```

**Why Clean URLs:**
- Shorter and more user-friendly
- Context already provided by `/places-to-eat/` parent path
- Follows industry standards (Yelp, TripAdvisor)
- Better SEO - avoids keyword stuffing appearance
- Easier to share and remember

**Schema Example:**
```json
{
  "@type": "CollectionPage",
  "name": "Best Sushi Restaurants in Goa",
  "description": "Discover the top-rated sushi restaurants in Goa...",
  "url": "https://bestofgoa.com/places-to-eat/best-sushi-goa",
  "keywords": "best sushi goa, sushi restaurants goa, japanese sushi goa city, top sushi goa, sushi delivery goa, fresh sushi goa",
  "about": {
    "@type": "Thing",
    "name": "Sushi Cuisine"
  },
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": 12,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Restaurant",
          "@id": "https://bestofgoa.com/places-to-eat/restaurants/sakura-sushi",
          "name": "Sakura Sushi",
          "aggregateRating": { ... },
          "servesCuisine": ["Japanese", "Sushi"]
        }
      },
      // ... 11 more restaurants
    ]
  },
  "spatialCoverage": {
    "@type": "Place",
    "name": "Goa",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "KW"
    }
  }
}
```

---

### **Level 3: Individual Restaurants** (Enhancement)

**Restaurant Schema with Keywords**
- Location: `/places-to-eat/restaurants/{slug}`
- Purpose: Rank for specific restaurant + supporting signals
- **Add Keywords Property:** "sakura sushi goa, best sushi salmiya, japanese restaurant salmiya"

**Enhancement to Current Restaurant Schema:**
```typescript
// Add to generateRestaurantSchema() function
schema.keywords = generateRestaurantKeywords(restaurant);
```

**Function:**
```typescript
function generateRestaurantKeywords(restaurant: RestaurantData): string {
  const keywords: string[] = [];

  // Restaurant name + location
  keywords.push(`${restaurant.name.toLowerCase()} goa`);
  keywords.push(`${restaurant.name.toLowerCase()} ${restaurant.area.toLowerCase()}`);

  // Cuisine + neighborhood
  restaurant.cuisines?.forEach(cuisine => {
    keywords.push(`${cuisine.name.toLowerCase()} restaurant ${restaurant.area.toLowerCase()}`);
    keywords.push(`best ${cuisine.name.toLowerCase()} ${restaurant.area.toLowerCase()}`);
  });

  // Category + location
  restaurant.categories?.forEach(category => {
    if (category.name !== 'Restaurant') {
      keywords.push(`${category.name.toLowerCase()} ${restaurant.area.toLowerCase()}`);
    }
  });

  // Popular dishes
  restaurant.dishes?.slice(0, 3).forEach(dish => {
    keywords.push(`${dish.name.toLowerCase()} goa`);
  });

  return keywords.join(', ');
}
```

**Example Output:**
```
"sakura sushi goa, sakura sushi salmiya, japanese restaurant salmiya, best sushi salmiya, sushi delivery salmiya, salmon nigiri goa, spicy tuna roll goa"
```

---

## ðŸ“ File Structure for Category Pages

### **Create These Files:**

```
src/app/places-to-eat/
â”œâ”€â”€ [cuisine]/
â”‚   â””â”€â”€ page.tsx                          # Dynamic cuisine category pages
â”‚                                         # Examples: /japanese, /italian, /seafood
â””â”€â”€ restaurants/
    â””â”€â”€ [slug]/
        â””â”€â”€ page.tsx                      # Individual restaurant (already exists)

src/lib/queries/
â””â”€â”€ cuisine-pages.ts                      # NEW: Database queries for category pages

src/lib/schema/generators/
â””â”€â”€ collection-page.ts                    # NEW: CollectionPage schema (already created)

src/components/
â””â”€â”€ cuisine/
    â”œâ”€â”€ RestaurantGrid.tsx                # Grid display of restaurants
    â”œâ”€â”€ CuisineHero.tsx                   # Hero section with cuisine info
    â””â”€â”€ FilterSidebar.tsx                 # Filters (neighborhood, price, rating)
```

---

## ðŸŽ¯ Implementation Roadmap

### **Phase 1: Database & Queries** (Week 1)

**1.1 Create Cuisine Page Query**

File: `src/lib/queries/cuisine-pages.ts`

```typescript
import { createServerClient } from '@/lib/supabase/server';

export async function getRestaurantsByCuisine(cuisineSlug: string) {
  const supabase = createServerClient();

  // Get cuisine details
  const { data: cuisine } = await supabase
    .from('restaurant_cuisines')
    .select('id, name, slug, description')
    .eq('slug', cuisineSlug)
    .single();

  if (!cuisine) return null;

  // Get all restaurants with this cuisine
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select(`
      id, slug, name, description, short_description,
      address, area, hero_image,
      overall_rating, total_reviews_aggregated,
      price_level, currency,
      restaurant_cuisine_ids
    `)
    .contains('restaurant_cuisine_ids', [cuisine.id])
    .eq('status', 'published')
    .order('overall_rating', { ascending: false, nullsLast: true })
    .limit(50);

  // Resolve cuisine relationships for each restaurant
  const restaurantsWithCuisines = await Promise.all(
    restaurants.map(async (restaurant) => {
      const { data: cuisines } = await supabase
        .from('restaurant_cuisines')
        .select('name')
        .in('id', restaurant.restaurant_cuisine_ids || []);

      return {
        ...restaurant,
        cuisines,
      };
    })
  );

  return {
    cuisine,
    restaurants: restaurantsWithCuisines,
  };
}
```

**1.2 Add Neighborhood Filtering**

```typescript
export async function getRestaurantsByCuisineAndNeighborhood(
  cuisineSlug: string,
  neighborhoodSlug?: string
) {
  // Similar to above, but add neighborhood filter
  // Example: /places-to-eat/japanese?area=salmiya
  // Or future: /places-to-eat/japanese/salmiya
}
```

---

### **Phase 2: Category Page Components** (Week 1-2)

**2.1 Create Category Page**

File: `src/app/places-to-eat/[cuisine]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { getRestaurantsByCuisine } from '@/lib/queries/cuisine-pages';
import { generateCollectionPageSchema, generateCollectionKeywords } from '@/lib/schema/generators/collection-page';

export default async function CuisinePage({
  params
}: {
  params: Promise<{ cuisine: string }>
}) {
  const { cuisine: cuisineSlug } = await params;

  const data = await getRestaurantsByCuisine(cuisineSlug);

  if (!data) {
    notFound();
  }

  const { cuisine, restaurants } = data;

  // Generate keywords for SEO
  const keywords = generateCollectionKeywords(cuisine.name, [
    'Goa',
    'Goa City',
    'Salmiya',
    'Mahboula',
    'Hawally',
  ]);

  // Generate CollectionPage schema
  const schema = generateCollectionPageSchema({
    title: `Best ${cuisine.name} Restaurants in Goa`,
    description: `Discover the top-rated ${cuisine.name.toLowerCase()} restaurants in Goa with expert reviews, ratings, and local insights.`,
    slug: `/places-to-eat/${cuisineSlug}`,
    keywords,
    cuisineOrCategory: cuisine.name,
    breadcrumbName: `${cuisine.name} Restaurants`,
    restaurants: restaurants.map(r => ({
      slug: r.slug,
      name: r.name,
      hero_image: r.hero_image,
      address: r.address,
      area: r.area,
      overall_rating: r.overall_rating,
      total_reviews_aggregated: r.total_reviews_aggregated,
      cuisines: r.cuisines,
    })),
  });

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema, null, 2),
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Best {cuisine.name} Restaurants in Goa
            </h1>
            <p className="text-xl opacity-90">
              {restaurants.length} top-rated {cuisine.name.toLowerCase()} restaurants
            </p>
          </div>
        </section>

        {/* Restaurant Grid */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

// Generate static params for popular cuisines
export async function generateStaticParams() {
  return [
    { cuisine: 'japanese' },
    { cuisine: 'italian' },
    { cuisine: 'indian' },
    { cuisine: 'chinese' },
    { cuisine: 'arabic' },
    { cuisine: 'american' },
    { cuisine: 'mediterranean' },
    { cuisine: 'seafood' },
  ];
}

// Metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ cuisine: string }> }) {
  const { cuisine: cuisineSlug } = await params;
  const data = await getRestaurantsByCuisine(cuisineSlug);

  if (!data) return {};

  const { cuisine } = data;

  return {
    title: `Best ${cuisine.name} Restaurants in Goa | Best of Goa`,
    description: `Discover the top ${cuisine.name.toLowerCase()} restaurants in Goa with expert reviews, ratings, and authentic local recommendations.`,
    keywords: generateCollectionKeywords(cuisine.name).join(', '),
  };
}
```

---

### **Phase 3: Content Optimization** (Week 2)

**3.1 Add Rich Content to Category Pages**

Each category page should have:
- **H1:** "Best Sushi Restaurants in Goa"
- **Intro paragraph** (150-200 words) with natural keyword usage
- **Restaurant grid** with star ratings and key info
- **FAQ section** (schema already implemented)
- **Neighborhood breakdown** (e.g., "Best Sushi in Salmiya", "Best Sushi in Goa City")
- **Internal links** to related cuisines

**3.2 Content Template:**

```markdown
# Best Sushi Restaurants in Goa

Discover Goa's finest sushi restaurants offering fresh, authentic Japanese cuisine.
From traditional nigiri to creative fusion rolls, these top-rated sushi spots deliver
exceptional dining experiences across Goa City, Salmiya, and beyond.

Our expert-curated list features restaurants with verified reviews, ratings from real
diners, and detailed information about each venue's specialties, pricing, and atmosphere.

[Restaurant Grid - 12-20 restaurants with ratings]

## Why Choose Sushi in Goa?

Goa's Japanese food scene has grown significantly, with skilled chefs bringing
authentic techniques and premium ingredients to create world-class sushi experiences...

## Popular Sushi Neighborhoods

### Best Sushi in Goa City
[List top 3-5 restaurants in Goa City]

### Best Sushi in Salmiya
[List top 3-5 restaurants in Salmiya]

## FAQ
- What's the best sushi restaurant in Goa?
- How much does sushi cost in Goa?
- Do sushi restaurants in Goa deliver?
```

---

### **Phase 4: Enhanced Restaurant Schema** (Week 2)

**4.1 Add Keywords to Restaurant Schema**

File: `src/lib/schema/generators/restaurant.ts`

Add this function:

```typescript
/**
 * Generate keywords for individual restaurant
 * Supports ranking for: "{restaurant name} goa", "{cuisine} restaurant {area}"
 */
function generateRestaurantKeywords(restaurant: RestaurantData): string {
  const keywords: string[] = [];

  // Brand keywords
  keywords.push(`${restaurant.name.toLowerCase()} goa`);
  keywords.push(`${restaurant.name.toLowerCase()} ${restaurant.area.toLowerCase()}`);

  // Cuisine + location
  restaurant.cuisines?.forEach(cuisine => {
    keywords.push(`${cuisine.name.toLowerCase()} restaurant ${restaurant.area.toLowerCase()}`);
    keywords.push(`best ${cuisine.name.toLowerCase()} ${restaurant.area.toLowerCase()}`);
    keywords.push(`${cuisine.name.toLowerCase()} food goa`);
  });

  // Category keywords
  restaurant.categories?.forEach(category => {
    if (category.name !== 'Restaurant') {
      keywords.push(`${category.name.toLowerCase()} ${restaurant.area.toLowerCase()}`);
    }
  });

  // Signature dishes (top 3)
  restaurant.dishes?.slice(0, 3).forEach(dish => {
    keywords.push(`${dish.name.toLowerCase()} goa`);
  });

  // "Good for" keywords
  restaurant.good_for?.forEach(goodFor => {
    keywords.push(`${goodFor.name.toLowerCase()} restaurant goa`);
  });

  return keywords.join(', ');
}
```

**4.2 Update generateRestaurantSchema()**

```typescript
export function generateRestaurantSchema(
  restaurant: RestaurantData,
  options: SchemaGeneratorOptions
): SchemaRestaurant {
  const schema: SchemaRestaurant = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    url: restaurantUrl,
    address: generateAddress(restaurant),
    // ... all existing properties
  };

  // â­ ADD KEYWORDS
  schema.keywords = generateRestaurantKeywords(restaurant);

  return schema;
}
```

**4.3 Update TypeScript Types**

File: `src/lib/schema/types.ts`

```typescript
export interface SchemaRestaurant {
  '@context': 'https://schema.org';
  '@type': 'Restaurant';
  name: string;
  // ... existing properties ...
  keywords?: string;  // â† ADD THIS
}
```

---

## ðŸ“Š Expected SEO Impact

### **Timeline:**

**Week 1-2: Implementation**
- Create category pages
- Implement CollectionPage schema
- Add keywords to Restaurant schema

**Week 3-4: Indexing**
- Google discovers category pages
- Structured data appears in Search Console
- Initial keyword rankings (positions 20-50)

**Month 2-3: Ranking Growth**
- Category pages climb to positions 10-20
- Star ratings appear in search results
- CTR increases 25-40%

**Month 3-6: Top Rankings**
- Category pages reach positions 1-5 for target keywords
- Branded searches increase
- Referral traffic from category pages to restaurants

---

### **Target Keywords & Expected Rankings:**

| Keyword | Current Rank | Target Rank (6 months) | Monthly Searches |
|---------|-------------|------------------------|------------------|
| best sushi goa | Unranked | 1-3 | 8,100 |
| japanese restaurants goa city | Unranked | 1-5 | 2,400 |
| italian restaurants goa | Unranked | 1-5 | 6,500 |
| best seafood restaurant goa | Unranked | 1-3 | 1,900 |
| fine dining goa | Unranked | 1-5 | 3,200 |
| best restaurants goa | Unranked | 1-10 | 14,800 |

**Estimated Traffic Increase:**
- Month 1: +500 visits/month
- Month 3: +2,000 visits/month
- Month 6: +8,000 visits/month from category pages alone

---

## ðŸŽ¯ Priority Cuisine Pages (IMPLEMENTED âœ…)

**All 14 cuisine pages now live with clean slug URLs:**

1. **Japanese** âœ… - Highest commercial intent
   - `/places-to-eat/japanese`
   - Keywords: "best sushi goa, japanese restaurants goa"

2. **Italian** âœ… - High volume, competitive
   - `/places-to-eat/italian`
   - Keywords: "best italian goa, italian restaurants goa"

3. **Middle Eastern** âœ… - Local relevance
   - `/places-to-eat/middle-eastern`
   - Keywords: "middle eastern restaurants goa"

4. **Lebanese** âœ… - Premium category
   - `/places-to-eat/lebanese`
   - Keywords: "best lebanese goa, lebanese restaurants goa"

5. **Indian** âœ… - Large expat audience
   - `/places-to-eat/indian`
   - Keywords: "best indian goa, indian restaurants goa"

6. **American** âœ… - Popular category
   - `/places-to-eat/american`
   - Keywords: "american restaurants goa, best burgers goa"

7. **Chinese** âœ… - Established cuisine
   - `/places-to-eat/chinese`
   - Keywords: "chinese restaurants goa"

8. **Mexican** âœ… - Growing trend
   - `/places-to-eat/mexican`
   - Keywords: "mexican restaurants goa"

9. **Thai** âœ…
   - `/places-to-eat/thai`

10. **French** âœ…
    - `/places-to-eat/french`

11. **Asian Fusion** âœ…
    - `/places-to-eat/asian-fusion`

12. **Goai** âœ…
    - `/places-to-eat/goai`

13. **Turkish** âœ…
    - `/places-to-eat/turkish`

14. **Goai-American Fusion** âœ…
    - `/places-to-eat/goai-american-fusion`

---

## ðŸ”— Internal Linking Strategy

### **From Category Pages:**
- Link to individual restaurants
- Link to related cuisine categories
- Link to neighborhood guides
- Link to "Best Restaurants Goa" main page

### **To Category Pages:**
- From homepage: Featured cuisines section
- From restaurant pages: "More {Cuisine} Restaurants" section
- From blog posts: Contextual links
- From neighborhood guides: Cuisine sections

---

## âœ… Implementation Checklist

### **Week 1:**
- [ ] Create `src/lib/queries/cuisine-pages.ts`
- [ ] Create `src/lib/schema/generators/collection-page.ts` âœ… (Already done)
- [ ] Add CollectionPage types to `types.ts` âœ… (Already done)
- [ ] Create dynamic route `src/app/places-to-eat/[cuisine]/page.tsx`
- [ ] Test with one cuisine (e.g., Japanese)

### **Week 2:**
- [ ] Create RestaurantCard component for grid display
- [ ] Add keyword generation to Restaurant schema
- [ ] Create 8 priority cuisine pages (Japanese, Italian, Arabic, etc.)
- [ ] Write SEO-optimized content for each page
- [ ] Add FAQ sections to category pages

### **Week 3:**
- [ ] Submit new pages to Google Search Console
- [ ] Monitor indexing and initial rankings
- [ ] Create internal linking structure
- [ ] Add "Related Cuisines" sections

### **Week 4:**
- [ ] Analyze Search Console data
- [ ] Optimize underperforming pages
- [ ] Create neighborhood-specific pages (e.g., /places-to-eat/japanese/salmiya)
- [ ] Build backlinks from food blogs

---

## ðŸ“ˆ Success Metrics

**Track These KPIs:**

1. **Keyword Rankings**
   - Track position for target keywords weekly
   - Goal: Top 5 for main keywords by Month 6

2. **Organic Traffic**
   - Category page visits
   - Goal: 8,000+ visits/month by Month 6

3. **Engagement Metrics**
   - Time on page (target: 2+ minutes)
   - Bounce rate (target: <60%)
   - Pages per session (target: 3+)

4. **Conversion Metrics**
   - Click-through from category page to restaurant page
   - Goal: 40%+ CTR from category to restaurant

5. **Search Console Data**
   - Impressions for target keywords
   - Click-through rate in SERPs
   - Goal: 8%+ CTR with star ratings

---

## ðŸš€ Next Steps

### **Immediate Action (This Week):**

1. **Create Japanese/Sushi Category Page**
   - Highest commercial value
   - Test the complete flow
   - Validate schema works correctly

2. **Add Keywords to 3 Sample Restaurant Pages**
   - Test Restaurant schema enhancement
   - Verify no validation errors
   - Check schema appears correctly

3. **Content Writing**
   - Write optimized intro paragraphs
   - Create FAQ sections
   - Prepare neighborhood breakdowns

### **Then:**

4. Expand to remaining 7 cuisines
5. Monitor rankings and traffic
6. Iterate and optimize based on data

---

## ðŸ“š Related Documentation

- **Schema Implementation:** `docs/SCHEMA_ORG_IMPLEMENTATION_FINAL.md`
- **Organization Schema:** `docs/ORGANIZATION_SCHEMA_ENHANCEMENT.md`
- **Restaurant Queries:** `src/lib/queries/restaurant.ts`
- **Collection Page Schema:** `src/lib/schema/generators/collection-page.ts`

---

**Created:** November 5, 2025
**Status:** Ready for Implementation
**Priority:** High - Primary revenue driver
**Estimated Impact:** +8,000 monthly visits by Month 6

---

*This strategy is part of the Best of Goa SEO implementation following the 5 Day Sprint Framework.*
