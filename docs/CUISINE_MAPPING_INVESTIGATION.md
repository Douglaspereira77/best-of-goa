# Cuisine Mapping Investigation - HuQQabaz Case Study
**Date:** January 9, 2025
**Restaurant:** HuQQabaz
**Issue:** Wrong cuisines mapped (American + Middle Eastern instead of Turkish/Mediterranean/Hookah Lounge)

---

## ðŸ” Root Cause Analysis

### **What Should Have Happened:**
HuQQabaz should be mapped to:
- Turkish
- Mediterranean
- Hookah Lounge (if exists in database)

### **What Actually Happened:**
HuQQabaz was mapped to:
- **American** (UUID: 551b69d5-ae4a-4166-89ed-27fadeebf9cb)
- **Middle Eastern** (UUID: e4d9c7f6-b45c-4d82-a0ba-4be9605b7a23)

---

## ðŸ“Š Data Flow Investigation

### **Database Schema:**
- Correct table name: `restaurants_cuisines` (not `cuisines`)
- Available cuisines include: Turkish, Mediterranean, American, Middle Eastern, Italian, Japanese, etc.
- Turkish exists: UUID `b7278429-7205-4df9-bc6b-18f9139bf7a1`

### **Extraction Pipeline Flow:**

```
Step 1: Apify Fetch (Google Places)
â”œâ”€ Google provides ONLY: categoryName: "Restaurant"
â”œâ”€ NO cuisine-specific data from Google
â””â”€ Problem: Very generic data

Step 2-8: Additional extraction
â”œâ”€ Firecrawl, menu search, reviews, images
â””â”€ No explicit cuisine data extracted

Step 9: AI Enhancement (OpenAI GPT-4o)
â”œâ”€ File: src/lib/services/openai-client.ts
â”œâ”€ Method: generateRestaurantContent()
â”œâ”€ Input: Apify data, Firecrawl data, reviews, menu
â”œâ”€ Expected Output: cuisine_suggestions: ["Turkish", "Mediterranean"]
â””â”€ **CRITICAL**: These suggestions drive the data mapping!

Step 10: SEO Metadata Generation
â””â”€ (Runs after data mapping)

Step 11: Data Mapping (OpenAI GPT-4o-mini)
â”œâ”€ File: src/lib/services/data-mapper.ts
â”œâ”€ Method: mapRestaurantToIDs()
â”œâ”€ Input: Restaurant data + aiSuggestions from Step 9
â”œâ”€ AI Mapping Priority:
â”‚   PRIMARY: Use cuisine_suggestions from AI Enhancement
â”‚   SECONDARY: Analyze restaurant name, description, Apify data
â””â”€ Maps suggestions to UUIDs from restaurants_cuisines table
```

---

## ðŸ› The Problem

### **Missing AI Suggestions**

When I checked HuQQabaz's database record:
```javascript
// Expected location: restaurant.firecrawl_output.ai_suggestions
// Actual result: NOT FOUND

Available keys in firecrawl_output: [
  'query',
  'results',
  'opentable',
  'timestamp',
  'website_scrape',
  'social_media_search',
  'extracted_operational'
]
```

**AI suggestions are missing!** This means:
1. OpenAI AI Enhancement (Step 9) either:
   - Failed to generate cuisine_suggestions
   - Generated wrong suggestions (American + Middle Eastern)
   - Generated suggestions but they weren't stored
2. Data Mapper (Step 11) received NO ai_suggestions
3. Data Mapper fell back to analyzing generic "Restaurant" category
4. GPT-4o-mini guessed wrong cuisines from limited data

---

## ðŸ“‹ Google Places Limitations

**What Google Places Provides for HuQQabaz:**
```json
{
  "categoryName": "Restaurant",
  "categories": ["Restaurant"],
  "additionalInfo": {
    "Offerings": ["Halal food", "Vegan options", "Vegetarian options"],
    "Atmosphere": ["Casual", "Cozy", "Trendy", "Upscale"],
    "Highlights": ["Great coffee", "Great dessert", "Live music"]
  }
}
```

