/**
 * Fitness Type Category Page - Dynamic Route
 *
 * Targets commercial search queries like:
 * - "best gyms goa"
 * - "yoga studios goa city"
 * - "crossfit boxes goa"
 *
 * URL Pattern: /things-to-do/fitness/types/{type}
 * Examples:
 * - /things-to-do/fitness/types/gym
 * - /things-to-do/fitness/types/yoga
 * - /things-to-do/fitness/types/crossfit
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getFitnessPlacesByType } from '@/lib/queries/things-to-do-fitness'
import {
  generateCollectionPageSchema,
  generateCollectionKeywords,
} from '@/lib/schema/generators/collection-page'
import { FitnessCard } from '@/components/fitness/FitnessCard'
import { SearchBar } from '@/components/SearchBar'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getFitnessIcon } from '@/lib/utils/fitness-icon-mapper'

interface FitnessTypePageProps {
  params: Promise<{
    type: string
  }>
}

export default async function FitnessTypePage({ params }: FitnessTypePageProps) {
  const { type: typeSlug } = await params

  // Fetch category data and fitness places
  const data = await getFitnessPlacesByType(typeSlug, 50)

  if (!data) {
    notFound()
  }

  const { category, places, totalCount } = data

  // Generate SEO keywords for this fitness type
  const keywords = generateCollectionKeywords(category.name, [
    'Goa',
    'Goa City',
    'Salmiya',
    'Hawally',
    'best',
    'top rated',
    'fitness centers',
  ])

  // Generate CollectionPage schema with ItemList
  const schema = generateCollectionPageSchema({
    title: `Best ${category.name} in Goa`,
    description: `Find the best ${category.name.toLowerCase()} fitness centers in Goa. ${totalCount} places with expert ratings and reviews.`,
    slug: `/things-to-do/fitness/types/${typeSlug}`,
    keywords,
    cuisineOrCategory: category.name,
    breadcrumbName: category.name,
    restaurants: places.map((p) => ({
      slug: p.slug,
      name: p.name,
      hero_image: p.hero_image,
      address: p.address || p.area,
      area: p.area,
      overall_rating: p.bok_score,
      total_reviews_aggregated: p.total_reviews_aggregated,
      cuisines: [],
    })),
  })

  const IconComponent = getFitnessIcon(category.icon)

  return (
    <>
      {/* Schema.org Structured Data - CollectionPage + ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema, null, 2),
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 pt-6">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Things to Do', href: '/things-to-do' },
              { label: 'Fitness', href: '/things-to-do/fitness' },
              { label: category.name },
            ]}
          />
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            {/* Back Button */}
            <Button variant="ghost" asChild className="mb-6 text-white hover:bg-white/20">
              <Link href="/things-to-do/fitness" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to All Fitness Centers
              </Link>
            </Button>

            {/* Category Icon and Title */}
            <div className="flex items-center gap-4 mb-4">
              {IconComponent && (
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <IconComponent className="w-8 h-8 md:w-10 md:h-10" />
                </div>
              )}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Best {category.name} in Goa
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-blue-100 mb-6">
              {totalCount} top-rated {category.name.toLowerCase()} {totalCount === 1 ? 'center' : 'centers'}
            </p>

            {/* Description */}
            {category.description && (
              <p className="text-base md:text-lg text-blue-50 leading-relaxed max-w-3xl">
                {category.description}
              </p>
            )}
          </div>
        </section>

        {/* Fitness Places Grid */}
        <section className="container mx-auto px-4 py-12">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar placeholder={`Search ${category.name.toLowerCase()} centers...`} />
          </div>

          {/* Sort/Filter Bar */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              Showing {places.length} of {totalCount} {category.name.toLowerCase()} {places.length === 1 ? 'center' : 'centers'}
            </p>
            {/* TODO: Add sort dropdown (Rating, Reviews, Name) */}
          </div>

          {/* Grid */}
          {places.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {places.map((place) => (
                <FitnessCard key={place.id} fitnessPlace={place} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No {category.name.toLowerCase()} centers found.
              </p>
              <p className="text-gray-400 mt-2">
                We're constantly adding new fitness centers. Check back soon!
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  )
}

/**
 * Generate metadata for SEO
 * This creates the page title, description, and keywords meta tags
 */
export async function generateMetadata({
  params,
}: FitnessTypePageProps): Promise<Metadata> {
  const { type: typeSlug } = await params

  const data = await getFitnessPlacesByType(typeSlug, 50)

  if (!data) {
    return {
      title: 'Fitness Type Not Found | Best of Goa',
    }
  }

  const { category, totalCount } = data

  // Generate comprehensive keywords
  const keywords = generateCollectionKeywords(category.name, [
    'Goa',
    'Goa City',
    'Salmiya',
    'Hawally',
    'best',
    'top rated',
    'fitness centers',
  ])

  return {
    title: `Best ${category.name} in Goa (${totalCount} Options)`,
    description: `Discover the top ${totalCount} ${category.name.toLowerCase()} fitness centers in Goa with expert reviews, ratings, and authentic local recommendations. Find the perfect fitness experience today.`,
    keywords: keywords.join(', '),
    openGraph: {
      title: `Best ${category.name} in Goa`,
      description: `Explore ${totalCount} top-rated ${category.name.toLowerCase()} fitness centers in Goa`,
      type: 'website',
      locale: 'en_KW',
      siteName: 'Best of Goa',
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/things-to-do/fitness/types/${typeSlug}`,
    },
  }
}

/**
 * Enable dynamic rendering for real-time data
 * This ensures the page always shows the latest fitness place data
 */
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

