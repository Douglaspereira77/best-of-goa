/**
 * Collection Page Schema Generator for Cuisine/Category Listing Pages
 *
 * Purpose: Rank for commercial queries like "best sushi goa", "italian restaurants goa city"
 *
 * Used on pages like:
 * - /japanese-restaurants-goa
 * - /best-sushi-goa
 * - /italian-restaurants-goa-city
 *
 * SEO Impact:
 * - Targets high-intent commercial searches
 * - Structured data for restaurant lists
 * - Keywords for specific cuisine + location combinations
 */

import type { CollectionPageData, CollectionPageSchema } from '../types';

/**
 * Generate CollectionPage schema for cuisine/category listing pages
 *
 * This targets queries like:
 * - "best sushi goa"
 * - "japanese restaurants goa city"
 * - "italian restaurants salmiya"
 */
export function generateCollectionPageSchema(
  data: CollectionPageData
): CollectionPageSchema {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bestofgoa.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: data.title, // e.g., "Best Sushi Restaurants in Goa"
    description: data.description,
    url: `${baseUrl}${data.slug}`, // e.g., /best-sushi-goa

    // â­ KEYWORDS - This is where you target commercial queries
    keywords: data.keywords.join(', '),
    // Example: "best sushi goa, sushi restaurants goa, japanese sushi goa city, top sushi goa, sushi delivery goa"

    // About - Structured topical signals
    about: {
      '@type': 'Thing',
      name: data.cuisineOrCategory, // e.g., "Japanese Cuisine" or "Sushi"
    },

    // Breadcrumb for SEO
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Restaurants',
          item: `${baseUrl}/places-to-eat`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: data.breadcrumbName, // e.g., "Japanese Restaurants"
          item: `${baseUrl}${data.slug}`,
        },
      ],
    },

    // The restaurant list
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: data.restaurants.length,
      itemListElement: data.restaurants.map((restaurant, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Restaurant',
          '@id': `${baseUrl}/places-to-eat/restaurants/${restaurant.slug}`,
          name: restaurant.name,
          image: restaurant.hero_image,
          address: {
            '@type': 'PostalAddress',
            streetAddress: restaurant.address,
            addressLocality: restaurant.area,
            addressCountry: 'KW',
          },
          aggregateRating: restaurant.overall_rating
            ? {
                '@type': 'AggregateRating',
                ratingValue: restaurant.overall_rating.toString(),
                bestRating: '10',
                reviewCount: restaurant.total_reviews_aggregated || 0,
              }
            : undefined,
          servesCuisine: restaurant.cuisines?.map((c) => c.name) || [],
        },
      })),
    },

    // Geo-targeting for local SEO
    spatialCoverage: {
      '@type': 'Place',
      name: 'Goa',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'KW',
        addressLocality: data.neighborhood || 'Goa City',
      },
    },

    // Multilingual support
    inLanguage: ['en', 'ar'],
  };
}

/**
 * Generate keywords for collection pages
 *
 * Strategy: Target commercial intent queries with cuisine + location combinations
 */
export function generateCollectionKeywords(
  cuisine: string,
  neighborhoods: string[] = ['Goa', 'Goa City', 'Salmiya', 'Mahboula']
): string[] {
  const keywords: string[] = [];

  // Primary commercial queries
  keywords.push(`best ${cuisine.toLowerCase()} goa`);
  keywords.push(`${cuisine.toLowerCase()} restaurants goa`);
  keywords.push(`top ${cuisine.toLowerCase()} goa`);
  keywords.push(`${cuisine.toLowerCase()} food goa`);

  // Neighborhood-specific
  neighborhoods.forEach((neighborhood) => {
    keywords.push(`${cuisine.toLowerCase()} restaurants ${neighborhood.toLowerCase()}`);
    keywords.push(`best ${cuisine.toLowerCase()} ${neighborhood.toLowerCase()}`);
  });

  // Long-tail variations
  keywords.push(`${cuisine.toLowerCase()} delivery goa`);
  keywords.push(`${cuisine.toLowerCase()} takeout goa`);
  keywords.push(`${cuisine.toLowerCase()} near me goa`);
  keywords.push(`best places for ${cuisine.toLowerCase()} in goa`);

  return keywords;
}

/**
 * Example usage for Japanese/Sushi restaurants:
 *
 * const keywords = generateCollectionKeywords('Sushi', ['Goa City', 'Salmiya', 'Mahboula']);
 * // Returns:
 * // [
 * //   "best sushi goa",
 * //   "sushi restaurants goa",
 * //   "top sushi goa",
 * //   "sushi food goa",
 * //   "sushi restaurants goa city",
 * //   "best sushi goa city",
 * //   "sushi restaurants salmiya",
 * //   "best sushi salmiya",
 * //   ... and more
 * // ]
 */
