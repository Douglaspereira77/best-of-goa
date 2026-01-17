# Extraction Data Overwrite Bug - Critical Fix

**Date:** November 3, 2025
**Severity:** 🔴 Critical
**Status:** ✅ Fixed
**Affected Restaurants:** All extractions where AI Enhancement ran (Step 11)

---

## Problem Summary

**Symptom:** Website, Instagram, and other contact fields were being extracted correctly in Step 1 (Apify) but appearing as NULL in the database after extraction completed.

**Root Cause:** Step 11 (AI Enhancement) was overwriting correctly extracted data with `undefined` values.

---

## The Bug Explained

### What Was Happening

1. **Step 1 (Apify)** correctly extracted data:
   ```javascript
   {
     website: "https://order.littlerubys.com/",
     phone: "+965 9693 3684",
     instagram: null  // Not in Apify data
   }
   ```

2. **Database updated successfully** ✅

3. **Step 11 (AI Enhancement)** ran GPT-4o to enhance content:
   ```javascript
   aiOutput.contact_info?.website  // Returns undefined (AI didn't find it)
   ```

4. **Database updated with undefined values** ❌
   ```javascript
   await this.updateRestaurantFields(job.restaurantId, {
     website: undefined,  // ← Overwrites existing data!
     instagram: undefined,
     facebook: undefined,
     // ... 27 other fields potentially undefined
   });
   ```

5. **Result:** Supabase sets fields to NULL, destroying correctly extracted data

---

## Investigation Timeline

### 1. Initial Discovery (check-little-rubys.js)

**Observation:**
```
📊 DATABASE FIELDS:
  Website: ❌ NULL
  Phone: ✅ +965 9693 3684
  Instagram: ❌ NULL

📦 EXTRACTED DATA (in JSON):
  Website (Apify): https://order.littlerubys.com/ ✅
  Instagram (Firecrawl): https://www.instagram.com/littlerubys/?hl=en ✅
```

**Question:** Why is the data in JSON but not in the database?

---

### 2. Mapping Function Test (test-little-rubys-mapping.js)

**Result:**
```
🎯 OUTPUT - Mapped Values Would Be:
  website: https://order.littlerubys.com/ ✅
  phone: +965 9693 3684 ✅

💾 DATABASE - Current Values:
  website: ❌ NULL
  phone: ✅ +965 9693 3684

🔴 MAPPING FAILURES DETECTED:
1. ⚠️  Website should be "https://order.littlerubys.com/" but is NULL in database
```

**Conclusion:** Phone works, website doesn't. Mapping function is correct.

**Key Insight:** Something is updating website field AFTER Apify step.

---

### 3. Code Review - Found the Culprit

**File:** `src/lib/services/extraction-orchestrator.ts`

**Line 512-540:** AI Enhancement step
```typescript
await this.updateRestaurantFields(job.restaurantId, {
  description: aiOutput.description,
  website: aiOutput.contact_info?.website,  // ← undefined!
  instagram: aiOutput.contact_info?.instagram,  // ← undefined!
  facebook: aiOutput.contact_info?.facebook,  // ← undefined!
  email: aiOutput.contact_info?.email,
  // ... 25 more potentially undefined fields
});
```

**The Problem:**
- GPT-4o doesn't always extract contact info
- When `aiOutput.contact_info?.website` is `undefined`, JavaScript still includes it in the object
- Supabase receives `{ website: undefined }` and sets column to NULL
- Correctly extracted data from Step 1 is destroyed

---

## JavaScript Undefined Behavior

**Test Demonstration:**
```javascript
const testObject = {
  name: 'Test Restaurant',
  website: undefined,  // ← Key is present with undefined value
  phone: '+965 1234567'
};

console.log(Object.keys(testObject));
// Output: ['name', 'website', 'phone']  ← website IS included!

console.log('website' in testObject);
// Output: true  ← website property exists

console.log(testObject.website);
// Output: undefined
```

