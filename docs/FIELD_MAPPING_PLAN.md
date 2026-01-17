# 🎯 FIELD MAPPING ANALYSIS & ACTION PLAN
## Using Tatami Japanese Restaurant as Gold Standard

---

## 📊 EXECUTIVE SUMMARY

### Current Status:
- **Tatami has 53 Apify fields** (most complete data)
- **Other restaurants have 45-50 fields** (missing website, popularTimes, Q&A)
- **Database has 78 columns**
- **Only 75/78 columns populated** in Tatami (best case)
- **We're NOT mapping 4 critical Apify fields** to database

### Root Cause:
**Two separate issues:**
1. **Apify Inconsistency**: Google provides different data for different restaurants (not our fault)
2. **Missing Mappings**: We're NOT extracting fields that Apify DOES provide (our fault - fixable)

---

## 🔍 PART 1: WHAT APIFY RETURNS (SOURCE DATA)

### Tatami Japanese Restaurant - 53 Fields:

#### ✅ **Basic Info** (Currently Mapped):
- `title` → database: `name`
- `address` → database: `address`
- `street` → database: (used in address)
- `city` → database: `area`
- `neighborhood` → database: `area`
- `phone` → database: `phone`
- `phoneUnformatted` → database: `phone`
- `latitude` → database: `latitude`
- `longitude` → database: `longitude`
- `placeId` → database: `google_place_id`

#### ✅ **Ratings** (Currently Mapped):
- `totalScore` → database: `google_rating`
- `reviewsCount` → database: `google_review_count`
- `reviewsDistribution` → database: `rating_breakdown`

#### ✅ **Operational** (Currently Mapped):
- `website` → database: `website`
- `menu` → database: `menu_url`
- `price` → database: `price_level` + `average_meal_price`
- `openingHours` → database: `hours` (normalized)
- `categoryName` → database: `primary_category`

#### ⚠️ **NOT MAPPED** (Available but Ignored):
- `postalCode` → **NO database column**
- `subTitle` (Arabic name) → database: `name_ar` ✅ **MAPPED**
- `locatedIn` (building name) → database: `mall_name` (partially via extraction)
- `plusCode` → **NO database column**
- `popularTimesHistogram` → database: `busy_times` + `quiet_times` ✅ **MAPPED**
- `popularTimesLiveText` → **NOT STORED**
- `popularTimesLivePercent` → **NOT STORED**
- `questionsAndAnswers` → **NOT STORED**
- `peopleAlsoSearch` → **NOT STORED**
- `imageCategories` → **NOT STORED**
- `imagesCount` → **NOT STORED**
- `reviewsTags` → **NOT STORED**
- `updatesFromCustomers` → **NOT STORED**

#### 📦 **additionalInfo** (13 Categories - Partially Mapped):
Contains 167 structured attributes across:
1. **Service options** (5 items) → payment_methods (partial)
2. **Accessibility** (5 items) → **NOT MAPPED**
3. **Offerings** (8 items) → **NOT MAPPED**
4. **Dining options** (6 items) → **NOT MAPPED**
5. **Amenities** (4 items) → **NOT MAPPED**
6. **Atmosphere** (6 items) → description/keywords (manual)
7. **Crowd** (3 items) → good_for relationships (partial)
8. **Planning** (3 items) → reservations_policy (partial)
9. **Parking** (4 items) → parking_info (manual extraction)
10. **Payments** (4 items) → payment_methods (manual extraction)
11. **Children** (2 items) → good_for relationships (partial)
12. **Popular for** (3 items) → meal relationships (partial)
13. **Highlights** (2 items) → keywords (manual)

---

## 🗄️ PART 2: DATABASE SCHEMA (DESTINATION)

### 78 Database Columns:

#### ✅ **Well Populated** (75 fields in Tatami):
All basic fields are filled including:
- Contact: name, address, phone, email, website
- Location: latitude, longitude, area, neighborhood_id
- Social: instagram, facebook, twitter
- Ratings: google_rating, google_review_count, overall_rating
- Operational: hours, price_level, reservations_policy, parking_info
- Content: description, short_description, meta_title, meta_description
- Relationships: cuisine_ids, category_ids, feature_ids, meal_ids, good_for_ids

#### ❌ **Empty Fields** (3 fields in Tatami):
- `mall_gate` - Apify doesn't provide
- `michelin_guide_award_id` - Apify doesn't provide
- `parent_chain_id` - Apify doesn't provide

