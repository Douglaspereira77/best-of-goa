<!-- bbbf2ced-de1b-4546-b20a-6e14389f9ca7 29ea1ed3-70d3-4d6f-93e9-0d5848365d79 -->
# Comprehensive Restaurant Data Fields Enhancement

## Database Schema Verification Results

Current restaurants table has 84 columns total:

- **Populated fields (27)**: Basic info, AI content (description, meta_title, meta_description, short_description), JSONB outputs (apify_output, firecrawl_output, firecrawl_menu_output, job_progress)
- **Empty but existing fields (57)**: All comprehensive fields already exist in schema including rating_breakdown, hours, awards, busy_times, quiet_times, dress_code, reservations_policy, parking_info, payment_methods, etc.

**Key Finding**: Database schema is COMPLETE. No new columns needed. Problem is AI generation not populating these fields and UI not displaying them.

## Phase 1: UI Components & Display Logic

### 1.1 Update TypeScript Interfaces

File: `src/components/admin/add/ExtractedDataView.tsx`

Expand RestaurantData interface to match existing 84 database columns:

```typescript
interface RestaurantData {
  // Existing basic fields...
  
  // AI-Generated Content (already populated)
  description?: string
  short_description?: string
  meta_title?: string
  meta_description?: string
  review_sentiment?: string
  
  // Ratings (exist but empty)
  overall_rating?: number
  rating_breakdown?: {
    food_quality: number
    service: number
    ambience: number
    value_for_money: number
    accessibility_amenities: number
  }
  google_rating?: number
  google_review_count?: number
  tripadvisor_rating?: number
  tripadvisor_review_count?: number
  opentable_rating?: number
  opentable_review_count?: number
  
  // Operational (exist but empty)
  hours?: Record<string, any>
  dress_code?: string
  reservations_policy?: string
  parking_info?: string
  average_visit_time_mins?: number
  payment_methods?: string[]
  public_transport?: string[]
  
  // Best Times (exist but empty)
  best_time_description?: string
  busy_times?: Record<string, string[]>
  quiet_times?: Record<string, string[]>
  
  // Awards (exist but empty)
  awards?: Array<{
    name: string
    source: string
    year: number
    badge_url?: string
  }>
  michelin_stars?: number
  
  // Social Media (exist but empty)
  twitter?: string
  email?: string
  phone?: string
  website?: string
  
  // Pricing (exist but empty)
  price_level?: number
  average_meal_price?: number
  
  // Location Details (exist but empty)
  mall_name?: string
  mall_floor?: string
  mall_gate?: string
  nearby_landmarks?: string[]
  neighborhood_id?: number
  
  // Special Content (exist but empty)
  secret_menu_items?: Array<any>
  staff_picks?: Array<any>
  kids_promotions?: string
  
  // Menu (exist but empty)
  menu_data?: any
  menu_source?: string
  menu_last_updated?: string
  
  // Array Relationships (exist but empty)
  restaurant_cuisine_ids?: string[]
  restaurant_category_ids?: string[]
  restaurant_feature_ids?: string[]
  restaurant_meal_ids?: string[]
  restaurant_good_for_ids?: string[]
}
```

### 1.2 Expand ExtractedDataView Component

File: `src/components/admin/add/ExtractedDataView.tsx`

Add 10 new collapsible sections (keeping existing sections):

1. **AI-Generated Content** (NEW)

   - Description (500-800 chars)
   - Short Description (100-150 chars)
   - Meta Title & Description
   - Review Sentiment

2. **Detailed Ratings Breakdown** (NEW)

   - Overall Rating (0-10 scale)
   - Food Quality, Service, Ambience, Value for Money, Accessibility
   - Progress bars for each rating
   - External ratings (Google, TripAdvisor, OpenTable)

3. **Operational Details** (EXPAND existing)

   - Hours (formatted display)
   - Dress Code
   - Reservations Policy
   - Average Visit Time
   - Payment Methods (badges)
   - Public Transport options

4. **Pricing Information** (NEW)

   - Price Level ($ to $$$$)
   - Average Meal Price (KWD)
   - Currency

