# Best of Goa - Restaurant Directory Platform

## Project Overview

Best of Goa is a comprehensive directory platform showcasing Goa's finest restaurants, designed to rank #1 in organic search (both traditional and LLM search). The platform provides rich, structured, SEO-optimized content with advanced filtering, real-time updates, and expert-verified recommendations.

## Key Features

### ðŸ˜ï¸ Enhanced Neighborhood System
- **140 total neighborhoods** including traditional areas and major shopping destinations
- **24 major malls** treated as dedicated neighborhoods (The Avenues, Marina Mall, etc.)
- **Address keyword detection** for precise mapping (e.g., "The Avenues Mall" â†’ The Avenues neighborhood)
- **Priority-based mapping**: Mall keywords override general area mappings
- **SEO-optimized URLs**: Each mall gets its own neighborhood page (`/areas/the-avenues/restaurants`)

### ðŸ½ï¸ Comprehensive Restaurant Data
- **Complete restaurant profiles** with photos, menus, reviews, and operational details
- **Multi-source data extraction** from Google Places, websites, and social media
- **AI-powered content generation** for SEO descriptions and FAQs
- **Real-time updates** and data validation

### ðŸ” Advanced Search & Filtering
- **Location-based filtering** by neighborhood, mall, or area
- **Cuisine and category filtering** with multiple selections
- **Feature-based filtering** (parking, wifi, outdoor seating, etc.)
- **Price range filtering** and rating-based sorting

### ðŸ“± Modern Technology Stack
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Supabase** for database and authentication
- **Tailwind CSS** with shadcn/ui components
- **Anthropic Claude** for AI content generation

## Recent Improvements (November 2025)

### ðŸ› Critical Bug Fixes
- âœ… **Fixed Neighborhood Mapping** - Resolved 4 bugs causing 59% of restaurants to be incorrectly assigned to goa-city
- âœ… **Fixed Slug Generation** - All restaurants now get proper location-suffixed slugs (e.g., `brick-pizza-salmiya`)
- âœ… **Fixed Review Sentiment** - AI-generated sentiment now based on actual customer reviews, not generic content
- âœ… **Added Area Variations** - Support for "Shuwaikh Industrial", "Bida'a", and other area name variations
- âœ… **Added Missing Mappings** - Jibla, Naseem, Abu Al Hasaniya now properly mapped

### ðŸ†• New Features
- âœ… **Auto Slug Regeneration** - Slugs automatically fixed after neighborhood assignment
- âœ… **Comprehensive Neighborhood Mapping** - 141 neighborhoods with fuzzy matching and variations
- âœ… **Enhanced Review Analysis** - OpenAI GPT-4o mini analyzes actual customer feedback
- âœ… **Optimized Menu Extraction** - Website-first approach reduces unnecessary API calls

### ðŸ“Š Impact
- **Before:** 6.5% correct neighborhood assignment, 0% compliant slugs
- **After:** 100% correct neighborhood assignment, 100% compliant slugs
- **Fixed:** 43 restaurants with improved review sentiment analysis

ðŸ“– Full details: [Extraction Orchestrator Changelog](EXTRACTION_ORCHESTRATOR_CHANGELOG.md) | [Neighborhood Fix Report](SLUG_AND_NEIGHBORHOOD_FIX_2025_11_11.md)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BOK
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

### Core Tables

#### `restaurants`
Main restaurant data with comprehensive fields:
- Basic info (name, address, phone, website)
- Location data (coordinates, neighborhood_id)
- Operational details (hours, price_level, features)
- Social media links (Instagram, Facebook, Twitter)
- SEO fields (slug, meta_description, keywords)

#### `restaurant_neighborhoods`
Enhanced neighborhood system with 140 locations:
- **Traditional Areas**: Goa City, Salmiya, Hawally, etc.
- **Major Shopping Destinations**: The Avenues, Marina Mall, Al Kout Mall, etc.
- **SEO-optimized**: Each neighborhood gets its own landing page

#### `restaurant_cuisines`, `restaurant_categories`, `restaurant_features`
Reference tables for filtering and categorization.

### Array Relationships (Omar's Pattern)
Many-to-many relationships stored as integer arrays:
- `restaurant_cuisine_ids int4[]`
- `restaurant_category_ids int4[]`
- `restaurant_feature_ids int4[]`

## Data Extraction Pipeline

