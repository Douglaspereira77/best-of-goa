# Schools Detail Page - Design & Implementation Discussion

**Date:** November 21, 2025
**Author:** Claude Code
**For:** Douglas, Best of Goa Project

---

## Executive Summary

This document provides a comprehensive analysis of the existing schools detail page at `/places-to-learn/schools/[slug]/page.tsx` and compares it with the attractions detail page to identify opportunities for enhancement, reusability, and schools-specific improvements.

**Key Finding:** The current schools detail page already exists and follows the attractions pattern closely. However, there are significant opportunities to enhance it with schools-specific features and improve component reusability across both verticals.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Schema Comparison: Schools vs Attractions](#schema-comparison)
3. [Component Architecture Review](#component-architecture-review)
4. [Gap Analysis: What's Missing](#gap-analysis)
5. [Enhancement Recommendations](#enhancement-recommendations)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Component Specifications](#component-specifications)
8. [UI/UX Mockups (Text Format)](#ui-ux-mockups)

---

## 1. Current State Analysis

### Current Schools Detail Page Structure

**Location:** `src/app/places-to-learn/schools/[slug]/page.tsx`

**Existing Sections:**
```
âœ… JSON-LD Schema (EducationalOrganization)
âœ… Hero Section
   - Background image with overlay
   - Logo display (80x80)
   - School name + Arabic name
   - Badges (school type, curriculum)
   - Location + Rating
   - Short description
âœ… Main Content (2-column layout)
   - Left Column:
     â€¢ About section
     â€¢ Academic Information grid
     â€¢ Facilities & Features grid
   - Right Column:
     â€¢ Tuition Information (highlighted card)
     â€¢ Contact Information
     â€¢ Social Media links
     â€¢ Office Hours
```

**Color Theme:** Purple-to-blue gradient (distinguishes from attractions' blue-to-purple)

### Attractions Detail Page Structure

**Location:** `src/app/places-to-visit/attractions/[slug]/page.tsx`

**Sections:**
```
âœ… JSON-LD Schema (TouristAttraction)
âœ… Hero Section
   - Background image with overlay
   - Name + breadcrumbs
   - Type badge, location, rating
   - Short description
âœ… Main Content (2-column layout)
   - Left Column:
     â€¢ About section
     â€¢ Image Gallery (grid of attraction images)
     â€¢ Visitor Reviews (from Google)
     â€¢ Visitor Information (duration, admission, etc.)
     â€¢ FAQs section
   - Right Column:
     â€¢ Contact Information
     â€¢ Social Media links
     â€¢ Opening Hours
     â€¢ Best Time to Visit
```

**Color Theme:** Blue-to-purple gradient

---

## 2. Schema Comparison: Schools vs Attractions

### Field Mapping Analysis

| Category | Schools Fields | Attractions Fields | Reusability |
|----------|---------------|-------------------|-------------|
| **Core Identity** | slug, name, name_ar | slug, name | âœ… 100% |
| **Location** | address, area, governorate, lat/lng | address, area, lat/lng | âœ… 100% |
| **Contact** | phone, email, website | phone, email, website | âœ… 100% |
| **Social Media** | instagram, facebook, tiktok, youtube, linkedin, snapchat, whatsapp | instagram, facebook, tiktok | âœ… 100% (schools have more) |
| **Ratings** | google_rating, parent_rating, google_review_count | google_rating, google_review_count | âœ… 95% |
| **Media** | hero_image, logo_image, gallery_images, video_tour_url, virtual_tour_url | hero_image, images (separate table) | âš ï¸ 70% (different structure) |
| **SEO** | meta_title, meta_description, og_title, og_description | meta_title, meta_description, og_title, og_description | âœ… 100% |
| **Categories** | school_category_ids, school_feature_ids | attraction_category_ids | âœ… 100% |

### Schools-Specific Fields (No Attraction Equivalent)

**Academic:**
- `curriculum[]` - British, American, IB, National, French, etc.
- `grade_levels[]` - Kindergarten, Elementary, Middle, High
- `min_grade`, `max_grade` - KG1 to Grade 12
- `school_type` - Public, Private, International, Bilingual
- `year_established`
- `accreditations[]` - CIS, NEASC, BSME, IB World, Cognia
- `special_programs[]` - STEM, Arts, Sports, Gifted, Special Needs, ESL

**Financial:**
- `tuition_range_min`, `tuition_range_max`
- `currency`
- `registration_fee`, `application_fee`, `book_fee`, `uniform_fee`, `transportation_fee`
- `accepts_scholarships`, `scholarship_info`
- `payment_plans_available`, `sibling_discount`

**Enrollment:**
- `student_capacity`, `current_enrollment`
- `average_class_size`, `student_teacher_ratio`
- `enrollment_age_range`
- `admission_requirements`, `application_deadline`
- `entrance_exam_required`, `interview_required`

**Staffing:**
- `total_staff`, `total_teachers`
- `qualified_teachers_percentage`
- `native_english_teachers`
- `average_teacher_experience`

**Gender & Diversity:**
- `gender_policy` - Coed, Boys Only, Girls Only, Coed Separate Classes
- `nationality_mix[]`
- `international_students_percentage`

**Facilities (Boolean Flags):**
- Swimming pool, Sports facilities, Library, Cafeteria, Medical room
- Science labs, Computer labs, Arts facilities, Music room, Theater
- Playground, Gym, Prayer room, Air conditioning
- Transportation, Parking, Security features

**Schedule:**
- `academic_calendar`
- `school_hours_start`, `school_hours_end`
- `school_days[]`
- `office_hours` (JSONB)

**Educational Philosophy:**
- `mission_statement`, `vision_statement`
- `principal_name`, `principal_message`
- `educational_philosophy`
- `unique_selling_points[]`

### Attractions-Specific Fields (No School Equivalent)

- `attraction_type` - Museum, Park, Beach, Historical, etc.
- `typical_visit_duration`
- `age_suitability` - All Ages, Adults Only, Kids Friendly
- `is_free`, `admission_fee`
- `wheelchair_accessible`, `parking_available`, `photography_allowed`
- `best_time_to_visit`
- `opening_hours` (JSONB)
- FAQs (separate table)
- Reviews (separate table)
- Images (separate table with metadata)

---

## 3. Component Architecture Review

### Current Component Files

**Schools:**
```
src/components/school/
  â”œâ”€â”€ SchoolCard.tsx           âœ… Excellent - Card for grid listings
  â””â”€â”€ SchoolGovernorateCard.tsx âœ… Good - Governorate filter cards
```

**Attractions:**
```
src/components/attraction/
  â”œâ”€â”€ AttractionCard.tsx          âœ… Excellent - Card for grid listings
  â””â”€â”€ AttractionGovernorateCard.tsx âœ… Good - Governorate filter cards
```

### Component Comparison: SchoolCard vs AttractionCard

**SchoolCard Advantages:**
- âœ… Logo display (80x80 overlay on hero image)
- âœ… Multiple curriculum badges with overflow indicator
- âœ… Tuition range display
- âœ… Grade level range formatting
- âœ… Gender policy badge (conditional)
- âœ… School type badge (top-left corner)

**AttractionCard Advantages:**
- âœ… Family-friendly badge (top-left corner)
- âœ… Rating badge styling (more prominent)
- âœ… Age suitability detection

**Shared Features:**
- âœ… Hero image with fallback gradient
- âœ… Star rating display
- âœ… Location with MapPin icon
- âœ… Review count
- âœ… Category badges
- âœ… Hover effects (scale, shadow)

### Observations

1. **Both cards are well-implemented** but have minimal shared code
2. **Opportunity for abstraction:** Create a `BaseCard` component
3. **Schools card is more complex** due to financial + academic data
4. **Different visual hierarchy** but similar structure

---

## 4. Gap Analysis: What's Missing

### Missing from Current Schools Page (Compared to Attractions)

#### 1. **Photo Gallery Section** âš ï¸ HIGH PRIORITY
**Status:** Not implemented
**School Schema Fields:**
- `gallery_images[]` - Array of image URLs
- `video_tour_url` - YouTube/Vimeo embed
- `virtual_tour_url` - 360Â° tour link

**Attractions Implementation:**
```tsx
// attraction_images table with metadata
{
  id, attraction_id, url, alt_text,
  type, display_order, is_hero,
  extracted_from, created_at
}
```

**Recommendation:**
- **Option A (Simple):** Use `gallery_images[]` array directly (no separate table)
- **Option B (Advanced):** Create `school_images` table matching attractions pattern
- **Best Choice:** Option A for MVP, migrate to Option B later if needed

**Implementation:**
```tsx
{school.gallery_images && school.gallery_images.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex items-center gap-2 mb-4">
      <ImageIcon className="w-6 h-6 text-purple-600" />
      <h2 className="text-2xl font-bold">Photo Gallery</h2>
      <span className="text-sm text-gray-500">
        ({school.gallery_images.length} photos)
      </span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {school.gallery_images.map((url, index) => (
        <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
          <Image
            src={url}
            alt={`${school.name} photo ${index + 1}`}
            fill
            className="object-cover hover:scale-110 transition-transform"
          />
        </div>
      ))}
    </div>
  </div>
)}
```

#### 2. **Video Tour Section** âš ï¸ MEDIUM PRIORITY
**Status:** Not implemented
**School Schema Field:** `video_tour_url`, `virtual_tour_url`

**Recommendation:**
```tsx
{/* Video & Virtual Tour */}
{(school.video_tour_url || school.virtual_tour_url) && (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h2 className="text-2xl font-bold mb-4">Campus Tour</h2>

    {school.video_tour_url && (
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Video Tour</h3>
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe
            src={school.video_tour_url}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            allowFullScreen
          />
        </div>
      </div>
    )}

    {school.virtual_tour_url && (
      <a
        href={school.virtual_tour_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-purple-600 hover:underline"
      >
        <Globe className="w-5 h-5" />
        Take a 360Â° Virtual Tour
      </a>
    )}
  </div>
)}
```

#### 3. **Parent Reviews Section** âš ï¸ HIGH PRIORITY
**Status:** Not implemented (no `school_reviews` table exists)

**Attractions Implementation:**
```tsx
// attraction_reviews table
{
  id, attraction_id, author_name, rating,
  review_text, review_date, source, created_at
}
```

**Recommendation:** Create `school_reviews` table

**Migration File:** `supabase/migrations/20251121_school_reviews.sql`
```sql
CREATE TABLE IF NOT EXISTS school_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date DATE,
  source TEXT, -- 'google', 'parent_submitted', 'admin_curated'
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_school_reviews_school_id ON school_reviews(school_id);
CREATE INDEX idx_school_reviews_rating ON school_reviews(rating DESC);
CREATE INDEX idx_school_reviews_verified ON school_reviews(is_verified) WHERE is_verified = true;
```

**Component Implementation:**
```tsx
{/* Parent Reviews */}
{reviews && reviews.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex items-center gap-2 mb-4">
      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
      <h2 className="text-2xl font-bold">Parent Reviews</h2>
      <span className="text-sm text-gray-500">({reviews.length} reviews)</span>
    </div>
    <div className="space-y-4">
      {reviews.slice(0, 10).map((review) => (
        <div key={review.id} className="border-b pb-4 last:border-b-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-semibold text-gray-900">{review.author_name}</div>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            {review.is_verified && (
              <Badge className="bg-green-100 text-green-800">Verified Parent</Badge>
            )}
          </div>
          <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
          {review.review_date && (
            <p className="text-xs text-gray-500 mt-2">
              {new Date(review.review_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

#### 4. **FAQs Section** âš ï¸ MEDIUM PRIORITY
**Status:** Not implemented (no `school_faqs` table exists)

**Attractions Implementation:**
```tsx
// attraction_faqs table
{
  id, attraction_id, question, answer,
  display_order, created_at
}
```

**Recommendation:** Create `school_faqs` table

**Migration File:** `supabase/migrations/20251121_school_faqs.sql`
```sql
CREATE TABLE IF NOT EXISTS school_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_school_faqs_school_id ON school_faqs(school_id);
CREATE INDEX idx_school_faqs_order ON school_faqs(display_order);
```

**Common School FAQs:**
- "What is the admission process?"
- "What documents are required for enrollment?"
- "Does the school offer transportation?"
- "Are there extracurricular activities?"
- "What is the student-teacher ratio?"
- "Does the school accept students mid-year?"
- "What are the payment options?"

#### 5. **Enrollment Information Card** âœ… GOOD TO HAVE
**Status:** Data exists in schema but not displayed prominently

**Current Display:** Hidden in academic grid
**Recommendation:** Create dedicated enrollment card

```tsx
{/* Enrollment Information */}
{(school.student_capacity || school.average_class_size || school.admission_requirements) && (
  <div className="bg-blue-50 rounded-xl shadow-sm p-6 border-2 border-blue-200">
    <h2 className="text-2xl font-bold mb-4 text-blue-900">Enrollment</h2>

    <div className="space-y-3">
      {school.student_capacity && (
        <div className="flex justify-between">
          <span className="text-gray-700">Student Capacity</span>
          <span className="font-semibold">{school.student_capacity}</span>
        </div>
      )}

      {school.average_class_size && (
        <div className="flex justify-between">
          <span className="text-gray-700">Average Class Size</span>
          <span className="font-semibold">{school.average_class_size} students</span>
        </div>
      )}

      {school.student_teacher_ratio && (
        <div className="flex justify-between">
          <span className="text-gray-700">Student-Teacher Ratio</span>
          <span className="font-semibold">{school.student_teacher_ratio}</span>
        </div>
      )}

      {school.acceptance_rate && (
        <div className="flex justify-between">
          <span className="text-gray-700">Acceptance Rate</span>
          <span className="font-semibold">{school.acceptance_rate}%</span>
        </div>
      )}
    </div>

    {school.admission_requirements && (
      <div className="mt-4 pt-4 border-t border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Admission Requirements</h3>
        <p className="text-sm text-gray-700">{school.admission_requirements}</p>
      </div>
    )}

    {school.application_deadline && (
      <div className="mt-3 text-sm text-blue-700 font-medium">
        Application Deadline: {school.application_deadline}
      </div>
    )}
  </div>
)}
```

#### 6. **Accreditation Badges Display** âœ… GOOD TO HAVE
**Status:** Listed in text, not visually prominent

**Current:** Small text in academic grid
**Recommendation:** Create badge/logo grid

```tsx
{/* Accreditations & Affiliations */}
{school.accreditations && school.accreditations.length > 0 && (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex items-center gap-2 mb-4">
      <Award className="w-6 h-6 text-purple-600" />
      <h2 className="text-2xl font-bold">Accreditations</h2>
    </div>
    <div className="flex flex-wrap gap-3">
      {school.accreditations.map((accred, index) => (
        <div
          key={index}
          className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-semibold text-sm uppercase"
        >
          {accred}
        </div>
      ))}
    </div>
    {school.affiliations && school.affiliations.length > 0 && (
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Affiliations</h3>
        <div className="flex flex-wrap gap-2">
          {school.affiliations.map((affil, index) => (
            <Badge key={index} variant="outline">{affil}</Badge>
          ))}
        </div>
      </div>
    )}
  </div>
)}
```

#### 7. **Mission & Vision Statement** âœ… NICE TO HAVE
**Status:** Data exists but not displayed

```tsx
{/* Mission & Vision */}
{(school.mission_statement || school.vision_statement) && (
  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm p-6">
    {school.mission_statement && (
      <div className="mb-4">
        <h3 className="text-lg font-bold text-purple-900 mb-2">Our Mission</h3>
        <p className="text-gray-700 leading-relaxed">{school.mission_statement}</p>
      </div>
    )}
    {school.vision_statement && (
      <div>
        <h3 className="text-lg font-bold text-purple-900 mb-2">Our Vision</h3>
        <p className="text-gray-700 leading-relaxed">{school.vision_statement}</p>
      </div>
    )}
  </div>
)}
```

#### 8. **Principal's Message** âœ… NICE TO HAVE
**Status:** Data exists but not displayed

```tsx
{/* Principal's Message */}
{(school.principal_name || school.principal_message) && (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h2 className="text-2xl font-bold mb-4">Message from the Principal</h2>
    {school.principal_name && (
      <h3 className="text-lg font-semibold text-purple-600 mb-2">
        {school.principal_name}
      </h3>
    )}
    {school.principal_message && (
      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
        {school.principal_message}
      </p>
    )}
  </div>
)}
```

#### 9. **Extracurricular Activities Section** âš ï¸ MEDIUM PRIORITY
**Status:** Data exists but not displayed prominently

```tsx
{/* Extracurricular Activities */}
{(school.extracurricular_activities || school.sports_offered || school.clubs_offered) && (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h2 className="text-2xl font-bold mb-4">Extracurricular Activities</h2>

    {school.sports_offered && school.sports_offered.length > 0 && (
      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 mb-2">Sports</h3>
        <div className="flex flex-wrap gap-2">
          {school.sports_offered.map((sport, i) => (
            <Badge key={i} variant="secondary" className="capitalize">
              {sport}
            </Badge>
          ))}
        </div>
      </div>
    )}

    {school.clubs_offered && school.clubs_offered.length > 0 && (
      <div className="mb-4">
        <h3 className="font-semibold text-gray-700 mb-2">Clubs</h3>
        <div className="flex flex-wrap gap-2">
          {school.clubs_offered.map((club, i) => (
            <Badge key={i} variant="secondary" className="capitalize">
              {club}
            </Badge>
          ))}
        </div>
      </div>
    )}

    {school.arts_programs && school.arts_programs.length > 0 && (
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Arts Programs</h3>
        <div className="flex flex-wrap gap-2">
          {school.arts_programs.map((art, i) => (
            <Badge key={i} variant="secondary" className="capitalize">
              {art}
            </Badge>
          ))}
        </div>
      </div>
    )}
  </div>
)}
```

#### 10. **Map Integration** âš ï¸ HIGH PRIORITY
**Status:** Not implemented in either schools or attractions

**Recommendation:** Use Google Maps Embed API or Mapbox

```tsx
{/* Location Map */}
{school.latitude && school.longitude && (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h3 className="text-lg font-bold mb-4">Location</h3>
    <div className="aspect-video rounded-lg overflow-hidden">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${school.latitude},${school.longitude}`}
      />
    </div>
    <a
      href={`https://www.google.com/maps/dir/?api=1&destination=${school.latitude},${school.longitude}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-2 text-purple-600 hover:underline"
    >
      <MapPin className="w-4 h-4" />
      Get Directions
    </a>
  </div>
)}
```

---

## 5. Enhancement Recommendations

### Priority Matrix

| Enhancement | Priority | Effort | Impact | Status |
|-------------|----------|--------|--------|--------|
| Photo Gallery | HIGH | Medium | High | Missing |
| Parent Reviews Table | HIGH | High | High | Missing |
| Map Integration | HIGH | Low | Medium | Missing |
| Enrollment Card | MEDIUM | Low | Medium | Needs Redesign |
| FAQs Table | MEDIUM | Medium | Medium | Missing |
| Video/Virtual Tour | MEDIUM | Low | Medium | Missing |
| Accreditation Badges | LOW | Low | Low | Needs Redesign |
| Mission/Vision | LOW | Low | Low | Data Exists |
| Principal Message | LOW | Low | Low | Data Exists |
| Extracurricular | LOW | Low | Low | Needs Redesign |

### Quick Wins (Low Effort, Medium-High Impact)

1. **Photo Gallery from Array** (1 hour)
   - Use existing `gallery_images[]` field
   - Copy attractions gallery component
   - Adapt styling to purple theme

2. **Map Integration** (1 hour)
   - Add Google Maps iframe
   - Use existing lat/lng fields
   - Add "Get Directions" link

3. **Video/Virtual Tour** (30 mins)
   - Use existing fields
   - Embed YouTube/iframe
   - Link to virtual tour

4. **Enhanced Enrollment Card** (1 hour)
   - Restructure existing data
   - Better visual hierarchy
   - Highlight key stats

### Long-Term Investments (High Effort, High Impact)

1. **Parent Reviews System** (4-6 hours)
   - Create database table
   - Build review submission form (admin)
   - Add verification workflow
   - Display on detail page

2. **FAQs System** (2-3 hours)
   - Create database table
   - Build FAQ admin interface
   - Display with accordion component

3. **Shared Component Library** (6-8 hours)
   - Create `BaseDetailPage` component
   - Abstract common sections
   - Share between schools/attractions

---

## 6. Implementation Roadmap

### Phase 1: Quick Enhancements (Week 1)
**Goal:** Add missing visual elements without database changes

- [ ] Photo Gallery Section (use `gallery_images[]`)
- [ ] Video/Virtual Tour Section
- [ ] Map Integration
- [ ] Enhanced Enrollment Card
- [ ] Mission/Vision Display
- [ ] Principal Message Display
- [ ] Extracurricular Activities Grid

**Deliverables:**
- Updated `src/app/places-to-learn/schools/[slug]/page.tsx`
- No database migrations required

### Phase 2: Database Enhancements (Week 2)
**Goal:** Add review and FAQ systems

- [ ] Create `school_reviews` table
- [ ] Create `school_faqs` table
- [ ] Build admin interface for reviews
- [ ] Build admin interface for FAQs
- [ ] Update detail page to display reviews
- [ ] Update detail page to display FAQs

**Deliverables:**
- Migration: `20251121_school_reviews.sql`
- Migration: `20251121_school_faqs.sql`
- Updated detail page
- Admin forms

### Phase 3: Shared Component Architecture (Week 3)
**Goal:** Reduce code duplication, improve maintainability

- [ ] Create `src/components/shared/DetailPageLayout.tsx`
- [ ] Create `src/components/shared/HeroSection.tsx`
- [ ] Create `src/components/shared/ContactCard.tsx`
- [ ] Create `src/components/shared/SocialMediaLinks.tsx`
- [ ] Create `src/components/shared/PhotoGallery.tsx`
- [ ] Create `src/components/shared/ReviewsSection.tsx`
- [ ] Create `src/components/shared/FAQSection.tsx`
- [ ] Refactor schools page to use shared components
- [ ] Refactor attractions page to use shared components

**Deliverables:**
- New shared component library
- Refactored pages with same functionality
- Reduced lines of code by ~40%

### Phase 4: Advanced Features (Future)
**Goal:** Best-in-class school directory

- [ ] School comparison tool
- [ ] Tuition calculator
- [ ] Waitlist notifications
- [ ] Application tracking
- [ ] Parent forum integration
- [ ] School events calendar
- [ ] Teacher profiles
- [ ] Alumni network

---

## 7. Component Specifications

### Proposed Shared Component Architecture

```
src/components/shared/
â”œâ”€â”€ layout/
â”‚   â”œâ”€â”€ DetailPageLayout.tsx      # 2-column responsive layout
â”‚   â”œâ”€â”€ HeroSection.tsx            # Gradient hero with breadcrumbs
â”‚   â””â”€â”€ SidebarCard.tsx            # Reusable sidebar card wrapper
â”œâ”€â”€ media/
â”‚   â”œâ”€â”€ PhotoGallery.tsx           # Grid gallery with lightbox
â”‚   â”œâ”€â”€ VideoEmbed.tsx             # YouTube/Vimeo embed
â”‚   â””â”€â”€ MapEmbed.tsx               # Google Maps integration
â”œâ”€â”€ social/
â”‚   â”œâ”€â”€ SocialMediaLinks.tsx       # Icon grid for social platforms
â”‚   â””â”€â”€ ShareButtons.tsx           # Share to social media
â”œâ”€â”€ contact/
â”‚   â”œâ”€â”€ ContactCard.tsx            # Address, phone, email, website
â”‚   â”œâ”€â”€ OperatingHours.tsx         # Opening/office hours display
â”‚   â””â”€â”€ DirectionsButton.tsx       # Get directions link
â”œâ”€â”€ reviews/
â”‚   â”œâ”€â”€ ReviewsSection.tsx         # Review list display
â”‚   â”œâ”€â”€ ReviewCard.tsx             # Individual review component
â”‚   â””â”€â”€ RatingBadge.tsx            # Star rating display
â””â”€â”€ faq/
    â”œâ”€â”€ FAQSection.tsx             # Accordion FAQ list
    â””â”€â”€ FAQItem.tsx                # Single FAQ item

src/components/school/
â”œâ”€â”€ SchoolCard.tsx                 # âœ… Already exists
â”œâ”€â”€ SchoolGovernorateCard.tsx      # âœ… Already exists
â”œâ”€â”€ AcademicInfoGrid.tsx           # NEW - Curriculum, grades, etc.
â”œâ”€â”€ TuitionCard.tsx                # NEW - Highlighted pricing
â”œâ”€â”€ EnrollmentCard.tsx             # NEW - Capacity, ratios, requirements
â”œâ”€â”€ AccreditationBadges.tsx        # NEW - Accreditation display
â”œâ”€â”€ FacilitiesGrid.tsx             # NEW - Facilities checklist
â””â”€â”€ ExtracurricularGrid.tsx        # NEW - Sports, clubs, arts

src/components/attraction/
â”œâ”€â”€ AttractionCard.tsx             # âœ… Already exists
â”œâ”€â”€ AttractionGovernorateCard.tsx  # âœ… Already exists
â”œâ”€â”€ VisitorInfoGrid.tsx            # NEW - Duration, admission, etc.
â””â”€â”€ BestTimeToVisit.tsx            # NEW - Seasonal recommendations
```

### Component API Examples

#### DetailPageLayout.tsx
```tsx
interface DetailPageLayoutProps {
  hero: React.ReactNode;
  mainContent: React.ReactNode;
  sidebar: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href: string }>;
}

export function DetailPageLayout({
  hero,
  mainContent,
  sidebar,
  breadcrumbs
}: DetailPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {hero}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {mainContent}
          </div>
          <div className="space-y-6">
            {sidebar}
          </div>
        </div>
      </section>
    </div>
  );
}
```

#### PhotoGallery.tsx
```tsx
interface PhotoGalleryProps {
  images: string[];
  title?: string;
  subtitle?: string;
  columns?: 2 | 3 | 4;
  aspectRatio?: 'square' | 'video' | '4/3';
  enableLightbox?: boolean;
}

export function PhotoGallery({
  images,
  title = "Photo Gallery",
  subtitle,
  columns = 3,
  aspectRatio = 'square',
  enableLightbox = true
}: PhotoGalleryProps) {
  // Implementation with lightbox modal
}
```

#### TuitionCard.tsx
```tsx
interface TuitionCardProps {
  minFee: number;
  maxFee: number;
  currency?: string;
  registrationFee?: number;
  applicationFee?: number;
  additionalFees?: Array<{ label: string; amount: number }>;
  scholarshipsAvailable?: boolean;
  scholarshipInfo?: string;
}

export function TuitionCard({
  minFee,
  maxFee,
  currency = 'KD',
  registrationFee,
  applicationFee,
  additionalFees,
  scholarshipsAvailable,
  scholarshipInfo
}: TuitionCardProps) {
  // Styled card with financial info
}
```

---

## 8. UI/UX Mockups (Text Format)

### Enhanced Schools Detail Page Layout

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ HERO SECTION (Purple-to-Blue Gradient + Photo Overlay)         â”‚
â”‚                                                                 â”‚
â”‚ Home / Places to Learn / The British School of Goa         â”‚
â”‚                                                                 â”‚
â”‚ [LOGO]  THE BRITISH SCHOOL OF GOA                          â”‚
â”‚         Ø§Ù„Ù…Ø¯Ø±Ø³Ø© Ø§Ù„Ø¨Ø±ÙŠØ·Ø§Ù†ÙŠØ© ÙÙŠ Ø§Ù„ÙƒÙˆÙŠØª                             â”‚
â”‚                                                                 â”‚
â”‚ [Private] [British] [IB World]   ðŸ“ Salwa   â­ 4.5 (127)    â”‚
â”‚                                                                 â”‚
â”‚ Leading British curriculum school offering IGCSE and A-Levels  â”‚
â”‚ with world-class facilities and outstanding academic results.  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ LEFT COLUMN (2/3 width)         â”‚ RIGHT SIDEBAR (1/3 width)     â”‚
â”‚                                 â”‚                               â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ ABOUT THE SCHOOL            â”‚ â”‚ â”‚ ðŸ’° TUITION FEES           â”‚ â”‚
â”‚ â”‚                             â”‚ â”‚ â”‚                           â”‚ â”‚
â”‚ â”‚ The British School of       â”‚ â”‚ â”‚ KD 2,500 - KD 4,200      â”‚ â”‚
â”‚ â”‚ Goa has been providing...â”‚ â”‚ â”‚ per academic year         â”‚ â”‚
â”‚ â”‚                             â”‚ â”‚ â”‚                           â”‚ â”‚
â”‚ â”‚ [Description paragraph...]  â”‚ â”‚ â”‚ Registration: KD 500      â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ Application: KD 100       â”‚ â”‚
â”‚                                 â”‚ â”‚                           â”‚ â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚ âœ… Sibling Discount       â”‚ â”‚
â”‚ â”‚ ðŸ“š ACADEMIC INFORMATION     â”‚ â”‚ â”‚ âœ… Payment Plans          â”‚ â”‚
â”‚ â”‚                             â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚ â”‚ [Curriculum] British        â”‚ â”‚                               â”‚
â”‚ â”‚ [Grades] KG1 - Grade 12     â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ [Established] 1996          â”‚ â”‚ â”‚ ðŸ“ CONTACT INFO           â”‚ â”‚
â”‚ â”‚ [Gender] Coed               â”‚ â”‚ â”‚                           â”‚ â”‚
â”‚ â”‚ [Accreditation] CIS, NEASC  â”‚ â”‚ â”‚ Block 5, Street 7        â”‚ â”‚
â”‚ â”‚ [Languages] English, Arabic â”‚ â”‚ â”‚ Salwa, Goa             â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚                           â”‚ â”‚
â”‚                                 â”‚ â”‚ â˜Žï¸ +965 2565 1234         â”‚ â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚ âœ‰ï¸ admissions@bsk.edu.kw  â”‚ â”‚
â”‚ â”‚ ðŸ“¸ PHOTO GALLERY (12 photos)â”‚ â”‚ â”‚ ðŸŒ Visit Website          â”‚ â”‚
â”‚ â”‚                             â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚ â”‚ [IMG] [IMG] [IMG]           â”‚ â”‚                               â”‚
â”‚ â”‚ [IMG] [IMG] [IMG]           â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ [IMG] [IMG] [IMG]           â”‚ â”‚ â”‚ ðŸ“± FOLLOW US              â”‚ â”‚
â”‚ â”‚                             â”‚ â”‚ â”‚                           â”‚ â”‚
â”‚ â”‚ [View All Photos]           â”‚ â”‚ â”‚ [Instagram] [Facebook]    â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ [YouTube] [LinkedIn]      â”‚ â”‚
â”‚                                 â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚                               â”‚
â”‚ â”‚ ðŸŽ¬ CAMPUS TOUR              â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚                             â”‚ â”‚ â”‚ â° OFFICE HOURS           â”‚ â”‚
â”‚ â”‚ [YouTube Video Embed]       â”‚ â”‚ â”‚                           â”‚ â”‚
â”‚ â”‚                             â”‚ â”‚ â”‚ Sunday-Thursday           â”‚ â”‚
â”‚ â”‚ ðŸŒ Take 360Â° Virtual Tour   â”‚ â”‚ â”‚ 7:30 AM - 3:00 PM         â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚                           â”‚ â”‚
â”‚                                 â”‚ â”‚ Friday-Saturday: Closed   â”‚ â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚ â”‚ â­ PARENT REVIEWS (23)      â”‚ â”‚                               â”‚
â”‚ â”‚                             â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ Sarah Al-Mutairi â­â­â­â­â­   â”‚ â”‚ â”‚ ðŸŽ“ ENROLLMENT INFO        â”‚ â”‚
â”‚ â”‚ Excellent school with...    â”‚ â”‚ â”‚                           â”‚ â”‚
â”‚ â”‚                             â”‚ â”‚ â”‚ Capacity: 850 students    â”‚ â”‚
â”‚ â”‚ Mohammed Hassan â­â­â­â­      â”‚ â”‚ â”‚ Class Size: 18 students   â”‚ â”‚
â”‚ â”‚ Great facilities and...     â”‚ â”‚ â”‚ Ratio: 12:1               â”‚ â”‚
â”‚ â”‚                             â”‚ â”‚ â”‚                           â”‚ â”‚
â”‚ â”‚ [View All Reviews]          â”‚ â”‚ â”‚ Application Deadline:     â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ March 31                  â”‚ â”‚
â”‚                                 â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚                               â”‚
â”‚ â”‚ ðŸ« FACILITIES & FEATURES    â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚                             â”‚ â”‚ â”‚ ðŸ—ºï¸ LOCATION MAP           â”‚ â”‚
â”‚ â”‚ [âœ“ Swimming Pool]           â”‚ â”‚ â”‚                           â”‚ â”‚
â”‚ â”‚ [âœ“ Science Labs]            â”‚ â”‚ â”‚ [Google Maps Embed]       â”‚ â”‚
â”‚ â”‚ [âœ“ Library]                 â”‚ â”‚ â”‚                           â”‚ â”‚
â”‚ â”‚ [âœ“ Computer Labs]           â”‚ â”‚ â”‚ ðŸ“ Get Directions         â”‚ â”‚
â”‚ â”‚ [âœ“ Sports Complex]          â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚ â”‚ [âœ“ Auditorium]              â”‚ â”‚                               â”‚
â”‚ â”‚ [âœ“ Cafeteria]               â”‚ â”‚                               â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚                               â”‚
â”‚                                 â”‚                               â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚                               â”‚
â”‚ â”‚ ðŸ† ACCREDITATIONS           â”‚ â”‚                               â”‚
â”‚ â”‚                             â”‚ â”‚                               â”‚
â”‚ â”‚ [CIS] [NEASC] [BSME]       â”‚ â”‚                               â”‚
â”‚ â”‚ [IB WORLD SCHOOL]           â”‚ â”‚                               â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚                               â”‚
â”‚                                 â”‚                               â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚                               â”‚
â”‚ â”‚ âš½ EXTRACURRICULAR           â”‚ â”‚                               â”‚
â”‚ â”‚                             â”‚ â”‚                               â”‚
â”‚ â”‚ Sports: Soccer, Basketball, â”‚ â”‚                               â”‚
â”‚ â”‚ Swimming, Tennis, Athletics â”‚ â”‚                               â”‚
â”‚ â”‚                             â”‚ â”‚                               â”‚
â”‚ â”‚ Clubs: Robotics, Debate,    â”‚ â”‚                               â”‚
â”‚ â”‚ Drama, Chess, MUN           â”‚ â”‚                               â”‚
â”‚ â”‚                             â”‚ â”‚                               â”‚
â”‚ â”‚ Arts: Music, Band, Art,     â”‚ â”‚                               â”‚
â”‚ â”‚ Theater, Photography        â”‚ â”‚                               â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚                               â”‚
â”‚                                 â”‚                               â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚                               â”‚
â”‚ â”‚ ðŸ’­ MESSAGE FROM PRINCIPAL   â”‚ â”‚                               â”‚
â”‚ â”‚                             â”‚ â”‚                               â”‚
â”‚ â”‚ Dr. Jane Smith              â”‚ â”‚                               â”‚
â”‚ â”‚                             â”‚ â”‚                               â”‚
â”‚ â”‚ "Welcome to BSK. Our        â”‚ â”‚                               â”‚
â”‚ â”‚ commitment to excellence..." â”‚ â”‚                               â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚                               â”‚
â”‚                                 â”‚                               â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚                               â”‚
â”‚ â”‚ â“ FREQUENTLY ASKED         â”‚ â”‚                               â”‚
â”‚ â”‚    QUESTIONS                â”‚ â”‚                               â”‚
â”‚ â”‚                             â”‚ â”‚                               â”‚
â”‚ â”‚ â–¶ What is the admission     â”‚ â”‚                               â”‚
â”‚ â”‚   process?                  â”‚ â”‚                               â”‚
â”‚ â”‚                             â”‚ â”‚                               â”‚
â”‚ â”‚ â–¶ What documents are        â”‚ â”‚                               â”‚
â”‚ â”‚   required?                 â”‚ â”‚                               â”‚
â”‚ â”‚                             â”‚ â”‚                               â”‚
â”‚ â”‚ â–¶ Does the school offer     â”‚ â”‚                               â”‚
â”‚ â”‚   transportation?           â”‚ â”‚                               â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Summary & Next Steps

### Current Strengths
âœ… Solid foundation already in place
âœ… Schools page follows attractions pattern closely
âœ… Rich database schema with extensive fields
âœ… Good visual hierarchy and branding
âœ… Responsive layout working well

### Key Gaps
âš ï¸ Missing photo gallery (high priority)
âš ï¸ No parent reviews system (high priority)
âš ï¸ No map integration (high priority)
âš ï¸ Missing FAQs (medium priority)
âš ï¸ Video/virtual tour not displayed (medium priority)

### Recommended Immediate Actions

**Phase 1A - This Week (Quick Wins):**
1. Add photo gallery section (2 hours)
2. Add map integration (1 hour)
3. Add video/virtual tour section (1 hour)
4. Enhance enrollment card (1 hour)
5. Display mission/vision/principal message (1 hour)

**Phase 1B - Next Week (Database Work):**
1. Create `school_reviews` table
2. Create `school_faqs` table
3. Build basic admin interfaces
4. Display on detail page

**Phase 2 - Following Sprint:**
1. Shared component architecture
2. Refactor both schools and attractions
3. Build comprehensive component library

### Questions for Douglas

1. **Photo Gallery Priority:** Should we implement the photo gallery this sprint? It's the most visible missing feature.

2. **Reviews System:** Would you like parent reviews to be admin-curated, user-submitted, or pulled from Google only?

3. **Map Integration:** Do you have a Google Maps API key? If not, should we use Mapbox or another provider?

4. **Component Refactoring:** Should we tackle Phase 3 (shared components) now or wait until we have more verticals (e.g., activities, fitness)?

5. **FAQs Source:** Should FAQs be manually created per school, or auto-generated from common questions?

---

**COMPLETION SUMMARY:** Comprehensive schools detail page analysis complete - identified 10 enhancement opportunities with implementation roadmap and component specifications for Douglas.