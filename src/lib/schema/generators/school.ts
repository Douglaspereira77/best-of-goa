/**
 * School Schema.org Generator
 *
 * Generates structured data markup for schools including:
 * - Basic school information (name, address, contact)
 * - Educational details (curriculum, grade levels)
 * - Accreditation and facilities
 * - Aggregate ratings and reviews
 *
 * Based on Schema.org EducationalOrganization specification
 */

import type { SchemaGeneratorOptions } from '../types';

export interface SchoolData {
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
  youtube?: string;

  // School Details
  school_type?: string; // 'private', 'public', 'international'
  curriculum?: string | string[]; // 'American', 'British', 'IB', etc.
  grade_levels?: string[]; // ['KG', 'Elementary', 'Middle', 'High']
  founded_year?: number;
  gender_policy?: string; // 'co-ed', 'boys-only', 'girls-only'
  student_capacity?: number;
  student_teacher_ratio?: string;

  // Tuition
  tuition_range_min?: number;
  tuition_range_max?: number;
  currency?: string;

  // Accreditation
  accreditation?: string[];

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
  parent_rating?: number;
  total_reviews_aggregated?: number;

  // Features
  features?: Array<{ name: string; slug?: string; icon?: string }>;

  // Categories
  categories?: Array<{ id: string; name: string; slug: string }>;
}

export interface SchemaSchool {
  '@context': 'https://schema.org';
  '@type': 'EducationalOrganization';
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

  // Educational specifics
  educationalCredentialAwarded?: string;
  isAccreditedBy?: Array<{
    '@type': 'Organization';
    name: string;
  }>;

  // Facilities
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
  numberOfEmployees?: number;
  sameAs?: string[];
  containedInPlace?: {
    '@type': 'City' | 'Country';
    name: string;
  };
}

/**
 * Generate School schema for a school detail page
 *
 * @param school - School data from database
 * @param options - Schema generation options
 * @returns Complete EducationalOrganization schema object
 *
 * @example
 * ```typescript
 * const schoolSchema = generateSchoolSchema({
 *   slug: 'american-school-goa',
 *   name: 'American School of Goa',
 *   curriculum: 'American',
 *   ...
 * }, { baseUrl: 'https://www.bestofgoa.com' });
 * ```
 */
export function generateSchoolSchema(
  school: SchoolData,
  options: SchemaGeneratorOptions
): SchemaSchool {
  const baseUrl = options.baseUrl || 'https://www.bestofgoa.com';
  const schoolUrl = `${baseUrl}/places-to-learn/schools/${school.slug}`;

  const schema: SchemaSchool = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': schoolUrl,
    name: school.name,
    url: schoolUrl,

    // Address
    address: {
      '@type': 'PostalAddress',
      streetAddress: school.address,
      addressLocality: school.area || school.governorate || 'Goa City',
      addressRegion: school.governorate,
      addressCountry: 'KW',
    },
  };

  // Alternate name (Arabic)
  if (school.name_ar) {
    schema.alternateName = school.name_ar;
  }

  // Description
  if (school.description || school.short_description) {
    schema.description = school.short_description || school.description?.substring(0, 300);
  }

  // Geo coordinates
  if (school.latitude && school.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: school.latitude,
      longitude: school.longitude,
    };
  }

  // Images
  if (school.hero_image) {
    schema.image = school.hero_image;
  } else if (school.images && school.images.length > 0) {
    schema.image = school.images.map((img) => img.url);
  }

  // Logo
  if (school.logo_image) {
    schema.logo = school.logo_image;
  }

  // Contact
  if (school.phone) {
    schema.telephone = school.phone;
  }
  if (school.email) {
    schema.email = school.email;
  }

  // Educational credential (curriculum)
  if (school.curriculum) {
    const curriculumStr = Array.isArray(school.curriculum)
      ? school.curriculum.join(', ')
      : school.curriculum;
    schema.educationalCredentialAwarded = `${curriculumStr} Curriculum`;
  }

  // Accreditation
  if (school.accreditation && school.accreditation.length > 0) {
    schema.isAccreditedBy = school.accreditation.map((acc) => ({
      '@type': 'Organization',
      name: acc,
    }));
  }

  // Founding date
  if (school.founded_year) {
    schema.foundingDate = school.founded_year.toString();
  }

  // Features/amenities
  if (school.features && school.features.length > 0) {
    schema.amenityFeature = school.features.map((feature) => ({
      '@type': 'LocationFeatureSpecification',
      name: feature.name,
      value: true,
    }));
  }

  // Aggregate rating (use BOK score, parent rating, or Google rating)
  const ratingValue = school.bok_score || school.parent_rating || school.google_rating;
  const reviewCount = school.total_reviews_aggregated || school.google_review_count;

  if (ratingValue && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: school.bok_score ? ratingValue.toFixed(1) : ratingValue.toFixed(1),
      bestRating: school.bok_score ? '10' : '5',
      worstRating: '1',
      ratingCount: reviewCount,
      reviewCount: reviewCount,
    };
  }

  // Social media links
  const socialLinks: string[] = [];
  if (school.website) socialLinks.push(school.website);
  if (school.instagram) socialLinks.push(`https://instagram.com/${school.instagram.replace('@', '')}`);
  if (school.facebook) socialLinks.push(school.facebook.startsWith('http') ? school.facebook : `https://facebook.com/${school.facebook}`);
  if (school.twitter) socialLinks.push(`https://twitter.com/${school.twitter.replace('@', '')}`);
  if (school.youtube) socialLinks.push(school.youtube.startsWith('http') ? school.youtube : `https://youtube.com/${school.youtube}`);

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
 * Generate breadcrumb schema for school page
 */
export function generateSchoolBreadcrumbSchema(
  school: SchoolData,
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
        name: 'Places to Learn',
        item: `${baseUrl}/places-to-learn`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: school.name,
        item: `${baseUrl}/places-to-learn/schools/${school.slug}`,
      },
    ],
  };
}
