#!/usr/bin/env node

/**
 * Find Incomplete Restaurants
 *
 * Identifies restaurants with:
 * - No google_place_id (or 'NEEDS_LOOKUP')
 * - No apify_output
 * - Minimal data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findIncompleteRestaurants() {
  console.log('🔍 FINDING INCOMPLETE RESTAURANTS\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Query 1: No Place ID or NEEDS_LOOKUP
  console.log('1️⃣  Finding restaurants without valid Google Place ID...\n');

  const { data: noPlaceId, error: error1 } = await supabase
    .from('restaurants')
    .select('id, name, slug, google_place_id, status, created_at')
    .or('google_place_id.is.null,google_place_id.eq.NEEDS_LOOKUP');

  if (error1) {
    console.error('❌ Query error:', error1);
    return;
  }

  console.log(`   Found ${noPlaceId.length} restaurants without valid Place ID\n`);

  // Query 2: Check which of these have apify_output
  console.log('2️⃣  Checking apify_output status for each...\n');

  const toDelete = [];
  const toKeep = [];

  for (const r of noPlaceId) {
    const { data } = await supabase
      .from('restaurants')
      .select('apify_output, description, hero_image, photos')
      .eq('id', r.id)
      .single();

    const hasApify = data?.apify_output != null && Object.keys(data.apify_output).length > 0;
    const hasDescription = data?.description != null && data.description.length > 0;
    const hasHeroImage = data?.hero_image != null;
    const photosCount = data?.photos?.length || 0;

    const completeness = (hasApify ? 40 : 0) + (hasDescription ? 30 : 0) + (hasHeroImage ? 20 : 0) + Math.min(10, photosCount * 2);

    const enriched = {
      ...r,
      hasApify,
      hasDescription,
      hasHeroImage,
      photosCount,
      completeness
    };

    // If no apify output and very low completeness, mark for deletion
    if (!hasApify && completeness < 30) {
      toDelete.push(enriched);
    } else {
      toKeep.push(enriched);
    }
  }

  // Display results
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 ANALYSIS RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (toKeep.length > 0) {
    console.log(`✅ KEEP (${toKeep.length} restaurants with some valid data):\n`);
    toKeep.forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.name}`);
      console.log(`   ID: ${r.id}`);
      console.log(`   Slug: ${r.slug}`);
      console.log(`   Place ID: ${r.google_place_id || 'NULL'}`);
      console.log(`   Status: ${r.status}`);
      console.log(`   Has Apify: ${r.hasApify ? 'YES' : 'NO'}`);
      console.log(`   Has Description: ${r.hasDescription ? 'YES' : 'NO'}`);
      console.log(`   Has Hero Image: ${r.hasHeroImage ? 'YES' : 'NO'}`);
      console.log(`   Photos: ${r.photosCount}`);
      console.log(`   Completeness: ${r.completeness}/100`);
      console.log(`   Created: ${new Date(r.created_at).toLocaleString()}\n`);
    });
    console.log('─'.repeat(100) + '\n');
  }

  if (toDelete.length > 0) {
    console.log(`❌ DELETE (${toDelete.length} restaurants with no useful data):\n`);
    toDelete.forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.name}`);
      console.log(`   ID: ${r.id}`);
      console.log(`   Slug: ${r.slug}`);
      console.log(`   Place ID: ${r.google_place_id || 'NULL'}`);
      console.log(`   Status: ${r.status}`);
      console.log(`   Has Apify: ${r.hasApify ? 'NO' : 'NO'}`);
      console.log(`   Has Description: ${r.hasDescription ? 'YES' : 'NO'}`);
      console.log(`   Has Hero Image: ${r.hasHeroImage ? 'YES' : 'NO'}`);
      console.log(`   Photos: ${r.photosCount}`);
      console.log(`   Completeness: ${r.completeness}/100`);
      console.log(`   Created: ${new Date(r.created_at).toLocaleString()}\n`);
    });
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Without Place ID: ${noPlaceId.length}`);
  console.log(`Keep (has some data): ${toKeep.length} ✅`);
  console.log(`Delete (no useful data): ${toDelete.length} ❌`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (toDelete.length > 0) {
    // Save deletion list
    const fs = require('fs');
    fs.writeFileSync(
      'bin/incomplete-to-delete.json',
      JSON.stringify({
        count: toDelete.length,
        restaurants: toDelete.map(r => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          google_place_id: r.google_place_id,
          status: r.status,
          completeness: r.completeness,
          created_at: r.created_at
        }))
      }, null, 2)
    );

    console.log('💾 Deletion list saved to: bin/incomplete-to-delete.json\n');
    console.log('💡 Next steps:');
    console.log('   1. Review the list above');
    console.log('   2. If you approve, I can create a deletion script');
    console.log('   3. Or you can delete manually from Supabase\n');
  } else {
    console.log('✅ No incomplete restaurants found to delete!\n');
  }
}

findIncompleteRestaurants().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
