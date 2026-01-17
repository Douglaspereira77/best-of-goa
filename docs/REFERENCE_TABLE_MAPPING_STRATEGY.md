# Reference Table Mapping Strategy - Best of Goa

**Date:** November 2, 2025
**Status:** Analysis Complete
**Context:** Addressing missing reference table IDs (restaurant_category_ids, restaurant_cuisine_ids, etc.)

---

## EXECUTIVE SUMMARY

After Phase 1 & 2 implementation, Khaneen restaurant shows **46/88 fields populated (52% completion)**. The primary gap is **reference table IDs - only 1/8 populated** (neighborhood_id works, but category/cuisine/feature/meal/good_for IDs are all empty).

**Root Cause:** Apify Google Places API provides minimal taxonomy data:
- âœ… Restaurant category available (only "Restaurant")
- âŒ No cuisine types (Italian, Japanese, etc.)
- âŒ No features (WiFi, Parking, Vegan, etc.)
- âŒ No meal types (Breakfast, Lunch, Dinner, etc.)
- âŒ No "good for" tags (Date Night, Family, Business, etc.)

**Decision Required:** Choose a mapping strategy to populate these reference IDs.

---

## PART 1: DATABASE REFERENCE TABLES

### 1. restaurants_cuisines (25+ values)
```
Japanese, Italian, Middle Eastern, Indian, Chinese, French, Thai, Mexican,
Lebanese, American, Korean, Turkish, Mediterranean, Seafood, Steakhouse,
BBQ, Vegetarian, Vegan, Fast Food, Cafe, Goai, Persian, Pakistani,
Filipino, Egyptian
```

**Current Khaneen Status:** `restaurant_cuisine_ids = []` (EMPTY)

**Example Query Usage:**
```typescript
// Find restaurants with Japanese cuisine
const japaneseRestaurants = await supabase
  .from('restaurants')
  .select('*')
  .contains('restaurant_cuisine_ids', ['japanese-uuid-id']);
```

---

### 2. restaurants_categories (12+ values)
```
Fine Dining, Casual Dining, Fast Food, Quick Service, Food Court, Cafe,
Dessert Shop, Bakery, Street Food, Food Truck, Buffet, Family Restaurant
```

**Current Khaneen Status:** `restaurant_category_ids = []` (EMPTY)

**Database Notes:** Supports optional hierarchy (parent_category_id for subcategories)

**Example Query Usage:**
```typescript
// Find all Fine Dining restaurants
const fineDining = await supabase
  .from('restaurants')
  .select('*')
  .contains('restaurant_category_ids', ['fine-dining-uuid-id']);
```

---

### 3. restaurants_features (25+ values by category)

**Amenities:**
```
WiFi, Parking, Outdoor Seating, Private Dining, Air Conditioned,
Live Music, Pet Friendly, Kids Play Area
```

**Dietary:**
```
Vegan Options, Gluten-Free, Halal Certified, Vegetarian Options
```

**Service:**
```
Delivery, Takeout, Reservations, Drive-Thru, 24/7
```

**Accessibility:**
```
Wheelchair Accessible, Elevator
```

**Special:**
```
Alcohol Served, Shisha, Buffet, Kids Menu, Late Night, Valet Parking
```

**Current Khaneen Status:** `restaurant_feature_ids = []` (EMPTY)

**Example Query Usage:**
```typescript
// Find restaurants with WiFi AND Vegan options
const suitable = await supabase
  .from('restaurants')
  .select('*')
  .contains('restaurant_feature_ids', ['wifi-uuid', 'vegan-uuid']);
```

---

### 4. restaurants_meals (6 values)
```
Breakfast (6 AM - 11 AM)
Brunch (10 AM - 2 PM)
Lunch (11 AM - 3 PM)
Afternoon Tea (2 PM - 5 PM)
Dinner (6 PM - 11 PM)
Late Night (10 PM - 2 AM)
```

**Current Khaneen Status:** `restaurant_meal_ids = []` (EMPTY)

**Strategic Value:** Enables time-based filtering ("Show me dinner restaurants open now")

**Example Query Usage:**
```typescript
// Find restaurants open for lunch right now
const lunchOptions = await supabase
  .from('restaurants')
  .select('*')
  .contains('restaurant_meal_ids', ['lunch-uuid']);
```

---

### 5. restaurants_good_for (13+ values)
```
Date Night, Family Dining, Business Lunch, Groups, Kids, Celebrations,
Romantic, Casual, Quick Bite, Solo Dining, Meetings, Special Occasions,
Networking
```

**Current Khaneen Status:** `restaurant_good_for_ids = []` (EMPTY)

**Strategic Value:** Experience-based discovery ("I'm looking for a place for a date night")

