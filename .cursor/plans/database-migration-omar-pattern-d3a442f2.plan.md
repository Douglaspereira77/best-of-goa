<!-- d3a442f2-3a14-4ce9-9b19-fa95b998bb2b da0efe3b-d589-4f18-832c-84bdcf9dbaf4 -->
# Implement Omar's Data Mapping Pattern

## Overview

Build the complete data mapping workflow following Omar's proven pattern: fetch reference data â†’ send to Anthropic â†’ return ID arrays â†’ store directly in restaurants table.

## Implementation Steps

### 1. Create Reference Data Seeding Script

**File**: `seed-reference-data.sql`

Seed all reference tables with common entries:

- **Cuisines** (20+ entries): Japanese, Italian, Middle Eastern, Indian, Chinese, French, Thai, Mexican, Lebanese, American, Korean, Turkish, Mediterranean, Seafood, Steakhouse, BBQ, Vegetarian, Vegan, Fast Food, Cafe
- **Categories** (10+ entries): Fine Dining, Casual Dining, Fast Food, Quick Service, Food Court, Cafe, Dessert Shop, Bakery, Street Food, Food Truck
- **Features** (20+ entries): WiFi, Parking, Outdoor Seating, Private Dining, Vegan Options, Gluten-Free, Halal Certified, Wheelchair Accessible, Delivery, Takeout, Reservations, Kids Menu, Live Music, Pet Friendly, Alcohol Served, Shisha, Buffet, Drive-Thru, Air Conditioned, Late Night
- **Meals** (6 entries): Breakfast, Brunch, Lunch, Afternoon Tea, Dinner, Late Night
- **Good For** (12+ entries): Date Night, Family Dining, Business Lunch, Groups, Kids, Celebrations, Romantic, Casual, Quick Bite, Solo Dining, Meetings, Special Occasions

### 2. Create Data Mapper Service

**File**: `src/lib/services/data-mapper.ts`

Core functionality:

- `fetchAllReferenceData()` - Get all reference tables with IDs
- `mapRestaurantToIDs()` - Main orchestration method
- `sendToAnthropicForMapping()` - Anthropic API call with reference data
- `createMissingEntries()` - Auto-create new cuisines/features if needed
- `updateRestaurantWithIDs()` - Store array IDs in restaurants table

Workflow:

1. Fetch all reference tables (cuisines, categories, features, meals, good_for)
2. Build comprehensive prompt with reference data + restaurant data
3. Send to Anthropic requesting ID arrays
4. Handle new entries (create if not found)
5. Update restaurant with all ID arrays

### 3. Update Anthropic Client

**File**: `src/lib/services/anthropic-client.ts`

Add new method: `mapRestaurantRelationships(restaurantData, referenceData)`

Changes:

- New method specifically for ID mapping
- Separate from content generation
- Returns typed response with ID arrays
- Handles reference data in prompt
- Validates returned IDs exist in reference tables

Response format:

```typescript
{
  cuisine_ids: number[],
  category_ids: number[],
  feature_ids: number[],
  meal_ids: number[],
  good_for_ids: number[],
  neighborhood_match: string | null, // neighborhood name to lookup
  michelin_award_match: string | null, // award name to lookup
  new_entries: {
    cuisines?: string[],
    features?: string[],
    categories?: string[]
  }
}
```

### 4. Update Extraction Orchestrator

**File**: `src/lib/services/extraction-orchestrator.ts`

Add new step: `data_mapping` (runs after `ai_enhancement`)

Changes:

- Import data mapper service
- Add step 6: Data Mapping
- Call `dataMapper.mapRestaurantToIDs(restaurantId)`
- Handle errors gracefully
- Log mapping results

Step order:

1. apify_fetch
2. firecrawl_general
3. firecrawl_menu
4. firecrawl_website (optional)
5. ai_enhancement (content generation)
6. **data_mapping** (NEW - ID mapping)
7. finalize

### 5. Create Query Helper Utilities

**File**: `src/lib/utils/restaurant-queries.ts`

Helper functions for querying with resolved relationships:

- `getRestaurantWithRelations(id)` - Get restaurant with all relationships resolved
- `getRestaurantsByCuisine(cuisineId)` - Array query example
- `getRestaurantsByFeatures(featureIds)` - Multiple feature query
- `getRestaurantsByNeighborhood(neighborhoodId)` - Foreign key query
- `resolveRelationshipArrays(restaurant)` - Helper to resolve all arrays

### 6. Update Type Definitions

**File**: `src/lib/services/data-mapper.ts` (types)

Add interfaces:

- `ReferenceData` - All reference tables structure
- `AnthropicMappingResponse` - Anthropic response format
- `MappingResult` - Final mapping result

### 7. Create Seeding Runner Script

**File**: `run-seed-data.js`

Node script to run seeding:

- Read `seed-reference-data.sql`
- Execute via Supabase client
- Verify seeding success
- Report results

### 8. Testing & Verification

**File**: `test-data-mapping.js`

Test script:

- Create test restaurant
- Run data mapping
- Verify IDs are stored
- Check relationships resolve correctly
- Test edge cases (new entries, missing data)

## Key Design Decisions (Approved)

âœ… **Decision 1**: Separate mapping step after AI enhancement (Omar's way)

âœ… **Decision 2**: Auto-create new entries with logging

âœ… **Decision 3**: Create comprehensive seeding scripts

## Example Prompt for Anthropic

```
You are a data mapping assistant for restaurant data.

REFERENCE DATA:
Cuisines: [{"id":1,"name":"Japanese","slug":"japanese"}, {"id":2,"name":"Italian","slug":"italian"}, ...]
Categories: [{"id":1,"name":"Fine Dining","slug":"fine-dining"}, ...]
Features: [{"id":1,"name":"WiFi","slug":"wifi"}, ...]
Meals: [{"id":1,"name":"Breakfast","slug":"breakfast"}, ...]
Good For: [{"id":1,"name":"Date Night","slug":"date-night"}, ...]
Neighborhoods: [{"id":1,"name":"Goa City","slug":"goa-city"}, ...]

RESTAURANT DATA:
Name: Kout Food
Address: The Avenues Mall, Goa City
Apify Data: {...}
Firecrawl Data: {...}

TASK: Map this restaurant to reference IDs. Return JSON:
{
  "cuisine_ids": [9],
  "category_ids": [3],
  "feature_ids": [1,2,15],
  "meal_ids": [3,5],
  "good_for_ids": [2,8],
  "neighborhood_id": 1,
  "new_entries": {
    "cuisines": ["Goai-American Fusion"] // if needed
  }
}
```

## Files to Create/Modify

**New Files:**

1. `seed-reference-data.sql` - SQL seeding script
2. `run-seed-data.js` - Node seeding runner
3. `src/lib/services/data-mapper.ts` - Core mapping logic
4. `src/lib/utils/restaurant-queries.ts` - Query helpers
5. `test-data-mapping.js` - Testing script

**Modified Files:**

1. `src/lib/services/anthropic-client.ts` - Add mapping method
2. `src/lib/services/extraction-orchestrator.ts` - Add mapping step
3. `src/lib/schema/types.ts` - Add mapping types (if needed)

## Success Criteria

- Reference tables seeded with 50+ entries
- Data mapper successfully maps restaurant to IDs
- Array IDs stored in restaurants table
- Query helpers resolve relationships correctly
- Auto-creation of new entries works
- Complete extraction pipeline runs end-to-end

### To-dos

- [ ] Create migrate-to-omar-pattern.sql with all schema changes
- [ ] Create verify-omar-pattern.js to test migration success
- [ ] Update restaurant-data-extraction-spec.md to reflect new pattern
- [ ] Update DATABASE_OVERVIEW.md with new table counts and patterns
- [ ] Create OMAR_PATTERN_RATIONALE.md explaining the approach
- [ ] Update src/lib/schema/types.ts for new relationship patterns
- [ ] Rename old migrate-database.sql to migrate-database-OLD.sql
- [ ] Run migration script and verification to ensure success