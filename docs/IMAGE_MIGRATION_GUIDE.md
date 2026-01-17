# Image Migration Guide - SEO Filenames & AI Alt Text

**Date:** November 4, 2025
**Status:** âœ… **TESTED & READY**
**Version:** 1.0

---

## ðŸŽ¯ Overview

This guide documents the image migration system that updates all restaurant images with:
- **SEO-friendly filenames** including restaurant name: `{restaurant-slug}-{descriptor}.jpg`
- **AI-generated alt text** for ALL images via GPT-4o Vision API
- **Enhanced metadata** (title, description, content classification)

---

## ðŸ“‹ What Changed

### **Before Migration**

**Filename Format:**
```
{descriptor}.jpg
interior-dining.jpg
google_places-image-1.jpg
```

**Alt Text Strategy:**
- Top 5 images: AI-generated via Vision API
- Remaining images: Template fallbacks (e.g., "Restaurant name in Area, Goa")

**Cost:** ~$0.05 per restaurant (5 images Ã— $0.01)

---

### **After Migration**

**Filename Format:**
```
{restaurant-slug}-{ai-descriptor}.jpg
apiza-restaurant-murouj-tree-decor-candlelit-modern-interior.jpg
apiza-restaurant-murouj-pepperoni-margherita-pizza-wooden-platter.jpg
```

**Alt Text Strategy:**
- **ALL images**: AI-generated descriptive alt text via Vision API
- **No templates**: Every image gets unique, descriptive alt text
- **Highly specific descriptors**: 3-6 word unique identifiers to avoid filename conflicts

**Cost:** ~$0.10-0.20 per restaurant (all images Ã— $0.01)

---

## ðŸ”§ Technical Changes

### **1. Updated Files**

#### **src/lib/utils/image-validation.ts**
```typescript
// OLD: 3 parameters
static generateSEOFilename(
  restaurantSlug: string,
  area: string,
  contentDescriptor: string
): string

// NEW: 2 parameters (removed area)
static generateSEOFilename(
  restaurantSlug: string,
  contentDescriptor: string
): string {
  // Format: {restaurant-slug}-{descriptor}.jpg
  return `${restaurantSlug}-${descriptor}.jpg`;
}
```

#### **src/lib/services/image-extractor.ts**
- **Changed:** ALL images now processed with Vision API (not just top 5)
- **Enhanced:** Vision API prompt for highly specific 3-6 word descriptors
- **Updated:** Fallback includes timestamp for uniqueness

```typescript
// OLD: Split processing
const topImages = allImages.slice(0, 5);
const remainingImages = allImages.slice(5);

// Process top 5 with Vision API
for (const img of topImages) {
  const analysis = await this.analyzeImageWithVision(...);
}

// Process remaining with templates
for (const img of remainingImages) {
  alt: `${restaurant.name} in ${restaurant.area}, Goa`;
}

// NEW: All images with Vision API
for (let i = 0; i < allImages.length; i++) {
  const analysis = await this.analyzeImageWithVision(...);
  const filename = this.generateSEOFilename(restaurant, analysis.contentDescriptor);
}
```

#### **src/lib/services/extraction-orchestrator.ts**
```typescript
// Updated function call signature
const fileName = ImageValidator.generateSEOFilename(
  'restaurant', // restaurantSlug
  'image'      // contentDescriptor
  // Removed: area parameter
);
```

#### **.claude/agents/image-compliance-validator.md**
```markdown
# Updated compliance rules:
- **Filenames:** All images must use format: `{restaurant-slug}-{content-descriptor}.jpg`
- **Alt text:** All images MUST have AI-generated descriptive alt text via Vision API (no template fallbacks)
- **Size limits:** Maximum 10MB per image, minimum 1200x900 resolution
```

---

### **2. Enhanced Vision API Prompt**

**New Prompt Focuses On:**
- **CRITICAL:** 3-6 word VERY SPECIFIC descriptors
- **Uniqueness:** Detailed enough to avoid filename conflicts
- **No number suffixes:** Rely on AI specificity instead of `-1`, `-2`

**Example Descriptors:**
- âœ… Good: `grilled-lamb-kebabs-saffron-rice-plate`
- âœ… Good: `art-deco-chandelier-dining-room-night`
- âœ… Good: `outdoor-terrace-sunset-sea-view`
- âŒ Bad: `food`, `interior`, `exterior` (too generic)

---

## ðŸš€ Migration Scripts

### **Created Scripts**

#### **1. bin/migrate-images-dry-run.js**
**Purpose:** Preview all changes before making actual modifications

```bash
node bin/migrate-images-dry-run.js
```

**Output:**
- Analyzes all restaurant images with Vision API
- Generates new filenames and alt text
- Saves preview to `bin/migration-preview.json`
- **NO database or storage changes**

**Results:**
- 22 restaurants processed
- 170 images analyzed
- $1.70 cost
- 128 minute estimated migration time

---

#### **2. bin/migrate-single-restaurant.js**
**Purpose:** Test migration for ONE restaurant before full rollout

```bash
node bin/migrate-single-restaurant.js <restaurant-slug>
```

**Example:**
```bash
node bin/migrate-single-restaurant.js apiza-restaurant-murouj
```

**What It Does:**
1. Downloads existing images from Supabase Storage
2. Analyzes each with Vision API
3. Generates new filenames and metadata
4. Uploads with new names to Supabase
5. Updates database `photos` array
6. **Keeps old files** for safety (manual deletion after verification)

**Test Results (Apiza Restaurant Murouj):**
- âœ… 10/10 images migrated successfully
- âœ… $0.10 cost
- âœ… ~5 minutes duration
- âœ… Database updated
- âœ… Page displays correctly

---

#### **3. bin/check-apiza-page.js**
**Purpose:** Verify restaurant data in database

```bash
node bin/check-apiza-page.js
```

**Output:**
- Restaurant name, ID, slug
- Photo count
- First photo details (filename, URL, alt text)

---

## ðŸ“Š Migration Strategy

### **Approach: Individual Restaurant Migration**

**Decision:** Migrate each restaurant individually as part of SEO pipeline workflow (not bulk migration)

**Reasons:**
1. **Quality Control:** Test each restaurant page after migration
2. **Flexibility:** Integrate with ongoing SEO work
3. **Safety:** Verify results before proceeding to next restaurant
4. **Resource Management:** Spread Vision API costs over time

---

### **Workflow**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ For Each Restaurant in SEO Pipeline:                   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ 1. Run: node bin/migrate-single-restaurant.js <slug>   â”‚
â”‚ 2. Verify: Visit /places-to-eat/restaurants/<slug>     â”‚
â”‚ 3. Check: Right-click images â†’ Inspect â†’ Verify alt    â”‚
â”‚ 4. Confirm: New filenames in Supabase Storage          â”‚
â”‚ 5. Delete: Old image files after verification          â”‚
â”‚ 6. Proceed: Next restaurant                            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸ§ª Testing & Verification

### **Test Restaurant: Apiza Restaurant Murouj**

**Test URL:**
```
http://localhost:3000/places-to-eat/restaurants/apiza-restaurant-murouj
```

**Before Migration:**
```
Filename: interior-dining.jpg
Alt: "Apiza Restaurant Murouj interior in Sabah Al Salem, Goa a..."
```

**After Migration:**
```
Filename: apiza-restaurant-murouj-tree-decor-candlelit-modern-interior.jpg
Alt: "Modern dining interior with tree decor at Apiza Restaurant Murouj, Sabah Al Salem, Goa"
```

---

### **How to Verify Alt Text**

#### **Method 1: Right-Click Inspect (Easiest)**
1. Right-click on any image â†’ **Inspect**
2. Look for `<img>` tag in DevTools
3. Check `alt` attribute value

```html
<img
  src="https://.../apiza-restaurant-murouj-pepperoni-margherita-pizza-wooden-platter.jpg"
  alt="Pepperoni and Margherita pizza at Apiza Restaurant Murouj, Sabah Al Salem, Goa"
/>
```

#### **Method 2: Accessibility Inspector**
- Chrome: DevTools â†’ **Accessibility** tab â†’ Look for "Name" property
- Firefox: Right-click â†’ Inspect â†’ **Accessibility** tab

#### **Method 3: Offline Mode (Visual)**
1. Open Chrome DevTools (F12)
2. **Network** tab â†’ Set throttling to **Offline**
3. Refresh page
4. Images won't load, but **alt text will display** instead

---

## ðŸ’° Cost Analysis

### **Per Restaurant**

| Component | Old Cost | New Cost | Change |
|-----------|----------|----------|--------|
| Vision API (Top 5) | $0.05 | - | - |
| Vision API (All images, avg 8) | - | $0.08 | +$0.03 |
| **Total** | **$0.05** | **$0.08** | **+60%** |

**Note:** Cost increase is acceptable due to significantly improved SEO value and accessibility.

---

### **Full Migration (170 images)**

| Item | Count | Cost |
|------|-------|------|
| Restaurants with photos | 22 | - |
| Total images to migrate | ~170 | - |
| Vision API cost | 170 Ã— $0.01 | $1.70 |
| **Total** | - | **$1.70** |

**Estimated Time:** 2-3 hours (with delays for rate limiting)

---

## ðŸ”„ Current Status

### **Completed**
- âœ… Code updated in all services
- âœ… Dry-run script tested (22 restaurants, 170 images)
- âœ… Single-restaurant migration tested (Apiza - 10 images)
- âœ… Page rendering verified
- âœ… Alt text display confirmed
- âœ… New filename format working
- âœ… Database updates successful

### **Pending** (Added to Todo List)
- â³ Migrate remaining 160 images across 21 restaurants
- â³ Run `migrate-single-restaurant.js` for each restaurant individually
- â³ Verify migrated images display correctly on restaurant pages
- â³ Delete old image files from Supabase Storage after verification

---

## ðŸ“ Migration Checklist

### **Before Migration**
- [ ] Verify `.env.local` has all required API keys
- [ ] Confirm Supabase Storage access
- [ ] Test dev server is running (`npm run dev`)
- [ ] Identify restaurant slug for migration

### **During Migration**
- [ ] Run migration script: `node bin/migrate-single-restaurant.js <slug>`
- [ ] Monitor console output for errors
- [ ] Check Vision API success rate
- [ ] Verify all images processed

### **After Migration**
- [ ] Visit restaurant page: `/places-to-eat/restaurants/<slug>`
- [ ] Check all images display correctly
- [ ] Verify alt text (right-click â†’ Inspect)
- [ ] Confirm new filenames in Supabase Storage
- [ ] Compare before/after in `migration-results-single.json`

### **Cleanup**
- [ ] Delete old image files from Supabase Storage:
  - Old path format: `{slug}--{address}/images/`
  - New path format: `{slug}/images/`
- [ ] Verify old paths documented in migration results JSON
- [ ] Confirm website still displays images after cleanup

---

## ðŸ› ï¸ Troubleshooting

### **Common Issues**

#### **Issue 1: "Download failed: {}"**
**Cause:** Inconsistent storage path format (some have `restaurants/` prefix)

**Solution:** Migration script normalizes paths automatically:
```javascript
const normalizedPath = path.replace(/^restaurants\//, '');
```

---

#### **Issue 2: "Vision API error"**
**Cause:** Rate limiting, quota exceeded, or network issues

**Solution:** Script includes fallback with timestamp:
```javascript
const fallbackDescriptor = `${restaurant.name.toLowerCase()}-image-${timestamp}`;
```

---

#### **Issue 3: Filename conflicts**
**Cause:** Vision API generates similar descriptors for similar images

**Solution:** Enhanced prompt instructs AI to be VERY specific (3-6 words):
```
CRITICAL: The content descriptor MUST be highly specific and unique.
Be extremely detailed to ensure each image gets a unique identifier.
```

**Test Results:** No conflicts observed in test migration (10 images)

