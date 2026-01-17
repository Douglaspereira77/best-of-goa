#!/usr/bin/env node
/**
 * Complete Mall Audit
 *
 * Identifies malls with:
 * - Failed extractions
 * - Missing images
 * - Incomplete data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditMalls() {
  console.log('🔍 Complete Mall Audit');
  console.log('='.repeat(80));

  const { data: malls } = await supabase
    .from('malls')
    .select('id, name, slug, extraction_status, description, hero_image, google_place_id')
    .order('name');

  const issues = {
    failedExtraction: [],
    missingImages: [],
    missingDescription: [],
    missingPlaceId: [],
    completelyBroken: []
  };

  for (const mall of malls) {
    const { count: imageCount } = await supabase
      .from('mall_images')
      .select('id', { count: 'exact', head: true })
      .eq('mall_id', mall.id);

    const hasImages = imageCount > 0;
    const hasDescription = !!mall.description;
    const hasPlaceId = !!mall.google_place_id;
    const extractionFailed = mall.extraction_status === 'failed';

    // Categorize issues
    if (extractionFailed) {
      issues.failedExtraction.push({ ...mall, imageCount });
    }

    if (!hasImages) {
      issues.missingImages.push({ ...mall, imageCount });
    }

    if (!hasDescription) {
      issues.missingDescription.push({ ...mall, imageCount });
    }

    if (!hasPlaceId) {
      issues.missingPlaceId.push({ ...mall, imageCount });
    }

    // Completely broken (multiple issues)
    if (!hasImages && !hasDescription) {
      issues.completelyBroken.push({ ...mall, imageCount });
    }
  }

  // Report
  console.log('\n❌ FAILED EXTRACTIONS:');
  console.log('-'.repeat(80));
  if (issues.failedExtraction.length === 0) {
    console.log('   ✅ No failed extractions');
  } else {
    issues.failedExtraction.forEach(m => {
      console.log(`   ${m.name.padEnd(50)} - Status: ${m.extraction_status}`);
    });
  }

  console.log('\n🖼️  MISSING IMAGES:');
  console.log('-'.repeat(80));
  if (issues.missingImages.length === 0) {
    console.log('   ✅ All malls have images');
  } else {
    issues.missingImages.forEach(m => {
      console.log(`   ${m.name.padEnd(50)} - 0 images | Place ID: ${m.google_place_id ? 'Yes' : 'No'}`);
    });
  }

  console.log('\n📝 MISSING DESCRIPTIONS:');
  console.log('-'.repeat(80));
  if (issues.missingDescription.length === 0) {
    console.log('   ✅ All malls have descriptions');
  } else {
    issues.missingDescription.forEach(m => {
      console.log(`   ${m.name.padEnd(50)} - Status: ${m.extraction_status}`);
    });
  }

  console.log('\n🆔 MISSING GOOGLE PLACE ID:');
  console.log('-'.repeat(80));
  if (issues.missingPlaceId.length === 0) {
    console.log('   ✅ All malls have Place IDs');
  } else {
    issues.missingPlaceId.forEach(m => {
      console.log(`   ${m.name.padEnd(50)} - Cannot extract without Place ID`);
    });
  }

  console.log('\n💔 COMPLETELY BROKEN (Multiple Issues):');
  console.log('-'.repeat(80));
  if (issues.completelyBroken.length === 0) {
    console.log('   ✅ No completely broken malls');
  } else {
    issues.completelyBroken.forEach(m => {
      console.log(`   ${m.name.padEnd(50)} - No images, no description`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY:');
  console.log('='.repeat(80));
  console.log(`Total malls: ${malls.length}`);
  console.log(`Failed extractions: ${issues.failedExtraction.length}`);
  console.log(`Missing images: ${issues.missingImages.length}`);
  console.log(`Missing descriptions: ${issues.missingDescription.length}`);
  console.log(`Missing Place IDs: ${issues.missingPlaceId.length}`);
  console.log(`Completely broken: ${issues.completelyBroken.length}`);
  console.log(`Fully complete: ${malls.length - issues.completelyBroken.length - issues.missingImages.length}`);

  // Action items
  console.log('\n' + '='.repeat(80));
  console.log('🔧 RECOMMENDED ACTIONS:');
  console.log('='.repeat(80));

  if (issues.missingPlaceId.length > 0) {
    console.log(`1. Search Google Places for ${issues.missingPlaceId.length} malls without Place IDs`);
  }
  if (issues.failedExtraction.length > 0) {
    console.log(`2. Re-run extraction for ${issues.failedExtraction.length} failed malls`);
  }
  if (issues.missingImages.length > 0 && issues.missingPlaceId.length === 0) {
    console.log(`3. Extract images for ${issues.missingImages.length} malls`);
  }
  if (issues.missingDescription.length > 0) {
    console.log(`4. Run AI enhancement for ${issues.missingDescription.length} malls`);
  }
}

auditMalls().catch(console.error);
