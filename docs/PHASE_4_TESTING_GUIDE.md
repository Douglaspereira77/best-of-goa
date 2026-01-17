# Phase 4 Enhanced FAQ System - Testing Guide

**Date:** November 2, 2025
**Status:** Ready for Testing
**Components:** Database Schema, Review Analyzer, OpenAI Integration, Admin UI, Schema.org Markup

---

## Pre-Testing Checklist

### 1. Database Schema Migration
Before running any tests, apply the Phase 4 database migration:

```bash
# Option A: Using Supabase CLI
supabase db push sql/phase4-enhanced-faqs.sql

# Option B: Via Supabase Dashboard
1. Go to SQL Editor
2. Paste contents of sql/phase4-enhanced-faqs.sql
3. Click "Run"
```

**Verify with:**
```sql
-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'restaurants_faqs'
ORDER BY ordinal_position;

-- Expected columns:
-- id, question, answer, restaurant_id, created_at, updated_at,
-- category, relevance_score, source, is_featured, last_updated
```

### 2. Code Build Verification
```bash
# Build the project
npm run build

# Expected: No TypeScript errors, successful Next.js build
```

---

## Testing Workflow

### Test 1: Review Analyzer Service

**Location:** `src/lib/services/review-analyzer.ts`

**What to Test:**
- Theme extraction from 50+ reviews
- Sentiment analysis (positive/negative/neutral)
- Relevance scoring calculation
- FAQ suggestion generation

**Manual Test:**
```bash
# Create test file: bin/test-review-analyzer.js
node bin/test-review-analyzer.js
```

**Expected Output:**
```
[ReviewAnalyzer] Analyzing 50 reviews for themes...
[ReviewAnalyzer] ✅ Analysis complete: Analyzed 50 reviews. Found X unique themes. Top concern: parking. Top praise: service.

Theme Examples:
- parking: 12 mentions (relevance: 100)
- wait_time: 8 mentions (relevance: 80)
- pricing: 10 mentions (relevance: 100)
```

---

### Test 2: OpenAI FAQ Generation

**Location:** `src/lib/services/openai-client.ts`

**What to Test:**
- 8-10 FAQs generated (not 5 generic)
- Review-based FAQs addressing customer concerns
- Cuisine-specific FAQs
- Category field populated
- Relevance scores assigned (50-100)

**Manual Test - Add a Restaurant:**

1. **Navigate to Admin:**
   ```
   http://localhost:3000/admin/add
   ```

2. **Search and Extract:**
   - Search for a restaurant with 50+ reviews (e.g., "Al Boom Marina")
   - Run full extraction
   - Monitor logs for review analysis output

3. **Check Logs:**
   ```
   [ReviewAnalyzer] ✅ Analysis complete
   [Phase 4] FAQ categories: reservations, parking, service, pricing, menu, dietary, ...
   [Phase 4] Relevance scores: 85, 90, 75, 80, 65, ...
   [Phase 4] ✅ Successfully created 8-10 FAQ records
   ```

4. **Verify in Database:**
   ```sql
   SELECT id, question, category, relevance_score, is_featured, source
   FROM restaurants_faqs
   WHERE restaurant_id = 'target_restaurant_id'
   ORDER BY relevance_score DESC;

   -- Expected:
   -- 8-10 FAQs (vs old 5)
   -- Categories: Mixed (parking, service, pricing, etc.)
   -- Relevance: 50-100 range
   -- Featured: FAQs with score >= 75 should have is_featured = true
   -- Source: ai_generated, review_based, or manual
   ```

---

### Test 3: Admin FAQ Management UI

**Location:** `src/components/admin/review/FAQTab.tsx`

**What to Test:**
- Display all FAQs for a restaurant
- Edit FAQ question/answer
- Edit category
- Edit relevance score
- Toggle featured flag
- Delete FAQs
- Add new manual FAQs
- Inline editing workflow

**Manual Test:**

1. **Access Restaurant Details:**
   - Go to `/admin/restaurants/[restaurant_id]`
   - Click "FAQs" tab

2. **Test Edit Workflow:**
   - Click "Edit" on an FAQ
   - Modify question/answer
   - Change category
   - Adjust relevance score
   - Click "Save"
   - Verify changes in database

3. **Test Featured Flag:**
   - Click "Edit" on an FAQ with low relevance score
   - Check "Featured" checkbox
   - Verify in database: `is_featured = true`

