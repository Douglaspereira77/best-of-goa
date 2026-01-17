/**
 * Schema.org Generator - Main Orchestrator
 *
 * Central service for generating all Schema.org structured data markup
 * for Best of Goa directory pages.
 *
 * Usage:
 * ```typescript
 * import { generateRestaurantPageSchemas } from '@/lib/schema';
 *
 * const schemas = generateRestaurantPageSchemas(restaurantData, {
 *   baseUrl: 'https://bestgoa.com'
 * });
 * ```
 */

// Export all types
export * from './types';

// Export individual generators
export { generateRestaurantSchema } from './generators/restaurant';
export { generateFAQSchema, validateFAQs } from './generators/faq';
export {
  generateRestaurantBreadcrumbSchema,
  generateRestaurantMenuBreadcrumbSchema,
  generateCuisineBreadcrumbSchema,
  generateAreaBreadcrumbSchema,
  generateDishTypeBreadcrumbSchema,
} from './generators/breadcrumb';
export {
  generateMenuSchema,
  generateMenuReference,
  getMenuStats,
  validateMenuData,
} from './generators/menu';
export {
  generateAggregateRatingSchema,
  generateReviewsSchema,
} from './generators/review';
export {
  generateImageObjectSchema,
  generateImageObjectsSchema,
  getPrimaryImageUrl,
} from './generators/image';
export {
  generateCollectionPageSchema,
  generateCollectionKeywords,
} from './generators/collection-page';
export { generatePlaceSchema, validatePlaceData } from './generators/place';
export { generateHotelSchema, generateHotelBreadcrumbSchema } from './generators/hotel';
export { generateSchoolSchema, generateSchoolBreadcrumbSchema } from './generators/school';
export { generateMallSchema, generateMallBreadcrumbSchema } from './generators/mall';

// Export global schemas
export { generateOrganizationSchema } from './global/organization';
export { generateWebSiteSchema } from './global/website';

import type {
  RestaurantData,
  SchemaGeneratorOptions,
  SchemaRestaurant,
  SchemaFAQPage,
  SchemaBreadcrumbList,
  SchemaMenu,
  AggregateRating,
  Review,
  ImageObject,
  Organization,
  WebSite,
} from './types';

import { generateRestaurantSchema } from './generators/restaurant';
import { generateFAQSchema } from './generators/faq';
import { generateRestaurantBreadcrumbSchema } from './generators/breadcrumb';
import { generateMenuSchema } from './generators/menu';
import {
  generateAggregateRatingSchema,
  generateReviewsSchema,
} from './generators/review';
import { generateImageObjectsSchema } from './generators/image';
import { generateOrganizationSchema } from './global/organization';
import { generateWebSiteSchema } from './global/website';

/**
 * Schema collection for a restaurant page
 *
 * NOTE: Reviews are embedded within restaurant.review[] property,
 * not as standalone schemas (to avoid duplication)
 */
export interface RestaurantPageSchemas {
  restaurant: SchemaRestaurant;
  breadcrumb: SchemaBreadcrumbList;
  faq?: SchemaFAQPage;
  menu?: SchemaMenu;
  images?: ImageObject[];
}

/**
 * Global schema collection for site-wide use
 * Place in root layout or _app
 */
export interface GlobalSchemas {
  organization: Organization;
  website: WebSite;
}

/**
 * Generate all schemas for a restaurant detail page
 *
 * This is the main function you'll use in your Next.js pages
 *
 * @param restaurant - Complete restaurant data from database
 * @param options - Configuration options
 * @returns Object containing all generated schemas
 *
 * @example
 * ```typescript
 * // In your restaurant page component
 * export async function generateMetadata({ params }) {
 *   const restaurant = await getRestaurant(params.slug);
 *   const schemas = generateRestaurantPageSchemas(restaurant, {
 *     baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://bestgoa.com'
 *   });
 *
 *   return {
 *     // ... other metadata
 *     other: {
 *       'application/ld+json': formatSchemasForHead(schemas)
 *     }
 *   };
 * }
 * ```
 */
