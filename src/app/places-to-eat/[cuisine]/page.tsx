/**
 * Cuisine Category Page - Dynamic Route
 *
 * Targets commercial search queries like:
 * - "best sushi goa"
 * - "japanese restaurants goa city"
 * - "italian restaurants goa"
 *
 * URL Pattern: /places-to-eat/{cuisine}
 * Examples:
 * - /places-to-eat/japanese
 * - /places-to-eat/italian
 * - /places-to-eat/seafood
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getRestaurantsByCuisine } from '@/lib/queries/cuisine-pages';
import {
  generateCollectionPageSchema,
  generateCollectionKeywords,
} from '@/lib/schema/generators/collection-page';
import { RestaurantCard } from '@/components/cuisine/RestaurantCard';
import { SearchBar } from '@/components/SearchBar';

interface CuisinePageProps {
  params: Promise<{
    cuisine: string;
  }>;
}

export default async function CuisinePage({ params }: CuisinePageProps) {
  const { cuisine: cuisineSlug } = await params;

  // Fetch cuisine data and restaurants
  const data = await getRestaurantsByCuisine(cuisineSlug, 50);

  if (!data) {
    notFound();
  }

  const { cuisine, restaurants, totalCount } = data;

  // Generate SEO keywords for this cuisine
  const keywords = generateCollectionKeywords(cuisine.name, [
    'Goa',
    'Goa City',
    'Salmiya',
    'Mahboula',
    'Hawally',
    'Fintas',
  ]);

  // Generate CollectionPage schema with ItemList
  const schema = generateCollectionPageSchema({
    title: `Best ${cuisine.name} Restaurants in Goa`,
    description: `Discover the top-rated ${cuisine.name.toLowerCase()} restaurants in Goa. Expert reviews, ratings, and authentic recommendations from locals.`,
    slug: `/places-to-eat/${cuisineSlug}`,
    keywords,
    cuisineOrCategory: cuisine.name,
    breadcrumbName: `${cuisine.name} Restaurants`,
    restaurants: restaurants.map((r) => ({
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
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="text-sm mb-4 text-blue-100">
              <a href="/" className="hover:text-white">
                Home
              </a>
              <span className="mx-2">/</span>
              <a href="/places-to-eat" className="hover:text-white">
                Restaurants
              </a>
              <span className="mx-2">/</span>
              <span className="text-white font-medium">{cuisine.name}</span>
            </nav>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Best {cuisine.name} Restaurants in Goa
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-blue-100 mb-6">
              {totalCount} top-rated {cuisine.name.toLowerCase()} restaurants
            </p>

            {/* Description */}
            {cuisine.description && (
              <p className="text-base md:text-lg text-blue-50 leading-relaxed max-w-3xl">
                {cuisine.description}
              </p>
            )}
          </div>
        </section>

        {/* Restaurant Grid */}
        <section className="container mx-auto px-4 py-12">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar
              placeholder={`Search ${cuisine.name} restaurants...`}
              cuisineFilter={cuisine.id}
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
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No {cuisine.name.toLowerCase()} restaurants found.
              </p>
            </div>
          )}
        </section>

        {/* FAQ Section (Future Enhancement) */}
        {/* TODO: Add FAQ schema for queries like "best sushi goa?" */}

        {/* Neighborhood Breakdown (Future Enhancement) */}
        {/* TODO: Add sections like "Best Sushi in Salmiya", "Best Sushi in Goa City" */}
      </div>
    </>
  );
}

/**
 * Generate static params for popular cuisines
 * This pre-renders pages at build time for SEO
 *
 * IMPORTANT: Use clean slugs without "-restaurants" suffix
 * URLs: /places-to-eat/japanese NOT /places-to-eat/japanese-restaurants
 */
export async function generateStaticParams() {
  return [
    { cuisine: 'japanese' },
    { cuisine: 'italian' },
    { cuisine: 'indian' },
    { cuisine: 'chinese' },
    { cuisine: 'american' },
    { cuisine: 'middle-eastern' },
    { cuisine: 'mexican' },
    { cuisine: 'thai' },
    { cuisine: 'lebanese' },
    { cuisine: 'french' },
    { cuisine: 'asian-fusion' },
    { cuisine: 'goai' },
    { cuisine: 'turkish' },
    { cuisine: 'goai-american-fusion' },
  ];
}