**Supabase Behavior:**
```javascript
await supabase.from('restaurants')
  .update({ website: undefined })  // ← Sets column to NULL
  .eq('id', restaurantId);
```

**Result:** Website field goes from `"https://order.littlerubys.com/"` → `NULL`

---

## The Fix

### Solution: Filter Out Undefined Values

**Before:**
```typescript
await this.updateRestaurantFields(job.restaurantId, {
  website: aiOutput.contact_info?.website,  // Could be undefined
  instagram: aiOutput.contact_info?.instagram,
  // ... etc
});
```

**After:**
```typescript
const aiEnhancedFields = {
  website: aiOutput.contact_info?.website,
  instagram: aiOutput.contact_info?.instagram,
  // ... etc
};

// Filter out undefined and null values
const filteredFields = Object.fromEntries(
  Object.entries(aiEnhancedFields).filter(([_, value]) =>
    value !== undefined && value !== null
  )
);

if (Object.keys(filteredFields).length > 0) {
  await this.updateRestaurantFields(job.restaurantId, filteredFields);
}
```

**Result:** Only defined values are sent to database, preserving existing data

---

## Changes Made

### 1. extraction-orchestrator.ts - Line 82-98 (Apify Step)

**Added:**
- Filter undefined values from Apify normalized data
- Logging to track field count before/after filtering

```typescript
const filteredNormalizedData = Object.fromEntries(
  Object.entries(normalizedData).filter(([_, value]) =>
    value !== undefined && value !== null
  )
);

console.log(`[Orchestrator] Filtered Apify data: ${Object.keys(filteredNormalizedData).length} fields (from ${Object.keys(normalizedData).length})`);

await this.updateRestaurantFields(job.restaurantId, filteredNormalizedData);
```

---

### 2. extraction-orchestrator.ts - Line 512-555 (AI Enhancement Step)

**Added:**
- Extract AI output to intermediate object
- Filter undefined/null values
- Conditional update only if fields exist
- Enhanced logging

```typescript
const aiEnhancedFields = {
  description: aiOutput.description,
  website: aiOutput.contact_info?.website,
  instagram: aiOutput.contact_info?.instagram,
  // ... 27 more fields
};

const filteredFields = Object.fromEntries(
  Object.entries(aiEnhancedFields).filter(([_, value]) =>
    value !== undefined && value !== null
  )
);

console.log(`[Orchestrator] AI Enhancement: Updating ${Object.keys(filteredFields).length} fields (filtered from ${Object.keys(aiEnhancedFields).length})`);

if (Object.keys(filteredFields).length > 0) {
  await this.updateRestaurantFields(job.restaurantId, filteredFields);
  console.log('[Orchestrator] ✅ Updated restaurant with AI-generated content');
} else {
  console.log('[Orchestrator] ⚠️  No AI-generated fields to update (all undefined)');
}
```

---

## Testing Instructions

### Test 1: New Restaurant Extraction

1. **Run extraction** for a new restaurant
2. **Watch console logs:**
   ```
   [Orchestrator] Filtered Apify data: 45 fields (from 52)
   [Orchestrator] AI Enhancement: Updating 12 fields (filtered from 30)
   ```
3. **Verify field preservation:**
   ```sql
   SELECT website, instagram, facebook, phone
   FROM restaurants
   WHERE id = '[new-restaurant-id]';
   ```

**Expected:**
- Website from Apify preserved ✅
- Phone from Apify preserved ✅
- Instagram from Firecrawl preserved ✅
- Only AI-enhanced fields (description, meta_title) updated

---

### Test 2: Little Ruby's Re-Run

1. **Delete Little Ruby's** (or use override)
2. **Run extraction again**
3. **Check after completion:**
   ```bash
   node bin/check-little-rubys.js
   ```

**Expected:**
```
💾 DATABASE - Current Values:
  website: ✅ https://order.littlerubys.com/
  phone: ✅ +965 9693 3684
  instagram: ✅ https://www.instagram.com/littlerubys/?hl=en
```

---

### Test 3: Field Filtering Validation

**Run:**
```bash
node bin/test-little-rubys-mapping.js
```

**Expected:**
```
✅ All fields match! Mapping is working correctly.
```

---

## Impact Analysis

### Affected Fields

All fields in AI Enhancement step that could be undefined:

**Contact Info (5 fields):**
- `website`
- `instagram`
- `facebook`
- `twitter`
- `email`

**Location Details (4 fields):**
- `mall_name`
- `mall_floor`
- `mall_gate`
- `nearby_landmarks`

**Operational (6 fields):**
- `dress_code`
- `reservations_policy`
- `parking_info`
- `public_transport`
- `average_visit_time_mins`
- `payment_methods`

**Special Features (4 fields):**
- `secret_menu_items`
- `staff_picks`
- `kids_promotions`
- `awards`

**Pricing (1 field):**
- `average_meal_price`

**SEO (1 field):**
- `keywords`

**Total:** 21 fields at risk of being overwritten with NULL

---

## Verification Checklist

After deploying fix:

- [ ] Run new extraction and verify website preserved
- [ ] Check logs show field filtering counts
- [ ] Verify phone number preserved (control test)
- [ ] Verify Instagram preserved (if found in Firecrawl)
- [ ] Verify AI-enhanced fields (description, meta_title) still update
- [ ] Run Little Ruby's diagnostic script - should show ✅ for all fields
- [ ] Check database directly for NULL values in contact fields

---

## Prevention Strategy

### Code Review Guidelines

**When adding new extraction steps:**

1. ✅ **DO:** Filter undefined values before database updates
   ```typescript
   const filtered = Object.fromEntries(
     Object.entries(data).filter(([_, v]) => v !== undefined && v !== null)
   );
   ```

2. ❌ **DON'T:** Pass raw objects with potential undefined values
   ```typescript
   await updateRestaurantFields(id, {
     field: apiResponse?.field  // ← Could be undefined!
   });
   ```

3. ✅ **DO:** Log field counts for debugging
   ```typescript
   console.log(`Updating ${Object.keys(filtered).length} fields`);
   ```

4. ✅ **DO:** Use conditional updates
   ```typescript
   if (Object.keys(filtered).length > 0) {
     await updateRestaurantFields(id, filtered);
   }
   ```

---

## Related Files

- **Bug Discovery:** `bin/check-little-rubys.js`
- **Mapping Test:** `bin/test-little-rubys-mapping.js`
- **Undefined Test:** `bin/test-undefined-update.js`
- **Core Fix:** `src/lib/services/extraction-orchestrator.ts` (lines 82-98, 512-555)
- **Analysis Doc:** `docs/ADMIN_PAGE_DATA_MAPPING_ANALYSIS.md`

---

## Lessons Learned

1. **JavaScript undefined behavior is subtle**
   - `{ field: undefined }` creates a key with undefined value
   - `Object.keys()` includes keys with undefined values
   - Database updates interpret undefined as NULL

2. **Multi-step pipelines need defensive programming**
   - Later steps can destroy earlier data
   - Always filter undefined values before updates
   - Log field counts for debugging

3. **Testing caught the issue**
   - User manually checked JSON vs database
   - Diagnostic scripts revealed the pattern
   - Systematic investigation found root cause

4. **Phone field working was the clue**
   - Showed mapping function was correct
   - Proved database updates work
   - Narrowed issue to specific field overwriting

---

**Fix Status:** ✅ Implemented and Ready for Testing
**Estimated Impact:** Fixes 21 fields across all future extractions
**Rollback:** Revert lines 82-98 and 512-555 in extraction-orchestrator.ts
**Next Action:** Run test extraction and verify with `bin/check-little-rubys.js`
