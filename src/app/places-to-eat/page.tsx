import { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/SearchBar';
import { QuickFilterPills } from '@/components/cuisine/QuickFilterPills';
import { RestaurantCard } from '@/components/cuisine/RestaurantCard';
import { GovernorateCard } from '@/components/cuisine/GovernorateCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import {
  getTopRatedRestaurants,
  getBudgetFriendlyRestaurants,
  getAllCuisinesWithCounts,
  getGovernoratesWithStats,
  getTotalRestaurantCount,
  getAllRestaurants
} from '@/lib/queries/places-to-eat';
import { getFeaturedDishes } from '@/lib/queries/dish-pages';
import { logDebug } from '@/lib/debug-logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Best Restaurants in Goa | Places to Eat',
  description: 'Discover Goa\'s best restaurants - fine dining, casual eats & budget-friendly options across all cuisines and governorates.',
  openGraph: {
    title: 'Best Restaurants in Goa | Places to Eat',
    description: 'Discover Goa\'s best restaurants - fine dining, casual & budget-friendly across all cuisines.',
    type: 'website',
    locale: 'en_KW',
    siteName: 'Best of Goa',
    url: 'https://www.bestofgoa.com/places-to-eat',
    images: [
      {
        url: 'https://www.bestofgoa.com/images/categories/restaurants.jpg',
        width: 1200,
        height: 630,
        alt: 'Best Restaurants in Goa',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Restaurants in Goa",
    description: "Discover Goa's best restaurants - fine dining, casual & budget-friendly options.",
    images: ['https://www.bestofgoa.com/images/categories/restaurants.jpg'],
  },
  alternates: {
    canonical: 'https://www.bestofgoa.com/places-to-eat',
  },
};

export default async function PlacesToEatPage() {
  // Fetch all data in parallel
  const [
    topRated,
    budgetFriendly,
    cuisines,
    governorates,
    totalRestaurants,
    featuredDishes,
    allRestaurants
  ] = await Promise.all([
    getTopRatedRestaurants(8),
    getBudgetFriendlyRestaurants(8),
    getAllCuisinesWithCounts(),
    getGovernoratesWithStats(),
    getTotalRestaurantCount(),
    getFeaturedDishes(12),
    getAllRestaurants()
  ]);

  logDebug(`[Page] PlacesToEat loaded. TopRated: ${topRated?.length}, All: ${allRestaurants?.length}`);

  // Safety checks - ensure arrays exist
  const safeTopRated = topRated || [];
  const safeBudgetFriendly = budgetFriendly || [];
  const safeCuisines = cuisines || [];
  const safeGovernorates = governorates || [];
  const safeDishes = featuredDishes || [];
  const safeAllRestaurants = allRestaurants || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Places to Eat' }]} />
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4">
              Discover the{' '}
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                Best Places to Eat
              </span>{' '}
              in Goa
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Curated by public reviews, local expertise, and authentic dining experiences.
              Explore {totalRestaurants}+ restaurants across Goa.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <SearchBar placeholder="Search restaurants by name, area, or cuisine..." />
            </div>

            {/* Quick Filter Pills */}
            <QuickFilterPills />
          </div>
        </div>
      </section>

      {/* Top Rated Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-700 border-blue-200">
              Featured
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Top Rated Restaurants
            </h2>
            <p className="text-slate-600 mt-2">
              Highest rated dining experiences in Goa
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link href="/places-to-eat?sort=rating">
              View All â†’
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {safeTopRated.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center md:hidden">
          <Button variant="outline" asChild>
            <Link href="/places-to-eat?sort=rating">
              View All Top Rated â†’
            </Link>
          </Button>
        </div>
      </section>

      {/* Browse by Governorate */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-white/20 text-white border-white/30">
              Explore Goa
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Best Restaurants by Governorate
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Discover exceptional dining in every corner of Goa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {safeGovernorates.map((governorate) => (
              <GovernorateCard key={governorate.id} governorate={governorate} />
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Cuisine */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-700 border-blue-200">
              Cuisines
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Browse by Cuisine
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              From traditional Goai fare to international flavors
            </p>
          </div>

          {/* Cuisine Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
            {safeCuisines.map((cuisine) => (
              <Link
                key={cuisine.id}
                href={`/places-to-eat/${cuisine.slug}`}
                className="group"
              >
                <div className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 bg-white">
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                    ðŸ½ï¸
                  </span>
                  <span className="text-sm font-semibold text-gray-900 text-center group-hover:text-blue-600 transition-colors">
                    {cuisine.name}
                  </span>
                  {cuisine.restaurant_count > 0 && (
                    <span className="text-xs text-gray-500 mt-1">
                      {cuisine.restaurant_count} places
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* View All Cuisines Button */}
          <div className="text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/places-to-eat?view=all-cuisines">
                View All Cuisines
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Browse by Dish */}
      <section className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-orange-100 text-orange-700 border-orange-200">
              Popular Dishes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Browse by Dish
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Find the best restaurants for your favorite dishes
            </p>
          </div>

          {/* Dish Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
            {safeDishes.map((dish) => (
              <Link
                key={dish.slug}
                href={`/places-to-eat/dishes/${dish.slug}`}
                className="group"
              >
                <div className="flex flex-col items-center p-4 rounded-xl border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-100 transition-all duration-300 bg-white">
                  <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                    ðŸ´
                  </span>
                  <span className="text-sm font-semibold text-gray-900 text-center group-hover:text-orange-600 transition-colors">
                    {dish.name}
                  </span>
                  {dish.count > 0 && (
                    <span className="text-xs text-gray-500 mt-1">
                      {dish.count} places
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* View All Dishes Button */}
          <div className="text-center">
            <Button variant="outline" size="lg" asChild className="border-orange-300 hover:bg-orange-100">
              <Link href="/places-to-eat/dishes">
                View All Dishes
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Budget-Friendly Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-3 bg-green-100 text-green-700 border-green-200">
            Great Value
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Budget-Friendly Restaurants
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            High quality dining without breaking the bank
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {safeBudgetFriendly.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>

        {/* View All Budget-Friendly Button */}
        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/places-to-eat?price=1,2">
              View All Budget-Friendly â†’
            </Link>
          </Button>
        </div>
      </section>

      {/* All Restaurants - Comprehensive Directory */}
      {safeAllRestaurants.length > 0 && (
        <section className="bg-white py-16 border-t">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-3 bg-slate-100 text-slate-700 border-slate-200">
                Complete Directory
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                All Restaurants in Goa
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Browse our complete directory of {safeAllRestaurants.length} restaurants across Goa
              </p>
            </div>

            {/* Compact Grid - All Restaurants */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {safeAllRestaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/places-to-eat/restaurants/${restaurant.slug}`}
                  className="group p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                >
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-1">
                    {restaurant.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{restaurant.area}</p>
                  {(restaurant.bok_score || restaurant.overall_rating || restaurant.google_rating) && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-yellow-600">
                      <span>â˜…</span>
                      <span>{(restaurant.bok_score || restaurant.overall_rating || restaurant.google_rating)?.toFixed(1)}</span>
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
            We're constantly adding new restaurants. Have a favorite spot we should feature?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/application">
                Suggest a Restaurant
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="/places-to-eat?view=all">
                Browse All {totalRestaurants}+ Restaurants
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