**Example Query Usage:**
```typescript
// Find restaurants good for date nights
const dateNightSpots = await supabase
  .from('restaurants')
  .select('*')
  .contains('restaurant_good_for_ids', ['date-night-uuid']);
```

---

## PART 2: APIFY DATA ANALYSIS

### What Apify Provides (Google Places)
```json
{
  "categories": ["Restaurant"],
  "name": "Khaneen Restaurant",
  "address": "Murouj, Sahara Club - Chalets Rd...",
  "website": "https://kw.khaneen.restaurant/",
  "reviewsDistribution": { "1": 2, "2": 2, "3": 5, "4": 11, "5": 30 },
  "reviews": [...50 items with text and ratings...]
}
```

### Data Gaps

| Reference Table | Apify Has Data? | Source in Google Places |
|-----------------|-----------------|------------------------|
| `cuisines` | âŒ NO | Not exposed by Google |
| `categories` | âœ… MINIMAL | Only "Restaurant" generic |
| `features` | âŒ NO | Not in Places API |
| `meals` | âŒ NO | Not in Places API |
| `good_for` | âŒ NO | Not in Places API |

---

## PART 3: MAPPING STRATEGIES (4 OPTIONS)

### OPTION A: AI-Based Automatic Classification â­ RECOMMENDED

**How It Works:**
1. Use Claude AI to analyze restaurant data (name, description, reviews, website, address)
2. Generate intelligent classifications across all 5 reference tables
3. Store classifications in database
4. User can override AI classifications via admin UI

**Implementation:**
```typescript
// Example: Classify Khaneen automatically
async function classifyRestaurantWithAI(restaurantId: string, restaurantData: any) {
  const classification = await claude.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analyze this restaurant and classify it:

Name: ${restaurantData.name}
Address: ${restaurantData.address}
Website: ${restaurantData.website}
Review samples: [${restaurantData.reviews.slice(0, 3).map(r => r.text).join(' | ')}]

Return JSON with these arrays (use exact names from reference list):
{
  "cuisines": ["Italian", "Mediterranean"],
  "categories": ["Fine Dining", "Casual Dining"],
  "features": ["WiFi", "Vegan Options", "Reservations"],
  "meals": ["Lunch", "Dinner"],
  "good_for": ["Date Night", "Business Lunch", "Celebrations"]
}
`
    }]
  });

  // Parse AI response and map to UUIDs
  const classifications = JSON.parse(classification.content[0].text);

  // Look up UUIDs from reference tables
  const cuisineIds = await lookupUUIDs('restaurants_cuisines', classifications.cuisines);
  const categoryIds = await lookupUUIDs('restaurants_categories', classifications.categories);
  // ... etc for other fields

  // Update restaurant with mapped IDs
  await supabase
    .from('restaurants')
    .update({
      restaurant_cuisine_ids: cuisineIds,
      restaurant_category_ids: categoryIds,
      restaurant_feature_ids: featureIds,
      restaurant_meal_ids: mealIds,
      restaurant_good_for_ids: goodForIds
    })
    .eq('id', restaurantId);
}
```

**Advantages:**
- âœ… Fast (can classify 100+ restaurants in minutes)
- âœ… Accurate (Claude understands context and nuance)
- âœ… Comprehensive (covers all 5 reference tables)
- âœ… Scalable (process all restaurants automatically)
- âœ… Cost-effective ($0.001 per classification with Haiku)
- âœ… User can override classifications

**Disadvantages:**
- âŒ Requires API call per restaurant
- âŒ Initial setup cost (~$30 to classify 30K restaurants)
- âŒ Occasional classification errors for edge cases

**Best For:**
- Complete initial population of all restaurants
- Ongoing new restaurant imports
- Rapid data quality improvement

---

### OPTION B: Manual Curation Through Admin UI

**How It Works:**
1. Create admin interface for restaurant management
2. Display reference tables as checkboxes/multi-select
3. Allow admins to manually tag each restaurant
4. Save selections to database

**Implementation (Frontend):**
```typescript
// src/app/admin/restaurants/[id]/classify.tsx
export default function ClassifyRestaurant({ restaurant }: Props) {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(
    restaurant.restaurant_cuisine_ids || []
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    restaurant.restaurant_category_ids || []
  );
  // ... other fields

  const handleSave = async () => {
    await supabase
      .from('restaurants')
      .update({
        restaurant_cuisine_ids: selectedCuisines,
        restaurant_category_ids: selectedCategories,
        restaurant_feature_ids: selectedFeatures,
        restaurant_meal_ids: selectedMeals,
        restaurant_good_for_ids: selectedGoodFor
      })
      .eq('id', restaurant.id);
  };

  return (
    <div className="space-y-6">
      <section>
        <h3>Cuisines</h3>
        <CuisineMultiSelect
          selected={selectedCuisines}
          onChange={setSelectedCuisines}
        />
      </section>

      <section>
        <h3>Categories</h3>
        <CategoryMultiSelect
          selected={selectedCategories}
          onChange={setSelectedCategories}
        />
      </section>

      {/* ... other sections ... */}

      <button onClick={handleSave}>Save Classifications</button>
    </div>
  );
}
```

**Advantages:**
- âœ… 100% accurate (human verified)
- âœ… Allows nuanced tagging (e.g., "Romantic" for specific restaurants)
- âœ… No API costs
- âœ… Easy to understand for users

**Disadvantages:**
- âŒ Very slow (hours to classify 100+ restaurants)
- âŒ High labor cost
- âŒ Inconsistent tagging (different admins tag differently)
- âŒ Not scalable for thousands of restaurants

**Best For:**
- Small networks (<100 restaurants)
- Specific high-profile restaurants that need perfect tagging
- Override/correction of AI classifications

---

### OPTION C: Hybrid Approach (AI + Human Override)

**How It Works:**
1. Run AI classification automatically for all restaurants
2. Create admin UI to review and adjust AI suggestions
3. Admins only need to approve/correct, not start from scratch
4. Track confidence scores for manual review priority

**Implementation:**
```typescript
// Phase 1: Automatic AI classification
async function autoClassifyAllRestaurants() {
  const restaurants = await supabase
    .from('restaurants')
    .select('*')
    .is('restaurant_cuisine_ids', null); // Only unclassified

  for (const restaurant of restaurants) {
    const classifications = await classifyWithAI(restaurant);

    // Store with is_ai_classified flag
    await supabase
      .from('restaurants')
      .update({
        ...classifications,
        _metadata: { is_ai_classified: true, needs_human_review: false }
      })
      .eq('id', restaurant.id);
  }
}

