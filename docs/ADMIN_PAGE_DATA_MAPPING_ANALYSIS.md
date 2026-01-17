# Admin Page Data Mapping Analysis

**Date:** November 3, 2025
**Purpose:** Compare Review page vs Admin/Add page data mapping approaches
**Goal:** Unify data fetching and mapping logic for consistency

---

## Current State: Two Different Approaches

### **Review Page** (`/admin/restaurants/[id]/review`)

**API Route:** `/api/admin/restaurants/[id]/review/route.ts`

**Data Fetching:**
```typescript
// Line 18: Uses centralized query helper
const restaurant = await restaurantQueries.getRestaurantWithRelations(restaurantId)
```

**What it Returns:**
- ✅ **Fully resolved relationships** (meals, cuisines, features, categories, good_for)
- ✅ **Michelin awards** properly joined
- ✅ **Neighborhood data** with slug
- ✅ **Quality score calculation** via ratingService
- ✅ **Comprehensive field mapping** from 84+ database columns
- ✅ **Raw extraction data** (apify_output, firecrawl_output)
- ✅ **Prioritizes database columns** over JSON extraction data

**Transformation Logic:**
- Lines 97-162: Clean, declarative mapping
- Falls back gracefully from database → apify → defaults
- Example:
  ```typescript
  name: restaurant.name || apifyData.title || apifyData.name,
  cuisine: apifyData.categoryName || restaurant.primary_category,
  website: apifyData.website || restaurant.website,
  ```

**Benefits:**
- ✅ Single source of truth (`restaurantQueries` helper)
- ✅ Type-safe with proper TypeScript interfaces
- ✅ Easy to maintain and extend
- ✅ Consistent data structure across admin pages

---

### **Admin/Add Page** (`/admin/add`)

**API Route:** `/api/admin/extraction-status/[jobId]`

**Data Fetching:**
```typescript
// Lines 326-404: Polls extraction-status API every 2 seconds
const response = await fetch(`/api/admin/extraction-status/${restaurantId}`)
```

**What it Returns:**
- ⚠️ **Partial data** from extraction job
- ⚠️ **No resolved relationships** (just IDs, not names)
- ⚠️ **Raw extraction JSON** (apify_output, firecrawl_output)
- ⚠️ **Job progress metadata** (steps, status, percentage)

**Transformation Logic:**
- Lines 406-580: Manual mapping of 84+ fields
- Complex nested fallback logic
- Example:
  ```typescript
  setRestaurantData(prev => ({
    ...prev,
    name: extractionData.name || prev.name,
    address: apifyData.address || apifyData.fullAddress || extractionData.address,
    phone: apifyData.phone || apifyData.phoneUnformatted || extractionData.phone,
    website: apifyData.website || apifyData.url || extractionData.website,
    instagram: extractionData.instagram || prev.instagram,
    // ... 80+ more fields
  }))
  ```

**Issues:**
- ❌ **84+ field mapping duplicated** from review page
- ❌ **No relationship resolution** (shows IDs like `[1, 2, 3]` instead of names)
- ❌ **Harder to maintain** - logic spread across 170+ lines
- ❌ **Different data structure** than review page
- ❌ **Inconsistent fallback priority** (extraction vs database)

---

## Key Differences

| Aspect | Review Page | Admin/Add Page |
|--------|-------------|----------------|
| **API Endpoint** | `/api/admin/restaurants/[id]/review` | `/api/admin/extraction-status/[jobId]` |
| **Query Helper** | `restaurantQueries.getRestaurantWithRelations()` | Direct Supabase query |
| **Relationships** | Fully resolved with names | Raw IDs only |
| **Mapping Logic** | 66 lines (clean) | 170+ lines (complex) |
| **Data Priority** | Database → Extraction JSON | Extraction JSON → Database |
| **Type Safety** | Strong (shared interfaces) | Weak (manual mapping) |
| **Maintainability** | High (centralized) | Low (duplicated) |

---

## Specific Field Mapping Examples

### **Social Media Fields**

**Review Page:**
```typescript
instagram: restaurant.instagram,  // From database column
facebook: restaurant.facebook,
```