4. **Test Add New FAQ:**
   - Click "Add New FAQ"
   - Fill in question, answer, category, relevance score
   - Check "Featured" if needed
   - Click "Create FAQ"
   - Verify in database: `source = 'manual'`

5. **Test Delete:**
   - Click "Delete" on an FAQ
   - Confirm deletion
   - Verify removed from database

6. **Verify Statistics:**
   - Check FAQ Overview card shows correct counts:
     - Total FAQs
     - AI Generated count
     - Review-Based count
     - Featured count

---

### Test 4: Schema.org FAQPage Markup

**Location:** `src/lib/schema/generators/faq.ts`

**What to Test:**
- FAQPage schema generated correctly
- Questions and answers properly formatted
- Categories included in schema
- Featured FAQs prioritized in output
- Relevance scores impact ordering
- Google Rich Results validation

**Manual Test:**

1. **View Page Source:**
   - Navigate to a restaurant page with FAQs
   - Right-click → "View Page Source"
   - Search for `"@type": "FAQPage"`

2. **Expected Schema Structure:**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "FAQPage",
     "mainEntity": [
       {
         "@type": "Question",
         "name": "Does the restaurant accept reservations?",
         "description": "RESERVATIONS: Does the restaurant accept reservations?",
         "acceptedAnswer": {
           "@type": "Answer",
           "text": "Yes, we accept reservations through..."
         }
       }
     ]
   }
   ```

3. **Validate with Google Tool:**
   - Go to: https://search.google.com/test/rich-results
   - Paste page URL
   - Click "Test" (wait for crawl)
   - Look for "FAQPage" snippet in results
   - Check for errors/warnings

4. **Verify Prioritization:**
   - Featured FAQs should appear first
   - High relevance scores should rank higher
   - Order: Featured → High Score → Display Order

---

### Test 5: Review-Based FAQ Generation

**Location:** `src/lib/services/extraction-orchestrator.ts`

**What to Test:**
- Review analyzer called during extraction
- Review themes extracted correctly
- FAQ questions address actual customer concerns
- High-relevance FAQs auto-featured

**Manual Test:**

1. **Extract Restaurant with 50+ Reviews:**
   - Select restaurant like "Solia Murouj" or "Salmiya Restaurant"
   - Run extraction with review collection
   - Monitor extraction logs

2. **Expected Review-Based FAQs:**
   - If reviews mention "parking" → "Is parking available?" FAQ (high score)
   - If reviews mention "wait times" → "How long is the typical wait?" FAQ
   - If reviews mention "expensive" → "What is the average price?" FAQ

3. **Verify Concerns Match:**
   ```sql
   SELECT
     question,
     category,
     relevance_score,
     is_featured,
     source
   FROM restaurants_faqs
   WHERE restaurant_id = 'target' AND source = 'review_based'
   ORDER BY relevance_score DESC;
   ```

   **Expected:**
   - Category matches review themes
   - Relevance scores: 75-100 (for review-based)
   - Featured: true for score >= 75

---

### Test 6: Validation Rules

**Location:** `src/lib/schema/generators/faq.ts` - `validateFAQs()`

**What to Test:**
- Minimum FAQ requirements
- Category validation
- Relevance score bounds
- Featured FAQ warnings

**Expected Validation Results:**

✅ **Valid FAQs:**
- 8-10 FAQs
- Questions: 10+ characters
- Answers: 20+ characters
- Relevance: 0-100

⚠️ **Warnings:**
- Less than 3-5 FAQs
- No featured FAQs marked
- Non-standard categories

❌ **Errors:**
- Empty questions/answers
- Relevance score outside 0-100
- Questions/answers too short

---

## Full E2E Test Scenario

### Scenario: Extract "Al Boom Marina" Restaurant

**Duration:** ~5 minutes
**Expected Outcomes:** 8-10 FAQs with Phase 4 enhancements

**Steps:**

1. **Database Ready**
   - Migration applied ✓
   - Build successful ✓

2. **Go to Admin Extract**
   ```
   http://localhost:3000/admin/add
   ```

3. **Search: "Al Boom Marina"**
   - Click "Extract"
   - Monitor extraction logs

4. **Verify Extraction Logs:**
   ```
   ✅ Step 1: Search Results
   ✅ Step 2: Apify Extraction
   ✅ Step 3: Images Downloaded
   ✅ Step 4: Menu Items
   ✅ Step 5: Reviews (50 extracted)
   ✅ Step 9: AI Enhancement
       [ReviewAnalyzer] Analyzing 50 reviews...
       [Phase 4] FAQ categories: reservations, parking, service, dining, ...
       [Phase 4] Generated 9 FAQs with review-based analysis
   ✅ Step 10: FAQ Creation
       [Phase 4] ✅ Successfully created 9 FAQ records
   ✅ Step 11: Publish
   ✅ Step 12: Cleanup
   ```

5. **Check Database:**
   ```sql
   -- View FAQs
   SELECT
     question,
     category,
     relevance_score,
     source,
     is_featured
   FROM restaurants_faqs
   WHERE restaurant_id = (
     SELECT id FROM restaurants WHERE name LIKE '%Al Boom%'
   )
   ORDER BY relevance_score DESC;

   -- Expected: 8-10 FAQs with varied categories and scores
   ```

6. **Test Admin UI:**
   - Navigate to restaurant page
   - Open FAQs tab
   - Edit one FAQ (change answer)
   - Add new manual FAQ
   - Delete one review-based FAQ
   - Verify all changes save

7. **Check Schema.org:**
   - View page source
   - Search for FAQPage schema
   - Validate with Google Rich Results tool
   - Verify featured FAQs appear first

---

## Testing Checklist

- [ ] Database migration applied
- [ ] Build completes without errors
- [ ] Review Analyzer extracts themes correctly
- [ ] 8-10 FAQs generated per extraction
- [ ] Categories assigned to all FAQs
- [ ] Relevance scores: 50-100 range
- [ ] Featured flag auto-set for score >= 75
- [ ] Admin UI displays all FAQs
- [ ] Edit FAQ works end-to-end
- [ ] Add new FAQ creates with source='manual'
- [ ] Delete FAQ removes from database
- [ ] Featured toggle saves correctly
- [ ] Schema.org FAQPage markup present
- [ ] Google Rich Results validation passes
- [ ] Review-based FAQs address actual concerns
- [ ] Cuisine-specific FAQs present
- [ ] Statistics card shows correct counts

---

## Troubleshooting

### Issue: "No FAQs Generated" During Extraction

**Check:**
1. Were reviews extracted? (Step 5 success)
2. Is OpenAI API working?
3. Review orchestrator log for errors

**Fix:**
```bash
# Check OpenAI integration
node -e "
require('dotenv').config({ path: '.env.local' });
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓' : '✗');
"
```

### Issue: "FAQs Missing Category Field"

**Check:**
1. Did you apply database migration?
2. Are FAQs being created after migration?

**Fix:**
```sql
-- Check schema
SELECT column_name FROM information_schema.columns
WHERE table_name = 'restaurants_faqs';

