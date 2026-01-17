# Restaurant Slug Generation System

## Overview

The restaurant slug generation system creates clean, SEO-friendly URLs using a simplified format: **`restaurant-name + area/neighborhood`**. The system includes intelligent duplicate detection to avoid redundant location information when it's already present in the restaurant name.

**Last Updated:** November 9, 2025

---

## Core Principles

### 1. **Simplified Format**
- **Format:** `restaurant-name-area`
- **No street addresses** - Only area/neighborhood information
- **No floor details** - Only meaningful location identifiers
- **Short and clean** - Easy to read and remember

### 2. **Location Priority**
The system uses location data in this priority order:
1. **Neighborhood Slug** (from `restaurant_neighborhoods.slug`) - Most specific, already formatted
2. **Neighborhood Name** (from `restaurant_neighborhoods.name`) - Falls back to name if slug not available
3. **Area** (from `area` field) - Fallback if no neighborhood
4. **Address parsing** - Last resort for generic locations (postal codes and street numbers are filtered out)

### 3. **Duplicate Detection**
Automatically detects when location is already in the restaurant name and prevents duplication.

---

## Function: `generateRestaurantSlugWithArea()`

### Signature
```typescript
generateRestaurantSlugWithArea(
  name: string,           // Restaurant name
  area: string,           // Area from database
  address?: string,       // Full address (fallback only)
  neighborhoodName?: string,    // Neighborhood name (fallback if slug unavailable)
  neighborhoodSlug?: string     // Neighborhood slug from database (PRIORITY - preferred)
): string
```

### Examples

#### Basic Usage
```typescript
// Simple case: name + area
generateRestaurantSlugWithArea("Bazaar gurme", "Salwa")
// â†’ "bazaar-gurme-salwa"

// With neighborhood name (fallback)
generateRestaurantSlugWithArea("The Cheesecake Factory", "Rai", null, "The Avenues")
// â†’ "the-cheesecake-factory-avenues"

// With neighborhood slug (PREFERRED - highest priority)
generateRestaurantSlugWithArea("Leila Min Lebnen", "Rai", "The Avenues Mall...", "The Avenues", "the-avenues")
// â†’ "leila-min-lebnen-the-avenues"
```

#### Duplicate Detection
```typescript
// Location already in name - no duplicate
generateRestaurantSlugWithArea("Ubon Murouj", "Murouj", null, "Murouj")
// â†’ "ubon-murouj" (not "ubon-murouj-murouj")

// Mall name in restaurant name
generateRestaurantSlugWithArea("The Grove - The Warehouse Mall", "South Sabahiya", null, "The Warehouse Mall")
// â†’ "the-grove-the-warehouse-mall" (not "the-grove-the-warehouse-mall-warehouse-mall")
```

#### Spelling Variations
```typescript
// Handles spelling variations (Morouj/Murouj/Mrouj)
generateRestaurantSlugWithArea("Lazy Cat Morouj", "Goa City", null, "Murouj")
// â†’ "lazy-cat-morouj" (detects "Morouj" = "Murouj")

generateRestaurantSlugWithArea("Apiza Restaurant Murouj", "Murouj", null, "Murouj")
// â†’ "apiza-restaurant-murouj"
```

---

## Duplicate Detection Features

### 1. **Location in Name Detection**
Checks if the location (area/neighborhood) already appears in the restaurant name slug.

**How it works:**
- Normalizes both restaurant name and location for comparison
- Checks for location at start, middle, or end of name slug
- Handles multi-word locations (e.g., "warehouse-mall")

**Examples:**
- âœ… "Ubon Murouj" + location "Murouj" â†’ "ubon-murouj" (detected, no duplicate)
- âœ… "The Grove - The Warehouse Mall" + location "warehouse-mall" â†’ "the-grove-the-warehouse-mall"
- âœ… "November & Co" + location "Rai" â†’ "november-co-rai" (not in name, adds location)

### 2. **Spelling Variation Normalization**
Normalizes common spelling variations to detect duplicates correctly.

**Supported Variations:**
- **Locations:** `Morouj` = `Murouj` = `Mrouj` â†’ all normalize to `murouj`
- **Malls:** `The Warehouse Mall` = `Warehouse Mall` = `warehouse-mall` â†’ all normalize to `warehouse-mall`
- **Malls:** `The Avenues` = `Avenues` â†’ normalize to `avenues`

