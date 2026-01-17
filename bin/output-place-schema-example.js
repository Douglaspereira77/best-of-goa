/**
 * Place Schema Example Output
 *
 * Generates example Place schema for Goa Towers (TouristAttraction)
 * Use this to test in Google Rich Results Test
 */

// Example Place data for Goa Towers
const goaTowersData = {
  id: '123',
  slug: 'goa-towers',
  name: 'Goa Towers',
  name_ar: 'Ø£Ø¨Ø±Ø§Ø¬ Ø§Ù„ÙƒÙˆÙŠØª',
  description: 'Iconic landmark consisting of three towers offering panoramic views of Goa City and the Arabian Gulf. The main tower features a rotating observation deck and restaurant.',
  type: 'TouristAttraction',

  // Location
  address: 'Arabian Gulf Street',
  area: 'Dasman',
  latitude: 29.3759,
  longitude: 47.9774,

  // Contact
  phone: '+965-2245-5157',
  website: 'https://www.goatowers.com',

  // Operational
  hours: 'Mon-Sun: 8:00-23:00',
  is_free: false,
  public_access: true,

  // Images
  hero_image: 'https://example.com/goa-towers-hero.jpg',
  images: [
    {
      url: 'https://example.com/goa-towers-1.jpg',
      alt_text: 'Goa Towers illuminated at night',
      is_hero: true
    },
    {
      url: 'https://example.com/goa-towers-2.jpg',
      alt_text: 'Observation deck view',
      is_hero: false
    },
    {
      url: 'https://example.com/goa-towers-3.jpg',
      alt_text: 'Goa Towers from Arabian Gulf Street',
      is_hero: false
    }
  ],

  // Reviews
  overall_rating: 4.6,
  total_reviews_aggregated: 1250,

  // Additional
  keywords: ['landmark', 'tourist attraction', 'observation deck', 'iconic', 'architecture', 'views', 'Goa City'],
  amenities: ['Observation Deck', 'Restaurant', 'Gift Shop', 'Parking', 'Wheelchair Accessible', 'WiFi'],
  capacity: 500
};

// Generate the Place schema
const placeSchema = {
  "@context": "https://schema.org",
  "@type": "TouristAttraction",
  "@id": "https://www.bestofgoa.com/places/goa-towers",
  "name": "Goa Towers",
  "alternateName": "Ø£Ø¨Ø±Ø§Ø¬ Ø§Ù„ÙƒÙˆÙŠØª",
  "description": "Iconic landmark consisting of three towers offering panoramic views of Goa City and the Arabian Gulf. The main tower features a rotating observation deck and restaurant.",
  "url": "https://www.bestofgoa.com/places/goa-towers",
  "image": "https://example.com/goa-towers-hero.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Arabian Gulf Street",
    "addressLocality": "Dasman",
    "addressCountry": {
      "@type": "Country",
      "name": "KW"
    }
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 29.3759,
    "longitude": 47.9774
  },
  "telephone": "+965-2245-5157",
  "isAccessibleForFree": false,
  "publicAccess": true,
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "8:00",
      "closes": "23:00"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": 1250,
    "reviewCount": 1250
  },
  "keywords": "landmark, tourist attraction, observation deck, iconic, architecture, views, Goa City",
  "amenityFeature": [
    {
      "@type": "LocationFeatureSpecification",
      "name": "Observation Deck",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Restaurant",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Gift Shop",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Parking",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "Wheelchair Accessible",
      "value": true
    },
    {
      "@type": "LocationFeatureSpecification",
      "name": "WiFi",
      "value": true
    }
  ],
  "maximumAttendeeCapacity": 500,
  "photo": [
    {
      "@type": "ImageObject",
      "url": "https://example.com/goa-towers-1.jpg",
      "caption": "Goa Towers illuminated at night"
    },
    {
      "@type": "ImageObject",
      "url": "https://example.com/goa-towers-2.jpg",
      "caption": "Observation deck view"
    },
    {
      "@type": "ImageObject",
      "url": "https://example.com/goa-towers-3.jpg",
      "caption": "Goa Towers from Arabian Gulf Street"
    }
  ],
  "containedInPlace": {
    "@type": "City",
    "name": "Goa City",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "KW"
    }
  },
  "touristType": [
    "Sightseeing"
  ],
  "availableLanguage": [
    "English",
    "Arabic"
  ]
};

// Output formatted JSON
console.log('='.repeat(80));
console.log('PLACE SCHEMA - Goa Towers (TouristAttraction)');
console.log('='.repeat(80));
console.log('\nTest in Google Rich Results Test:');
console.log('https://search.google.com/test/rich-results\n');
console.log('='.repeat(80));
console.log(JSON.stringify(placeSchema, null, 2));
console.log('='.repeat(80));

console.log('\nðŸ“Š SCHEMA SUMMARY:');
console.log('â”'.repeat(80));
console.log('âœ“ Type:', placeSchema['@type']);
console.log('âœ“ Name:', placeSchema.name);
console.log('âœ“ Location:', placeSchema.address.addressLocality + ', Goa');
console.log('âœ“ Coordinates:', `${placeSchema.geo.latitude}, ${placeSchema.geo.longitude}`);
console.log('âœ“ Rating:', `${placeSchema.aggregateRating.ratingValue}/5 (${placeSchema.aggregateRating.reviewCount} reviews)`);
console.log('âœ“ Amenities:', placeSchema.amenityFeature.length, 'features');
console.log('âœ“ Images:', placeSchema.photo.length, 'photos');
console.log('âœ“ Hours:', '8:00-23:00 (7 days)');
console.log('âœ“ Tourist Types:', placeSchema.touristType.join(', '));
console.log('âœ“ Languages:', placeSchema.availableLanguage.join(', '));
console.log('â”'.repeat(80));