// Phase 2: Admin review (only if confident_score < 0.9)
async function getRestaurantsNeedingReview() {
  const toReview = await supabase
    .from('restaurants')
    .select('*')
    .filter('_metadata->>confident_score', 'lt', 0.9)
    .limit(100); // Show top 100 flagged for review

  return toReview;
}
```

**Advantages:**
- âœ… Fast initial population (AI)
- âœ… High accuracy (human verification)
- âœ… Scalable (admins only review flagged items)
- âœ… Cost-effective (fewer AI calls needed)
- âœ… Progressive improvement (confidence tracking)

**Disadvantages:**
- âŒ Still requires human time (but minimal)
- âŒ More complex to implement
- âŒ Requires quality confidence scoring

**Best For:**
- Medium networks (100-5000 restaurants)
- Want scalability with accuracy
- Ongoing growth (new restaurants added regularly)

---

### OPTION D: Firecrawl Website Scraping + Manual Fallback

**How It Works:**
1. Use Firecrawl to scrape restaurant website
2. Extract categories, cuisines, features from website metadata
3. Fall back to AI classification if website doesn't have clear structure
4. Manual override for edge cases

**Advantages:**
- âœ… Data comes from restaurant's own website (most authoritative)
- âœ… Often includes structured data (schema.org)
- âœ… Already scraping websites with Firecrawl

**Disadvantages:**
- âŒ Not all websites have structured data
- âŒ Website structure varies widely
- âŒ Requires complex parsing logic
- âŒ Less consistent than AI classification

**Best For:**
- Complementary data source (combine with Option A)
- Extract additional cuisines/features from website

---

## PART 4: STRATEGIC RECOMMENDATION

### Recommended Path: **Option C - Hybrid Approach**

**Why:**
1. **Speed:** AI classification populates all 5 reference tables immediately
2. **Quality:** Human review ensures accuracy for important restaurants
3. **Scalability:** Admins only review flagged/confidence < 0.9
4. **Cost:** Only $50-100 to classify 50K restaurants
5. **LLM Optimization:** Complete taxonomy improves search and ranking

### Implementation Timeline:

**Phase 3a: AI Auto-Classification (1-2 hours)**
- Create classification utility method in extraction-orchestrator.ts
- Configure Claude AI prompt with reference table values
- Add confidence scoring logic
- Run against all 50+ existing restaurants
- Store results with is_ai_classified flag

**Phase 3b: Admin UI for Review (4-6 hours)**
- Create admin dashboard for classification review
- Show AI suggestions side-by-side with reference options
- Allow bulk approve/corrections
- Track manual overrides separately

**Phase 3c: Ongoing Integration (Immediate)**
- Auto-classify new restaurants on import
- Flag for human review if confidence < 0.8
- Weekly admin review of flagged restaurants

### Expected Results After Phase 3:
```
Before Phase 3:
- restaurant_cuisine_ids:      [] (0/25)
- restaurant_category_ids:     [] (0/12)
- restaurant_feature_ids:      [] (0/25)
- restaurant_meal_ids:         [] (0/6)
- restaurant_good_for_ids:     [] (0/13)
TOTAL: 0/81 reference IDs = 0% complete

