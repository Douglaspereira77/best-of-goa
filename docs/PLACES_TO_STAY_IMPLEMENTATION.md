# Places to Stay - Hotel Directory Implementation

## Overview

Implementation date: **November 2025**

The "Places to Stay" hotel directory mirrors the restaurant "Places to Eat" architecture, providing a consistent user experience and SEO-optimized URL structure.

---

## URL Structure

### Before Implementation
```
/hotels/[slug]                    # Direct access, no breadcrumb hierarchy
```

### After Implementation
```
/places-to-stay                   # Hub page (NEW)
/places-to-stay/[category]        # Category pages (NEW)
/places-to-stay/hotels/[slug]     # Detail pages with breadcrumbs (MOVED)
/hotels/[slug]                    # 301 redirect to new location (PRESERVED)
```

### Comparison with Restaurants
```
RESTAURANTS:
/places-to-eat                           # Hub
/places-to-eat/[cuisine]                 # Category (japanese, italian)
/places-to-eat/restaurants/[slug]        # Detail

HOTELS:
/places-to-stay                          # Hub
/places-to-stay/[category]               # Category (luxury-hotels, budget-hotels)
/places-to-stay/hotels/[slug]            # Detail
```

---

## Breadcrumb Navigation

### Hotel Detail Pages
```
Home â†’ Places to Stay â†’ Hotels â†’ [Hotel Name]
```

### Hotel Category Pages
```
Home â†’ Places to Stay â†’ [Category Name]
```
Example: Home â†’ Places to Stay â†’ Luxury Hotels

### Schema.org Implementation
Located in: `src/lib/schema/generators/breadcrumb.ts`
- `generateHotelBreadcrumbSchema()` - For hotel detail pages
- `generateHotelCategoryBreadcrumbSchema()` - For category pages

---

## Files Created

### Query Infrastructure (3 files)

**1. `src/lib/queries/places-to-stay.ts`**
Hub page data fetching:
```typescript
getTopRatedHotels(limit)          // 4.0+ Google rating
getLuxuryHotels(limit)            // 5-star hotels
getBudgetFriendlyHotels(limit)    // 3-star and below
getAllCategoriesWithCounts()      // Hotel categories with counts
getGovernoratesWithHotelStats()   // Goa governorates
getTotalHotelCount()              // Total count
```

**2. `src/lib/queries/hotel-category-pages.ts`**
Category filtering:
```typescript
getHotelsByCategory(slug, limit)  // Hotels by category slug
getCategoryBySlug(slug)           // Category metadata
```

**3. `src/lib/queries/hotel.ts`**
Individual hotel data with relations:
```typescript
getHotelBySlug(slug)              // Full hotel with amenities, facilities, rooms, FAQs
getHotelWithRelations(id)         // By ID instead of slug
getAllHotels(filters)             // List with search/filter/pagination
```

### Components (3 files)

**4. `src/components/hotel/HotelCard.tsx`**
Grid card for hotel listings:
- Hotel image with fallback
- Google rating badge (X.X/5)
- Star rating badge (â­â­â­â­â­)
- Category tags
- Short description
- Area location
- Price range
- Review count
- Links to `/places-to-stay/hotels/[slug]`

**5. `src/components/hotel/QuickFilterPills.tsx`**
Navigation pills:
- Top Rated
- Luxury
- Budget-Friendly
- Resorts

**6. `src/components/hotel/GovernorateCard.tsx`**
Governorate cards with hotel counts for Goa's 6 governorates.

### Route Pages (4 files)

**7. `src/app/places-to-stay/page.tsx`**
Hub page featuring:
- Hero section with search
- Top Rated Hotels section (8 cards)
- Luxury Hotels section (8 cards)
- Browse by Governorate (6 cards)
- Browse by Category grid
- Budget-Friendly Hotels section (8 cards)
- Call-to-action

**8. `src/app/places-to-stay/[category]/page.tsx`**
Dynamic category pages:
- Breadcrumb navigation
- Hotel grid with HotelCard
- CollectionPage schema.org markup
- SEO metadata generation
- Static params for common categories:
  - luxury-hotels
  - budget-hotels
  - resorts
  - serviced-apartments
  - 5-star-hotels
  - 4-star-hotels
  - 3-star-hotels
  - boutique-hotels
  - business-hotels
  - family-hotels

**9. `src/app/places-to-stay/hotels/[slug]/page.tsx`**
Individual hotel page:
- Visual breadcrumb navigation
- Schema.org BreadcrumbList
- Hero image with overlays
- Star rating and Google rating badges
- Price range indicator
- Description section
- "What Guests Say" (review sentiment)
- Rooms & Suites grid
- Amenities & Facilities tags
- Photo gallery
- Interactive map
- FAQs accordion
- Contact information sidebar
- Social media links

**10. `src/app/hotels/[slug]/page.tsx`** (MODIFIED)
Now serves as 301 redirect:
```typescript
redirect(`/places-to-stay/hotels/${slug}`)
```

---

## Files Modified

### Schema Generators (1 file)

**11. `src/lib/schema/generators/breadcrumb.ts`**
Added two new functions:
```typescript
generateHotelBreadcrumbSchema(hotelName, hotelSlug, options)
generateHotelCategoryBreadcrumbSchema(categoryName, categorySlug, options)
```

### Navigation (1 file)

**12. `src/app/page.tsx`**
- Updated Hotels category slug: "hotels" â†’ "places-to-stay"
- Updated footer Hotels link: "/hotels" â†’ "/places-to-stay"

---

## Database Schema Requirements

### Hotels Table Fields Used