**Example:**
```typescript
// Restaurant name: "Lazy Cat Morouj"
// Neighborhood: "Murouj"
// Normalized: both become "murouj" â†’ duplicate detected
// Result: "lazy-cat-morouj" (no additional location added)
```

### 3. **Multi-Word Location Detection**
Handles multi-word locations like malls and shopping centers.

**How it works:**
1. Normalizes multi-word combinations in restaurant name (e.g., "the-warehouse-mall" â†’ "warehouse-mall")
2. Checks if normalized location words appear consecutively in the name
3. Prevents duplication even when words are separated in name

**Examples:**
- âœ… "The Grove - The Warehouse Mall" detects "warehouse-mall" in name
- âœ… "Restaurant at The Avenues" detects "avenues" in name
- âœ… "Marina Mall Restaurant" detects "marina-mall" in name

### 4. **Mall Name Handling**
Special handling for shopping malls and centers.

**Supported Malls:**
- The Warehouse Mall â†’ `warehouse-mall`
- The Avenues â†’ `avenues`
- Marina Mall â†’ `marina-mall`

**Features:**
- Removes "The" prefix automatically
- Normalizes variations
- Detects in restaurant names

---

## Location Normalization

### `cleanAreaForSlug()` Function
Cleans and normalizes location names for slug generation.

**Rules:**
1. **Postal Code Filtering:** Automatically filters out postal codes (4-6 digit numeric strings)
   - "13063" â†’ rejected (returns 'goa' to skip)
   - Ensures slugs never include postal codes

2. **Street Number Filtering:** Filters out street names with numbers
   - "Street 25" â†’ rejected
   - "St 105" â†’ rejected
   - "Avenue 15" â†’ rejected

3. **Area Mappings:** Maps common variations to standard forms
   - "Goa City" â†’ "goa-city"
   - "Shuwaikh Residential" â†’ "shuwaikh"
   - "Bnied Al-Gar" â†’ "bnied-al-gar"

4. **Article Removal:** Removes "The", "A", "An" prefixes
   - "The Avenues" â†’ "avenues"
   - "The Warehouse Mall" â†’ "warehouse-mall"

5. **Character Cleaning:**
   - Converts to lowercase
   - Removes special characters
   - Replaces spaces with hyphens
   - Removes multiple consecutive dashes (prevents double dashes)
   - Removes leading/trailing hyphens

### Examples
```typescript
cleanAreaForSlug("The Avenues")      // â†’ "avenues"
cleanAreaForSlug("Goa City")      // â†’ "goa-city"
cleanAreaForSlug("The Warehouse Mall") // â†’ "warehouse-mall"
cleanAreaForSlug("Murouj")           // â†’ "murouj"
```

---

## Real-World Examples

### âœ… Correct Slugs

| Restaurant Name | Area | Neighborhood | Slug | Notes |
|----------------|------|--------------|------|-------|
| Bazaar gurme | Salwa | - | `bazaar-gurme-salwa` | Area added |
| November & Co | Rai | - | `november-co-rai` | Area added |
| The Grove | Rai | The Avenues | `the-grove-the-avenues` | Neighborhood slug prioritized |
| Leila Min Lebnen | Rai | The Avenues | `leila-min-lebnen-the-avenues` | Neighborhood slug (no double dash) |
| Ubon Murouj | Murouj | Murouj | `ubon-murouj` | Duplicate detected |
| Lazy Cat Morouj | Goa City | Murouj | `lazy-cat-morouj` | Neighborhood + duplicate detected |
| The Grove - The Warehouse Mall | South Sabahiya | The Warehouse Mall | `the-grove-the-warehouse-mall` | Mall in name detected |
| Apiza Restaurant Murouj | Murouj | Murouj | `apiza-restaurant-murouj` | Duplicate detected |

### âŒ Avoided Patterns (Before Fixes)

| Old Slug (Before) | New Slug (After) | Issue Fixed |
|-------------------|------------------|-------------|
| `bazaar-gurme-al-taawen-street-arabella-mall-ground-floor` | `bazaar-gurme-salwa` | Too verbose, included street/floor |
| `november-co-1577-15` | `november-co-rai` | Included street number |
| `leila-min-lebnen--street-25` | `leila-min-lebnen-the-avenues` | Postal code filtered, neighborhood slug used |
| `leila-min-lebnen--the-avenues` | `leila-min-lebnen-the-avenues` | Double dash fixed |
| `ubon-murouj-murouj` | `ubon-murouj` | Duplicate location |
| `lazy-cat-morouj-goa-city` | `lazy-cat-morouj` | Location already in name |
| `the-grove-the-warehouse-mall-south-sabahiya` | `the-grove-the-warehouse-mall` | Mall already in name |

