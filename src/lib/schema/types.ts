/**
 * Schema.org Type Definitions for Best of Goa
 *
 * These types represent the structure of Schema.org markup
 * used for SEO and rich results in search engines.
 */

// ============================================================================
// SCHEMA.ORG ENUMS
// ============================================================================

export const SCHEMA_TYPES = {
  RESTAURANT: 'Restaurant',
  FAQ_PAGE: 'FAQPage',
  BREADCRUMB_LIST: 'BreadcrumbList',
  MENU: 'Menu',
  AGGREGATE_RATING: 'AggregateRating',
  REVIEW: 'Review',
  IMAGE_OBJECT: 'ImageObject',
  ORGANIZATION: 'Organization',
  WEBSITE: 'WebSite',
} as const;

// ============================================================================
// RESTAURANT DATA TYPES (from database)
// ============================================================================

export interface RestaurantData {
  id: string;
  slug: string;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  short_description?: string;

  // Location
  address: string;
  area: string;
  latitude?: number;
  longitude?: number;

  // Contact
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  whatsapp?: string;

  // Pricing
  price_level: number; // 1-4
  currency: string;
  average_meal_price?: number;

  // Images
  hero_image?: string;
  logo_image?: string;

  // Ratings
  overall_rating: number; // 0.00-10.00
  total_reviews_aggregated: number;

  // Advanced Ratings (Best of Goa System)
  overall_score?: number;
  score_label?: string;
  food_quality_score?: number;
  service_score?: number;
  ambience_score?: number;
  value_score?: number;
  accessibility_score?: number;
  rating_sources?: any;
  total_review_count?: number;
  sentiment_analyzed?: boolean;
  last_rating_update?: string;

  // Operational
  hours?: Record<string, { open: string; close: string; closed: boolean }>;
  reservations_policy?: string;
  payment_methods?: string[];

  // Additional Fields
  menu_link?: string;
  has_menu_extracted?: boolean;
  review_sentiment?: any; // JSON analysis result

  // Array Relationships (Omar's Pattern) - UUID arrays
  restaurant_cuisine_ids?: string[];
  restaurant_category_ids?: string[];
  restaurant_feature_ids?: string[];
  restaurant_meal_ids?: string[];
  restaurant_good_for_ids?: string[];

  // Single Relationships (Foreign Keys)
  neighborhood_id?: number;
  michelin_guide_award_id?: number;

  // Content Relations
  faqs?: Array<{ question: string; answer: string; display_order: number }>;
  dishes?: Array<RestaurantDish>;
  menu_sections?: Array<MenuSection>;
  images?: Array<RestaurantImage>;
  reviews?: Array<{
    author_name?: string;
    author?: string;
    date?: string;
    relative_time_description?: string;
    text?: string;
    rating?: number;
  }>;

  // Resolved Relations (for display)
  cuisines?: Array<{ id: string; name: string; slug: string }>;
  categories?: Array<{ id: string; name: string; slug: string }>;
  features?: Array<{ id: string; name: string; slug: string; category: string }>;
  meals?: Array<{ id: string; name: string; slug: string }>;
  good_for?: Array<{ id: string; name: string; slug: string }>;
  neighborhood?: { id: number; name: string; slug: string };
  michelin_award?: { id: number; name: string; stars: number };
}

export interface RestaurantDish {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  image_url?: string;
  is_signature?: boolean;
  menu_section_id?: string;
}

export interface MenuSection {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
  display_order: number;
}

export interface RestaurantImage {
  id: string;
  url: string;
  alt_text?: string;
  type?: string;
  is_hero?: boolean;
}

// ============================================================================
// REFERENCE TABLE TYPES (Omar's Pattern)
// ============================================================================

