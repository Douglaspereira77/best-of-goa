# Dish Pages Implementation

## Overview

Implementation date: **November 2025**

The "Dish Pages" feature allows users to browse restaurants by specific dish types, targeting commercial search queries like "best sushi goa" or "best burger goa".

---

## URL Structure

```
/places-to-eat/dishes                    # Hub page (lists all dish types)
/places-to-eat/dishes/[dish]             # Individual dish pages
```

### Examples

```
/places-to-eat/dishes/sushi
/places-to-eat/dishes/burger
/places-to-eat/dishes/shawarma
/places-to-eat/dishes/biryani
/places-to-eat/dishes/pizza
```

---

## Breadcrumb Navigation

```
Home â†’ Places to Eat â†’ Dishes â†’ [Dish Name]
```

Example: Home â†’ Places to Eat â†’ Dishes â†’ Sushi

### Schema.org Implementation

Located in: `src/lib/schema/generators/breadcrumb.ts`
- `generateDishTypeBreadcrumbSchema()` - For dish type pages

---

## Files Created

### Query Infrastructure

**1. `src/lib/queries/dish-pages.ts`**

Core data fetching and dish type definitions:

```typescript
// Dish types with keywords
export const dishTypes = {
  sushi: {
    name: 'Sushi',
    keywords: ['sushi', 'maki', 'nigiri', 'sashimi', 'roll'],
    description: 'Fresh Japanese sushi, maki rolls, and sashimi',
  },
  // ... 17 more dish types
}

// Functions
getRestaurantsByDish(dishSlug, limit)      // Get restaurants serving a dish
getPopularDishesWithCounts()                // Get all dishes with restaurant counts
getFeaturedDishes(limit)                    // Get top dishes by count
getDishBySlug(slug)                         // Get dish metadata
getAllDishSlugs()                           // Get all slugs for static generation
```

**Supported Dish Types (18 total):**

1. Sushi
2. Burger
3. Shawarma
4. Biryani
5. Pizza
6. Pasta
7. Steak
8. Seafood
9. Falafel
10. Hummus
11. Kebab
12. Ramen
13. Curry
14. Tacos
15. Fried Chicken
16. Dessert
17. Breakfast
18. Salad

### Route Pages

**2. `src/app/places-to-eat/dishes/page.tsx`**

Dishes hub page featuring:
- Orange/red gradient hero section
- Breadcrumb navigation
- Grid of all dish types with restaurant counts
- SEO content section explaining benefits
- SEO metadata generation

**3. `src/app/places-to-eat/dishes/[dish]/page.tsx`**

Dynamic dish type pages featuring:
- Visual breadcrumb navigation
- Schema.org BreadcrumbList markup
- Schema.org CollectionPage with ItemList markup
- Orange/red gradient hero section
- Search bar for filtering
- Restaurant grid with RestaurantCard components
- Related dishes section
- SEO-optimized metadata generation
- Static params for all 18 dish types

---

## Files Modified

### Hub Page Integration

**4. `src/app/places-to-eat/page.tsx`**

Added "Browse by Dish" section:
- Import `getFeaturedDishes` from dish-pages query
- Add to parallel data fetching with `Promise.all()`
- Orange/pink gradient background section
- 6-column responsive grid
- Links to individual dish pages
- "View All Dishes" button

### Schema Generators

**5. `src/lib/schema/generators/breadcrumb.ts`**

Updated `generateDishTypeBreadcrumbSchema()`:
- Changed URL structure from `/dishes/[slug]` to `/places-to-eat/dishes/[slug]`
- Added "Places to Eat" as second breadcrumb item
- Added "Dishes" as third breadcrumb item

---

## Database Query Strategy

The dish pages use keyword-based searching:

```typescript
// Build OR conditions for keyword matching
const keywords = dishType.keywords;
const orConditions = keywords
  .map(keyword => `name.ilike.%${keyword}%`)
  .join(',');

// Query restaurants_dishes table
const { data: matchingDishes } = await supabase
  .from('restaurants_dishes')
  .select('restaurant_id')
  .or(orConditions);

// Get unique restaurant IDs
const restaurantIds = [...new Set(matchingDishes.map(d => d.restaurant_id))];

// Fetch restaurant details
const { data: restaurants } = await supabase
  .from('restaurants')
  .select(`
    id, slug, name, short_description, area,
    hero_image, overall_rating, total_reviews_aggregated,
    price_level, restaurants_cuisines!inner(cuisines(id, name, slug))
  `)
  .in('id', restaurantIds)
  .order('overall_rating', { ascending: false });
```

This approach:
- Searches dish names with multiple keywords (e.g., "sushi" matches "sushi", "maki", "nigiri")
- Handles spelling variations (e.g., "shawarma" and "shawerma")
- Returns unique restaurants (no duplicates)
- Orders by rating for best quality first

---

## SEO Features

### Meta Tags