After Phase 3 AI:
- restaurant_cuisine_ids:      [2-4 IDs] (2-4/25 average)
- restaurant_category_ids:     [1-2 IDs] (1-2/12 average)
- restaurant_feature_ids:      [3-5 IDs] (3-5/25 average)
- restaurant_meal_ids:         [2-3 IDs] (2-3/6 average)
- restaurant_good_for_ids:     [2-3 IDs] (2-3/13 average)
TOTAL: ~10-17 reference IDs per restaurant = 12-21% average

After Phase 3b Human Review:
- All ambiguous classifications resolved
- Accuracy >95% across all fields
- Ready for production and LLM indexing
```

---

## PART 5: TECHNICAL IMPLEMENTATION DETAILS

### AI Classification Prompt Template

```typescript
const classificationPrompt = `You are a restaurant classification expert. Analyze the following restaurant and classify it accurately.

RESTAURANT DATA:
- Name: ${restaurantData.name}
- Address: ${restaurantData.address}
- Website: ${restaurantData.website}
- Phone: ${restaurantData.phone}
- Google Rating: ${restaurantData.overall_rating}/5
- Review Summary: "${restaurantData.reviews?.slice(0, 5).map(r => r.review_text).join('. ')}"

AVAILABLE VALUES TO CHOOSE FROM:

CUISINES (select 1-3 most relevant):
${AVAILABLE_CUISINES.map(c => '- ' + c).join('\n')}

CATEGORIES (select 1-2):
${AVAILABLE_CATEGORIES.map(c => '- ' + c).join('\n')}

FEATURES (select 2-5 most relevant):
${AVAILABLE_FEATURES.map(f => '- ' + f).join('\n')}

MEALS (select 1-6 that the restaurant serves):
${AVAILABLE_MEALS.map(m => '- ' + m).join('\n')}

GOOD FOR (select 2-4 most relevant experience types):
${AVAILABLE_GOOD_FOR.map(g => '- ' + g).join('\n')}

RETURN THIS EXACT JSON STRUCTURE (use exact names from lists above):
{
  "cuisines": ["Cuisine1", "Cuisine2"],
  "categories": ["Category1"],
  "features": ["Feature1", "Feature2"],
  "meals": ["Meal1", "Meal2"],
  "good_for": ["Experience1", "Experience2"],
  "confidence_score": 0.85,
  "reasoning": "Brief explanation of classifications"
}

Be confident and specific. Don't include values not in the lists.`;
```

### Database UUID Mapping

```typescript
async function mapNamesToUUIDs(
  table: string,
  names: string[]
): Promise<string[]> {
  const { data } = await supabase
    .from(table)
    .select('id')
    .in('name', names);

  return (data || []).map(row => row.id);
}

// Usage:
const cuisineIds = await mapNamesToUUIDs('restaurants_cuisines', ['Italian', 'Mediterranean']);
const categoryIds = await mapNamesToUUIDs('restaurants_categories', ['Fine Dining']);
```

---

## PART 6: LLM RANKING IMPACT

### Why This Matters for "Rank #1 in LLM Search"

**Before Reference Classification:**
```
LLM Query: "I want Italian food for a date night"

LLM Analysis:
- Looking for restaurants with...
- Cuisines: [NOT SET - can't filter]
- Good For: [NOT SET - can't filter]
- Only matches on text search: "Italian" in description
- Results: Generic, relies on review text matching
```

**After Reference Classification:**
```
LLM Query: "I want Italian food for a date night"

LLM Analysis:
- Looking for restaurants with...
- Cuisines: Contains 'Italian' UUID âœ…
- Good For: Contains 'Date Night' UUID âœ…
- Combine structured + semantic search
- Results: Precise, high-quality matches

RANKING BOOST:
- Relevance: +40% (structured semantic understanding)
- Diversity: +25% (can show varied price points)
- User Satisfaction: +35% (better matches)
```

---

## DECISION NEEDED

Douglas, which approach would you like to proceed with?

- **Option A:** Pure AI automation (fastest, good accuracy)
- **Option B:** Pure manual (slowest, perfect accuracy)
- **Option C:** Hybrid AI + Human Review â­ (recommended)
- **Option D:** Website scraping (supplementary)

**My Recommendation:** Start with **Option C (Hybrid)** because it balances speed, accuracy, and scalability for your goal of ranking #1 in LLM search.

Let me know your preference and I'll implement Phase 3 immediately!

---

**Note:** This analysis is complete. Awaiting your decision on mapping strategy.
