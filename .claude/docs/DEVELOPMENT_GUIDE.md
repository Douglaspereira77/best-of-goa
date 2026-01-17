# Best of Goa - Development Guide

## Core Commands

```bash
npm run dev           # Start Next.js dev server (localhost:3000)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
npm run lint:fix      # Fix linting issues
npm run format        # Format code with Prettier
npm run type-check    # Run TypeScript type checking
npx supabase --help   # Access Supabase CLI
```

## Development Workflow

1. Make changes to code
2. Test on localhost: `npm run dev`
3. Run type check: `npm run type-check`
4. Fix linting: `npm run lint:fix`
5. Format code: `npm run format`
6. Commit changes

## Common Development Tasks

### Add a new service/integration
1. Create file in `src/lib/services/new-service.ts`
2. Implement class with typed methods
3. Export singleton instance
4. Import in `extraction-orchestrator.ts`
5. Call from appropriate extraction step

### Modify restaurant data extraction
1. Edit relevant method in `extraction-orchestrator.ts`
2. Or enhance service (e.g., `firecrawl-client.ts`)
3. Update `data-mapper.ts` if normalizing new fields
4. Test with: `npm run dev` then admin page

### Add UI for restaurant management
1. Check `src/components/ui/` for existing shadcn/ui components
2. Create component in `src/components/admin/` if needed
3. Use in routes under `src/app/admin/`
4. Test with development server

### Add breadcrumbs to a new page
1. Import the Breadcrumbs component: `import { Breadcrumbs } from '@/components/layout/Breadcrumbs'`
2. Add breadcrumbs at the top of page content:
   ```tsx
   <div className="container mx-auto px-4 pt-6">
     <Breadcrumbs items={[
       { label: 'Home', href: '/' },
       { label: 'Your Section', href: '/your-section' },
       { label: 'Current Page' }
     ]} />
   </div>
   ```
3. See `docs/NAVIGATION_STRUCTURE.md` for detailed examples

### Modify navigation items
1. Edit `src/components/layout/PublicHeader.tsx`
2. Update the `navigationItems` array
3. Changes apply to all public pages automatically

## Admin Section Structure

### URL Patterns
```
/admin                           # Main dashboard
/admin/restaurants               # All restaurants list (filterable)
/admin/restaurants/add           # Add new restaurant (extraction)
/admin/restaurants/queue         # Monitor extraction queue
/admin/restaurants/[id]/review   # Review/edit restaurant data + DELETE

/admin/hotels                    # All hotels list (filterable)
/admin/hotels/add                # Add new hotel (extraction)
/admin/hotels/queue              # Monitor extraction queue
/admin/hotels/[id]/review        # Review/edit hotel data + DELETE

/admin/malls                     # All malls list (filterable)
/admin/malls/add                 # Add new mall (extraction)
/admin/malls/queue               # Monitor extraction queue
/admin/malls/[id]/review         # Review/edit mall data + DELETE

/admin/fitness                   # All fitness places list (filterable)
/admin/fitness/add               # Add new fitness place (extraction)
/admin/fitness/queue             # Monitor extraction queue
/admin/fitness/[id]/review       # Review/edit fitness data + DELETE

/admin/attractions               # All attractions list (filterable)
/admin/attractions/add           # Add new attraction (extraction)
/admin/attractions/queue         # Monitor extraction queue
/admin/attractions/[id]/review   # Review/edit attraction data + DELETE

/admin/blog                      # All blog articles (filterable, publish/unpublish)
```

### Legacy Redirects (next.config.ts)
- `/admin/add` â†’ `/admin/restaurants/add` (permanent 301)
- `/admin/queue` â†’ `/admin/restaurants/queue` (permanent 301)

### Breadcrumb Hierarchy
All admin pages include proper breadcrumb navigation:
- `Admin > Restaurants > Add Restaurant`
- `Admin > Restaurants > Extraction Queue`
- `Admin > Hotels > Add Hotel`
- `Admin > Hotels > Extraction Queue`
- `Admin > Malls > Add Mall`
- `Admin > Malls > Extraction Queue`
- `Admin > Fitness > Add Fitness Place`
- `Admin > Fitness > Extraction Queue`
- `Admin > Attractions > Add Attraction`
- `Admin > Attractions > Extraction Queue`

### List Page Features
All entity admin pages (`/admin/restaurants`, `/admin/hotels`, `/admin/malls`, `/admin/fitness`, `/admin/attractions`) provide:
- Table view of all entities
- Status filtering (Published, Draft, Processing, Failed)
- Name search
- Click-through to review pages
- Direct add button
- Refresh functionality