Each page generates optimized meta tags:
- Title: `Best ${dish.name} in Goa (${totalCount} Restaurants) | Best of Goa`
- Description: Dish-specific with count and keywords
- OpenGraph tags for social sharing
- Canonical URLs pointing to new structure

### Schema.org Markup

1. **BreadcrumbList** - Navigation path
2. **CollectionPage** - Collection of restaurants
3. **ItemList** - List of restaurant items with ratings

### Keyword Strategy

Keywords are generated for each dish type:
- Primary: "best [dish] goa"
- Location variants: "best [dish] goa city", "best [dish] salmiya"
- Descriptive: "top rated [dish] restaurants"

---

## Testing URLs

### Development Server

```bash
npm run dev
```

### Hub Page

```
http://localhost:3000/places-to-eat/dishes
```

### Dish Type Pages

```
http://localhost:3000/places-to-eat/dishes/sushi
http://localhost:3000/places-to-eat/dishes/burger
http://localhost:3000/places-to-eat/dishes/shawarma
http://localhost:3000/places-to-eat/dishes/biryani
```

### Places to Eat Hub (with Dishes Section)

```
http://localhost:3000/places-to-eat
```

---

## SEO Target Keywords

Each dish page targets specific commercial queries:

| Dish | Target Keywords |
|------|----------------|
| Sushi | "best sushi goa", "sushi restaurants goa" |
| Burger | "best burger goa", "burger joints goa" |
| Shawarma | "best shawarma goa", "shawarma near me goa" |
| Biryani | "best biryani goa", "indian biryani goa" |
| Pizza | "best pizza goa", "pizza delivery goa" |
| Steak | "best steak goa", "steakhouse goa" |
| Seafood | "best seafood goa", "fish restaurants goa" |
| Ramen | "best ramen goa", "japanese noodles goa" |

---

## Future Enhancements

1. **Emoji Mapping** - Add dish-specific emojis (ðŸ£, ðŸ”, ðŸŒ¯, etc.)
2. **Price Filtering** - Filter by average price for dish type
3. **Area Filtering** - "Best sushi in Salmiya"
4. **Image Gallery** - Hero images of actual dishes
5. **User Ratings** - Dish-specific ratings vs restaurant ratings
6. **Popular Items** - "Most ordered sushi rolls in Goa"
7. **Seasonal Dishes** - Holiday/Ramadan specific dishes
8. **Cross-linking** - Link dishes to cuisines (Sushi â†’ Japanese)

---

## Maintenance Notes

### Adding New Dish Types

1. Add to `dishTypes` object in `src/lib/queries/dish-pages.ts`:
```typescript
new_dish: {
  name: 'New Dish',
  keywords: ['new', 'dish', 'variants'],
  description: 'Description for SEO',
}
```

2. Add to `slugToName` mapping in `src/app/places-to-eat/dishes/[dish]/page.tsx` (Related Dishes section)

3. Page will auto-generate from definition

### Modifying Keyword Search

Edit `dishTypes` in `src/lib/queries/dish-pages.ts`:
- Add more keywords for broader matches
- Remove keywords for more specific results
- Keywords are case-insensitive (using `ilike`)

### Updating Restaurant Count Display

The count comes from `restaurants_dishes` table:
- Only dishes added to restaurants will be matched
- Regular extraction pipeline should populate this table
- Run `getPopularDishesWithCounts()` to see current stats

---

## Files Summary

**Total: 5 file operations**

New files (3):
- `src/lib/queries/dish-pages.ts`
- `src/app/places-to-eat/dishes/page.tsx`
- `src/app/places-to-eat/dishes/[dish]/page.tsx`

Modified files (2):
- `src/app/places-to-eat/page.tsx` (added Browse by Dish section)
- `src/lib/schema/generators/breadcrumb.ts` (updated URL structure)

---

## Comparison with Cuisine Pages

| Feature | Cuisines | Dishes |
|---------|----------|--------|
| Hub URL | `/places-to-eat` | `/places-to-eat/dishes` |
| Detail URL | `/places-to-eat/[cuisine]` | `/places-to-eat/dishes/[dish]` |
| Data Source | `cuisines` table | `restaurants_dishes` table with keyword matching |
| Gradient | Blue | Orange/Red/Pink |
| Badge Color | Blue | Orange |
| Query Method | Direct cuisine FK | Keyword-based search |
| Count Source | Direct join count | Unique restaurant IDs from keyword match |

---

## Conclusion

The Dish Pages implementation successfully adds a new dimension to restaurant discovery, allowing users to find restaurants based on specific dishes they crave. This targets high-intent commercial searches and provides rich Schema.org structured data for optimal SEO performance.

The keyword-based matching system is flexible enough to handle:
- Multiple spellings (shawarma/shawerma)
- Related items (sushi includes maki, nigiri, sashimi)
- Broad categories (seafood includes fish, shrimp, lobster)

This establishes a scalable pattern that can be expanded with more dish types as the database grows.