**Admin/Add Page:**
```typescript
// Lines 554-568: Complex fallback logic
if (extractionData.firecrawl_output && !restaurantData.instagram) {
  const fc = extractionData.firecrawl_output
  const results = Array.isArray(fc.results) ? fc.results : []
  const findUrl = (host: string) =>
    results.find((r: any) => r?.url?.includes(host))?.url
  const ig = findUrl('instagram.com')
  setRestaurantData(prev => ({ ...prev, instagram: ig }))
}
```

### **Cuisine/Category Fields**

**Review Page:**
```typescript
allCuisines: restaurant.cuisines || [],  // Resolved: [{ id: 1, name: "Italian", slug: "italian" }]
categories: restaurant.categories || [],
```

**Admin/Add Page:**
```typescript
// Line 135-138: Only shows as string list
const [cuisines, setCuisines] = useState<string>('')  // "Italian, French, Mediterranean"
// No structured data available
```

### **Awards Field**

**Review Page:**
```typescript
awards: restaurant.awards || [],  // Properly structured array
michelinAward: restaurant.michelin_award,  // Resolved relationship
```

**Admin/Add Page:**
```typescript
// Not available in extraction-status API
// Would need separate query
```

---

## Problems This Creates

### **1. Data Inconsistency**
- User sees different data structure in `/admin/add` vs `/admin/restaurants/[id]/review`
- Field values might differ due to different fallback priorities
- Cuisines show as IDs in add page, names in review page

### **2. Code Duplication**
- 84+ field mapping logic exists in TWO places:
  1. `/api/admin/restaurants/[id]/review/route.ts` (lines 97-162)
  2. `/app/admin/add/page.tsx` (lines 406-580)
- Changes must be made twice
- Easy for logic to diverge over time

### **3. Maintenance Burden**
- Adding new field requires updating both pages
- Bug fixes must be applied twice
- Testing complexity doubled

### **4. User Experience Issues**
- Admin/add page shows raw IDs instead of human-readable names
- Missing calculated fields (quality score, rating breakdown)
- No access to resolved relationship data

---

## Proposed Solutions

### **Option 1: Use Review API in Admin/Add (Recommended)**

**Change:** Make admin/add use `/api/admin/restaurants/[id]/review` once extraction completes

**Implementation:**
```typescript
// In admin/add page.tsx, after extraction completes:
const loadComprehensiveData = async (restaurantId: string) => {
  const response = await fetch(`/api/admin/restaurants/${restaurantId}/review`)
  const data = await response.json()

  setRestaurantData(data.restaurant)  // Already fully mapped!
  setMenuItems(data.menuItems)
  setCategories(data.categories)
  setImages(data.images)
}

// Call this when extraction status changes to 'completed'
if (data.status === 'completed') {
  await loadComprehensiveData(restaurantId)
}
```

**Benefits:**
- ✅ **Single source of truth** - one mapping logic
- ✅ **Immediate consistency** with review page
- ✅ **Less code to maintain** (remove 170+ lines)
- ✅ **Automatically includes** any future field additions
- ✅ **Resolved relationships** work immediately

**Trade-offs:**
- ⚠️ Extra API call after extraction completes
- ⚠️ Small delay (~500ms) to fetch comprehensive data

---

### **Option 2: Enhance Extraction-Status API**

**Change:** Make `/api/admin/extraction-status` return same structure as review API

**Implementation:**
```typescript
// In /api/admin/extraction-status/[jobId]/route.ts
export async function GET(request: NextRequest, { params }) {
  const { jobId } = await params

  // Get extraction status (existing logic)
  const status = await getExtractionStatus(jobId)

  // ALSO get comprehensive restaurant data
  const restaurant = await restaurantQueries.getRestaurantWithRelations(jobId)

  return NextResponse.json({
    ...status,
    extracted_data: transformRestaurantData(restaurant)  // Reuse review page logic
  })
}
```

**Benefits:**
- ✅ **No extra API call** - data comes with status
- ✅ **Single mapping logic** via shared utility
- ✅ **Real-time updates** as extraction progresses

