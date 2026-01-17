import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/SearchBar'
import { FitnessCard } from '@/components/fitness/FitnessCard'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import {
  getTopRatedFitnessPlaces,
  getWomenOnlyFitnessPlaces,
  getAllFitnessTypesWithCounts,
  getAreasWithStats,
  getTotalFitnessCount,
  getAllFitnessPlacesForListing
} from '@/lib/queries/things-to-do-fitness'
import { MapPin, Users } from 'lucide-react'
import { getFitnessIcon } from '@/lib/utils/fitness-icon-mapper'

export const metadata: Metadata = {
  title: 'Best Fitness Centers & Gyms in Goa | Things to Do',
  description: 'Discover Goa\'s best gyms, yoga studios, CrossFit boxes & women-only fitness centers. Top-rated places across all areas.',
  openGraph: {
    title: 'Best Fitness Centers & Gyms in Goa | Things to Do',
    description: 'Discover Goa\'s best gyms, yoga studios, CrossFit & women-only fitness centers.',
    type: 'website',
    locale: 'en_KW',
    siteName: 'Best of Goa',
    url: 'https://www.bestofgoa.com/things-to-do/fitness',
    images: [
      {
        url: 'https://www.bestofgoa.com/images/categories/fitness.jpg',
        width: 1200,
        height: 630,
        alt: 'Best Fitness Centers & Gyms in Goa',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Fitness Centers & Gyms in Goa",
    description: "Discover Goa's best gyms, yoga studios, CrossFit & fitness centers.",
    images: ['https://www.bestofgoa.com/images/categories/fitness.jpg'],
  },
  alternates: {
    canonical: 'https://www.bestofgoa.com/things-to-do/fitness'
  }
}

// Valid fitness type slugs for redirect
const validFitnessTypeSlugs = [
  'ladies-only', 'gym', 'yoga', 'crossfit', 'pilates', 'martial-arts',
  'swimming', 'personal-training', 'dance', 'cycling', 'sports-club', 'boxing'
]

interface PageProps {
  searchParams: Promise<{ type?: string; gender?: string }>
}

export default async function FitnessPage({ searchParams }: PageProps) {
  const params = await searchParams

  // Redirect ?type=X or ?gender=X to /types/X for SEO
  if (params.type && validFitnessTypeSlugs.includes(params.type.toLowerCase())) {
    redirect(`/things-to-do/fitness/types/${params.type.toLowerCase()}`)
  }
  if (params.gender === 'women-only' || params.gender === 'ladies-only') {
    redirect('/things-to-do/fitness/types/ladies-only')
  }

  // Fetch all data in parallel
  const [topRated, womenOnly, fitnessTypes, areas, totalFitness, allFitness] = await Promise.all([
    getTopRatedFitnessPlaces(8),
    getWomenOnlyFitnessPlaces(8),
    getAllFitnessTypesWithCounts(),
    getAreasWithStats(),
    getTotalFitnessCount(),
    getAllFitnessPlacesForListing()
  ])

  // Safety checks - ensure arrays exist
  const safeTopRated = topRated || []
  const safeWomenOnly = womenOnly || []
  const safeFitnessTypes = fitnessTypes || []
  const safeAreas = areas || []
  const safeAllFitness = allFitness || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Things to Do', href: '/things-to-do' }, { label: 'Fitness' }]} />
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
              Discover the{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Best Fitness Centers
              </span>{' '}
              in Goa
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              From gyms and yoga studios to CrossFit boxes and martial arts dojos.
              Explore {totalFitness}+ fitness places across Goa.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <SearchBar
                type="fitness"
                placeholder="Search fitness centers by name, area, or type..."
              />
            </div>

            {/* Popular Searches */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <span className="text-sm text-slate-500">Popular:</span>
              {['Gym', 'Yoga', 'CrossFit', 'Women Only', 'Salmiya'].map((term) => (
                <Link key={term} href={`/things-to-do/fitness?q=${term}`}>
                  <Button variant="ghost" size="sm" className="rounded-full text-xs h-7">
                    {term}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Top Rated Section */}
      {safeTopRated.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-700 border-blue-200">
                Featured
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Top Rated Fitness Centers
              </h2>
              <p className="text-slate-600 mt-2">Highest rated fitness places in Goa</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href="/things-to-do/fitness?sort=rating">View All â†’</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {safeTopRated.map((fitnessPlace) => (
              <FitnessCard key={fitnessPlace.id} fitnessPlace={fitnessPlace} />
            ))}
          </div>

          {/* Mobile View All Button */}
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link href="/things-to-do/fitness?sort=rating">View All Top Rated â†’</Link>
            </Button>
          </div>
        </section>
      )}

      {/* Browse by Area */}
      {safeAreas.length > 0 && (
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-white/30">
                Explore Goa
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Best Fitness Centers by Area
              </h2>
              <p className="text-lg text-blue-100 max-w-2xl mx-auto">
                Find gyms, studios, and fitness centers near you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {safeAreas.map((area) => (
                <Link
                  key={area.slug}
                  href={`/things-to-do/fitness?area=${area.slug}`}
                  className="group"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors">
                          {area.name}
                        </h3>
                        <p className="text-sm text-blue-200 mt-1">
                          {area.fitness_count} fitness {area.fitness_count === 1 ? 'place' : 'places'}
                        </p>
                      </div>
                      <MapPin className="w-5 h-5 text-blue-300" />
                    </div>
                    {area.avg_rating > 0 && (
                      <div className="flex items-center gap-1 text-yellow-300">
                        <span className="text-sm">â˜…</span>
                        <span className="text-sm font-medium">{area.avg_rating.toFixed(1)} avg rating</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by Fitness Type */}
      {safeFitnessTypes.length > 0 && (
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-700 border-blue-200">
                Categories
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Browse by Fitness Type
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                From traditional gyms to specialized studios
              </p>
            </div>

            {/* Fitness Type Grid - 4 columns consistently */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 mb-8">
              {safeFitnessTypes.map((type) => {
                const IconComponent = getFitnessIcon(type.icon)
                return (
                  <Link key={type.slug} href={`/things-to-do/fitness/types/${type.slug}`} className="group">
                    <div className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 bg-white">
                      <IconComponent className="w-8 h-8 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-semibold text-gray-900 text-center group-hover:text-blue-600 transition-colors">
                        {type.name}
                      </span>
                      {type.fitness_count > 0 && (
                        <span className="text-xs text-gray-500 mt-1">
                          {type.fitness_count} {type.fitness_count === 1 ? 'place' : 'places'}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* View All Types Button */}
            <div className="text-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/things-to-do/fitness?view=all-types">View All Types</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Women-Only Section */}
      {safeWomenOnly.length > 0 && (
        <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-3 bg-pink-100 text-pink-700 border-pink-200">
                For Women
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Women-Only Fitness Centers
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Exclusive fitness spaces designed for women
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {safeWomenOnly.map((fitnessPlace) => (
                <FitnessCard key={fitnessPlace.id} fitnessPlace={fitnessPlace} />
              ))}
            </div>

            {/* View All Women-Only Button */}
            <div className="mt-8 text-center">
              <Button variant="outline" asChild>
                <Link href="/things-to-do/fitness/types/ladies-only">View All Women-Only â†’</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* All Fitness Centers - Comprehensive Directory */}
      {safeAllFitness.length > 0 && (
        <section className="bg-white py-16 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-3 bg-slate-100 text-slate-700 border-slate-200">
                Complete Directory
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                All Fitness Centers in Goa
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Browse our complete directory of {safeAllFitness.length} fitness centers across Goa
              </p>
            </div>

            {/* Compact Grid - All Fitness Places */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {safeAllFitness.map((fitness) => (
                <Link
                  key={fitness.id}
                  href={`/things-to-do/fitness/${fitness.slug}`}
                  className="group p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                >
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-1">
                    {fitness.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{fitness.area}</p>
                  {(fitness.bok_score || fitness.google_rating) && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-yellow-600">
                      <span>â˜…</span>
                      <span>{(fitness.bok_score || fitness.google_rating)?.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Can't Find Your Gym?</h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            We're constantly adding new fitness centers. Know a great place we should feature?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/application">Suggest a Fitness Place</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              asChild
            >
              <Link href="/things-to-do/fitness?view=all">
                Browse All {totalFitness}+ Fitness Centers
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
