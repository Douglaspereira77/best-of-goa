import type { WebSite } from '../types';

/**
 * Generate Enhanced WebSite schema with Tourism Context
 * Place this ONLY on the homepage
 *
 * Benefits:
 * - Sitelinks search box in Google results (2-4 months)
 * - Enhanced brand presence and entity recognition
 * - Tourism destination context for rich results
 * - Explicit SEO keywords and topic signals
 * - Geographic and content-type context
 * - Direct search from SERPs
 */
export function generateWebSiteSchema(): WebSite {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bestgoa.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Best of Goa',
    url: baseUrl,
    description:
      'Discover the best restaurants, hotels, beaches, attractions, and places in Goa with expert reviews and local insights.',

    // SEO Keywords - World-class best practices
    keywords:
      'best restaurants in Goa, top restaurants Panjim, where to eat in Goa, Goa restaurant guide, Goa dining recommendations, best seafood restaurants Goa, beach shacks Goa, fine dining Goa, casual dining Goa, family restaurants Goa, Goa food scene, Goa cafes, best places to eat Goa, authentic Goan cuisine, North Goa restaurants, South Goa restaurants, things to do in Goa, Goa attractions, visit Goa, Goa travel guide, Goa tourism, Goa hotels, Goa resorts, Goa nightlife, Goa beaches, Goa churches, Goa water sports',

    // Family-friendly content indicator
    isFamilyFriendly: true,

    // Publisher (connects to Organization schema)
    publisher: {
      '@type': 'Organization',
      name: 'Best of Goa',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon.png`,
        width: 630,
        height: 630,
      },
    },

    // Geographic focus
    about: {
      '@type': 'AdministrativeArea',
      name: 'Goa',
      description:
        'A state in western India with coastlines stretching along the Arabian Sea, known for its beaches, 17th-century churches and tropical spice plantations.',
    },

    // Tourism destination context
    mainEntity: {
      '@type': 'TouristDestination',
      name: 'Goa',
      description: 'Discover the best attractions, activities, and dining experiences in Goa',
      touristType: [
        'Culinary',
        'Beach',
        'Culture',
        'Family',
        'Luxury',
        'Nightlife',
        'Nature',
        'Water Sports',
        'Heritage',
        'Relaxation',
      ],
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 15.2993, // Goa center approx
        longitude: 74.1240,
      },
      url: baseUrl,
    },

    // Search action for sitelinks search box
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },

    inLanguage: ['en'],
  };
}
