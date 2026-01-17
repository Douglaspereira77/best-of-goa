// Phase 2 Population Script - Apify Advanced Fields
// Populates: hours, visit_time_mins, busy_times, menu_url, total_reviews, email
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

// Calculate estimated visit time based on price level and category
function estimateVisitTime(apifyData, priceLevel) {
  const category = apifyData?.categoryName || '';

  // Fine dining = 120 mins, Casual = 90 mins, Fast food = 45 mins
  if ((priceLevel !== null && priceLevel >= 3) || /fine.*dining/i.test(category)) return 120;
  if (priceLevel === 2) return 90;
  if (/fast.*food|quick.*service|cafe|coffee/i.test(category)) return 45;
  return 90; // default
}

// Parse opening hours from Apify format to our format
function parseOpeningHours(openingHours) {
  if (!openingHours || !Array.isArray(openingHours)) return null;

  try {
    const hours = {};
    openingHours.forEach(entry => {
      if (entry.day && entry.hours) {
        const day = entry.day.toLowerCase();
        hours[day] = entry.hours;
      }
    });
    return Object.keys(hours).length > 0 ? hours : null;
  } catch (error) {
    console.error('Error parsing opening hours:', error);
    return null;
  }
}

// Parse popular times histogram into busy_times and quiet_times
function parsePopularTimes(popularTimesHistogram) {
  if (!popularTimesHistogram || typeof popularTimesHistogram !== 'object') return { busy_times: null, quiet_times: null };

  try {
    const busy_times = {};
    const quiet_times = {};

    // popularTimesHistogram is an object with days as keys
    Object.keys(popularTimesHistogram).forEach(day => {
      const dayData = popularTimesHistogram[day];
      if (!Array.isArray(dayData)) return;

      // Find peak hours (busy times) - values > 60
      const peakHours = [];
      const quietHours = [];

      dayData.forEach((value, hour) => {
        if (value > 60) {
          peakHours.push(hour);
        } else if (value < 30) {
          quietHours.push(hour);
        }
      });

      if (peakHours.length > 0) {
        // Convert to human-readable format
        const start = peakHours[0];
        const end = peakHours[peakHours.length - 1];
        busy_times[day.toLowerCase()] = `${start}:00-${end + 1}:00`;
      }

      if (quietHours.length > 0) {
        const start = quietHours[0];
        const end = quietHours[quietHours.length - 1];
        quiet_times[day.toLowerCase()] = `${start}:00-${end + 1}:00`;
      }
    });

    return {
      busy_times: Object.keys(busy_times).length > 0 ? busy_times : null,
      quiet_times: Object.keys(quiet_times).length > 0 ? quiet_times : null
    };
  } catch (error) {
    console.error('Error parsing popular times:', error);
    return { busy_times: null, quiet_times: null };
  }
}

