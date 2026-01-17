# Best of Goa: Extraction Status Tracking System Analysis

## Overview
This document details the complete extraction status tracking system, including tables, API endpoints, polling mechanisms, and how the system determines when extraction is complete.

---

## 1. PRIMARY STATUS TRACKING TABLE

### Table: restaurants
**Location**: Supabase PostgreSQL Database
**Key Fields for Extraction Tracking**:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `status` | VARCHAR | Current status: importing, processing, active, failed |
| `job_progress` | JSONB | Hierarchical progress tracking for all extraction steps |
| `error_logs` | JSONB[] | Array of error objects with timestamps |
| `import_started_at` | TIMESTAMP | When extraction began |
| `import_completed_at` | TIMESTAMP | When extraction finished |
| `updated_at` | TIMESTAMP | Last modification timestamp |

**Critical Field: job_progress (JSONB)**
Contains nested objects for each extraction step with status and timestamps.

---

## 2. API ENDPOINTS

### A. Start Extraction Endpoint
**Endpoint**: POST /api/admin/start-extraction
**File**: src/app/api/admin/start-extraction/route.ts
**Purpose**: Creates restaurant record and triggers background extraction

**Key Details**:
- Creates restaurant record immediately with status: importing
- Initializes job_progress with initial_creation step marked as completed
- Triggers extractionOrchestrator.executeExtraction() asynchronously
- Returns restaurant_id for frontend polling

### B. Extraction Status Polling Endpoint
**Endpoint**: GET /api/admin/extraction-status/[jobId]
**File**: src/app/api/admin/extraction-status/[jobId]/route.ts
**Purpose**: Returns current extraction progress and extracted data
**Frontend Polling**: Every 2 seconds

**Response Contains**:
- Current status (pending, in_progress, completed, failed)
- Progress percentage
- Array of step statuses with timestamps
- Extracted data (full data only on completion to save bandwidth)

---

## 3. EXTRACTION PIPELINE STEPS (11 Total)

1. apify_fetch - Google Places details (CRITICAL - stops pipeline if fails)
2. firecrawl_general - General restaurant info search
3. firecrawl_menu - Menu-specific search
4. firecrawl_website - Restaurant website scraping
5. firecrawl_social_media_search - Multi-platform social media search
6. apify_reviews - Extract 50 most recent reviews
7. firecrawl_tripadvisor - TripAdvisor data
8. firecrawl_opentable - OpenTable data
9. process_images - Image extraction & validation (with cost tracking)
10. ai_sentiment - Review sentiment analysis
11. ai_enhancement - GPT-4o content generation
12. data_mapping - Map to reference tables (cuisines, features, neighborhoods)

---

## 4. EXTRACTION COMPLETION LOGIC

### Frontend Determination:
- Polling stops when status === completed or status === failed
- Max polling duration: 10 minutes
- Frontend location: src/app/admin/add/page.tsx

### Backend Determination:
- Status updated to active when all steps complete successfully
- import_completed_at timestamp recorded
- Status set to failed if any critical step fails

### Completion Detection:
```
Completed = (all 11 steps have status === completed)
Failed = (any step has status === failed)
In Progress = (at least one step running)
```

---

## 5. ERROR TRACKING

### Error Storage
- **Field**: restaurants.error_logs (JSONB array)
- **Structure**: Each entry has timestamp, message, and stack trace

### Step-Level Error Handling
- Critical steps (apify_fetch): Pipeline stops on failure
- Other steps: Failed status recorded but pipeline continues
- Error message stored in job_progress[stepName].error

---

## 6. RELATED DATABASE TABLES

| Table | Purpose |
|-------|---------|
| restaurants | Main restaurant record |
| restaurants_images | Extracted images |
| restaurants_dishes | Menu items with popularity scores |
| restaurants_faqs | Frequently asked questions |
| restaurant_reviews | Individual customer reviews |
| restaurants_cuisines | Cuisine reference |
| restaurants_categories | Category reference |
| restaurants_features | Feature tags reference |
| restaurants_meals | Meal type reference |
| restaurants_good_for | Good for tags reference |
| restaurant_neighborhoods | Neighborhood mapping |
| michelin_guide_awards | Michelin star awards |

---

## 7. EXTRACTION DATA STORAGE

### Raw Extraction Data (JSONB columns):
- apify_output - Apify API response
- firecrawl_output - Firecrawl API response
- firecrawl_menu_output - Firecrawl menu search
- menu_data - Processed menu
- ai_enhancement_output - GPT-4o output

### Normalized Data (Direct columns):
- Location: address, area, latitude, longitude, postal_code
- Contact: phone, email, website, instagram, facebook, twitter
- Ratings: google_rating, google_review_count, overall_rating
- Operations: hours, dress_code, reservations_policy, parking_info, payment_methods
- Generated Content: description, meta_title, meta_description

---

## 8. BEASTRO EXTRACTION ISSUES

### Common Issues:

1. **Duplicate Detection**: May be detected as existing if previously attempted
2. **Image Extraction**: May have limited images; timeout/budget risks
3. **Menu Extraction**: No dedicated menu URL; firecrawl_menu step fails (non-critical)
4. **Social Media Search**: May not find all platforms
5. **Review Sentiment**: Skip if insufficient reviews

### Diagnostic Queries:

Check extraction status:
```sql
SELECT id, name, status, job_progress, error_logs, import_started_at, import_completed_at
FROM restaurants 
WHERE name = 'Beastro'
ORDER BY created_at DESC;
```

Check specific step failures:
```sql
SELECT 
  job_progress->'apify_fetch'->>'error' as apify_error,
  job_progress->'process_images'->>'error' as image_error,
  job_progress->'ai_enhancement'->>'error' as ai_error
FROM restaurants 
WHERE name = 'Beastro';
```

---

## 9. FRONTEND POLLING FLOW

1. User clicks Run â†’ handleRunExtraction()
2. POST /api/admin/start-extraction returns restaurant_id
3. startPolling(restaurant_id) begins polling every 2 seconds
4. Each poll gets latest status and extracted data
5. UI updates with step progress and extracted content
6. Polling stops when status = completed or failed
7. Shows final data or error messages

### Step Display Mapping:
- apify_fetch, apify_reviews â†’ "Apify Fetch"
- All firecrawl steps â†’ "Firecrawl Fetch"
- Image steps â†’ "Processing Images"
- AI steps â†’ "Generating Content"
- data_mapping â†’ "Uploading to Database"

---

## 10. PERFORMANCE OPTIMIZATIONS

### Database Optimizations:
- Parallel queries: 70%+ speed improvement
- Lightweight polling response: ~80% payload reduction during active polling
- Job progress as single JSONB column (no separate table needed)

### Extraction Optimizations:
- Critical path: apify_fetch blocks on failure; others are non-critical
- Parallel relationship resolution for cuisines, categories, features
- Image progress only updates metrics (not status) to prevent race conditions

---

## SUMMARY

**Extraction Status Tracking Uses**:
- **Primary Table**: restaurants.job_progress (JSONB)
- **Status Field**: restaurants.status (importing/processing/active/failed)
- **Error Logging**: restaurants.error_logs (JSONB array)
- **Polling Endpoint**: GET /api/admin/extraction-status/[restaurantId]
- **Frontend Polling**: Every 2 seconds, max 10 minutes
- **Completion Detection**: All 11 steps completed or any critical step failed
- **Related Data**: restaurants_dishes, restaurants_images, restaurants_faqs

For Beastro extraction issues, check the error_logs and individual step statuses in job_progress JSONB structure.