### Review Page Publish and Redirect Functionality (November 2025)
All review pages now automatically redirect to the published page after publishing:

**Location:** "Publish" button in status bar (top of page, only shown when entity is not active)

**Behavior:**
1. Click Publish button
2. POST request to `/api/admin/[entity]/[id]/publish`
3. Success message displays: "Published successfully! Redirecting to published page..."
4. After 1.5 second delay, automatic redirect to public page
5. User lands on the published entity page where end-users see it

**Redirect URLs:**
- Attractions: `/places-to-visit/attractions/[slug]`
- Restaurants: `/places-to-eat/restaurants/[slug]`
- Hotels: `/places-to-stay/hotels/[slug]`
- Fitness: `/things-to-do/fitness/[slug]`
- Malls: Not implemented yet (no publish functionality)

**API Endpoints:**
- `POST /api/admin/attractions/[id]/publish` - Publish attraction (sets active=true, verified=true)
- `POST /api/admin/restaurants/[id]/publish` - Publish restaurant (sets status='published')
- `PUT /api/admin/hotels/[id]/publish` - Publish hotel (sets status='published')
- `POST /api/admin/fitness/[id]/publish` - Publish fitness (sets active=true, verified=true)

**Implementation Pattern:**
```typescript
const [isPublishing, setIsPublishing] = useState(false)

const handlePublish = async () => {
  try {
    setSaving(true)
    setError(null)
    setIsPublishing(true)

    const response = await fetch(`/api/admin/[entity]/${id}/publish`, {
      method: 'POST'
    })

    if (!response.ok) throw new Error('Failed to publish')

    setEntity(prev => prev ? { ...prev, active: true, verified: true } : null)
    setSaveSuccess(true)

    // Redirect to published page after 1.5s delay
    setTimeout(() => {
      if (entity?.slug) {
        router.push(`/[public-path]/[slug]`)
      }
    }, 1500)
  } catch (err) {
    setError(err.message)
    setIsPublishing(false)
  } finally {
    setSaving(false)
  }
}
```

**Success Message Pattern:**
```typescript
{saveSuccess && (
  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-600">
    <CheckCircle className="w-4 h-4" />
    {isPublishing ? 'Published successfully! Redirecting to published page...' : 'Changes saved successfully'}
  </div>
)}
```

### Review Page Delete Functionality (November 2025)
All review pages now include delete capability:

**Location:** Red "Delete" button in status bar (top of page)

**Behavior:**
1. Click Delete button (with Trash2 icon)
2. Browser confirmation: "Are you sure you want to delete this [entity]? This action cannot be undone."
3. On confirm: DELETE request to `/api/admin/[entity]/[id]`
4. Cascading deletion of all related data:
   - Images, reviews, FAQs, special data
5. Redirect to entity list page on success

**API Endpoints:**
- `DELETE /api/admin/restaurants/[id]` - Delete restaurant + related data
- `DELETE /api/admin/hotels/[id]` - Delete hotel + rooms, images, amenities
- `DELETE /api/admin/malls/[id]` - Delete mall + related data
- `DELETE /api/admin/fitness/[id]` - Delete fitness place + related data
- `DELETE /api/admin/attractions/[id]` - Delete attraction + images, reviews, FAQs, special hours

