#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;

async function fix() {
  console.log('=== FIXING GOA TOWERS EXTRACTION ===\n');

  const { data: attraction } = await supabase.from('attractions').select('*').limit(1).single();

  console.log('Attraction:', attraction.name);
  console.log('ID:', attraction.id);

  // 1. Clear invalid social media URLs
  console.log('\n1. Clearing invalid social media URLs...');
  const cleanedYoutube = attraction.youtube?.replace(/[)\]}>]+$/, '') || null;

  const { error: updateError } = await supabase
    .from('attractions')
    .update({
      instagram: null, // Was "https://instagram.com/p" - invalid
      tiktok: null, // Was discover page, not profile
      linkedin: null, // Was wrong business (Copthorne)
      youtube: cleanedYoutube // Clean trailing )
    })
    .eq('id', attraction.id);

  if (updateError) {
    console.log('âŒ Failed to clear URLs:', updateError.message);
  } else {
    console.log('âœ… Cleared Instagram (invalid URL)');
    console.log('âœ… Cleared TikTok (discover page, not profile)');
    console.log('âœ… Cleared LinkedIn (wrong business)');
    if (cleanedYoutube) {
      console.log('âœ… Cleaned YouTube URL:', cleanedYoutube);
    }
  }

  // 2. Extract and upload images
  console.log('\n2. Extracting and uploading images from Google Places...');

  // Fetch photos from Google Places
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${attraction.google_place_id}&fields=photos&key=${googlePlacesApiKey}`;
  const detailsResponse = await axios.get(detailsUrl);

  if (detailsResponse.data.status !== 'OK') {
    console.log('âŒ Google Places API error:', detailsResponse.data.status);
    return;
  }

  const photos = detailsResponse.data.result?.photos || [];
  console.log(`Found ${photos.length} photos`);

  const maxImages = 10;
  const processedImages = [];

  for (let i = 0; i < Math.min(photos.length, maxImages); i++) {
    const photo = photos[i];
    console.log(`Processing image ${i + 1}/${Math.min(photos.length, maxImages)}...`);

    try {
      // Download image
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1600&photo_reference=${photo.photo_reference}&key=${googlePlacesApiKey}`;
      const imageResponse = await axios.get(photoUrl, { responseType: 'arraybuffer', timeout: 30000 });
      const imageBuffer = Buffer.from(imageResponse.data);

      // Generate filename
      const baseSlug = attraction.slug || attraction.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const filename = `${baseSlug}-${i + 1}-${Date.now()}.jpg`;
      const path = `attractions/${attraction.id}/${filename}`;

      // Upload to Supabase
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('place-images')
        .upload(path, imageBuffer, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) {
        console.log(`  âŒ Upload failed: ${uploadError.message}`);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('place-images').getPublicUrl(path);

      // Determine image type
      const imageType = i === 0 ? 'exterior' : i === 1 ? 'interior' : i === 2 ? 'view' : 'other';

      processedImages.push({
        attraction_id: attraction.id,
        url: urlData.publicUrl,
        alt_text: `${attraction.name} - Image ${i + 1}`,
        type: imageType,
        width: photo.width || 1600,
        height: photo.height || 1200,
        is_hero: i === 0,
        display_order: i + 1,
        approved: true,
        source: 'google_places',
        metadata: { filename, path }
      });

      console.log(`  âœ… Uploaded: ${imageType}`);
    } catch (err) {
      console.log(`  âŒ Failed: ${err.message}`);
    }
  }

  // Store images in database
  if (processedImages.length > 0) {
    const { error: insertError } = await supabase.from('attraction_images').insert(processedImages);

    if (insertError) {
      console.log('âŒ Database insert failed:', insertError.message);
    } else {
      console.log(`âœ… Stored ${processedImages.length} images in database`);
    }

    // Set hero image
    if (processedImages[0]) {
      await supabase
        .from('attractions')
        .update({ hero_image: processedImages[0].url })
        .eq('id', attraction.id);
      console.log('âœ… Set hero image');
    }
  }

  // 3. Verify results
  console.log('\n3. Verifying results...');
  const { data: updated } = await supabase.from('attractions')
    .select('instagram, tiktok, linkedin, youtube, hero_image')
    .eq('id', attraction.id)
    .single();

  const { data: images } = await supabase.from('attraction_images')
    .select('*')
    .eq('attraction_id', attraction.id);

  console.log('\nSocial Media URLs:');
  console.log('  Instagram:', updated.instagram || 'âœ… Cleared (was invalid)');
  console.log('  TikTok:', updated.tiktok || 'âœ… Cleared (was discover page)');
  console.log('  LinkedIn:', updated.linkedin || 'âœ… Cleared (was wrong business)');
  console.log('  YouTube:', updated.youtube || '(none)');

  console.log('\nImages:');
  console.log('  Total images in DB:', images?.length || 0);
  console.log('  Hero image:', updated.hero_image ? 'âœ… Set' : 'âŒ Not set');

  if (images && images.length > 0) {
    console.log('\n  First 3 images:');
    images.slice(0, 3).forEach((img, i) => {
      console.log(`    ${i + 1}. [${img.type}] ${img.url?.substring(0, 70)}...`);
    });
  }

  console.log('\n=== FIX COMPLETE ===');
}

fix().catch(console.error);
