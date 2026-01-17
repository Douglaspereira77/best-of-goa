#!/usr/bin/env node
/**
 * Check The Avenues Mall Data
 *
 * Queries the database to see what fields are populated
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMallData() {
  console.log('Fetching The Avenues mall data...\n');

  const { data: mall, error } = await supabase
    .from('malls')
    .select('*')
    .ilike('name', '%avenues%')
    .single();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!mall) {
    console.log('No mall found with "Avenues" in name');
    return;
  }

  console.log('=== THE AVENUES MALL DATA ===\n');

  // Group fields by category
  const fieldGroups = {
    'IDENTITY': ['id', 'name', 'name_ar', 'slug', 'google_place_id'],
    'LOCATION': ['address', 'area', 'country_code', 'latitude', 'longitude', 'neighborhood_id'],
    'CONTACT': ['phone', 'email', 'website', 'whatsapp'],
    'SOCIAL MEDIA': ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'snapchat'],
    'MALL SPECIFICS': ['total_stores', 'total_floors', 'total_parking_spaces', 'gross_leasable_area_sqm', 'year_opened', 'year_renovated', 'mall_type'],
    'OPERATING HOURS': ['weekday_open_time', 'weekday_close_time', 'weekend_open_time', 'weekend_close_time', 'friday_open_time', 'friday_close_time', 'ramadan_hours', 'public_holiday_hours'],
    'PARKING': ['parking_type', 'valet_parking', 'parking_fee', 'ev_charging_stations'],
    'RATINGS': ['google_rating', 'google_review_count', 'tripadvisor_rating', 'tripadvisor_review_count', 'bok_score', 'bok_score_breakdown'],
    'CONTENT': ['description', 'description_ar', 'short_description', 'review_sentiment'],
    'SEO': ['meta_title', 'meta_description', 'meta_keywords', 'og_title', 'og_description', 'og_image'],
    'IMAGES': ['hero_image', 'logo_image'],
    'RELATIONSHIPS': ['mall_category_ids', 'mall_amenity_ids', 'mall_anchor_store_ids'],
    'EXTRACTION': ['extraction_status', 'extraction_source', 'extraction_job_id'],
    'STATUS': ['verified', 'featured', 'active'],
    'TIMESTAMPS': ['created_at', 'updated_at', 'last_scraped_at']
  };

  let populatedCount = 0;
  let emptyCount = 0;

  for (const [group, fields] of Object.entries(fieldGroups)) {
    console.log(`\n--- ${group} ---`);
    for (const field of fields) {
      const value = mall[field];
      const hasValue = value !== null && value !== undefined && value !== '' &&
                       !(Array.isArray(value) && value.length === 0);

      if (hasValue) {
        populatedCount++;
        let displayValue = value;

        // Format for display
        if (typeof value === 'object' && !Array.isArray(value)) {
          displayValue = JSON.stringify(value).substring(0, 100) + '...';
        } else if (Array.isArray(value)) {
          displayValue = `[${value.length} items] ${JSON.stringify(value).substring(0, 50)}`;
        } else if (typeof value === 'string' && value.length > 80) {
          displayValue = value.substring(0, 80) + '...';
        }

        console.log(`  ✅ ${field}: ${displayValue}`);
      } else {
        emptyCount++;
        console.log(`  ❌ ${field}: (empty)`);
      }
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`✅ Populated fields: ${populatedCount}`);
  console.log(`❌ Empty fields: ${emptyCount}`);
  console.log(`📊 Completion: ${Math.round((populatedCount / (populatedCount + emptyCount)) * 100)}%`);

  // Check extraction progress
  if (mall.extraction_progress) {
    console.log('\n=== EXTRACTION PROGRESS ===');
    console.log(JSON.stringify(mall.extraction_progress, null, 2));
  }

  // Check raw API outputs
  if (mall.apify_output) {
    console.log('\n=== APIFY OUTPUT (Google Places) ===');
    console.log('Has data:', Object.keys(mall.apify_output).length > 0 ? 'Yes' : 'No');
    console.log('Keys:', Object.keys(mall.apify_output).join(', '));
  }

  if (mall.firecrawl_output) {
    console.log('\n=== FIRECRAWL OUTPUT ===');
    console.log('Has data:', Object.keys(mall.firecrawl_output).length > 0 ? 'Yes' : 'No');
  }
}

checkMallData().catch(console.error);
