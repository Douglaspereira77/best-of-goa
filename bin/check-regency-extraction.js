#!/usr/bin/env node
/**
 * Check The Regency Hotel extraction results
 * Verifies all new implementations are working correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRegencyHotel() {
  const { data: hotel, error } = await supabase
    .from('hotels')
    .select('*')
    .ilike('name', '%regency%')
    .single();

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('=== THE REGENCY HOTEL EXTRACTION VERIFICATION ===\n');

  // Basic Info
  console.log('ðŸ“‹ BASIC INFO:');
  console.log('  Name:', hotel.name);
  console.log('  Slug:', hotel.slug);
  console.log('  ID:', hotel.id);
  console.log('  Extraction Status:', hotel.extraction_status);
  console.log('  Created:', hotel.created_at);

  // Location (including NEW neighborhood_id)
  console.log('\nðŸ“ LOCATION:');
  console.log('  Address:', hotel.address || 'âŒ Missing');
  console.log('  Area:', hotel.area || 'âŒ Missing');
  console.log('  Neighborhood ID:', hotel.neighborhood_id || 'âŒ NOT MAPPED');
  console.log('  Latitude:', hotel.latitude || 'âŒ Missing');
  console.log('  Longitude:', hotel.longitude || 'âŒ Missing');

  // Contact (including NEW email mapping)
  console.log('\nðŸ“ž CONTACT:');
  console.log('  Phone:', hotel.phone || 'âŒ Missing');
  console.log('  Email:', hotel.email || 'âš ï¸ Not available (common for Goa hotels)');
  console.log('  Website:', hotel.website || 'âŒ Missing');

  // Social Media
  console.log('\nðŸ“± SOCIAL MEDIA:');
  console.log('  Instagram:', hotel.instagram || 'âŒ Not found');
  console.log('  Facebook:', hotel.facebook || 'âŒ Not found');
  console.log('  Twitter:', hotel.twitter || 'âŒ Not found');
  console.log('  TikTok:', hotel.tiktok || 'âŒ Not found');

  // Hotel-Specific (including NEW fields)
  console.log('\nðŸ¨ HOTEL SPECIFIC:');
  console.log('  Star Rating:', hotel.star_rating || 'âŒ Missing');
  console.log('  Hotel Type:', hotel.hotel_type || 'âŒ NOT GENERATED (check AI logs)');
  console.log('  Total Rooms:', hotel.total_rooms || 'âŒ Missing');
  console.log('  Total Floors:', hotel.total_floors || 'âš ï¸ Not in Apify data');
  console.log('  Year Opened:', hotel.year_opened || 'âš ï¸ Not in Apify data');
  console.log('  Year Renovated:', hotel.year_renovated || 'âš ï¸ Not in Apify data');

  // Ratings (including NEW TripAdvisor/Booking parsing)
  console.log('\nâ­ RATINGS:');
  console.log('  Google Rating:', hotel.google_rating || 'âŒ Missing');
  console.log('  Google Reviews:', hotel.google_review_count || 'âŒ Missing');
  console.log('  TripAdvisor Rating:', hotel.tripadvisor_rating || 'âš ï¸ Not extracted (check Firecrawl logs)');
  console.log('  TripAdvisor Reviews:', hotel.tripadvisor_review_count || 'âš ï¸ Not extracted');
  console.log('  Booking.com Rating:', hotel.booking_com_rating || 'âš ï¸ Not extracted');
  console.log('  Booking.com Reviews:', hotel.booking_com_review_count || 'âš ï¸ Not extracted');
  console.log('  Total Reviews Aggregated:', hotel.total_reviews_aggregated || 'âŒ NOT CALCULATED');

  // Content (AI Generated)
  console.log('\nðŸ“ AI GENERATED CONTENT:');
  console.log('  Description:', hotel.description ? hotel.description.substring(0, 100) + '...' : 'âŒ Missing');
  console.log('  Short Description:', hotel.short_description || 'âŒ Missing');
  console.log('  Review Sentiment:', hotel.review_sentiment ? hotel.review_sentiment.substring(0, 100) + '...' : 'âŒ Missing');

  // SEO Fields (including NEW meta_keywords, og_title, og_description)
  console.log('\nðŸ” SEO FIELDS:');
  console.log('  Meta Title:', hotel.meta_title || 'âŒ Missing');
  console.log('  Meta Description:', hotel.meta_description ? hotel.meta_description.substring(0, 80) + '...' : 'âŒ Missing');
  console.log('  Meta Keywords:', hotel.meta_keywords ? hotel.meta_keywords.join(', ').substring(0, 80) + '...' : 'âŒ NOT GENERATED');
  console.log('  OG Title:', hotel.og_title || 'âŒ NOT GENERATED');
  console.log('  OG Description:', hotel.og_description || 'âŒ NOT GENERATED');

  // Array Relationships (including NEW Apify amenities parsing)
  console.log('\nðŸ·ï¸ CATEGORY/AMENITY IDS:');
  console.log('  Hotel Category IDs:', hotel.hotel_category_ids?.length ? hotel.hotel_category_ids : 'âŒ Empty');
  console.log('  Hotel Amenity IDs:', hotel.hotel_amenity_ids?.length ? hotel.hotel_amenity_ids.length + ' amenities' : 'âŒ Empty');
  console.log('  Hotel Facility IDs:', hotel.hotel_facility_ids?.length ? hotel.hotel_facility_ids.length + ' facilities' : 'âŒ Empty');

  // Images
  console.log('\nðŸ–¼ï¸ IMAGES:');
  console.log('  Hero Image:', hotel.hero_image ? 'âœ… Set' : 'âŒ Missing');

  // Check Apify Output
  console.log('\nðŸ“¦ RAW DATA STORAGE:');
  console.log('  Apify Output:', hotel.apify_output ? 'âœ… Stored' : 'âŒ Missing');
  console.log('  Firecrawl Output:', hotel.firecrawl_output ? 'âœ… Stored' : 'âŒ Missing');

  if (hotel.apify_output) {
    console.log('\nðŸ“Š APIFY DATA ANALYSIS:');
    const apify = hotel.apify_output;
    console.log('  Has additionalInfo:', apify.additionalInfo ? 'âœ… Yes' : 'âŒ No');
    if (apify.additionalInfo?.Amenities) {
      console.log('  Amenities in additionalInfo:', apify.additionalInfo.Amenities.length + ' items');
      // Show first 5 amenities
      const amenityNames = apify.additionalInfo.Amenities.slice(0, 5).map(item => {
        if (typeof item === 'object') {
          return Object.keys(item)[0];
        }
        return item;
      });
      console.log('  Sample amenities:', amenityNames.join(', '));
    } else {
      console.log('  Amenities in additionalInfo:', 'âŒ Not present');
    }
    console.log('  Has reviews:', apify.reviews ? apify.reviews.length + ' reviews' : 'âŒ No reviews');
  }

  if (hotel.firecrawl_output) {
    console.log('\nðŸ“Š FIRECRAWL DATA ANALYSIS:');
    const fc = hotel.firecrawl_output;
    console.log('  General search:', fc.general ? 'âœ… Stored' : 'âŒ Missing');
    console.log('  Rooms search:', fc.rooms ? 'âœ… Stored' : 'âŒ Missing');
    console.log('  TripAdvisor search:', fc.tripadvisor ? 'âœ… Stored' : 'âŒ Missing');
    console.log('  Booking.com search:', fc.booking_com ? 'âœ… Stored' : 'âŒ Missing');
    console.log('  Social media search:', fc.social_media_search ? 'âœ… Stored' : 'âŒ Missing');

    // Check what TripAdvisor returned
    if (fc.tripadvisor?.results?.length > 0) {
      console.log('\n  TripAdvisor Result Sample:');
      const ta = fc.tripadvisor.results[0];
      console.log('    Title:', ta.title?.substring(0, 60) || 'N/A');
      console.log('    Description:', ta.description?.substring(0, 100) || 'N/A');
    }

    // Check what Booking.com returned
    if (fc.booking_com?.results?.length > 0) {
      console.log('\n  Booking.com Result Sample:');
      const bc = fc.booking_com.results[0];
      console.log('    Title:', bc.title?.substring(0, 60) || 'N/A');
      console.log('    Description:', bc.description?.substring(0, 100) || 'N/A');
    }
  }

  // Extraction Progress
  console.log('\nðŸ“ˆ EXTRACTION PROGRESS:');
  if (hotel.extraction_progress) {
    Object.entries(hotel.extraction_progress).forEach(([step, status]) => {
      const icon = status === 'completed' ? 'âœ…' : status === 'failed' ? 'âŒ' : 'â³';
      console.log('  ' + step + ':', icon, status);
    });
  } else {
    console.log('  No progress data stored');
  }

  // Summary
  console.log('\n=== IMPLEMENTATION VERIFICATION SUMMARY ===');
  const checks = [
    { name: 'Neighborhood ID Mapping', passed: Boolean(hotel.neighborhood_id) },
    { name: 'Hotel Type (AI)', passed: Boolean(hotel.hotel_type) },
    { name: 'Meta Keywords (AI)', passed: hotel.meta_keywords?.length > 0 },
    { name: 'OG Title (AI)', passed: Boolean(hotel.og_title) },
    { name: 'OG Description (AI)', passed: Boolean(hotel.og_description) },
    { name: 'Amenity IDs Populated', passed: hotel.hotel_amenity_ids?.length > 0 },
    { name: 'Facility IDs Populated', passed: hotel.hotel_facility_ids?.length > 0 },
    { name: 'Total Reviews Aggregated', passed: hotel.total_reviews_aggregated > 0 },
    { name: 'TripAdvisor Data Parsed', passed: Boolean(hotel.tripadvisor_rating) || Boolean(hotel.tripadvisor_review_count) },
    { name: 'Booking.com Data Parsed', passed: Boolean(hotel.booking_com_rating) || Boolean(hotel.booking_com_review_count) },
  ];

  let passed = 0;
  checks.forEach(check => {
    const icon = check.passed ? 'âœ…' : 'âŒ';
    console.log(icon, check.name);
    if (check.passed) passed++;
  });

  console.log('\nScore:', passed + '/' + checks.length, 'new features working');

  if (passed < 10) {
    console.log('\nâš ï¸ TROUBLESHOOTING NOTES:');
    if (!hotel.neighborhood_id) {
      console.log('  - Neighborhood ID: Check if area "' + hotel.area + '" is in mapping tables');
    }
    if (!hotel.hotel_type) {
      console.log('  - Hotel Type: Check OpenAI enhancement logs for AI response');
    }
    if (!hotel.meta_keywords?.length) {
      console.log('  - Meta Keywords: Check if OpenAI returned meta_keywords array');
    }
    if (!hotel.tripadvisor_rating) {
      console.log('  - TripAdvisor: Firecrawl Search may not have returned structured rating data');
    }
    if (!hotel.booking_com_rating) {
      console.log('  - Booking.com: Firecrawl Search may not have returned structured rating data');
    }
    if (!hotel.hotel_amenity_ids?.length && !hotel.hotel_facility_ids?.length) {
      console.log('  - Amenities: Check if Apify additionalInfo.Amenities exists');
    }
  }
}

checkRegencyHotel().catch(console.error);
