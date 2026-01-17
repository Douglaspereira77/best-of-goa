// Comprehensive Field Population Audit
// Checks EVERY field in restaurants table to see what has data and what doesn't
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function auditAllFields() {
  console.log('🔍 COMPREHENSIVE FIELD POPULATION AUDIT\n');
  console.log('='.repeat(80));

  // Get all restaurants with ALL fields
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n📊 Analyzing ${restaurants.length} restaurants\n`);
  console.log('='.repeat(80));

  // Define field categories
  const fieldCategories = {
    'Core Identity': ['id', 'name', 'slug', 'status', 'created_at', 'updated_at'],

    'Location': ['address', 'area', 'latitude', 'longitude', 'neighborhood_id', 'postal_code', 'nearby_landmarks'],

    'Mall Info': ['mall_name', 'mall_floor', 'mall_gate'],

    'Contact': ['phone', 'email', 'website'],

    'Social Media': ['instagram', 'facebook', 'twitter'],

    'Pricing': ['price_level', 'currency', 'average_price', 'average_meal_price'],

    'Ratings': [
      'overall_rating', 'rating_breakdown', 'total_reviews', 'rating_aggregate',
      'google_rating', 'google_review_count',
      'tripadvisor_rating', 'tripadvisor_review_count', 'tripadvisor_url',
      'opentable_rating', 'opentable_review_count'
    ],

    'Descriptions': ['description', 'description_ar', 'short_description'],

    'Images': ['hero_image', 'logo_image'],

    'Hours & Logistics': [
      'hours', 'visit_time_mins', 'best_time_description',
      'busy_times', 'quiet_times'
    ],

    'Policies': [
      'dress_code', 'reservations_policy', 'reservation_url',
      'parking_info', 'public_transport', 'payment_methods'
    ],

    'Special Features': [
      'awards', 'michelin_stars', 'michelin_guide_award_id',
      'secret_menu_items', 'staff_picks', 'kids_menu', 'promotions'
    ],

    'Chain Info': ['restaurant_chain_id', 'parent_chain_id', 'is_chain_parent'],

    'Menu': ['menu_source', 'menu_updated', 'menu_url', 'menu_last_updated', 'menu_data'],

    'SEO': ['meta_title', 'meta_description', 'keywords'],

    'Admin Flags': ['verified', 'featured', 'active'],

    'Raw Data Sources': [
      'google_place_id', 'apify_output', 'firecrawl_output',
      'firecrawl_menu_output', 'last_scraped_at'
    ],

    'Import Tracking': [
      'import_started_at', 'import_completed_at', 'job_progress', 'error_logs'
    ],

    'Relationships': [
      'restaurant_cuisine_ids', 'restaurant_category_ids',
      'restaurant_feature_ids', 'restaurant_meal_ids', 'restaurant_good_for_ids'
    ],

    'Google Places Data': ['questions_and_answers', 'people_also_search']
  };

  // Analyze each category
  const results = {};

  for (const [category, fields] of Object.entries(fieldCategories)) {
    console.log(`\n📋 ${category}:`);
    console.log('─'.repeat(80));

    results[category] = {};

    for (const field of fields) {
      // Count how many restaurants have this field populated
      let populatedCount = 0;
      let sampleValue = null;

      restaurants.forEach(restaurant => {
        const value = restaurant[field];

        // Check if field is populated (not null, not undefined, not empty string, not empty array)
        const isPopulated =
          value !== null &&
          value !== undefined &&
          value !== '' &&
          !(Array.isArray(value) && value.length === 0) &&
          !(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);

        if (isPopulated) {
          populatedCount++;
          if (!sampleValue) {
            // Store a sample value for display
            if (typeof value === 'string' && value.length > 50) {
              sampleValue = value.substring(0, 50) + '...';
            } else if (typeof value === 'object') {
              sampleValue = Array.isArray(value) ? `[Array: ${value.length} items]` : '[Object]';
            } else {
              sampleValue = value;
            }
          }
        }
      });

      const percentage = ((populatedCount / restaurants.length) * 100).toFixed(0);
      const status = populatedCount === 0 ? '❌' : populatedCount === restaurants.length ? '✅' : '⚠️';

      results[category][field] = {
        populated: populatedCount,
        total: restaurants.length,
        percentage: percentage,
        sample: sampleValue
      };

      console.log(`   ${status} ${field.padEnd(30)} ${populatedCount}/${restaurants.length} (${percentage}%)`);
      if (sampleValue && populatedCount > 0 && populatedCount < restaurants.length) {
        console.log(`      Sample: ${sampleValue}`);
      }
    }
  }

  // Summary by category
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY BY CATEGORY:\n');

  for (const [category, fields] of Object.entries(results)) {
    const totalFields = Object.keys(fields).length;
    const fullyPopulated = Object.values(fields).filter(f => f.populated === restaurants.length).length;
    const partiallyPopulated = Object.values(fields).filter(f => f.populated > 0 && f.populated < restaurants.length).length;
    const empty = Object.values(fields).filter(f => f.populated === 0).length;

    console.log(`${category}:`);
    console.log(`   ✅ Fully populated: ${fullyPopulated}/${totalFields}`);
    console.log(`   ⚠️  Partially populated: ${partiallyPopulated}/${totalFields}`);
    console.log(`   ❌ Empty: ${empty}/${totalFields}`);
    console.log();
  }

  // Identify fields that SHOULD be populated from existing data
  console.log('='.repeat(80));
  console.log('\n🎯 FIELDS THAT CAN BE POPULATED FROM EXISTING DATA:\n');

  // Check if we have data in apify_output or firecrawl_output that isn't mapped
  const sampleRestaurant = restaurants[0];
  const apifyData = sampleRestaurant.apify_output || {};
  const firecrawlData = sampleRestaurant.firecrawl_output || {};

  console.log('📊 Sample Apify Output Fields:');
  if (Object.keys(apifyData).length > 0) {
    Object.keys(apifyData).slice(0, 20).forEach(key => {
      console.log(`   - ${key}`);
    });
    if (Object.keys(apifyData).length > 20) {
      console.log(`   ... and ${Object.keys(apifyData).length - 20} more fields`);
    }
  } else {
    console.log('   (No Apify data)');
  }

  console.log('\n📊 Sample Firecrawl Output Fields:');
  if (Object.keys(firecrawlData).length > 0) {
    Object.keys(firecrawlData).slice(0, 20).forEach(key => {
      console.log(`   - ${key}`);
    });
    if (Object.keys(firecrawlData).length > 20) {
      console.log(`   ... and ${Object.keys(firecrawlData).length - 20} more fields`);
    }
  } else {
    console.log('   (No Firecrawl data)');
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📋 RECOMMENDED NEXT STEPS:\n');

  // Identify critical empty fields
  const criticalEmptyFields = [];

  ['Contact', 'Pricing', 'Hours & Logistics', 'Descriptions'].forEach(category => {
    if (results[category]) {
      Object.entries(results[category]).forEach(([field, data]) => {
        if (data.populated === 0) {
          criticalEmptyFields.push({ category, field });
        }
      });
    }
  });

  if (criticalEmptyFields.length > 0) {
    console.log('❌ Critical empty fields that should be populated:');
    criticalEmptyFields.forEach(({ category, field }) => {
      console.log(`   - ${field} (${category})`);
    });
  }

  console.log('\n💡 Recommendations:');
  console.log('   1. Map additional Apify fields to database columns');
  console.log('   2. Extract data from Firecrawl output');
  console.log('   3. Create migration scripts for each data source');
  console.log('   4. Consider which fields are optional vs required');

  console.log('\n' + '='.repeat(80));
}

auditAllFields().catch(error => {
  console.error('❌ Error:', error);
});
