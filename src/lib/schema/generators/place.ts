/**
 * Place Schema.org Generator
 *
 * Generates structured data markup for general places including:
 * - Tourist attractions (Goa Towers, Grand Mosque)
 * - Parks and beaches (Al Shaheed Park, Messila Beach)
 * - Museums and cultural sites
 * - Educational institutions (schools, universities)
 * - Shopping centers (The Avenues, 360 Mall)
 * - Landmarks and historical buildings
 *
 * Based on Schema.org Place specification
 */

import type { SchemaPlace, PlaceData, SchemaGeneratorOptions } from '../types';

/**
 * Generate Place schema for a location
 *
 * @param place - Place data from database
 * @param options - Schema generation options
 * @returns Complete Place schema object
 *
 * @example
 * ```typescript
 * const goaTowersSchema = generatePlaceSchema({
 *   id: '123',
 *   slug: 'goa-towers',
 *   name: 'Goa Towers',
 *   description: 'Iconic landmark consisting of three towers...',
 *   type: 'TouristAttraction',
 *   address: 'Arabian Gulf Street',
 *   area: 'Goa City',
 *   latitude: 29.3759,
 *   longitude: 47.9774,
 *   is_free: false,
 *   public_access: true
 * }, { baseUrl: 'https://www.bestofgoa.com' });
 * ```
 */
export function generatePlaceSchema(
  place: PlaceData,
  options: SchemaGeneratorOptions
): SchemaPlace {
  const baseUrl = options.baseUrl || 'https://www.bestofgoa.com';
  const placeUrl = `${baseUrl}/places/${place.slug}`;

  const schema: SchemaPlace = {
    '@context': 'https://schema.org',
    '@type': place.type || 'Place',
    '@id': placeUrl,
    name: place.name,
    description: place.description,
    url: placeUrl,

    // Address
    address: {
      '@type': 'PostalAddress',
      streetAddress: place.address,
      addressLocality: place.area,
      addressCountry: {
        '@type': 'Country',
        name: 'KW',
      },
    },
  };

  // Add alternate name (Arabic)
  if (place.name_ar) {
    schema.alternateName = place.name_ar;
  }

  // Add geo coordinates
  if (place.latitude && place.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: place.latitude,
      longitude: place.longitude,
    };
  }

  // Add primary image
  if (place.hero_image) {
    schema.image = place.hero_image;
  } else if (place.images && place.images.length > 0) {
    // Use all images if no hero image
    schema.image = place.images.map((img) => img.url);
  }

  // Add contact information
  if (place.phone) {
    schema.telephone = place.phone;
  }
  if (place.email) {
    schema.email = place.email;
  }

  // Add operational details
  if (place.is_free !== undefined) {
    schema.isAccessibleForFree = place.is_free;
  }
  if (place.public_access !== undefined) {
    schema.publicAccess = place.public_access;
  }

  // Add opening hours
  if (place.hours) {
    schema.openingHoursSpecification = parseOpeningHours(place.hours);
  }

  // Add aggregate rating
  if (place.overall_rating && place.total_reviews_aggregated) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: place.overall_rating.toFixed(1),
      bestRating: '5',
      worstRating: '1',
      ratingCount: place.total_reviews_aggregated,
      reviewCount: place.total_reviews_aggregated,
    };
  }

  // Add keywords
  if (place.keywords && place.keywords.length > 0) {
    schema.keywords = place.keywords.join(', ');
  }

  // Add amenities
  if (place.amenities && place.amenities.length > 0) {
    schema.amenityFeature = place.amenities.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true,
    }));
  }

  // Add capacity
  if (place.capacity) {
    schema.maximumAttendeeCapacity = place.capacity;
  }

  // Add photo gallery
  if (place.images && place.images.length > 0) {
    schema.photo = place.images.map((img) => ({
      '@type': 'ImageObject',
      url: img.url,
      caption: img.alt_text,
    }));
  }

  // Add contained in place (Goa context)
  schema.containedInPlace = {
    '@type': 'City',
    name: 'Goa City',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KW',
    },
  };

  // Add TouristAttraction-specific properties
  if (place.type === 'TouristAttraction') {
    schema.touristType = determineTouristTypes(place);
    schema.availableLanguage = ['English', 'Arabic'];
  }

  return schema;
}