export function generateRestaurantPageSchemas(
  restaurant: RestaurantData,
  options: SchemaGeneratorOptions
): RestaurantPageSchemas {
  const schemas: RestaurantPageSchemas = {
    // Priority 1: Restaurant schema (always included)
    // Note: AggregateRating is embedded in restaurant schema
    restaurant: generateRestaurantSchema(restaurant, {
      ...options,
      includeMenu: true,
      includeImages: true,
    }),

    // Priority 1: Breadcrumb schema (always included)
    breadcrumb: generateRestaurantBreadcrumbSchema(restaurant, options),
  };

  // Priority 1: FAQ schema (if FAQs exist)
  if (options.includeFAQ !== false) {
    const faqSchema = generateFAQSchema(restaurant);
    if (faqSchema) {
      schemas.faq = faqSchema;
    }
  }

  // Priority 2: Menu schema (if dishes exist)
  if (options.includeMenu !== false) {
    const menuSchema = generateMenuSchema(restaurant, options);
    if (menuSchema) {
      schemas.menu = menuSchema;
    }
  }

  // NOTE: Reviews are embedded within the Restaurant schema (lines 136-140)
  // No need to generate standalone Review schemas - this was causing duplication

  // Priority 3: Image schemas (for image search optimization)
  if (options.includeImages !== false && restaurant.images) {
    const imageData = restaurant.images.map((img) => ({
      url: img.url,
      alt: img.alt_text,
      title: img.alt_text,
      description: img.alt_text,
      primary: img.is_hero,
    }));
    const imageSchemas = generateImageObjectsSchema(imageData);
    if (imageSchemas.length > 0) {
      schemas.images = imageSchemas;
    }
  }

  return schemas;
}

/**
 * Generate global schemas for site-wide use
 *
 * Place these in your root layout (app/layout.tsx) to apply
 * Organization and WebSite schema across the entire site
 *
 * @returns Global schema collection
 *
 * @example
 * ```typescript
 * // In app/layout.tsx
 * export default function RootLayout({ children }) {
 *   const globalSchemas = generateGlobalSchemas();
 *
 *   return (
 *     <html>
 *       <head>
 *         <script
 *           type="application/ld+json"
 *           dangerouslySetInnerHTML={{
 *             __html: JSON.stringify([globalSchemas.organization, globalSchemas.website])
 *           }}
 *         />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 */
export function generateGlobalSchemas(): GlobalSchemas {
  return {
    organization: generateOrganizationSchema(),
    website: generateWebSiteSchema(),
  };
}

/**
 * Format schemas for insertion into <head> tag
 *
 * Converts schema objects into JSON-LD script format
 *
 * @param schemas - Generated schemas
 * @returns Array of schema objects ready for JSON-LD
 *
 * @example
 * ```typescript
 * // In your page component
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{
 *     __html: JSON.stringify(formatSchemasForHead(schemas))
 *   }}
 * />
 * ```
 */
export function formatSchemasForHead(
  schemas: RestaurantPageSchemas
): Array<
  | SchemaRestaurant
  | SchemaFAQPage
  | SchemaBreadcrumbList
  | SchemaMenu
  | ImageObject
> {
  const result: Array<
    | SchemaRestaurant
    | SchemaFAQPage
    | SchemaBreadcrumbList
    | SchemaMenu
    | ImageObject
  > = [];

  // Add in priority order for SEO
  // Priority 1: Restaurant with embedded review[] and aggregateRating (critical for star ratings)
  result.push(schemas.restaurant);

  // Priority 1: Breadcrumb (navigation)
  result.push(schemas.breadcrumb);

  // Priority 1: FAQ (critical for LLM search)
  if (schemas.faq) {
    result.push(schemas.faq);
  }

  // Priority 2: Menu
  if (schemas.menu) {
    result.push(schemas.menu);
  }

  // NOTE: Reviews are embedded in schemas.restaurant.review[] array
  // No standalone Review schemas to avoid duplication

  // Priority 3: Images (for image search)
  if (schemas.images && schemas.images.length > 0) {
    result.push(...schemas.images);
  }

  return result;
}

