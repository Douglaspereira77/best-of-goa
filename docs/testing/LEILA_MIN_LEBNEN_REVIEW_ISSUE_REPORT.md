# CONTENT TESTING REPORT - REVIEW DISPLAY ISSUE
**Restaurant:** Leila Min Lebnen - ليلى من لبنان
**Slug:** leila-min-lebnen-the-avenues
**Testing Date:** 2025-11-13
**Reported By:** Douglas

---

## ISSUE DESCRIPTION

The "What Customers Say" section on the restaurant detail page displays:

> "Currently, there are no customer reviews available for Leila Min Lebnen. However, the restaurant is known for its cozy atmosphere and diverse offerings, appealing to families and tourists alike."

Douglas questioned whether reviews were pulled from the Apify Review extraction run.

---

## ✅ DATA INVESTIGATION FINDINGS

### 1. APIFY_OUTPUT REVIEWS
- **Status:** ✅ EXTRACTED SUCCESSFULLY
- **Total Reviews in JSON:** 50 reviews
- **Sample Review:**
  - Author: L M
  - Rating: 5 stars
  - Text: "شكرا" (Thank you in Arabic)
  - Date: 2025-11-10T07:23:03.918Z

### 2. RESTAURANT_REVIEWS TABLE
- **Status:** ❌ EMPTY
- **Reviews in Table:** 0
- **Note:** Reviews exist in `apify_output` JSON column but are NOT populated into the `restaurant_reviews` table

### 3. REVIEW_SENTIMENT FIELD
- **Status:** ⚠️ INCORRECTLY GENERATED
- **Current Content:** "Currently, there are no customer reviews available for Leila Min Lebnen. However, the restaurant is known for its cozy atmosphere and diverse offerings, appealing to families and tourists alike."

### 4. UI DISPLAY LOGIC
- **File:** `src/app/places-to-eat/restaurants/[slug]/page.tsx`
- **Lines 210-223:** Review sentiment section
- **Condition:** `{restaurant.review_sentiment && (...)}`
- **Behavior:** The UI correctly displays `review_sentiment` if it exists
- **Issue:** The field exists but contains WRONG content (generic placeholder instead of actual sentiment)

---

## ❌ ROOT CAUSE ANALYSIS

### CRITICAL ISSUE: AI Sentiment Generation Failure

**The Problem:**
The `review_sentiment` field contains generic text stating "no customer reviews available" when **50 reviews actually exist** in the `apify_output.reviews` JSON array.

**Why This Happened:**

1. ✅ **Step 6 (Apify Reviews) - SUCCESS**
   - 50 reviews successfully extracted from Google Places
   - Stored in `apify_output.reviews` JSON column
   - Data extraction pipeline worked correctly

2. ❌ **Step 8 (AI Sentiment Analysis) - FAILED**
   - **Expected Behavior (per `extraction-orchestrator.ts`):**
     - Analyze top 10 most recent reviews from `apify_output.reviews`
     - Generate 200-300 character sentiment summary from actual customer feedback
     - Store genuine insights in `review_sentiment` field

   - **Actual Behavior:**
     - AI generated generic placeholder text
     - Text claims "no customer reviews available"
     - Suggests AI was NOT provided actual review data
     - OR AI prompt allows fallback to generic text when it shouldn't

3. ⚠️ **Step 12 (Database Population) - PARTIAL**
   - Reviews NOT transferred from `apify_output` to `restaurant_reviews` table
   - This is less critical for display (UI uses `apify_output` via query)
   - But indicates potential gap in pipeline

---

## 📊 QUALITY SCORES

| Dimension | Score | Status |
|-----------|-------|--------|
| Data Extraction Accuracy | 100/100 | ✅ Reviews successfully extracted |
| Data Storage | 100/100 | ✅ Reviews stored in apify_output |
| AI Sentiment Analysis | 0/100 | ❌ Failed to analyze actual reviews |
| UI Display Logic | 50/100 | ⚠️ Shows sentiment field, but wrong content |
| User Experience | 0/100 | ❌ Misleading: claims no reviews when 50 exist |
| **OVERALL QUALITY** | **50/100** | **⚠️ NEEDS REVISION** |

