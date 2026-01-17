#!/usr/bin/env node
/**
 * Sync Mall Storage Images to Database
 *
 * Reads images from Supabase Storage and inserts records into mall_images table
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncStorageToDatabase() {
  console.log('🔄 Sync Storage Images to Database');
  console.log('='.repeat(80));

  // Get all mall folders from storage
  const { data: folders } = await supabase.storage.from('malls').list('');

  let totalSynced = 0;
  let totalSkipped = 0;
  let errors = 0;

  for (const folder of folders) {
    const mallSlug = folder.name;

    // Get mall ID from slug
    const { data: mall } = await supabase
      .from('malls')
      .select('id, name')
      .eq('slug', mallSlug)
      .single();

    if (!mall) {
      console.log(`⚠️  ${mallSlug.padEnd(50)} - Mall not found in DB`);
      totalSkipped++;
      continue;
    }

    // Check if already synced
    const { count: existingCount } = await supabase
      .from('mall_images')
      .select('id', { count: 'exact', head: true })
      .eq('mall_id', mall.id);

    if (existingCount > 0) {
      console.log(`⏭️  ${mallSlug.padEnd(50)} - Already has ${existingCount} images`);
      totalSkipped++;
      continue;
    }

    // Get images from storage
    const { data: images } = await supabase
      .storage
      .from('malls')
      .list(`${mallSlug}/images`);

    const imageFiles = images?.filter(f =>
      f.name.endsWith('.jpg') ||
      f.name.endsWith('.jpeg') ||
      f.name.endsWith('.png') ||
      f.name.endsWith('.webp')
    ) || [];

    if (imageFiles.length === 0) {
      console.log(`⚪ ${mallSlug.padEnd(50)} - No images found`);
      totalSkipped++;
      continue;
    }

    // Create database records
    const baseUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/malls`;

    const records = imageFiles.map((file, index) => {
      const url = `${baseUrl}/${mallSlug}/images/${file.name}`;
      const altText = `${mall.name} - ${file.name.replace(/-/g, ' ').replace(/\.\w+$/, '')}`;

      // Detect hero image (first image or one with specific naming)
      const isHero = index === 0 || file.name.includes('-1.') || file.name.includes('hero');

      return {
        mall_id: mall.id,
        url: url,
        alt_text: altText,
        type: isHero ? 'hero' : 'gallery',
        is_hero: isHero,
        display_order: index,
        approved: true
      };
    });

    // Insert into database
    const { error } = await supabase
      .from('mall_images')
      .insert(records);

    if (error) {
      console.log(`❌ ${mallSlug.padEnd(50)} - Error: ${error.message}`);
      errors++;
    } else {
      console.log(`✅ ${mallSlug.padEnd(50)} - Synced ${imageFiles.length} images`);
      totalSynced += imageFiles.length;

      // Update mall hero_image field with first image
      const heroImage = records.find(r => r.is_hero);
      if (heroImage) {
        await supabase
          .from('malls')
          .update({ hero_image: heroImage.url })
          .eq('id', mall.id);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SYNC SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total malls processed: ${folders.length}`);
  console.log(`Images synced: ${totalSynced}`);
  console.log(`Malls skipped: ${totalSkipped}`);
  console.log(`Errors: ${errors}`);
}

syncStorageToDatabase().catch(console.error);