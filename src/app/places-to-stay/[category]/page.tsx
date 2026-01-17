/**
 * Hotel Category Page - Dynamic Route
 *
 * Targets commercial search queries like:
 * - "best luxury hotels goa"
 * - "budget hotels goa city"
 * - "5 star resorts goa"
 *
 * URL Pattern: /places-to-stay/{category}
 * Examples:
 * - /places-to-stay/luxury-hotels
 * - /places-to-stay/budget-hotels
 * - /places-to-stay/resorts
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getHotelsByCategory, getCategoryBySlug } from '@/lib/queries/hotel-category-pages';
import {
  generateCollectionPageSchema,
  generateCollectionKeywords,
} from '@/lib/schema/generators/collection-page';
import { HotelCard } from '@/components/hotel/HotelCard';
import { SearchBar } from '@/components/SearchBar';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function HotelCategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;

  // Fetch category data and hotels
  const category = await getCategoryBySlug(categorySlug);
  const hotels = await getHotelsByCategory(categorySlug, 50);

  if (!category) {
    notFound();
  }

  const totalCount = hotels?.length || 0;

  // Generate SEO keywords for this category
  const keywords = generateCollectionKeywords(category.name, [
    'Goa',
    'Goa City',
    'Salmiya',
    'Fintas',
    'Mangaf',
    'Hawally',
  ]);

  // Generate CollectionPage schema with ItemList
  const schema = generateCollectionPageSchema({
    title: `Best ${category.name} Hotels in Goa`,
    description: `Discover the top-rated ${category.name.toLowerCase()} hotels in Goa. Expert reviews, ratings, and authentic recommendations from travelers.`,
    slug: `/places-to-stay/${categorySlug}`,
    keywords,
    cuisineOrCategory: `${category.name} Hotels`,
    breadcrumbName: `${category.name} Hotels`,
    restaurants: hotels.map((h: any) => ({
      slug: h.slug,
      name: h.name,
      hero_image: h.hero_image,
      address: h.address,
      area: h.area,
      overall_rating: h.google_rating,
      total_reviews_aggregated: h.google_review_count,
      cuisines: h.categories,
    })),
  });

  return (
    <>
      {/* Schema.org Structured Data - CollectionPage + ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema, null, 2),
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="text-sm mb-4 text-blue-100">
              <a href="/" className="hover:text-white">
                Home
              </a>
              <span className="mx-2">/</span>
              <a href="/places-to-stay" className="hover:text-white">
                Places to Stay
              </a>
              <span className="mx-2">/</span>
              <span className="text-white font-medium">{category.name}</span>
            </nav>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Best {category.name} Hotels in Goa
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-blue-100 mb-6">
              {totalCount} top-rated {category.name.toLowerCase()} hotels in Goa
            </p>

            {/* Description */}
            {category.description && (
              <p className="text-base md:text-lg text-blue-50 leading-relaxed max-w-3xl">
                {category.description}
              </p>
            )}
          </div>
        </section>

        {/* Hotel Grid */}
        <section className="container mx-auto px-4 py-12">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar
              placeholder={`Search ${category.name.toLowerCase()}...`}
            />
          </div>

          {/* Sort/Filter Bar */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              Showing {hotels.length} of {totalCount} hotels
            </p>
            {/* TODO: Add sort dropdown (Rating, Price, Name) */}
          </div>

          {/* Grid */}
          {hotels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {hotels.map((hotel: any) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No {category.name.toLowerCase()} found.
              </p>
            </div>
          )}
        </section>

        {/* FAQ Section (Future Enhancement) */}
        {/* TODO: Add FAQ schema for queries like "best luxury hotels goa?" */}

        {/* Neighborhood Breakdown (Future Enhancement) */}
        {/* TODO: Add sections like "Best Luxury Hotels in Salmiya", etc. */}
      </div>
    </>
  );
}

/**
 * Generate static params for popular hotel categories
 * This pre-renders pages at build time for SEO
 * Slugs must match hotel_categories table (SEO-optimized with -hotels suffix)
 */
export async function generateStaticParams() {
  return [
    { category: 'luxury-hotels' },
    { category: 'business-hotels' },
    { category: 'family-hotels' },
    { category: 'boutique-hotels' },
    { category: 'resort-hotels' },
    { category: 'budget-hotels' },
  ];
}

/**
 * Generate metadata for SEO
 * This creates the page title, description, and keywords meta tags
 */
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;

  const category = await getCategoryBySlug(categorySlug);
  const hotels = await getHotelsByCategory(categorySlug, 50);

  if (!category) {
    return {
      title: 'Category Not Found | Best of Goa',
    };
  }

  const totalCount = hotels?.length || 0;

  // Generate comprehensive keywords
  const keywords = generateCollectionKeywords(category.name, [
    'Goa',
    'accommodation',
    'stay',
    'booking',
  ]);

  return {
    title: `Best ${category.name} Hotels in Goa (${totalCount} Options)`,
    description: `Discover the top ${totalCount} ${category.name.toLowerCase()} hotels in Goa with expert reviews, ratings, and authentic traveler recommendations. Find the perfect accommodation today.`,
    keywords: keywords.join(', '),
    openGraph: {
      title: `Best ${category.name} Hotels in Goa`,
      description: `Explore ${totalCount} top-rated ${category.name.toLowerCase()} hotels in Goa`,
      type: 'website',
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/places-to-stay/${categorySlug}`,
    },
  };
}

/**
 * Enable dynamic rendering for real-time data
 * This ensures the page always shows the latest hotel data
 */
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour
