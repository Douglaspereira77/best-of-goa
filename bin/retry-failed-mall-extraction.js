#!/usr/bin/env node
/**
 * Retry Failed Mall Extraction
 *
 * Re-runs the extraction pipeline for malls that failed or completed without proper data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Import the TypeScript orchestrator
require('ts-node/register');
const { MallExtractionOrchestrator } = require(path.join(__dirname, '../src/lib/services/mall-extraction-orchestrator.ts'));

async function retryFailedExtractions() {
  console.log('🔄 Retry Failed Mall Extraction');
  console.log('='.repeat(60));

  // Find malls that need retry:
  // 1. Status = 'failed'
  // 2. Status = 'completed' but missing description (AI enhancement didn't run)
  // 3. Status = 'completed' but missing images
  const { data: malls, error } = await supabase
    .from('malls')
    .select('id, name, slug, google_place_id, extraction_status, description')
    .or('extraction_status.eq.failed,description.is.null')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching malls:', error);
    return;
  }

  // Also check which ones are missing images
  const mallsNeedingRetry = [];

  for (const mall of malls) {
    const { count } = await supabase
      .from('mall_images')
      .select('id', { count: 'exact', head: true })
      .eq('mall_id', mall.id);

    if (mall.extraction_status === 'failed' || !mall.description || count === 0) {
      mallsNeedingRetry.push({
        ...mall,
        imageCount: count || 0
      });
    }
  }

  console.log(`Found ${mallsNeedingRetry.length} malls needing retry:`);
  mallsNeedingRetry.forEach(mall => {
    console.log(`  - ${mall.name}`);
    console.log(`    Status: ${mall.extraction_status}`);
    console.log(`    Has description: ${!!mall.description}`);
    console.log(`    Image count: ${mall.imageCount}`);
  });

  if (mallsNeedingRetry.length === 0) {
    console.log('No malls need retry!');
    return;
  }

  const orchestrator = new MallExtractionOrchestrator();

  // Process 2 at a time to avoid rate limiting
  const BATCH_SIZE = 2;
  const batches = [];
  for (let i = 0; i < mallsNeedingRetry.length; i += BATCH_SIZE) {
    batches.push(mallsNeedingRetry.slice(i, i + BATCH_SIZE));
  }

  console.log(`\nWill process ${mallsNeedingRetry.length} malls in ${batches.length} batches`);
  console.log('Press Ctrl+C to cancel...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  let successful = 0;
  let failed = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`\n📦 Processing batch ${batchIndex + 1}/${batches.length}`);
    console.log('='.repeat(60));

    // Process batch in parallel
    const promises = batch.map(async (mall) => {
      console.log(`\n🏬 Retrying: ${mall.name}`);

      if (!mall.google_place_id) {
        console.log(`  ⚠️  No Google Place ID, skipping`);
        return { mall, success: false, reason: 'No Place ID' };
      }

      try {
        // Reset status to processing
        await supabase
          .from('malls')
          .update({
            extraction_status: 'processing',
            extraction_progress: { steps: [] }
          })
          .eq('id', mall.id);

        // Clear existing images to avoid duplicates
        await supabase
          .from('mall_images')
          .delete()
          .eq('mall_id', mall.id);

        // Clear existing FAQs to regenerate
        await supabase
          .from('mall_faqs')
          .delete()
          .eq('mall_id', mall.id);

        const job = {
          mallId: mall.id,
          placeId: mall.google_place_id,
          searchQuery: mall.name
        };

        await orchestrator.executeExtraction(job);

        console.log(`  ✅ ${mall.name} extraction completed`);
        return { mall, success: true };

      } catch (err) {
        console.error(`  ❌ ${mall.name} failed:`, err.message);
        return { mall, success: false, reason: err.message };
      }
    });

    const results = await Promise.all(promises);

    results.forEach(result => {
      if (result.success) successful++;
      else failed++;
    });

    // Wait between batches to avoid rate limits
    if (batchIndex < batches.length - 1) {
      console.log('\n⏳ Waiting 10 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RETRY SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📍 Total processed: ${successful + failed}`);
}

retryFailedExtractions().catch(console.error);
