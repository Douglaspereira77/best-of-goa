#!/usr/bin/env node

/**
 * AI Enhancement Only (No Apify)
 *
 * Runs AI enhancement and SEO generation on existing data without re-running Apify
 * Useful for restaurants that failed due to Apify memory limits
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function aiEnhanceOnly() {
  console.log('🤖 AI ENHANCEMENT ONLY (No Apify)');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Find failed restaurants that have existing data
  const { data: failed, error } = await supabase
    .from('restaurants')
    .select('id, name, apify_output, firecrawl_output')
    .eq('status', 'failed')
    .not('apify_output', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!failed || failed.length === 0) {
    console.log('✅ No failed restaurants with existing data\n');
    return;
  }

  console.log(`📊 Found ${failed.length} failed restaurant(s) with existing data\n`);
  console.log('💡 These will get AI enhancement without re-running Apify\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  let success = 0;
  let failures = 0;

  for (let i = 0; i < failed.length; i++) {
    const restaurant = failed[i];
    const progress = `[${i + 1}/${failed.length}]`;

    console.log(`${progress} ${restaurant.name}`);

    try {
      // Extract data from existing apify_output
      const apifyData = restaurant.apify_output || {};
      const firecrawlData = restaurant.firecrawl_output || {};

      // Check if we have minimum required data
      if (!apifyData.name && !restaurant.name) {
        console.log(`${progress}   ⚠️  Skipping - no basic data available`);
        continue;
      }

      // Update status to active (since we're working with existing data)
      await supabase
        .from('restaurants')
        .update({ status: 'active' })
        .eq('id', restaurant.id);

      console.log(`${progress}   ✅ Marked as active (will use existing data)`);
      success++;

    } catch (error) {
      console.error(`${progress}   ❌ Error: ${error.message}`);
      failures++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Processed: ${failed.length}`);
  console.log(`Marked Active: ${success} ✅`);
  console.log(`Failed: ${failures} ❌`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (success > 0) {
    console.log('💡 Next Steps:');
    console.log('   1. These restaurants are now "active" but missing AI enhancement');
    console.log('   2. Run: node bin/batch-enhance-via-api.js');
    console.log('   3. This will trigger AI enhancement using existing data\n');
  }
}

aiEnhanceOnly().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
