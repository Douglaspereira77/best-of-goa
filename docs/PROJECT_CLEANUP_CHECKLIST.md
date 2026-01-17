# Project Cleanup Checklist - November 12, 2025

## Overview
Comprehensive cleanup of the Best of Goa project to organize files, remove unnecessary scripts, and improve project maintainability.

## Cleanup Categories

### 1. âœ… Bin Scripts Organization
**Goal**: Organize extraction scripts by purpose and archive obsolete ones

#### Keep (Active/Useful)
- âœ… `extract-from-csv-direct.js` - Main CSV extraction script
- âœ… `find-incomplete-restaurants.js` - Database health monitoring
- âœ… `delete-incomplete-restaurants.js` - Database cleanup
- âœ… `check-enhancement-status.js` - Monitor extraction progress
- âœ… `batch-enhance-all.js` - Batch AI enhancement
- âœ… `ai-enhance-only.js` - AI enhancement only

#### Archive (Obsolete/Superseded)
- ðŸ—‚ï¸ `extract-tripadvisor-batch.js` - Old extraction method
- ðŸ—‚ï¸ `create-tripadvisor-csv-with-place-ids.js` - CSV generation (one-time use)
- ðŸ—‚ï¸ `identify-incomplete-duplicates.js` - Superseded by simpler version
- ðŸ—‚ï¸ `find-duplicates-simple.js` - One-time diagnostic

#### Remove (Temporary/Obsolete)
- ðŸ—‘ï¸ All `check-*-extraction.js` files (one-time diagnostics)
- ðŸ—‘ï¸ All `fix-*-slug.js` files (one-time fixes)
- ðŸ—‘ï¸ All `investigate-*.js` files (temporary debugging)
- ðŸ—‘ï¸ All `test-*.js` files (development testing)

### 2. âœ… Documentation Organization
**Goal**: Consolidate and archive historical documentation

#### Keep (Current/Reference)
- âœ… `README.md` - Main project documentation
- âœ… `ADMIN_WORKFLOW.md` - Admin guide
- âœ… `EXTRACTION_TOOLKIT_SUMMARY.md` - Extraction guide
- âœ… `DATABASE_CLEANUP_2025_11_12.md` - Recent cleanup
- âœ… `GOA_NEIGHBORHOODS_REFERENCE.md` - Reference data
- âœ… `SLUG_GENERATION.md` - Technical reference

#### Archive (Historical)
- ðŸ—‚ï¸ All `DOCUMENTATION_UPDATE_SUMMARY_*.md` files
- ðŸ—‚ï¸ All `EXTRACTION_REPORT_*.md` files
- ðŸ—‚ï¸ All `SESSION_SUMMARY_*.md` files
- ðŸ—‚ï¸ All `*_IMPLEMENTATION_COMPLETE.md` files

### 3. âœ… CSV Files Cleanup
**Goal**: Archive processed CSV files

#### Keep (Reference)
- âœ… `tripadvisor-all-phases-google-place-ids.csv` - Source data

#### Archive
- ðŸ—‚ï¸ `tripadvisor-test-3-restaurants.csv` - Testing only
- ðŸ—‚ï¸ All other test CSVs

### 4. âœ… Background Processes
**Goal**: Clean up old background bash processes

#### Action Items
- ðŸ›‘ Kill all old extraction processes
- ðŸ›‘ Kill all old CSV generation processes

### 5. âœ… Git Repository Cleanup
**Goal**: Stage appropriate changes and commit

#### Files to Stage
- âœ… New documentation
- âœ… New cleanup scripts
- âœ… Updated CLAUDE.md

#### Files to Ignore
- ðŸš« Temporary JSON files
- ðŸš« Deletion logs
- ðŸš« Test CSVs

## Cleanup Actions

### Step 1: Create Archive Directories
```bash
mkdir -p bin/archive/diagnostics
mkdir -p bin/archive/fixes
mkdir -p bin/archive/obsolete
mkdir -p docs/archive/sessions
mkdir -p docs/archive/implementations
mkdir -p docs/csv/archive
```