---

## 💬 RECOMMENDATIONS FOR BOK DOCTOR

### IMMEDIATE ACTIONS REQUIRED

#### 1. RE-RUN SENTIMENT ANALYSIS (Step 8)
**File:** `src/lib/services/extraction-orchestrator.ts`
**Method:** `executeSentimentAnalysis()`

**Actions:**
- Verify that `apify_output.reviews` array is being passed to OpenAI
- Confirm top 10 reviews (with text) are being sent
- Ensure AI receives actual review content, not empty array
- Add logging to trace what data is sent to OpenAI

**Debug Check:**
```javascript
console.log('[Sentiment Analysis] Reviews to analyze:', reviews.slice(0, 10).map(r => ({
  author: r.name,
  rating: r.stars,
  text: r.text.substring(0, 50) + '...'
})));
```

#### 2. VERIFY AI PROMPT LOGIC
**File:** `src/lib/services/openai-client.ts`
**Method:** `analyzeReviewSentiment()`

**Actions:**
- Confirm reviews are properly formatted in the OpenAI prompt
- Ensure AI is explicitly instructed to analyze PROVIDED reviews
- **Add validation:** Reject response if AI returns "no reviews" text when reviews were provided
- Never allow generic fallback text when actual reviews exist

**Validation Logic to Add:**
```typescript
// After AI generates sentiment
if (reviews.length > 0 && sentiment.includes('no customer reviews available')) {
  throw new Error('AI generated invalid sentiment: claimed no reviews when reviews exist');
}
```

#### 3. ADD PIPELINE SAFEGUARDS
**Logic to Implement:**
- **IF** `apify_output.reviews.length === 0` → Skip sentiment step (or use generic text)
- **IF** `apify_output.reviews.length > 0` → REQUIRE valid sentiment analysis
- **NEVER** generate "no reviews" text when reviews are present

#### 4. POPULATE RESTAURANT_REVIEWS TABLE
**Optional but Recommended:**
- Transfer reviews from `apify_output.reviews` to `restaurant_reviews` table
- Enables better querying and analytics
- Current UI works via `getRestaurantBySlug()` parsing JSON (lines 244-258 in `restaurant.ts`)
- But normalized table structure is best practice

---

## 🔧 CODE REFERENCES

### Current Data Flow (Working Parts)

**Extraction Pipeline:**
```
Step 6: Apify Reviews Extraction ✅
  ↓
apify_output.reviews (JSON column) ✅
  ↓
Step 8: AI Sentiment Analysis ❌ (BROKEN HERE)
  ↓
review_sentiment field (text column) ⚠️ (Wrong content)
```

**UI Display Pipeline:**
```
getRestaurantBySlug() (restaurant.ts lines 244-258) ✅
  ↓
Parses apify_output.reviews JSON ✅
  ↓
Maps to reviews[] array for Schema.org ✅
  ↓
Page component (lines 210-223) ✅
  ↓
Displays review_sentiment if exists ⚠️ (Displays wrong content)
```

### Files to Investigate

1. **`src/lib/services/extraction-orchestrator.ts`**
   - Step 8: `executeSentimentAnalysis()`
   - Verify review data is passed to OpenAI client

2. **`src/lib/services/openai-client.ts`**
   - Method: `analyzeReviewSentiment()`
   - Check prompt formatting
   - Add validation for AI responses

3. **`src/lib/queries/restaurant.ts`**
   - Lines 244-258: Review parsing logic
   - This part works correctly (parses reviews from JSON)

4. **`src/app/places-to-eat/restaurants/[slug]/page.tsx`**
   - Lines 210-223: Review sentiment display
   - UI logic is correct, just shows wrong data

---

