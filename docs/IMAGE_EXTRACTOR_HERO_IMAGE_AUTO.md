# Image Extractor - Auto Hero Image Population

**Date:** 2025-11-11
**Status:** ✅ Implemented

## Summary

Modified the Image Extractor service to automatically populate the `hero_image` field when processing restaurant images during extraction.

## Problem

Previously, the image extractor only saved images to the `photos` array but didn't set the `hero_image` field. This required manual migration scripts to populate hero images after extraction.

## Solution

Updated `src/lib/services/image-extractor.ts` to:

1. **Identify the hero image** - Finds the image marked as `primary: true` (highest hero_score)
2. **Set hero_image field** - Updates both `photos` array AND `hero_image` in single database operation
3. **Verify and log** - Confirms hero_image was successfully set

## Changes Made

### File: `src/lib/services/image-extractor.ts`

**Lines 250-266:**
```typescript
// Find the primary/hero image (marked as primary: true)
const heroImage = processedImages.find(img => img.primary);
const heroImageUrl = heroImage?.url || processedImages[0]?.url || null;

if (heroImageUrl) {
  console.log(`[ImageExtractor] Setting hero_image: ${heroImage?.filename || processedImages[0]?.filename}`);
  console.log(`[ImageExtractor]   Hero Score: ${heroImage?.hero_score || processedImages[0]?.hero_score}/100`);
}

const { data: updateData, error: updateError } = await this.supabase
  .from('restaurants')
  .update({
    photos: processedImages,
    hero_image: heroImageUrl  // ← NEW: Auto-set hero image
  })
  .eq('id', restaurantId)
  .select('id, photos, hero_image');
```

**Lines 281-295:**
```typescript
// Verify photos and hero_image were actually stored
const updatedHeroImage = updateData[0]?.hero_image;

// ... existing verification code ...

console.log(`[ImageExtractor] Hero image set: ${updatedHeroImage ? '✅' : '❌'}`);
```

## Impact

### ✅ Benefits:
- **Automatic**: All future restaurant extractions will have hero_image populated
- **Smart Selection**: Uses the image with highest hero_score (Claude Vision AI analysis)
- **No Manual Work**: No need to run migration scripts for new restaurants
- **Consistent**: Same logic for all restaurants going forward

### 📊 Existing Restaurants:
- 42 restaurants already migrated with `bin/populate-hero-images.js`
- Any future extractions will auto-populate

## Testing

To test with a new restaurant extraction:

```bash
# Run extraction via admin interface
# Visit http://localhost:3000/admin/add

# Or check existing restaurant has hero_image
node bin/check-hero-images.js
```

Expected console output during extraction:
```
[ImageExtractor] Setting hero_image: restaurant-name-dish-photo.jpg
[ImageExtractor]   Hero Score: 85/100
[ImageExtractor] ✅ Extraction complete: 10 images saved to database
[ImageExtractor] Hero image set: ✅
```

## Related Files

- `src/lib/services/image-extractor.ts` - Main service (modified)
- `bin/populate-hero-images.js` - One-time migration script for existing restaurants
- `bin/check-hero-images.js` - Verification script
- `src/components/cuisine/RestaurantCard.tsx` - Uses hero_image in UI

## Notes

- The hero_image is selected from the image with `primary: true` flag
- If no primary image, falls back to first image in array
- The primary flag is set based on Claude Vision API's hero_score analysis
- Hero score considers: composition, food quality, shows actual restaurant, not abstract art
