# Data Mapping Comprehensive Logging - Reference Table Issue Fix

**Date:** November 3, 2025
**Issue:** Reference table ID fields (restaurant_cuisine_ids, restaurant_category_ids, etc.) not populating
**Status:** 🔍 Comprehensive logging added - Ready for diagnosis

---

## Problem Summary

Douglas reported that reference table ID fields are not generating content:
- `restaurant_cuisine_ids`: Empty array []
- `restaurant_category_ids`: Empty array []
- `restaurant_feature_ids`: Empty array []
- `restaurant_meal_ids`: Empty array []
- `restaurant_good_for_ids`: Empty array []
- `neighborhood_id`: NULL
- `michelin_guide_award_id`: NULL

**Initial findings:**
- Data mapping step (Step 6) **COMPLETED successfully** (11:55:53 AM - 11:56:06 AM)
- Reference tables **HAVE data** (verified: cuisines, categories, features, meals, good_for all have 5+ entries)
- Restaurant has description, apify_output, and firecrawl_output present

**Conclusion:** The mapping step runs but produces empty results. Need to see what OpenAI is returning.

---

## Changes Made

### Comprehensive Logging Added to `src/lib/services/data-mapper.ts`

#### **1. Entry Point Logging (Lines 87-100)**

Added detailed logging when mapping starts:

```typescript
console.log(`[DataMapper] ═══════════════════════════════════════════════════════════`);
console.log(`[DataMapper] Starting mapping for restaurant ${restaurantId}`);
console.log(`[DataMapper] AI Suggestions received:`, aiSuggestions ? 'YES' : 'NO');
if (aiSuggestions) {
  console.log(`[DataMapper] AI Suggestions detail:`, {
    cuisine_suggestions: aiSuggestions.cuisine_suggestions || [],
    category_suggestions: aiSuggestions.category_suggestions || [],
    // ... etc
  });
}
```

**Shows:** Whether AI suggestions from Step 9 (ai_enhancement) are being passed to data mapper

---

#### **2. Reference Data Loading (Lines 133-141)**

Added logging after fetching reference tables:

```typescript
console.log('[DataMapper] Reference data loaded:', {
  cuisines: referenceData.cuisines.length,
  categories: referenceData.categories.length,
  features: referenceData.features.length,
  meals: referenceData.meals.length,
  good_for: referenceData.good_for.length,
  neighborhoods: referenceData.neighborhoods.length,
  michelin_awards: referenceData.michelin_awards.length
});
```

**Shows:** How many options are available in each reference table for OpenAI to choose from

---

#### **3. OpenAI Request Logging (Lines 184-196)**

Added logging before calling OpenAI:

```typescript
console.log('[DataMapper] 📤 Sending to OpenAI GPT-4o-mini for mapping...');
console.log('[DataMapper] Restaurant:', restaurant.name);
console.log('[DataMapper] AI Suggestions present:', {
  cuisines: !!aiSuggestions?.cuisine_suggestions?.length,
  categories: !!aiSuggestions?.category_suggestions?.length,
  // ... etc
});
console.log('[DataMapper] Prompt length:', prompt.length, 'characters');
```

**Shows:** What data is being sent to OpenAI

---

#### **4. OpenAI Response Logging (Lines 225-243)** ⭐ **MOST CRITICAL**

Added detailed logging of OpenAI's response:

```typescript
console.log('[DataMapper] 📥 Received response from OpenAI');
console.log('[DataMapper] Response length:', content?.length || 0, 'characters');
console.log('[DataMapper] Full OpenAI response:', content);  // ← THE KEY LOG!

const parsed = this.parseMappingResponse(content);
console.log('[DataMapper] 📊 Parsed mapping response:', {
  cuisine_ids: parsed.cuisine_ids?.length || 0,
  category_ids: parsed.category_ids?.length || 0,
  feature_ids: parsed.feature_ids?.length || 0,
  meal_ids: parsed.meal_ids?.length || 0,
  good_for_ids: parsed.good_for_ids?.length || 0,
  neighborhood_match: parsed.neighborhood_match,
  michelin_award_match: parsed.michelin_award_match
});
```

**Shows:** Exactly what OpenAI returned and how it was parsed

---

#### **5. New Entries Handling (Lines 445-457)**

Added logging when processing new entries:

