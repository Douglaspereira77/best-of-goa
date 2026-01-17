# Extraction Management Scripts - Usage Guide

Welcome to your complete extraction management toolkit! These scripts will help you extract, validate, and enhance 500 restaurants efficiently.

---

## ðŸ“‹ Related Documentation

| Document | Description |
|----------|-------------|
| **[CSV Generation Process](../docs/CSV_GENERATION_PROCESS.md)** | Complete guide to creating cuisine-specific CSV target lists |
| **[TripAdvisor Extraction](../docs/TRIPADVISOR_FINAL_EXTRACTION_PLAN.md)** | TripAdvisor CSV workflow and deduplication |
| **[Extraction Orchestrator](../docs/README.md)** | Main extraction pipeline architecture |

---

## ðŸ“š Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| **CSV GENERATION** | | |
| `search-restaurants-bulk-cuisines.js` | Generate top 100 per cuisine | **When building target lists** |
| `search-restaurants.js` | Custom restaurant searches | **Ad-hoc searches** |
| `create-tripadvisor-csv-with-place-ids.js` | TripAdvisor â†’ CSV converter | **TripAdvisor imports** |
| **QUALITY CONTROL** | | |
| `check-duplicates.js` | Find duplicate restaurants | **Before starting each day** |
| `validate-extraction-quality.js` | Check data quality | **After each batch of 50** |
| `extraction-progress.js` | Track progress to 500 goal | **Daily** (morning & evening) |
| **BATCH PROCESSING** | | |
| `batch-enhance-all.js` | Run AI enhancement in bulk | **After extracting all 500** |
| `extract-from-csv-direct.js` | Extract from CSV files | **Batch CSV imports** |

---

## ðŸ” 1. Duplicate Detection

**File:** `bin/check-duplicates.js`

### What It Does:
- Finds exact name + address matches (critical duplicates ðŸš¨)
- Detects fuzzy name matches (85%+ similarity)
- Identifies restaurants at same GPS coordinates
- Shows similar names in same area

### Usage:

```bash
# Check all restaurants for duplicates
node bin/check-duplicates.js
```

### Output Example:

```
ðŸš¨ EXACT MATCHES (Same Name + Address)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
1. DUPLICATE FOUND:
   Restaurant 1: Olio Trattoria (olio-trattoria-messila)
   Restaurant 2: Olio Trattoria (olio-trattoria-messila-2)
   Address: Messila Beach, Coastal Road
   âš ï¸  ACTION: Delete one of these restaurants
```

### **When to Run:**
- âœ… **Every morning before starting** - Prevent extracting duplicates
- âœ… After extracting 50 restaurants
- âœ… If you suspect duplicate entries

### **What to Do with Results:**

**Exact Matches (ðŸš¨):**
- **CRITICAL:** Delete immediately before continuing
- Go to database or admin panel
- Keep the one with more data/photos
- Delete the duplicate

**Fuzzy Matches (âš ï¸):**
- Manually review - might be legitimate (e.g., "Burger King Salmiya" vs "Burger King - Salmiya Branch")
- Different locations = keep both
- Same restaurant = delete duplicate

---

## âœ¨ 2. Quality Validation

**File:** `bin/validate-extraction-quality.js`

### What It Does:
- Checks for missing required fields (name, address, coordinates)
- Validates photo counts (need 5+ for good SEO)
- Checks AI enhancement status
- Verifies SEO metadata exists
- Checks cuisine mapping
- Grades overall quality (A+ to D)

### Usage:

```bash
# Validate all completed restaurants
node bin/validate-extraction-quality.js

# Validate last 50 restaurants only
node bin/validate-extraction-quality.js --last-n=50

# Validate specific restaurant
node bin/validate-extraction-quality.js --restaurant-id=your-uuid-here
```

### Output Example:

```
ðŸ“Š QUALITY SUMMARY
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
Total Restaurants Validated: 50
Perfect Quality: 45 (90.0%)
Critical Issues: 2 ðŸš¨
Warning Issues: 3 âš ï¸
Info Only: 5 â„¹ï¸

ðŸŽ¯ Overall Quality Grade: A
```