/**
 * Generate JSON-LD script tag string
 *
 * Convenience function that returns ready-to-use script tag
 *
 * @param schemas - Generated schemas
 * @returns JSON-LD script string
 *
 * @example
 * ```typescript
 * // In your page component
 * <div dangerouslySetInnerHTML={{ __html: generateSchemaScriptTag(schemas) }} />
 * ```
 */
export function generateSchemaScriptTag(schemas: RestaurantPageSchemas): string {
  const schemaArray = formatSchemasForHead(schemas);

  return `<script type="application/ld+json">
${JSON.stringify(schemaArray, null, 2)}
</script>`;
}

/**
 * Validate all schema data before generation
 *
 * Useful for admin panel validation
 *
 * @param restaurant - Restaurant data to validate
 * @returns Validation results with errors and warnings
 */
export function validateRestaurantSchemaData(restaurant: RestaurantData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields for Restaurant schema
  if (!restaurant.name) {
    errors.push('Restaurant name is required');
  }
  if (!restaurant.slug) {
    errors.push('Restaurant slug is required');
  }
  if (!restaurant.address) {
    errors.push('Restaurant address is required');
  }
  if (!restaurant.area) {
    errors.push('Restaurant area is required');
  }

  // Recommended fields
  if (!restaurant.description) {
    warnings.push('Restaurant description is recommended for SEO');
  }
  if (!restaurant.hero_image) {
    warnings.push('Hero image is recommended for rich results');
  }
  if (!restaurant.phone) {
    warnings.push('Phone number is recommended for local business schema');
  }
  if (!restaurant.latitude || !restaurant.longitude) {
    warnings.push('Geographic coordinates are recommended for map integration');
  }
  if (!restaurant.hours) {
    warnings.push('Opening hours are recommended for Google Business integration');
  }
  if (!restaurant.cuisines || restaurant.cuisines.length === 0) {
    warnings.push('At least one cuisine type is recommended');
  }

  // Check ratings
  if (restaurant.total_reviews_aggregated === 0) {
    warnings.push('No reviews found. AggregateRating schema will not be generated');
  }

  // Check FAQs
  if (!restaurant.faqs || restaurant.faqs.length === 0) {
    warnings.push('No FAQs found. FAQ schema will not be generated');
  } else if (restaurant.faqs.length < 3) {
    warnings.push(
      `Only ${restaurant.faqs.length} FAQ(s) found. Recommended: 3-5 for better SEO`
    );
  }

  // Check menu
  if (!restaurant.dishes || restaurant.dishes.length === 0) {
    warnings.push('No menu items found. Menu schema will not be generated');
  }

  // Check images
  if (!restaurant.images || restaurant.images.length === 0) {
    warnings.push('No images found. ImageObject schema will not be generated');
  } else if (restaurant.images.length < 3) {
    warnings.push(
      `Only ${restaurant.images.length} image(s) found. Recommended: 5+ for better image search visibility`
    );
  }

  // Check reviews (embedded in Restaurant schema)
  const apifyOutput = restaurant as any;
  if (!apifyOutput.apify_output?.reviews || apifyOutput.apify_output.reviews.length === 0) {
    warnings.push('No reviews found in apify_output. Restaurant schema will not include review[] property');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get schema.org URLs for testing in Google Rich Results Test
 *
 * @returns Object with testing URLs
 */
export function getSchemaTestingUrls() {
  return {
    richResultsTest: 'https://search.google.com/test/rich-results',
    schemaValidator: 'https://validator.schema.org/',
    structuredDataLinter: 'https://search.google.com/structured-data/testing-tool',
  };
}

/**
 * Default schema generation options
 */
export const DEFAULT_SCHEMA_OPTIONS: SchemaGeneratorOptions = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bestgoa.com',
  includeMenu: true,
  includeImages: true,
  includeReviews: true, // Embeds reviews in Restaurant schema (not standalone)
  includeFAQ: true,
  includeBreadcrumb: true,
};