```typescript
console.log('[DataMapper] 🔧 Handling new entries and finalizing IDs...');
console.log('[DataMapper] Input IDs from OpenAI:', {
  cuisine_ids: response.cuisine_ids?.length || 0,
  category_ids: response.category_ids?.length || 0,
  // ... etc
});
console.log('[DataMapper] New entries to create:', {
  cuisines: response.new_entries?.cuisines?.length || 0,
  features: response.new_entries?.features?.length || 0,
  categories: response.new_entries?.categories?.length || 0
});
```

**Shows:** Whether OpenAI suggested creating new entries (auto-classification)

---

#### **6. Final IDs Logging (Lines 548-556)**

Added logging before returning final IDs:

```typescript
console.log('[DataMapper] ✅ Final IDs ready for database update:', {
  cuisine_ids: finalIds.cuisine_ids.length,
  category_ids: finalIds.category_ids.length,
  feature_ids: finalIds.feature_ids.length,
  meal_ids: finalIds.meal_ids.length,
  good_for_ids: finalIds.good_for_ids.length,
  neighborhood_id: finalIds.neighborhood_id,
  michelin_award_id: finalIds.michelin_award_id
});
```

**Shows:** What IDs will be written to the database

---

#### **7. Database Update Logging (Lines 565-597)**

Added comprehensive database update logging:

```typescript
console.log('[DataMapper] 💾 Preparing database update for restaurant:', restaurantId);
console.log('[DataMapper] Update payload:', JSON.stringify(updateData, null, 2));

const { data, error } = await this.supabase
  .from('restaurants')
  .update(updateData)
  .eq('id', restaurantId)
  .select('id, restaurant_cuisine_ids, restaurant_category_ids, restaurant_feature_ids');

if (error) {
  console.error('[DataMapper] ❌ Database update FAILED:', error.message);
  console.error('[DataMapper] Error details:', error);
} else {
  console.log('[DataMapper] ✅ Database update SUCCESSFUL');
  console.log('[DataMapper] Confirmed values in database:', data?.[0]);
}
```

**Shows:** Exactly what's being updated and whether it succeeded

---

## How to Diagnose the Issue

### Method 1: Re-Run Extraction (RECOMMENDED)

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to admin page:**
   - Go to http://localhost:3000/admin/add
   - Search for "Little Ruby's"
   - Click "Re-Run Extraction" (or "Continue Anyway" if duplicate)

3. **Watch terminal output for `[DataMapper]` logs**

4. **Look for these critical log lines:**
   ```
   [DataMapper] ═══════════════════════════════════════
   [DataMapper] Starting mapping for restaurant...
   [DataMapper] AI Suggestions received: YES/NO     ← Is this YES or NO?
   [DataMapper] Reference data loaded: {...}        ← Are counts > 0?
   [DataMapper] 📤 Sending to OpenAI GPT-4o-mini...
   [DataMapper] 📥 Received response from OpenAI
   [DataMapper] Full OpenAI response: {...}         ← CRITICAL: What did OpenAI return?
   [DataMapper] 📊 Parsed mapping response: {...}   ← CRITICAL: Are arrays empty?
   [DataMapper] ✅ Final IDs ready: {...}           ← What's the final count?
   [DataMapper] 💾 Preparing database update...
   [DataMapper] Update payload: {...}               ← What's being sent to DB?
   [DataMapper] ✅ Database update SUCCESSFUL
   ```

---

### Method 2: Check Previous Extraction Logs

If you still have the logs from Little Ruby's original extraction:

```bash
# Search for data mapper logs in your terminal history or log files
grep -A 50 "\[DataMapper\]" your-extraction-log.txt
```

Look for the "Full OpenAI response" log to see what was returned.

---

## Expected Diagnostic Scenarios

### Scenario 1: OpenAI Returns Empty Arrays

**Log will show:**
```
[DataMapper] Full OpenAI response: {
  "cuisine_ids": [],
  "category_ids": [],
  "feature_ids": [],
  ...
}
```

**Possible causes:**
1. OpenAI prompt is malformed
2. Restaurant data is insufficient for classification
3. OpenAI API key issue or rate limit
4. max_tokens (1024) is too small for response

**Fix:**
- Check OpenAI API usage/quotas
- Increase max_tokens to 2048
- Improve prompt with more context

