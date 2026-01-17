# CSV Generation Process Documentation
**Date:** 2025-11-12
**Project:** Best of Goa Directory
**Purpose:** Complete documentation of how cuisine-specific CSVs are created and managed

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [CSV Generation Scripts](#csv-generation-scripts)
3. [Process Workflows](#process-workflows)
4. [Output Files Reference](#output-files-reference)
5. [Quality Standards](#quality-standards)
6. [Troubleshooting](#troubleshooting)

---

## OVERVIEW

The Best of Goa project uses **Google Places API** to generate high-quality restaurant target lists organized by cuisine type. These lists are exported as CSV files for manual review before extraction into the database.

### **Why CSVs?**

1. **Manual Review:** Douglas can review, edit, and filter restaurants before extraction
2. **Batch Processing:** Group restaurants by cuisine for organized extraction
3. **Quality Control:** Pre-filter by rating and review count
4. **Deduplication:** Track Google Place IDs to avoid duplicates
5. **Audit Trail:** Preserve search results for analysis

---

## CSV GENERATION SCRIPTS

### **1. Bulk Cuisine Search (PRIMARY)**

**File:** `bin/search-restaurants-bulk-cuisines.js`

**Purpose:** Generate top 100 restaurants for each major cuisine type

**Configuration:**
```javascript
MIN_RATING = 4.2 stars
MIN_REVIEWS = 50
TARGET_PER_CUISINE = 100
```

**Supported Cuisines (10 Total):**
1. **Italian** - Search terms: Italian restaurant, Italian cuisine, pizza, pasta
2. **Japanese** - Search terms: Japanese restaurant, sushi, Japanese cuisine, ramen
3. **Middle Eastern** - Search terms: Middle Eastern restaurant, Lebanese restaurant, Arabic cuisine
4. **American** - Search terms: American restaurant, burger, steakhouse American, grill American
5. **Indian** - Search terms: Indian restaurant, Indian cuisine, biryani, curry
6. **Turkish** - Search terms: Turkish restaurant, Turkish cuisine, kebab Turkish
7. **Chinese** - Search terms: Chinese restaurant, Chinese cuisine, dim sum, noodles Chinese
8. **French** - Search terms: French restaurant, French cuisine, bistro, brasserie
9. **Seafood** - Search terms: seafood restaurant, fish restaurant, seafood grill
10. **Steakhouse** - Search terms: steakhouse, steak restaurant, grill steakhouse, prime steak

**Geographic Coverage:**
- Salmiya
- Goa City
- Hawally
- Farwaniya
- Ahmadi
- Jahra

**Usage:**
```bash
node bin/search-restaurants-bulk-cuisines.js
```

**Output Files:**
- `restaurants-italian-top100.csv`
- `restaurants-japanese-top100.csv`
- `restaurants-american-top100.csv`
- `restaurants-indian-top100.csv`
- `restaurants-turkish-top100.csv`
- `restaurants-chinese-top100.csv`
- `restaurants-french-top100.csv`
- `restaurants-seafood-top100.csv`
- `restaurants-steakhouse-top100.csv`
- `restaurants-middleeastern-top100.csv`

**Performance:**
- **Time:** 20-30 minutes
- **Cost:** $5-7 in Google Places API calls
- **Rate Limiting:** 1 second between searches, 3 seconds between cuisines

---

### **2. Custom Restaurant Search**

**File:** `bin/search-restaurants.js`

**Purpose:** Flexible single-cuisine or area-specific searches

**Usage:**
```bash
# Basic search (10 restaurants, 4.0+ rating, 20+ reviews)
node bin/search-restaurants.js

# Custom parameters
node bin/search-restaurants.js --limit=50 --min-rating=4.5 --min-reviews=100

# Area-specific
node bin/search-restaurants.js --area=Salmiya --limit=20

# Cuisine-specific
node bin/search-restaurants.js --cuisine=Italian --limit=30

# Custom output file
node bin/search-restaurants.js --limit=25 --output=restaurants-batch1.csv
```

**Command-Line Options:**
- `--limit=N` - Number of restaurants to find (default: 10)
- `--min-rating=N` - Minimum rating (default: 4.0)
- `--min-reviews=N` - Minimum reviews (default: 20)
- `--area=NAME` - Specific area only
- `--cuisine=TYPE` - Specific cuisine type
- `--output=FILE` - Output filename (default: restaurants.csv)

**Use Cases:**
- Ad-hoc searches for specific areas
- Testing new search queries
- Finding restaurants with custom criteria
- Smaller targeted batches

---

### **3. TripAdvisor CSV Generation**

**File:** `bin/create-tripadvisor-csv-with-place-ids.js`

**Purpose:** Convert TripAdvisor restaurant list to extraction-ready CSV with Google Place IDs

**Input:** `docs/csv/tripadvisor-extraction-priority-deduplicated.json`

**Process:**
1. Reads TripAdvisor restaurant list (115 restaurants after deduplication)
2. Searches Google Places API for each restaurant
3. Matches by name + location
4. Fetches Place ID, address, coordinates
5. Exports to CSV format

**Output:** `docs/csv/tripadvisor-all-phases-google-place-ids.csv`

**Usage:**
```bash
node bin/create-tripadvisor-csv-with-place-ids.js
```

**Performance:**
- **Time:** 5-6 hours (2-3 min per restaurant)
- **Success Rate:** ~85-90% (some restaurants need manual Place ID lookup)
- Restaurants without Place IDs marked as `NEEDS_LOOKUP`

---

### **4. TripAdvisor Analysis**

**File:** `bin/analyze-tripadvisor-csv.js`

**Purpose:** Analyze TripAdvisor CSV against existing database, detect duplicates, prioritize extraction

**Input:** `docs/csv/Tripadvisor-4-to-5-rating.csv`

**Process:**
1. Parse TripAdvisor CSV (218 restaurants)
2. Compare against existing database
3. Fuzzy matching for duplicate detection
4. Priority scoring algorithm
5. Export analysis results

**Output:** `docs/csv/tripadvisor-extraction-priority.json`

**Priority Scoring Algorithm:**
- Rating: 40 points max (rating Ã— 8)
- Review count: 30 points max (tiered)
- Price range: 15 points max (prefer mid-high)
- Location: 15 points max (diversity bonus)

**Duplicate Detection:**
- Exact name match (case-insensitive)
- Normalized match (remove punctuation, special chars)
- Fuzzy match (Levenshtein distance)
- Partial match (one name contains other)
- Location + name match

**Usage:**
```bash
node bin/analyze-tripadvisor-csv.js
```

---

## PROCESS WORKFLOWS

### **Workflow 1: Bulk Cuisine CSV Generation**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 1. Run Bulk Search Script                                   â”‚
â”‚    node bin/search-restaurants-bulk-cuisines.js             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 2. For Each Cuisine (10 total):                             â”‚
â”‚    - Search with 4 different terms                          â”‚
â”‚    - Search across Goa + 6 specific areas                â”‚
â”‚    - Filter: 4.2+ stars, 50+ reviews                        â”‚
â”‚    - Deduplicate by Place ID                                â”‚
â”‚    - Sort by rating desc, then review count desc            â”‚
â”‚    - Take top 100                                            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 3. Export CSV Files                                          â”‚
â”‚    - Format: Name, Place ID, Cuisine, Rating, Reviews...    â”‚
â”‚    - Location: docs/csv/restaurants-{cuisine}-top100.csv    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 4. Manual Review                                             â”‚
â”‚    - Open in Excel/Google Sheets                            â”‚
â”‚    - Remove unwanted restaurants                            â”‚
â”‚    - Verify quality and relevance                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 5. Extraction                                                â”‚
â”‚    - Go to http://localhost:3000/admin/add                  â”‚
â”‚    - Extract using Name + Google Place ID                   â”‚
â”‚    - Or use: node bin/extract-from-csv-direct.js            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### **Workflow 2: TripAdvisor CSV Generation**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 1. Analyze TripAdvisor CSV                                   â”‚
â”‚    node bin/analyze-tripadvisor-csv.js                      â”‚
â”‚    - Input: Tripadvisor-4-to-5-rating.csv (218 restaurants) â”‚
â”‚    - Compare with existing database                         â”‚
â”‚    - Detect duplicates (fuzzy matching)                     â”‚
â”‚    - Calculate priority scores                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 2. Manual Duplicate Review                                   â”‚
â”‚    - Review potential duplicates list                        â”‚
â”‚    - Verify matches manually                                â”‚
â”‚    - Update deduplicated JSON                               â”‚
â”‚    Result: 115 new restaurants to extract                   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 3. Generate CSV with Place IDs                              â”‚
â”‚    node bin/create-tripadvisor-csv-with-place-ids.js        â”‚
â”‚    - Read deduplicated JSON (115 restaurants)               â”‚
â”‚    - Search Google Places for each restaurant               â”‚
â”‚    - Fetch Place ID, address, coordinates                   â”‚
â”‚    - Export to CSV                                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 4. Manual Place ID Lookup                                    â”‚
â”‚    - Some restaurants marked NEEDS_LOOKUP                    â”‚
â”‚    - Manually find Place IDs on Google Maps                 â”‚
â”‚    - Update CSV with correct Place IDs                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                       â”‚
                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ 5. Batch Extraction                                          â”‚
â”‚    node bin/extract-tripadvisor-batch.js                    â”‚
â”‚    - Process all restaurants in CSV                         â”‚
â”‚    - Run full extraction pipeline                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## OUTPUT FILES REFERENCE

### **CSV File Format**

All generated CSVs follow this structure:

```csv
Name,Google Place ID,Cuisine,Rating,Total Reviews,Price Level,Address,Latitude,Longitude
"300F Smokehouse Restaurant",ChIJSzjdYEkJzz8RPj4UmdUrJrM,American,4.9,2795,N/A,"Goa",29.1541586,48.1256221
```

**Column Definitions:**

| Column | Description | Example |
|--------|-------------|---------|
| Name | Restaurant name (quoted if contains commas) | "300F Smokehouse Restaurant" |
| Google Place ID | Unique Google Places identifier | ChIJSzjdYEkJzz8RPj4UmdUrJrM |
| Cuisine | Cuisine type | American |
| Rating | Average rating (0.0-5.0) | 4.9 |
| Total Reviews | Number of Google reviews | 2795 |
| Price Level | Price range ($, $$, $$$, $$$$, N/A) | N/A |
| Address | Full formatted address | "Goa" |
| Latitude | Latitude coordinate | 29.1541586 |
| Longitude | Longitude coordinate | 48.1256221 |

### **CSV File Locations**

All CSV files stored in: `docs/csv/`

**Cuisine-Specific CSVs (Generated by bulk search):**
- `restaurants-american-top100.csv` (67 restaurants)
- `restaurants-chinese-top100.csv`
- `restaurants-french-top100.csv`
- `restaurants-indian-top100.csv`
- `restaurants-italian-top100.csv`
- `restaurants-japanese-top100.csv`
- `restaurants-middleeastern-top100.csv`
- `restaurants-seafood-top100.csv`
- `restaurants-steakhouse-top100.csv`
- `restaurants-turkish-top100.csv`

**TripAdvisor CSVs:**
- `Tripadvisor-4-to-5-rating.csv` (Original - 218 restaurants)
- `tripadvisor-all-phases-google-place-ids.csv` (With Place IDs - 115 new)
- `tripadvisor-phase1-google-place-ids.csv` (Priority batch)

**Analysis Files (JSON):**
- `tripadvisor-extraction-priority.json` (Full analysis with duplicates)
- `tripadvisor-extraction-priority-deduplicated.json` (Final 115)
- `tripadvisor-extraction-progress.json` (Extraction tracking)
- `tripadvisor-needs-manual-review.json` (Potential duplicates)

---

## QUALITY STANDARDS

### **Bulk Cuisine Search Standards**

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| Minimum Rating | 4.2 stars | High-quality establishments only |
| Minimum Reviews | 50 reviews | Reliable rating data |
| Target per Cuisine | 100 restaurants | Comprehensive coverage |
| Geographic Coverage | 6 Goa areas | City-wide representation |

### **TripAdvisor Standards**

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| Rating Range | 4.0-5.0 stars | TripAdvisor's top tier |
| Duplicate Detection | 90%+ confidence | Avoid wasting extraction credits |
| Priority Scoring | 0-100 scale | Data-driven extraction order |

### **CSV Quality Checks**

Before extraction, verify:

âœ… **No duplicate Place IDs** (each restaurant unique)
âœ… **Valid Place IDs** (format: ChIJxxxxxx)
âœ… **Rating >= threshold** (4.0 or 4.2 depending on source)
âœ… **Review count >= threshold** (20, 50, or 100 depending on source)
âœ… **Valid coordinates** (Goa latitude: 28-30, longitude: 46-49)
âœ… **Address contains "Goa"** (ensures correct country)

---

## TROUBLESHOOTING

### **Issue: Fewer than target restaurants found**

**Example:** American CSV has 67 restaurants instead of 100

**Cause:** Google Places API returned fewer results meeting quality thresholds

**Solutions:**
1. Lower `MIN_RATING` from 4.2 to 4.0
2. Lower `MIN_REVIEWS` from 50 to 20
3. Add more search terms to the cuisine
4. Search additional areas

**Script modifications:**
```javascript
// In bin/search-restaurants-bulk-cuisines.js
const MIN_RATING = 4.0;  // Lower from 4.2
const MIN_REVIEWS = 20;  // Lower from 50
```

---

### **Issue: API rate limiting errors**

**Symptoms:**
- `OVER_QUERY_LIMIT` error
- Script stops mid-execution

**Solutions:**
1. Increase delays between requests:
```javascript
await new Promise(resolve => setTimeout(resolve, 2000)); // Increase from 1000ms
```

2. Process cuisines in smaller batches
3. Run script during off-peak hours
4. Upgrade Google Places API quota

---

### **Issue: Duplicate restaurants in CSV**

**Symptoms:** Same restaurant appears multiple times with different Place IDs

**Cause:** Restaurant has multiple Google Places entries (different locations)

**Solution:**
1. Use `seenPlaceIds` Set to track unique IDs (already implemented)
2. Manual review in spreadsheet - sort by name, delete duplicates
3. Check database before extraction using:
```bash
node bin/check-duplicates.js
```

---

### **Issue: Missing Place IDs (NEEDS_LOOKUP)**

**Symptoms:** CSV shows `NEEDS_LOOKUP` instead of Place ID

**Cause:**
- Restaurant name doesn't match Google Places exactly
- Restaurant not in Google Places database
- Location ambiguity

**Solution:**
1. Manually search restaurant on Google Maps
2. Copy Place ID from URL: `maps.google.com/?cid=XXXXXX` or use "Share" â†’ "Embed" â†’ extract from iframe
3. Update CSV with correct Place ID
4. Or use Apify Google Places Scraper API manually

---

### **Issue: Google Places API key missing**

**Error:** `GOOGLE_PLACES_API_KEY not found in .env.local`

**Solution:**
1. Create Google Cloud Project
2. Enable Places API
3. Generate API key
4. Add to `.env.local`:
```
GOOGLE_PLACES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXX
```

---

### **Issue: CSV encoding problems**

**Symptoms:** Restaurant names with Arabic/special characters display incorrectly

**Solution:**
1. Ensure UTF-8 encoding when saving CSV
2. Use Excel import wizard: Data â†’ From Text â†’ UTF-8
3. Or use Google Sheets (auto-detects UTF-8)

---

## ADDING NEW CUISINES

To add a new cuisine type to bulk search:

1. **Edit** `bin/search-restaurants-bulk-cuisines.js`
2. **Add to CUISINES array** (line 37):

```javascript
const CUISINES = [
  // ... existing cuisines ...
  {
    name: 'Thai',
    searchTerms: [
      'Thai restaurant',
      'Thai cuisine',
      'pad thai',
      'Thai curry'
    ]
  }
];
```

3. **Run bulk search** to generate new CSV
4. **Review output** in `restaurants-thai-top100.csv`

---

## REGENERATING CSVs

To update CSVs with current Google Places data:

```bash
# Regenerate all cuisine CSVs (20-30 min)
node bin/search-restaurants-bulk-cuisines.js

# Regenerate single cuisine (2-3 min)
node bin/search-restaurants.js --cuisine=Italian --limit=100 --output=restaurants-italian-top100.csv
```

**When to regenerate:**
- New restaurants opened in Goa
- Ratings/reviews have changed significantly
- Quarterly refresh (every 3 months recommended)
- After major holidays or events

---

## NEXT STEPS AFTER CSV GENERATION

1. âœ… **Review CSVs** in spreadsheet software
2. âœ… **Remove unwanted restaurants** (duplicates, closed, irrelevant)
3. âœ… **Verify Place IDs** (replace NEEDS_LOOKUP)
4. âœ… **Check for duplicates** against database:
   ```bash
   node bin/check-duplicates.js
   ```
5. âœ… **Start extraction** via admin interface or batch script:
   ```bash
   # Manual: http://localhost:3000/admin/add
   # Batch: node bin/extract-from-csv-direct.js
   ```
6. âœ… **Monitor progress**:
   ```bash
   node bin/extraction-progress.js
   ```
7. âœ… **Validate quality**:
   ```bash
   node bin/validate-extraction-quality.js --last-n=10
   ```

---

## RELATED DOCUMENTATION

- **Extraction Pipeline:** `docs/README.md` (Section: Restaurant Extraction Pipeline)
- **Extraction Orchestrator:** `src/lib/services/extraction-orchestrator.ts`
- **Admin Interface:** `src/app/admin/add/page.tsx`
- **Database Schema:** `docs/restaurant-data-extraction-spec.md`
- **TripAdvisor Process:** `docs/TRIPADVISOR_FINAL_EXTRACTION_PLAN.md`
- **Duplicate Detection:** `docs/TRIPADVISOR_DUPLICATE_ANALYSIS.md`
- **Extraction Scripts:** `bin/README_EXTRACTION_SCRIPTS.md`

---

**Last Updated:** 2025-11-12
**Maintained By:** Douglas (Best of Goa)
**Questions?** Check script comments or run with `--help` flag
