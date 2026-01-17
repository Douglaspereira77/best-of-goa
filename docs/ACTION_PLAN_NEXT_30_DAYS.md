# Best of Goa - 30-Day Action Plan
**Quality Improvement Roadmap**
**Generated:** November 27, 2025
**For:** Douglas (Best of Goa Project Owner)

---

## ðŸŽ¯ GOAL: Transform BOK from 41% to 100% Published

**Current State (Updated November 27, 2025):**
- 800 total listings
- âœ… **800 published (100%)** - ACHIEVED!
- ~~469 restaurants waiting~~ â†’ All published
- 90% data quality âœ…

**30-Day Target:**
- âœ… 800 listings published (100%) - COMPLETE
- Critical data gaps filled
- Platform ready to compete with Best Dubai

---

## WEEK 1: PUBLISH & PRIORITIZE

### Day 1-2: Restaurant Publishing âœ… COMPLETE
**Task:** ~~Publish all 469 restaurants~~
**Status:** âœ… **COMPLETED - November 27, 2025**

**What Was Done:**
1. Created batch publish script: `bin/publish-all-restaurants.js`
2. Executed script to publish all 469 restaurants
3. All restaurants now live at `/places-to-eat`
4. Zero errors during publishing

**Result:** âœ… 469 restaurants now live on `/places-to-eat`

**Script Used:**
```bash
node bin/publish-all-restaurants.js
```

---

### Day 3: Audit Published Content
**Task:** Verify restaurants display correctly
**How:**
1. Visit `/places-to-eat` hub page
2. Check 20 random restaurant detail pages
3. Verify:
   - Hero images loading
   - Descriptions displaying
   - Maps showing correct locations
   - SEO metadata present
4. Fix any broken links or images

**Success Metric:** Zero display errors on public pages

---

### Day 4-5: Priority Data Collection
**Task:** Gather hotel star ratings
**How:**
1. Export list of 80 hotels
2. Research each hotel's official star rating
3. Use sources:
   - Hotel official websites
   - Booking.com
   - TripAdvisor
   - Goa Tourism listings
4. Create CSV with hotel_id and star_rating
5. Bulk update database

**Success Metric:** 80/80 hotels classified (1-5 stars)

**Template:**
```csv
hotel_id,name,star_rating
1,Four Seasons Goa,5
2,Waldorf Astoria,5
3,Hampton by Hilton,3
...
```

---

## WEEK 2: CONTACT INFORMATION

### Day 6-7: School Email Addresses
**Task:** Find email addresses for 55 schools
**How:**
1. Export school list with website URLs
2. Visit each school website
3. Look for:
   - Contact page
   - About page footer
   - Admissions section
4. Record email in format: admissions@schoolname.edu.kw
5. Verify email format validity

**Success Metric:** 50/55 schools with emails (91%+)

**Note:** Some schools may not have public emails - mark as "Contact via website form"

---

### Day 8-10: Mall Contact Data
**Task:** Research 15 mall phone numbers, 23 websites
**How:**

**Phone Numbers:**
1. Google "[Mall Name] Goa phone"
2. Check Google Business listing
3. Check mall Facebook page
4. Call directory assistance if needed

**Websites:**
1. Google "[Mall Name] Goa official website"
2. Check Instagram bio links
3. Verify website is active
4. Mark "No website" if confirmed absent

**Success Metric:**
- 35/37 malls with phone (95%+)
- 30/37 malls with website or marked as none (81%+)

---

## WEEK 3: PRICING & OPERATIONS

### Day 11-13: Attraction Admission Fees
**Task:** Research pricing for 61 attractions
**How:**
1. Visit attraction official websites
2. Check Google Business listings
3. Call attractions if needed
4. Format as:
   - "Free" for free attractions
   - "5 KWD" for fixed price
   - "3-10 KWD" for price ranges
   - Include child/senior rates if available

**Success Metric:** 55/61 attractions with pricing (90%+)

**Expected Breakdown:**
- ~30 free attractions (parks, beaches, public areas)
- ~25 paid attractions (museums, theme parks)
- ~6 variable pricing (tours, events)

---

### Day 14-17: Fitness Opening Hours
**Task:** Find hours for 54 fitness centers
**How:**
1. Check Google Business hours first
2. Visit gym websites
3. Call gyms during business hours
4. **Important:** Note gender-specific hours
   - Women-only gyms
   - Separate men/women schedules
