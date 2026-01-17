/**
 * Dish Type Page - Dynamic Route
 *
 * Targets commercial search queries like:
 * - "best sushi goa"
 * - "best burger goa"
 * - "best shawarma goa city"
 *
 * URL Pattern: /places-to-eat/dishes/{dish}
 * Examples:
 * - /places-to-eat/dishes/sushi
 * - /places-to-eat/dishes/burger
 * - /places-to-eat/dishes/biryani
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getRestaurantsByDish, getAllDishSlugs } from '@/lib/queries/dish-pages';
import {
  generateCollectionPageSchema,
  generateCollectionKeywords,
} from '@/lib/schema/generators/collection-page';
import { generateDishTypeBreadcrumbSchema } from '@/lib/schema/generators/breadcrumb';
import { RestaurantCard } from '@/components/cuisine/RestaurantCard';
import { SearchBar } from '@/components/SearchBar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import Link from 'next/link';

interface DishPageProps {
  params: Promise<{
    dish: string;
  }>;
}

export default async function DishPage({ params }: DishPageProps) {
  const { dish: dishSlug } = await params;

  // Fetch dish data and restaurants
  const data = await getRestaurantsByDish(dishSlug, 50);

  if (!data) {
    notFound();
  }

  const { dish, restaurants, totalCount } = data;

  // Generate SEO keywords for this dish
  const keywords = generateCollectionKeywords(dish.name, [
    'Goa',
    'Goa City',
    'Salmiya',
    'Hawally',
    'best',
    'top rated',
    'restaurants serving',
  ]);

  // Generate CollectionPage schema with ItemList
  const schema = generateCollectionPageSchema({
    title: `Best ${dish.name} in Goa`,
    description: `Find the best restaurants serving ${dish.name.toLowerCase()} in Goa. ${totalCount} restaurants with expert ratings and reviews.`,
    slug: `/places-to-eat/dishes/${dishSlug}`,
    keywords,
    cuisineOrCategory: dish.name,
    breadcrumbName: dish.name,
    restaurants: restaurants.map((r: any) => ({
      slug: r.slug,
      name: r.name,
      hero_image: r.hero_image,
      address: r.address,
      area: r.area,
      overall_rating: r.overall_rating,
      total_reviews_aggregated: r.total_reviews_aggregated,
      cuisines: r.cuisines,
    })),
  });

  // Generate BreadcrumbList schema
  const breadcrumbSchema = generateDishTypeBreadcrumbSchema(dish.name, dishSlug, {
    baseUrl: 'https://www.bestofgoa.com',
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema, null, 2),
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <div className="mb-4">
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Places to Eat', href: '/places-to-eat' },
                  { label: 'Dishes', href: '/places-to-eat/dishes' },
                  { label: dish.name },
                ]}
                className="text-orange-100 [&_a]:text-orange-100 [&_a:hover]:text-white [&_span]:text-white"
              />
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Best {dish.name} in Goa
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-orange-100 mb-6">
              {totalCount} restaurants serving {dish.name.toLowerCase()}
            </p>

            {/* Description */}
            <p className="text-base md:text-lg text-orange-50 leading-relaxed max-w-3xl">
              {dish.description}. Discover the top-rated restaurants in Goa that serve
              the best {dish.name.toLowerCase()}, rated by locals and visitors.
            </p>
          </div>
        </section>

        {/* Restaurant Grid */}
        <section className="container mx-auto px-4 py-12">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar
              placeholder={`Search restaurants serving ${dish.name.toLowerCase()}...`}
            />
          </div>

          {/* Sort/Filter Bar */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              Showing {restaurants.length} of {totalCount} restaurants
            </p>
            {/* TODO: Add sort dropdown (Rating, Price, Name) */}
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
                No restaurants serving {dish.name.toLowerCase()} found yet.
              </p>
              <p className="text-gray-400 mt-2">
                We're constantly adding new restaurants. Check back soon!
              </p>
            </div>
          )}
        </section>

        {/* Related Dishes Section */}
        <section className="bg-white py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Explore Other Popular Dishes
            </h2>
            <div className="flex flex-wrap gap-3">
              {getAllDishSlugs()
                .filter(slug => slug !== dishSlug)
                .slice(0, 10)
                .map(slug => {
                  const slugToName: Record<string, string> = {
                    sushi: 'Sushi',
                    burger: 'Burger',
                    shawarma: 'Shawarma',
                    biryani: 'Biryani',
                    pizza: 'Pizza',
                    pasta: 'Pasta',
                    steak: 'Steak',
                    seafood: 'Seafood',
                    falafel: 'Falafel',
                    hummus: 'Hummus',
                    kebab: 'Kebab',
                    ramen: 'Ramen',
                    curry: 'Curry',
                    tacos: 'Tacos',
                    fried_chicken: 'Fried Chicken',
                    dessert: 'Dessert',
                    breakfast: 'Breakfast',
                    salad: 'Salad',
                  };
                  return (
                    <Link
                      key={slug}
                      href={`/places-to-eat/dishes/${slug}`}
                      className="px-4 py-2 bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 rounded-full text-sm font-medium transition-colors"
                    >
                      {slugToName[slug] || slug}
                    </Link>
                  );
                })}
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
}: DishPageProps): Promise<Metadata> {
  const { dish: dishSlug } = await params;

  const data = await getRestaurantsByDish(dishSlug, 50);

  if (!data) {
    return {
      title: 'Dish Not Found | Best of Goa',
    };
  }

  const { dish, totalCount } = data;

  // Generate comprehensive keywords
  const keywords = generateCollectionKeywords(dish.name, [
    'Goa',
    'best',
    'restaurants',
    'top rated',
  ]);

  return {
    title: `Best ${dish.name} in Goa (${totalCount} Restaurants)`,
    description: `Discover the top ${totalCount} restaurants serving ${dish.name.toLowerCase()} in Goa. Expert ratings, reviews, and recommendations for the best ${dish.name.toLowerCase()} spots.`,
    keywords: keywords.join(', '),
    openGraph: {
      title: `Best ${dish.name} in Goa`,
      description: `Find ${totalCount} top-rated restaurants serving ${dish.name.toLowerCase()} in Goa`,
      type: 'website',
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/places-to-eat/dishes/${dishSlug}`,
    },
  };
}

/**
 * Enable dynamic rendering for real-time data
 */
export const dynamic = 'force-dynamic';