**What's Missing:**
- NO cuisine type
- NO "Turkish" or "Mediterranean" keywords
- NO menu items with Turkish names
- ONLY generic "Restaurant" category

This is **not a Google limitation** - Google simply doesn't categorize restaurants by cuisine type in their Places API. They use generic business categories like "Restaurant", "Cafe", "Bar".

---

## ðŸŽ¯ Expected vs Actual Behavior

### **Expected Behavior:**
```
Step 9: AI Enhancement generates:
{
  "cuisine_suggestions": ["Turkish", "Mediterranean", "Hookah Lounge"],
  "category_suggestions": ["Casual Dining", "Hookah Bar"],
  ...
}

Step 11: Data Mapper receives aiSuggestions:
{
  cuisine_suggestions: ["Turkish", "Mediterranean", "Hookah Lounge"]
}
â†’ Maps to correct UUIDs
â†’ Updates restaurant.restaurant_cuisine_ids
```

### **Actual Behavior (HuQQabaz):**
```
Step 9: AI Enhancement generates (unknown what it generated)
â†“
Step 11: Data Mapper receives:
  aiSuggestions: null OR wrong cuisines
â†“
Falls back to analyzing:
  - Name: "HuQQabaz" (no obvious cuisine indicator)
  - Category: "Restaurant" (too generic)
  - Description: AI-generated but likely generic
â†“
GPT-4o-mini guesses:
  "American" + "Middle Eastern" (WRONG)
```

---

## ðŸ’¡ Possible Root Causes

### **Hypothesis 1: OpenAI Generated Wrong Cuisines**
- The AI Enhancement step DID run
- OpenAI GPT-4o saw limited data (no Turkish menu items, no reviews mentioning Turkish)
- OpenAI guessed "American" or "Middle Eastern" from generic context
- Data Mapper correctly mapped wrong suggestions to wrong UUIDs

### **Hypothesis 2: Extraction Step Skipped or Failed**
- AI Enhancement step failed or was skipped
- No ai_suggestions were passed to Data Mapper
- Data Mapper fell back to secondary analysis (generic data)
- GPT-4o-mini made educated guess from minimal information

### **Hypothesis 3: Data Not Stored Correctly**
- AI Enhancement generated correct suggestions
- Suggestions were passed to Data Mapper correctly
- But suggestions were never stored in database for audit
- We can't verify what was actually suggested

---

## ðŸ”§ Solutions

### **Option A: Enhance AI Enhancement Prompt** â­ RECOMMENDED
**Goal:** Improve OpenAI's ability to detect cuisines from limited data

**Implementation:**
1. **Add cuisine detection guidance to prompt**
   ```
   // ===== CUISINE DETECTION (ENHANCED) =====
   Detect cuisine types using ALL available signals:

   CRITICAL: Be specific and accurate. If unclear, use "International" or "Casual Dining"

   Detection signals (in priority order):
   1. Restaurant name keywords:
      - Turkish: Sultans, Ottoman, Anatolian, Kebab House
      - Italian: Trattoria, Pizzeria, Osteria, Ristorante
      - Japanese: Sushi, Ramen, Izakaya, Yakitori
      - French: Bistro, Brasserie, Patisserie
      - Chinese: Wok, Dim Sum, Szechuan, Canton

   2. Menu analysis:
      - Look for signature dishes indicating cuisine
      - Turkish: Kebabs, Baklava, Lahmacun, Mezze
      - Italian: Pasta, Pizza, Risotto, Tiramisu
      - Japanese: Sushi, Ramen, Tempura, Miso

   3. Reviews and descriptions:
      - Look for customer mentions of cuisine type
      - "Turkish food", "authentic Italian", etc.

   4. Context clues:
      - Location-based (Goa has many Turkish restaurants)
      - Price level correlation with cuisine type

   5. Fallback rules:
      - If no clear signals: ["International", "Casual Dining"]
      - Don't guess - be conservative
      - Prefer "Middle Eastern" only if specifically indicated
   ```