### Extraction Sources
1. **Apify (Google Places)** - Basic restaurant data, reviews, photos
2. **Firecrawl** - Website content, menus, social media links
3. **Anthropic Claude** - AI-generated SEO content and descriptions

### Enhanced Neighborhood Mapping
```typescript
// Priority 1: Address keywords (malls, landmarks)
"The Avenues Mall, Phase II" â†’ The Avenues (ID: 142)
"Murouj Food Complex, Sahara Club" â†’ Murouj (ID: 8)

// Priority 2: Area field mapping
"Salmiya" â†’ Salmiya (ID: 2)
"Goa City" â†’ Goa City (ID: 1)
```

### Data Processing Steps
1. **Apify Extraction** - Google Places data with comprehensive neighborhood mapping (141 neighborhoods)
2. **Auto Slug Generation** - Automatic slug regeneration with location suffix after neighborhood assignment
3. **Firecrawl General Search** - Social media and contact info
4. **Optimized Menu Extraction** - Website-first approach, then smart search with delivery app filtering
5. **Multi-Stage Social Media Search** - Website â†’ Instagram â†’ Targeted Search
6. **Review Collection** - Google reviews (50 most recent)
7. **AI Sentiment Analysis** - OpenAI GPT-4o mini analyzes actual customer reviews
8. **GPT-4o AI Enhancement** - SEO descriptions, FAQs, cuisine/category suggestions
9. **SEO Metadata Generation** - Meta tags with character validation
10. **Image Extraction & Processing** - Photos analyzed with Claude Vision API, hero image auto-selected
11. **Database Storage** - Structured data with relationships

ðŸ“– See [Extraction Orchestrator Changelog](EXTRACTION_ORCHESTRATOR_CHANGELOG.md) for detailed pipeline documentation.

### Image Processing (Auto Hero Image)
**âœ¨ Automated as of November 2025**

The image extractor automatically selects and sets the `hero_image` field:
- **Claude Vision API Analysis** - Each image scored on quality, composition, and food appeal (0-100)
- **Smart Selection** - Image with highest hero_score marked as primary
- **Auto-Population** - Hero image URL automatically set during extraction
- **No Manual Work** - Future extractions require no migration scripts

**Benefits:**
- âœ… All restaurant cards display images immediately
- âœ… Best photo automatically chosen based on AI analysis
- âœ… Consistent hero image selection across platform

ðŸ“– See [Image Extractor Auto Hero Documentation](IMAGE_EXTRACTOR_HERO_IMAGE_AUTO.md) for implementation details.

## API Endpoints

### Restaurant Management
- `GET /api/restaurants` - List restaurants with filtering
- `GET /api/restaurants/[slug]` - Get restaurant details
- `POST /api/admin/start-extraction` - Start new extraction
- `GET /api/admin/extraction-status/[jobId]` - Check extraction status

### Neighborhood Management
- `GET /api/neighborhoods` - List all neighborhoods
- `GET /api/neighborhoods/[slug]/restaurants` - Get restaurants by neighborhood

## Admin Workflows

### Restaurant Extraction
1. **Add Restaurant** - Enter name and location
2. **Start Extraction** - Automated data collection
3. **Review Results** - Verify and edit extracted data
4. **Publish** - Make restaurant live on the platform

### Neighborhood Management
- **View All Neighborhoods** - 140 total locations
- **Mall Neighborhoods** - 24 major shopping destinations
- **Traditional Areas** - 116 Goai neighborhoods
- **SEO Optimization** - Each neighborhood gets its own page

## SEO Features

### URL Structure
```
/restaurants/[slug]                    // Individual restaurant
/areas/[neighborhood-slug]/restaurants // Neighborhood pages
/cuisines/[cuisine-slug]/restaurants   // Cuisine pages
/categories/[category-slug]/restaurants // Category pages
```

#### Slug Generation
Restaurant slugs follow a simplified format: **`restaurant-name + area/neighborhood`**

**Features:**
- âœ… **Duplicate detection** - Prevents adding location if already in restaurant name
- âœ… **Spelling normalization** - Handles variations (Morouj/Murouj/Mrouj)
- âœ… **Mall name detection** - Detects malls in names (The Warehouse Mall, The Avenues)
- âœ… **Multi-word locations** - Handles complex location names
- âœ… **Neighborhood priority** - Uses neighborhood over area when available
- ðŸ”„ **Automatic regeneration** - Self-healing system fixes slugs missing location suffix after extraction (Nov 2025)

