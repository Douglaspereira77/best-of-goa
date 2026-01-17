# Image Extraction System Update

**Date:** October 19, 2025
**Version:** 2.0
**Status:** Production Ready

---

## ðŸŽ¯ Summary

Major update to the image extraction system combining Google Places and Damilo sources for better image variety and quality.

---

## âœ… What Changed

### **New Main Script**
- **File:** `extract-images-combined.js`
- **Replaces:** Individual extraction scripts
- **Command:** `node extract-images-combined.js <restaurant_id>`

### **Dual-Source Extraction**
1. **Google Places API:** 5 images (FREE)
2. **Damilo/Apify Actor:** 5 images ($0.02)
3. **Total:** 10 images per restaurant

### **New Storage Structure**
**Old:**
```
restaurant-images/
â”œâ”€â”€ olio-goa-city-champagne-1.jpg
â””â”€â”€ olio-goa-city-interior-2.jpg
```

**New:**
```
restaurants/
â””â”€â”€ olio-trattoria-italiana-goa-city/
    â””â”€â”€ images/
        â”œâ”€â”€ champagne-service-beachfront.jpg
        â””â”€â”€ interior-dining.jpg
```

### **Cost Optimization**
- **Vision API:** Only on top 5 images (was: all images)
- **Total Cost:** $0.07 per restaurant (was: variable)
- **Breakdown:**
  - Google Places: $0.00
  - Damilo: $0.02
  - Vision API: $0.05 (5 images Ã— $0.01)

### **Smart Filtering**
**Excluded Sources:**
- âŒ Instagram (`instagram.com`, `lookaside.instagram.com`)
- âŒ Facebook (`facebook.com`, `fbsbx.com`)
- âŒ TikTok (`tiktok.com`)
- âŒ Google thumbnails (`encrypted-tbn0.gstatic.com`)

**Requirements:**
- âœ… Minimum resolution: 1200Ã—900 pixels
- âœ… Prioritizes: TripAdvisor, Zomato, TimeOut, restaurant menus, Goa directories

### **Database Schema Update**
**New Field Added:**
```json
{
  "path": "restaurant-slug/images/filename.jpg"
}
```

---

## ðŸ“Š Comparison

| Feature | Old System | New System |
|---------|-----------|------------|
| **Images per restaurant** | 5 | 10 |
| **Sources** | Google Places only | Google Places + Damilo |
| **Cost** | $0.05 | $0.07 |
| **Cost per image** | $0.01 | $0.007 |
| **Vision API** | All images | Top 5 only |
| **Storage structure** | Flat | Organized by restaurant |
| **Filtering** | Basic | Advanced (excludes social media) |
| **Image variety** | Limited | High (2 sources) |

---

## ðŸš€ Migration Guide

### **For New Extractions**
Simply use the new script:
```bash
node extract-images-combined.js <restaurant_id>
```

### **For Existing Images**
- âœ… Old images remain in `restaurant-images` bucket (no migration needed)
- âœ… New images go to `restaurants` bucket
- âœ… Both systems work independently

### **No Breaking Changes**
- Existing images still accessible
- Database structure backward compatible
- Old scripts still work (but deprecated)

---

## ðŸ“ File Changes

### **New Files**
- `extract-images-combined.js` â­ Main script

### **Updated Files**
- `docs/IMAGE_EXTRACTION_README.md` - Updated with v2.0 info
- `docs/IMAGE_EXTRACTION_UPDATE_2025-10-19.md` - This file
- `extract-images-google-places.js` - Updated for new structure
- `extract-images-apify.js` - Updated for new structure

### **Removed Files (Cleanup)**
- `test-damilo-actor.js`
- `show-query.js`
- `test-new-structure.js`
- `create-restaurants-bucket.js`
- `analyze-session-costs.js`
- `analyze-tasks.js`
- `verify-upload.js`
- `verify-combined-results.js`
- `./bin/damilo-test-tatami-*.json`

---

## ðŸŽ¯ Usage Example

```bash
# Extract for Tatami Japanese Restaurant
node extract-images-combined.js 3ac03dc2-0f44-4ce1-84d0-5d9e7630fd92
```

**Expected Output:**
```
=== COMBINED IMAGE EXTRACTION (Google Places + Damilo) ===

1. Fetching restaurant data...
   âœ… Found: Tatami Japanese Restaurant

2. Fetching 5 images from Google Places API...
   âœ… Got 5 images from Google Places
   ðŸ’° Cost: $0.00 (FREE)

3. Fetching images from Damilo/Apify...
   âœ… Got 5 images from Damilo
   ðŸ’° Cost: $0.02

4. Total images collected: 10
   - Google Places: 5
   - Damilo: 5

5. Processing TOP 5 images with Vision API...
   [1/5] âœ… Processed: interior-dining.jpg
   [2/5] âœ… Processed: tuna-sashimi-presentation.jpg
   [3/5] âœ… Processed: exterior-entrance.jpg
   [4/5] âœ… Processed: sashimi-tempura-platter.jpg
   [5/5] âœ… Processed: noodle-bowl-closeup.jpg

6. Processing remaining images with basic metadata...
   [6/10] âœ… Processed: tripadvisor-image-6.jpg
   [7/10] âœ… Processed: web_source-image-7.jpg
   [8/10] âœ… Processed: web_source-image-8.jpg
   [9/10] âœ… Processed: web_source-image-9.jpg
   [10/10] âœ… Processed: web_source-image-10.jpg

7. Updating database...
   âœ… Database updated with 10 images

=== EXTRACTION COMPLETE ===
Total cost: $0.07
```

---

## âœ… Testing Results

**Test Restaurant:** Tatami Japanese Restaurant
**Test Date:** October 19, 2025
**Result:** âœ… Success

**Images Uploaded:**
- 10 images total
- 5 from Google Places (4800Ã—2963, 1200Ã—1200, etc.)
- 5 from Damilo (TripAdvisor, web sources)
- All stored in: `restaurants/tatami-japanese-restaurant-goa-city/images/`

**Cost:** $0.07 (as expected)
**Time:** ~45 seconds
**Quality:** Excellent (all high-resolution)

---

## ðŸŽ‰ Benefits

1. **More Image Variety**
   - 10 images vs 5 (100% increase)
   - 2 different sources
   - Better visual representation

2. **Better Quality Control**
   - Smart filtering removes low-quality sources
   - No Instagram/Facebook/TikTok images
   - Minimum resolution enforced

3. **Cost Effective**
   - Only $0.02 more per restaurant
   - Cost per image decreased ($0.007 vs $0.01)
   - Vision API optimized (top 5 only)

4. **Better Organization**
   - Images grouped by restaurant
   - Cleaner file structure
   - Easier to browse in Supabase UI

5. **Source Tracking**
   - Know where each image came from
   - Can prioritize certain sources
   - Better quality assessment

---

## ðŸ“ž Support

**Questions?**
- Check `docs/IMAGE_EXTRACTION_README.md`
- Review `extract-images-combined.js` code
- Check console output for errors

**Issues?**
- Verify `restaurants` bucket exists in Supabase
- Check API keys in `.env.local`
- Review Supabase Storage permissions

---

## ðŸ”„ Rollback Plan

If needed, you can still use old scripts:
```bash
# Google Places only (old way)
node extract-images-google-places.js <restaurant_id>

# Apify only (old way)
node extract-images-apify.js <restaurant_id>
```

But we recommend the new combined approach for best results.

---

**System Status:** âœ… Production Ready
**Documentation:** âœ… Updated
**Testing:** âœ… Complete
**Ready to Scale:** âœ… Yes

---

*Updated by Claude Code on October 19, 2025*