5. **Best Times to Visit** (NEW)

   - Description paragraph
   - Busy Times (by day)
   - Quiet Times (by day)
   - Visual timeline display

6. **Awards & Recognition** (NEW)

   - Michelin Stars display
   - Awards list with badges
   - Year and organization

7. **Location Details** (EXPAND existing)

   - Mall information (name, floor, gate)
   - Nearby landmarks
   - Public transport
   - Neighborhood

8. **Social Media & Contact** (EXPAND existing)

   - All social platforms
   - Phone, Email, Website
   - Clickable links

9. **Special Features** (NEW)

   - Secret Menu Items
   - Staff Picks
   - Kids Promotions

10. **Menu Information** (NEW)

    - Menu source
    - Last updated
    - Menu data preview

### 1.3 Enhance MenuView Component  

File: `src/components/admin/add/MenuView.tsx`

Add comprehensive menu display:

- Group dishes by menu sections
- Show dish details (name, description, price, is_popular)
- Display menu metadata (source, last_updated)
- Show counts (total dishes, popular dishes, sections)

### 1.4 Update Data Processing Logic

File: `src/app/admin/add/page.tsx`

Update `processExtractionData` function to:

```typescript
const processExtractionData = (extractionData: any) => {
  // Map ALL 84 database fields to UI state
  setRestaurantData({
    ...extractionData,
    // Ensure JSONB fields are parsed properly
    rating_breakdown: extractionData.rating_breakdown || null,
    hours: extractionData.hours || null,
    busy_times: extractionData.busy_times || null,
    quiet_times: extractionData.quiet_times || null,
    awards: extractionData.awards || [],
    menu_data: extractionData.menu_data || null,
  })
  
  // Process dishes from menu_data or restaurants_dishes
  if (extractionData.menu_data?.dishes) {
    setMenuItems(extractionData.menu_data.dishes)
  }
  
  // Process categories/cuisines
  if (extractionData.restaurant_cuisine_ids?.length > 0) {
    // Fetch cuisine names and display
  }
}
```

## Phase 2: AI Content Generation Enhancement

### 2.1 Core Content Generation (Existing - Verify)

File: `src/lib/services/anthropic-client.ts`

Current `generateRestaurantContent` already generates:

- description ✅
- short_description ✅
- meta_title ✅
- meta_description ✅
- review_sentiment ✅
- faqs ✅
- dishes ✅

**Action**: Verify this data is being saved to database correctly.

### 2.2 Add Detailed Content Generation

File: `src/lib/services/anthropic-client.ts`

Create NEW method `generateDetailedFields`:

```typescript
async generateDetailedFields(input: RestaurantAIInput): Promise<DetailedFieldsOutput> {
  // Generate in single AI call:
  return {
    rating_breakdown: {
      food_quality: number,
      service: number,
      ambience: number,
      value_for_money: number,
      accessibility_amenities: number
    },
    operational_details: {
      dress_code: string,
      reservations_policy: string,
      average_visit_time_mins: number
    },
    best_times: {
      best_time_description: string,
      busy_times: object,
      quiet_times: object
    },
    pricing: {
      price_level: number,
      average_meal_price: number
    }
  }
}
```

### 2.3 Update Extraction Orchestrator

File: `src/lib/services/extraction-orchestrator.ts`

Add new step after existing `ai_enhancement`:

```typescript
// Step 10: AI Detailed Fields Generation
await this.runStep(job.restaurantId, 'ai_detailed_fields', async () => {
  restaurant = await this.getRestaurant(job.restaurantId);
  
  const detailedFields = await anthropicClient.generateDetailedFields({
    name: restaurant.name,
    apify_data: restaurant.apify_output,
    firecrawl_data: restaurant.firecrawl_output,
    reviews: restaurant.apify_output?.reviews
  });
  
  // Update all detailed fields
  await this.updateRestaurantFields(job.restaurantId, {
    ...detailedFields.operational_details,
    ...detailedFields.pricing,
    rating_breakdown: detailedFields.rating_breakdown,
    best_time_description: detailedFields.best_times.best_time_description,
    busy_times: detailedFields.best_times.busy_times,
    quiet_times: detailedFields.best_times.quiet_times
  });
});
```

