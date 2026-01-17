/**
 * Dishes Hub Page
 *
 * Lists all dish types for browsing
 * URL: /places-to-eat/dishes
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getPopularDishesWithCounts } from '@/lib/queries/dish-pages';

export const metadata: Metadata = {
  title: 'Browse Restaurants by Dish',
  description:
    'Find the best restaurants in Goa by dish type. Browse sushi, burgers, shawarma, biryani, and more popular dishes.',
  openGraph: {
    title: 'Browse Restaurants by Dish | Best of Goa',
    description: 'Find the best restaurants in Goa by dish type',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.bestofgoa.com/places-to-eat/dishes',
  },
};

export default async function DishesHubPage() {
  const dishes = await getPopularDishesWithCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="text-sm mb-4 text-orange-100">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/places-to-eat" className="hover:text-white">
              Places to Eat
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white font-medium">Dishes</span>
          </nav>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Browse by Dish
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-orange-100 mb-6">
            Find the best restaurants for your favorite dishes in Goa
          </p>

          {/* Description */}
          <p className="text-base md:text-lg text-orange-50 leading-relaxed max-w-3xl">
            Whether you're craving sushi, shawarma, biryani, or a gourmet burger, we've got you
            covered. Explore restaurants specializing in specific dishes, rated by locals and
            visitors.
          </p>
        </div>
      </section>

      {/* Dishes Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-3 bg-orange-100 text-orange-700 border-orange-200">
            {dishes.length} Dish Types
          </Badge>
          <h2 className="text-2xl font-bold text-gray-900">All Dish Categories</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dishes.map(dish => (
            <Link
              key={dish.slug}
              href={`/places-to-eat/dishes/${dish.slug}`}
              className="group block"
            >
              <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all duration-300 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">ðŸ´</span>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {dish.count} restaurants
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-2">
                  {dish.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">{dish.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {dishes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No dishes found yet.</p>
            <p className="text-gray-400 mt-2">Check back soon as we add more restaurants!</p>
          </div>
        )}
      </section>

      {/* SEO Content Section */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Why Browse by Dish?
          </h2>
          <div className="prose prose-gray max-w-none">
            <p>
              Sometimes you know exactly what you're craving. Instead of browsing through cuisines
              or restaurants, go straight to the dish you want. Our dish-based categories help you
              find:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <li>
                <strong>Best Sushi in Goa</strong> - Fresh Japanese cuisine from top sushi bars
              </li>
              <li>
                <strong>Best Burgers in Goa</strong> - Gourmet and classic burger joints
              </li>
              <li>
                <strong>Best Shawarma in Goa</strong> - Traditional Middle Eastern wraps
              </li>
              <li>
                <strong>Best Biryani in Goa</strong> - Authentic Indian rice dishes
              </li>
              <li>
                <strong>Best Pizza in Goa</strong> - Italian pizzerias and gourmet pies
              </li>
              <li>
                <strong>Best Seafood in Goa</strong> - Fresh catches and coastal cuisine
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour
