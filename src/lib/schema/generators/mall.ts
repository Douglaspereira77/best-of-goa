/**
 * Mall Schema.org Generator
 *
 * Generates structured data markup for shopping malls including:
 * - Basic mall information (name, address, contact)
 * - Store and facility counts
 * - Operating hours
 * - Aggregate ratings and reviews
 *
 * Based on Schema.org ShoppingCenter specification
 */

import type { SchemaGeneratorOptions } from '../types';

export interface MallData {
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
  snapchat?: string;

  // Mall Details
  total_stores?: number;
  total_floors?: number;
  total_parking_spaces?: number;
  gross_leasable_area_sqm?: number;
  year_opened?: number;
  year_renovated?: number;
  mall_type?: string; // 'regional', 'super_regional', 'community', 'lifestyle', 'outlet'

  // Operating Hours
  weekday_open_time?: string;
  weekday_close_time?: string;
  weekend_open_time?: string;
  weekend_close_time?: string;

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

  // Features
  features?: Array<{ name: string; slug?: string; icon?: string }>;

  // Categories
  categories?: Array<{ id: string; name: string; slug: string }>;
}

export interface SchemaMall {
  '@context': 'https://schema.org';
  '@type': 'ShoppingCenter';
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

  // Operating hours
  openingHoursSpecification?: Array<{
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string | string[];
    opens: string;
    closes: string;
  }>;

  // Mall specifics
  numberOfRooms?: number; // Number of stores
  floorSize?: {
    '@type': 'QuantitativeValue';
    value: number;
    unitCode: 'MTK'; // Square meters
  };

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

  // Additional
  foundingDate?: string;
  sameAs?: string[];
  containedInPlace?: {
    '@type': 'City' | 'Country';
    name: string;
  };
  hasMap?: string;
}

/**
 * Generate Mall schema for a mall detail page
 *
 * @param mall - Mall data from database
 * @param options - Schema generation options
 * @returns Complete ShoppingCenter schema object
 *
 * @example
 * ```typescript
 * const mallSchema = generateMallSchema({
 *   slug: 'the-avenues-goa',
 *   name: 'The Avenues Goa',
 *   total_stores: 800,
 *   ...
 * }, { baseUrl: 'https://www.bestofgoa.com' });
 * ```
 */
export function generateMallSchema(
  mall: MallData,
  options: SchemaGeneratorOptions
): SchemaMall {
  const baseUrl = options.baseUrl || 'https://www.bestofgoa.com';
  const mallUrl = `${baseUrl}/places-to-shop/malls/${mall.slug}`;

  const schema: SchemaMall = {
    '@context': 'https://schema.org',
    '@type': 'ShoppingCenter',
    '@id': mallUrl,
    name: mall.name,
    url: mallUrl,

    // Address
    address: {
      '@type': 'PostalAddress',
      streetAddress: mall.address,
      addressLocality: mall.area || mall.governorate || 'Goa City',
      addressRegion: mall.governorate,
      addressCountry: 'KW',
    },
  };

  // Alternate name (Arabic)
  if (mall.name_ar) {
    schema.alternateName = mall.name_ar;
  }

  // Description
  if (mall.description || mall.short_description) {
    schema.description = mall.short_description || mall.description?.substring(0, 300);
  }

  // Geo coordinates
  if (mall.latitude && mall.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: mall.latitude,
      longitude: mall.longitude,
    };

    // Add map link
    schema.hasMap = `https://www.google.com/maps?q=${mall.latitude},${mall.longitude}`;
  }

  // Images
  if (mall.hero_image) {
    schema.image = mall.hero_image;
  } else if (mall.images && mall.images.length > 0) {
    schema.image = mall.images.map((img) => img.url);
  }

  // Logo
  if (mall.logo_image) {
    schema.logo = mall.logo_image;
  }

  // Contact
  if (mall.phone) {
    schema.telephone = mall.phone;
  }
  if (mall.email) {
    schema.email = mall.email;
  }

  // Number of stores
  if (mall.total_stores) {
    schema.numberOfRooms = mall.total_stores;
  }

  // Floor size (gross leasable area)
  if (mall.gross_leasable_area_sqm) {
    schema.floorSize = {
      '@type': 'QuantitativeValue',
      value: mall.gross_leasable_area_sqm,
      unitCode: 'MTK', // Square meters
    };
  }

  // Year opened
  if (mall.year_opened) {
    schema.foundingDate = mall.year_opened.toString();
  }

  // Operating hours
  const openingHours: Array<{
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string | string[];
    opens: string;
    closes: string;
  }> = [];

  if (mall.weekday_open_time && mall.weekday_close_time) {
    openingHours.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: mall.weekday_open_time,
      closes: mall.weekday_close_time,
    });
  }

  if (mall.weekend_open_time && mall.weekend_close_time) {
    openingHours.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Friday', 'Saturday'],
      opens: mall.weekend_open_time,
      closes: mall.weekend_close_time,
    });
  }

  if (openingHours.length > 0) {
    schema.openingHoursSpecification = openingHours;
  }

  // Amenities
  const allAmenities = [
    ...(mall.amenities || []),
    ...(mall.features || []),
  ];

  if (allAmenities.length > 0) {
    schema.amenityFeature = allAmenities.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity.name,
      value: true,
    }));
  }

  // Add parking as amenity if available
  if (mall.total_parking_spaces) {
    if (!schema.amenityFeature) {
      schema.amenityFeature = [];
    }
    schema.amenityFeature.push({
      '@type': 'LocationFeatureSpecification',
      name: `Parking (${mall.total_parking_spaces} spaces)`,
      value: true,
    });
  }

  // Aggregate rating (use BOK score or Google rating)
  const ratingValue = mall.bok_score || mall.google_rating;
  const reviewCount = mall.total_reviews_aggregated || mall.google_review_count;

  if (ratingValue && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: mall.bok_score ? ratingValue.toFixed(1) : ratingValue.toFixed(1),
      bestRating: mall.bok_score ? '10' : '5',
      worstRating: '1',
      ratingCount: reviewCount,
      reviewCount: reviewCount,
    };
  }

  // Social media links
  const socialLinks: string[] = [];
  if (mall.website) socialLinks.push(mall.website);
  if (mall.instagram) socialLinks.push(`https://instagram.com/${mall.instagram.replace('@', '')}`);
  if (mall.facebook) socialLinks.push(mall.facebook.startsWith('http') ? mall.facebook : `https://facebook.com/${mall.facebook}`);
  if (mall.twitter) socialLinks.push(`https://twitter.com/${mall.twitter.replace('@', '')}`);
  if (mall.snapchat) socialLinks.push(`https://snapchat.com/add/${mall.snapchat}`);

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
 * Generate breadcrumb schema for mall page
 */
export function generateMallBreadcrumbSchema(
  mall: MallData,
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
        name: 'Places to Shop',
        item: `${baseUrl}/places-to-shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: mall.name,
        item: `${baseUrl}/places-to-shop/malls/${mall.slug}`,
      },
    ],
  };
}
