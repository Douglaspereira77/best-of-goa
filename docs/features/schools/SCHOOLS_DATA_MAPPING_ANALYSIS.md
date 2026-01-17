# Schools Data Mapping Analysis - BSK Example
**Analysis Date:** November 20, 2025
**Sample School:** The British School of Goa
**Purpose:** Field-by-field mapping for database population from Apify & Firecrawl

---

## Executive Summary

**Current Data Completeness: 41.36% (79/191 fields populated)**

### Data Sources Available:
- âœ… **Apify Google Places** - 69 fields extracted (comprehensive location, contact, images)
- âœ… **Firecrawl Website Scrape** - 36,382 chars markdown + 114,449 chars HTML (rich content for AI extraction)

### Key Findings:
1. **Apify is excellent for**: Core identity, location, contact, images, operational hours
2. **Firecrawl is excellent for**: Educational content, curriculum details, admission info, facilities descriptions
3. **Missing entirely**: Email, enrollment numbers, most financial data, staffing details
4. **AI Enhancement Required**: Descriptions, tuition extraction, SEO metadata, content generation

---

## Complete Field Mapping Table

| Field Name | Available? | Data Source | JSON Path | BSK Sample Value | Transformation | Notes |
|-----------|------------|-------------|-----------|------------------|----------------|-------|
| **CORE IDENTITY** |
| `id` | âœ… Auto | Database | N/A | `9c71ab1a-...` | UUID generation | System-generated |
| `slug` | âœ… Yes | Generated | N/A | `the-british-school-of-goa-salwa` | Slugify(name + area) | Already handled by orchestrator |
| `name` | âœ… Yes | Apify | `title` | "The British School of Goa" | Direct | Primary source |
| `name_ar` | âŒ No | N/A | N/A | NULL | Manual/AI | Needs translation service |
| **LOCATION** |
| `google_place_id` | âœ… Yes | Apify | `placeId` | "ChIJidqkww2ezz8..." | Direct | Critical for updates |
| `address` | âœ… Yes | Apify | `address` | "Building 214ØŒ Street 1ØŒ 13130, Goa" | Direct | Well-formatted |
| `area` | âœ… Yes | Apify | `neighborhood` | "Salwa" | Direct | Reliable |
| `neighborhood_id` | âŒ No | Lookup | N/A | NULL | Match to neighborhoods table | Requires neighborhood system |
| `governorate` | âš ï¸ Partial | Apify/Derive | `city` OR area lookup | NULL | Area â†’ Governorate mapping | Need Goa area mappings |
| `country_code` | âœ… Yes | Default | N/A | "KW" | Hardcode "KW" | Always Goa |
| `latitude` | âœ… Yes | Apify | `location.lat` | 29.301104 | Direct | Precise coordinates |
| `longitude` | âœ… Yes | Apify | `location.lng` | 48.0649273 | Direct | Precise coordinates |
| **CONTACT INFORMATION** |
| `phone` | âœ… Yes | Apify | `phone` | "+965 1830 456" | Format cleanup | May need standardization |
| `email` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Regex/AI extraction | Check website content |
| `website` | âœ… Yes | Apify | `website` | "http://www.bsk.edu.kw/..." | URL cleanup | Remove UTM parameters |
| **SOCIAL MEDIA** |
| `instagram` | âœ… Yes | Service | Social search | "https://instagram.com/bsk.edu.kw" | Already populated | Working well |
| `facebook` | âœ… Yes | Service | Social search | "https://facebook.com/bsk.edu.kw" | Already populated | Working well |
| `twitter` | âŒ No | Service | Social search | NULL | Social search missed | May not exist |
| `tiktok` | âŒ No | Service | Social search | NULL | Social search missed | May not exist |
| `youtube` | âŒ No | Service | Social search | NULL | Social search missed | Check Firecrawl for links |
| `linkedin` | âŒ No | Service | Social search | NULL | Social search missed | Check Firecrawl for links |
| `snapchat` | âŒ No | Firecrawl/Manual | N/A | NULL | Extract from website | Uncommon for schools |
| `whatsapp` | âŒ No | Firecrawl/Manual | N/A | NULL | Extract from website | Could be in contact section |
| **SCHOOL CLASSIFICATION** |
| `school_type` | âœ… Yes | Apify/AI | `categoryName` + detection | "international" | Category â†’ type mapping | Currently working |
| `curriculum` | âœ… Yes | AI Detection | Firecrawl markdown | ["british","american","ib","national"] | Keyword detection | May be over-detecting |
| `grade_levels` | âš ï¸ Partial | AI Detection | Firecrawl markdown | ["high"] | Keyword detection | INCOMPLETE - only detected "high" |
| `min_grade` | âŒ No | AI Detection | Firecrawl markdown | NULL | Extract from "KG1 to Grade 12" | Need better AI prompt |
| `max_grade` | âš ï¸ Yes | AI Detection | Firecrawl markdown | "grade12" | Extract from content | Working |
| `year_established` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Regex: "founded/established YYYY" | Check About Us section |
| **ACCREDITATIONS & AFFILIATIONS** |
| `accreditations` | âš ï¸ Partial | AI Detection | Firecrawl markdown | ["bsme"] | Keyword detection | Likely incomplete |
| `affiliations` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Extract from About/Accreditations | Check website |
| `licenses` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | MOE license numbers | Rare on websites |
| **ENROLLMENT INFORMATION** |
| `student_capacity` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Extract numbers | Rare on websites |
| `current_enrollment` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Extract numbers | Rare on websites |
| `average_class_size` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Extract numbers | Might be in marketing content |
| `student_teacher_ratio` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Parse "15:1" format | Might be in marketing content |
| `enrollment_age_range` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Parse "3-18 years" | Derive from grade levels |
| `acceptance_rate` | âŒ No | N/A | N/A | NULL | Rarely published | Unlikely to find |
| **FINANCIAL INFORMATION** |
| `tuition_range_min` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | **CRITICAL** - AI extraction | Check Fees/Admissions pages |
| `tuition_range_max` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | **CRITICAL** - AI extraction | Check Fees/Admissions pages |
| `currency` | âœ… Yes | Default | N/A | "KWD" | Hardcode "KWD" | Always KWD in Goa |
| `registration_fee` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | AI extraction | Check Fees page |
| `application_fee` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | AI extraction | Check Fees page |
| `book_fee` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | AI extraction | Check Fees page |
| `uniform_fee` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | AI extraction | Check Fees page |
| `transportation_fee` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | AI extraction | Check Fees page |
| `accepts_scholarships` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `scholarship_info` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Text extraction | Check Financial Aid section |
| `payment_plans_available` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `sibling_discount` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| **ACADEMIC CALENDAR & SCHEDULE** |
| `academic_calendar` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Parse "August-June" | Check Calendar section |
| `school_hours_start` | âš ï¸ Yes | Apify | `openingHours[0].hours` | NULL | Parse "7:30 AM" â†’ TIME | **Available in Apify!** |
| `school_hours_end` | âš ï¸ Yes | Apify | `openingHours[0].hours` | NULL | Parse "2 PM" â†’ TIME | **Available in Apify!** |
| `school_days` | âš ï¸ Yes | Apify | `openingHours[]` | NULL | Map days excluding "Closed" | **Available in Apify!** |
| `half_day_schedule` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Text extraction | Check for "half-day" mentions |
| `extended_day_available` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| **ADMISSION PROCESS** |
| `admission_requirements` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | **IMPORTANT** - Text extraction | Check Admissions page |
| `application_deadline` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Date extraction | Check Admissions page |
| `admission_age_cutoff` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Text extraction | e.g., "4 years by Sept 1" |
| `entrance_exam_required` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `interview_required` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `previous_school_records_required` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `waiting_list_available` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `application_process` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | **IMPORTANT** - Text extraction | Check Admissions page |
| **CAMPUS & FACILITIES (Boolean)** |
| `has_swimming_pool` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - may exist |
| `has_sports_facilities` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - likely exists |
| `has_library` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - likely exists |
| `has_cafeteria` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - likely exists |
| `has_medical_room` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - likely exists |
| `has_science_labs` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - likely exists |
| `has_computer_labs` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - likely exists |
| `has_arts_facilities` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - may exist |
| `has_music_room` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - may exist |
| `has_theater` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - may exist |
| `has_playground` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - likely exists |
| `has_gym` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - likely exists |
| `has_prayer_room` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - likely exists |
| `air_conditioned` | âœ… Yes | Default | N/A | true | Boolean default | Assume true in Goa |
| `transportation_available` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - check website |
| `parking_available` | âš ï¸ No | AI Detection | Firecrawl markdown | false | Keyword detection | **NOT DETECTING** - assume true |
| **FACILITIES (Details)** |
| `campus_size` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Extract "X acres/sqm" | Check About Campus section |
| `number_of_buildings` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Extract numbers | Check Facilities section |
| `security_features` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Array extraction | Check Safety/Security section |
| **ACADEMIC PROGRAMS** |
| `special_programs` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Array extraction | Check Programs/Academics |
| `advanced_placement` | âœ… Yes | Default | N/A | false | Boolean default | Linked to curriculum |
| `honors_programs` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `dual_enrollment` | âœ… Yes | Default | N/A | false | Boolean default | Rare in Goa |
| `online_learning_available` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `special_education_services` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `gifted_talented_program` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `esl_ell_support` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| **EXTRACURRICULAR ACTIVITIES** |
| `extracurricular_activities` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Array extraction | Check Activities section |
| `sports_offered` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Array extraction | Check Sports section |
| `clubs_offered` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Array extraction | Check Clubs section |
| `arts_programs` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Array extraction | Check Arts section |
| `music_programs` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Array extraction | Check Music section |
| **LANGUAGES** |
| `primary_language` | âœ… Yes | Default | N/A | "english" | Default "english" | Based on curriculum |
| `languages_taught` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Array extraction | Check Curriculum/Languages |
| `bilingual_program` | âœ… Yes | Default | N/A | false | Boolean default | Based on curriculum detection |
| **STAFFING** |
| `total_staff` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Extract numbers | Rarely published |
| `total_teachers` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Extract numbers | Rarely published |
| `qualified_teachers_percentage` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Parse percentage | Marketing content |
| `teacher_student_ratio` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Parse "1:15" format | Marketing content |
| `native_english_teachers` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `teacher_turnover_rate` | âŒ No | N/A | N/A | NULL | Never published | Unavailable |
| `average_teacher_experience` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Extract numbers | Rarely published |
| **GENDER & DIVERSITY** |
| `gender_policy` | âœ… Yes | AI Detection | Firecrawl markdown | "coed" | Keyword detection | Working |
| `nationality_mix` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Array extraction | Might be in marketing |
| `international_students_percentage` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Parse percentage | Rarely published |
| **TECHNOLOGY INTEGRATION** |
| `technology_integration` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Classify basic/moderate/advanced | Check Technology section |
| `laptops_provided` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `ipads_provided` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `smartboards` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `learning_management_system` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Text extraction | Check Technology/Portal info |
| **PARENT ENGAGEMENT** |
| `parent_teacher_association` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `parent_portal_available` | âœ… Yes | Default | N/A | false | Boolean default | Assume false unless stated |
| `parent_communication_frequency` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Text extraction | Check Parent Engagement |
| **RATINGS & REVIEWS** |
| `google_rating` | âš ï¸ No | Apify | `totalScore` | NULL | Direct | **BSK has 0 reviews** |
| `google_review_count` | âœ… Yes | Apify | `reviewsCount` | 1 | Direct | Available |
| `tripadvisor_rating` | âŒ No | N/A | N/A | NULL | Not applicable | Schools rarely on TripAdvisor |
| `tripadvisor_review_count` | âŒ No | N/A | N/A | NULL | Not applicable | Schools rarely on TripAdvisor |
| `parent_rating` | âŒ No | Future | N/A | NULL | User-submitted | Future feature |
| `parent_review_count` | âŒ No | Future | N/A | NULL | User-submitted | Future feature |
| `academic_rating` | âŒ No | Future | N/A | NULL | Calculated | Future feature |
| `facility_rating` | âŒ No | Future | N/A | NULL | Calculated | Future feature |
| `staff_rating` | âŒ No | Future | N/A | NULL | Calculated | Future feature |
| `value_rating` | âŒ No | Future | N/A | NULL | Calculated | Future feature |
| `total_reviews_aggregated` | âœ… Yes | Apify | `reviewsCount` | 1 | Sum all sources | Available |
| **BOK SCORE SYSTEM** |
| `bok_score` | âŒ No | Calculated | N/A | NULL | Algorithm | Needs development |
| `bok_score_breakdown` | âŒ No | Calculated | N/A | NULL | JSONB | Needs development |
| `bok_score_calculated_at` | âŒ No | Calculated | N/A | NULL | Timestamp | Needs development |
| `bok_score_version` | âœ… Yes | Default | N/A | "v1.0" | Hardcode | Version tracking |
| **CONTENT & DESCRIPTIONS** |
| `description` | âŒ No | Firecrawl/AI | Generate from markdown | NULL | **CRITICAL** - AI generation | Use Firecrawl + metadata |
| `description_ar` | âŒ No | AI Translation | Translate from description | NULL | Translation service | After English description |
| `short_description` | âŒ No | AI Generation | Generate from description | NULL | **CRITICAL** - AI generation | 150 char summary |
| `mission_statement` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Text extraction | Check About/Mission pages |
| `vision_statement` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Text extraction | Check About/Vision pages |
| `principal_name` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Text extraction | Check About/Leadership |
| `principal_message` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Text extraction | Check Principal's Message |
| `educational_philosophy` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Text extraction | Check Approach/Philosophy |
| `unique_selling_points` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | Array generation | AI-identified USPs |
| **SENTIMENT ANALYSIS** |
| `review_sentiment` | âŒ No | AI Analysis | Analyze reviews | NULL | Classify positive/neutral/negative | After review extraction |
| `review_sentiment_score` | âŒ No | AI Analysis | Calculate from reviews | NULL | 0-100 score | After review extraction |
| `review_sentiment_updated_at` | âŒ No | Timestamp | N/A | NULL | Timestamp | When analyzed |
| `common_praise` | âŒ No | AI Analysis | Extract from reviews | NULL | Array extraction | After review analysis |
| `common_complaints` | âŒ No | AI Analysis | Extract from reviews | NULL | Array extraction | After review analysis |
| **MEDIA & ASSETS** |
| `hero_image` | âŒ No | Vision AI | Select from images | NULL | **CRITICAL** - Image processing | Apify has 54 images! |
| `logo_image` | âŒ No | Vision AI | Detect logo | NULL | Image processing | Check images or extract from website |
| `gallery_images` | âŒ No | Vision AI | Process all images | NULL | **CRITICAL** - Image processing | Apify has 54 images! |
| `video_tour_url` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | URL extraction | Check Virtual Tour section |
| `virtual_tour_url` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | URL extraction | Check Virtual Tour section |
| `prospectus_url` | âŒ No | Firecrawl/AI | Extract from markdown | NULL | URL extraction | Check Downloads/Resources |
| **SEO & METADATA** |
| `meta_title` | âŒ No | AI Generation | Generate | NULL | **CRITICAL** - AI generation | 50-60 chars with location |
| `meta_description` | âŒ No | AI Generation | Generate | NULL | **CRITICAL** - AI generation | 150-160 chars |
| `meta_keywords` | âŒ No | AI Generation | Generate | NULL | Array generation | Curriculum, area, type keywords |
| `og_title` | âŒ No | AI Generation | Use meta_title | NULL | AI generation | Copy from meta_title |
| `og_description` | âŒ No | AI Generation | Use meta_description | NULL | AI generation | Copy from meta_description |
| `og_image` | âŒ No | Use hero_image | Use hero_image | NULL | URL copy | Copy from hero_image |
| `canonical_url` | âŒ No | Generated | N/A | NULL | Generate from slug | bestofgoa.com/places-to-learn/schools/{slug} |
| **CATEGORY RELATIONSHIPS** |
| `school_category_ids` | âœ… Yes | Matched | Categories table | ["uuid1", "uuid2"...] | Already matched | Working well |
| `school_feature_ids` | âŒ No | Matching | Features table | NULL | Match based on facilities | Needs implementation |
| **EXTRACTION METADATA** |
| `extraction_status` | âœ… Yes | Orchestrator | N/A | "completed" | Status tracking | System-managed |
| `extraction_progress` | âœ… Yes | Orchestrator | N/A | JSONB object | Step tracking | System-managed |
| `extraction_started_at` | âœ… Yes | Orchestrator | N/A | Timestamp | Timestamp | System-managed |
| `extraction_completed_at` | âœ… Yes | Orchestrator | N/A | Timestamp | Timestamp | System-managed |
| `extraction_error` | âœ… Yes | Orchestrator | N/A | NULL | Error messages | System-managed |
| `apify_output` | âœ… Yes | Apify | N/A | JSONB (69 keys) | Raw storage | System-managed |
| `firecrawl_output` | âœ… Yes | Firecrawl | N/A | JSONB (3 keys) | Raw storage | System-managed |
| `extraction_source` | âŒ No | Orchestrator | N/A | NULL | Set to "google_places" | System-managed |
| `extraction_job_id` | âŒ No | Orchestrator | N/A | NULL | Job tracking | Optional |
| `last_extraction_attempt` | âŒ No | Orchestrator | N/A | NULL | Timestamp | System-managed |
| `extraction_retry_count` | âœ… Yes | Orchestrator | N/A | 0 | Counter | System-managed |

