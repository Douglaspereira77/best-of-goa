# GBA Content Extraction Test

## 🎯 Objective
Test the school extraction pipeline with ONE school (Gulf British Academy) to verify that images are saved to the correct storage path WITHOUT the double "schools/schools" folder issue.

## ✅ Pre-Test Checklist

- [x] GBA added to database (ID: `23bffe57-c1e1-4feb-a2da-ebc2e07eed76`)
- [x] Google Place ID confirmed (`ChIJ4XymcSGdzz8RFGzO1v_uAgE`)
- [x] Slug confirmed (`gba-gulf-british-academy`)
- [x] Storage bucket inspected (no double-path issues currently exist)
- [x] Code verified (line 846 in `attraction-image-extractor.ts` is correct)

## 🚀 What the Test Will Do

The test script will run the **FULL 12-step extraction pipeline** for GBA:

1. ✅ Apify - Google Places Details
2. ✅ Firecrawl - Website Scraping
3. ✅ Social Media Search (Instagram, Facebook, etc.)
4. ✅ Google Reviews (100 most recent)
5. ✅ Curriculum Detection
6. ✅ Tuition Extraction (AI-powered)
7. ✅ Facilities Detection
8. ✅ Grade Level Mapping
9. ✅ Gender Policy Detection
10. ✅ **Image Extraction & Processing** ⚠️ CRITICAL TEST POINT
11. ✅ AI Enhancement (descriptions, meta tags)
12. ✅ Category Matching

## 📁 Expected Storage Path

**CORRECT:**
```
schools/gba-gulf-british-academy/images/image-1.jpg
```

**INCORRECT (what we're testing against):**
```
schools/schools/gba-gulf-british-academy/images/image-1.jpg
```

## ⏱️ Estimated Time
- **Full extraction:** 2-4 minutes
- **Image processing:** 30-60 seconds (depends on number of images)

## 🔍 What We're Monitoring

1. **Image upload path** - Must be `schools/gba-gulf-british-academy/images/`
2. **No double folder** - Must NOT create `schools/schools/`
3. **Database updates** - Hero image, photos field, content fields
4. **Hero image selection** - AI should select best image

## 🏃 Running the Test

```bash
npx tsx bin/test-gba-content-extraction.ts
```

## ✅ Success Criteria

- [ ] Images uploaded to `schools/gba-gulf-british-academy/images/`
- [ ] No `schools/schools/` folder created
- [ ] Hero image set in database
- [ ] Content fields populated (principal, mission, etc.)
- [ ] Extraction status = "completed"

## ⚠️ Important Notes

- This is a **ONE-SCHOOL TEST** before bulk extraction
- The script will make real API calls (Firecrawl, OpenAI, Google Places)
- Images will be permanently uploaded to Supabase Storage
- Database will be updated with extracted data
- **DO NOT run bulk extraction until this test passes**

## 🛑 If Test Fails

1. Check console output for error messages
2. Inspect storage bucket structure with `bin/inspect-schools-bucket-structure.ts`
3. Review database record for partial updates
4. Fix any path issues before proceeding

## ✅ If Test Succeeds

🎉 **Safe to proceed with bulk extraction!**

Run bulk extraction with:
```bash
npm run extract:schools -- --limit [number]
```
