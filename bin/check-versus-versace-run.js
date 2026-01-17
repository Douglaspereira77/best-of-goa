#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRun() {
  console.log('🔍 CHECKING VERSUS VERSACE APIFY RUN\n');

  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, google_place_id, apify_output, created_at')
    .eq('google_place_id', 'ChIJsxyySyCFzz8Rprr0aNnu11g')
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('Restaurant:', data.name);
  console.log('Place ID:', data.google_place_id);
  console.log('Created:', data.created_at);
  console.log('\n' + '═'.repeat(60) + '\n');

  if (data.apify_output) {
    const output = typeof data.apify_output === 'string'
      ? JSON.parse(data.apify_output)
      : data.apify_output;

    console.log('📊 APIFY OUTPUT ANALYSIS:\n');
    console.log('Keys:', Object.keys(output).join(', '));
    console.log('\nSearch Query Used:', output.searchString || 'N/A');
    console.log('Total Score:', output.totalScore || 'N/A');
    console.log('Place Name:', output.title || 'N/A');
    console.log('Place Type:', output.categoryName || 'N/A');
    console.log('Address:', output.address || 'N/A');

    if (output.location) {
      console.log('\nLocation:', JSON.stringify(output.location, null, 2));
    }

    // Check if there are multiple results in the output
    console.log('\n' + '═'.repeat(60) + '\n');
    console.log('🔎 CHECKING FOR MULTIPLE RESULTS:\n');

    // The Apify actor might return multiple results in different formats
    if (Array.isArray(output)) {
      console.log(`❗ Output is an ARRAY with ${output.length} items`);
    } else if (output.results && Array.isArray(output.results)) {
      console.log(`❗ Output has 'results' array with ${output.results.length} items`);
    } else {
      console.log('✅ Output is a single restaurant object');
    }

  } else {
    console.log('⚠️  No Apify output found for this restaurant');
  }
}

checkRun().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