---

## Implementation Details

### Slug Generation Flow

```
1. Get Location (Priority Order)
   â”œâ”€ If neighborhoodSlug exists â†’ use neighborhood slug directly (no cleaning needed)
   â”œâ”€ Else if neighborhoodName exists â†’ clean neighborhood name
   â”œâ”€ Else if area exists and â‰  "Goa" â†’ clean area (filters postal codes/streets)
   â””â”€ Else if address provided â†’ extract from address (filters postal codes/streets)

2. Generate Base Slug
   â””â”€ Clean restaurant name to lowercase, hyphenated format
      - Removes special characters
      - Replaces spaces with hyphens
      - Removes multiple consecutive dashes
      - Removes leading/trailing dashes

3. Check for Duplicates
   â”œâ”€ Normalize location (spelling variations, articles)
   â”œâ”€ Normalize base slug segments
   â”œâ”€ Check if location words appear in base slug
   â””â”€ If found â†’ return base slug (no location added)

4. Generate Final Slug
   â”œâ”€ Combine: baseSlug + location
   â””â”€ Clean final result: remove double dashes, trim edges
```

### Normalization Process

```typescript
// Step 1: Normalize location
"The Warehouse Mall" 
  â†’ cleanAreaForSlug() 
  â†’ "warehouse-mall"

// Step 2: Normalize restaurant name segments
"The Grove - The Warehouse Mall"
  â†’ ["the", "grove", "the", "warehouse", "mall"]
  â†’ normalizeBaseSlug() 
  â†’ ["the", "grove", "warehouse", "mall"]  // "the-warehouse-mall" normalized

// Step 3: Compare
"warehouse-mall" matches consecutive ["warehouse", "mall"] in base slug
  â†’ Duplicate detected
  â†’ Return: "the-grove-the-warehouse-mall"
```

---

## Database Integration

### Restaurant Neighbors Table
Locations are stored in `restaurant_neighborhoods` table:

```sql
CREATE TABLE restaurant_neighborhoods (
  id int4 PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,     -- "The Warehouse Mall", "Murouj", "The Avenues"
  slug TEXT UNIQUE NOT NULL,     -- "warehouse-mall", "murouj", "avenues"
  name_ar TEXT,                  -- Arabic name
  description TEXT,               -- For SEO pages
  display_order INTEGER          -- 200+ for malls, lower for neighborhoods
);
```

### Restaurant Table Link
```sql
ALTER TABLE restaurants 
ADD COLUMN neighborhood_id int4 REFERENCES restaurant_neighborhoods(id);
```

### Usage
- **Prefer `neighborhood_id`** over `area` field when available
- **Neighborhood slug is highest priority** - use `restaurant_neighborhoods.slug` directly
- Slug generator checks neighborhood slug first, then name, then falls back to `area`
- When creating restaurants, look up `neighborhood_id` from area/address mapping and fetch the slug

---

## Best Practices

### 1. **Always Link Neighborhood**
- Set `neighborhood_id` when creating/updating restaurants
- More specific than `area` field
- Better for SEO and slug generation

### 2. **Use Consistent Naming**
- Store locations in `restaurant_neighborhoods` table
- Use standard names (e.g., "Murouj" not "Morouj")
- System normalizes variations automatically

### 3. **Avoid Manual Slug Edits**
- Let the system generate slugs automatically
- System handles duplicates and normalization
- Manual edits may not follow detection rules

### 4. **Adding New Locations**
When adding new neighborhoods/malls:
```sql
INSERT INTO restaurant_neighborhoods (name, slug, description, display_order)
VALUES 
('The Warehouse Mall', 'warehouse-mall', 'Shopping center in South Sabahiya', 201);
```

---

## Troubleshooting

### Issue: Location duplicated in slug
**Example:** `ubon-murouj-murouj`

**Solution:**
1. Ensure restaurant has `neighborhood_id` linked
2. Verify location name matches (e.g., "Murouj" in name and neighborhood)
3. System should auto-detect and prevent duplication