**Examples:**
- `bazaar-gurme-salwa` - Simple name + area
- `ubon-murouj` - Location already in name (no duplicate)
- `the-grove-the-warehouse-mall` - Mall already in name (no duplicate)
- `lazy-cat-morouj` - Neighborhood prioritized over area
- `huqqabaz-bidaa` - Automatically regenerated after extraction

ðŸ“– See [Slug Generation Documentation](SLUG_GENERATION.md) and [Slug Regeneration Implementation](SLUG_REGENERATION_IMPLEMENTATION.md) for complete details.

### Schema.org Markup
- Restaurant structured data
- FAQPage markup for common questions
- LocalBusiness markup for location data
- Review markup for customer feedback

### Content Optimization
- AI-generated descriptions and FAQs
- Keyword-optimized meta descriptions
- Image alt tags and captions
- Internal linking between related content

## Development

### Project Structure
```
src/
â”œâ”€â”€ app/                    # Next.js App Router
â”‚   â”œâ”€â”€ api/               # API routes
â”‚   â”œâ”€â”€ admin/             # Admin interface
â”‚   â””â”€â”€ (public)/          # Public pages
â”œâ”€â”€ lib/                   # Shared utilities
â”‚   â”œâ”€â”€ services/          # Business logic
â”‚   â”œâ”€â”€ schema/            # Database types
â”‚   â””â”€â”€ utils/             # Helper functions
â””â”€â”€ components/            # React components
    â”œâ”€â”€ ui/                # shadcn/ui components
    â””â”€â”€ custom/            # Custom components
```

### Key Files
- `src/lib/services/extraction-orchestrator.ts` - Main extraction logic
- `src/lib/services/anthropic-client.ts` - AI content generation
- `src/lib/utils/slug-generator.ts` - SEO-friendly URL generation (see [Slug Generation Docs](SLUG_GENERATION.md))
- `src/lib/schema/types.ts` - TypeScript interfaces

### Scripts
- `bin/run-enhanced-migration.js` - Update neighborhood mappings
- `bin/test-neighborhood-linking.js` - Test neighborhood system
- `bin/test-mall-neighborhoods.js` - Test mall neighborhood detection

## Testing

### Neighborhood System Tests
```bash
# Test comprehensive neighborhood linking
node bin/test-neighborhood-linking.js

# Test mall neighborhood detection
node bin/test-mall-neighborhoods.js

# Test Murouj restaurant mapping
node bin/test-murouj-mapping.js
```

### Data Validation
- **100% neighborhood population rate** - All restaurants have neighborhood_id
- **Address keyword detection** - Malls correctly mapped from addresses
- **Spelling variations** - Both "Souk" and "Souq" supported
- **Priority mapping** - Specific mall names override general areas

## Deployment

### Environment Setup
1. **Supabase Project** - Database and authentication
2. **Vercel Deployment** - Frontend hosting
3. **Environment Variables** - API keys and database credentials

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Neighborhood data populated
- [ ] API endpoints tested
- [ ] SEO meta tags verified

## Contributing

### Development Guidelines
1. **TypeScript** - All code must be properly typed
2. **Testing** - Write tests for new features
3. **Documentation** - Update docs for API changes
4. **Code Style** - Follow existing patterns and conventions

### Pull Request Process
1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit pull request with description

## Support

### Documentation
- [Database Schema](restaurant-data-extraction-spec.md)
- [Extraction Orchestrator Changelog](EXTRACTION_ORCHESTRATOR_CHANGELOG.md) - **NEW** - Detailed pipeline changes and bug fixes
- [Neighborhood & Slug Fix Report](SLUG_AND_NEIGHBORHOOD_FIX_2025_11_11.md) - Nov 2025 critical fixes
- [Neighborhood Reference](GOA_NEIGHBORHOODS_REFERENCE.md)
- [Slug Generation System](SLUG_GENERATION.md) - Complete guide to restaurant slug generation
- [API Documentation](API_DOCUMENTATION.md)
- [Admin Workflow](ADMIN_WORKFLOW.md)

### Troubleshooting
- Check extraction logs in admin interface
- Verify neighborhood mappings with test scripts
- Review database constraints and relationships
- Test API endpoints with provided examples

---

**Best of Goa** - Showcasing Goa's finest restaurants with precision and care.

*Built with Next.js, Supabase, and Anthropic Claude*

