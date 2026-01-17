/**
 * Hotel Schema.org Generator
 *
 * Generates structured data markup for hotels including:
 * - Basic hotel information (name, address, contact)
 * - Star rating and amenities
 * - Check-in/check-out times
 * - Aggregate ratings and reviews
 * - Images and photos
 *
 * Based on Schema.org Hotel/LodgingBusiness specification
 */

import type { SchemaGeneratorOptions } from '../types';

export interface HotelData {
  id: string;
  slug: string;
  name: string;
  name_ar?: string;
  description?: string;
  short_description?: string;

  // Location
  address?: string;
  area?: string;
  governorate?: string;
  latitude?: number;
  longitude?: number;

  // Contact
  phone?: string;
  email?: string;
  website?: string;
  whatsapp?: string;

  // Social Media
  instagram?: string;
  facebook?: string;
  twitter?: string;

  // Hotel Details
  star_rating?: number;
  total_rooms?: number;
  check_in_time?: string;
  check_out_time?: string;
  price_range?: string;

  // Policies
  pet_policy?: string;
  smoking_policy?: string;
  cancellation_policy?: string;

  // Images
  hero_image?: string;
  logo_image?: string;
  images?: Array<{
    url: string;
    alt_text?: string;
    is_hero?: boolean;
  }>;

  // Ratings
  bok_score?: number;
  google_rating?: number;
  google_review_count?: number;
  total_reviews_aggregated?: number;

  // Amenities
  amenities?: Array<{ name: string; slug?: string; category?: string }>;

  // Categories
  categories?: Array<{ id: string; name: string; slug: string }>;
}

export interface SchemaHotel {
  '@context': 'https://schema.org';
  '@type': 'Hotel';
  '@id'?: string;
  name: string;
  alternateName?: string;
  description?: string;
  url?: string;
  image?: string | string[];
  logo?: string;

  // Location
  address: {
    '@type': 'PostalAddress';
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    addressCountry: string;
  };
  geo?: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };

  // Contact
  telephone?: string;
  email?: string;

  // Hotel specifics
  starRating?: {
    '@type': 'Rating';
    ratingValue: number;
  };
  numberOfRooms?: number;
  checkinTime?: string;
  checkoutTime?: string;
  priceRange?: string;

  // Policies
  petsAllowed?: boolean;
  smokingAllowed?: boolean;

  // Amenities
  amenityFeature?: Array<{
    '@type': 'LocationFeatureSpecification';
    name: string;
    value: boolean;
  }>;

  // Ratings
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number | string;
    bestRating: string;
    worstRating: string;
    ratingCount: number;
    reviewCount?: number;
  };

  // Social links
  sameAs?: string[];

  // Additional
  containedInPlace?: {
    '@type': 'City' | 'Country';
    name: string;
  };
}

/**
 * Generate Hotel schema for a hotel detail page
 *
 * @param hotel - Hotel data from database
 * @param options - Schema generation options
 * @returns Complete Hotel schema object
 *
 * @example
 * ```typescript
 * const hotelSchema = generateHotelSchema({
 *   slug: 'four-seasons-goa',
 *   name: 'Four Seasons Hotel Goa',
 *   star_rating: 5,
 *   area: 'Goa City',
 *   ...
 * }, { baseUrl: 'https://www.bestofgoa.com' });
 * ```
 */