### 2.4 Update Progress Tracking

Add `ai_detailed_fields` to extraction steps list in:

- `src/app/api/admin/extraction-status/[jobId]/route.ts`
- `src/app/admin/add/page.tsx` (extractionSteps state)

## Phase 3: Data Retrieval & Display

### 3.1 Update Extraction Status API

File: `src/app/api/admin/extraction-status/[jobId]/route.ts`

Ensure API returns ALL 84 columns:

```typescript
const { data: restaurant, error } = await supabase
  .from('restaurants')
  .select(`
    *,
    restaurants_dishes(*),
    restaurants_faqs(*),
    restaurants_images(*)
  `)
  .eq('id', restaurantId)
  .single();
  
return NextResponse.json({
  success: true,
  restaurant: restaurant,  // All 84 fields
  dishes: restaurant.restaurants_dishes,
  faqs: restaurant.restaurants_faqs,
  images: restaurant.restaurants_images,
  progress: progressPercentage,
  steps: stepDetails
});
```

### 3.2 Real-Time Updates

File: `src/app/admin/add/page.tsx`

Ensure polling processes all new fields:

- Parse JSONB fields correctly
- Update UI sections in real-time
- Show loading states for empty sections

### 3.3 Add Loading States

Add skeleton loaders for all new sections while data loads.

## Critical Fixes Needed

1. **FAQs Not Being Created**: restaurants_faqs table is empty - AI generates FAQs but not saving them
2. **Dishes Not Being Created**: restaurants_dishes table is empty - AI generates dishes but not saving them
3. **Images Not Being Stored**: restaurants_images table is empty
4. **Relationship Arrays Empty**: restaurant_cuisine_ids, restaurant_feature_ids, etc. are empty - data mapping not working
5. **Core Fields Empty**: hours, rating_breakdown, awards, busy_times all empty despite being in schema

## Implementation Priority

**Phase 1 (High Priority)**: UI Display

1. Update ExtractedDataView interface and add 10 sections
2. Enhance MenuView for comprehensive menu display
3. Update data processing logic

**Phase 2 (High Priority)**: Fix Data Saving

1. Fix FAQs creation in orchestrator
2. Fix dishes creation in orchestrator
3. Fix relationship array mapping (Omar's pattern)
4. Verify AI content is being saved

**Phase 3 (Medium Priority)**: Enhanced AI Generation

1. Add detailed fields generation method
2. Update orchestrator with new step
3. Update progress tracking

**Phase 4 (Low Priority)**: Polish

1. Real-time updates optimization
2. Loading states
3. Error handling

## Files to Modify

1. `src/components/admin/add/ExtractedDataView.tsx` - Add 10 comprehensive sections
2. `src/components/admin/add/MenuView.tsx` - Enhanced menu display
3. `src/app/admin/add/page.tsx` - Data processing for all 84 fields
4. `src/lib/services/anthropic-client.ts` - Add detailed fields generation
5. `src/lib/services/extraction-orchestrator.ts` - Fix data saving, add new step
6. `src/app/api/admin/extraction-status/[jobId]/route.ts` - Return all fields
7. `src/lib/services/data-mapper.ts` - Verify Omar's pattern mapping works

### To-dos

- [ ] Add new JSONB columns to restaurants table for flexible data storage
- [ ] Update RestaurantData interface with comprehensive fields
- [ ] Expand ExtractedDataView component with 8 new sections
- [ ] Enhance MenuView component with detailed dish information
- [ ] Update data processing logic in admin/add page
- [ ] Update AI client for core content generation (Phase 2A)
- [ ] Add AI detailed content generation method (Phase 2B)
- [ ] Add detailed content generation step to orchestrator
- [ ] Update extraction status API to return comprehensive data
- [ ] Ensure polling and real-time display of all new fields