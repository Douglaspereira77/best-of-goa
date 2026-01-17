#!/usr/bin/env node

/**
 * RUN HOTEL EXTRACTIONS
 *
 * Triggers extraction for all hotels with status 'pending'
 * Runs in batches with delays to avoid rate limits
 *
 * Usage: node bin/run-hotel-extractions.js [batchSize]
 *
 * Requirements:
 * - Dev server must be running: npm run dev
 * - Hotels must be queued (pending status)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const BATCH_SIZE = parseInt(process.argv[2]) || 2;
const BATCH_DELAY_MS = 180000; // 3 minutes between batches
const REQUEST_DELAY_MS = 5000; // 5 seconds between hotels in same batch

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runExtractions() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           RUN PENDING HOTEL EXTRACTIONS                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all pending hotels
  console.log('Fetching pending hotels...\n');
  const { data: pendingHotels, error } = await supabase
    .from('hotels')
    .select('id, name, google_place_id, address, google_rating, google_review_count, latitude, longitude')
    .eq('extraction_status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }

  if (!pendingHotels || pendingHotels.length === 0) {
    console.log('No pending hotels found.');
    console.log('Run: node bin/extract-missing-hotels-bulk.js first to queue hotels.\n');
    process.exit(0);
  }

  console.log(`Found ${pendingHotels.length} pending hotels`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Batch delay: ${BATCH_DELAY_MS / 1000}s`);
  console.log(`Request delay: ${REQUEST_DELAY_MS / 1000}s\n`);

  // Split into batches
  const batches = [];
  for (let i = 0; i < pendingHotels.length; i += BATCH_SIZE) {
    batches.push(pendingHotels.slice(i, i + BATCH_SIZE));
  }

  console.log(`Total batches: ${batches.length}`);
  console.log(`Estimated cost: $${pendingHotels.length.toFixed(2)}`);
  console.log(`Estimated time: ${((pendingHotels.length * 3.5 + (batches.length - 1) * 3) / 60).toFixed(1)} hours\n`);
  console.log('═'.repeat(60) + '\n');

  // Check if dev server is running
  try {
    const healthCheck = await fetch('http://localhost:3000');
    // Any response (even 404) means server is running
    console.log('Dev server is running\n');
  } catch (err) {
    console.error('Dev server is not running!');
    console.error('Please start it first: npm run dev\n');
    process.exit(1);
  }

  let totalSuccess = 0;
  let totalFailed = 0;
  const failedHotels = [];

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchNum = batchIndex + 1;

    console.log(`BATCH ${batchNum}/${batches.length} (${batch.length} hotels)`);
    console.log('─'.repeat(60));

    for (let i = 0; i < batch.length; i++) {
      const hotel = batch[i];
      const progress = `[${i + 1}/${batch.length}]`;

      console.log(`${progress} Starting: ${hotel.name}`);

      try {
        const response = await fetch('http://localhost:3000/api/admin/hotels/start-extraction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            place_id: hotel.google_place_id,
            search_query: hotel.name,
            override: true, // Force re-extraction for pending hotels
            place_data: {
              name: hotel.name,
              formatted_address: hotel.address,
              vicinity: hotel.address,
              rating: hotel.google_rating,
              user_ratings_total: hotel.google_review_count,
              geometry: {
                location: {
                  lat: hotel.latitude,
                  lng: hotel.longitude
                }
              }
            }
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          console.log(`${progress}   Started - Hotel ID: ${result.hotel_id || hotel.id}`);
          totalSuccess++;
        } else {
          throw new Error(result.error || `HTTP ${response.status}`);
        }

      } catch (err) {
        console.log(`${progress}   FAILED: ${err.message}`);
        totalFailed++;
        failedHotels.push({ name: hotel.name, error: err.message });
      }

      // Delay between requests
      if (i < batch.length - 1) {
        await delay(REQUEST_DELAY_MS);
      }
    }

    console.log(`\nBatch ${batchNum} complete: ${batch.length - failedHotels.length} started\n`);

    // Delay between batches
    if (batchIndex < batches.length - 1) {
      const remainingBatches = batches.length - batchIndex - 1;
      console.log(`Waiting 3 minutes before next batch...`);
      console.log(`Remaining: ${remainingBatches} batch(es)\n`);

      // Show countdown
      for (let sec = BATCH_DELAY_MS / 1000; sec > 0; sec -= 30) {
        await delay(30000);
        if (sec > 30) {
          process.stdout.write(`  ${sec - 30}s remaining...\\r`);
        }
      }
      console.log('');
    }
  }

  // Final summary
  console.log('═'.repeat(60));
  console.log('EXTRACTION COMPLETE');
  console.log('─'.repeat(60));
  console.log(`Started: ${totalSuccess}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Total: ${pendingHotels.length}\n`);

  if (failedHotels.length > 0) {
    console.log('FAILED HOTELS:');
    failedHotels.forEach((h, idx) => {
      console.log(`  ${idx + 1}. ${h.name}: ${h.error}`);
    });
    console.log('');
  }

  console.log('MONITOR PROGRESS:');
  console.log('  http://localhost:3000/admin/hotels/queue');
  console.log('');
  console.log('NEXT STEPS:');
  console.log('  1. Monitor queue page for progress');
  console.log('  2. Review completed hotels');
  console.log('  3. Retry any failed extractions\n');
}

runExtractions().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