### **Quality Grades:**

| Grade | Score | Meaning |
|-------|-------|---------|
| A+ | 95-100% | Perfect - ready for SEO launch |
| A | 90-94% | Excellent - minor tweaks needed |
| B+ | 85-89% | Good - some optimization needed |
| B | 80-84% | Acceptable - needs improvement |
| C | 70-79% | Poor - major issues to fix |
| D | <70% | Critical - review extraction pipeline |

### **When to Run:**
- âœ… **After every 50 extractions** - Catch issues early
- âœ… End of each day
- âœ… Before running batch AI enhancement
- âœ… Final check before SEO implementation

### **What to Do with Results:**

**Critical Issues (ðŸš¨):**
- **Stop extracting** and fix immediately
- Missing name/address/coordinates = extraction failed
- Re-run extraction for those restaurants

**Warning Issues (âš ï¸):**
- Note for batch enhancement later
- Missing AI enhancement = run `batch-enhance-all.js`
- Low photo count (<5) = retry image extraction

**Info Issues (â„¹ï¸):**
- Nice-to-have improvements
- Can fix during batch enhancement
- Not blocking for launch

---

## ðŸ“Š 3. Progress Tracking

**File:** `bin/extraction-progress.js`

### What It Does:
- Shows progress toward 500-restaurant goal
- Breaks down by status (completed, in_progress, failed)
- Shows geographic distribution across 6 governorates
- Displays top cuisines
- Calculates daily extraction rate
- Estimates completion date
- Quality metrics at a glance

### Usage:

```bash
# Check progress (run anytime!)
node bin/extraction-progress.js
```

### Output Example:

```
ðŸŽ¯ OVERALL PROGRESS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Goal: 500 restaurants
Completed: 250 âœ…
In Progress: 3 â³
Failed: 2 âŒ

Progress: 50.0% complete
Remaining: 250 restaurants

[â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘â–‘] 250/500

ðŸ“ GEOGRAPHIC DISTRIBUTION
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Salmiya          45/83 (54%) ðŸŸ¡
Goa City      48/83 (58%) ðŸŸ¡
Hawally          38/83 (46%) ðŸ”´
Farwaniya        42/83 (51%) ðŸŸ¡
Ahmadi           40/83 (48%) ðŸ”´
Jahra            37/83 (45%) ðŸ”´

â±ï¸  EXTRACTION RATE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Last 7 days: 175 restaurants
Average rate: 25.0 per day

Estimated completion: 10 days (Jan 24, 2025)
âœ… On track to reach 500 restaurants within 2 weeks
```

### **When to Run:**
- âœ… **Morning** - Plan day's extraction targets
- âœ… **Evening** - Check daily progress
- âœ… Before starting work (motivational!)
- âœ… Anytime you want to see the big picture

### **What to Do with Results:**

**If behind schedule:**
- Check which areas need more restaurants
- Focus extraction on under-represented governorates
- Increase daily extraction rate (30-40 per day)

**If ahead of schedule:**
- Maintain pace
- Focus on quality over speed
- Add only 4.5+ star restaurants

**Geographic imbalances:**
- Script shows "Focus on these areas next"
- Prioritize those areas in next day's extraction
- Aim for Â±5 restaurants across all areas

---

## ðŸ¤– 4. Batch AI Enhancement

**File:** `bin/batch-enhance-all.js`

### What It Does:
- Runs GPT-4o AI enhancement for all unenhanced restaurants
- Generates SEO metadata (titles, descriptions)
- Analyzes images with Vision API (if needed)
- Processes restaurants in bulk (overnight batch job)

### Usage:

```bash
# Dry run (see what would be enhanced, no changes)
node bin/batch-enhance-all.js --dry-run

# Enhance all restaurants missing AI output
node bin/batch-enhance-all.js

# Enhance only 10 restaurants (testing)
node bin/batch-enhance-all.js --limit=10

# Enhance specific restaurant
node bin/batch-enhance-all.js --restaurant-id=your-uuid-here

# Skip image processing (AI enhancement only, faster)
node bin/batch-enhance-all.js --skip-images
```

### Output Example:

```
ðŸ¤– BATCH AI ENHANCEMENT SCRIPT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

ðŸ“Š Found 500 restaurant(s) needing enhancement

ðŸ’° Estimated cost: $75.00 (500 Ã— $0.15)

Starting batch enhancement...

[1/500] Processing: Olio Trattoria
[1/500]   Step 1/3: Running AI enhancement...
[1/500]   âœ… AI enhancement complete
[1/500]   Step 2/3: Generating SEO metadata...
[1/500]   âœ… SEO metadata generated
[1/500]   Step 3/3: Analyzing 9 images...
[1/500]   âœ… Image analysis complete
[1/500] âœ… Complete!

...

ðŸ“Š BATCH ENHANCEMENT SUMMARY
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
Total Processed: 500
Successful: 498 âœ…
Failed: 2 âŒ

ðŸŽ‰ All restaurants enhanced successfully!
```

### **When to Run:**
- âœ… **After extracting all 500 restaurants** - Batch process overnight
- âœ… If quality validation shows missing AI enhancement
- âœ… After fixing extraction pipeline (re-enhance failed ones)

### **Recommended Workflow:**

**Option A: Extract Fast, Enhance Later (RECOMMENDED for 500)**
```bash
# Week 1: Extract core data only (Apify + Firecrawl)
# ... extract 50 restaurants/day ...

# End of Week 1: Run batch AI enhancement overnight
node bin/batch-enhance-all.js

# This runs overnight (~4-6 hours for 500 restaurants)
# Cost: ~$75 total
```

**Option B: Extract + Enhance Simultaneously**
```
# Use admin page normally
# Full pipeline per restaurant
# Slower but ensures quality as you go
```

### **Cost Breakdown:**

Per restaurant:
- GPT-4o AI enhancement: $0.05
- GPT-4o SEO metadata: $0.05
- Vision API (10 images): $0.05
- **Total: ~$0.15**

500 restaurants Ã— $0.15 = **$75 total**

### **Error Handling:**

If some restaurants fail:
```bash
# Script will show which ones failed
# Run again to retry only failed restaurants
node bin/batch-enhance-all.js

# Or retry specific restaurant
node bin/batch-enhance-all.js --restaurant-id=failed-restaurant-uuid
```

---

## ðŸŽ¯ Daily Workflow (Recommended)

### **Morning (9:00 AM - 10:00 AM)**

```bash
# 1. Check progress (motivational start!)
node bin/extraction-progress.js

# 2. Check for duplicates (prevent wasted work)
node bin/check-duplicates.js

# 3. Review extraction plan for today
# See: docs/EXTRACTION_TARGET_LIST_500.md
```

**Action:**
- Note which areas need more restaurants
- Plan today's Google Maps searches
- Set target: Extract 50 restaurants today

---

### **Midday (10:00 AM - 1:00 PM)**

**Google Maps Research:**
- Search for restaurants (see extraction target list)
- Copy names and Google Place IDs to spreadsheet
- Check for potential duplicates

**Extraction:**
- Go to `http://localhost:3000/admin/add`
- Extract 25 restaurants
- Monitor extraction progress (~4 min each)

---

### **Afternoon (2:00 PM - 5:00 PM)**

**Extraction:**
- Extract another 25 restaurants
- Total for day: 50 âœ…

---

### **Evening (5:00 PM - 6:00 PM)**

```bash
# 1. Validate today's extractions
node bin/validate-extraction-quality.js --last-n=50

# 2. Check updated progress
node bin/extraction-progress.js

# 3. Note any issues for tomorrow
```

**Action:**
- Fix any critical issues found
- Note failed extractions for retry
- Update spreadsheet with progress

---

## ðŸš€ End-to-End Workflow (500 Restaurants)