/**
 * Parse opening hours string into OpeningHoursSpecification array
 *
 * @param hours - Hours string from database
 * @returns Array of opening hours specifications
 */
function parseOpeningHours(
  hours: string
): Array<{
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string | string[];
  opens: string;
  closes: string;
}> {
  // Simple parser for common formats
  // Expected format: "Mon-Fri: 9:00-18:00, Sat-Sun: 10:00-20:00"

  const specifications: Array<{
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string | string[];
    opens: string;
    closes: string;
  }> = [];

  // Split by comma for different day ranges
  const parts = hours.split(',').map((p) => p.trim());

  for (const part of parts) {
    // Extract days and times
    const match = part.match(/([^:]+):\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
    if (match) {
      const [, daysStr, opens, closes] = match;
      const days = parseDayRange(daysStr.trim());

      if (days.length > 0) {
        specifications.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: days.length === 1 ? days[0] : days,
          opens,
          closes,
        });
      }
    }
  }

  return specifications;
}

/**
 * Parse day range string into array of day names
 *
 * @param daysStr - Day range string (e.g., "Mon-Fri", "Sat")
 * @returns Array of Schema.org day names
 */
function parseDayRange(daysStr: string): string[] {
  const dayMap: Record<string, string> = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  };

  // Handle ranges like "Mon-Fri"
  if (daysStr.includes('-')) {
    const [start, end] = daysStr.split('-').map((d) => d.trim());
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const startIdx = dayOrder.indexOf(start);
    const endIdx = dayOrder.indexOf(end);

    if (startIdx !== -1 && endIdx !== -1) {
      const range = [];
      for (let i = startIdx; i <= endIdx; i++) {
        range.push(dayMap[dayOrder[i]]);
      }
      return range;
    }
  }

  // Single day
  if (dayMap[daysStr]) {
    return [dayMap[daysStr]];
  }

  return [];
}

/**
 * Determine tourist types based on place characteristics
 *
 * @param place - Place data
 * @returns Array of tourist type strings
 */
function determineTouristTypes(place: PlaceData): string[] {
  const types: string[] = [];

  // Based on place type
  switch (place.type) {
    case 'TouristAttraction':
      types.push('Sightseeing');
      break;
    case 'Park':
      types.push('Family', 'Recreation');
      break;
    case 'Beach':
      types.push('Beach', 'Family', 'Sports');
      break;
    case 'Museum':
      types.push('Culture', 'Education');
      break;
    case 'ShoppingCenter':
      types.push('Shopping', 'Entertainment');
      break;
    case 'EducationalOrganization':
      types.push('Education');
      break;
  }

  // Based on keywords
  if (place.keywords) {
    if (place.keywords.some((k) => /family|kids|children/i.test(k))) {
      types.push('Family');
    }
    if (place.keywords.some((k) => /luxury|premium/i.test(k))) {
      types.push('Luxury');
    }
    if (place.keywords.some((k) => /culture|heritage|history/i.test(k))) {
      types.push('Culture');
    }
  }

  return [...new Set(types)]; // Remove duplicates
}

/**
 * Validate place data before schema generation
 *
 * @param place - Place data to validate
 * @returns Validation result with errors and warnings
 */
export function validatePlaceData(place: PlaceData): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!place.name) {
    errors.push('Place name is required');
  }
  if (!place.slug) {
    errors.push('Place slug is required');
  }
  if (!place.description) {
    errors.push('Place description is required');
  }
  if (!place.address) {
    errors.push('Place address is required');
  }
  if (!place.area) {
    errors.push('Place area/locality is required');
  }

  // Recommended fields
  if (!place.latitude || !place.longitude) {
    warnings.push('Geographic coordinates are recommended for map integration');
  }
  if (!place.phone && !place.email && !place.website) {
    warnings.push('At least one contact method is recommended');
  }
  if (!place.hero_image && (!place.images || place.images.length === 0)) {
    warnings.push('At least one image is recommended for visual appeal');
  }
  if (!place.hours) {
    warnings.push('Opening hours are recommended for visitor planning');
  }
  if (place.is_free === undefined) {
    warnings.push('Free entry status is recommended');
  }
  if (!place.keywords || place.keywords.length === 0) {
    warnings.push('Keywords are recommended for search optimization');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
