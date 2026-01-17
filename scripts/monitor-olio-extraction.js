// Monitor Olio extraction progress in real-time
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

async function monitorExtraction() {
  console.log('🔄 Monitoring Olio Trattoria Italiana Re-extraction\n');
  console.log('='.repeat(80));

  // Get the most recent Olio extraction
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('id, name, status, import_started_at, import_completed_at, job_progress, error_logs, phone, website, google_rating, hours, menu_url, average_visit_time_mins')
    .ilike('name', '%Olio%')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n📍 Restaurant: ${restaurant.name}`);
  console.log(`   ID: ${restaurant.id}`);
  console.log(`   Status: ${restaurant.status}`);
  console.log(`   Import Started: ${restaurant.import_started_at || '(not started)'}`);
  console.log(`   Import Completed: ${restaurant.import_completed_at || '(in progress)'}`);

  // Check if extraction is in progress
  const isInProgress = restaurant.import_started_at && !restaurant.import_completed_at;

  if (!isInProgress) {
    console.log('\n⚠️  No active extraction detected.');
    console.log('   Either extraction hasn\'t started yet or has already completed.');
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 EXTRACTION PROGRESS:\n');

  const progress = restaurant.job_progress || {};
  const steps = [
    'initial_creation',
    'apify_fetch',
    'apify_reviews',
    'firecrawl_general',
    'firecrawl_menu',
    'firecrawl_website',
    'firecrawl_tripadvisor',
    'firecrawl_opentable',
    'ai_sentiment',
    'ai_enhancement',
    'data_mapping'
  ];

  steps.forEach(step => {
    const stepData = progress[step];
    if (!stepData) {
      console.log(`   ⏳ ${step.padEnd(25)} Pending`);
    } else if (stepData.status === 'completed') {
      console.log(`   ✅ ${step.padEnd(25)} Completed`);
    } else if (stepData.status === 'failed') {
      console.log(`   ❌ ${step.padEnd(25)} FAILED: ${stepData.error || 'Unknown error'}`);
    } else {
      console.log(`   🔄 ${step.padEnd(25)} ${stepData.status}`);
    }
  });

  // Check for errors
  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 ERROR LOGS:\n');

  if (restaurant.error_logs && restaurant.error_logs.length > 0) {
    console.log('❌ ERRORS DETECTED:');
    restaurant.error_logs.forEach((error, idx) => {
      console.log(`\n   [${idx + 1}] ${error.step || 'Unknown step'}:`);
      console.log(`       Message: ${error.message || error}`);
      if (error.details) {
        console.log(`       Details: ${JSON.stringify(error.details, null, 2)}`);
      }
    });
  } else {
    console.log('✅ No errors logged');
  }

  // Check field population (key fields we're testing)
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 KEY FIELD STATUS (Bug Fix Test):\n');

  const keyFields = {
    'phone': restaurant.phone,
    'website': restaurant.website,
    'google_rating': restaurant.google_rating,
    'hours': restaurant.hours,
    'menu_url': restaurant.menu_url,
    'average_visit_time_mins': restaurant.average_visit_time_mins
  };

  Object.entries(keyFields).forEach(([field, value]) => {
    const hasValue = value !== null && value !== undefined && value !== '' &&
                     !(Array.isArray(value) && value.length === 0) &&
                     !(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);

    const status = hasValue ? '✅' : '❌';
    const display = hasValue ?
                   (typeof value === 'object' ? 'populated' : String(value).substring(0, 50)) :
                   '(empty)';

    console.log(`   ${status} ${field.padEnd(25)} ${display}`);
  });

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 ANALYSIS:\n');

  const apifyFetchComplete = progress.apify_fetch?.status === 'completed';
  const apifyFetchFailed = progress.apify_fetch?.status === 'failed';
  const hasErrors = restaurant.error_logs && restaurant.error_logs.length > 0;
  const fieldsPopulated = Object.values(keyFields).filter(v => v !== null && v !== undefined && v !== '').length;

  if (apifyFetchFailed) {
    console.log('❌ APIFY FETCH FAILED');
    console.log('   → Extraction cannot proceed without Apify data');
    console.log('   → Check error logs above for details');
  } else if (apifyFetchComplete && fieldsPopulated === 0) {
    console.log('❌ BUG STILL EXISTS');
    console.log('   → Apify fetch completed but no fields populated');
    console.log('   → updateRestaurantFields() may still be failing');
    if (!hasErrors) {
      console.log('   → No errors logged - check console output during extraction');
    }
  } else if (apifyFetchComplete && fieldsPopulated > 0) {
    console.log(`✅ BUG FIX WORKING! (${fieldsPopulated}/6 key fields populated)`);
    console.log('   → Fields are being updated successfully');
    console.log('   → Error handling is working');
  } else if (!apifyFetchComplete && !restaurant.import_completed_at) {
    console.log('⏳ EXTRACTION IN PROGRESS');
    console.log('   → Wait for extraction to complete');
    console.log('   → Run this script again in 1-2 minutes');
  } else if (restaurant.import_completed_at) {
    console.log('✅ EXTRACTION COMPLETED');
    console.log(`   → ${fieldsPopulated}/6 key fields populated`);

    if (fieldsPopulated >= 5) {
      console.log('   → SUCCESS: Bug fix is working!');
    } else if (fieldsPopulated > 0) {
      console.log('   → PARTIAL: Some fields populated, check for specific errors');
    } else {
      console.log('   → FAILED: No fields populated, bug may still exist');
    }
  }

  console.log('\n' + '='.repeat(80));

  if (!restaurant.import_completed_at) {
    console.log('\n💡 TIP: Run this script again in 1-2 minutes to see updated progress:');
    console.log('   node monitor-olio-extraction.js');
  }

  console.log('\n' + '='.repeat(80));
}

monitorExtraction().catch(error => {
  console.error('❌ Error:', error);
});
