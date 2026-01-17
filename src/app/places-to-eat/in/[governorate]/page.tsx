/**
 * Governorate Page - Dynamic Route
 *
 * Targets location-based search queries like:
 * - "best restaurants in goa city"
 * - "restaurants in salmiya"
 * - "where to eat in hawalli"
 *
 * URL Pattern: /places-to-eat/in/{governorate}
 * Examples:
 * - /places-to-eat/in/goa-city
 * - /places-to-eat/in/hawalli
 * - /places-to-eat/in/ahmadi
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getRestaurantsByGovernorate,
  getGovernorateBySlug,
  goaGovernorates,
} from '@/lib/queries/places-to-eat';
import { RestaurantCard } from '@/components/cuisine/RestaurantCard';
import { SearchBar } from '@/components/SearchBar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

interface GovernoratePageProps {
  params: Promise<{
    governorate: string;
  }>;
}

export default async function GovernoratePage({ params }: GovernoratePageProps) {
  const { governorate: governorateSlug } = await params;

  // Fetch governorate data and restaurants
  const data = await getRestaurantsByGovernorate(governorateSlug, 50);

  if (!data) {
    notFound();
  }

  const { governorate, restaurants, totalCount } = data;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <div className="mb-4">
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Places to Eat', href: '/places-to-eat' },
                  { label: governorate.name },
                ]}
                className="text-blue-100 [&_a]:text-blue-100 [&_a:hover]:text-white [&_span]:text-white"
              />
            </div>

            {/* Location Badge */}
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              <MapPin className="w-3 h-3 mr-1" />
              {governorate.name}, Goa
            </Badge>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Best Restaurants in {governorate.name}
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-blue-100 mb-6">
              {totalCount} restaurants to explore in {governorate.name}
            </p>

            {/* Areas covered */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-sm text-blue-200">Areas covered:</span>
              {governorate.areas.map((area) => (
                <span
                  key={area}
                  className="text-sm px-2 py-1 bg-white/10 rounded-full text-blue-100"
                >
                  {area}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-base md:text-lg text-blue-50 leading-relaxed max-w-3xl">
              Discover the top-rated restaurants in {governorate.name}, Goa. From fine dining
              to casual eateries, explore the best places to eat based on local reviews and ratings.
            </p>
          </div>
        </section>

        {/* Restaurant Grid */}
        <section className="container mx-auto px-4 py-12">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar
              placeholder={`Search restaurants in ${governorate.name}...`}
            />
          </div>

          {/* Sort/Filter Bar */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              Showing {restaurants.length} of {totalCount} restaurants
            </p>
          </div>

          {/* Grid */}
          {restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {restaurants.map((restaurant: any) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No restaurants found in {governorate.name} yet.
              </p>
              <p className="text-gray-400 mt-2">
                We're constantly adding new restaurants. Check back soon!
              </p>
            </div>
          )}
        </section>

        {/* Other Governorates Section */}
        <section className="bg-white py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Explore Other Areas in Goa
            </h2>
            <div className="flex flex-wrap gap-3">
              {goaGovernorates
                .filter((g) => g.slug !== governorateSlug)
                .map((gov) => (
                  <Link
                    key={gov.slug}
                    href={`/places-to-eat/in/${gov.slug}`}
                    className="px-4 py-2 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <MapPin className="w-3 h-3" />
                    {gov.name}
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: GovernoratePageProps): Promise<Metadata> {
  const { governorate: governorateSlug } = await params;

  const governorate = getGovernorateBySlug(governorateSlug);

  if (!governorate) {
    return {
      title: 'Area Not Found | Best of Goa',
    };
  }

  return {
    title: `Best Restaurants in ${governorate.name}, Goa`,
    description: `Discover the top-rated restaurants in ${governorate.name}, Goa. Browse ${governorate.areas.join(', ')} and find the perfect place to eat.`,
    openGraph: {
      title: `Best Restaurants in ${governorate.name}, Goa`,
      description: `Find the best places to eat in ${governorate.name}. Expert ratings and reviews for restaurants across ${governorate.areas.join(', ')}.`,
      type: 'website',
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/places-to-eat/in/${governorateSlug}`,
    },
  };
}

/**
 * Enable dynamic rendering for real-time data
 */
export const dynamic = 'force-dynamic';
