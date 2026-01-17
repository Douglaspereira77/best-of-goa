# Schools Admin Panel Documentation
*Created: November 21, 2025*
*Status: âœ… Fully Implemented (copied from attractions)*

## Overview

The schools admin panel provides a complete administrative interface for managing schools in the Best of Goa directory. It was created by copying and adapting the attractions admin panel structure, ensuring consistency across all directory verticals.

## Architecture

**Pattern**: Copied from `/admin/attractions/` and adapted for schools
**Branding**: Purple theme (vs attractions blue)
**Icon**: GraduationCap (vs MapPin)
**Tech Stack**: Next.js 15, TypeScript, Tailwind v4, shadcn/ui

## Pages Overview

### 1. List Page (`/admin/schools`)

**Purpose**: Browse and manage all schools in the directory

**Features**:
- âœ… Search bar with real-time filtering
- âœ… Status filter tabs (All, Published, Draft, Processing, Pending, Failed)
- âœ… Professional table layout with sortable columns
- âœ… School logo/initials display
- âœ… Quick actions: Review, View public page, Publish/Unpublish, Delete
- âœ… Publish/Unpublish toggle with confirmation dialog
- âœ… Responsive design

**Columns**:
- School (logo + name + slug)
- Type (international, private, public)
- Curriculum (up to 2 shown, with +N badge)
- Area
- Rating (stars + review count)
- Tuition (From KD X,XXX)
- Status badge
- Added date
- Actions

**File**: `src/app/admin/schools/page.tsx`

**Key Components**:
```typescript
interface SchoolListItem {
  id: string
  name: string
  slug: string
  status: 'draft' | 'published' | 'failed' | 'processing' | 'pending'
  extraction_status: 'completed' | 'pending' | 'processing' | 'failed'
  area: string
  schoolType: string | null
  curriculum: string[] | null
  rating: number | null
  reviewCount: number | null
  tuitionMin: number | null
  heroImage: string | null
  logoImage: string | null
  published: boolean
  createdAt: string
}
```

**Action Buttons**:
- **Review**: Open school review page in new tab (opens in new window)
- **View** (external link): Open public school page in new tab (if published and completed)
- **Publish/Unpublish** (conditional):
  - Shows green Eye icon when `published = false` (click to publish immediately)
  - Shows yellow EyeOff icon when `published = true` (click to show unpublish confirmation)
- **Delete** (red): Delete school with confirmation dialog

**API Endpoint**: `GET /api/admin/schools/list?status=X&search=Y&limit=100`

---

### 2. Add Page (`/admin/schools/add`)

**Purpose**: Search Google Places and add new schools

**Features**:
- âœ… Google Places API integration
- âœ… Real-time search with loading states
- âœ… School type detection (primary, secondary, university, etc.)
- âœ… One-click extraction start
- âœ… Success/error notifications
- âœ… Auto-redirect to queue

**User Flow**:
1. Enter school name in search box
2. System searches Google Places (adds " Goa" automatically)
3. Results displayed with school type badges
4. Click "Add & Extract" on desired school
5. Extraction starts in background
6. Success message shown
7. Auto-redirect to queue page (2 second delay)

**File**: `src/app/admin/schools/add/page.tsx`

**School Type Detection**:
```typescript
const typeMap = {
  school: 'School',
  primary_school: 'Primary School',
  secondary_school: 'Secondary School',
  university: 'University',
  preschool: 'Preschool',
  kindergarten: 'Kindergarten'
}
```

**API Endpoints**:
- `POST /api/admin/schools/search-places` - Google Places search
- `POST /api/admin/schools/start-extraction` - Start extraction

---

### 3. Queue Page (`/admin/schools/queue`)

**Purpose**: Monitor active extractions in real-time

**Features**:
- âœ… Live extraction status
- âœ… Auto-refresh every 5 seconds
- âœ… Progress indicators
- âœ… Status badges with icons
- âœ… Time elapsed display
- âœ… Manual refresh button

**Status Types**:
- **Processing** (blue, spinning loader): Currently extracting
- **Completed** (green, checkmark): Extraction finished
- **Failed** (red, alert): Extraction error
- **Queued** (gray, clock): Waiting to start

**File**: `src/app/admin/schools/queue/page.tsx`

