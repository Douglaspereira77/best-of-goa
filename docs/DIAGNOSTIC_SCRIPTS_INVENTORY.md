# Diagnostic Scripts Inventory - November 3, 2025

## Purpose
This document categorizes all diagnostic scripts in `/bin` to identify which should be kept for ongoing use vs archived.

---

## ✅ KEEP - Ongoing Utility Scripts

These scripts have general utility and should be kept:

### General Diagnostics
- `check-extraction-queue.js` - Monitor extraction job queue
- `check-reference-tables.js` - Verify reference table data
- `check-schema.js` - Database schema verification
- `list-test-restaurants.js` - List test restaurant data

### Social Media Testing
- `test-social-media-search.js` - Test multi-stage social media search
- `diagnose-firecrawl-search.js` - Diagnose Firecrawl Search API

### Image Testing
- `test-image-selection.js` - Test image selection logic
- `test-google-places-photos.js` - Test Google Places photo extraction

### Phase Testing
- `test-phase1-phase2-extraction.js` - Test basic extraction phases
- `test-phase3a-ai-classification.js` - Test AI classification
- `test-phase4-extraction.js` - Test enhanced FAQ system

---

## 📦 ARCHIVE - Restaurant-Specific Debug Scripts

These were created for one-time debugging and can be archived or removed:

### Little Ruby's Investigation (Nov 3, 2025)
- `check-little-rubys.js` - Check extraction data
- `check-little-rubys-job-progress.js` - Check job progress
- `check-little-rubys-reference-ids.js` - Check reference IDs
- `test-little-rubys-data-mapping.js` - Test data mapping
- `test-little-rubys-mapping.js` - Test field mapping
- `find-little-rubys.js` - Find restaurant record

### Burger Boutique Investigation (Nov 2-3, 2025)
- `check-burger-boutique-images.js` - Check image extraction
- `check-burger-boutique-json.js` - Check JSON data
- `check-burger-boutique-status.js` - Check extraction status
- `check-burger-social-media.js` - Check social media fields
- `diagnose-burger-boutique.js` - Diagnose extraction
- `diagnose-burger-boutique-detailed.js` - Detailed diagnostics

### Other Restaurant-Specific Scripts
- `check-beastro-extraction.js` - Beastro debugging
- `check-beastro-refs.js` - Beastro reference tables
- `diagnose-beastro-status.js` - Beastro status check
- `check-khaneen-extraction.js` - Khaneen debugging
- `test-khaneen-extraction.js` - Khaneen test
- `check-leila-neighborhood.js` - Leila neighborhood
- `check-leila-slug.js` - Leila slug generation
- `check-olio-extraction.js` - Olio debugging
- `check-olio-apify-data.js` - Olio Apify data
- `test-olio-update.js` - Olio update test
- `check-tatami-apify-data.js` - Tatami Apify data
- `test-phase1-tatami.js` - Tatami phase 1
- `check-rooftop-fields.js` - Rooftop field mapping
- `diagnose-rooftop-mapping.js` - Rooftop diagnostics
- `test-rooftop-mapping.js` - Rooftop mapping test
- `diagnose-babel-extraction.js` - Babel debugging

### Neighborhood Testing (Completed)
- `test-mall-neighborhoods.js` - Mall neighborhood testing
- `test-murouj-mapping.js` - Murouj neighborhood mapping
- `test-neighborhood-linking.js` - Neighborhood linking test

### Undefined Value Bug Investigation (Nov 3, 2025 - FIXED)
- `test-undefined-update.js` - Demonstrates JavaScript undefined behavior

---

## 🧪 KEEP - Testing Infrastructure

These support active testing workflows:

### API Testing
- `test-api-status.js` - API health checks
- `test-api-direct.js` - Direct API testing

### Data Mapping Testing
- `test-data-mapping.js` - General data mapping tests
- `test-full-extraction-selection.js` - Full extraction test

### Image Policy Testing
- `test-image-policy.js` - Image policy validation
- `test-image-policy-e2e.js` - End-to-end image policy
- `test-image-policy-integration.js` - Integration tests
- `test-image-policy-live.js` - Live image policy test
- `test-image-policy-simple.js` - Simple policy test
- `test-image-selection-live.js` - Live image selection
- `batch-test-google-places-photos.js` - Batch photo testing
- `test-image-extraction.js` - Image extraction testing

### Extraction Testing
- `test-new-extraction.js` - Test new extraction flow
- `test-social-media-extraction.js` - Social media extraction test

---

## 🗑️ CONSIDER REMOVING - Experimental/Obsolete

These may be experimental or obsolete:

- `check-apify-data.js` - Overlap with other scripts?
- `check-basic-fields.js` - Overlap with other scripts?
- `check-all-restaurants-refs.js` - Overlap with other scripts?
- `check-batch-results.js` - Batch operation test
- `check-column-names.js` - Schema investigation
- `check-columns.js` - Schema investigation
- `check-database-truth.js` - Generic database check
- `check-extraction.js` - Overlap with check-extraction-queue.js?
- `check-firecrawl-results-type.js` - One-time type check
- `test-broader-search.js` - Search experiment
- `test-different-actors.js` - Actor comparison test

---

## 📝 Cleanup Recommendations

### Immediate Actions

1. **Archive restaurant-specific scripts** to `/bin/archive/restaurant-debug/`:
   - All Little Ruby's scripts (6 files)
   - All Burger Boutique scripts (6 files)
   - All other restaurant-specific scripts (~20 files)

2. **Keep general utilities** in `/bin/`:
   - Extraction queue monitoring
   - Reference table checks
   - Schema verification
   - Phase testing scripts

3. **Document in CODE_FILE_LOCATIONS.txt** which scripts are actively used

### Optional Actions

1. Create `/bin/archive/` directory structure:
   ```
   /bin/archive/
     /restaurant-debug/  - One-time restaurant debugging
     /experiments/       - Experimental/obsolete scripts
     /completed-fixes/   - Scripts for fixed bugs (e.g., test-undefined-update.js)
   ```

2. Update README or create `/bin/README.md` explaining:
   - Which scripts are for regular use
   - Which are archived but kept for reference
   - How to run common diagnostic workflows

---

## Summary

**Total Scripts:** ~70 files in /bin
**Keep Active:** ~25 files (general utilities, testing infrastructure)
**Archive:** ~45 files (restaurant-specific debugging, one-time investigations)

**Benefit:** Cleaner `/bin` directory, easier to find relevant scripts, preserved debugging history for reference.
