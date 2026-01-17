/**
 * Hotel Field Population Verification Script
 *
 * Purpose: Verify which database fields are being populated during hotel extraction
 * Usage: node bin/verify-hotel-field-population.js [hotelId or slug]
 *
 * Examples:
 *   node bin/verify-hotel-field-population.js                    # Check all hotels
 *   node bin/verify-hotel-field-population.js hilton-garden-inn-goa-salmiya  # Check specific hotel by slug
 *   node bin/verify-hotel-field-population.js <uuid>            # Check specific hotel by ID
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// All hotel table fields grouped by category
const FIELD_GROUPS = {
  'Identity': ['id', 'slug', 'name', 'name_ar', 'google_place_id'],
  'Location': ['address', 'area', 'country_code', 'latitude', 'longitude', 'neighborhood_id'],
  'Contact': ['phone', 'email', 'website', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'linkedin', 'snapchat', 'whatsapp'],
  'Hotel-Specific': ['star_rating', 'hotel_type', 'total_rooms', 'total_floors', 'year_opened', 'year_renovated'],
  'Operational': ['check_in_time', 'check_out_time', 'check_in_age_minimum', 'pets_allowed', 'smoking_policy', 'cancellation_policy'],
  'Pricing': ['price_range', 'currency', 'average_nightly_rate', 'min_nightly_rate', 'max_nightly_rate'],
  'Images': ['hero_image', 'logo_image'],
  'BOK Rating': ['bok_score', 'bok_score_breakdown', 'bok_score_calculated_at', 'bok_score_version'],
  'External Ratings': ['google_rating', 'google_review_count', 'tripadvisor_rating', 'tripadvisor_review_count', 'booking_com_rating', 'booking_com_review_count', 'total_reviews_aggregated'],
  'Content': ['description', 'description_ar', 'short_description', 'review_sentiment', 'review_sentiment_updated_at'],
  'SEO': ['meta_title', 'meta_description', 'meta_keywords', 'og_title', 'og_description', 'og_image'],
  'Awards': ['awards', 'certifications'],
  'Array Relationships': ['hotel_category_ids', 'hotel_amenity_ids', 'hotel_facility_ids', 'hotel_room_type_ids'],
  'Extraction': ['extraction_status', 'extraction_progress', 'apify_output', 'firecrawl_output', 'extraction_source', 'extraction_job_id'],
  'Status': ['verified', 'featured', 'active'],
  'Timestamps': ['created_at', 'updated_at', 'last_scraped_at']
};

// Fields that should always be populated (defaults or auto-generated)
const ALWAYS_POPULATED = ['id', 'slug', 'country_code', 'currency', 'bok_score_version', 'verified', 'featured', 'active', 'created_at', 'updated_at', 'extraction_status', 'extraction_source'];

// Fields that are future features (expected to be null)
const FUTURE_FEATURES = ['bok_score', 'bok_score_breakdown', 'bok_score_calculated_at', 'name_ar', 'description_ar', 'logo_image', 'snapchat', 'whatsapp', 'extraction_job_id', 'last_scraped_at', 'certifications'];

async function verifyHotelFields(hotelIdOrSlug) {
  console.log('\n========================================');
  console.log('HOTEL FIELD POPULATION VERIFICATION');
  console.log('========================================\n');

  // Fetch hotel
  let query = supabase.from('hotels').select('*');

  if (hotelIdOrSlug) {
    // Check if it's a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hotelIdOrSlug);
    if (isUUID) {
      query = query.eq('id', hotelIdOrSlug);
    } else {
      query = query.eq('slug', hotelIdOrSlug);
    }
  }

  const { data: hotels, error } = await query;

  if (error) {
    console.error('âŒ Error fetching hotels:', error.message);
    return;
  }

  if (!hotels || hotels.length === 0) {
    console.log('âŒ No hotels found');
    return;
  }

  if (hotels.length > 1) {
    console.log(`\nðŸ“Š Analyzing ${hotels.length} hotels...\n`);
  }

  // Aggregate stats across all hotels
  const aggregateStats = {
    totalFields: 0,
    populatedFields: {},
    unpopulatedFields: {},
    partiallyPopulated: {}
  };

  // Count total unique fields
  const allFields = Object.values(FIELD_GROUPS).flat();
  aggregateStats.totalFields = allFields.length;

  // Initialize counters for each field
  allFields.forEach(field => {
    aggregateStats.populatedFields[field] = 0;
    aggregateStats.unpopulatedFields[field] = 0;
  });

  // Analyze each hotel
  for (const hotel of hotels) {
    if (hotels.length === 1) {
      console.log(`\nðŸ¨ Hotel: ${hotel.name}`);
      console.log(`ðŸ“ Area: ${hotel.area}`);
      console.log(`ðŸ†” Slug: ${hotel.slug}`);
      console.log(`ðŸ“Š Extraction Status: ${hotel.extraction_status}\n`);
    }

    const populated = [];
    const unpopulated = [];
    const futureFeature = [];

    // Check each field group
    for (const [groupName, fields] of Object.entries(FIELD_GROUPS)) {
      const groupPopulated = [];
      const groupUnpopulated = [];
      const groupFuture = [];

      for (const field of fields) {
        const value = hotel[field];
        const isEmpty = value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);

        if (FUTURE_FEATURES.includes(field)) {
          if (!isEmpty) {
            groupPopulated.push(field);
            aggregateStats.populatedFields[field]++;
          } else {
            groupFuture.push(field);
          }
        } else if (isEmpty) {
          groupUnpopulated.push(field);
          aggregateStats.unpopulatedFields[field]++;
        } else {
          groupPopulated.push(field);
          aggregateStats.populatedFields[field]++;
        }
      }

      if (hotels.length === 1) {
        console.log(`\n**${groupName}** (${fields.length} fields)`);

        if (groupPopulated.length > 0) {
          console.log(`  âœ… Populated (${groupPopulated.length}):`);
          groupPopulated.forEach(f => {
            const val = hotel[f];
            const displayVal = typeof val === 'object'
              ? Array.isArray(val)
                ? `[${val.length} items]`
                : '{...}'
              : typeof val === 'string' && val.length > 50
                ? val.substring(0, 50) + '...'
                : val;
            console.log(`     â€¢ ${f}: ${displayVal}`);
          });
        }

        if (groupUnpopulated.length > 0) {
          console.log(`  âŒ Unpopulated (${groupUnpopulated.length}): ${groupUnpopulated.join(', ')}`);
        }

        if (groupFuture.length > 0) {
          console.log(`  ðŸ”® Future Feature (${groupFuture.length}): ${groupFuture.join(', ')}`);
        }
      }
    }
  }

  // Print aggregate stats if multiple hotels
  if (hotels.length > 1) {
    console.log('\n========================================');
    console.log('AGGREGATE FIELD POPULATION STATISTICS');
    console.log('========================================\n');

    console.log(`Total Hotels Analyzed: ${hotels.length}`);
    console.log(`Total Database Fields: ${aggregateStats.totalFields}\n`);

    // Calculate which fields are always/never/sometimes populated
    const alwaysPopulated = [];
    const neverPopulated = [];
    const partiallyPopulated = [];

    for (const field of allFields) {
      const populatedCount = aggregateStats.populatedFields[field];
      const unpopulatedCount = aggregateStats.unpopulatedFields[field];

      if (populatedCount === hotels.length) {
        alwaysPopulated.push(field);
      } else if (populatedCount === 0) {
        neverPopulated.push(field);
      } else {
        partiallyPopulated.push({
          field,
          populatedCount,
          unpopulatedCount,
          percentage: Math.round((populatedCount / hotels.length) * 100)
        });
      }
    }

    console.log(`âœ… **Always Populated** (${alwaysPopulated.length} fields):`);
    alwaysPopulated.forEach(f => console.log(`   â€¢ ${f}`));

    console.log(`\nâŒ **Never Populated** (${neverPopulated.length} fields):`);
    neverPopulated.forEach(f => console.log(`   â€¢ ${f}`));

    if (partiallyPopulated.length > 0) {
      console.log(`\nâš ï¸ **Partially Populated** (${partiallyPopulated.length} fields):`);
      partiallyPopulated
        .sort((a, b) => b.percentage - a.percentage)
        .forEach(({ field, populatedCount, unpopulatedCount, percentage }) => {
          console.log(`   â€¢ ${field}: ${percentage}% (${populatedCount}/${hotels.length} hotels)`);
        });
    }

    // Coverage summary
    const totalPopulated = alwaysPopulated.length + partiallyPopulated.length;
    const coveragePercentage = Math.round((totalPopulated / aggregateStats.totalFields) * 100);

    console.log('\n========================================');
    console.log('COVERAGE SUMMARY');
    console.log('========================================\n');
    console.log(`Overall Field Coverage: ${coveragePercentage}%`);
    console.log(`  âœ… Always/Partially Populated: ${totalPopulated}/${aggregateStats.totalFields}`);
    console.log(`  âŒ Never Populated: ${neverPopulated.length}/${aggregateStats.totalFields}`);
  }

  // Check for data sources
  if (hotels.length === 1) {
    const hotel = hotels[0];
    console.log('\n========================================');
    console.log('DATA SOURCE AVAILABILITY');
    console.log('========================================\n');

    // Check Apify data
    if (hotel.apify_output) {
      console.log('âœ… Apify Data Present:');
      const apifyFields = Object.keys(hotel.apify_output);
      console.log(`   Available fields: ${apifyFields.slice(0, 10).join(', ')}${apifyFields.length > 10 ? '...' : ''}`);
      console.log(`   Total fields: ${apifyFields.length}`);
      if (hotel.apify_output.reviews) {
        console.log(`   Reviews: ${hotel.apify_output.reviews.length} reviews`);
      }
    } else {
      console.log('âŒ Apify Data: Not available');
    }

    // Check Firecrawl data
    if (hotel.firecrawl_output) {
      console.log('\nâœ… Firecrawl Data Present:');
      const firecrawlSections = Object.keys(hotel.firecrawl_output);
      firecrawlSections.forEach(section => {
        const data = hotel.firecrawl_output[section];
        if (data && data.results) {
          console.log(`   â€¢ ${section}: ${data.results.length} results`);
        } else {
          console.log(`   â€¢ ${section}: ${typeof data === 'object' ? 'present' : data}`);
        }
      });
    } else {
      console.log('\nâŒ Firecrawl Data: Not available');
    }

    // Recommendations
    console.log('\n========================================');
    console.log('RECOMMENDATIONS');
    console.log('========================================\n');

    const criticalUnpopulated = [];

    // Check for critical missing data that should be available
    if (!hotel.email && hotel.apify_output?.email) {
      criticalUnpopulated.push('â€¢ email - Available in Apify but not mapped');
    }

    if (!hotel.tripadvisor_rating && hotel.firecrawl_output?.tripadvisor) {
      criticalUnpopulated.push('â€¢ tripadvisor_rating - TripAdvisor search completed but not parsed');
    }

    if (!hotel.booking_com_rating && hotel.firecrawl_output?.booking_com) {
      criticalUnpopulated.push('â€¢ booking_com_rating - Booking.com search completed but not parsed');
    }

    if (!hotel.average_nightly_rate && hotel.firecrawl_output?.booking_com) {
      criticalUnpopulated.push('â€¢ average_nightly_rate - Available in Booking.com but not extracted');
    }

    if (!hotel.cancellation_policy && hotel.firecrawl_output?.booking_com) {
      criticalUnpopulated.push('â€¢ cancellation_policy - Available in Booking.com but not extracted');
    }

    if (!hotel.hotel_type) {
      criticalUnpopulated.push('â€¢ hotel_type - Should be generated by AI enhancement');
    }

    if (!hotel.meta_keywords || hotel.meta_keywords.length === 0) {
      criticalUnpopulated.push('â€¢ meta_keywords - Should be generated by AI enhancement');
    }

    if (!hotel.og_title) {
      criticalUnpopulated.push('â€¢ og_title - Should be generated by AI enhancement');
    }

    if (criticalUnpopulated.length > 0) {
      console.log('ðŸ”´ Critical Missing Data (should be populated):');
      criticalUnpopulated.forEach(item => console.log(`   ${item}`));
    } else {
      console.log('âœ… All critical fields are populated!');
    }

    // Check review aggregation
    const googleReviews = hotel.google_review_count || 0;
    const tripadvisorReviews = hotel.tripadvisor_review_count || 0;
    const bookingReviews = hotel.booking_com_review_count || 0;
    const totalExpected = googleReviews + tripadvisorReviews + bookingReviews;

    if (totalExpected !== hotel.total_reviews_aggregated) {
      console.log(`\nâš ï¸ Review Count Mismatch:`);
      console.log(`   Expected: ${totalExpected} (G:${googleReviews} + T:${tripadvisorReviews} + B:${bookingReviews})`);
      console.log(`   Actual: ${hotel.total_reviews_aggregated || 0}`);
    }
  }

  console.log('\n========================================\n');
}

// Run verification
const hotelIdOrSlug = process.argv[2];
verifyHotelFields(hotelIdOrSlug)
  .then(() => {
    console.log('âœ… Verification complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('âŒ Verification failed:', error);
    process.exit(1);
  });