**Auto-Refresh Logic**:
```typescript
useEffect(() => {
  if (isHydrated) {
    loadQueue()
    const interval = setInterval(loadQueue, 5000) // Every 5 seconds
    return () => clearInterval(interval)
  }
}, [isHydrated])
```

**API Endpoint**: `GET /api/admin/schools/queue`

---

### 4. Review Page (`/admin/schools/[id]/review`)

**Purpose**: View, edit, and verify extracted school data

**Features**:
- âœ… Fully editable form interface (similar to attractions review page)
- âœ… Tabbed interface: Basic Info, Academic, Contact, SEO
- âœ… Save changes functionality
- âœ… Publish/Unpublish button
- âœ… Delete button with confirmation
- âœ… Extraction progress tracking
- âœ… Auto-refresh during active extraction
- âœ… Success/error messaging
- âœ… Real-time form state management

**Tabs**:
- **Basic Info**: Name, Arabic name, slug, area, governorate, address, descriptions
- **Academic**: School type, gender policy, curriculum, grade levels, tuition range, year established
- **Contact**: Phone, email, website, all social media platforms (Instagram, Facebook, Twitter, TikTok, YouTube, LinkedIn, Snapchat, WhatsApp)
- **SEO**: Meta title, meta description, meta keywords with character counters

**Data Sections**:
- Basic Info (name, slug, area, type)
- Academic Info (curriculum, grades, gender policy, accreditation)
- Contact Info (phone, email, website)
- Social Media (Instagram, Facebook, Twitter, TikTok, YouTube, LinkedIn, Snapchat, WhatsApp)
- Images (hero, logo, gallery)
- Tuition Information
- Facilities & Features
- Office Hours
- Reviews

**File**: `src/app/admin/schools/[id]/review/page.tsx`

**API Endpoints**: 
- `GET /api/admin/schools/[id]/review` - Fetch school data
- `PUT /api/admin/schools/[id]/review` - Update school data

---

## Component Reuse

### From Attractions Admin

**Copied Components**:
- Search bar with icon
- Status filter tabs
- Table layout
- Badge system
- Loading skeletons
- Empty states
- Error states
- Success notifications

**Adaptations Made**:
- Changed icon: MapPin â†’ GraduationCap
- Changed colors: Blue â†’ Purple
- Changed fields: attractionType â†’ schoolType, isFree â†’ tuition
- Changed URLs: /places-to-visit/attractions â†’ /places-to-learn/schools
- Changed API: /api/admin/attractions â†’ /api/admin/schools

### shadcn/ui Components Used

- `SidebarInset` - Layout wrapper
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` - Card layouts
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` - Data tables
- `Button` - All buttons
- `Input` - Search inputs
- `Badge` - Status indicators
- `AdminPageHeader` - Page headers with breadcrumbs

---

## API Endpoints

### List Schools
```
GET /api/admin/schools/list
Query Params:
  - status: 'all' | 'published' | 'draft' | 'processing' | 'pending' | 'failed'
  - search: string (school name or area)
  - limit: number (default 100)

Response:
{
  schools: SchoolListItem[]
  pagination: { total: number }
}
```

### Search Google Places
```
POST /api/admin/schools/search-places
Body:
{
  query: string
}

Response:
{
  results: GooglePlaceResult[]
}
```

### Start Extraction
```
POST /api/admin/schools/start-extraction
Body:
{
  placeId: string
  name: string
  address: string
  latitude: number
  longitude: number
  placeData: object
}

Response:
{
  success: true
  schoolId: string
  message: string
}
```

### Queue Status
```
GET /api/admin/schools/queue

Response:
{
  schools: QueuedSchool[]
}
```

### School Details (Review Page)
```
GET /api/admin/schools/[id]/review

Response:
{
  school: School (camelCase format)
}
```

### Update School (Review Page)
```
PUT /api/admin/schools/[id]/review
Body:
{
  name?: string
  nameAr?: string
  description?: string
  shortDescription?: string
  address?: string
  area?: string
  governorate?: string
  phone?: string
  email?: string
  website?: string
  instagram?: string
  facebook?: string
  twitter?: string
  tiktok?: string
  youtube?: string
  linkedin?: string
  snapchat?: string
  whatsapp?: string
  schoolType?: string
  curriculum?: string[]
  gradeLevels?: string[]
  minGrade?: string
  maxGrade?: string
  yearEstablished?: number
  genderPolicy?: string
  tuitionRangeMin?: number
  tuitionRangeMax?: number
  currency?: string
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
}

Response:
{
  school: School (updated, camelCase format)
}
```

### Publish/Unpublish School
```
POST /api/admin/schools/[id]/publish
Body:
{
  action: 'publish' | 'unpublish'
}

Response:
{
  success: true
  message: string
  published: boolean
}
```

**Behavior**:
- **Publish**: Sets `published: true`, `published_at: timestamp`, `active: true`, `verified: true`
- **Unpublish**: Sets `published: false`, `published_at: null`
- **Active field**: Set to `true` when publishing, remains unchanged when unpublishing
- **No validation**: Publish allowed without field requirements

### Delete School
```
POST /api/admin/schools/delete
Body:
{
  schoolId: string
}

Response:
{
  success: true
  message: string
  stats: {
    imagesDeleted: number
    imagesFailed: number
    totalImages: number
  }
}
```

**Behavior**:
- Deletes school from database
- Removes all associated images from Supabase Storage (best-effort)
- CASCADE deletes related records (school_images table)
- Returns stats about image deletion success/failure

---

## Design System

### Color Scheme

**Primary (Purple)**:
- Buttons: Default purple
- Selections: `border-purple-500 bg-purple-50`
- Badges: Purple variants

**Status Colors**:
- Published: Green (`bg-green-100 text-green-800`)
- Draft: Yellow (`bg-yellow-100 text-yellow-800`)
- Processing: Blue (`bg-blue-100 text-blue-800`)
- Pending: Gray (`bg-gray-100 text-gray-800`)
- Failed: Red (`bg-red-100 text-red-800`)

### Icons

**Primary Icon**: `GraduationCap` (from lucide-react)
**Used for**:
- Empty states
- School type indicators
- Navigation

**Other Icons**:
- Search (search bar)
- Plus (add button)
- RefreshCw (refresh button)
- Star (ratings)
- Loader2 (loading states)
- CheckCircle (success)
- AlertCircle (errors)
- ExternalLink (view public page)
- Eye (publish action - green)
- EyeOff (unpublish action - yellow)
- Trash2 (delete action - red)

### Typography

**Headings**:
- Page title: `text-2xl font-bold`
- Card title: `text-lg font-bold`
- Section title: `text-lg font-medium`

**Body**:
- Regular text: `text-base`
- Small text: `text-sm text-gray-500`
- Tiny text: `text-xs`

---

## User Experience

### Search Flow

1. User types in search box
2. Click "Search" or press Enter
3. Loading state shows (spinner icon)
4. Results appear with school info cards
5. Hover highlights cards
6. Click "Add & Extract" button
7. Button shows loading state
8. Success message appears
9. Auto-redirect to queue

### Extraction Monitoring

1. Queue page shows all active extractions
2. Auto-refreshes every 5 seconds
3. Status badges update in real-time
4. Click row to view details
5. View review page for complete data
6. Click "View Public Page" when complete

### Error Handling

**Search Errors**:
- Red alert box with error message
- "Retry" action available

**Extraction Errors**:
- Red card with error details
- Stays on add page for retry

**Loading Errors**:
- Error message in table area
- "Retry" button available

---

## Testing Checklist

### List Page
- [ ] Search functionality works
- [ ] Status filters work
- [ ] Table displays correctly
- [ ] Logos/initials show properly
- [ ] Click row opens review page in new tab
- [ ] Review button opens review page in new tab
- [ ] External link opens public page
- [ ] Publish button (green Eye) works for unpublished schools
- [ ] Unpublish button (yellow EyeOff) shows confirmation dialog
- [ ] Unpublish confirmation works correctly
- [ ] Published schools appear on public site
- [ ] Unpublished schools removed from public site
- [ ] Delete button shows confirmation dialog
- [ ] Delete removes school and images
- [ ] Empty state shows when no schools
- [ ] Loading state shows while fetching

### Add Page
- [ ] Search bar accepts input
- [ ] Google Places search works
- [ ] Results display correctly
- [ ] School type detection works
- [ ] "Add & Extract" starts extraction
- [ ] Success message shows
- [ ] Auto-redirect to queue works
- [ ] Error handling works