**Trade-offs:**
- ⚠️ Larger response payload (but still <100KB)
- ⚠️ Need to create shared `transformRestaurantData()` utility
- ⚠️ Slightly more complex API endpoint

---

### **Option 3: Create Shared Transformation Utility**

**Change:** Extract mapping logic into reusable function

**Implementation:**
```typescript
// Create: /lib/utils/restaurant-transformer.ts
export function transformRestaurantData(
  restaurant: any,
  apifyData?: any,
  firecrawlData?: any
) {
  return {
    id: restaurant.id,
    name: restaurant.name || apifyData?.title,
    address: apifyData?.address || restaurant.address,
    // ... all 84 fields
    allCuisines: restaurant.cuisines || [],
    categories: restaurant.categories || [],
    // etc.
  }
}

// Use in BOTH places:
// 1. /api/admin/restaurants/[id]/review/route.ts
const transformedRestaurant = transformRestaurantData(restaurant, apifyData, firecrawlData)

// 2. /app/admin/add/page.tsx
const updateRestaurantData = (statusData: any) => {
  const transformed = transformRestaurantData(
    statusData.extracted_data,
    statusData.extracted_data?.apify_output,
    statusData.extracted_data?.firecrawl_output
  )
  setRestaurantData(transformed)
}
```

**Benefits:**
- ✅ **DRY principle** - logic in one place
- ✅ **Testable** - can unit test transformation
- ✅ **Flexible** - can use in any context

**Trade-offs:**
- ⚠️ Need to design utility function interface
- ⚠️ Doesn't solve relationship resolution issue
- ⚠️ Still need to fetch relationships separately

---

## Recommendation: **Option 1** (Use Review API)

**Why:**
- **Fastest to implement** - just change 1 function call
- **Most maintainable** - single source of truth
- **Best user experience** - fully resolved data immediately
- **Least risky** - review API is already tested and working

**Implementation Plan:**

1. **Add helper function to admin/add** (5 min)
   ```typescript
   const loadComprehensiveData = async (restaurantId: string) => {
     const response = await fetch(`/api/admin/restaurants/${restaurantId}/review`)
     const data = await response.json()
     setRestaurantData(data.restaurant)
     setMenuItems(data.menuItems)
     setImages(data.images)
     setCategories(data.categories)
   }
   ```

2. **Call after extraction completes** (2 min)
   ```typescript
   if (data.status === 'completed') {
     await loadComprehensiveData(restaurantId)
     stopPolling()
   }
   ```

3. **Remove manual mapping logic** (5 min)
   - Delete lines 406-580 in updateRestaurantData()
   - Keep only essential state updates during extraction

4. **Test end-to-end** (10 min)
   - Run extraction for test restaurant
   - Verify data populates correctly
   - Check that resolved relationships appear

**Total Time:** ~25 minutes

---

## Discussion Questions

1. **Do we need real-time field updates during extraction?**
   - Currently: Fields populate incrementally as extraction progresses
   - Option 1: Fields populate all at once when extraction completes
   - Trade-off: Real-time progress vs cleaner code

2. **Should we show relationship IDs or names during extraction?**
   - Currently: Shows IDs like `[1, 2, 3]`
   - Option 1: Wait for completion, then show names
   - Alternative: Fetch relationship names in parallel

3. **Is the extra API call acceptable?**
   - ~500ms delay after extraction completes
   - Only happens once per extraction
   - User is already waiting 5+ minutes for extraction

4. **Should we eventually migrate to Option 2?**
   - Cleaner long-term architecture
   - Better performance (no extra call)
   - More work upfront

5. **What fields are most important to see in real-time?**
   - Basic info (name, address, phone)?
   - Images count?
   - Social media?
   - Or okay to wait for completion?

---

## Next Steps

**If we agree on Option 1:**
1. Douglas approves the approach
2. I implement the 4-step plan above
3. We test with Burger Boutique (or new restaurant)
4. We verify data consistency between pages
5. We document the unified data flow

**If we want to discuss further:**
- Which option feels best for your use case?
- Are there specific fields that need real-time updates?
- Do you prefer clean code or real-time UI updates?
- Should we do Option 1 now, Option 2 later?

---

**Let's discuss before I make any changes!** 🤝