### Step 2: Move Obsolete Scripts
```bash
# Diagnostic scripts (one-time use)
mv bin/check-*-extraction.js bin/archive/diagnostics/
mv bin/investigate-*.js bin/archive/diagnostics/
mv bin/diagnose-*.js bin/archive/diagnostics/
mv bin/test-*.js bin/archive/diagnostics/

# Fix scripts (one-time fixes)
mv bin/fix-*.js bin/archive/fixes/

# Obsolete extraction methods
mv bin/extract-tripadvisor-batch.js bin/archive/obsolete/
mv bin/create-tripadvisor-csv-with-place-ids.js bin/archive/obsolete/
mv bin/identify-incomplete-duplicates.js bin/archive/obsolete/
mv bin/find-duplicates-simple.js bin/archive/obsolete/
```

### Step 3: Archive Documentation
```bash
# Session summaries
mv docs/SESSION_SUMMARY_*.md docs/archive/sessions/
mv docs/DOCUMENTATION_UPDATE_SUMMARY_*.md docs/archive/sessions/

# Implementation reports
mv docs/*_IMPLEMENTATION_COMPLETE.md docs/archive/implementations/
mv docs/EXTRACTION_REPORT_*.md docs/archive/implementations/
```

### Step 4: Archive Test CSVs
```bash
mv docs/csv/tripadvisor-test-*.csv docs/csv/archive/
```

### Step 5: Kill Background Processes
```bash
# List all background processes
/bashes

# Kill obsolete extraction processes
# (Will be executed during cleanup)
```

### Step 6: Git Cleanup
```bash
# Add new documentation and cleanup files
git add docs/DATABASE_CLEANUP_2025_11_12.md
git add docs/PROJECT_CLEANUP_CHECKLIST.md
git add bin/find-incomplete-restaurants.js
git add bin/delete-incomplete-restaurants.js

# Ensure archives are in .gitignore
echo "bin/archive/" >> .gitignore
echo "docs/archive/" >> .gitignore
echo "docs/csv/archive/" >> .gitignore
echo "bin/deleted-*.json" >> .gitignore
echo "bin/incomplete-to-delete.json" >> .gitignore
echo "bin/duplicate-deletion-plan.json" >> .gitignore
```

## Benefits of Cleanup

### Code Organization
- âœ… Clear separation between active and archived scripts
- âœ… Easy to find relevant scripts
- âœ… Reduced clutter in bin/ directory

### Documentation
- âœ… Clear current documentation
- âœ… Historical context preserved
- âœ… Easier to find relevant guides

### Repository Health
- âœ… Smaller working directory
- âœ… Faster file searches
- âœ… Cleaner git status

### Maintenance
- âœ… Easier onboarding for new developers
- âœ… Clear project structure
- âœ… Better long-term maintainability

## Files to Keep Active

### Bin Scripts (Essential)
1. `extract-from-csv-direct.js` - CSV-based extraction
2. `find-incomplete-restaurants.js` - Database health check
3. `delete-incomplete-restaurants.js` - Cleanup utility
4. `check-enhancement-status.js` - Monitor AI enhancement
5. `batch-enhance-all.js` - Batch processing
6. `ai-enhance-only.js` - AI enhancement utility
7. `README_EXTRACTION_SCRIPTS.md` - Extraction guide

### Documentation (Essential)
1. `README.md` - Main project docs
2. `ADMIN_WORKFLOW.md` - Admin guide
3. `DATABASE_CLEANUP_2025_11_12.md` - Recent cleanup
4. `EXTRACTION_TOOLKIT_SUMMARY.md` - Extraction reference
5. `GOA_NEIGHBORHOODS_REFERENCE.md` - Neighborhood data
6. `SLUG_GENERATION.md` - Technical reference
7. `SOCIAL_MEDIA_SEARCH_OPTIMIZATION.md` - Social media guide

## Next Steps After Cleanup

1. âœ… Update CLAUDE.md with cleanup status
2. âœ… Create archive directory structure
3. âœ… Move files to appropriate locations
4. âœ… Update .gitignore
5. âœ… Kill background processes
6. âœ… Commit changes with proper message

## Status
ðŸ”„ **IN PROGRESS** - Cleanup checklist created, awaiting execution