### Queue Page
- [ ] Queue loads on page load
- [ ] Auto-refresh every 5 seconds
- [ ] Status badges accurate
- [ ] Progress info displays
- [ ] Click row opens review page in new tab
- [ ] Review button opens review page in new tab
- [ ] Manual refresh works

### Review Page
- [ ] School data displays correctly
- [ ] All tabs render (Basic Info, Academic, Contact, SEO)
- [ ] Form inputs are editable
- [ ] Save changes works
- [ ] Publish button works
- [ ] Delete button shows confirmation
- [ ] Success/error messages display
- [ ] Images show (when available)
- [ ] Auto-refresh during extraction
- [ ] Back button works
- [ ] View public page works

---

## Future Enhancements

### Completed Features
1. âœ… **Publish Toggle**: Quick publish/unpublish from list page (November 22, 2025)
2. âœ… **Delete Action**: Delete schools with confirmation and image cleanup (November 22, 2025)
3. âœ… **Editable Review Page**: Full form interface with tabs, save, publish, delete (December 2025)
4. âœ… **Review Links Open in New Tab**: Review button and row click open in new window (December 2025)
5. âœ… **Enhanced Social Media Display**: Added YouTube, Twitter, LinkedIn to public school pages (December 2025)

### Planned Features
1. **Bulk Actions**: Select multiple schools for batch operations
2. **Advanced Filters**: Filter by curriculum, area, tuition range
3. **Export**: Export school list to CSV/Excel
4. **Analytics**: View extraction success rates, performance metrics
5. **Re-run Extraction**: Button to re-extract data for existing schools
6. **Featured Schools**: Mark schools as featured
7. **Notes**: Add internal admin notes to schools

### Performance Improvements
1. **Pagination**: Add pagination for large datasets
2. **Virtual Scrolling**: For tables with 100+ schools
3. **Debounced Search**: Reduce API calls during typing
4. **Cached Results**: Cache search results temporarily

---

## Maintenance

### Regular Tasks

**Daily**:
- Monitor queue for failed extractions
- Review newly added schools
- Publish approved schools

**Weekly**:
- Review extraction success rate
- Check for duplicate schools
- Update school data if needed

**Monthly**:
- Audit all published schools
- Update tuition fees if changed
- Verify contact information

### Troubleshooting

**School not appearing in list**:
1. Check if `active: true`
2. Verify extraction_status is 'completed'
3. Check database directly

**Extraction stuck in queue**:
1. Check server logs for errors
2. Verify API keys are valid
3. Check Supabase connection
4. Restart extraction if needed

**Images not showing**:
1. Verify Supabase Storage bucket exists
2. Check image URLs are valid
3. Verify Vision AI step completed
4. Check CORS settings

---

## Related Documentation

- **School Extraction Pipeline**: See `SCHOOL_EXTRACTION.md`
- **Database Schema**: See `ARCHITECTURE.md`
- **API Documentation**: See `DEVELOPMENT_GUIDE.md`
- **Design System**: See attractions admin for reference pattern

---

## Version History

**v1.2.0** - December 2025
- âœ… Made review page fully editable with form interface
- âœ… Added tabbed interface (Basic Info, Academic, Contact, SEO)
- âœ… Added Save, Publish, and Delete buttons to review page
- âœ… Created PUT API endpoint for updating school data
- âœ… Review links now open in new tabs (both row click and Review button)
- âœ… Enhanced social media display on public pages (added YouTube, Twitter, LinkedIn)
- âœ… Fixed publish endpoint to set active and verified flags

**v1.1.0** - November 22, 2025
- âœ… Added Publish/Unpublish toggle to list page
- âœ… Added Delete functionality with confirmation dialog
- âœ… Conditional Eye/EyeOff icons based on published state
- âœ… Unpublish confirmation dialog (yellow theme)
- âœ… Real-time UI updates after publish/unpublish
- âœ… Delete with image cleanup from Supabase Storage

**v1.0.0** - November 21, 2025
- Initial implementation copied from attractions admin
- All 4 pages functional (list, add, queue, review)
- Purple branding applied
- School-specific fields integrated
- Auto-refresh and real-time updates working
