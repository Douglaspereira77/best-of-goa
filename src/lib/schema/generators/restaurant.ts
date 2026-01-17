/**
 * Restaurant Schema.org Generator
 *
 * Generates structured data markup for restaurant pages
 * following Schema.org Restaurant and LocalBusiness best practices.
 */

import type {
  RestaurantData,
  SchemaRestaurant,
  SchemaPostalAddress,
  SchemaGeoCoordinates,
  SchemaOpeningHours,
  SchemaAggregateRating,
  SchemaAmenityFeature,
  SchemaGeneratorOptions,
} from '../types';
import { getDistrictFromArea } from '@/lib/utils/goa-locations';
import { generateReviewsSchema } from './review';

/**
 * Generate complete Restaurant schema markup
 */
export function generateRestaurantSchema(
  restaurant: RestaurantData,
  options: SchemaGeneratorOptions
): SchemaRestaurant {
  const restaurantUrl = `${options.baseUrl}/places-to-eat/restaurants/${restaurant.slug}`;

  const schema: SchemaRestaurant = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    url: restaurantUrl,
    address: generateAddress(restaurant),
  };

  // Description
  if (restaurant.description) {
    schema.description = restaurant.description;
  }

  // Images
  if (options.includeImages) {
    schema.image = generateImages(restaurant);
  }

  // Logo
  if (restaurant.logo_image) {
    schema.logo = restaurant.logo_image;
  }

  // Geographic coordinates
  if (restaurant.latitude && restaurant.longitude) {
    schema.geo = generateGeoCoordinates(restaurant);
  }

  // Contact information
  if (restaurant.phone) {
    schema.telephone = restaurant.phone;
  }
  if (restaurant.email) {
    schema.email = restaurant.email;
  }

  // Opening hours
  if (restaurant.hours) {
    schema.openingHoursSpecification = generateOpeningHours(restaurant.hours);
  }

  // Individual Reviews (up to 10 most recent for SEO)
  // IMPORTANT: Google requires aggregateRating when multiple reviews exist
  if (restaurant.reviews && restaurant.reviews.length > 0) {
    const mappedReviews = restaurant.reviews.map((r) => ({
      author: r.author_name || r.author || 'Anonymous',
      date: r.date || r.relative_time_description || new Date().toISOString(),
      text: r.text || '',
      rating: r.rating || 5,
    }));

    schema.review = generateReviewsSchema(mappedReviews);

    // Ensure aggregateRating exists when reviews are present (Schema.org requirement)
    if (restaurant.total_reviews_aggregated > 0 && restaurant.overall_rating) {
      // Use database aggregated rating if available
      schema.aggregateRating = generateAggregateRating(restaurant);
    } else {
      // Calculate from reviews array as fallback
      const avgRating = mappedReviews.reduce((sum, r) => sum + r.rating, 0) / mappedReviews.length;
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(2),
        bestRating: '5',
        worstRating: '1',
        ratingCount: restaurant.reviews.length,
      };
    }
  } else if (restaurant.total_reviews_aggregated > 0 && restaurant.overall_rating) {
    // No individual reviews to show, but we have aggregate data
    schema.aggregateRating = generateAggregateRating(restaurant);
  }

  // Cuisines
  if (restaurant.cuisines && restaurant.cuisines.length > 0) {
    schema.servesCuisine = restaurant.cuisines.map((c) => c.name);
  }

  // Price range
  schema.priceRange = generatePriceRange(restaurant.price_level);

  // Reservations
  if (restaurant.reservations_policy) {
    schema.acceptsReservations = restaurant.reservations_policy !== 'Walk-ins only';
  }

  // Payment methods
  if (restaurant.payment_methods && restaurant.payment_methods.length > 0) {
    schema.paymentAccepted = restaurant.payment_methods.join(', ');
  }

  // Currency (INR for Goa)
  schema.currenciesAccepted = restaurant.currency || 'INR';

  // Menu link
  if (options.includeMenu) {
    schema.hasMenu = `${restaurantUrl}/menu`;
  }

  // Social media profiles
  const socialLinks = [
    restaurant.instagram,
    restaurant.facebook,
    restaurant.twitter,
  ].filter(Boolean) as string[];

  if (socialLinks.length > 0) {
    schema.sameAs = socialLinks;
  }

  // Amenities/Features
  if (restaurant.features && restaurant.features.length > 0) {
    schema.amenityFeature = generateAmenityFeatures(restaurant.features);
  }

  // knowsAbout - Restaurant specialties and signature items
  const knowsAbout = generateKnowsAbout(restaurant);
  if (knowsAbout.length > 0) {
    schema.knowsAbout = knowsAbout;
  }

  // Keywords - SEO targeting for local search queries
  schema.keywords = generateRestaurantKeywords(restaurant);

  // Smoking policy (default false)
  schema.smokingAllowed = false;

  // Google Maps link
  if (restaurant.latitude && restaurant.longitude) {
    schema.hasMap = `https://maps.google.com/?q=${restaurant.latitude},${restaurant.longitude}`;
  }

  return schema;
}

/**
 * Generate postal address
 * Includes Goa-specific district derivation from area
 */
function generateAddress(restaurant: RestaurantData): SchemaPostalAddress {
  const address: SchemaPostalAddress = {
    '@type': 'PostalAddress',
    streetAddress: restaurant.address,
    addressLocality: restaurant.area,
    addressCountry: 'IN',
  };

  // Add district (derived from area using Goa location mapping)
  const district = getDistrictFromArea(restaurant.area);
  if (district && district !== 'Goa') {
    address.addressRegion = district;
  } else {
    address.addressRegion = 'Goa';
  }

  return address;
}

/**
 * Generate geographic coordinates
 */
function generateGeoCoordinates(restaurant: RestaurantData): SchemaGeoCoordinates {
  return {
    '@type': 'GeoCoordinates',
    latitude: restaurant.latitude!,
    longitude: restaurant.longitude!,
  };
}

/**
 * Generate image URLs
 */
function generateImages(restaurant: RestaurantData): string | string[] {
  const images: string[] = [];

  // Hero image first
  if (restaurant.hero_image) {
    images.push(restaurant.hero_image);
  }

  // Additional approved images
  if (restaurant.images && restaurant.images.length > 0) {
    const additionalImages = restaurant.images
      .filter((img) => img.url && img.url !== restaurant.hero_image)
      .map((img) => img.url);
    images.push(...additionalImages);
  }

  // Return single string or array based on count
  return images.length === 1 ? images[0] : images;
}

/**
 * Generate opening hours specification
 */
function generateOpeningHours(
  hours: Record<string, { open: string; close: string; closed: boolean }>
): SchemaOpeningHours[] {
  // Database uses 3-letter abbreviations (mon, tue, wed, etc.)
  const daysOfWeek = [
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
    'sun',
  ];

  const dayNameMap: Record<string, string> = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday',
  };

  const openingHours: SchemaOpeningHours[] = [];
  let currentGroup: {
    days: string[];
    opens: string;
    closes: string;
  } | null = null;

  // Group consecutive days with same hours
  for (const day of daysOfWeek) {
    const dayHours = hours[day];

    if (!dayHours || dayHours.closed) {
      // Day is closed, finalize current group if exists
      if (currentGroup) {
        openingHours.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek:
            currentGroup.days.length === 1
              ? currentGroup.days[0]
              : currentGroup.days,
          opens: currentGroup.opens,
          closes: currentGroup.closes,
        });
        currentGroup = null;
      }
      continue;
    }

    // Check if we can add to current group
    if (
      currentGroup &&
      currentGroup.opens === dayHours.open &&
      currentGroup.closes === dayHours.close
    ) {
      currentGroup.days.push(dayNameMap[day]);
    } else {
      // Finalize previous group
      if (currentGroup) {
        openingHours.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek:
            currentGroup.days.length === 1
              ? currentGroup.days[0]
              : currentGroup.days,
          opens: currentGroup.opens,
          closes: currentGroup.closes,
        });
      }
      // Start new group
      currentGroup = {
        days: [dayNameMap[day]],
        opens: dayHours.open,
        closes: dayHours.close,
      };
    }
  }

  // Finalize last group
  if (currentGroup) {
    openingHours.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek:
        currentGroup.days.length === 1 ? currentGroup.days[0] : currentGroup.days,
      opens: currentGroup.opens,
      closes: currentGroup.closes,
    });
  }

  return openingHours;
}

/**
 * Generate aggregate rating
 */
function generateAggregateRating(
  restaurant: RestaurantData
): SchemaAggregateRating {
  return {
    '@type': 'AggregateRating',
    ratingValue: restaurant.overall_rating.toFixed(2),
    bestRating: '10',
    worstRating: '0',
    ratingCount: restaurant.total_reviews_aggregated,
  };
}

/**
 * Generate price range string
 */
function generatePriceRange(priceLevel: number): string {
  // Convert symbolic price level to string ($ to $$$$)
  // Best of Goa uses scale 1-4
  if (typeof priceLevel === 'string') {
    return priceLevel;
  }
  return '$'.repeat(Math.max(1, Math.min(4, priceLevel || 1)));
}

/**
 * Generate amenity features
 */
function generateAmenityFeatures(
  features: Array<{ name: string; slug: string; category: string }>
): SchemaAmenityFeature[] {
  return features.map((feature) => ({
    '@type': 'LocationFeatureSpecification',
    name: feature.name,
    value: true,
  }));
}

/**
 * Generate knowsAbout property - Restaurant specialties and expertise
 * Critical for LLM search optimization
 */
function generateKnowsAbout(restaurant: RestaurantData): string[] {
  const knowsAbout: string[] = [];

  // Add cuisines
  if (restaurant.cuisines && restaurant.cuisines.length > 0) {
    restaurant.cuisines.forEach((cuisine) => {
      knowsAbout.push(`${cuisine.name} cuisine`);
    });
  }

  // Add categories
  if (restaurant.categories && restaurant.categories.length > 0) {
    restaurant.categories.forEach((category) => {
      if (category.name !== 'Restaurant') {
        // Avoid generic "Restaurant"
        knowsAbout.push(category.name);
      }
    });
  }

  // Add popular dishes if available
  if (restaurant.dishes && restaurant.dishes.length > 0) {
    // Add up to 3 most popular dishes
    restaurant.dishes.slice(0, 3).forEach((dish) => {
      knowsAbout.push(dish.name);
    });
  }

  // Add "Good For" specializations
  if (restaurant.good_for && restaurant.good_for.length > 0) {
    restaurant.good_for.forEach((goodFor) => {
      knowsAbout.push(goodFor.name);
    });
  }

  return knowsAbout;
}

/**
 * Generate keywords for SEO - Restaurant-specific search queries
 *
 * Targets queries like:
 * - "{restaurant name} goa"
 * - "{cuisine} restaurant {neighborhood}"
 * - "best {cuisine} {area}"
 *
 * Critical for ranking individual restaurant pages in local search
 */
function generateRestaurantKeywords(restaurant: RestaurantData): string {
  const keywords: string[] = [];

  // Brand keywords: restaurant name + location
  keywords.push(`${restaurant.name.toLowerCase()} goa`);
  keywords.push(`${restaurant.name.toLowerCase()} ${restaurant.area.toLowerCase()}`);

  // Cuisine + location combinations
  if (restaurant.cuisines && restaurant.cuisines.length > 0) {
    restaurant.cuisines.forEach((cuisine) => {
      keywords.push(`${cuisine.name.toLowerCase()} restaurant ${restaurant.area.toLowerCase()}`);
      keywords.push(`best ${cuisine.name.toLowerCase()} ${restaurant.area.toLowerCase()}`);
      keywords.push(`${cuisine.name.toLowerCase()} food goa`);

      // Add variation with "restaurant goa"
      keywords.push(`${cuisine.name.toLowerCase()} restaurant goa`);
    });
  }

  // Category-based keywords
  if (restaurant.categories && restaurant.categories.length > 0) {
    restaurant.categories.forEach((category) => {
      // Skip generic "Restaurant" category
      if (category.name !== 'Restaurant') {
        keywords.push(`${category.name.toLowerCase()} ${restaurant.area.toLowerCase()}`);
        keywords.push(`${category.name.toLowerCase()} goa`);
      }
    });
  }

  // Signature dishes (top 3 most popular)
  if (restaurant.dishes && restaurant.dishes.length > 0) {
    restaurant.dishes.slice(0, 3).forEach((dish) => {
      keywords.push(`${dish.name.toLowerCase()} goa`);
      keywords.push(`${dish.name.toLowerCase()} ${restaurant.area.toLowerCase()}`);
    });
  }

  // "Good For" keywords (e.g., "family restaurant panjim")
  if (restaurant.good_for && restaurant.good_for.length > 0) {
    restaurant.good_for.forEach((goodFor) => {
      keywords.push(`${goodFor.name.toLowerCase()} restaurant ${restaurant.area.toLowerCase()}`);
      keywords.push(`${goodFor.name.toLowerCase()} restaurant goa`);
    });
  }

  // Delivery/takeout keywords if applicable
  if (restaurant.features && restaurant.features.length > 0) {
    const hasDelivery = restaurant.features.some(f =>
      f.name.toLowerCase().includes('delivery') ||
      f.name.toLowerCase().includes('takeout')
    );

    if (hasDelivery && restaurant.cuisines && restaurant.cuisines.length > 0) {
      keywords.push(`${restaurant.cuisines[0].name.toLowerCase()} delivery goa`);
      keywords.push(`${restaurant.cuisines[0].name.toLowerCase()} takeout ${restaurant.area.toLowerCase()}`);
    }
  }

  // Return comma-separated string (Schema.org format)
  return keywords.join(', ');
}
