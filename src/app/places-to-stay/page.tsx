import { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/SearchBar';
import { QuickFilterPills } from '@/components/hotel/QuickFilterPills';
import { HotelCard } from '@/components/hotel/HotelCard';
import { GovernorateCard } from '@/components/hotel/GovernorateCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import {
  getTopRatedHotels,
  getLuxuryHotels,
  getBudgetFriendlyHotels,
  getAllCategoriesWithCounts,
  getGovernoratesWithHotelStats,
  getTotalHotelCount,
  getAllHotels
} from '@/lib/queries/places-to-stay';

export const metadata: Metadata = {
  title: 'Best Hotels in Goa | Places to Stay',
  description: 'Discover Goa\'s best hotels - luxury resorts, business hotels & budget-friendly accommodations across all governorates.',
  openGraph: {
    title: 'Best Hotels in Goa | Places to Stay',
    description: 'Discover Goa\'s best hotels - luxury resorts, business & budget-friendly options.',
    type: 'website',
    locale: 'en_KW',
    siteName: 'Best of Goa',
    url: 'https://www.bestofgoa.com/places-to-stay',
    images: [
      {
        url: 'https://www.bestofgoa.com/images/categories/hotels.jpg',
        width: 1200,
        height: 630,
        alt: 'Best Hotels in Goa',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Hotels in Goa",
    description: "Discover Goa's best hotels - luxury resorts, business & budget-friendly options.",
    images: ['https://www.bestofgoa.com/images/categories/hotels.jpg'],
  },
  alternates: {
    canonical: 'https://www.bestofgoa.com/places-to-stay',
  },
};

export default async function PlacesToStayPage() {
  // Fetch all data in parallel
  const [
    topRated,
    luxury,
    budgetFriendly,
    categories,
    governorates,
    totalHotels,
    allHotels
  ] = await Promise.all([
    getTopRatedHotels(8),
    getLuxuryHotels(8),
    getBudgetFriendlyHotels(8),
    getAllCategoriesWithCounts(),
    getGovernoratesWithHotelStats(),
    getTotalHotelCount(),
    getAllHotels()
  ]);

  // Safety checks - ensure arrays exist
  const safeTopRated = topRated || [];
  const safeLuxury = luxury || [];
  const safeBudgetFriendly = budgetFriendly || [];
  const safeCategories = categories || [];
  const safeGovernorates = governorates || [];
  const safeAllHotels = allHotels || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Places to Stay' }]} />
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
              Discover the{' '}
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                Best Places to Stay
              </span>{' '}
              in Goa
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Curated by guest reviews, local insights, and authentic hospitality experiences.
              Explore {totalHotels}+ hotels across Goa.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <SearchBar placeholder="Search hotels by name, area, or amenity..." type="hotels" />
            </div>

            {/* Quick Filter Pills */}
            <QuickFilterPills />
          </div>
        </div>
      </section>

      {/* Top Rated Section */}
      <section id="top-rated" className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-700 border-blue-200">
              Featured
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Top Rated Hotels
            </h2>
            <p className="text-slate-600 mt-2">
              Highest rated accommodations in Goa
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link href="/places-to-stay?sort=rating">
              View All â†’
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {safeTopRated.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link href="/places-to-stay?sort=rating">
              View All Top Rated â†’
            </Link>
          </Button>
        </div>
      </section>

      {/* Luxury Hotels Section */}
      <section id="luxury" className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-white/30">
              Premium Selection
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Luxury Hotels & Resorts
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Experience world-class hospitality and exceptional service
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {safeLuxury.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/places-to-stay/luxury-hotels">
                Explore All Luxury Hotels â†’
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Browse by Governorate */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-700 border-blue-200">
              Explore Goa
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Hotels by Governorate
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Find accommodations in every corner of Goa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {safeGovernorates.map((governorate) => (
              <GovernorateCard key={governorate.id} governorate={governorate} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-700 border-blue-200">
              Categories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Browse by Category
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              From luxury resorts to budget-friendly stays
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
            {safeCategories.map((category) => (
              <Link
                key={category.id}
                href={`/places-to-stay/${category.slug}`}
                className="group"
              >
                <div className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 bg-white">
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                    ðŸ¨
                  </span>
                  <span className="text-sm font-semibold text-gray-900 text-center group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </span>
                  {category.count > 0 && (
                    <span className="text-xs text-gray-500 mt-1">
                      {category.count} hotels
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* View All Categories Button */}
          <div className="text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/places-to-stay?view=all-categories">
                View All Categories
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Budget-Friendly Section */}
      <section id="budget-friendly" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-3 bg-green-100 text-green-700 border-green-200">
            Great Value
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Budget-Friendly Hotels
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Comfortable accommodations without breaking the bank
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {safeBudgetFriendly.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>

        {/* View All Budget-Friendly Button */}
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/places-to-stay/budget-hotels">
              View All Budget-Friendly â†’
            </Link>
          </Button>
        </div>
      </section>

      {/* All Hotels - Comprehensive Directory */}
      {safeAllHotels.length > 0 && (
        <section className="bg-white py-16 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-3 bg-slate-100 text-slate-700 border-slate-200">
                Complete Directory
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                All Hotels in Goa
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Browse our complete directory of {safeAllHotels.length} hotels across Goa
              </p>
            </div>

            {/* Compact Grid - All Hotels */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {safeAllHotels.map((hotel) => (
                <Link
                  key={hotel.id}
                  href={`/places-to-stay/hotels/${hotel.slug}`}
                  className="group p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                >
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-1">
                    {hotel.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{hotel.area}</p>
                  {(hotel.bok_score || hotel.google_rating) && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-yellow-600">
                      <span>â˜…</span>
                      <span>{(hotel.bok_score || hotel.google_rating)?.toFixed(1)}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            We're constantly adding new hotels. Have a favorite place we should feature?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/application">
                Suggest a Hotel
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/places-to-stay?view=all">
                Browse All {totalHotels}+ Hotels
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
