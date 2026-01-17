# Extraction Issues Analysis - Solia Murouj Re-Extraction

**Date**: October 26, 2025  
**Restaurant**: Solia Murouj (ID: 370ec2d8-0b4c-42b8-b5ad-98a8952d953f)

## Critical Issues Identified

### 1. **Anthropic API Rate Limit** 🔴 CRITICAL
**Impact**: All AI processing steps failing  
**Error Message**: `"You have reached your specified API usage limits. You will regain access on 2025-11-01 at 00:00 UTC."`

**Affected Steps**:
- Vision API (image analysis)
- Sentiment analysis
- AI content generation

**Resolution**: Wait until November 1, 2025 OR upgrade API tier

---

### 2. **Filename Validation Error** 🟡 HIGH
**Error**: `Invalid filename: Filename contains invalid characters. Only letters, numbers, hyphens, underscores, and dots are allowed`

**Location**: `src/lib/services/image-extractor.ts:454`

**Root Cause**: Google Places photo URLs may contain special characters that violate Supabase storage filename rules.

**Fix Applied**: ✅ Already implemented ImageValidator validation

---

### 3. **Missing Image Dimensions** 🟡 HIGH
**Error**: `Image validation failed: Image dimensions are required for validation`

**Location**: `src/lib/services/image-extractor.ts:474`

**Root Cause**: Some images from Damilo don't have dimension metadata

**Fix Required**: Add dimension extraction fallback logic

---

### 4. **Data Mapping `aiOutput` Not Defined** 🔴 CRITICAL
**Error**: `aiOutput is not defined`

**Location**: `src/lib/services/extraction-orchestrator.ts:352`

**Root Cause**: Variable `aiOutput` is defined in AI enhancement step scope but not accessible in data mapping step

**Fix Applied**: ✅ Extracted AI suggestions with null check before passing to data mapper

---

### 5. **JSON Parsing Error** 🟡 MEDIUM
**Error**: `SyntaxError: Unterminated string in JSON at position 4140`

**Location**: `src/lib/services/openai-client.ts:406`

**Root Cause**: OpenAI response contains unterminated string in JSON

**Fix Required**: Add JSON repair/fallback logic

---

## Comparison Summary

### Solia Murouj (Before Fix)
- **Fields Populated**: 16/51 (31%)
- **Status**: active
- **Job Progress**: Some steps failed

### Tatami Japanese Restaurant
- **Fields Populated**: 40/51 (78%)
- **Status**: active
- **Job Progress**: All steps completed

### Missing Fields in Solia (26 total)
- AI Content (5): Description, Short Description, Meta Title, Meta Description, Review Sentiment
- Operational Details (4): Payment Methods, Mall Floor, Nearby Landmarks, Public Transport
- Special Content (4): Secret Menu Items, Staff Picks, Kids Promotions, Awards
- Relationships (6): Cuisine IDs, Category IDs, Feature IDs, Meal IDs, Good For IDs, Neighborhood ID
- Social Media (1): Instagram
- Media URLs (3): Menu URL, Photos Count, Hero Image
- Ratings (3): TripAdvisor Rating/Reviews, Overall Rating

---

## Recommended Actions

### Immediate
1. **Wait for API Rate Limit Reset** (November 1, 2025)
2. **Re-run extraction** after rate limit resets
3. **Monitor** for JSON parsing errors

### Short-term
1. **Add dimension extraction fallback** for images without metadata
2. **Add JSON repair logic** for malformed OpenAI responses
3. **Add error handling** for API rate limits

### Long-term
1. **Add retry logic** with exponential backoff
2. **Add API rate limit monitoring**
3. **Add image pre-validation** before processing
4. **Add comprehensive logging** for debugging

---

## Fix Status

- ✅ AI Enhancement Step Fixed (removed non-existent column writes)
- ✅ Data Mapping Step Fixed (aiOutput accessibility)
- ✅ Image Validation Fixed (filename validation added)
- ⏳ Image Dimension Fallback (pending)
- ⏳ JSON Parsing Repair (pending)
- ⏳ API Rate Limit Handling (pending)

---

## Next Steps

1. Wait for Anthropic API rate limit reset (Nov 1, 2025)
2. Re-run extraction for Solia Murouj
3. Re-run extraction for Ubon
4. Monitor for remaining issues
5. Implement dimension fallback logic
6. Implement JSON repair logic

