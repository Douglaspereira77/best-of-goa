#!/usr/bin/env npx tsx

/**
 * Extract images for Le Royal Hotel
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  console.log('=== LE ROYAL HOTEL IMAGE EXTRACTION ===\n');

  const { hotelImageExtractor } = await import('../src/lib/services/hotel-image-extractor');
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: hotel, error } = await supabase
    .from('hotels')
    .select('id, name, slug, google_place_id, hero_image')
    .ilike('name', '%le royal%')
    .single();

  if (error || !hotel) {
    console.error('Failed to find Le Royal Hotel:', error);
    process.exit(1);
  }

  console.log('Hotel:', hotel.name);
  console.log('ID:', hotel.id);
  console.log('Google Place ID:', hotel.google_place_id);
  console.log('Current hero_image:', hotel.hero_image ? 'EXISTS' : 'NULL');
  console.log('\n--- Starting Image Extraction ---\n');

  try {
    await hotelImageExtractor.extractAndUploadHotelImages(hotel.id);

    console.log('\n--- Extraction Complete ---\n');

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
    console.log('Hero Image:', updatedHotel?.hero_image ? 'SET' : 'NULL');
    console.log('Total Images Uploaded:', images?.length || 0);

    if (images && images.length > 0) {
      console.log('\nUploaded Images:');
      images.forEach((img: any, i: number) => {
        const heroMark = img.is_hero ? ' ⭐ HERO' : '';
        console.log(`${i + 1}. ${img.type}${heroMark}`);
        console.log(`   Alt: ${img.alt_text}`);
      });
    }

  } catch (error) {
    console.error('Extraction failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