export interface RestaurantNeighborhood {
  id: number;
  name: string;
  slug: string;
  name_ar?: string;
  description?: string;
  area_code?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MichelinGuideAward {
  id: number;
  name: string;
  description?: string;
  stars: number; // 0-3
  year?: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface RestaurantCuisine {
  id: string; // UUID
  name: string;
  slug: string;
  name_ar?: string;
  description?: string;
  icon?: string;
  display_order: number;
  created_at: string;
}

export interface RestaurantCategory {
  id: string; // UUID
  name: string;
  slug: string;
  name_ar?: string;
  description?: string;
  parent_category_id?: string; // UUID
  display_order: number;
  created_at: string;
}

export interface RestaurantFeature {
  id: string; // UUID
  name: string;
  slug: string;
  name_ar?: string;
  category: string; // "amenity", "dietary", "service", "accessibility"
  icon?: string;
  display_order: number;
  created_at: string;
}

export interface RestaurantMeal {
  id: string; // UUID
  name: string;
  slug: string;
  name_ar?: string;
  description?: string;
  typical_time_range?: string;
  display_order: number;
  created_at: string;
}

export interface RestaurantGoodFor {
  id: string; // UUID
  name: string;
  slug: string;
  name_ar?: string;
  description?: string;
  icon?: string;
  display_order: number;
  created_at: string;
}

// ============================================================================
// SCHEMA.ORG OUTPUT TYPES
// ============================================================================

export interface SchemaRestaurant {
  '@context': 'https://schema.org';
  '@type': 'Restaurant';
  name: string;
  description?: string;
  image?: string | string[];
  logo?: string;
  url: string;
  address: SchemaPostalAddress;
  geo?: SchemaGeoCoordinates;
  telephone?: string;
  email?: string;
  openingHoursSpecification?: SchemaOpeningHours[];
  aggregateRating?: SchemaAggregateRating;
  review?: Review[];
  servesCuisine?: string[];
  priceRange?: string;
  acceptsReservations?: boolean | string;
  paymentAccepted?: string;
  currenciesAccepted?: string;
  hasMenu?: SchemaMenu | string;
  sameAs?: string[];
  amenityFeature?: SchemaAmenityFeature[];
  knowsAbout?: string[];
  keywords?: string;
  smokingAllowed?: boolean;
  hasMap?: string;
}

export interface SchemaPostalAddress {
  '@type': 'PostalAddress';
  streetAddress: string;
  addressLocality: string;
  addressRegion?: string;
  addressCountry: string;
}

export interface SchemaGeoCoordinates {
  '@type': 'GeoCoordinates';
  latitude: number;
  longitude: number;
}

export interface SchemaOpeningHours {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string | string[];
  opens: string;
  closes: string;
}

export interface SchemaAggregateRating {
  '@type': 'AggregateRating';
  ratingValue: number | string;
  bestRating: string;
  worstRating: string;
  ratingCount: number;
}

export interface SchemaMenu {
  '@type': 'Menu';
  url: string;
  hasMenuSection?: SchemaMenuSection[];
}

export interface SchemaMenuSection {
  '@type': 'MenuSection';
  name: string;
  description?: string;
  hasMenuItem?: SchemaMenuItem[];
}

export interface SchemaMenuItem {
  '@type': 'MenuItem';
  name: string;
  description?: string;
  offers?: {
    '@type': 'Offer';
    price: number;
    priceCurrency: string;
  };
  image?: string;
}

export interface SchemaAmenityFeature {
  '@type': 'LocationFeatureSpecification';
  name: string;
  value: boolean;
}

export interface SchemaFAQPage {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: SchemaQuestion[];
}

export interface SchemaQuestion {
  '@type': 'Question';
  name: string;
  acceptedAnswer: SchemaAnswer;
}

export interface SchemaAnswer {
  '@type': 'Answer';
  text: string;
}

export interface SchemaBreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: SchemaBreadcrumbItem[];
}

export interface SchemaBreadcrumbItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

export interface SchemaReview {
  '@type': 'Review';
  author: {
    '@type': 'Person';
    name: string;
  };
  reviewRating: {
    '@type': 'Rating';
    ratingValue: string;
    bestRating: string;
    worstRating?: string;
  };
  datePublished: string;
  reviewBody: string;
}

export interface ImageObject {
  '@type': 'ImageObject';
  url: string;
  contentUrl: string;
  caption?: string;
  description?: string;
  width?: number;
  height?: number;
}

export interface Review {
  '@type': 'Review';
  author: {
    '@type': 'Person';
    name: string;
  };
  datePublished: string;
  reviewBody: string;
  reviewRating: {
    '@type': 'Rating';
    ratingValue: string;
    bestRating: string;
    worstRating: string;
  };
}

export interface AggregateRating {
  '@type': 'AggregateRating';
  ratingValue: string;
  bestRating: string;
  worstRating: string;
  reviewCount: number;
}

export interface Organization {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  alternateName?: string;
  url: string;
  logo: {
    '@type': 'ImageObject';
    url: string;
    width: number;
    height: number;
  };
  description: string;
  foundingDate: string;
  founder?: {
    '@type': 'Person';
    name: string;
    affiliation?: {
      '@type': 'Organization';
      name: string;
    };
  };
  address?: {
    '@type': 'PostalAddress';
    addressCountry: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    streetAddress?: string;
  };
  contactPoint?: {
    '@type': 'ContactPoint';
    telephone?: string;
    email: string;
    contactType: string;
    areaServed: string;
    availableLanguage?: string[];
  };
  areaServed: {
    '@type': 'Country' | 'AdministrativeArea';
    name: string;
    sameAs: string;
  };
  knowsAbout?: string[];
  sameAs?: string[];
}

export interface WebSite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  keywords?: string;
  isFamilyFriendly?: boolean;
  publisher?: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
      width: number;
      height: number;
    };
  };
  about?: {
    '@type': 'City' | 'AdministrativeArea';
    name: string;
    description: string;
  };
  mainEntity?: {
    '@type': 'TouristDestination';
    name: string;
    description: string;
    touristType: string[];
    geo: {
      '@type': 'GeoCoordinates';
      latitude: number;
      longitude: number;
    };
    url: string;
  };
  potentialAction: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
  inLanguage?: string[];
}

// ============================================================================
// PLACE SCHEMA (for attractions, parks, beaches, landmarks, education)
// ============================================================================

