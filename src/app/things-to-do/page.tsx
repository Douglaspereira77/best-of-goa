import { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/SearchBar'
import { FitnessCard } from '@/components/fitness/FitnessCard'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import {
  getTopRatedFitnessPlaces,
  getTotalFitnessCount
} from '@/lib/queries/things-to-do-fitness'
import { Dumbbell, ArrowRight, ShoppingBag, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Best Things to Do in Goa | Activities',
  description: 'Discover the best things to do in Goa. From fitness centers and gyms to entertainment venues and activities, explore top-rated experiences across Goa.',
  openGraph: {
    title: 'Best Things to Do in Goa | Activities & Experiences',
    description: 'Discover the best things to do in Goa. From fitness centers and gyms to entertainment venues and activities, explore top-rated experiences across Goa.',
    type: 'website',
    locale: 'en_KW',
    siteName: 'Best of Goa'
  },
  alternates: {
    canonical: 'https://www.bestofgoa.com/things-to-do'
  }
}

export default async function ThingsToDoPage() {
  // Fetch featured data
  const [topRatedFitness, totalFitness] = await Promise.all([
    getTopRatedFitnessPlaces(8),
    getTotalFitnessCount()
  ])

  // Safety checks
  const safeTopRatedFitness = topRatedFitness || []

  // Things to Do Categories (expandable for future categories)
  const categories = [
    {
      name: 'Fitness',
      slug: 'fitness',
      icon: Dumbbell,
      count: totalFitness,
      description: 'Gyms, yoga studios, CrossFit boxes & more',
      color: 'from-teal-500 to-cyan-500',
      href: '/things-to-do/fitness'
    },
    {
      name: 'Places to Shop',
      slug: 'places-to-shop',
      icon: ShoppingBag,
      count: 0,
      description: 'Shopping malls, markets & retail destinations',
      color: 'from-purple-500 to-pink-500',
      href: '/places-to-shop'
    },
    {
      name: 'Places to Visit',
      slug: 'places-to-visit',
      icon: MapPin,
      count: 0,
      description: 'Attractions, landmarks & cultural sites',
      color: 'from-blue-500 to-cyan-500',
      href: '/places-to-visit'
    }
    // Future categories can be added here:
    // {
    //   name: 'Entertainment',
    //   slug: 'entertainment',
    //   icon: Sparkles,
    //   count: 0,
    //   description: 'Cinemas, arcades, escape rooms & more',
    //   color: 'from-purple-500 to-pink-500',
    //   href: '/things-to-do/entertainment'
    // }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Things to Do' }]} />
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
              Discover the{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Best Things to Do
              </span>{' '}
              in Goa
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              From fitness centers to entertainment venues, explore top-rated activities and experiences across Goa.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <SearchBar
                placeholder="Search fitness centers by name, area, or type..."
                type="fitness"
              />
            </div>

            {/* Popular Searches */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <span className="text-sm text-slate-500">Popular:</span>
              {['Fitness', 'Gym', 'Yoga', 'CrossFit', 'Entertainment'].map((term) => (
                <Link key={term} href={`/things-to-do?q=${term}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-xs h-7"
                  >
                    {term}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-white/30">
              Categories
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Explore Things to Do
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Find activities and experiences that match your interests
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {categories.map((category) => {
              const IconComponent = category.icon
              return (
                <Link
                  key={category.slug}
                  href={category.href}
                  className="group"
                >
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${category.color} mb-4`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-blue-200 transition-colors mb-2">
                      {category.name}
                    </h3>
                    <p className="text-blue-100 mb-4 flex-grow">
                      {category.description}
                    </p>
                    {category.count > 0 && (
                      <div className="flex items-center gap-2 text-sm text-blue-200">
                        <span className="font-semibold">{category.count.toLocaleString()}</span>
                        <span>
                          {category.count === 1 ? 'place' : 'places'}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Fitness Section */}
      {safeTopRatedFitness.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-700 border-blue-200">
                Featured
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Top Rated Fitness Centers
              </h2>
              <p className="text-slate-600 mt-2">
                Highest rated fitness places in Goa
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href="/things-to-do/fitness">
                View All Fitness â†’
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {safeTopRatedFitness.map((fitnessPlace) => (
              <FitnessCard key={fitnessPlace.id} fitnessPlace={fitnessPlace} />
            ))}
          </div>

          {/* Mobile View All Button */}
          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" asChild>
              <Link href="/things-to-do/fitness">
                View All Fitness Centers â†’
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Have a Great Activity to Share?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            We're constantly adding new things to do in Goa. Know a great place or activity we should feature?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/application">
                Suggest an Activity
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              asChild
            >
              <Link href="/things-to-do/fitness">
                Browse All Activities
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

