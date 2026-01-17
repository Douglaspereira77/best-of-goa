# Image Error Fix - Remove Sample Images

## Issue
Console error: "Failed to load image: sample-3" when viewing restaurant review page

## Root Cause
The review API was returning sample/placeholder images from Unsplash when no real images were available. These placeholder images sometimes fail to load (404 errors), causing console errors.

**Location**: `src/app/api/admin/restaurants/[id]/review/route.ts` lines 270-298

**Problem Code**:
```typescript
// If no images are available, add some sample images for demonstration
if (transformedImages.length === 0) {
  transformedImages = [
    { id: 'sample-1', url: 'https://images.unsplash.com/...' },
    { id: 'sample-2', url: 'https://images.unsplash.com/...' },
    { id: 'sample-3', url: 'https://images.unsplash.com/...' }
  ]
}
```

## Fix Applied
Removed the sample images fallback. Now returns an empty array when no images are available, which displays the "No images available" message in the UI.

**New Code**:
```typescript
// No sample images - return empty array to show "No images available" message
```

## Result
- No more console errors for failed image loads
- Clean UI showing "No images available" when restaurants have no photos
- ImageApproval component properly handles empty state

## Testing
1. Go to any restaurant review page with no images
2. Should see "No images available" message
3. No console errors
4. UI displays upload button