2. **Add better examples in JSON output format**
   ```json
   "cuisine_suggestions": [
     "Primary cuisine based on menu/name analysis",
     "Secondary cuisine if applicable (fusion, secondary specialty)",
     "Optional third if strong evidence"
   ]
   ```

3. **Store AI Enhancement output for audit**
   ```javascript
   // In extraction-orchestrator.ts after AI Enhancement:
   await this.updateRestaurantFields(job.restaurantId, {
     ai_enhancement_output: {
       ...aiOutput,
       generated_at: new Date().toISOString(),
       model: 'gpt-4o'
     }
   });
   ```

**Pros:**
- Fixes the root cause (better AI detection)
- Works for all future extractions automatically
- Provides audit trail of what AI suggested
- No manual intervention needed

**Cons:**
- Doesn't fix existing restaurants (need re-run)
- Depends on AI accuracy improvements

---

### **Option B: Add Manual Cuisine Override**
**Goal:** Allow manual correction when AI gets it wrong

**Implementation:**
1. **Add admin UI for cuisine editing**
   - List current cuisines
   - Allow adding/removing cuisines
   - Show "AI suggested" vs "manually verified" tags

2. **Update database schema**
   ```sql
   ALTER TABLE restaurants
   ADD COLUMN cuisine_override BOOLEAN DEFAULT FALSE;
   ```

**Pros:**
- Immediate fix for wrong mappings
- Human verification for critical restaurants
- Flexibility for edge cases

**Cons:**
- Requires manual work for each restaurant
- Not scalable for large datasets
- Still needs Option A for future extractions

---

### **Option C: Enhanced Web Scraping for Cuisine**
**Goal:** Get cuisine data from restaurant website directly

**Implementation:**
1. **Update Firecrawl extraction to target cuisine**
   ```javascript
   // In firecrawl-client.ts
   const cuisinePrompt = `
   Extract the cuisine type from this restaurant website.
   Look for:
   - About Us section mentions
   - Menu category names
   - Homepage descriptions
   - Meta tags or headers

   Return: Primary cuisine (e.g., "Turkish", "Italian", "Japanese")
   `;
   ```

2. **Use Firecrawl Extract endpoint**
   - More structured data extraction
   - Specifically target cuisine information
   - Higher accuracy than general scraping

**Pros:**
- More reliable than AI guessing
- Works even without good menu data
- Can extract from website meta tags

**Cons:**
- Requires website to have cuisine info
- HuQQabaz might not have website with cuisine listed
- Adds extra API calls (cost)

---

### **Option D: Review-Based Cuisine Detection**
**Goal:** Use customer reviews to detect cuisine

**Implementation:**
1. **Add review analysis for cuisine keywords**
   ```javascript
   // In review-sentiment analyzer
   const cuisineKeywords = {
     turkish: ['turkish', 'kebab', 'ottoman', 'shawarma', 'baklava'],
     italian: ['italian', 'pizza', 'pasta', 'risotto'],
     japanese: ['sushi', 'ramen', 'japanese', 'tempura'],
     // ... etc
   };

   // Count keyword mentions in reviews
   const cuisineScores = analyzeCuisineKeywords(reviews);
   // Return top 2 cuisines with confidence scores
   ```

2. **Pass to AI Enhancement as additional signal**

**Pros:**
- Customer reviews are honest indicators
- Works when menu/website unclear
- No extra API costs

**Cons:**
- Requires enough reviews with cuisine mentions
- New restaurants might not have reviews
- Depends on review quality

---

## ðŸ“Š Missing Schema.org Properties (Related Issues)

While investigating cuisines, I found these missing properties in Google Rich Results:

| Property | Current Value | Issue | Solution |
|----------|--------------|-------|----------|
| **servesCuisine** | Missing | No cuisines mapped correctly | Fix cuisine mapping (Option A) |
| **priceRange** | NULL | Database has no price_level | Extract from reviews mentioning "KWD 10-25" |
| **acceptsReservations** | Missing | Database has reservations_policy: "Recommended" | Add to schema generator |
| **menu** | NULL | Database has menu_url: NULL but AI generates dishes | Extract menu_url from Firecrawl |

All of these stem from the same core issue: **extraction pipeline isn't populating all fields needed for Schema.org**

---

## ðŸŽ¯ Recommended Action Plan

### **Phase 1: Immediate Fix (Today)**
1. âœ… Document the issue (this file)
2. â³ Discuss with Douglas which option(s) to implement
3. â³ Test solution on HuQQabaz re-extraction

### **Phase 2: Enhancement (This Week)**
1. Implement **Option A** (Enhanced AI Enhancement Prompt)
2. Add **ai_enhancement_output** storage for audit trail
3. Re-run extraction for HuQQabaz to test fix
4. Verify correct cuisines: Turkish + Mediterranean

### **Phase 3: Data Quality (Next Week)**
1. Implement **Option B** (Manual override UI) for edge cases
2. Fix **priceRange** extraction from reviews
3. Fix **menu** URL extraction from Firecrawl
4. Add **acceptsReservations** to schema generator

### **Phase 4: Batch Fix (Future)**
1. Create script to re-run AI Enhancement for all existing restaurants
2. Audit and manually verify high-traffic restaurants
3. Monitor cuisine accuracy with admin dashboard

---

## ðŸ§ª Testing Strategy

### **Test Case: HuQQabaz Re-Extraction**

**Preconditions:**
- Enhanced AI Enhancement prompt deployed
- ai_enhancement_output storage enabled

**Steps:**
1. Delete HuQQabaz from database
2. Re-add via /admin/add page
3. Monitor extraction logs for:
   ```
   [Orchestrator] Step 9: AI Enhancement
   [OpenAI] Generating content for: HuQQabaz
   [OpenAI] AI Enhancement output:
     cuisine_suggestions: ["Turkish", "Mediterranean"]
   ```
4. Check database after extraction:
   ```sql
   SELECT
     name,
     restaurant_cuisine_ids,
     ai_enhancement_output
   FROM restaurants
   WHERE slug = 'huqqabaz';
   ```

**Expected Results:**
- `cuisine_suggestions`: `["Turkish", "Mediterranean"]` or similar
- `restaurant_cuisine_ids`: Contains Turkish UUID (`b7278429-7205-4df9-bc6b-18f9139bf7a1`)
- `ai_enhancement_output`: Stored for audit

**Success Criteria:**
- âœ… Cuisines match expected (Turkish + Mediterranean)
- âœ… No "American" or wrong Middle Eastern mapping
- âœ… Schema.org servesCuisine property populated

---

## ðŸ’° Cost Impact

**Option A (Enhanced Prompt):**
- Minimal - same OpenAI calls, slightly longer prompt
- ~+$0.001 per restaurant (negligible)

**Option C (Enhanced Scraping):**
- Medium - additional Firecrawl Extract calls
- ~+$0.02 per restaurant

**Option D (Review Analysis):**
- None - uses existing review data
- Just processing logic

**Recommended:** Option A + Option D combined
**Total additional cost:** ~$0.001 per restaurant

---

## ðŸ“ Conclusion

The cuisine mapping issue is caused by **insufficient cuisine detection in the AI Enhancement step**. Google Places provides only generic "Restaurant" category, and without explicit cuisine keywords in the name or menu, OpenAI GPT-4o guesses incorrectly.

**Best Solution:** Enhance the AI Enhancement prompt with better cuisine detection logic (Option A) + review-based cuisine detection (Option D)

This will:
1. Fix HuQQabaz and all future extractions
2. Provide audit trail of what AI suggests
3. Improve Schema.org completeness
4. Minimal cost increase
5. No manual intervention required

**Next Step:** Discuss with Douglas which approach to implement.

---

**STATUS:** â³ Awaiting Douglas's decision on which option(s) to implement