### **Week 1: Core Extraction**

**Mon-Fri:** Extract 50/day = 250 total
```bash
# Each day:
# Morning:
node bin/extraction-progress.js
node bin/check-duplicates.js

# Evening:
node bin/validate-extraction-quality.js --last-n=50
node bin/extraction-progress.js
```

### **Week 2 (Mon-Thu): Finish Extraction**

**Mon-Thu:** Extract 50/day = 200 more
**Friday:** Extract final 50 = **500 total** âœ…

```bash
# Final checks:
node bin/check-duplicates.js
node bin/validate-extraction-quality.js
node bin/extraction-progress.js
```

### **Week 2 (Weekend): Batch Enhancement**

```bash
# Saturday morning - Start batch enhancement (runs 4-6 hours)
node bin/batch-enhance-all.js

# Saturday evening - Validate results
node bin/validate-extraction-quality.js

# If any failed, retry:
node bin/batch-enhance-all.js  # Automatically processes only failed ones
```

### **Week 3: SEO Implementation & Launch**

**Mon:** Implement technical SEO (sitemap, robots.txt, llm.txt)
**Tue-Thu:** Build area pages
**Fri:** Public launch

---

## âš ï¸ Troubleshooting

### **Issue: "Error fetching restaurants"**

**Solution:**
- Check `.env.local` has Supabase credentials
- Verify Supabase is running
- Check internet connection

---

### **Issue: Batch enhancement fails halfway through**

**Solution:**
```bash
# Script will resume from where it left off
# Just run again - it only processes unenhanced restaurants
node bin/batch-enhance-all.js
```

---

### **Issue: "No restaurants need enhancement"**

**Solution:**
- All restaurants already enhanced âœ…
- Or extraction_status not set to 'completed'
- Check: `SELECT COUNT(*) FROM restaurants WHERE extraction_status = 'completed' AND ai_enhancement_output IS NULL`

---

### **Issue: Quality grade is C or D**

**Solution:**
1. Run `node bin/validate-extraction-quality.js` to see specific issues
2. Common fixes:
   - Missing photos: Retry image extraction
   - No AI enhancement: Run `node bin/batch-enhance-all.js`
   - Missing cuisines: Check data mapper or run AI enhancement
3. After fixes, re-validate

---

## ðŸ“ˆ Success Metrics

After completing all scripts, you should have:

- âœ… 500 restaurants with `extraction_status = 'completed'`
- âœ… 0 duplicates (checked daily)
- âœ… Quality grade A+ or A (95%+)
- âœ… 500 restaurants with AI enhancement
- âœ… 500 restaurants with SEO metadata
- âœ… Even distribution (~83 per governorate)
- âœ… All restaurants 4.0+ stars

**Verify:**
```bash
node bin/extraction-progress.js
node bin/validate-extraction-quality.js
```

---

## ðŸ’¡ Pro Tips

**1. Run quality validation in parallel with extraction:**
```bash
# Terminal 1: Extract via admin page
# Terminal 2: Monitor quality in real-time
watch -n 300 "node bin/validate-extraction-quality.js --last-n=10"
# (Updates every 5 minutes)
```

**2. Track extraction in spreadsheet:**
- Copy script outputs to Excel/Google Sheets
- Visual charts for progress
- Easy filtering by area/cuisine

**3. Batch enhancement overnight:**
```bash
# Run before bed (Friday night)
nohup node bin/batch-enhance-all.js > enhancement.log 2>&1 &

# Check in morning
tail -f enhancement.log
```

**4. Set daily reminders:**
- 9 AM: Check progress
- 5 PM: Validate quality
- 10 PM: Review tomorrow's targets

---

**Happy extracting! You've got all the tools you need to reach 500 restaurants! ðŸš€**

---

**Questions?**
- Check extraction plan: `docs/EXTRACTION_TARGET_LIST_500.md`
- Review SEO strategy: `docs/SESSION_SUMMARY_2025-01-09.md` (after extraction)