### Issue: Wrong location used
**Example:** Using "Goa City" instead of "Murouj"

**Solution:**
1. Link restaurant to correct `neighborhood_id`
2. Neighborhood takes priority over `area` field
3. Verify neighborhood exists in `restaurant_neighborhoods` table

### Issue: Slug too long
**Example:** `restaurant-name-very-long-location-name`

**Solution:**
1. Use neighborhood slugs (already shortened)
2. System automatically shortens common patterns
3. Check if location is already in name (prevent duplicates)

### Issue: Double dashes in slug
**Example:** `restaurant-name--location` (double dash)

**Solution:**
1. System automatically prevents double dashes
2. Cleans base slug and location slug separately
3. Final cleanup removes any double dashes when combining
4. Fixed in October 2025 update

### Issue: Postal code or street number in slug
**Example:** `restaurant-name-13063` or `restaurant-name-street-25`

**Solution:**
1. System automatically filters out postal codes (4-6 digits)
2. System filters out street names with numbers
3. Falls back to area or neighborhood if address contains only postal codes
4. Fixed in October 2025 update

---

## Migration Notes

### Slug Regeneration
If slugs were generated before this system:
1. Slugs may be too long or have duplicates
2. Use migration script to regenerate: `bin/migrate-slugs.js`
3. System will automatically use neighborhood if linked
4. Duplicate detection will prevent redundant locations

### Historical Data
- Old slugs preserved in database
- New slugs generated on update/create
- Both formats work, but new format is preferred

---

## API Usage

### Creating Restaurant
```typescript
// In extraction API - map area/address to neighborhood_id first
const neighborhoodId = mapAreaToNeighborhoodId(area, address);

// Look up neighborhood slug (PREFERRED)
const { data: neighborhood } = await supabase
  .from('restaurant_neighborhoods')
  .select('name, slug')
  .eq('id', neighborhoodId)
  .single();

// Generate slug with neighborhood slug (highest priority)
const slug = generateRestaurantSlugWithArea(
  restaurantName,
  area,
  address,
  neighborhood?.name,      // Fallback if slug unavailable
  neighborhood?.slug       // PRIORITY - use this when available
);
```

### Updating Slug
```typescript
// When neighborhood is linked
const { data: restaurant } = await supabase
  .from('restaurants')
  .select('name, area, neighborhood_id, restaurant_neighborhoods(name, slug)')
  .eq('id', restaurantId)
  .single();

const neighborhood = restaurant.restaurant_neighborhoods;

const newSlug = generateRestaurantSlugWithArea(
  restaurant.name,
  restaurant.area,
  null,
  neighborhood?.name,      // Fallback
  neighborhood?.slug       // PRIORITY - preferred
);
```

---

## Testing

### Test Cases
See `src/lib/utils/slug-generator.ts` for test cases:
- Basic slug generation
- Duplicate detection
- Spelling variations
- Multi-word locations
- Mall name handling

### Manual Testing
```typescript
import { generateRestaurantSlugWithArea } from '@/lib/utils/slug-generator';

// Test duplicate detection
generateRestaurantSlugWithArea("Ubon Murouj", "Murouj", null, "Murouj")
// Expected: "ubon-murouj"

// Test mall detection
generateRestaurantSlugWithArea("The Grove - The Warehouse Mall", "South Sabahiya", null, "The Warehouse Mall")
// Expected: "the-grove-the-warehouse-mall"
```

---

## Automatic Slug Regeneration

**Added:** November 9, 2025

The system now automatically regenerates slugs after extraction if they're missing location suffixes. This provides a self-healing mechanism for edge cases where initial slug generation couldn't determine the neighborhood.

### How It Works

During the extraction process (`extraction-orchestrator.ts`):

1. **Initial Creation** (`start-extraction` route)
   - Tries to map neighborhood based on area/address
   - Generates slug with best available data
   - May result in slug without location if neighborhood unknown

2. **Extraction Phase** (`extraction-orchestrator`)
   - Fetches authoritative data from Google via Apify
   - Determines `neighborhood_id` from Google's location data
   - **NEW: Automatically checks if slug needs regeneration**

3. **Slug Regeneration** (`regenerateSlugIfNeeded()`)
   - Detects slugs missing location suffix (no dash)
   - Fetches neighborhood data from database
   - Regenerates slug with neighborhood information
   - Ensures uniqueness
   - Updates database automatically

