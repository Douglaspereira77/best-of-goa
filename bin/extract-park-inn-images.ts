#!/usr/bin/env npx tsx

/**
 * Extract images for Park Inn hotel only
 * Tests the new smart fallback feature
 */

// Load env vars FIRST
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  console.log('=== PARK INN IMAGE EXTRACTION (WITH SMART FALLBACK) ===\n');

  // Dynamic imports AFTER env vars are loaded
  const { hotelImageExtractor } = await import('../src/lib/services/hotel-image-extractor');
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get Park Inn hotel ID
  const { data: hotel, error } = await supabase
    .from('hotels')
    .select('id, name, slug, google_place_id, hero_image')
    .ilike('name', '%park inn%')
    .single();

  if (error || !hotel) {
    console.error('Failed to find Park Inn hotel:', error);
    process.exit(1);
  }

  console.log('Hotel:', hotel.name);
  console.log('ID:', hotel.id);
  console.log('Slug:', hotel.slug);
  console.log('Google Place ID:', hotel.google_place_id);
  console.log('Current hero_image:', hotel.hero_image || 'NULL');
  console.log('\n--- Starting Image Extraction ---\n');

  try {
    await hotelImageExtractor.extractAndUploadHotelImages(hotel.id);

    console.log('\n--- Extraction Complete ---\n');

    // Verify results
    const { data: updatedHotel } = await supabase
      .from('hotels')
      .select('hero_image')
      .eq('id', hotel.id)
      .single();

    const { data: images } = await supabase
      .from('hotel_images')
      .select('url, type, is_hero, alt_text')
      .eq('hotel_id', hotel.id);

    console.log('=== RESULTS ===');
    console.log('Hero Image:', updatedHotel?.hero_image || 'NULL');
    console.log('Total Images Uploaded:', images?.length || 0);

    if (images && images.length > 0) {
      console.log('\nUploaded Images:');
      images.forEach((img: any, i: number) => {
        const heroMark = img.is_hero ? ' ⭐ HERO' : '';
        console.log(`${i + 1}. ${img.type}${heroMark}`);
        console.log(`   Alt: ${img.alt_text}`);
        console.log(`   URL: ${img.url.substring(0, 80)}...`);
      });
    }

  } catch (error) {
    console.error('Extraction failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
