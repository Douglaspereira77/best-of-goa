// Phase 1 Population Script
// Updates ALL restaurants with Phase 1 fields from existing apify_output data
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

// Extract features from additionalInfo (same logic as extraction-orchestrator)
function extractAdditionalInfoFeatures(additionalInfo) {
  if (!additionalInfo) return [];

  const features = [];

  const categoriesToExtract = [
    'Accessibility',
    'Offerings',
    'Amenities',
    'Dining options',
    'Service options',
    'Crowd',
    'Children',
    'Highlights'
  ];

  categoriesToExtract.forEach(category => {
    if (additionalInfo[category] && Array.isArray(additionalInfo[category])) {
      additionalInfo[category].forEach((item) => {
        const key = Object.keys(item)[0];
        const value = item[key];

        if (value === true) {
          features.push(key);
        }
      });
    }
  });

  return features;
}

async function populatePhase1Fields() {
  console.log('🚀 Phase 1 Field Population - Processing ALL Restaurants\n');
  console.log('='.repeat(80));

  // Get all active restaurants with apify_output
  console.log('\n📊 Step 1: Fetching restaurants...');
  const { data: restaurants, error: fetchError } = await supabase
    .from('restaurants')
    .select('id, name, apify_output')
    .eq('status', 'active')
    .not('apify_output', 'is', null);

  if (fetchError) {
    console.error('❌ Error fetching restaurants:', fetchError);
    return;
  }

  console.log(`✅ Found ${restaurants.length} restaurants with Apify data\n`);

  // Process each restaurant
  const results = {
    total: restaurants.length,
    updated: 0,
    skipped: 0,
    failed: 0,
    details: []
  };

  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    console.log(`\n[${ i + 1}/${restaurants.length}] Processing: ${restaurant.name}`);
    console.log('─'.repeat(80));

    try {
      const apifyData = restaurant.apify_output;

      // Extract Phase 1 fields
      const postal_code = apifyData?.postalCode || null;
      const questions_and_answers = apifyData?.questionsAndAnswers || null;
      const people_also_search = apifyData?.peopleAlsoSearch || null;
      const extractedFeatures = extractAdditionalInfoFeatures(apifyData?.additionalInfo);

      // Show what we're extracting
      console.log(`   postal_code: ${postal_code ? '✅ ' + postal_code : '❌ Not available'}`);
      console.log(`   questions_and_answers: ${questions_and_answers ? '✅ Available' : '❌ Not available'}`);
      console.log(`   people_also_search: ${people_also_search ? `✅ ${people_also_search.length} places` : '❌ Not available'}`);
      console.log(`   extracted_features: ${extractedFeatures.length > 0 ? `✅ ${extractedFeatures.length} features` : '❌ None'}`);

      // Check if any updates needed
      const hasUpdates = postal_code || questions_and_answers || people_also_search || extractedFeatures.length > 0;

      if (!hasUpdates) {
        console.log('   ⏭️  SKIPPED - No Phase 1 data available in Apify output');
        results.skipped++;
        results.details.push({
          name: restaurant.name,
          status: 'skipped',
          reason: 'No Phase 1 data available'
        });
        continue;
      }

      // Update restaurant
      const updateData = {
        postal_code: postal_code,
        questions_and_answers: questions_and_answers,
        people_also_search: people_also_search,
        keywords: extractedFeatures.length > 0 ? extractedFeatures : undefined,
        updated_at: new Date().toISOString()
      };

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
          postal_code: !!postal_code,
          questions_and_answers: !!questions_and_answers,
          people_also_search: !!people_also_search,
          features_count: extractedFeatures.length
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
  console.log('\n📊 PHASE 1 POPULATION SUMMARY:\n');
  console.log(`Total restaurants: ${results.total}`);
  console.log(`✅ Updated: ${results.updated}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);

  console.log('\n📋 Detailed Breakdown:\n');

  const updated = results.details.filter(d => d.status === 'updated');
  if (updated.length > 0) {
    console.log(`✅ Successfully Updated (${updated.length}):`);
    updated.forEach(d => {
      console.log(`   - ${d.name}`);
      console.log(`     postal_code: ${d.postal_code ? 'YES' : 'NO'}`);
      console.log(`     Q&A: ${d.questions_and_answers ? 'YES' : 'NO'}`);
      console.log(`     Related places: ${d.people_also_search ? 'YES' : 'NO'}`);
      console.log(`     Features: ${d.features_count}`);
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
  console.log('\n✅ PHASE 1 POPULATION COMPLETE!\n');
}

populatePhase1Fields().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
