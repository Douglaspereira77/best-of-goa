import type { Organization } from '../types';

/**
 * Generate Organization schema for Best of Goa
 * Place this in the site-wide layout (header or footer)
 *
 * Benefits:
 * - Knowledge Graph eligibility
 * - Brand recognition in search
 * - Rich sitelinks
 * - Authority signals for SEO
 */
export function generateOrganizationSchema(): Organization {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bestgoa.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Best of Goa',
    alternateName: 'BestGoa',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/icon.png`, // Placeholder
      width: 630,
      height: 630,
    },
    description:
      "Goa's premier directory for discovering the best restaurants, hotels, attractions, and places to visit. Expert-verified recommendations with comprehensive reviews, ratings, and local insights.",
    foundingDate: '2025',
    founder: {
      '@type': 'Person',
      name: 'Best of Goa Team',
    },
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Goa',
      addressLocality: 'Panjim',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@bestgoa.com',
      contactType: 'Customer Care',
      areaServed: 'IN',
      availableLanguage: ['English'],
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Goa',
      sameAs: 'https://en.wikipedia.org/wiki/Goa',
    },
    knowsAbout: [
      'Restaurants in Goa',
      'Goa Dining',
      'Goa Tourism',
      'Goa Attractions',
      'Goa Hotels',
      'Goa Nightlife',
      'Goa Beaches',
    ],
    sameAs: [
      // 'https://www.instagram.com/bestof.goa', // Placeholder
    ],
  };
}