---

## Data Quality Assessment

### âœ… HIGH QUALITY DATA (Direct Mapping from Apify)
These fields have excellent data and can be populated immediately:
- Core identity (name, slug)
- Location (address, coordinates, area)
- Contact (phone, website)
- Google ratings (when available)
- Images (54 available for BSK!)
- Opening hours (**IMPORTANT**: Not currently being extracted to school_hours fields)
- Categories

### âš ï¸ MEDIUM QUALITY DATA (Available but Needs Processing)
These fields exist in Firecrawl data but require AI extraction:
- Email address (in website contact page)
- Curriculum details (currently over-detecting)
- Grade levels (under-detecting - only found "high")
- Facilities (36KB of markdown content likely mentions these)
- Admission requirements
- Tuition information (critical but complex to extract)
- Mission/vision statements
- Educational programs

### âŒ MISSING DATA (Not Available from Current Sources)
These fields cannot be populated from Apify or Firecrawl:
- Enrollment numbers (student capacity, current enrollment)
- Staffing details (rarely public)
- Internal policies (acceptance rate, teacher turnover)
- User-generated content (parent reviews, ratings)
- BOK proprietary data (BOK score, sentiment analysis)

---

## Critical Gaps & Issues

### ðŸš¨ PRIORITY 1: Image Processing Not Running
**Issue:** BSK has 54 images in Apify data, but `hero_image` and `gallery_images` are NULL
**Impact:** No visual content on school pages
**Fix:** Enable Step 10 in orchestrator (currently disabled?)
**Urgency:** HIGH - Critical for launch