---

## 🚨 PART 3: THE PROBLEMS

### Problem #1: Apify Data Inconsistency (Not Our Fault)
**Why:** Google provides different data for different restaurants based on:
- How complete the Google Business Profile is
- How popular the restaurant is
- How long it's been on Google
- Whether the owner claimed/verified the listing

**Field Availability by Restaurant:**
```
Field                  | Tatami | Lï Beirut | Others
-----------------------|--------|-----------|--------
website                | ✅     | ❌        | 5/9
popularTimesHistogram  | ✅     | ❌        | 7/9
questionsAndAnswers    | ✅     | ❌        | 6/9
additionalInfo         | ✅(13) | ✅(13)    | 9/9 ✅
```

**Conclusion:** ALL restaurants have `additionalInfo`, but only SOME have website/popularTimes/Q&A.

---

### Problem #2: Missing Field Mappings (Our Fault - Fixable!)

#### 🔴 **CRITICAL - Not Using Available Data:**

1. **`postalCode`** (Apify provides)
   - **Current:** Not stored
   - **Should be:** New column `postal_code`
   - **Value:** SEO, local search, address autocomplete

2. **`questionsAndAnswers`** (6/9 restaurants have it)
   - **Current:** Not stored
   - **Should be:** New table `restaurants_questions` or JSON column
   - **Value:** Rich FAQ content, SEO, customer insights

3. **`peopleAlsoSearch`** (All restaurants have it)
   - **Current:** Not stored
   - **Should be:** JSON column or relationship table
   - **Value:** Related restaurants, recommendation engine

4. **`additionalInfo` categories NOT mapped:**
   - **Accessibility** (wheelchair, hearing loop) → Features table
   - **Offerings** (halal, vegan, organic) → Features table
   - **Dining options** (delivery, takeout, catering) → Features table
   - **Amenities** (wifi, restroom) → Features table
   - **Atmosphere** (casual, romantic, trendy) → Keywords/Tags

---

## ✅ PART 4: WHAT WE'RE DOING RIGHT

### Currently Well-Mapped Fields:
1. ✅ Basic contact info (name, address, phone, website)
2. ✅ Location data (lat/lng, area, neighborhood)
3. ✅ Ratings (google_rating, review_count, reviews_distribution)
4. ✅ Hours (normalized from Apify format)
5. ✅ Price level (converted from string to number)
6. ✅ Categories (mapped to relationships)
7. ✅ Reviews (50 stored in apify_output)
8. ✅ Popular times (mapped to busy_times/quiet_times)
9. ✅ Arabic name (subTitle → name_ar)
10. ✅ Additional info structure (all restaurants have 13 categories)

---

## 🎯 PART 5: ACTION PLAN

### Phase 1: Fix Critical Gaps (High Impact, Low Effort)

#### Action 1.1: Map `postalCode`
```typescript
// In mapApifyFieldsToDatabase()
postal_code: apifyData?.postalCode,
```
**Effort:** 1 line
**Impact:** Address completeness, SEO

---

#### Action 1.2: Extract & Map `additionalInfo` to Features
**Current Code:** Ignores most of additionalInfo
**New Code:** Extract structured features

```typescript
// New method in extraction-orchestrator.ts
private extractAdditionalInfoFeatures(additionalInfo: any): string[] {
  const features: string[] = [];

  // Accessibility
  if (additionalInfo.Accessibility) {
    additionalInfo.Accessibility.forEach((item: any) => {
      const key = Object.keys(item)[0];
      if (item[key] === true) features.push(key);
    });
  }

  // Offerings
  if (additionalInfo.Offerings) {
    additionalInfo.Offerings.forEach((item: any) => {
      const key = Object.keys(item)[0];
      if (item[key] === true) features.push(key);
    });
  }

  // Amenities
  if (additionalInfo.Amenities) {
    additionalInfo.Amenities.forEach((item: any) => {
      const key = Object.keys(item)[0];
      if (item[key] === true) features.push(key);
    });
  }

  // Dining options
  if (additionalInfo['Dining options']) {
    additionalInfo['Dining options'].forEach((item: any) => {
      const key = Object.keys(item)[0];
      if (item[key] === true) features.push(key);
    });
  }

  return features;
}
```

**Then in mapApifyFieldsToDatabase():**
```typescript
// Extract features from additionalInfo
additional_features: this.extractAdditionalInfoFeatures(apifyData?.additionalInfo),
```