export function generateHotelSchema(
  hotel: HotelData,
  options: SchemaGeneratorOptions
): SchemaHotel {
  const baseUrl = options.baseUrl || 'https://www.bestofgoa.com';
  const hotelUrl = `${baseUrl}/places-to-stay/hotels/${hotel.slug}`;

  const schema: SchemaHotel = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    '@id': hotelUrl,
    name: hotel.name,
    url: hotelUrl,

    // Address
    address: {
      '@type': 'PostalAddress',
      streetAddress: hotel.address,
      addressLocality: hotel.area || hotel.governorate || 'Goa City',
      addressRegion: hotel.governorate,
      addressCountry: 'KW',
    },
  };

  // Alternate name (Arabic)
  if (hotel.name_ar) {
    schema.alternateName = hotel.name_ar;
  }

  // Description
  if (hotel.description || hotel.short_description) {
    schema.description = hotel.short_description || hotel.description?.substring(0, 300);
  }

  // Geo coordinates
  if (hotel.latitude && hotel.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: hotel.latitude,
      longitude: hotel.longitude,
    };
  }

  // Images
  if (hotel.hero_image) {
    schema.image = hotel.hero_image;
  } else if (hotel.images && hotel.images.length > 0) {
    schema.image = hotel.images.map((img) => img.url);
  }

  // Logo
  if (hotel.logo_image) {
    schema.logo = hotel.logo_image;
  }

  // Contact
  if (hotel.phone) {
    schema.telephone = hotel.phone;
  }
  if (hotel.email) {
    schema.email = hotel.email;
  }

  // Star rating
  if (hotel.star_rating) {
    schema.starRating = {
      '@type': 'Rating',
      ratingValue: hotel.star_rating,
    };
  }

  // Number of rooms
  if (hotel.total_rooms) {
    schema.numberOfRooms = hotel.total_rooms;
  }

  // Check-in/out times
  if (hotel.check_in_time) {
    schema.checkinTime = hotel.check_in_time;
  }
  if (hotel.check_out_time) {
    schema.checkoutTime = hotel.check_out_time;
  }

  // Price range
  if (hotel.price_range) {
    schema.priceRange = hotel.price_range;
  }

  // Policies
  if (hotel.pet_policy) {
    schema.petsAllowed = hotel.pet_policy === 'pets_allowed' || hotel.pet_policy === 'allowed';
  }
  if (hotel.smoking_policy) {
    schema.smokingAllowed = hotel.smoking_policy === 'smoking_allowed' || hotel.smoking_policy === 'allowed';
  }

  // Amenities
  if (hotel.amenities && hotel.amenities.length > 0) {
    schema.amenityFeature = hotel.amenities.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity.name,
      value: true,
    }));
  }

  // Aggregate rating (use BOK score or Google rating)
  const ratingValue = hotel.bok_score || hotel.google_rating;
  const reviewCount = hotel.total_reviews_aggregated || hotel.google_review_count;

  if (ratingValue && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: hotel.bok_score ? ratingValue.toFixed(1) : ratingValue.toFixed(1),
      bestRating: hotel.bok_score ? '10' : '5',
      worstRating: '1',
      ratingCount: reviewCount,
      reviewCount: reviewCount,
    };
  }

  // Social media links
  const socialLinks: string[] = [];
  if (hotel.website) socialLinks.push(hotel.website);
  if (hotel.instagram) socialLinks.push(`https://instagram.com/${hotel.instagram.replace('@', '')}`);
  if (hotel.facebook) socialLinks.push(hotel.facebook.startsWith('http') ? hotel.facebook : `https://facebook.com/${hotel.facebook}`);
  if (hotel.twitter) socialLinks.push(`https://twitter.com/${hotel.twitter.replace('@', '')}`);

  if (socialLinks.length > 0) {
    schema.sameAs = socialLinks;
  }

  // Contained in place
  schema.containedInPlace = {
    '@type': 'Country',
    name: 'Goa',
  };

  return schema;
}

/**
 * Generate breadcrumb schema for hotel page
 */
export function generateHotelBreadcrumbSchema(
  hotel: HotelData,
  options: SchemaGeneratorOptions
) {
  const baseUrl = options.baseUrl || 'https://www.bestofgoa.com';

  return {
    '@context': 'https://schema.org',
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
        name: 'Places to Stay',
        item: `${baseUrl}/places-to-stay`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: hotel.name,
        item: `${baseUrl}/places-to-stay/hotels/${hotel.slug}`,
      },
    ],
  };
}