### ðŸš¨ PRIORITY 2: Opening Hours Not Mapped
**Issue:** Apify has perfect opening hours data:
```json
{
  "day": "Monday",
  "hours": "7:30 AM to 2 PM"
}
```
But `school_hours_start`, `school_hours_end`, `school_days` are NULL
**Impact:** Missing operational information
**Fix:** Parse Apify `openingHours` array
**Urgency:** HIGH - Easy win

### ðŸš¨ PRIORITY 3: Facilities Detection Failing
**Issue:** All facility booleans are `false` despite 36KB markdown likely containing facility mentions
**Impact:** Missing key differentiators
**Fix:** Improve regex patterns or use AI extraction
**Urgency:** HIGH - Important for comparisons

### âš ï¸ PRIORITY 4: Content Generation Disabled
**Issue:** `description`, `short_description`, SEO metadata all NULL
**Impact:** No public-facing content ready
**Fix:** Enable AI enhancement (Step 11) with OpenAI
**Urgency:** HIGH - Blocks publishing

### âš ï¸ PRIORITY 5: Tuition Information Missing
**Issue:** Most valuable data for parents - completely missing
**Impact:** Reduced directory value
**Fix:** Complex AI extraction from Firecrawl markdown
**Urgency:** MEDIUM - Important but difficult

### âš ï¸ PRIORITY 6: Grade Levels Incomplete
**Issue:** Only detected "high school" but BSK has Elementary + Middle + High
**Impact:** Wrong filtering in directory
**Fix:** Improve AI detection or use Apify categories array
**Urgency:** MEDIUM - Affects search accuracy

### â„¹ï¸ PRIORITY 7: Social Media Incomplete
**Issue:** Only Instagram and Facebook found, but YouTube/LinkedIn likely exist
**Impact:** Missing engagement channels
**Fix:** Check Firecrawl markdown for embedded links
**Urgency:** LOW - Nice to have

---

## Recommended Strategy

### Phase 1: Quick Wins (Immediate)
1. âœ… **Enable opening hours parsing** from Apify data
2. âœ… **Enable image processing** (Step 10) - 54 images waiting
3. âœ… **Improve grade level detection** - use Apify `categories` array ("Elementary school", "High school")
4. âœ… **Set extraction_source** to "google_places"

### Phase 2: AI Enhancement (Week 1)
1. âœ… **Enable OpenAI Step 11** for content generation
   - Description (200-300 words)
   - Short description (150 chars)
   - Meta title (50-60 chars)
   - Meta description (150-160 chars)
2. âœ… **Improve facilities detection** with better AI prompts
3. âœ… **Extract mission/vision** statements from Firecrawl

