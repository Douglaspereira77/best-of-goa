#!/usr/bin/env node
/**
 * Re-extract Images for Failed Malls
 *
 * Direct implementation using Google Places Photos API + OpenAI Vision API
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai').default;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

/**
 * Extract images for a single mall
 */
async function extractMallImages(mall) {
  console.log(`   Fetching photos from Google Places...`);

  // Fetch photos from Google Places
  const placeUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${mall.google_place_id}&fields=photos&key=${GOOGLE_PLACES_API_KEY}`;
  const placeResponse = await fetch(placeUrl);
  const placeData = await placeResponse.json();

  if (placeData.status !== 'OK') {
    throw new Error(`Google Places error: ${placeData.status}`);
  }

  const photos = placeData.result?.photos || [];
  console.log(`   Found ${photos.length} photos from Google Places`);

  if (photos.length === 0) {
    throw new Error('No photos available');
  }

  // Take up to 10 photos
  const photosToProcess = photos.slice(0, 10);
  const processedImages = [];

  console.log(`   Processing ${photosToProcess.length} images...`);

  for (let i = 0; i < photosToProcess.length; i++) {
    const photo = photosToProcess[i];
    const photoReference = photo.photo_reference;

    // Fetch the image
    const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Upload to Supabase Storage
    const filename = `${mall.slug}-image-${i + 1}.jpg`;
    const filePath = `${mall.slug}/images/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('malls')
      .upload(filePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error(`   ⚠️  Upload error for image ${i + 1}:`, uploadError.message);
      continue;
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/malls/${filePath}`;
    processedImages.push({
      url: publicUrl,
      alt_text: `${mall.name} - Image ${i + 1}`,
      is_hero: i === 0,
      display_order: i
    });
  }

  console.log(`   Uploaded ${processedImages.length} images to storage`);

  // Save to database
  const records = processedImages.map((img) => ({
    mall_id: mall.id,
    url: img.url,
    alt_text: img.alt_text,
    type: img.is_hero ? 'hero' : 'gallery',
    is_hero: img.is_hero,
    display_order: img.display_order,
    approved: true
  }));

  const { error: dbError } = await supabase
    .from('mall_images')
    .insert(records);

  if (dbError) {
    throw new Error(`Database insert error: ${dbError.message}`);
  }

  // Update mall hero_image
  const heroImage = processedImages.find(img => img.is_hero);
  if (heroImage) {
    await supabase
      .from('malls')
      .update({ hero_image: heroImage.url })
      .eq('id', mall.id);
  }

  return processedImages.length;
}

async function reExtractFailedMallImages() {
  console.log('🔄 Re-extract Images for Failed Malls');
  console.log('='.repeat(80));

  // Get malls with failed extraction status
  const { data: failedMalls, error } = await supabase
    .from('malls')
    .select('id, name, slug, google_place_id')
    .eq('extraction_status', 'failed')
    .order('name');

  if (error) {
    console.error('Error fetching failed malls:', error);
    return;
  }

  if (!failedMalls || failedMalls.length === 0) {
    console.log('✅ No failed malls found!');
    return;
  }

  console.log(`Found ${failedMalls.length} malls with failed extractions:\n`);
  failedMalls.forEach((mall, i) => {
    console.log(`${i + 1}. ${mall.name} (${mall.slug})`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('Starting image extraction...\n');

  let successful = 0;
  let failed = 0;

  for (const mall of failedMalls) {
    console.log(`\n🏬 Processing: ${mall.name}`);
    console.log('-'.repeat(80));

    try {
      // Update status to processing
      await supabase
        .from('malls')
        .update({
          extraction_status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', mall.id);

      console.log(`   Status: Extracting images...`);

      // Run image extraction
      const imageCount = await extractMallImages(mall);

      if (imageCount > 0) {
        // Update status to completed
        await supabase
          .from('malls')
          .update({
            extraction_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', mall.id);

        console.log(`   ✅ Success: Extracted ${imageCount} images`);
        successful++;
      } else {
        console.log(`   ⚠️  Warning: 0 images extracted`);
        failed++;
      }

    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);

      // Update status back to failed with error
      await supabase
        .from('malls')
        .update({
          extraction_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', mall.id);

      failed++;
    }

    // Rate limit: wait 3 seconds between extractions
    if (mall !== failedMalls[failedMalls.length - 1]) {
      console.log('   ⏳ Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RE-EXTRACTION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total malls processed: ${failedMalls.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);

  if (successful === failedMalls.length) {
    console.log('\n🎉 All malls successfully extracted!');
  } else if (successful > 0) {
    console.log(`\n⚠️  ${failed} malls still need attention`);
  }
}

reExtractFailedMallImages().catch(console.error);