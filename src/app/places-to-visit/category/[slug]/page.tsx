/**
 * Attraction Category Page - Dynamic Route
 *
 * Targets commercial search queries like:
 * - "museums in goa"
 * - "beaches in goa"
 * - "entertainment in goa"
 *
 * URL Pattern: /places-to-visit/category/{slug}
 * Examples:
 * - /places-to-visit/category/museums
 * - /places-to-visit/category/beaches
 * - /places-to-visit/category/entertainment
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAttractionsByCategorySlug, getAllCategoriesWithCounts } from '@/lib/queries/places-to-visit';
import {
  generateCollectionPageSchema,
  generateCollectionKeywords,
} from '@/lib/schema/generators/collection-page';
import { AttractionCard } from '@/components/attraction/AttractionCard';
import { SearchBar } from '@/components/SearchBar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import Link from 'next/link';
import {
  Building2,
  TreePine,
  Landmark,
  Sparkles,
  Drama,
  Leaf,
  ShoppingBag,
  Clock,
  Umbrella,
  MoonStar,
  MapPin,
  LucideIcon,
} from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Category icon mapping
const categoryIcons: Record<string, LucideIcon> = {
  museum: Building2,
  museums: Building2,
  park: TreePine,
  parks: TreePine,
  landmark: Landmark,
  landmarks: Landmark,
  entertainment: Sparkles,
  cultural: Drama,
  nature: Leaf,
  shopping: ShoppingBag,
  historical: Clock,
  beach: Umbrella,
  beaches: Umbrella,
  religious: MoonStar,
};

// SEO-friendly category definitions with plural forms
const categoryMeta: Record<string, {
  name: string;
  plural: string;
  dbSlug: string; // The slug used in database
  description: string;
  keywords: string[]
}> = {
  museums: {
    name: 'Museum',
    plural: 'Museums',
    dbSlug: 'museum',
    description: 'Explore Goa\'s rich cultural heritage through world-class museums featuring art, history, science, and Goai traditions.',
    keywords: ['museums', 'art gallery', 'exhibitions', 'cultural heritage', 'history museum'],
  },
  beaches: {
    name: 'Beach',
    plural: 'Beaches',
    dbSlug: 'beach',
    description: 'Discover Goa\'s beautiful beaches and coastal spots perfect for swimming, relaxation, and water activities.',
    keywords: ['beaches', 'seaside', 'swimming', 'coastal', 'waterfront'],
  },
  entertainment: {
    name: 'Entertainment',
    plural: 'Entertainment Venues',
    dbSlug: 'entertainment',
    description: 'Find the best entertainment venues in Goa - theme parks, arcades, bowling, cinema, and family fun centers.',
    keywords: ['entertainment', 'theme parks', 'arcades', 'bowling', 'cinema', 'family fun'],
  },
  parks: {
    name: 'Park',
    plural: 'Parks',
    dbSlug: 'park',
    description: 'Discover Goa\'s beautiful parks and green spaces perfect for picnics, jogging, and outdoor activities.',
    keywords: ['parks', 'gardens', 'outdoor', 'picnic spots', 'green spaces'],
  },
  landmarks: {
    name: 'Landmark',
    plural: 'Landmarks',
    dbSlug: 'landmark',
    description: 'Visit Goa\'s iconic landmarks and architectural marvels including Goa Towers, Liberation Tower, and more.',
    keywords: ['landmarks', 'monuments', 'iconic', 'architecture', 'sightseeing'],
  },
  cultural: {
    name: 'Cultural',
    plural: 'Cultural Attractions',
    dbSlug: 'cultural',
    description: 'Experience Goa\'s vibrant cultural scene through art centers, heritage villages, and traditional markets.',
    keywords: ['cultural', 'heritage', 'art centers', 'traditional', 'souks'],
  },
  nature: {
    name: 'Nature',
    plural: 'Nature Attractions',
    dbSlug: 'nature',
    description: 'Explore Goa\'s natural beauty - nature reserves, desert experiences, and wildlife sanctuaries.',
    keywords: ['nature', 'wildlife', 'reserves', 'desert', 'outdoor activities'],
  },
  historical: {
    name: 'Historical',
    plural: 'Historical Sites',
    dbSlug: 'historical',
    description: 'Step back in time at Goa\'s historical sites - ancient forts, old souks, and heritage landmarks.',
    keywords: ['historical', 'ancient', 'forts', 'heritage', 'old goa'],
  },
  religious: {
    name: 'Religious',
    plural: 'Religious Sites',
    dbSlug: 'religious',
    description: 'Visit Goa\'s mosques and religious sites showcasing beautiful Islamic architecture.',
    keywords: ['mosques', 'religious sites', 'islamic architecture', 'worship'],
  },
  shopping: {
    name: 'Shopping',
    plural: 'Shopping Destinations',
    dbSlug: 'shopping',
    description: 'Discover Goa\'s shopping attractions from traditional souks to modern malls.',
    keywords: ['shopping', 'souks', 'markets', 'retail', 'bazaars'],
  },
};

export default async function AttractionCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  // Check if this is a valid category
  const categoryInfo = categoryMeta[slug];
  if (!categoryInfo) {
    notFound();
  }

  // Fetch attractions with this category using the database slug
  const attractions = await getAttractionsByCategorySlug(categoryInfo.dbSlug, 50);
  const totalCount = attractions?.length || 0;

  const IconComponent = categoryIcons[slug] || MapPin;

  // Generate SEO keywords
  const keywords = generateCollectionKeywords(categoryInfo.plural, [
    'Goa',
    'Goa City',
    'things to do',
    'places to visit',
    ...categoryInfo.keywords,
  ]);

  // Generate CollectionPage schema
  const schema = generateCollectionPageSchema({
    title: `Best ${categoryInfo.plural} in Goa`,
    description: categoryInfo.description,
    slug: `/places-to-visit/category/${slug}`,
    keywords,
    cuisineOrCategory: categoryInfo.plural,
    breadcrumbName: categoryInfo.plural,
    restaurants: (attractions || []).map((a: any) => ({
      slug: a.slug,
      name: a.name,
      hero_image: a.hero_image,
      address: a.area,
      area: a.area,
      overall_rating: a.bok_score,
      total_reviews_aggregated: a.total_reviews_aggregated,
      cuisines: a.categories?.map((c: any) => c.name) || [],
    })),
  });

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema, null, 2),
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-6">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Places to Visit', href: '/places-to-visit' },
              { label: categoryInfo.plural },
            ]}
          />
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            {/* Category Icon and Title */}
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <IconComponent className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Best {categoryInfo.plural} in Goa
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-purple-100 mb-6">
              {totalCount} top-rated {categoryInfo.plural.toLowerCase()} to explore
            </p>

            {/* Description */}
            <p className="text-base md:text-lg text-purple-50 leading-relaxed max-w-3xl">
              {categoryInfo.description}
            </p>
          </div>
        </section>

        {/* Attractions Grid */}
        <section className="container mx-auto px-4 py-12">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar placeholder={`Search ${categoryInfo.plural.toLowerCase()}...`} type="attractions" />
          </div>

          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              Showing {attractions?.length || 0} of {totalCount} {categoryInfo.plural.toLowerCase()}
            </p>
            <Link
              href="/places-to-visit"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              View All Attractions
            </Link>
          </div>

          {/* Grid */}
          {attractions && attractions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {attractions.map((attraction: any) => (
                <AttractionCard key={attraction.id} attraction={attraction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No {categoryInfo.plural.toLowerCase()} found.
              </p>
              <p className="text-gray-400 mt-2">
                Check back soon as we continue adding more attractions.
              </p>
            </div>
          )}
        </section>

        {/* Related Categories */}
        <section className="container mx-auto px-4 py-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Other Categories</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(categoryMeta)
              .filter(([s]) => s !== slug)
              .map(([s, info]) => {
                const Icon = categoryIcons[s] || MapPin;
                return (
                  <Link
                    key={s}
                    href={`/places-to-visit/category/${s}`}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {info.plural}
                  </Link>
                );
              })}
          </div>
        </section>
      </div>
    </>
  );
}

/**
 * Generate static params for attraction categories
 */
export async function generateStaticParams() {
  return Object.keys(categoryMeta).map((slug) => ({ slug }));
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  const categoryInfo = categoryMeta[slug];
  if (!categoryInfo) {
    return {
      title: 'Category Not Found',
    };
  }

  const attractions = await getAttractionsByCategorySlug(categoryInfo.dbSlug, 50);
  const totalCount = attractions?.length || 0;

  // Generate keywords
  const keywords = [
    `${categoryInfo.plural.toLowerCase()} in goa`,
    ...categoryInfo.keywords.map((k) => `${k} goa`),
    'things to do goa',
    'places to visit goa',
  ];

  return {
    title: `Best ${categoryInfo.plural} in Goa (${totalCount} Places)`,
    description: `Discover ${totalCount} top-rated ${categoryInfo.plural.toLowerCase()} in Goa. ${categoryInfo.description}`,
    keywords: keywords.join(', '),
    openGraph: {
      title: `Best ${categoryInfo.plural} in Goa`,
      description: `Explore ${totalCount} top-rated ${categoryInfo.plural.toLowerCase()} in Goa`,
      type: 'website',
      locale: 'en_KW',
      siteName: 'Best of Goa',
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/places-to-visit/category/${slug}`,
    },
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600;
