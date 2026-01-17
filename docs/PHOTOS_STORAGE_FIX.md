# Photos Storage Fix - Leila Min Lebnen

**Date:** October 29, 2025  
**Issue:** Photos extracted successfully (10 images) but `photos` JSONB field remained empty

---

## Problem Identified

The `ImageExtractor.extractImages()` method was updating the database with photos, but:
1. **No verification**: The update query didn't use `.select()` to verify the update succeeded
2. **Silent failures**: If the update failed silently (no error but no rows updated), it wouldn't be detected
3. **No validation**: No check to ensure photos array length matches what was processed

---

## Root Cause

In `src/lib/services/image-extractor.ts` lines 168-175:

```typescript
// BEFORE (problematic code)
const { error: updateError } = await this.supabase
  .from('restaurants')
  .update({ photos: processedImages })
  .eq('id', restaurantId);

if (updateError) {
  throw new Error(`Database update failed: ${updateError.message}`);
}
```

**Issues:**
- No `.select()` to verify update succeeded
- No check if rows were actually updated
- No validation that photos array was stored correctly
- If update succeeded but affected 0 rows, it would silently fail

---

## Fix Applied

Updated `src/lib/services/image-extractor.ts` lines 166-209 to include:

### 1. Early Validation
```typescript
if (processedImages.length === 0) {
  console.warn('[ImageExtractor] ⚠️  No images processed - skipping database update');
  return { success: false, images: [], cost: totalCost };
}
```

### 2. Verification Query
```typescript
const { data: updateData, error: updateError } = await this.supabase
  .from('restaurants')
  .update({ photos: processedImages })
  .eq('id', restaurantId)
  .select('id, photos');  // ✅ Added select to verify update
```

### 3. Error Checking
```typescript
if (updateError) {
  console.error('[ImageExtractor] ❌ Database update failed:', updateError);
  // ... detailed error logging
  throw new Error(`Database update failed: ${updateError.message}`);
}

if (!updateData || updateData.length === 0) {
  console.error('[ImageExtractor] ❌ Update query succeeded but no rows were updated!');
  throw new Error('Database update succeeded but no rows affected');
}
```

### 4. Photo Count Verification
```typescript
const updatedPhotos = updateData[0]?.photos;
const photosCount = Array.isArray(updatedPhotos) ? updatedPhotos.length : 0;

if (photosCount !== processedImages.length) {
  console.error(`[ImageExtractor] ❌ Photo count mismatch! Expected ${processedImages.length}, got ${photosCount}`);
  throw new Error(`Photo count mismatch: expected ${processedImages.length}, got ${photosCount}`);
}
```

### 5. Success Confirmation
```typescript
console.log(`[ImageExtractor] ✅ Extraction complete: ${photosCount} images saved to database`);
console.log(`[ImageExtractor] Verified photos array length: ${photosCount}`);
```

---

## Expected Behavior After Fix

1. **Early Detection**: If no images are processed, it returns early with a warning
2. **Verification**: Update query uses `.select()` to verify rows were updated
3. **Validation**: Checks that photos array was stored with correct length
4. **Error Logging**: Comprehensive error logging if anything goes wrong
5. **Success Confirmation**: Confirms exactly how many photos were saved

---

## Testing

To test the fix:
1. Re-run extraction for Leila Min Lebnen
2. Check logs for:
   - `[ImageExtractor] Updating database with X images...`
   - `[ImageExtractor] ✅ Extraction complete: X images saved to database`
   - `[ImageExtractor] Verified photos array length: X`
3. Verify in database:
   ```sql
   SELECT id, name, jsonb_array_length(photos) as photo_count, photos 
   FROM restaurants 
   WHERE id = '57bd4c3b-6d21-4c1b-89a2-d73c3f7abfa9';
   ```

---

## Additional Notes

- This follows the same pattern as fixes applied to `updateRestaurantFields()` in the orchestrator
- All database updates should use `.select()` to verify they succeeded
- Photo extraction should now reliably store photos in the `photos` JSONB field
- If update still fails, error logs will now clearly show why

---

## Related Issues

This fix addresses the same silent failure pattern found in:
- `updateRestaurantFields()` (fixed earlier)
- Contact info updates (fixed earlier)
- Hours normalization (fixed earlier)

All database updates now follow the pattern:
1. Use `.select()` to verify update
2. Check if rows were actually updated
3. Validate the data was stored correctly
4. Log detailed errors if anything fails




