export type PlaceType =
  | 'Place'
  | 'TouristAttraction'
  | 'Park'
  | 'Beach'
  | 'LandmarksOrHistoricalBuildings'
  | 'EducationalOrganization'
  | 'ShoppingCenter'
  | 'Museum'
  | 'EventVenue';

export interface SchemaPlace {
  '@context': 'https://schema.org';
  '@type': PlaceType;
  '@id'?: string;
  name: string;
  alternateName?: string;
  description: string;
  url?: string;
  image?: string | string[];

  // Location
  address: {
    '@type': 'PostalAddress';
    streetAddress?: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string | { '@type': 'Country'; name: string };
  };
  geo?: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };

  // Contact
  telephone?: string;
  email?: string;
  faxNumber?: string;

  // Operational
  openingHoursSpecification?: Array<{
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string | string[];
    opens: string;
    closes: string;
  }>;
  publicAccess?: boolean;
  isAccessibleForFree?: boolean;
  smokingAllowed?: boolean;

  // Amenities
  amenityFeature?: Array<{
    '@type': 'LocationFeatureSpecification';
    name: string;
    value: boolean | string;
  }>;
  hasMap?: string;
  maximumAttendeeCapacity?: number;

  // Reviews & Ratings
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: number | string;
    bestRating: number | string;
    worstRating?: number | string;
    ratingCount: number;
    reviewCount?: number;
  };
  review?: Array<{
    '@type': 'Review';
    author: {
      '@type': 'Person';
      name: string;
    };
    datePublished: string;
    reviewBody: string;
    reviewRating: {
      '@type': 'Rating';
      ratingValue: number;
      bestRating: number;
    };
  }>;

  // Additional
  keywords?: string;
  photo?: Array<{
    '@type': 'ImageObject' | 'Photograph';
    url: string;
    caption?: string;
  }>;
  event?: Array<{
    '@type': 'Event';
    name: string;
    startDate: string;
    endDate?: string;
  }>;
  branchCode?: string;
  containedInPlace?: {
    '@type': 'Place' | 'City' | 'Country';
    name: string;
    address?: {
      '@type': 'PostalAddress';
      addressCountry: string;
    };
  };

  // TouristAttraction specific
  touristType?: string[];
  availableLanguage?: string[];
}

export interface PlaceData {
  id: string;
  slug: string;
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  type: PlaceType;

  // Location
  address: string;
  area: string;
  latitude?: number;
  longitude?: number;

  // Contact
  phone?: string;
  email?: string;
  website?: string;

  // Operational
  hours?: string;
  is_free?: boolean;
  public_access?: boolean;

  // Images
  hero_image?: string;
  images?: Array<{
    url: string;
    alt_text?: string;
    is_hero?: boolean;
  }>;

  // Reviews
  overall_rating?: number;
  total_reviews_aggregated?: number;

  // Additional
  keywords?: string[];
  amenities?: string[];
  capacity?: number;
}

export interface CollectionPageSchema {
  '@context': 'https://schema.org';
  '@type': 'CollectionPage';
  name: string;
  description: string;
  url: string;
  keywords: string;
  about?: {
    '@type': 'Thing';
    name: string;
  };
  breadcrumb?: {
    '@type': 'BreadcrumbList';
    itemListElement: Array<{
      '@type': 'ListItem';
      position: number;
      name: string;
      item: string;
    }>;
  };
  mainEntity: {
    '@type': 'ItemList';
    numberOfItems: number;
    itemListElement: Array<{
      '@type': 'ListItem';
      position: number;
      item: {
        '@type': 'Restaurant';
        '@id': string;
        name: string;
        image?: string;
        address: {
          '@type': 'PostalAddress';
          streetAddress: string;
          addressLocality: string;
          addressCountry: string;
        };
        aggregateRating?: {
          '@type': 'AggregateRating';
          ratingValue: string;
          bestRating: string;
          reviewCount: number;
        };
        servesCuisine?: string[];
      };
    }>;
  };
  spatialCoverage?: {
    '@type': 'Place';
    name: string;
    address: {
      '@type': 'PostalAddress';
      addressCountry: string;
      addressLocality?: string;
    };
  };
  inLanguage?: string[];
}

export interface CollectionPageData {
  title: string;
  description: string;
  slug: string;
  keywords: string[];
  cuisineOrCategory: string;
  breadcrumbName: string;
  neighborhood?: string;
  restaurants: Array<{
    slug: string;
    name: string;
    hero_image?: string;
    address: string;
    area: string;
    overall_rating?: number;
    total_reviews_aggregated?: number;
    cuisines?: Array<{ name: string }>;
  }>;
}

// ============================================================================
// GENERATOR OPTIONS
// ============================================================================

export interface SchemaGeneratorOptions {
  baseUrl: string; // e.g., "https://bestgoa.com"
  includeMenu?: boolean;
  includeImages?: boolean;
  includeReviews?: boolean;
  includeFAQ?: boolean;
  includeBreadcrumb?: boolean;
}