---

### Scenario 2: OpenAI Returns IDs But Parser Fails

**Log will show:**
```
[DataMapper] Full OpenAI response: { /* valid JSON with IDs */ }
[DataMapper] 📊 Parsed mapping response: {
  cuisine_ids: 0,  ← Should be > 0 if OpenAI returned IDs
  ...
}
```

**Possible cause:** Parser is failing to extract IDs from JSON

**Fix:**
- Check `parseMappingResponse()` function (line ~400)
- Verify JSON structure matches expected format

---

### Scenario 3: Parser Works But Database Update Fails

**Log will show:**
```
[DataMapper] ✅ Final IDs ready: { cuisine_ids: 3, ... }
[DataMapper] Update payload: { restaurant_cuisine_ids: [...], ... }
[DataMapper] ❌ Database update FAILED: ...
```

**Possible cause:** Database permission or constraint issue

**Fix:**
- Check Supabase RLS policies
- Verify service role key has update permissions

---

### Scenario 4: Everything Works But IDs Still Empty

**Log will show:**
```
[DataMapper] ✅ Database update SUCCESSFUL
[DataMapper] Confirmed values: {
  restaurant_cuisine_ids: [],  ← Empty despite "successful" update
  ...
}
```

**Possible cause:** The undefined value bug! (Fixed earlier today)

**Fix:**
- Verify undefined filtering is applied (should be after today's fix)
- Check if `ids.cuisine_ids` contains actual values before update

---

## Testing Scripts Created

### 1. `bin/check-little-rubys-reference-ids.js`

**Purpose:** Check current state of reference ID fields

**Run:**
```bash
node bin/check-little-rubys-reference-ids.js
```

**Output:**
```
📊 REFERENCE TABLE ID FIELDS:
  Cuisines             ❌ Empty array []
  Categories           ❌ Empty array []
  ...
```

---

### 2. `bin/check-little-rubys-job-progress.js`

**Purpose:** Check if data_mapping step completed

**Run:**
```bash
node bin/check-little-rubys-job-progress.js
```

**Output:**
```
✅ data_mapping              Status: completed  Started: 11:55:53 AM  Ended: 11:56:06 AM
```

---

### 3. `bin/test-little-rubys-data-mapping.js`

**Purpose:** Verify setup and provide re-run instructions

**Run:**
```bash
node bin/test-little-rubys-data-mapping.js
```

**Output:**
```
Reference tables status:
  Cuisines: 5 entries
  Categories: 5 entries
  ...
```

---

## What We Know So Far

✅ **Data mapping step RUNS** (completed in 13 seconds)
✅ **Reference tables HAVE data** (5+ entries confirmed)
✅ **Restaurant HAS data** (description, apify_output, firecrawl_output present)
✅ **No errors logged** (step shows as "completed")

❓ **Unknown:** What OpenAI is returning (will be revealed by new logs)

---

## Next Steps for Douglas

1. **Re-run extraction** with comprehensive logging enabled
2. **Find the OpenAI response** in terminal logs (`[DataMapper] Full OpenAI response:`)
3. **Share the OpenAI response** with me
4. **Based on response, we'll apply one of the fixes above**

---

## Files Modified

- `src/lib/services/data-mapper.ts` - Added 100+ lines of comprehensive logging

## Files Created

- `bin/check-little-rubys-reference-ids.js` - Check reference ID fields
- `bin/check-little-rubys-job-progress.js` - Check data mapping step status
- `bin/test-little-rubys-data-mapping.js` - Verify setup and provide instructions
- `docs/DATA_MAPPING_COMPREHENSIVE_LOGGING.md` - This document

---

## Quick Command Reference

```bash
# Check reference IDs status
node bin/check-little-rubys-reference-ids.js

# Check job progress
node bin/check-little-rubys-job-progress.js

# Verify setup
node bin/test-little-rubys-data-mapping.js

# Start dev server and re-run extraction
npm run dev
# Then go to http://localhost:3000/admin/add
```

---

**Status:** ✅ Logging added - Ready for diagnostic extraction
**Next Action:** Re-run extraction and capture `[DataMapper]` logs
**Expected Time:** 5-6 minutes per extraction
**Expected Outcome:** Clear visibility into why reference IDs are empty