5. Format in structured JSON or text

**Success Metric:** 85/98 fitness centers with hours (87%+)

**Note:** This is lower priority - focus on top 20 most popular gyms first

---

## WEEK 4: ENHANCEMENT & MONITORING

### Day 18-20: School Accreditation Research
**Task:** Find accreditations for 41 schools
**How:**
1. Check school websites for badges/logos
2. Look for mentions of:
   - IB (International Baccalaureate)
   - NEASC (New England)
   - BSO (British Schools Overseas)
   - CIS (Council of International Schools)
3. Verify on official accreditation websites
4. Record as text array

**Success Metric:** 35/55 schools with accreditations (64%+)

---

### Day 21-23: Image Quality Check
**Task:** Audit hero images across all categories
**How:**
1. Check for low-resolution images
2. Verify images are appropriate
3. Replace any placeholder images
4. Ensure cultural appropriateness
5. Fix broken image URLs

**Success Metric:** 100% valid, high-quality hero images

**Categories to Check:**
- Restaurants: 458 images
- Hotels: 80 images
- Malls: 37 images
- Attractions: 61 images
- Schools: 53 images
- Fitness: 94 images

---

### Day 24-26: SEO Metadata Review
**Task:** Verify and enhance meta titles/descriptions
**How:**
1. Run automated check for length compliance
2. Ensure titles are 50-60 characters
3. Ensure descriptions are 150-160 characters
4. Check for duplicate meta descriptions
5. Add keywords naturally

**Success Metric:** 100% compliant SEO metadata

**Script Available:**
```bash
npx tsx scripts/audit-seo-metadata.ts
```

---

### Day 27-28: Content Quality Spot Check
**Task:** Manual review of 50 random listings
**How:**
1. Select 10 random items per category
2. Read descriptions for:
   - Grammar and spelling
   - Factual accuracy
   - Engagement quality
   - Cultural appropriateness
3. Flag any issues for rewrite
4. Check for placeholder text

**Success Metric:** <5% listings need rewrites

**Red Flags to Watch:**
- "Lorem ipsum" or placeholder text
- Obviously incorrect information
- Culturally inappropriate content
- Duplicate descriptions
- Overly generic descriptions

---

### Day 29-30: Final Audit & Reporting
**Task:** Run comprehensive quality audit
**How:**
1. Run audit script:
```bash
npx tsx scripts/content-quality-audit.ts
```
2. Compare to Week 1 baseline
3. Document improvements
4. Identify remaining gaps
5. Create 60-day plan for next phase

**Success Metric:**
- 95% published across all categories
- 92% average completeness (up from 90%)
- <5 critical issues remaining

---

## ðŸ“Š SUCCESS METRICS DASHBOARD

Track progress daily:

| Metric | Week 1 | Week 2 | Week 3 | Week 4 | Target |
|--------|--------|--------|--------|--------|--------|
| Published Items | âœ… 800 | - | - | - | 800 |
| Avg Completeness | 90% | - | - | - | 92% |
| Hotel Star Ratings | 0% | - | - | - | 100% |
| School Emails | 0% | - | - | - | 90% |
| Mall Phone Numbers | 59% | - | - | - | 95% |
| Attraction Fees | 0% | - | - | - | 90% |
| Fitness Hours | 45% | - | - | - | 87% |

---

## ðŸ› ï¸ TOOLS & RESOURCES

### Scripts Available
```bash
# Content quality audit
npx tsx scripts/content-quality-audit.ts

# Check database schema
npx tsx scripts/check-schema.ts

# Batch operations (create as needed)
npx tsx scripts/batch-publish-restaurants.ts
npx tsx scripts/batch-update-hotels-stars.ts
npx tsx scripts/batch-update-school-emails.ts
```

### Admin Pages
- Restaurants: http://localhost:3000/admin/restaurants
- Hotels: http://localhost:3000/admin/hotels
- Malls: http://localhost:3000/admin/malls
- Attractions: http://localhost:3000/admin/attractions
- Schools: http://localhost:3000/admin/schools
- Fitness: http://localhost:3000/admin/fitness

