/**
 * Extract Top 50 Fitness Places
 * 
 * Runs full extraction orchestrator on the top 50 fitness places by review count
 * Processes in batches with progress tracking and error handling
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Import the FitnessExtractionOrchestrator
// Note: This will be a dynamic import since it's TypeScript
async function getFitnessOrchestrator() {
  // For now, we'll use the API endpoint which triggers the orchestrator
  return null;
}

async function extractTopFitnessPlaces() {
  console.log('🏋️  Top 50 Fitness Places - Full Extraction');
  console.log('===========================================\n');

  // Get top 50 fitness places by review count
  const { data: fitnessPlaces, error } = await supabase
    .from('fitness_places')
    .select('id, name, slug, area, google_rating, google_review_count, google_place_id, extraction_status')
    .not('google_rating', 'is', null)
    .not('google_place_id', 'is', null)
    .order('google_review_count', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Error fetching fitness places:', error);
    process.exit(1);
  }

  console.log(`Found ${fitnessPlaces.length} fitness places to extract\n`);

  // Show breakdown
  const avgReviews = Math.round(
    fitnessPlaces.reduce((sum, fp) => sum + (fp.google_review_count || 0), 0) / fitnessPlaces.length
  );
  console.log('📊 Statistics:');
  console.log(`   Average reviews: ${avgReviews}`);
  console.log(`   Top gym: ${fitnessPlaces[0].name} (${fitnessPlaces[0].google_review_count} reviews)`);
  console.log(`   50th gym: ${fitnessPlaces[49].name} (${fitnessPlaces[49].google_review_count} reviews)`);
  console.log('');

  // Check how many already have data
  const hasDescription = fitnessPlaces.filter(fp => fp.description).length;
  const needsExtraction = fitnessPlaces.filter(fp => !fp.description).length;
  
  console.log('📋 Current Status:');
  console.log(`   Already extracted: ${hasDescription}`);
  console.log(`   Needs extraction: ${needsExtraction}`);
  console.log('');

  // Batch configuration
  const BATCH_SIZE = 5; // Process 5 at a time to avoid overwhelming APIs
  const DELAY_BETWEEN_BATCHES = 10000; // 10 seconds between batches
  const DELAY_BETWEEN_ITEMS = 2000; // 2 seconds between individual extractions

  console.log('⚙️  Extraction Configuration:');
  console.log(`   Batch size: ${BATCH_SIZE} gyms at a time`);
  console.log(`   Delay between gyms: ${DELAY_BETWEEN_ITEMS / 1000}s`);
  console.log(`   Delay between batches: ${DELAY_BETWEEN_BATCHES / 1000}s`);
  console.log(`   Estimated total time: ${Math.ceil((fitnessPlaces.length * DELAY_BETWEEN_ITEMS + (fitnessPlaces.length / BATCH_SIZE) * DELAY_BETWEEN_BATCHES) / 60000)} minutes\n`);

  console.log('🚀 Starting extraction...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process in batches
  for (let i = 0; i < fitnessPlaces.length; i += BATCH_SIZE) {
    const batch = fitnessPlaces.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(fitnessPlaces.length / BATCH_SIZE);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 BATCH ${batchNum}/${totalBatches} (Gyms ${i + 1}-${Math.min(i + BATCH_SIZE, fitnessPlaces.length)})`);
    console.log('='.repeat(60));

    for (const fp of batch) {
      const currentNum = fitnessPlaces.indexOf(fp) + 1;
      console.log(`\n[${currentNum}/${fitnessPlaces.length}] 🏋️  ${fp.name} (${fp.area})`);
      console.log(`   Google: ${fp.google_rating}⭐ (${fp.google_review_count} reviews)`);
      console.log(`   Place ID: ${fp.google_place_id}`);

      try {
        // Call the RE-RUN extraction API endpoint for existing fitness places
        const response = await fetch(`http://localhost:3000/api/admin/fitness/${fp.id}/rerun`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();
        console.log(`   ✅ Extraction started: ${result.message || 'Success'}`);
        successCount++;

        // Wait between individual extractions
        if (fitnessPlaces.indexOf(fp) < fitnessPlaces.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_ITEMS));
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
        errors.push({ name: fp.name, error: error.message });
      }
    }

    // Wait between batches (except for last batch)
    if (i + BATCH_SIZE < fitnessPlaces.length) {
      console.log(`\n⏸️  Batch complete. Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  // Final summary
  console.log('\n\n' + '='.repeat(60));
  console.log('🎉 EXTRACTION COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}/${fitnessPlaces.length}`);
  console.log(`❌ Errors: ${errorCount}/${fitnessPlaces.length}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Failed extractions:');
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.name}: ${err.error}`);
    });
  }

  console.log('\n💡 Next Steps:');
  console.log('   1. Check extraction progress in database');
  console.log('   2. Monitor logs for any errors');
  console.log('   3. Review generated descriptions and SEO content');
  console.log('   4. Verify social media links were found');
  console.log('');
  console.log('   Query to check status:');
  console.log('   SELECT name, extraction_status, description IS NOT NULL as has_desc');
  console.log('   FROM fitness_places ORDER BY google_review_count DESC LIMIT 50;');
  console.log('');
}

extractTopFitnessPlaces()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