### Phase 3: Complex Extraction (Week 2)
1. âš ï¸ **Tuition extraction** - complex AI task
2. âš ï¸ **Admission requirements extraction**
3. âš ï¸ **Programs and activities extraction**
4. âš ï¸ **Email extraction** from contact pages

### Phase 4: Manual/Future (Ongoing)
1. âŒ **Neighborhood mapping** - requires Goa geography data
2. âŒ **Governorate derivation** - from area lookup table
3. âŒ **Feature matching** - map facilities to school_features table
4. âŒ **BOK Score algorithm** - proprietary scoring system
5. âŒ **User review system** - future feature

---

## Data Source Comparison

### Primary Source: **APIFY** âœ…
**Strengths:**
- 100% reliable for core identity and location
- Perfect coordinates
- Excellent contact information
- Rich image data (54 images for BSK)
- Structured opening hours
- Category classifications

**Weaknesses:**
- No descriptive content (description is NULL)
- No educational details
- No reviews for BSK (0 reviews)
- No pricing information

**Recommendation:** Use as primary for all location, contact, and image data

### Secondary Source: **FIRECRAWL** âœ…
**Strengths:**
- 36,382 characters of markdown content
- 114,449 characters of HTML
- Rich educational content
- Facilities descriptions
- Admissions information
- Programs and curriculum details
- Metadata includes title and description

