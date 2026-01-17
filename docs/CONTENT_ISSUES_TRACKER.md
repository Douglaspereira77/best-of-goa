# Content Issues Tracker
**Best of Goa Quality Assurance**
**Last Updated:** November 27, 2025 (Restaurants Published âœ…)

This document tracks specific content quality issues that need BOK Doctor or manual intervention.

---

## âœ… RESOLVED ISSUES

### Issue #1: Restaurants Unpublished âœ… RESOLVED
**Category:** Restaurants
**Severity:** ~~CRITICAL~~ RESOLVED
**Affected Records:** 469/469 â†’ All Published

**Original Problem:**
~~All 469 restaurants are in draft/unpublished status despite passing all quality checks.~~

**Resolution:**
âœ… **RESOLVED on November 27, 2025**
- Batch published all 469 restaurants using `bin/publish-all-restaurants.js`
- All restaurants now live at `/places-to-eat`
- Zero errors during publishing

**Assigned To:** Content Manager
**Completed:** November 27, 2025
**Status:** âœ… RESOLVED

---

## ðŸŸ¡ HIGH PRIORITY ISSUES (2-Week Timeline)

### Issue #2: Hotel Star Ratings Missing
**Category:** Hotels
**Severity:** HIGH
**Affected Records:** 80/80 (100%)

**Problem:**
No hotels have star ratings (1-5 stars) populated in database.

**Impact:**
- Cannot filter hotels by luxury level
- User confusion about hotel classification
- Missing key decision-making data

**Action Required:**
1. Review hotel websites and booking platforms
2. Classify each hotel (1-5 stars)
3. Update database with star_rating field
4. Verify accuracy with industry standards

**Data Sources:**
- Hotel official websites
- Booking.com classifications
- Goa Tourism Authority listings

**Assigned To:** BOK Doctor + Manual Classification
**Due Date:** 2 weeks
**Status:** ðŸŸ¡ OPEN

---

### Issue #3: School Email Addresses Missing
**Category:** Schools
**Severity:** HIGH
**Affected Records:** 55/55 (100%)

**Problem:**
Zero schools have email addresses in database.

**Impact:**
- Parents cannot contact schools directly
- Missing critical inquiry method
- Lower trust and usability

**Action Required:**
1. Visit each school website
2. Extract official email addresses
3. Verify email format and deliverability
4. Update database

**Expected Sources:**
- School official websites (98% have websites)
- Google Business profiles
- Goa education directories

**Assigned To:** Manual Research Team
**Due Date:** 2 weeks
**Status:** ðŸŸ¡ OPEN

---

### Issue #4: Attraction Admission Fees Missing
**Category:** Attractions
**Severity:** HIGH
**Affected Records:** 61/61 (100%)

**Problem:**
No attractions have pricing information populated.

**Impact:**
- Users cannot plan visits financially
- Missing key planning data
- Lower booking conversion

**Action Required:**
1. Research each attraction's pricing
2. Mark free attractions as "Free"
3. Add price ranges for paid attractions
4. Include child/senior pricing if available

**Data Format:**
- Free attractions: "Free"
- Paid: "5 KWD" or "3-10 KWD" (range)
- Include currency and child rates

**Assigned To:** Research Team
**Due Date:** 3 weeks
**Status:** ðŸŸ¡ OPEN

---

## ðŸŸ¢ MEDIUM PRIORITY ISSUES (1-Month Timeline)

### Issue #5: Mall Contact Information Gaps
**Category:** Malls
**Severity:** MEDIUM
**Affected Records:**
- Phone: 15/37 missing (41%)
- Website: 23/37 missing (62%)
- Store count: 30/37 missing (81%)

**Problem:**
Many malls missing basic contact and operational data.

**Impact:**
- Reduced user trust
- Cannot contact malls directly
- Missing competitive data (store counts)

**Action Required:**
1. **Phone Numbers:** Research 15 malls
   - Google Business profiles
   - Mall social media pages
   - Goa business directories

2. **Websites:** Find or verify 23 mall websites
   - Google search
   - Social media bio links
   - Mark as "No website" if confirmed

3. **Store Counts:** Count or estimate tenant numbers
   - Mall directories
   - Google Maps tenant listings
   - Physical visits if possible

**Assigned To:** Research Team
**Due Date:** 3 weeks
**Status:** ðŸŸ¢ OPEN

---

### Issue #6: School Accreditation Data Low
**Category:** Schools
**Severity:** MEDIUM
**Affected Records:** 41/55 missing (75%)

**Problem:**
Only 25% of schools have accreditation data.

**Impact:**
- Parents cannot verify quality credentials
- Missing trust signals
- Incomplete comparison data

**Action Required:**
1. Review school websites for accreditations
2. Look for: IB, NEASC, BSO, CIS, COBIS, etc.
3. Verify with official accreditation databases
4. Update schools.accreditations field

**Common Goa School Accreditations:**
- International Baccalaureate (IB)
- New England Association of Schools and Colleges (NEASC)
- British Schools Overseas (BSO)
- Council of International Schools (CIS)
- Council of British International Schools (COBIS)

**Assigned To:** Education Research Specialist
**Due Date:** 1 month
**Status:** ðŸŸ¢ OPEN

---

### Issue #7: Fitness Opening Hours Incomplete
**Category:** Fitness
**Severity:** MEDIUM
**Affected Records:** 54/98 missing (55%)

**Problem:**
Only 45% of fitness centers have operating hours.

**Impact:**
- Users cannot plan gym visits
- Reduced conversion for gym memberships
- Poor user experience