-- If missing, apply migration again
```

### Issue: "Admin UI Not Showing FAQs Tab"

**Check:**
1. FAQTab component imported in restaurant page?
2. Component build successful?
3. FAQs exist in database?

**Fix:**
```bash
# Rebuild
npm run build

# Check for errors
npm run lint
```

---

## Performance Notes

**Review Analysis:** ~500ms for 50 reviews (local, no API cost)
**OpenAI FAQ Generation:** ~2-3 seconds (GPT-4o)
**Schema.org Generation:** <10ms
**Total FAQ Creation:** ~3-4 seconds per extraction

---

## Success Criteria

✅ Phase 4 is successful when:
- Extraction completes with 8-10 FAQs per restaurant
- FAQs have category, relevance_score, and is_featured fields
- Review-based FAQs address actual customer concerns
- Admin can edit/add/delete FAQs
- Schema.org FAQPage markup validates with Google
- Cursor Chat development server runs tests without errors

---

## Next Steps

Once testing is complete:
1. Cursor Chat runs: `npm run dev` to verify locally
2. Deploy to Vercel: `npm run build && git push`
3. Test extraction on production
4. Monitor FAQ quality and customer engagement
5. Iterate based on real user data

---

**COMPLETION SUMMARY:** Phase 4 Enhanced FAQ System is implementation-complete with database schema, review analyzer, OpenAI integration, admin UI, and Schema.org markup. Ready for end-to-end testing per this guide.