```sql
-- Core fields
id, slug, name, address, area
hero_image, thumbnail_url
short_description, description

-- Ratings
google_rating        -- 5-point scale (vs restaurant 10-point)
google_review_count
tripadvisor_rating
tripadvisor_review_count

-- Hotel-specific
star_rating          -- 1-5 stars
price_range          -- "$$$" format
check_in_time
check_out_time
room_count

-- Contact
phone, email, website
latitude, longitude

-- Social media
instagram, facebook, twitter, tiktok, youtube, linkedin, snapchat

-- AI-generated
review_sentiment
meta_title, meta_description

-- Raw data
apify_output (JSON)
firecrawl_output (JSON)
```

### Junction Tables

```sql
hotels_categories    -- Links hotels to categories
hotels_amenities     -- Hotel amenities (WiFi, Pool, etc.)
hotels_facilities    -- Hotel facilities (Gym, Spa, etc.)
hotels_rooms         -- Room types (Standard, Suite, etc.)
hotels_images        -- Image gallery
hotels_faqs          -- Frequently asked questions
hotels_policies      -- Cancellation, check-in policies
```

---

## SEO Features

### Meta Tags
Each page generates optimized meta tags:
- Title: "Best [Category] in Goa (X Options) | Best of Goa"
- Description: 150-160 characters with keyword optimization
- OpenGraph tags for social sharing
- Canonical URLs pointing to new structure

### Schema.org Markup
- BreadcrumbList schema for navigation
- CollectionPage schema for category pages
- Hotel schema (to be implemented) for detail pages

### 301 Redirects
- All old `/hotels/[slug]` URLs redirect to `/places-to-stay/hotels/[slug]`
- Preserves SEO link equity
- Maintains backward compatibility

---

## Testing URLs

### Development Server
```bash
npm run dev
```

### Hub Page
```
http://localhost:3000/places-to-stay
```

### Category Pages
```
http://localhost:3000/places-to-stay/luxury-hotels
http://localhost:3000/places-to-stay/budget-hotels
http://localhost:3000/places-to-stay/resorts
```

### Hotel Detail Page
```
http://localhost:3000/places-to-stay/hotels/[slug]
# Example: http://localhost:3000/places-to-stay/hotels/hilton-garden-inn-goa-rai
```

### Legacy Redirect Test
```
http://localhost:3000/hotels/[slug]
# Should redirect to /places-to-stay/hotels/[slug]
```

### Admin Pages (unchanged)
```
http://localhost:3000/admin/hotels/queue
http://localhost:3000/admin/hotels/add
http://localhost:3000/admin/hotels/[id]/review
```

---

## Key Differences: Hotels vs Restaurants

| Feature | Restaurants | Hotels |
|---------|------------|--------|
| Hub URL | `/places-to-eat` | `/places-to-stay` |
| Category Type | Cuisines | Hotel Categories |
| Rating System | 10-point scale (`overall_rating`) | 5-point Google (`google_rating`) |
| Special Badge | Price level ($-$$$$) | Star rating (â­-â­â­â­â­â­) |
| Category Examples | Japanese, Italian, Lebanese | Luxury, Budget, Resort |
| Grid Card | RestaurantCard | HotelCard |
| Query Files | places-to-eat.ts, cuisine-pages.ts | places-to-stay.ts, hotel-category-pages.ts |

---

## Future Enhancements

1. **Hotel Schema.org** - Add full Hotel type markup to detail pages
2. **Review Integration** - Display actual guest reviews
3. **Price Comparison** - Show booking platform prices
4. **Availability Checker** - Real-time room availability
5. **Virtual Tours** - 360Â° hotel tours
6. **Amenity Filters** - Filter by specific amenities (pool, gym, spa)
7. **Distance Calculator** - Distance from airport/landmarks
8. **Similar Hotels** - Related hotel recommendations

---

## Maintenance Notes

### Adding New Hotel Categories

1. Add category to database `categories` table with `entity_type = 'hotel'`
2. Add to static params in `src/app/places-to-stay/[category]/page.tsx`
3. Category page will auto-generate from database

### Updating Hotel Card Display

Edit `src/components/hotel/HotelCard.tsx` to modify:
- Image display
- Rating badges
- Category tags
- Metadata display

### Modifying Breadcrumb Schema

Edit `src/lib/schema/generators/breadcrumb.ts`:
- `generateHotelBreadcrumbSchema()` for detail pages
- `generateHotelCategoryBreadcrumbSchema()` for category pages

---

## Files Summary

**Total: 12 file operations**

New files (9):
- `src/lib/queries/places-to-stay.ts`
- `src/lib/queries/hotel-category-pages.ts`
- `src/lib/queries/hotel.ts`
- `src/components/hotel/HotelCard.tsx`
- `src/components/hotel/QuickFilterPills.tsx`
- `src/components/hotel/GovernorateCard.tsx`
- `src/app/places-to-stay/page.tsx`
- `src/app/places-to-stay/[category]/page.tsx`
- `src/app/places-to-stay/hotels/[slug]/page.tsx`

Modified files (3):
- `src/app/hotels/[slug]/page.tsx` (now redirect)
- `src/lib/schema/generators/breadcrumb.ts`
- `src/app/page.tsx`

---

## Conclusion

The Places to Stay implementation successfully mirrors the Places to Eat architecture, providing:
- Consistent URL structure
- SEO-optimized breadcrumbs
- Schema.org structured data
- 301 redirects for SEO migration
- Modular, maintainable code

This establishes a scalable pattern that can be replicated for other categories (Attractions, Malls, Schools, Gyms) as needed.