**Action Required:**
1. Check Google Business hours
2. Call gyms directly if needed
3. Verify separate hours for men/women (gender policy)
4. Update opening_hours field

**Special Considerations:**
- Women-only gyms may have specific hours
- Some gyms have separate men/women schedules
- Note Ramadan hours if different

**Assigned To:** BOK Doctor + Manual Verification
**Due Date:** 1 month
**Status:** ðŸŸ¢ OPEN

---

## ðŸ”µ LOW PRIORITY ISSUES (Ongoing)

### Issue #8: Restaurant Gallery Images
**Category:** Restaurants
**Severity:** LOW
**Affected Records:** 469/469 (100%)

**Problem:**
No restaurants have gallery images (only hero images).

**Impact:**
- Less visual engagement
- Cannot showcase ambiance, food, interior
- Competitive disadvantage

**Action Required:**
1. Re-run image extraction with gallery=true
2. Process multiple images per restaurant
3. Add Vision AI metadata
4. Link to restaurant_images table

**Assigned To:** BOK Doctor Image Pipeline
**Due Date:** Ongoing (6-8 weeks)
**Status:** ðŸ”µ PLANNED

---

### Issue #9: Restaurant Menu Item Coverage
**Category:** Restaurants
**Severity:** LOW
**Affected Records:** 249/469 missing (53%)

**Problem:**
Only 47% of restaurants have menu items.

**Impact:**
- Cannot search by dish
- Missing unique menu highlights
- Less detailed restaurant pages

**Action Required:**
1. Enhance Firecrawl menu extraction
2. Re-process restaurants with menu_url
3. Generate popular dishes from reviews
4. Populate restaurants_dishes table

**Assigned To:** BOK Doctor Menu Extraction
**Due Date:** Ongoing
**Status:** ðŸ”µ IN PROGRESS

---

### Issue #10: School Gallery Images Low
**Category:** Schools
**Severity:** LOW
**Affected Records:** 53/55 missing galleries (96%)

**Problem:**
Only 4% of schools have gallery images.

**Impact:**
- Cannot showcase facilities
- Less parent engagement
- Missing visual storytelling

**Action Required:**
1. Apply Vision AI to school photos
2. Process campus, classroom, facility images
3. Generate metadata for each image
4. Populate school_images table

**Assigned To:** BOK Doctor Vision AI
**Due Date:** 2 months
**Status:** ðŸ”µ PLANNED

---

## ðŸ“‹ QUALITY MONITORING CHECKLIST

Use this checklist for ongoing content quality assurance:

### Daily Checks
- [ ] Monitor new extractions for errors
- [ ] Review admin queue for stuck jobs
- [ ] Check for duplicate entries

### Weekly Checks
- [ ] Audit new published content
- [ ] Verify image quality for new items
- [ ] Check SEO metadata compliance
- [ ] Monitor user-reported issues

### Monthly Checks
- [ ] Run full content completeness audit
- [ ] Review and update this issues tracker
- [ ] Analyze content performance metrics
- [ ] Update quality standards

---

## ðŸŽ¯ QUALITY STANDARDS REFERENCE

### Required Fields (Must Be 95%+)
- âœ… name
- âœ… slug
- âœ… description
- âœ… hero_image
- âœ… address
- âœ… latitude / longitude
- âœ… meta_title
- âœ… meta_description

### Important Fields (Should Be 80%+)
- ðŸŸ¡ phone
- ðŸŸ¡ website
- ðŸŸ¡ google_rating
- ðŸŸ¡ opening_hours / hours

### Nice-to-Have Fields (Target 50%+)
- ðŸ”µ email
- ðŸ”µ social_media (instagram, facebook, etc.)
- ðŸ”µ pricing information
- ðŸ”µ gallery images

---

## ðŸ“Š ISSUE RESOLUTION TRACKING

| Issue # | Title | Severity | Opened | Resolved | Duration |
|---------|-------|----------|--------|----------|----------|
| #1 | Restaurants Unpublished | âœ… | Nov 27 | Nov 27 | Same day |
| #2 | Hotel Star Ratings | ðŸŸ¡ | Nov 27 | - | - |
| #3 | School Emails | ðŸŸ¡ | Nov 27 | - | - |
| #4 | Attraction Fees | ðŸŸ¡ | Nov 27 | - | - |
| #5 | Mall Contact Info | ðŸŸ¢ | Nov 27 | - | - |
| #6 | School Accreditations | ðŸŸ¢ | Nov 27 | - | - |
| #7 | Fitness Hours | ðŸŸ¢ | Nov 27 | - | - |
| #8 | Restaurant Galleries | ðŸ”µ | Nov 27 | - | - |
| #9 | Restaurant Menus | ðŸ”µ | Nov 27 | - | - |
| #10 | School Galleries | ðŸ”µ | Nov 27 | - | - |

**Average Resolution Time:** Same day (1 issue resolved)
**Open Issues:** 9
**Resolved Issues:** 1

---

## ðŸ”„ UPDATE LOG

### November 27, 2025 (Update 2)
- âœ… **Issue #1 RESOLVED:** All 469 restaurants published
- Script created: `bin/publish-all-restaurants.js`
- Platform now at 100% publication rate
- Open issues reduced from 10 to 9

### November 27, 2025 (Initial)
- Initial content quality audit completed
- 10 issues identified and documented
- Priority levels assigned
- Tracking system established

---

**Next Review:** December 4, 2025
**Maintained By:** BOK Content Tester
**Contact:** See project documentation for BOK Doctor coordination