// Unique descriptions for each cuisine type to avoid duplicate content issues
const cuisineDescriptions: Record<string, string> = {
  'japanese': 'From authentic sushi bars to ramen shops, explore Japanese dining in Goa. Fresh sashimi, tempura, and izakaya experiences await.',
  'italian': 'Savor authentic Italian cuisine in Goa - wood-fired pizzas, handmade pasta, and traditional trattorias. La dolce vita awaits.',
  'lebanese': 'Experience the flavors of Lebanon in Goa - mezze platters, grilled meats, and traditional sweets. Authentic Middle Eastern hospitality.',
  'indian': 'Discover Indian restaurants in Goa serving aromatic curries, tandoori specialties, and regional dishes from across the subcontinent.',
  'chinese': 'From Cantonese dim sum to Sichuan spice, explore Chinese restaurants in Goa offering authentic flavors and family-style dining.',
  'thai': 'Taste Thailand in Goa - aromatic curries, fresh pad thai, and vibrant street food flavors. Spicy, sweet, and satisfying.',
  'mexican': 'Enjoy Mexican cuisine in Goa - tacos, burritos, and authentic flavors from south of the border. Vibrant and flavorful dining.',
  'american': 'Classic American dining in Goa - juicy burgers, BBQ ribs, and comfort food favorites. Hearty portions and familiar flavors.',
  'french': 'Indulge in French cuisine in Goa - elegant bistros, patisseries, and fine dining. Croissants to coq au vin.',
  'turkish': 'Savor Turkish delights in Goa - kebabs, pide, and rich flavors from Istanbul to Anatolia. Warm hospitality included.',
  'korean': 'Experience Korean BBQ and cuisine in Goa - sizzling grills, kimchi, and K-food favorites. Interactive dining at its best.',
  'seafood': 'Fresh catches and ocean flavors at Goa\'s seafood restaurants. Grilled fish, shrimp, and coastal cuisine by the Gulf.',
  'asian-fusion': 'Creative Asian fusion restaurants in Goa blending Eastern flavors with modern techniques. Innovative and Instagram-worthy.',
  'mediterranean': 'Mediterranean flavors in Goa - olive oil, fresh herbs, and sun-kissed cuisine from Greece to Morocco.',
  'goai': 'Traditional Goai cuisine - machboos, harees, and authentic Gulf flavors. Taste the heritage of Goa.',
  'persian': 'Persian restaurants in Goa serving fragrant rice dishes, tender kebabs, and Iranian hospitality.',
  'pakistani': 'Pakistani cuisine in Goa - biryani, karahi, and rich flavors from Lahore to Karachi. Spice lovers welcome.',
  'filipino': 'Filipino restaurants in Goa - adobo, sinigang, and comfort food from the Philippines. A taste of home.',
  'indonesian': 'Indonesian flavors in Goa - satay, nasi goreng, and aromatic spices from the archipelago.',
  'vietnamese': 'Vietnamese cuisine in Goa - fresh pho, banh mi, and vibrant flavors from Hanoi to Ho Chi Minh.',
  'greek': 'Greek restaurants in Goa - gyros, souvlaki, and Mediterranean sunshine on your plate. Opa!',
  'spanish': 'Spanish tapas and cuisine in Goa - paella, jamón, and flavors from Barcelona to Madrid.',
  'brazilian': 'Brazilian steakhouses in Goa - churrasco, picanha, and endless meat carved tableside.',
  'egyptian': 'Egyptian cuisine in Goa - koshari, ful medames, and flavors from the Nile. Ancient recipes, modern taste.',
  'syrian': 'Syrian restaurants in Goa - shawarma, kibbeh, and Damascene hospitality. Rich flavors and traditions.',
  'yemeni': 'Yemeni cuisine in Goa - mandi rice, saltah, and authentic Arabian Peninsula flavors.',
  'iraqi': 'Iraqi restaurants in Goa - masgouf fish, kebabs, and Mesopotamian culinary heritage.',
  'moroccan': 'Moroccan tagines and cuisine in Goa - aromatic spices, couscous, and North African flavors.',
  'cafe': 'Goa\'s best cafes - artisan coffee, brunch spots, and cozy atmospheres for every mood.',
  'bakery': 'Fresh-baked goods in Goa - pastries, bread, and sweet treats from local bakeries.',
  'dessert': 'Sweet spots in Goa - kunafa, ice cream, and decadent desserts to satisfy your cravings.',
  'fast-food': 'Quick bites in Goa - burgers, shawarma, and fast food favorites when you\'re on the go.',
  'fine-dining': 'Goa\'s finest restaurants - elegant ambiance, exceptional service, and culinary artistry.',
  'halal': 'Halal-certified restaurants in Goa - diverse cuisines prepared according to Islamic guidelines.',
  'healthy': 'Health-conscious dining in Goa - salads, smoothie bowls, and nutritious meals that taste great.',
  'vegetarian': 'Vegetarian-friendly restaurants in Goa - plant-based options and meat-free menus.',
  'international': 'International cuisine in Goa - global flavors and world cuisines under one roof.',
}

/**
 * Generate metadata for SEO
 * This creates the page title, description, and keywords meta tags
 */
export async function generateMetadata({
  params,
}: CuisinePageProps): Promise<Metadata> {
  const { cuisine: cuisineSlug } = await params;

  const data = await getRestaurantsByCuisine(cuisineSlug, 50);

  if (!data) {
    return {
      title: 'Cuisine Not Found',
    };
  }

  const { cuisine, totalCount } = data;

  // Generate comprehensive keywords
  const keywords = generateCollectionKeywords(cuisine.name);

  // Get unique description or generate a default one
  const uniqueDesc = cuisineDescriptions[cuisineSlug];
  const description = uniqueDesc
    ? `${uniqueDesc} Browse ${totalCount} ${cuisine.name.toLowerCase()} restaurants in Goa with reviews and ratings.`
    : `Discover ${totalCount} ${cuisine.name.toLowerCase()} restaurants in Goa. Expert reviews, ratings, photos, and menus to help you find your next favorite spot.`;

  // Build title with smart truncation for long cuisine names
  // Target: ~45 chars before " | Best of Goa" suffix (18 chars) = 63 total
  let title = `Best ${cuisine.name} Restaurants in Goa (${totalCount} Options)`;
  if (title.length > 45) {
    // Try shorter format for long cuisine names
    title = `${cuisine.name} Restaurants in Goa (${totalCount})`;
    if (title.length > 45) {
      // Ultra-short for very long names
      title = `${cuisine.name} in Goa (${totalCount})`;
    }
  }

  return {
    title,
    description,
    keywords: keywords.join(', '),
    openGraph: {
      title: `Best ${cuisine.name} Restaurants in Goa`,
      description: `Explore ${totalCount} top-rated ${cuisine.name.toLowerCase()} restaurants in Goa`,
      type: 'website',
    },
    alternates: {
      canonical: `https://www.bestofgoa.com/places-to-eat/${cuisineSlug}`,
    },
  };
}

/**
 * Enable dynamic rendering for real-time data
 * This ensures the page always shows the latest restaurant data
 */
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour
