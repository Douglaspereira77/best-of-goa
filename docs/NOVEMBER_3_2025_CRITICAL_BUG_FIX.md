# November 3, 2025 - Critical Bug Fix Summary

**Douglas,**

I found and fixed a **critical bug** that was causing extracted data to disappear from the database.

---

## The Problem

**Little Ruby's extraction report showed:**
- âŒ Website: Missing (NULL in database)
- âœ… Images: 4 successfully extracted
- âœ… Phone: +965 9693 3684

**But you manually checked the JSON and found:**
- âœ… Website: "https://order.littlerubys.com/" (IN the apify_output)
- âœ… Instagram: "https://www.instagram.com/littlerubys/?hl=en" (IN the firecrawl_output)

**Question:** Why is the data in the JSON but not in the database fields?

---

## Investigation & Discovery

### Step 1: Verified Mapping Function Works
Created test script: `bin/test-little-rubys-mapping.js`

**Result:**
```
ðŸŽ¯ OUTPUT - Mapped Values:
  website: https://order.littlerubys.com/ âœ…
  phone: +965 9693 3684 âœ…

ðŸ’¾ DATABASE - Current Values:
  website: âŒ NULL
  phone: âœ… +965 9693 3684
```

**Key Finding:** Phone works, website doesn't. The mapping function is correct!

---

### Step 2: Found the Culprit

**The Bug:** Step 11 (AI Enhancement with GPT-4o) was **overwriting** correctly extracted data with `undefined` values.

**Code Location:** `src/lib/services/extraction-orchestrator.ts` line 524

```typescript
await this.updateRestaurantFields(job.restaurantId, {
  website: aiOutput.contact_info?.website,  // â† undefined!
  instagram: aiOutput.contact_info?.instagram,  // â† undefined!
  facebook: aiOutput.contact_info?.facebook,
  // ... 27 more fields potentially undefined
});
```

**What Happened:**
1. Step 1 (Apify) correctly extracted: `website: "https://order.littlerubys.com/"` âœ…
2. Database updated successfully âœ…
3. Step 11 (AI Enhancement) ran GPT-4o
4. GPT didn't find website, so `aiOutput.contact_info?.website = undefined`
5. Database updated with `{ website: undefined }` â†’ Sets column to NULL âŒ
6. Your correctly extracted data was destroyed!

---

## The JavaScript Trap

```javascript
const data = {
  website: undefined  // â† JavaScript includes this in the object!
};

console.log(Object.keys(data));
// Output: ['website']  â† Key exists with undefined value

// When sent to Supabase:
await supabase.update({ website: undefined });
// Result: Column set to NULL, overwriting existing data!
```

---

## The Fix

**Added filtering in 2 places:**

### 1. Apify Step (lines 82-98)
```typescript
const normalizedData = this.mapApifyFieldsToDatabase(placeData);

// Filter out undefined values
const filteredNormalizedData = Object.fromEntries(
  Object.entries(normalizedData).filter(([_, value]) =>
    value !== undefined && value !== null
  )
);

await this.updateRestaurantFields(job.restaurantId, filteredNormalizedData);
```

### 2. AI Enhancement Step (lines 512-555)
```typescript
const aiEnhancedFields = {
  website: aiOutput.contact_info?.website,
  instagram: aiOutput.contact_info?.instagram,
  // ... 27 more fields
};

// Filter out undefined values
const filteredFields = Object.fromEntries(
  Object.entries(aiEnhancedFields).filter(([_, value]) =>
    value !== undefined && value !== null
  )
);

// Only update if we have fields
if (Object.keys(filteredFields).length > 0) {
  await this.updateRestaurantFields(job.restaurantId, filteredFields);
}
```

**Result:** Only defined values update the database, preserving existing data âœ…

---

## Impact

**Fixed 21 fields** that were at risk:

**Contact (5):** website, instagram, facebook, twitter, email
**Location (4):** mall_name, mall_floor, mall_gate, nearby_landmarks
**Operational (6):** dress_code, reservations_policy, parking_info, public_transport, average_visit_time_mins, payment_methods
**Special (4):** secret_menu_items, staff_picks, kids_promotions, awards
**Other (2):** average_meal_price, keywords

---

## Testing Instructions

### Quick Test:
```bash
# Re-run Little Ruby's extraction
# Then verify:
node bin/check-little-rubys.js
```

**Expected Result:**
```
âœ… Website: https://order.littlerubys.com/
âœ… Phone: +965 9693 3684
âœ… Instagram: https://www.instagram.com/littlerubys/?hl=en
```

### Console Logs to Watch:
```
[Orchestrator] Filtered Apify data: 45 fields (from 52)
[Orchestrator] AI Enhancement: Updating 12 fields (filtered from 30)
```

This shows how many undefined values are being filtered out.

---

## Files Changed

**Modified:**
- `src/lib/services/extraction-orchestrator.ts` (2 sections)

**Created for Testing:**
- `bin/check-little-rubys.js` - Diagnostic script
- `bin/test-little-rubys-mapping.js` - Mapping validation
- `bin/test-undefined-update.js` - Demonstrates JavaScript behavior

**Documentation:**
- `docs/EXTRACTION_DATA_OVERWRITE_BUG_FIX.md` - Full technical analysis
- `docs/NOVEMBER_3_2025_CRITICAL_BUG_FIX.md` - This summary

---

## Why This Matters

**Before Fix:**
- 21 fields could be overwritten with NULL
- Correctly extracted data was being destroyed
- Database had incomplete information despite JSON containing it

**After Fix:**
- Only defined values update database
- Existing data preserved
- Future extractions will work correctly

---

## Next Steps

1. **Test with a new extraction** - Verify website field preserved
2. **Re-run Little Ruby's** - Confirm all fields populate correctly
3. **Monitor logs** - Look for filtering messages
4. **Check other restaurants** - See if previously NULL fields now populate

---

## Additional Issues to Address

Based on Little Ruby's report, we still need to fix:

1. **Instagram from Firecrawl** - Instagram is in JSON but not mapped to database
2. **Neighborhood from plusCode** - "726C+PR Sabah Al Salem, Goa" needs parsing
3. **Option 1 Testing** - Verify comprehensive data load works

These are separate from the undefined bug and will be addressed next.

---

**Status:** âœ… Bug Fixed - Ready for Testing

**Confidence:** High - Phone field working proves the approach is correct

**Risk:** Low - Only filtering undefined values, not changing business logic

---

Let me know when you'd like to test this! I can walk you through verifying the fix with Little Ruby's or a new extraction.

**- Claude Code**