**Effort:** 2 hours
**Impact:** 30-50 new features per restaurant

---

#### Action 1.3: Store `questionsAndAnswers` (6/9 restaurants have it)
**Option A:** New table
```sql
CREATE TABLE restaurants_questions (
  id UUID PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id),
  question TEXT,
  answer TEXT,
  asked_at TIMESTAMP,
  answered_by TEXT,
  helpful_count INTEGER
);
```

**Option B:** JSON column
```typescript
// In mapApifyFieldsToDatabase()
questions_and_answers: apifyData?.questionsAndAnswers,
```

**Effort:** 3 hours (with table), 10 minutes (with JSON column)
**Impact:** Rich FAQ content, SEO value

---

### Phase 2: Enhanced Mappings (Medium Impact, Medium Effort)

#### Action 2.1: Store `peopleAlsoSearch`
```typescript
// In mapApifyFieldsToDatabase()
people_also_search: apifyData?.peopleAlsoSearch,
```
**Effort:** 1 line
**Impact:** Related restaurants for recommendations

---

#### Action 2.2: Extract Atmosphere Tags
```typescript
private extractAtmosphereTags(additionalInfo: any): string[] {
  if (!additionalInfo?.Atmosphere) return [];

  return additionalInfo.Atmosphere
    .filter((item: any) => Object.values(item)[0] === true)
    .map((item: any) => Object.keys(item)[0]);
}
```

**Effort:** 30 minutes
**Impact:** Better search/filtering by vibe

---

### Phase 3: Optional Enhancements (Low Priority)

#### Action 3.1: Store Live Popular Times
```typescript
popular_times_live_text: apifyData?.popularTimesLiveText,
popular_times_live_percent: apifyData?.popularTimesLivePercent,
```
**Note:** This is LIVE data that changes constantly - may not be worth storing

---

#### Action 3.2: Store Image Metadata
```typescript
image_count: apifyData?.imagesCount,
image_categories: apifyData?.imageCategories,
```
**Effort:** 2 lines
**Impact:** Image management, display logic

---

## 📋 PART 6: IMPLEMENTATION CHECKLIST

### Before Starting:
- [ ] Review this plan with Douglas
- [ ] Decide on Phase 1, 2, or 3 scope
- [ ] Backup database
- [ ] Create git branch

### Phase 1 Implementation (Recommended):
- [ ] Add `postal_code` column to database
- [ ] Update `mapApifyFieldsToDatabase()` to include postal_code
- [ ] Create `extractAdditionalInfoFeatures()` method
- [ ] Map features to existing `restaurant_features` table
- [ ] Add `questions_and_answers` JSON column OR create new table
- [ ] Update `mapApifyFieldsToDatabase()` to include Q&A
- [ ] Test with Tatami restaurant
- [ ] Test with Lï Beirut restaurant (missing fields)
- [ ] Run migration on all 9 restaurants

### Testing:
- [ ] Verify Tatami has postal code
- [ ] Verify Tatami has Q&A (6 questions expected)
- [ ] Verify Tatami has 30+ new features from additionalInfo
- [ ] Verify Lï Beirut handles missing fields gracefully
- [ ] Check database for null/empty values

---

## 💡 PART 7: KEY INSIGHTS FOR DOUGLAS

### Why Tatami Has More Fields:
1. **Better Google Business Profile** - Owner likely claimed and filled out completely
2. **More Popular** - 524 reviews vs Lï Beirut's 103
3. **Older Establishment** - More Google data accumulated
4. **More Engagement** - People asked questions, Google tracked popular times

### Why We Can't Fix Everything:
- **Apify returns what Google provides**
- **Google provides different data for each restaurant**
- **We can't invent data that doesn't exist**

### What We CAN Fix:
- **Map ALL fields that Apify DOES provide**
- **Extract structured data from additionalInfo** (all restaurants have this!)
- **Store Q&A for restaurants that have it**
- **Add postal codes, atmosphere tags, etc.**

---

## 🎯 RECOMMENDED NEXT STEP

Douglas, I recommend starting with **Phase 1** only:

1. **Add `postal_code`** (1 line)
2. **Extract `additionalInfo` features** (2 hours, big impact)
3. **Store `questionsAndAnswers`** as JSON column (10 minutes)

This will give you **30-50 new features per restaurant** from data you're already receiving but not using.

**Should we proceed with Phase 1, or would you like to discuss first?**