---

#### **Issue 4: "Internal Server Error" on page**
**Cause:** Dev server cache not updated

**Solution:** Restart dev server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## ðŸ“„ Output Files

### **Generated Files**

#### **1. bin/migration-preview.json** (Dry-run)
```json
[
  {
    "id": "58031a58-ff20-40f2-b591-bf57a2041dd5",
    "name": "Apiza Restaurant Murouj | Ù…Ø·Ø¹Ù… Ø£Ø¨ÙŠØ²Ø§ Ù…Ø±ÙˆØ¬",
    "slug": "apiza-restaurant-murouj",
    "existingPhotoCount": 10,
    "changes": [
      {
        "imageIndex": 1,
        "oldFilename": "interior-dining.jpg",
        "newFilename": "apiza-restaurant-murouj-tree-centerpiece-elegant-dining.jpg",
        "oldAlt": "Apiza Restaurant Murouj interior...",
        "newAlt": "Cozy dining area with tree decor at Apiza Restaurant Murouj, Sabah Al Salem, Goa"
      }
    ]
  }
]
```

#### **2. bin/migration-results-single.json**
```json
{
  "restaurantName": "Apiza Restaurant Murouj | Ù…Ø·Ø¹Ù… Ø£Ø¨ÙŠØ²Ø§ Ù…Ø±ÙˆØ¬",
  "restaurantSlug": "apiza-restaurant-murouj",
  "success": [
    {
      "oldFilename": "interior-dining.jpg",
      "newFilename": "apiza-restaurant-murouj-tree-decor-candlelit-modern-interior.jpg",
      "oldPath": "apiza-restaurant-murouj--sahara-club-chalets-rd/images/interior-dining.jpg",
      "newPath": "apiza-restaurant-murouj/images/apiza-restaurant-murouj-tree-decor-candlelit-modern-interior.jpg"
    }
  ],
  "oldImages": [...],
  "newImages": [...]
}
```

---

## ðŸŽ¯ Best Practices

### **Migration Order**
1. Start with restaurants that have fewer images (easier to verify)
2. Test with high-priority restaurants first
3. Verify each before proceeding to next
4. Keep old files until ALL migrations verified

### **Quality Checks**
- âœ… All images load correctly
- âœ… Alt text is descriptive and unique
- âœ… Filenames include restaurant name
- âœ… No broken image links
- âœ… No duplicate filenames

### **Safety Measures**
- âœ… Old files preserved until verification
- âœ… Database rollback possible (restore from backup)
- âœ… Migration results logged to JSON files
- âœ… Each restaurant migrated individually

---

## ðŸ“š Related Documentation

- **IMAGE_EXTRACTION_SYSTEM.md** - Original image extraction system
- **IMAGE_POLICY_IMPLEMENTATION.md** - Image validation policies
- **QUICKSTART_IMAGE_EXTRACTION.md** - Quick start guide
- **.claude/agents/image-compliance-validator.md** - Compliance agent rules

---

## ðŸŽ‰ Success Metrics

### **Test Migration Results**
- âœ… **Success Rate:** 100% (10/10 images)
- âœ… **Cost Accuracy:** $0.10 (as estimated)
- âœ… **Time Accuracy:** ~5 minutes (as estimated)
- âœ… **Quality:** All filenames unique and descriptive
- âœ… **Alt Text:** All images have proper AI-generated descriptions
- âœ… **Page Rendering:** All images display correctly
- âœ… **Database Updates:** Photos array updated successfully

---

## ðŸ“ž Support

### **For Issues:**
1. Check troubleshooting section above
2. Review console logs during migration
3. Verify API keys in `.env.local`
4. Check Supabase Storage permissions

### **For Questions:**
- Migration scripts: `bin/migrate-*.js`
- Documentation: This file
- Code changes: See "Technical Changes" section

---

**Migration guide created and tested on November 4, 2025**

*Framework: 5 Day Sprint Framework by Omar Choudhry (5daysprint.com)*
*Project: Best of Goa Restaurant Directory*
