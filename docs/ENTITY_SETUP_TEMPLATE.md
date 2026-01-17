# Entity Setup Template
**Created for:** Best of Goa
**Purpose:** Reusable pattern for adding new entity types (Hotels, Attractions, Malls, Schools, etc.)
**Based on:** Hotels implementation (November 2025)

---

## Overview

This document provides a step-by-step template for adding new entity types to the Best of Goa platform. Each entity type (Hotels, Attractions, Malls, Schools) follows the same systematic pattern established during the Hotels implementation.

## Prerequisites

- Supabase project with database access
- API credentials configured in `.env.local`:
  - `FIRECRAWL_API_KEY`
  - `OPENAI_API_KEY`
  - `APIFY_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## Phase 1: Database Schema Setup

### 1.1 Main Entity Table

Create the primary table for your entity (e.g., `hotels`, `attractions`, `malls`, `schools`).

**Required Core Fields:**
```sql
CREATE TABLE {entity_name}s (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,

  -- Location
  area TEXT,
  neighborhood_id UUID REFERENCES neighborhoods(id),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Social Media (7 platforms)
  instagram TEXT,
  facebook TEXT,
  tiktok TEXT,
  twitter TEXT,
  youtube TEXT,
  linkedin TEXT,
  snapchat TEXT,

  -- Content
  description TEXT,
  short_description TEXT,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  og_description TEXT,

  -- Images
  hero_image TEXT,
  primary_image_url TEXT,
  images TEXT[],
  photos_count INTEGER DEFAULT 0,

  -- Ratings & Reviews
  average_rating DECIMAL(3, 2),
  review_count INTEGER DEFAULT 0,
  review_sentiment TEXT,

  -- Status & Workflow
  extraction_status TEXT DEFAULT 'pending',
  extraction_progress JSONB,
  is_published BOOLEAN DEFAULT false,

  -- Raw Data Storage (audit trail)
  apify_output JSONB,
  firecrawl_output JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Entity-Specific Fields:**
Add fields specific to your entity type:
- **Hotels:** `star_rating`, `room_count`, `check_in_time`, `check_out_time`, `pets_allowed`, `smoking_policy`
- **Attractions:** `entry_fee`, `opening_hours`, `duration_minutes`, `best_time_to_visit`
- **Malls:** `number_of_stores`, `parking_spaces`, `food_court`, `cinema`, `opening_hours`
- **Schools:** `education_level`, `curriculum`, `student_capacity`, `year_established`, `accreditation`

### 1.2 Related Tables

Create supporting tables for your entity:

```sql
-- Images
CREATE TABLE {entity}_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  {entity}_id UUID REFERENCES {entity}s(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  alt_text TEXT,
  is_hero BOOLEAN DEFAULT false,
  hero_score INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  file_size_kb INTEGER,
  content_descriptor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE {entity}_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  {entity}_id UUID REFERENCES {entity}s(id) ON DELETE CASCADE,
  author_name TEXT,
  rating INTEGER,
  comment TEXT,
  review_date DATE,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs
CREATE TABLE {entity}_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  {entity}_id UUID REFERENCES {entity}s(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  relevance_score INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Entity-Specific Related Tables:**
- **Hotels:** `hotel_rooms`, `hotel_policies`, `hotel_amenities`, `hotel_facilities`, `hotel_categories`
- **Attractions:** `attraction_activities`, `attraction_facilities`, `attraction_tickets`
- **Malls:** `mall_stores`, `mall_events`, `mall_parking`, `mall_facilities`
- **Schools:** `school_programs`, `school_facilities`, `school_extracurriculars`

### 1.3 Tag/Category Tables

Create category and feature tables:

```sql
-- Categories
CREATE TABLE {entity}_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Features/Amenities
CREATE TABLE {entity}_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Many-to-Many Junction Tables:**
```sql
-- Link entity to categories
CREATE TABLE {entity}_category_assignments (
  {entity}_id UUID REFERENCES {entity}s(id) ON DELETE CASCADE,
  category_id UUID REFERENCES {entity}_categories(id) ON DELETE CASCADE,
  PRIMARY KEY ({entity}_id, category_id)
);

-- Link entity to features
CREATE TABLE {entity}_feature_assignments (
  {entity}_id UUID REFERENCES {entity}s(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES {entity}_features(id) ON DELETE CASCADE,
  PRIMARY KEY ({entity}_id, feature_id)
);
```

### 1.4 Supabase Storage Bucket

Create a storage bucket for entity images:

1. Go to Supabase Dashboard â†’ Storage
2. Create new bucket: `{entity}s` (e.g., `hotels`, `attractions`)
3. Make bucket **public**
4. Set policies for public read access

---

## Phase 2: Discovery Script

Create a discovery script to find entities in the area.

**File:** `bin/discover-{entity}s.js`

```javascript
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Goa neighborhoods to search
const GOA_AREAS = [
  'Salmiya', 'Goa City', 'Hawally', 'Jabriya',
  // ... add all areas from neighborhoods table
];

async function discover{Entity}s() {
  console.log('\nðŸ” DISCOVERING {ENTITY}S IN GOA\n');

  const all{Entity}s = [];

  for (const area of GOA_AREAS) {
    console.log(`\nðŸ“ Searching in ${area}...`);

    const query = `{entity type} in ${area}, Goa`;
    // Use Google Places API or Apify to search
    const results = await searchGooglePlaces(query);

    all{Entity}s.push(...results);
  }

  console.log(`\nâœ… Found ${all{Entity}s.length} {entity}s`);

  // Insert into database with extraction_status = 'pending'
  for (const {entity} of all{Entity}s) {
    await supabase.from('{entity}s').upsert({
      name: {entity}.name,
      slug: generateSlug({entity}.name),
      area: {entity}.area,
      address: {entity}.address,
      latitude: {entity}.latitude,
      longitude: {entity}.longitude,
      extraction_status: 'pending'
    }, { onConflict: 'slug' });
  }
}

discover{Entity}s().catch(console.error);
```

---

## Phase 3: Service Files

### 3.1 Image Extractor Service

**CRITICAL:** Create a **separate** image extractor for each entity type to avoid code conflicts.

**File:** `src/lib/services/{entity}-image-extractor.ts`

```typescript
/**
 * {Entity} Image Extractor
 * COMPLETELY SEPARATE from other entity image extraction.
 * This file handles ONLY {entity} images with {entity}-specific Vision API prompts.
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export class {Entity}ImageExtractor {
  private supabase;
  private openai: OpenAI;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Main method: Extract and upload {entity} images WITH Vision API
   */
  async extractAndUpload{Entity}Images({entity}Id: string): Promise<void> {
    // 1. Fetch from Google Places API
    const googleImages = await this.fetchGooglePlacesImages({entity}, 10);

    // 2. Process with Vision API
    for (const img of googleImages) {
      const imageBuffer = await this.downloadImage(img.url);
      const analysis = await this.analyze{Entity}ImageWithVision(imageBuffer, {entity});

      // 3. Generate SEO filename
      const filename = this.generateSEOFilename({entity}, analysis.contentDescriptor);

      // 4. Upload to Supabase Storage ({entity}s bucket)
      const uploadResult = await this.uploadToSupabase(imageBuffer, filename, {entity});

      // 5. Insert metadata into {entity}_images table
      await this.supabase.from('{entity}_images').insert({
        {entity}_id: {entity}Id,
        url: uploadResult.url,
        storage_path: uploadResult.path,
        alt_text: analysis.alt,
        hero_score: analysis.heroScore,
        // ... other fields
      });
    }

    // 6. Select hero image
    await this.selectHeroImage({entity}Id);
  }

  /**
   * Analyze {ENTITY} image with OpenAI Vision API ({Entity}-specific prompts)
   */
  private async analyze{Entity}ImageWithVision(imageBuffer: Buffer, {entity}: any): Promise<any> {
    const base64Image = imageBuffer.toString('base64');
    const prompt = `Analyze this {entity} image and provide detailed, SEO-optimized metadata.

{Entity} Name: ${{{entity}.name}}
Location: ${{{entity}.area}}, Goa

IDEAL Hero Images (Score 80-100):
[Define what makes a good hero image for this entity type]

Return JSON:
{
  "alt": "...",
  "contentDescriptor": "descriptive-slug",
  "heroScore": 85,
  "showsActual{Entity}": true
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` }}
        ]
      }]
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Upload to Supabase Storage ({entity}s bucket)
   */
  private async uploadToSupabase(imageBuffer: Buffer, filename: string, {entity}: any): Promise<any> {
    const path = `${{{entity}.slug}}/${filename}`;

    await this.supabase.storage
      .from('{entity}s')  // {ENTITY}-SPECIFIC BUCKET
      .upload(path, imageBuffer, { contentType: 'image/jpeg', upsert: true });

    const { data: publicUrlData } = this.supabase.storage
      .from('{entity}s')
      .getPublicUrl(path);

    return { url: publicUrlData.publicUrl, path, filename };
  }
}

export const {entity}ImageExtractor = new {Entity}ImageExtractor();
```

### 3.2 Extraction Orchestrator

**File:** `src/lib/services/{entity}-extraction-orchestrator.ts`

```typescript
/**
 * {Entity} Extraction Orchestrator
 *
 * 12-Step Pipeline:
 * 1. Apify - Google Places Details
 * 2. Firecrawl - General info
 * 3. Firecrawl - Specific data (e.g., rooms, activities)
 * 4. Firecrawl - Website scraping
 * 5. Multi-Stage Social Media Search
 * 6. Apify - Google Reviews
 * 7. Firecrawl - TripAdvisor
 * 8. Firecrawl - Platform-specific (Booking.com, etc.)
 * 9. Image Extraction & Processing
 * 10. AI Sentiment Analysis
 * 11. AI Enhancement
 * 12. Database Population (related tables)
 */

import { createClient } from '@supabase/supabase-js';
import { apifyClient } from './apify-client';
import { firecrawlClient } from './firecrawl-client';
import { OpenAIClient } from './openai-client';
import { socialMediaSearchService } from './social-media-search';
import { {entity}ImageExtractor } from './{entity}-image-extractor';

export class {Entity}ExtractionOrchestrator {
  private supabase;
  private openaiClient: OpenAIClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.openaiClient = new OpenAIClient();
  }

  async executeExtraction({entity}Id: string): Promise<void> {
    const job = { {entity}Id, startTime: new Date() };

    try {
      await this.updateProgress(job, 'in_progress', 1, 'Fetching Google Places data');
      await this.fetchApifyData(job);

      await this.updateProgress(job, 'in_progress', 2, 'Searching general info');
      await this.searchGeneralInfo(job);

      // ... all 12 steps

      await this.updateProgress(job, 'completed', 12, 'All steps complete');
    } catch (error) {
      await this.updateProgress(job, 'failed', 0, error.message);
      throw error;
    }
  }

  // Implement all 12 steps following the hotel pattern
  private async fetchApifyData(job: any): Promise<void> { /* ... */ }
  private async processImages(job: any): Promise<void> {
    await {entity}ImageExtractor.extractAndUpload{Entity}Images(job.{entity}Id);
  }
  // ... other steps
}

export const {entity}ExtractionOrchestrator = new {Entity}ExtractionOrchestrator();
```

---

## Phase 4: OpenAI Client Methods

Add entity-specific methods to `src/lib/services/openai-client.ts`:

```typescript
/**
 * Generate {entity}-specific FAQs
 */
async generate{Entity}FAQs({entity}Data: any): Promise<Array<FAQ>> {
  const prompt = `Generate 8-10 frequently asked questions for this {entity}.

{Entity}: ${{{entity}Data.name}}
Location: ${{{entity}Data.area}}, Goa

Generate FAQs covering:
[Entity-specific FAQ categories]

Return JSON array with question, answer, category, relevance_score.`;

  // Call OpenAI and parse response
}

/**
 * Enhance {entity} data with AI
 */
async enhance{Entity}Data({entity}: any): Promise<any> {
  const prompt = `Enhance this {entity} data with AI-generated content.

{Entity}: ${{{entity}.name}}
Raw Data: ${JSON.stringify({entity}.firecrawl_output)}

Generate:
- description (300-400 characters)
- short_description (120-150 characters)
- meta_title (50-60 characters)
- meta_description (150-160 characters)
- suggested_categories (array of category names)
- suggested_features (array of feature names)

Return JSON with enhanced fields.`;

  // Call OpenAI and parse response
}
```

---

## Phase 5: Admin UI

### 5.1 Add Entity Page

**File:** `src/app/admin/add/page.tsx`

Add a tab or section for adding new entities:

```tsx
<Tabs defaultValue="restaurants">
  <TabsList>
    <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
    <TabsTrigger value="hotels">Hotels</TabsTrigger>
    <TabsTrigger value="{entity}s">{Entity}s</TabsTrigger>
  </TabsList>

  <TabsContent value="{entity}s">
    <Add{Entity}Form />
  </TabsContent>
</Tabs>
```

### 5.2 Queue Management

**File:** `src/app/admin/{entity}s/queue/page.tsx`

Create a queue page to monitor extraction jobs:

```tsx
export default function {Entity}QueuePage() {
  const [queue, setQueue] = useState([]);

  // Fetch all {entity}s with extraction_status and progress
  useEffect(() => {
    async function loadQueue() {
      const { data } = await supabase
        .from('{entity}s')
        .select('*')
        .order('created_at', { ascending: false });
      setQueue(data);
    }
    loadQueue();
  }, []);

  return (
    <div>
      <h1>{Entity} Extraction Queue</h1>
      <Table>
        {/* Display name, status, progress, actions */}
      </Table>
    </div>
  );
}
```

### 5.3 Detail Page

**File:** `src/app/admin/{entity}s/[id]/page.tsx`

Create a detail page to review extraction results:

```tsx
export default function {Entity}DetailPage({ params }) {
  const { id } = params;
  const [data, setData] = useState(null);

  // Fetch {entity} with all related data
  useEffect(() => {
    async function load{Entity}() {
      const { data: {entity} } = await supabase
        .from('{entity}s')
        .select('*, {entity}_images(*), {entity}_faqs(*)')
        .eq('id', id)
        .single();
      setData({entity});
    }
    load{Entity}();
  }, [id]);

  return (
    <div>
      <h1>{data?.name}</h1>
      {/* Display all extracted data with sections */}
    </div>
  );
}
```

---

## Phase 6: API Routes

### 6.1 Start Extraction Endpoint

**File:** `src/app/api/admin/{entity}s/start-extraction/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { {entity}ExtractionOrchestrator } from '@/lib/services/{entity}-extraction-orchestrator';

export async function POST(request: NextRequest) {
  const { {entity}Id } = await request.json();

  try {
    await {entity}ExtractionOrchestrator.executeExtraction({entity}Id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 6.2 Queue Status Endpoint

**File:** `src/app/api/admin/{entity}s/queue/route.ts`

```typescript
export async function GET() {
  const { data } = await supabase
    .from('{entity}s')
    .select('id, name, slug, extraction_status, extraction_progress')
    .order('created_at', { ascending: false });

  return NextResponse.json({ queue: data });
}
```

---

## Phase 7: Public Pages

### 7.1 Listing Page

**File:** `src/app/{entity}s/page.tsx`

```tsx
export default function {Entity}sListingPage() {
  const [entities, setEntities] = useState([]);

  useEffect(() => {
    async function load{Entity}s() {
      const { data } = await supabase
        .from('{entity}s')
        .select('*')
        .eq('is_published', true)
        .order('average_rating', { ascending: false });
      setEntities(data);
    }
    load{Entity}s();
  }, []);

  return (
    <div>
      <h1>Best {Entity}s in Goa</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {entities.map(entity => (
          <{Entity}Card key={entity.id} {entity}={entity} />
        ))}
      </div>
    </div>
  );
}
```

### 7.2 Detail Page

**File:** `src/app/{entity}s/[slug]/page.tsx`

```tsx
export default function {Entity}DetailPage({ params }) {
  const { slug } = params;
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load{Entity}() {
      const { data: {entity} } = await supabase
        .from('{entity}s')
        .select(`
          *,
          {entity}_images(*),
          {entity}_faqs(*),
          {entity}_reviews(*)
        `)
        .eq('slug', slug)
        .single();
      setData({entity});
    }
    load{Entity}();
  }, [slug]);

  return (
    <div>
      {/* Hero image */}
      {/* Main content sections */}
      {/* FAQs */}
      {/* Reviews */}
    </div>
  );
}
```

---

## Phase 8: Testing Workflow

### 8.1 Single Entity Test

1. **Discover entities:**
   ```bash
   node bin/discover-{entity}s.js
   ```

2. **Check database:**
   ```sql
   SELECT name, slug, extraction_status FROM {entity}s LIMIT 10;
   ```

3. **Run extraction for 1 entity:**
   - Go to `/admin/{entity}s/queue`
   - Click "Start Extraction" for one entity
   - Monitor progress in real-time

4. **Verify data:**
   ```bash
   node bin/check-{entity}-data.js
   ```

   Check for:
   - âœ… Description populated
   - âœ… Categories/features matched
   - âœ… Images extracted (hero image set)
   - âœ… FAQs generated
   - âœ… Related tables populated

### 8.2 Diagnostic Scripts

Create verification scripts:

**File:** `bin/check-{entity}-data.js`

```javascript
async function check{Entity}Data() {
  const { data: {entity} } = await supabase
    .from('{entity}s')
    .select('*')
    .eq('slug', 'test-{entity}-slug')
    .single();

  console.log('\nðŸ“Š EXTRACTION RESULTS:');
  console.log('   Description:', {entity}.description ? 'âœ…' : 'âŒ');
  console.log('   Categories:', {entity}.{entity}_category_ids?.length || 0);
  console.log('   Hero Image:', {entity}.hero_image ? 'âœ…' : 'âŒ');

  const { count: imagesCount } = await supabase
    .from('{entity}_images')
    .select('*', { count: 'exact', head: true })
    .eq('{entity}_id', {entity}.id);
  console.log('   Images:', imagesCount);

  const { count: faqsCount } = await supabase
    .from('{entity}_faqs')
    .select('*', { count: 'exact', head: true })
    .eq('{entity}_id', {entity}.id);
  console.log('   FAQs:', faqsCount);
}
```

### 8.3 Batch Testing

After single entity test succeeds:

1. **Small batch (5 entities):**
   ```bash
   node bin/batch-extract-{entity}s.js --limit 5
   ```

2. **Review results:**
   - Check database for all 5
   - Verify images uploaded to Supabase Storage
   - Check cost estimates vs. actuals

3. **Full batch (all entities):**
   ```bash
   node bin/batch-extract-{entity}s.js --all
   ```

---

## Phase 9: Cost Estimation

### Per-Entity Breakdown

Based on Hotels implementation:

| Step | Service | Cost per Entity |
|------|---------|----------------|
| 1. Apify Google Places | Google Places Details | $0.02 |
| 2-4. Firecrawl (3 calls) | Scrape + Search | $0.25 |
| 5. Social Media Search | Firecrawl + Web Search | $0.10 |
| 6. Apify Reviews | Google Reviews (50) | $0.02 |
| 7-8. Firecrawl Platform Search | TripAdvisor + Others | $0.15 |
| 9. Image Processing | Vision API (10 images) | $0.50 |
| 10. Sentiment Analysis | GPT-4o mini | $0.01 |
| 11. AI Enhancement | GPT-4o | $0.05 |
| 12. FAQs + Related Data | GPT-4o mini | $0.02 |
| **Total** | | **~$1.12** |

**Batch Cost Calculation:**
- 10 entities: $11.20
- 50 entities: $56.00
- 100 entities: $112.00

---

## Phase 10: Deployment Checklist

Before going live with new entity type:

### Database
- [ ] All tables created in Supabase
- [ ] Storage bucket created and public
- [ ] RLS policies configured (if needed)
- [ ] Indexes added for performance

### Services
- [ ] Separate image extractor created
- [ ] Orchestrator implements all 12 steps
- [ ] OpenAI methods added for entity type
- [ ] All imports use correct entity services

### Admin UI
- [ ] Add entity form created
- [ ] Queue page working
- [ ] Detail/review page functional
- [ ] Start extraction button triggers correctly

### Public Pages
- [ ] Listing page displays entities
- [ ] Detail page shows full data
- [ ] SEO metadata rendering correctly
- [ ] Images loading from correct bucket

### Testing
- [ ] Single entity extraction succeeds
- [ ] All data populates correctly
- [ ] Images extract with Vision API
- [ ] Hero image selected properly
- [ ] FAQs and related tables populated
- [ ] Cost estimate matches actuals

### Documentation
- [ ] Discovery script documented
- [ ] Extraction process documented
- [ ] Admin workflows documented
- [ ] Public page structure documented

---

## Lessons Learned from Hotels Implementation

### Critical Dos:

1. **Separate Image Extractors:** Always create entity-specific image extractor files to prevent cross-contamination
2. **Test Single First:** Never run batch extraction without testing one entity completely
3. **Vision API Prompts:** Customize prompts for each entity type (hotel lobby vs. restaurant food)
4. **Category Matching:** Extract AI suggestions, match to database, then store as IDs (not raw suggestions)
5. **Storage Buckets:** One bucket per entity type for organization
6. **Slug Generation:** Include location suffix for SEO and uniqueness
7. **Cost Control:** Always estimate and verify costs before bulk operations

### Critical Don'ts:

1. **Don't Share Code:** Never reuse image extractor code between entity types
2. **Don't Skip Steps:** All 12 steps are essential for complete data
3. **Don't Assume Success:** Always verify extraction results before marking complete
4. **Don't Ignore Errors:** Log and handle all API failures gracefully
5. **Don't Hardcode Buckets:** Use dynamic bucket detection
6. **Don't Mix Entities:** Keep admin UI tabs/sections clearly separated

---

## Quick Reference: File Checklist

For each new entity type, create:

### Database
- [ ] `{entity}s` table (main)
- [ ] `{entity}_images` table
- [ ] `{entity}_reviews` table
- [ ] `{entity}_faqs` table
- [ ] `{entity}_categories` table
- [ ] `{entity}_features` table
- [ ] Entity-specific related tables
- [ ] Supabase storage bucket: `{entity}s`

### Services (src/lib/services/)
- [ ] `{entity}-image-extractor.ts`
- [ ] `{entity}-extraction-orchestrator.ts`
- [ ] Methods in `openai-client.ts`

### Admin UI (src/app/admin/)
- [ ] `add/page.tsx` (add {entity} section)
- [ ] `{entity}s/queue/page.tsx`
- [ ] `{entity}s/[id]/page.tsx`

### API Routes (src/app/api/admin/)
- [ ] `{entity}s/start-extraction/route.ts`
- [ ] `{entity}s/queue/route.ts`

### Public Pages (src/app/)
- [ ] `{entity}s/page.tsx` (listing)
- [ ] `{entity}s/[slug]/page.tsx` (detail)

### Scripts (bin/)
- [ ] `discover-{entity}s.js`
- [ ] `check-{entity}-data.js`
- [ ] `delete-test-{entity}.js`
- [ ] `batch-extract-{entity}s.js`

---

## Next Entity Types to Implement

1. **Attractions** (Beaches, Parks, Museums, Landmarks)
2. **Malls** (Shopping Centers)
3. **Schools** (Primary, Secondary, International)
4. **Hospitals** (Healthcare Facilities)
5. **Cafes** (Coffee Shops)
6. **Gyms** (Fitness Centers)
7. **Salons** (Beauty & Wellness)

Each follows the exact pattern documented above with entity-specific customizations.

---

**Document Version:** 1.0
**Last Updated:** November 2025
**Based on:** Hotels Implementation
**Status:** Production-Ready Template