### Example Flow

**Scenario: Restaurant in unmapped area**

```typescript
// Initial creation (area not in mappings)
Name: "HuQQabaz"
Area: "Al-Bidea" (not in mappings)
Neighborhood: null
Slug: "huqqabaz" âŒ (missing location)

// After extraction
Google Data â†’ neighborhood_id = 79 (Bidaa)
Regeneration detects missing suffix
New Slug: "huqqabaz-bidaa" âœ… (fixed automatically)
```

### Benefits

- âœ… **Self-Healing** - Automatically fixes bad slugs
- âœ… **Future-Proof** - Works for any neighborhood Google knows
- âœ… **Zero Maintenance** - No manual intervention needed
- âœ… **Authoritative Data** - Uses Google's location information
- âœ… **Handles Edge Cases** - Catches misspellings, variants, new areas

### When Regeneration Occurs

Slug regeneration happens when:
- Slug has no dash (missing location suffix)
- Restaurant has `neighborhood_id` set
- Neighborhood data available in database

Regeneration is **skipped** when:
- Slug already has location suffix
- No `neighborhood_id` available
- Generated slug matches current slug

### Performance

- **Overhead:** ~50ms per extraction
- **Frequency:** Only when slug needs fixing
- **Blocking:** Non-blocking background process
- **Impact:** Negligible

### Location

- **Implementation:** `src/lib/services/extraction-orchestrator.ts`
- **Method:** `regenerateSlugIfNeeded()` (lines 847-956)
- **Called:** After Apify data update (line 102)

### Migration Script

For existing bad slugs, use:
```bash
node bin/fix-all-bad-slugs.js
```

This script:
- Scans all restaurants for missing location suffixes
- Regenerates slugs using neighborhood data
- Ensures uniqueness
- Reports fixes applied

---

## Changelog

### November 9, 2025
- ðŸ”„ **Automatic Slug Regeneration** - Added self-healing slug regeneration after extraction
- âœ… **Method: `regenerateSlugIfNeeded()`** - Detects and fixes slugs missing location suffix
- âœ… **Bidaa Neighborhood** - Added comprehensive mappings for Bidaa/Al-Bidea/Bida'a variants (ID 79)
- âœ… **Hybrid Approach** - Combined automatic regeneration with improved initial mappings
- ðŸ› ï¸ **Migration Scripts** - Created `fix-all-bad-slugs.js` for batch fixing
- ðŸ“š **Documentation** - Added `SLUG_REGENERATION_IMPLEMENTATION.md` with complete implementation details

### October 29, 2025
- âœ… **Neighborhood Slug Priority** - Added `neighborhoodSlug` parameter to `generateRestaurantSlugWithArea()`
- âœ… **Fixed Double Dash Issue** - Added comprehensive dash cleaning to prevent double dashes (`--`) in slugs
- âœ… **Postal Code Filtering** - Automatically filters out postal codes (4-6 digit numbers) from area/address extraction
- âœ… **Street Number Filtering** - Filters out street names with numbers (e.g., "Street 25", "St 105")
- âœ… **Enhanced Dash Cleaning** - Removes leading/trailing dashes and consolidates multiple dashes in all slug components
- âœ… **Updated Start-Extraction Route** - Now maps to `neighborhood_id` and uses neighborhood slug for slug generation

### October 2025
- âœ… Implemented simplified slug format (name + area only)
- âœ… Added duplicate location detection
- âœ… Added spelling variation normalization (Morouj/Murouj)
- âœ… Added mall name detection (The Warehouse Mall, The Avenues)
- âœ… Added multi-word location matching
- âœ… Prioritized neighborhood over area field
- âœ… Fixed "Lazy Cat Morouj" slug issue
- âœ… Migrated existing restaurant slugs to new format

---

## References

- **Source Code:** `src/lib/utils/slug-generator.ts`
- **Extraction Orchestrator:** `src/lib/services/extraction-orchestrator.ts`
- **Database Schema:** `docs/restaurant-data-extraction-spec.md`
- **Neighborhoods Reference:** `docs/GOA_NEIGHBORHOODS_REFERENCE.md`
- **Implementation Details:** `docs/SLUG_REGENERATION_IMPLEMENTATION.md`