**Weaknesses:**
- Unstructured text requires AI processing
- Quality varies by website design
- May be incomplete if website is basic

**Recommendation:** Use as primary for all content, curriculum, facilities, and admissions data

### Should We Merge Both? **YES** âœ…

**Recommended Approach:**
1. **Apify First** - Populate core fields (identity, location, contact, images)
2. **Firecrawl Second** - Extract educational content and details
3. **AI Enhancement Third** - Generate descriptions and SEO metadata
4. **Validation Last** - Review and approve before publishing

---

## Field Priority Matrix

### Tier 1: MUST HAVE (Blocks Publishing)
- âœ… Name, slug, address, coordinates â† Already have
- âŒ Description (200+ words)
- âŒ Short description (150 chars)
- âŒ Hero image
- âŒ Meta title, meta description
- âœ… Curriculum, school type â† Already have
- âŒ Gallery images (at least 3-5)

### Tier 2: SHOULD HAVE (Enhances Value)
- âŒ Tuition range
- âŒ Facilities (library, labs, sports, etc.)
- âœ… Contact (phone, website) â† Already have
- âœ… Social media (Instagram, Facebook) â† Already have
- âŒ Opening hours (start/end times)
- âŒ Grade levels (complete range)
- âŒ Mission statement

### Tier 3: NICE TO HAVE (Differentiators)
- âŒ Admission requirements
- âŒ Application process
- âŒ Extracurricular activities
- âŒ Special programs
- âŒ Principal name and message
- âŒ Virtual tour URL
- âŒ Email address

### Tier 4: FUTURE FEATURES
- âŒ Enrollment numbers
- âŒ Staffing details
- âŒ BOK Score
- âŒ Parent reviews
- âŒ Sentiment analysis
- âŒ Academic ratings

---

## Discussion Points for Douglas

### 1. Primary Data Source Decision
**Question:** Should we prioritize Apify or Firecrawl as "source of truth"?
**Recommendation:** Apify for structured data (location, contact), Firecrawl for content (descriptions, curriculum)
**Your preference?** _____________________

### 2. Opening Hours - Quick Win?
**Current State:** Apify has perfect opening hours data but we're not using it
**Effort:** LOW - Simple parsing from `openingHours` array
**Impact:** HIGH - Immediately adds operational info
**Should we implement this first?** YES / NO

### 3. Image Processing - Critical Gap?
**Current State:** 54 images available but not processed (hero_image NULL)
**Effort:** MEDIUM - Enable Step 10, already coded
**Impact:** CRITICAL - No school pages without images
**Block everything until this works?** YES / NO

### 4. Facilities Detection - AI vs Keyword?
**Current State:** All facility booleans are false (likely wrong)
**Option A:** Improve keyword regex patterns (fast, limited accuracy)
**Option B:** Use GPT-4 to analyze Firecrawl markdown (slow, high accuracy)
**Your preference?** A / B / Both

### 5. Tuition Information - Priority Level?
**Current State:** Completely missing from all schools
**Difficulty:** HIGH - Complex extraction, inconsistent formats
**Value:** VERY HIGH - Most requested data by parents
**Should this block launch?** YES / NO
**If no, add post-launch?** YES / NO

### 6. Content Generation - When to Enable?
**Current State:** AI enhancement (Step 11) disabled, no descriptions
**Blocker:** OpenAI API configuration
**Impact:** Cannot publish without descriptions and SEO metadata
**When should we enable this?** Before any schools launch / After manual review setup

### 7. Grade Levels - Trust AI or Manual?
**Current State:** Only detected "high" but BSK clearly has Elementary + Middle + High
**Issue:** AI detection is incomplete
**Solution A:** Improve AI with better prompts
**Solution B:** Manual entry during review
**Solution C:** Use Apify `categories` array ("Elementary school", "High school")
**Your preference?** A / B / C

### 8. Data Completeness Threshold
**Current State:** BSK is 41.36% complete (79/191 fields)
**Question:** What's the minimum completeness to publish a school?
**Suggested Tiers:**
- Bronze: 50% complete (basic info)
- Silver: 70% complete (good info)
- Gold: 85% complete (comprehensive)
**Your threshold for launch?** _____%

### 9. Missing Email - How Critical?
**Current State:** Email is NULL but likely on website contact page
**Effort:** MEDIUM - AI extraction from Firecrawl
**Value:** MEDIUM - Nice to have, not critical
**Should we extract this?** YES / NO / POST-LAUNCH

### 10. Merge Strategy - Sequential or Parallel?
**Option A - Sequential:**
1. Apify extraction completes
2. Then Firecrawl scrapes
3. Then AI processes
4. Then images process

**Option B - Parallel:**
1. Apify + Firecrawl run simultaneously
2. AI + images process together after both complete

**Your preference?** SEQUENTIAL / PARALLEL

---

## Next Steps Checklist

Based on this analysis, here's what needs to happen:

### Immediate (Before Any More Schools)
- [ ] Fix image processing (enable Step 10)
- [ ] Parse opening hours from Apify data
- [ ] Improve grade level detection using Apify categories
- [ ] Test BSK extraction again with fixes

### This Week (Before Launch)
- [ ] Enable AI content generation (Step 11)
- [ ] Improve facilities detection
- [ ] Create school review UI for manual corrections
- [ ] Test full pipeline on 5-10 schools

### Next Week (Pre-Launch Polish)
- [ ] Implement tuition extraction
- [ ] Add email extraction
- [ ] Extract mission/vision statements
- [ ] Build feature matching logic

### Post-Launch
- [ ] Create neighborhood lookup system
- [ ] Build governorate derivation
- [ ] Develop BOK Score algorithm
- [ ] Add parent review features

---

## Sample Data Validation Checklist

For each new school extraction, validate:

**From Apify:**
- âœ… Name extracted correctly
- âœ… Address is Goa address
- âœ… Phone number in Goa format (+965)
- âœ… Coordinates are in Goa (29Â°N, 47-48Â°E)
- âœ… Website URL is valid and loads
- âœ… Images array has at least 5 images

**From Firecrawl:**
- âœ… Markdown length > 5,000 chars (substantial content)
- âœ… Success flag is true
- âœ… Website actually scraped (not blocked/error page)
- âœ… Content mentions school name
- âœ… Content includes curriculum or education keywords

**After AI Processing:**
- âœ… Description is 200-300 words
- âœ… Short description is 100-150 chars
- âœ… Meta title is 50-60 chars
- âœ… Meta description is 150-160 chars
- âœ… At least 1 curriculum detected
- âœ… At least 1 grade level detected
- âœ… Gender policy set (not NULL)

**After Image Processing:**
- âœ… Hero image is set
- âœ… Gallery has 3-10 images
- âœ… Logo image extracted (if exists)
- âœ… All image URLs are valid

---

**End of Analysis**
*Ready for discussion with Douglas*