### Public Pages
- Places to Eat: http://localhost:3000/places-to-eat
- Places to Stay: http://localhost:3000/places-to-stay
- Places to Shop: http://localhost:3000/places-to-shop
- Places to Visit: http://localhost:3000/places-to-visit
- Places to Learn: http://localhost:3000/places-to-learn
- Things to Do: http://localhost:3000/things-to-do/fitness

---

## ðŸ’¡ QUICK WINS

These can be done anytime for immediate impact:

### 1. Social Media Boost (2 hours)
- Add Instagram handles for restaurants missing them
- Update Facebook pages for hotels
- Cross-check social media validity

### 2. Description Enhancement (3 hours)
- Run AI enhancement on generic descriptions
- Add "What makes this special" highlights
- Ensure Goa-specific context in all descriptions

### 3. Image Gallery Expansion (1 day)
- Re-run image extraction for top 50 restaurants
- Add facility images for top schools
- Expand hotel image galleries

---

## âš ï¸ RISKS & MITIGATION

### Risk #1: Publishing Breaks Something
**Mitigation:**
- Test publish 10 restaurants first
- Monitor error logs
- Have rollback plan ready
- Check public pages immediately

### Risk #2: Data Research Takes Too Long
**Mitigation:**
- Focus on top-priority items first
- Set daily time limits (2-3 hours max)
- Mark items as "Research pending" if stuck
- Ask BOK Doctor to enhance automation

### Risk #3: Quality Issues After Publishing
**Mitigation:**
- Spot-check 20 random items daily
- Set up monitoring for broken images
- Have content review workflow
- Easy unpublish option in admin

---

## ðŸ“ž WHEN TO ASK FOR HELP

Contact BOK Doctor if:
- âŒ Batch publishing fails
- âŒ Scripts throw errors
- âŒ Database updates not working
- âŒ Need new automation for data collection
- âŒ SEO metadata needs regeneration
- âŒ Image extraction needed

Contact Manual Research Team if:
- ðŸ” Can't find contact information after 15 minutes per item
- ðŸ” Need Goa-specific directory access
- ðŸ” Language barriers (Arabic websites)
- ðŸ” Need to call businesses for verification

---

## âœ… WEEK-BY-WEEK CHECKLIST

### Week 1: Publish Foundation
- [x] Day 1-2: Publish 469 restaurants âœ… DONE (Nov 27)
- [ ] Day 3: Audit public pages
- [ ] Day 4-5: Collect hotel star ratings
- [x] Week 1 Goal: 800 items published âœ… ACHIEVED

### Week 2: Contact Data
- [ ] Day 6-7: Research 55 school emails
- [ ] Day 8-10: Find mall contact info
- [ ] Week 2 Goal: 85% contact completeness âœ…

### Week 3: Pricing & Hours
- [ ] Day 11-13: Attraction admission fees
- [ ] Day 14-17: Fitness opening hours
- [ ] Week 3 Goal: Key operational data complete âœ…

### Week 4: Quality & Polish
- [ ] Day 18-20: School accreditations
- [ ] Day 21-23: Image quality audit
- [ ] Day 24-26: SEO review
- [ ] Day 27-28: Content spot check
- [ ] Day 29-30: Final audit
- [ ] Week 4 Goal: 92% completeness âœ…

---

## ðŸŽ¯ 30-DAY SUCCESS DEFINITION

**By December 27, 2025, Best of Goa will have:**

âœ… 800 listings published (100%)
âœ… 92% average data completeness
âœ… Zero critical quality issues
âœ… Hotel classifications complete
âœ… School contact data complete
âœ… Attraction pricing information
âœ… Enhanced operational data
âœ… Platform ready for public launch

**Current Status:** âœ… 100% published, 90% complete
**Target Status:** 100% published, 92% complete
**Improvement:** âœ… Publication complete! Focus on +2% data quality

---

**Ready to continue?** Day 1-2 complete! Move to Day 3: Audit Public Pages

**Questions?** Reference the detailed audit reports:
- `CONTENT_QUALITY_AUDIT_REPORT.md` - Full analysis
- `CONTENT_AUDIT_SUMMARY.md` - Quick overview
- `CONTENT_ISSUES_TRACKER.md` - Issue details

**Let's make Best of Goa the #1 directory in Goa! ðŸ‡°ðŸ‡¼**
