/**
 * BreadcrumbList Schema.org Generator
 *
 * Generates structured data markup for breadcrumb navigation
 * following Schema.org BreadcrumbList best practices.
 */

import type {
  RestaurantData,
  SchemaBreadcrumbList,
  SchemaBreadcrumbItem,
  SchemaGeneratorOptions,
} from '../types';

/**
 * Generate BreadcrumbList schema markup for restaurant pages
 */
export function generateRestaurantBreadcrumbSchema(
  restaurant: RestaurantData,
  options: SchemaGeneratorOptions
): SchemaBreadcrumbList {
  const items: SchemaBreadcrumbItem[] = [];

  // 1. Home
  items.push({
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: options.baseUrl,
  });

  // 2. Places to Eat
  items.push({
    '@type': 'ListItem',
    position: 2,
    name: 'Places to Eat',
    item: `${options.baseUrl}/places-to-eat`,
  });

  // 3. Restaurants
  items.push({
    '@type': 'ListItem',
    position: 3,
    name: 'Restaurants',
    item: `${options.baseUrl}/places-to-eat`,
  });

  // 4. Current Restaurant (no item URL on last breadcrumb)
  items.push({
    '@type': 'ListItem',
    position: 4,
    name: restaurant.name,
    item: `${options.baseUrl}/places-to-eat/restaurants/${restaurant.slug}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Generate BreadcrumbList for restaurant menu pages
 */
export function generateRestaurantMenuBreadcrumbSchema(
  restaurant: RestaurantData,
  options: SchemaGeneratorOptions
): SchemaBreadcrumbList {
  const items: SchemaBreadcrumbItem[] = [];

  // 1. Home
  items.push({
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: options.baseUrl,
  });

  // 2. Places to Eat
  items.push({
    '@type': 'ListItem',
    position: 2,
    name: 'Places to Eat',
    item: `${options.baseUrl}/places-to-eat`,
  });

  // 3. Restaurants
  items.push({
    '@type': 'ListItem',
    position: 3,
    name: 'Restaurants',
    item: `${options.baseUrl}/places-to-eat`,
  });

  // 4. Restaurant
  items.push({
    '@type': 'ListItem',
    position: 4,
    name: restaurant.name,
    item: `${options.baseUrl}/places-to-eat/restaurants/${restaurant.slug}`,
  });

  // 5. Menu
  items.push({
    '@type': 'ListItem',
    position: 5,
    name: 'Menu',
    item: `${options.baseUrl}/places-to-eat/restaurants/${restaurant.slug}/menu`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Generate BreadcrumbList for cuisine category pages
 *
 * @example /places-to-eat/cuisines/japanese-restaurants
 */
export function generateCuisineBreadcrumbSchema(
  cuisineName: string,
  cuisineSlug: string,
  options: SchemaGeneratorOptions
): SchemaBreadcrumbList {
  const items: SchemaBreadcrumbItem[] = [];

  // 1. Home
  items.push({
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: options.baseUrl,
  });

  // 2. Places to Eat
  items.push({
    '@type': 'ListItem',
    position: 2,
    name: 'Places to Eat',
    item: `${options.baseUrl}/places-to-eat`,
  });

  // 3. Cuisines
  items.push({
    '@type': 'ListItem',
    position: 3,
    name: 'Cuisines',
    item: `${options.baseUrl}/places-to-eat/cuisines`,
  });

  // 4. Specific Cuisine
  items.push({
    '@type': 'ListItem',
    position: 4,
    name: cuisineName,
    item: `${options.baseUrl}/places-to-eat/cuisines/${cuisineSlug}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Generate BreadcrumbList for area pages
 *
 * @example /places-to-eat/areas/goa-city
 */
export function generateAreaBreadcrumbSchema(
  areaName: string,
  areaSlug: string,
  options: SchemaGeneratorOptions
): SchemaBreadcrumbList {
  const items: SchemaBreadcrumbItem[] = [];

  // 1. Home
  items.push({
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: options.baseUrl,
  });

  // 2. Places to Eat
  items.push({
    '@type': 'ListItem',
    position: 2,
    name: 'Places to Eat',
    item: `${options.baseUrl}/places-to-eat`,
  });

  // 3. Areas
  items.push({
    '@type': 'ListItem',
    position: 3,
    name: 'Areas',
    item: `${options.baseUrl}/places-to-eat/areas`,
  });

  // 4. Specific Area
  items.push({
    '@type': 'ListItem',
    position: 4,
    name: areaName,
    item: `${options.baseUrl}/places-to-eat/areas/${areaSlug}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Generate BreadcrumbList for dish type pages
 *
 * @example /places-to-eat/dishes/sushi
 */
export function generateDishTypeBreadcrumbSchema(
  dishTypeName: string,
  dishTypeSlug: string,
  options: SchemaGeneratorOptions
): SchemaBreadcrumbList {
  const items: SchemaBreadcrumbItem[] = [];

  // 1. Home
  items.push({
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: options.baseUrl,
  });

  // 2. Places to Eat
  items.push({
    '@type': 'ListItem',
    position: 2,
    name: 'Places to Eat',
    item: `${options.baseUrl}/places-to-eat`,
  });

  // 3. Dishes
  items.push({
    '@type': 'ListItem',
    position: 3,
    name: 'Dishes',
    item: `${options.baseUrl}/places-to-eat/dishes`,
  });

  // 4. Specific Dish Type
  items.push({
    '@type': 'ListItem',
    position: 4,
    name: dishTypeName,
    item: `${options.baseUrl}/places-to-eat/dishes/${dishTypeSlug}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Generate BreadcrumbList schema markup for hotel pages
 *
 * @example /places-to-stay/hotels/hilton-goa-resort
 */
export function generateHotelBreadcrumbSchema(
  hotelName: string,
  hotelSlug: string,
  options: SchemaGeneratorOptions
): SchemaBreadcrumbList {
  const items: SchemaBreadcrumbItem[] = [];

  // 1. Home
  items.push({
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: options.baseUrl,
  });

  // 2. Places to Stay
  items.push({
    '@type': 'ListItem',
    position: 2,
    name: 'Places to Stay',
    item: `${options.baseUrl}/places-to-stay`,
  });

  // 3. Hotels
  items.push({
    '@type': 'ListItem',
    position: 3,
    name: 'Hotels',
    item: `${options.baseUrl}/places-to-stay`,
  });

  // 4. Current Hotel
  items.push({
    '@type': 'ListItem',
    position: 4,
    name: hotelName,
    item: `${options.baseUrl}/places-to-stay/hotels/${hotelSlug}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * Generate BreadcrumbList for hotel category pages
 *
 * @example /places-to-stay/luxury-hotels
 */
export function generateHotelCategoryBreadcrumbSchema(
  categoryName: string,
  categorySlug: string,
  options: SchemaGeneratorOptions
): SchemaBreadcrumbList {
  const items: SchemaBreadcrumbItem[] = [];

  // 1. Home
  items.push({
    '@type': 'ListItem',
    position: 1,
    name: 'Home',
    item: options.baseUrl,
  });

  // 2. Places to Stay
  items.push({
    '@type': 'ListItem',
    position: 2,
    name: 'Places to Stay',
    item: `${options.baseUrl}/places-to-stay`,
  });

  // 3. Specific Category
  items.push({
    '@type': 'ListItem',
    position: 3,
    name: categoryName,
    item: `${options.baseUrl}/places-to-stay/${categorySlug}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}