**Implementation Pattern:**
```typescript
const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this [entity]? This action cannot be undone.')) {
    return
  }

  try {
    const response = await fetch(`/api/admin/[entity]/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) throw new Error('Failed to delete')

    router.push('/admin/[entity]')  // Redirect to list
  } catch (err) {
    console.error('Delete failed:', err)
  }
}
```

### Sidebar Navigation (AppSidebar)
Located in `src/components/app-sidebar.tsx`:
- Dashboard link
- Restaurants section (All, Add, Queue)
- Hotels section (All, Add, Queue)
- Malls section (All, Add, Queue)
- Fitness section (All, Add, Queue)
- Attractions section (All, Add, Queue)
- Categories section (future)
- Data Management section (future)
- Settings (future)

### Debug extraction issues
1. Check `src/lib/services/extraction-orchestrator.ts` logs
2. Look at `firecrawl_output` and `apify_output` JSON columns
3. Verify API credentials in `.env.local`
4. Test specific services independently in `/bin/` scripts

## Detail Page Design Pattern

### Layout Structure
```
â”œâ”€â”€ SEO Metadata Generation
â”œâ”€â”€ Schema.org JSON-LD
â”œâ”€â”€ Hero Section (full-width image with gradient overlay)
â”‚   â”œâ”€â”€ Name (text-4xl font-bold)
â”‚   â”œâ”€â”€ Short Description (text-lg text-gray-200)
â”‚   â””â”€â”€ Badges (backdrop-blur)
â”œâ”€â”€ Main Content (max-w-7xl mx-auto, 3-column grid)
â”‚   â”œâ”€â”€ Left Column (lg:col-span-2)
â”‚   â”‚   â”œâ”€â”€ About Section
â”‚   â”‚   â”œâ”€â”€ Review Sentiment
â”‚   â”‚   â”œâ”€â”€ Items Grid (Dishes/Rooms)
â”‚   â”‚   â”œâ”€â”€ Features/Amenities
â”‚   â”‚   â”œâ”€â”€ Photo Gallery
â”‚   â”‚   â”œâ”€â”€ Location Map
â”‚   â”‚   â””â”€â”€ FAQs
â”‚   â””â”€â”€ Right Column (Sidebar)
â”‚       â”œâ”€â”€ Score Card
â”‚       â”œâ”€â”€ Contact Information
â”‚       â””â”€â”€ Additional Info
```

### Color & Spacing Standards
- Background: `bg-gray-50`
- Cards: `bg-white rounded-lg shadow-sm p-6`
- Hero badges: `bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg`
- Feature tags: `bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium`
- Facility tags: `bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium`
- Sentiment card: `bg-blue-50 border border-blue-100 rounded-lg shadow-sm p-6`
- Section titles: `text-2xl font-semibold mb-4`
- Container: `max-w-7xl mx-auto px-4 py-8`

## Score Card Components

### Restaurant (BOKScoreCard)
- Breakdown: Cuisine Quality, Service, Ambiance, Value, Location
- Sources: Google, TripAdvisor

### Hotel (HOKScoreCard)
- Breakdown: Room Quality (40%), Service (20%), Cleanliness (15%), Location (10%), Value (10%), Amenities (5%)
- Sources: Google, TripAdvisor, Booking.com
- Visual star rating display (1-5 stars)
- Expandable breakdown with progress bars

## Shared Components

### Layout & Navigation

**Location:** `src/components/layout/`

- **PublicHeader** - Sticky header with navigation, search bar, and mobile menu
  - Used automatically on all public pages via `PublicLayout`
  - Excludes admin routes (`/admin/*`)
  - See `docs/NAVIGATION_STRUCTURE.md` for details

- **PublicFooter** - Comprehensive footer with links, newsletter, and social media
  - Used automatically on all public pages via `PublicLayout`
  - Multi-column responsive layout

- **Breadcrumbs** - Breadcrumb navigation component
  - Reusable across all pages
  - Supports custom styling
  - Auto-generation helper available

- **PublicLayout** - Layout wrapper that conditionally renders header/footer
  - Integrated into root layout (`src/app/layout.tsx`)
  - Automatically excludes admin routes

### Cards
- **RestaurantCard** - Used in `/places-to-eat` directory
- **HotelCard** - Used in `/places-to-stay` directory
- **MallCard** - Used in `/places-to-shop` directory

### SearchBar
- Props: `type?: 'restaurants' | 'hotels'`
- Uses `/api/search/restaurants` or `/api/search/hotels`
- Displays appropriate ratings (10-point for restaurants, 5-point + stars for hotels)
- Links to correct detail pages

### RestaurantMap
- Used for both restaurants and hotels
- Google Maps embed with place ID

### PhotoGallery
- Grid gallery with lightbox
- Same pattern for both entities

## Mall-Specific Development Tasks

### Add a new mall
1. Navigate to `/admin/malls/add`
2. Enter Google Place ID
3. System checks for duplicates
4. Click "Start Extraction"
5. Monitor progress at `/admin/malls/queue`

### Audit mall data quality
```bash
# Complete audit of all malls
node bin/audit-mall-completeness.js
```

Checks:
- Failed extractions
- Missing images
- Missing descriptions
- Missing Google Place IDs
- Completely broken malls

### Verify mall images
```bash
# Count all images in storage vs database
node bin/count-all-mall-images.js

# Detailed image status check
node bin/check-mall-images-detailed.js

# Check storage buckets
node bin/check-storage-buckets.js
```

### Sync storage images to database
```bash
# When images exist in storage but not in mall_images table
node bin/sync-storage-images-to-db.js
```

Features:
- Auto-detects hero image
- Generates alt text from filename
- Sets proper display order
- Skips malls already synced

### Re-extract failed malls
```bash
# Re-extract images for malls with failed status
node bin/re-extract-failed-mall-images.js
```

Features:
- Fetches fresh photos from Google Places
- Direct upload to Supabase Storage
- Updates status to 'completed' on success
- Rate limiting (3 seconds between malls)

### Batch import malls
```bash
# Import multiple malls from a list
node bin/batch-import-malls.js

# Setup Supabase Storage buckets
node bin/setup-malls-storage.js

# Test image extraction
node bin/test-mall-images.js
```

### Debug mall extraction issues
1. Check `src/lib/services/mall-extraction-orchestrator.ts` logs
2. Inspect `firecrawl_output` and `apify_output` JSON columns in database
3. Verify API credentials in `.env.local`
4. Run audit script to identify specific issues
5. Check Supabase Storage bucket `malls` for uploaded images

## Blog Article Management

### Generate/Regenerate Blog Articles
```bash
node scripts/generate-blog-articles.js
```

This script:
- Fetches directory data from Supabase (only listings with `hero_image`)
- Generates conversational content using GPT-4o
- Creates/updates articles in `blog_articles` table
- Links articles to listings via `blog_article_listings` junction table

**Current Article Templates:**
1. Best Breakfast Spots in Goa (`/blog/restaurants/best-breakfast-spots-in-goa`)
2. Where to Find the Best Sushi in Goa (`/blog/restaurants/where-to-find-best-sushi-in-goa`)
3. Top 10 Family-Friendly Attractions (`/blog/attractions/top-10-family-friendly-attractions`)
4. Goa City Dining Guide 2025 (`/blog/guides/goa-city-dining-guide-2025`)
5. Top 10 Luxury Hotels in Goa (`/blog/hotels/top-10-luxury-hotels-in-goa`)

### Blog Article Structure
Articles use structured JSONB content:
```json
{
  "introduction": { "paragraphs": [...] },
  "sections": [
    { "type": "listing", "heading": "...", "listings": [...] },
    { "type": "text", "heading": "...", "content": "..." },
    { "type": "faq", "heading": "...", "faqs": [...] }
  ],
  "conclusion": { "paragraphs": [...], "cta": { "text": "...", "link": "..." } }
}
```

### Manually Edit Article Content
To remove/update listings in an existing article, query and update the JSONB content directly in Supabase or use a script.

### Blog Admin Panel
Access at `/admin/blog` to:
- View all articles with thumbnails and status
- Filter by category and publication status
- Search articles by title
- Publish/unpublish articles with one click
- Delete articles (with confirmation)
- Open published articles in new tab

**Admin Features:**
- Category badges with color coding
- Featured article indicator (star icon)
- Stats cards showing totals
- Confirmation dialogs for destructive actions

## Image Maintenance Scripts

Located in `scripts/`:

### Link Checker
```bash
node scripts/check-all-links.js              # Check all image URLs
node scripts/check-all-links.js --images-only # Skip page links
```
Checks all image tables: `hotel_images`, `mall_images`, `attraction_images`, `school_images`, `fitness_images`

### Fitness Image Deduplication
```bash
node scripts/dedupe-fitness-images.js --dry-run  # Preview
node scripts/dedupe-fitness-images.js --execute  # Execute
```
Removes duplicate files (identified by identical file size) and updates database references.

### Broken Image Cleanup
```bash
node scripts/cleanup-broken-fitness-images.js --dry-run  # Preview
node scripts/cleanup-broken-fitness-images.js --execute  # Delete
```
Removes database records pointing to non-existent storage files.

**Note:** These scripts use pagination to handle tables with >1000 records (Supabase default limit).

## Important Notes

- **Environment Variables:** All API keys in `.env.local` (never committed)
- **Supabase:** Use `@supabase/supabase-js` with service role key
- **Staging Data:** Raw extraction results stored in JSON columns for audit trail
- **TypeScript:** Strict mode enabled - all functions properly typed
- **shadcn/ui:** 70+ components pre-installed - check `src/components/ui/` first
- **Storage Structure:** Images stored at `{entity}/{slug}/images/` in Supabase Storage
- **Supabase Pagination:** Default limit is 1000 rows - use `.range()` for larger queries