async function populatePhase2Fields() {
  console.log('🚀 Phase 2 Field Population - Apify Advanced Fields\n');
  console.log('Fields: hours, average_visit_time_mins, busy_times, quiet_times, menu_url, total_reviews_aggregated, email\n');
  console.log('='.repeat(80));

  // Get all active restaurants
  console.log('\n📊 Step 1: Fetching restaurants...');
  const { data: restaurants, error: fetchError } = await supabase
    .from('restaurants')
    .select('id, name, price_level, apify_output, hours, average_visit_time_mins, busy_times, menu_url, total_reviews_aggregated, email')
    .eq('status', 'active')
    .not('apify_output', 'is', null);

  if (fetchError) {
    console.error('❌ Error fetching restaurants:', fetchError);
    return;
  }

  console.log(`✅ Found ${restaurants.length} restaurants\n`);

  const results = {
    total: restaurants.length,
    updated: 0,
    skipped: 0,
    failed: 0,
    details: []
  };

  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    console.log(`\n[${i + 1}/${restaurants.length}] Processing: ${restaurant.name}`);
    console.log('─'.repeat(80));

    try {
      const apifyData = restaurant.apify_output;
      const updateData = {};
      let hasUpdates = false;

      // 1. Hours
      if (!restaurant.hours && apifyData.openingHours) {
        const parsedHours = parseOpeningHours(apifyData.openingHours);
        if (parsedHours) {
          updateData.hours = parsedHours;
          hasUpdates = true;
          console.log('   ✅ hours: Parsed from openingHours');
        }
      } else {
        console.log(`   ⏭️  hours: ${restaurant.hours ? 'Already set' : 'Not available'}`);
      }

      // 2. Visit time
      if (!restaurant.average_visit_time_mins) {
        const visitTime = estimateVisitTime(apifyData, restaurant.price_level);
        updateData.average_visit_time_mins = visitTime;
        hasUpdates = true;
        console.log(`   ✅ average_visit_time_mins: ${visitTime} mins (calculated)`);
      } else {
        console.log(`   ⏭️  average_visit_time_mins: Already set (${restaurant.average_visit_time_mins} mins)`);
      }

      // 3. Busy times and quiet times
      if (!restaurant.busy_times && apifyData.popularTimesHistogram) {
        const { busy_times, quiet_times } = parsePopularTimes(apifyData.popularTimesHistogram);
        if (busy_times) {
          updateData.busy_times = busy_times;
          hasUpdates = true;
          console.log('   ✅ busy_times: Extracted from popularTimesHistogram');
        }
        if (quiet_times) {
          updateData.quiet_times = quiet_times;
          hasUpdates = true;
          console.log('   ✅ quiet_times: Extracted from popularTimesHistogram');
        }
        if (!busy_times && !quiet_times) {
          console.log('   ⏭️  busy_times/quiet_times: Data not parseable');
        }
      } else {
        console.log(`   ⏭️  busy_times: ${restaurant.busy_times ? 'Already set' : 'Not available'}`);
      }

      // 4. Menu URL
      if (!restaurant.menu_url && apifyData.menu) {
        updateData.menu_url = apifyData.menu;
        hasUpdates = true;
        console.log(`   ✅ menu_url: ${apifyData.menu.substring(0, 50)}...`);
      } else {
        console.log(`   ⏭️  menu_url: ${restaurant.menu_url ? 'Already set' : 'Not available'}`);
      }

      // 5. Total reviews
      if (!restaurant.total_reviews_aggregated && apifyData.reviews && Array.isArray(apifyData.reviews)) {
        updateData.total_reviews_aggregated = apifyData.reviews.length;
        hasUpdates = true;
        console.log(`   ✅ total_reviews_aggregated: ${apifyData.reviews.length}`);
      } else {
        console.log(`   ⏭️  total_reviews_aggregated: ${restaurant.total_reviews_aggregated ? 'Already set' : 'Not available'}`);
      }

      // 6. Email (rarely available from Google)
      if (!restaurant.email && apifyData.email) {
        updateData.email = apifyData.email;
        hasUpdates = true;
        console.log(`   ✅ email: ${apifyData.email}`);
      } else {
        console.log(`   ⏭️  email: ${restaurant.email ? 'Already set' : 'Not available from Google'}`);
      }

      if (!hasUpdates) {
        console.log('\n   ⏭️  SKIPPED - All Phase 2 fields already populated or unavailable');
        results.skipped++;
        results.details.push({
          name: restaurant.name,
          status: 'skipped',
          reason: 'All fields already populated or unavailable'
        });
        continue;
      }

      // Add timestamp
      updateData.updated_at = new Date().toISOString();

      // Update restaurant
      console.log('\n   🚀 Updating database...');
      const { error: updateError } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', restaurant.id);

      if (updateError) {
        console.error('   ❌ UPDATE FAILED:', updateError.message);
        results.failed++;
        results.details.push({
          name: restaurant.name,
          status: 'failed',
          error: updateError.message
        });
      } else {
        console.log('   ✅ UPDATED SUCCESSFULLY');
        results.updated++;
        results.details.push({
          name: restaurant.name,
          status: 'updated',
          fields_updated: Object.keys(updateData).filter(k => k !== 'updated_at')
        });
      }

    } catch (error) {
      console.error('   ❌ ERROR:', error.message);
      results.failed++;
      results.details.push({
        name: restaurant.name,
        status: 'failed',
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 PHASE 2 MIGRATION SUMMARY:\n');
  console.log(`Total restaurants: ${results.total}`);
  console.log(`✅ Updated: ${results.updated}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);

  console.log('\n📋 Detailed Results:\n');

  const updated = results.details.filter(d => d.status === 'updated');
  if (updated.length > 0) {
    console.log(`✅ Successfully Updated (${updated.length}):`);
    updated.forEach(d => {
      console.log(`   - ${d.name}`);
      console.log(`     Fields: ${d.fields_updated.join(', ')}`);
    });
  }

  const skipped = results.details.filter(d => d.status === 'skipped');
  if (skipped.length > 0) {
    console.log(`\n⏭️  Skipped (${skipped.length}):`);
    skipped.forEach(d => {
      console.log(`   - ${d.name} (${d.reason})`);
    });
  }

  const failed = results.details.filter(d => d.status === 'failed');
  if (failed.length > 0) {
    console.log(`\n❌ Failed (${failed.length}):`);
    failed.forEach(d => {
      console.log(`   - ${d.name}: ${d.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ PHASE 2 MIGRATION COMPLETE!\n');
}

populatePhase2Fields().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
