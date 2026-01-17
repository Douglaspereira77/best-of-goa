# Hotel Image Smart Fallback System

**Date:** November 16, 2025
**Status:** Implemented and Tested

## Summary

Implemented an intelligent fallback system for hotel image extraction that ensures hotels with lower-resolution Google Photos still receive complete image coverage while maintaining quality standards for hotels with premium photos.

## Problem

Park Inn by Radisson had **no images** despite successful extraction. Investigation revealed:
- All 10 Google Places photos were below the minimum resolution (1200×900)
- Best photo: 1024×1019 (failed width requirement)
- Image extraction silently filtered out all photos, resulting in NULL hero_image

## Solution

### Smart Quality Tier System

| Tier | Resolution | Validation | Use Case |
|------|-----------|------------|----------|
| **Premium** | ≥1200×900 | Full ImageValidator checks | Hotels with high-res photos |
| **Best Available** | Any size | File size only (≤10MB) | Fallback for lower-res photos |

### Implementation

**Files Modified:**
1. `src/lib/services/hotel-image-extractor.ts`
   - Added `quality_tier` property to photo metadata
   - Smart selection: prefers premium, falls back to best available
   - Bypasses strict resolution validation for best_available tier
   - Maintains full Vision API processing for all images

2. `src/components/hotel/HotelPhotoGallery.tsx`
   - Reduced displayed images from 12 to **6**
   - Added "View all X photos" button when more than 6 exist
   - Consistent with restaurant gallery pattern

### How It Works

```
1. Fetch all photos from Google Places API
2. Classify each as "premium" (≥1200×900) or "best_available"
3. Sort by total pixels (largest first)
4. If premium photos exist → use them
5. If no premium photos → use best available (fallback)
6. Process ALL selected photos with Vision API
7. Upload with tier-appropriate validation
```

### Console Output Example

```
[HotelImageExtractor] Found 10 total photos from Google Places
[HotelImageExtractor] ⚠️ No photos meet premium threshold (1200×900)
[HotelImageExtractor] 🔄 FALLBACK: Using best available photos
[HotelImageExtractor] Selected 10 BEST AVAILABLE photos
[HotelImageExtractor] Selected resolutions: 1024×1019 (best_available), ...
[HotelImageExtractor] ℹ️ Skipping strict resolution check for best_available image (1024×1019)
[HotelImageExtractor] ✅ Processed image 1/10 successfully
```

## Results

**Park Inn After Fix:**
- ✅ 10 images uploaded to Supabase Storage
- ✅ Hero image selected: Indoor Pool (score: 90/100)
- ✅ AI-generated SEO filenames for all images
- ✅ Accessibility-optimized alt text
- ✅ Gallery displays 6 images with "View all 10 photos" button

## Benefits

1. **No Empty Image Slots**: Hotels always get images when available
2. **Quality Standards Maintained**: Premium threshold still preferred
3. **Transparency**: Images tagged with quality tier for reporting
4. **Full AI Processing**: Best available images still get Vision API analysis
5. **SEO Preserved**: All images get optimized metadata regardless of resolution

## Testing

```bash
# Re-extract images for a specific hotel
npx tsx bin/extract-park-inn-images.ts

# Check hotels missing images
node -e "
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('hotels').select('name, hero_image').is('hero_image', null).then(r => {
  console.log('Hotels without images:', r.data?.length);
  r.data?.forEach(h => console.log('-', h.name));
});
"
```

## Documentation Updated

- `.claude/docs/HOTEL_EXTRACTION.md` - Added Image Quality Tier System section
- Updated verification checklist with image fields
- Added common issues for image extraction
- Updated testing commands

## Future Considerations

1. **Dashboard Reporting**: Show quality tier distribution across hotels
2. **Manual Override**: Allow marking specific images for manual replacement
3. **Batch Re-extraction**: Script to re-extract images for all hotels without images
4. **Quality Alerts**: Flag hotels using only best_available tier for manual review
