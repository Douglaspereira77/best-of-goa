#!/usr/bin/env node

/**
 * RUN PENDING HOTEL EXTRACTIONS
 *
 * Directly calls the hotel extraction orchestrator for hotels already in pending status.
 * This is for hotels that have been queued but not yet extracted.
 *
 * Usage: node bin/run-pending-hotel-extractions.js [batchSize]
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const BATCH_SIZE = parseInt(process.argv[2]) || 2;
const BATCH_DELAY_MS = 180000; // 3 minutes between batches
const REQUEST_DELAY_MS = 5000; // 5 seconds between hotels

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runExtractions() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        RUN PENDING HOTEL EXTRACTIONS (DIRECT)             ║');
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
    process.exit(0);
  }

  console.log(`Found ${pendingHotels.length} pending hotels`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Batch delay: ${BATCH_DELAY_MS / 1000}s\n`);

  // Split into batches
  const batches = [];
  for (let i = 0; i < pendingHotels.length; i += BATCH_SIZE) {
    batches.push(pendingHotels.slice(i, i + BATCH_SIZE));
  }

  console.log(`Total batches: ${batches.length}`);
  console.log(`Estimated cost: $${pendingHotels.length.toFixed(2)}`);
  console.log(`Estimated time: ${((pendingHotels.length * 3.5 + (batches.length - 1) * 3) / 60).toFixed(1)} hours\n`);
  console.log('═'.repeat(60) + '\n');

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
      console.log(`${progress}   Hotel ID: ${hotel.id}`);

      try {
        // Update status to processing
        await supabase
          .from('hotels')
          .update({
            extraction_status: 'processing',
            extraction_progress: {
              current_step: 'apify_fetch',
              percentage: 10,
              steps_completed: ['initial_creation']
            }
          })
          .eq('id', hotel.id);

        // Call the orchestrator API
        const response = await fetch('http://localhost:3000/api/admin/hotels/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotel_id: hotel.id,
            place_id: hotel.google_place_id,
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

        if (response.ok) {
          console.log(`${progress}   Extraction triggered successfully`);
          totalSuccess++;
        } else {
          const result = await response.json();
          throw new Error(result.error || `HTTP ${response.status}`);
        }

      } catch (err) {
        console.log(`${progress}   FAILED: ${err.message}`);
        totalFailed++;
        failedHotels.push({ name: hotel.name, id: hotel.id, error: err.message });

        // Reset to pending on failure
        await supabase
          .from('hotels')
          .update({ extraction_status: 'pending' })
          .eq('id', hotel.id);
      }

      // Delay between requests
      if (i < batch.length - 1) {
        await delay(REQUEST_DELAY_MS);
      }
    }

    console.log(`\nBatch ${batchNum} complete\n`);

    // Delay between batches
    if (batchIndex < batches.length - 1) {
      console.log(`Waiting 3 minutes before next batch...`);
      await delay(BATCH_DELAY_MS);
      console.log('');
    }
  }

  // Final summary
  console.log('═'.repeat(60));
  console.log('EXTRACTION SUMMARY');
  console.log('─'.repeat(60));
  console.log(`Triggered: ${totalSuccess}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Total: ${pendingHotels.length}\n`);

  if (failedHotels.length > 0) {
    console.log('FAILED HOTELS:');
    failedHotels.forEach((h, idx) => {
      console.log(`  ${idx + 1}. ${h.name} (${h.id}): ${h.error}`);
    });
    console.log('');
  }

  console.log('IMPORTANT: Extractions run in background on the server.');
  console.log('Monitor progress at: http://localhost:3000/admin/hotels/queue\n');
}

runExtractions().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
