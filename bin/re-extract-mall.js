#!/usr/bin/env node
/**
 * Re-Extract Mall Data
 *
 * Triggers full extraction pipeline for an existing mall
 * Usage: node bin/re-extract-mall.js [mall-id-or-slug]
 */

require('dotenv').config({ path: '.env.local' });

const mallIdOrSlug = process.argv[2] || 'the-avenues';

async function reExtractMall() {
  console.log(`\n🔄 Re-extracting mall: ${mallIdOrSlug}\n`);

  // First, get the mall from database
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Find mall by ID or slug
  let query = supabase.from('malls').select('*');

  if (mallIdOrSlug.length === 36 && mallIdOrSlug.includes('-')) {
    // Looks like a UUID
    query = query.eq('id', mallIdOrSlug);
  } else {
    // Treat as slug
    query = query.eq('slug', mallIdOrSlug);
  }

  const { data: mall, error: fetchError } = await query.single();

  if (fetchError || !mall) {
    console.error('❌ Mall not found:', fetchError?.message || 'No match');
    process.exit(1);
  }

  console.log(`📍 Found: ${mall.name}`);
  console.log(`   ID: ${mall.id}`);
  console.log(`   Google Place ID: ${mall.google_place_id}`);
  console.log(`   Current Status: ${mall.extraction_status}`);
  console.log('');

  // Call the start-extraction API with override flag
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  console.log('🚀 Starting full 12-step extraction...\n');

  const response = await fetch(`${baseUrl}/api/admin/malls/start-extraction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      place_id: mall.google_place_id,
      search_query: mall.name,
      place_data: mall.apify_output || {
        name: mall.name,
        formatted_address: mall.address,
        geometry: {
          location: {
            lat: mall.latitude,
            lng: mall.longitude
          }
        },
        rating: mall.google_rating,
        user_ratings_total: mall.google_review_count
      },
      override: true
    })
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ Failed to start extraction:', result.error);
    process.exit(1);
  }

  console.log('✅ Extraction started successfully!');
  console.log(`   Mall ID: ${result.mall_id}`);
  console.log(`   Message: ${result.message}`);
  console.log('');
  console.log('📊 Monitor progress at:');
  console.log(`   Admin Queue: ${baseUrl}/admin/malls/queue`);
  console.log(`   API Status: ${baseUrl}/api/admin/malls/extraction-status/${result.mall_id}`);
  console.log('');
  console.log('⏳ Extraction is running in background...');
  console.log('   Steps: Apify → Firecrawl → Social Media → Reviews → Images → AI Enhancement');
  console.log('');

  // Poll for completion (optional)
  if (process.argv.includes('--watch')) {
    console.log('👁️  Watching progress (Ctrl+C to stop)...\n');

    let lastStep = '';
    let completed = false;

    while (!completed) {
      await new Promise(r => setTimeout(r, 3000));

      const { data: updatedMall } = await supabase
        .from('malls')
        .select('extraction_status, extraction_progress')
        .eq('id', mall.id)
        .single();

      if (updatedMall) {
        const progress = updatedMall.extraction_progress;

        if (progress?.steps) {
          const runningStep = progress.steps.find(s => s.status === 'running');
          const completedSteps = progress.steps.filter(s => s.status === 'completed').length;
          const totalSteps = progress.steps.length;

          if (runningStep && runningStep.name !== lastStep) {
            lastStep = runningStep.name;
            console.log(`   🔄 [${completedSteps}/${totalSteps}] ${runningStep.name}...`);
          }
        }

        if (updatedMall.extraction_status === 'completed') {
          completed = true;
          console.log('\n✅ Extraction completed successfully!');

          // Show summary
          const { data: finalMall } = await supabase
            .from('malls')
            .select('*')
            .eq('id', mall.id)
            .single();

          if (finalMall) {
            let populatedCount = 0;
            let totalFields = 0;

            for (const [key, value] of Object.entries(finalMall)) {
              if (!['id', 'created_at', 'apify_output', 'firecrawl_output', 'extraction_progress'].includes(key)) {
                totalFields++;
                if (value !== null && value !== undefined && value !== '' &&
                    !(Array.isArray(value) && value.length === 0)) {
                  populatedCount++;
                }
              }
            }

            console.log(`\n📊 Field Population: ${populatedCount}/${totalFields} (${Math.round(populatedCount/totalFields*100)}%)`);
          }
        } else if (updatedMall.extraction_status === 'failed') {
          completed = true;
          console.log('\n❌ Extraction failed!');
          if (progress?.error) {
            console.log(`   Error: ${progress.error}`);
          }
        }
      }
    }
  }
}

reExtractMall().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