## 🔄 TESTING STATUS

**STATUS:** ❌ **NEEDS REVISION**

### Blocking Issues
1. **Critical:** AI sentiment analysis not processing actual review data
2. **Critical:** Misleading content claims no reviews exist when 50 are available
3. **Major:** User trust issue - directory shows incorrect information

### Approval Criteria
- ✅ `review_sentiment` must analyze actual customer reviews from `apify_output.reviews`
- ✅ Content must reflect genuine customer feedback (mentions food, service, atmosphere)
- ✅ NO generic placeholder text allowed when reviews exist
- ✅ Sentiment should be 200-300 characters with specific insights

### Re-Test After
1. Fix applied to sentiment analysis step
2. Leila Min Lebnen sentiment regenerated
3. Field contains actual review analysis (not generic text)

---

## 📋 SAMPLE REVIEW DATA AVAILABLE

**Total Reviews:** 50 in `apify_output.reviews`

**Sample Reviews (First 3):**

### Review 1
- **Author:** L M
- **Rating:** 5 stars
- **Date:** 2025-11-10
- **Text:** شكرا

### Review 2-50
*(Available in database - 49 more reviews with ratings and text)*

**This data should be analyzed by AI to generate:**
- Overall sentiment (positive/mixed/negative)
- Common themes (food quality, service, atmosphere)
- Specific mentions (Lebanese cuisine, family-friendly, etc.)
- 200-300 character summary for users

---

## 📊 TECHNICAL EVIDENCE

### Database Query Result
```javascript
{
  id: '57bd4c3b-6d21-4c1b-89a2-d73c3f7abfa9',
  name: 'Leila Min Lebnen - ليلى من لبنان',
  slug: 'leila-min-lebnen-the-avenues',
  review_sentiment: 'Currently, there are no customer reviews available...',
  apify_output: {
    reviews: [ /* 50 reviews */ ]
  }
}
```

### UI Renders
```tsx
{restaurant.review_sentiment && (
  <section className="bg-blue-50 border border-blue-100 rounded-lg shadow-sm p-6">
    <h2 className="text-xl font-semibold mb-2 text-blue-900">What Customers Say</h2>
    <p className="text-gray-700 leading-relaxed">{restaurant.review_sentiment}</p>
  </section>
)}
```

**Current Output:**
> "Currently, there are no customer reviews available for Leila Min Lebnen. However, the restaurant is known for its cozy atmosphere and diverse offerings, appealing to families and tourists alike."

**Expected Output (Example):**
> "Customers praise Leila Min Lebnen for authentic Lebanese cuisine and generous portions. Many highlight the friendly service and cozy, family-friendly atmosphere. The restaurant is particularly noted for its traditional dishes and welcoming ambiance at The Avenues."

---

## 🎯 SUCCESS CRITERIA

**Before Approval:**
1. Re-run extraction Step 8 for Leila Min Lebnen
2. Verify `review_sentiment` contains actual customer insights
3. Confirm no "no reviews available" text when reviews exist
4. Test on 2-3 other restaurants to ensure fix is systemic

**Quality Gate:**
- Zero tolerance for factual inaccuracies ✅
- User-facing content must be truthful ✅
- AI-generated content must use provided data ✅

---

## 📞 NEXT STEPS FOR DOUGLAS

### Option 1: Manual Fix (Quick)
Run a script to regenerate sentiment for this one restaurant:
```bash
node bin/regenerate-sentiment-for-restaurant.js leila-min-lebnen-the-avenues
```

### Option 2: Systematic Fix (Recommended)
1. Investigate and fix Step 8 in extraction orchestrator
2. Add validation to prevent this issue
3. Re-run sentiment analysis for all restaurants with `apify_output.reviews.length > 0` but generic sentiment text

---

**END OF REPORT**

**Generated by:** BOK Content Tester
**For:** BOK Doctor
**Report ID:** LEILA-REVIEW-ISSUE-20251113
