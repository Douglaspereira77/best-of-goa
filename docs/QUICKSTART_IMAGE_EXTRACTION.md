# Quick Start Guide - Image Extraction System

## ðŸš€ Extract Images in 3 Steps

### Step 1: Find Restaurant ID
```bash
node list-test-restaurants.js
```

### Step 2: Run Extraction
```bash
node extract-restaurant-images.js <restaurant_id>
```

### Step 3: Verify Results
```bash
# Check in Supabase dashboard under 'restaurants' table
# Or view image URLs in console output
```

---

## ðŸ“‹ Example: Extract Images for Olio

```bash
# Run extraction
node extract-restaurant-images.js c2c88faf-4535-44ae-8f2b-91297082ba50

# Expected output:
# âœ… Found: Olio Trattoria Italiana
# âœ… Found 10 photos from Google Places
# âœ… Selected top 5 images
# âœ… Processed: 5 images with Vision API
# âœ… Database updated
# ðŸ’° Total cost: $0.05
```

---

## ðŸ’° Cost Per Restaurant

| Component | Cost |
|-----------|------|
| Google Places API | $0.00 (FREE) |
| Claude Vision API | $0.05 (5 images) |
| **TOTAL** | **$0.05** |

---

## ðŸ“Š What You Get

For each restaurant, you get **5 high-resolution images** with:

âœ… **4800Ã—3200 resolution** (15.4 megapixels)
âœ… **SEO-optimized alt text** (includes location & description)
âœ… **Compelling titles** (brand + descriptive)
âœ… **Detailed descriptions** (2-3 sentences)
âœ… **SEO-friendly filenames** (restaurant-area-goa-descriptor-1.jpg)
âœ… **Content classification tags** (8-15 relevant keywords)
âœ… **Supabase public URLs** (ready to use immediately)

---

## ðŸ” Test Before Extracting

```bash
# Preview what photos are available
node test-google-places-photos.js c2c88faf-4535-44ae-8f2b-91297082ba50

# Results saved to: bin/google-places-photos-{slug}.txt
```

---

## ðŸ§ª Available Test Restaurants

```
1. Dar Hamad (Salmiya)
   ID: 6effdb8a-b69f-42c8-a3ae-4399f8c94e4a

2. November & Co. (Salmiya)
   ID: c751e08e-c1ab-446e-87df-cb0282413bc6

3. Olio Trattoria Italiana (Messila)
   ID: c2c88faf-4535-44ae-8f2b-91297082ba50

4. Dai Forni (Mirqab)
   ID: 24841fe0-6a29-4f64-b59e-56f58fdee6f6

5. Al Boom Steak & Seafood Restaurant (Salwa)
   ID: b43b5a61-69f0-41df-8d4c-97f76270e8c6
```

---

## ðŸ› ï¸ Advanced Usage

### Force Google Places Only
```bash
node extract-images-google-places.js <restaurant_id>
```

### Force Apify Only (if needed)
```bash
node extract-images-apify.js <restaurant_id>
```

### Batch Test Multiple Restaurants
```bash
node batch-test-google-places-photos.js
```

---

## âŒ Common Issues

### "No Google Place ID found"
**Solution:** Restaurant needs `google_place_id` in database. Add it manually or system will try Apify fallback.

### "No photos found"
**Solution:** Restaurant might not have photos on Google Places. System will try Apify fallback.

### Vision API timeout
**Solution:** Large images may take longer. Script has 5-minute timeout built-in.

---

## ðŸ“š Full Documentation

For complete details, see: **`IMAGE_EXTRACTION_SYSTEM.md`**

Includes:
- Architecture overview
- Technical specifications
- SEO optimization strategies
- Cost analysis
- Troubleshooting guide
- Future enhancements

---

## ðŸŽ¯ Quick Scaling

### Extract for 10 restaurants:
```bash
for id in id1 id2 id3 id4 id5 id6 id7 id8 id9 id10; do
  node extract-restaurant-images.js $id
  sleep 2  # Polite delay between restaurants
done
```

**Time:** ~5-6 minutes
**Cost:** $0.50 (10 Ã— $0.05)

---

## âœ… Quality Checklist

After extraction, verify:
- [ ] 5 images uploaded to Supabase
- [ ] All images are 4800Ã—3200 or similar high-res
- [ ] Alt text includes restaurant name + location
- [ ] Filenames follow SEO format
- [ ] Images display correctly on website
- [ ] Public URLs are accessible

---

## ðŸš¨ Need Help?

1. Check console output for specific errors
2. Review logs in Supabase dashboard
3. Run verification script: `node verify-olio-extraction.js`
4. See troubleshooting in `IMAGE_EXTRACTION_SYSTEM.md`

---

**Ready to extract images for all Best of Goa restaurants? Start with one test restaurant first!**
