#!/usr/bin/env node

/**
 * Check Apify Run Cost
 *
 * Fetches details about a specific Apify run to verify billing
 */

require('dotenv').config({ path: '.env.local' });

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE_URL = process.env.APIFY_BASE_URL || 'https://api.apify.com/v2';

// Run ID from the log: 2025-11-12T20:13:41.181Z
// Actor: compass/crawler-google-places
// Build: XQR8ivOmlHxRePX0o

async function checkRunCost(actorId = 'compass~crawler-google-places') {
  console.log('💰 APIFY RUN COST CHECKER\n');
  console.log('═'.repeat(60) + '\n');

  try {
    // Get recent runs for this actor
    console.log('Fetching recent runs for:', actorId);
    console.log('Date filter: 2025-11-12\n');

    const url = `${APIFY_BASE_URL}/acts/${actorId}/runs?token=${APIFY_API_TOKEN}&limit=10&desc=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.data || !data.data.items || data.data.items.length === 0) {
      console.log('❌ No runs found for this actor\n');
      return;
    }

    console.log(`✅ Found ${data.data.items.length} recent runs\n`);
    console.log('═'.repeat(60) + '\n');

    // Find the run from Nov 12 at 20:13
    const targetDate = new Date('2025-11-12T20:13:00Z');
    const runWindow = 5 * 60 * 1000; // 5 minute window

    for (const run of data.data.items) {
      const runDate = new Date(run.startedAt);
      const timeDiff = Math.abs(runDate - targetDate);

      console.log(`\n📊 RUN: ${run.id}`);
      console.log('─'.repeat(60));
      console.log(`Started: ${run.startedAt}`);
      console.log(`Status: ${run.status}`);
      console.log(`Build: ${run.buildId || 'N/A'}`);

      // Check if this is our target run
      if (timeDiff < runWindow) {
        console.log('\n🎯 THIS IS THE TARGET RUN (Versus Versace)\n');
      }

      // Cost information
      if (run.usage) {
        console.log('\n💰 COST BREAKDOWN:');
        console.log(`  Compute Units: ${run.usage.COMPUTE_UNITS || 0}`);
        console.log(`  Dataset Writes: ${run.usage.DATASET_WRITES || 0}`);
        console.log(`  Dataset Reads: ${run.usage.DATASET_READS || 0}`);
      }

      // Stats
      if (run.stats) {
        console.log('\n📈 STATISTICS:');
        console.log(`  Requests Finished: ${run.stats.requestsFinished || 0}`);
        console.log(`  Requests Failed: ${run.stats.requestsFailed || 0}`);
        console.log(`  Runtime: ${run.stats.crawlerRuntimeMillis || 0}ms`);
      }

      // Output
      if (run.defaultDatasetId) {
        console.log(`\n📦 Dataset ID: ${run.defaultDatasetId}`);

        // Fetch dataset to count results
        const datasetUrl = `${APIFY_BASE_URL}/datasets/${run.defaultDatasetId}/items?token=${APIFY_API_TOKEN}`;
        const datasetResponse = await fetch(datasetUrl);

        if (datasetResponse.ok) {
          const datasetItems = await datasetResponse.json();
          console.log(`   Results: ${datasetItems.length} place(s) scraped`);

          if (timeDiff < runWindow && datasetItems.length > 0) {
            console.log('\n   First result:');
            console.log(`   - Name: ${datasetItems[0].title || 'N/A'}`);
            console.log(`   - Place ID: ${datasetItems[0].placeId || 'N/A'}`);
            console.log(`   - Address: ${datasetItems[0].address || 'N/A'}`);
          }
        }
      }

      console.log('\n' + '─'.repeat(60));
    }

    console.log('\n\n💡 COST ANALYSIS:\n');
    console.log('Pay-Per-Event Pricing for compass/crawler-google-places:');
    console.log('  • Actor start: $0.007 per run');
    console.log('  • Place scraped: $0.004 per place');
    console.log('\nExpected cost for 1 place:');
    console.log('  • $0.007 (start) + $0.004 (1 place) = $0.011');
    console.log('\n⚠️  You should be charged for SCRAPED places, NOT found places');
    console.log('   (24 found, 1 scraped = charge for 1 only)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('\n💡 Authentication error - check your APIFY_API_TOKEN\n');
    }
  }
}

checkRunCost().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
