require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHotelImages() {
  console.log('\n🔍 CHECKING HOTEL IMAGES\n');

  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('id, name, slug, hero_image, logo_image');

  if (error) {
    console.error('❌ Error fetching hotels:', error);
    return;
  }

  if (!hotels || hotels.length === 0) {
    console.log('❌ No hotels found in database');
    return;
  }

  console.log(`Found ${hotels.length} hotel(s)\n`);

  for (const hotel of hotels) {
    console.log(`🏨 ${hotel.name}`);
    console.log(`   Slug: ${hotel.slug}`);
    console.log(`   Hero Image: ${hotel.hero_image || 'NONE'}`);
    console.log(`   Logo Image: ${hotel.logo_image || 'NONE'}`)

    // Check hotel_images table
    const { data: hotelImages } = await supabase
      .from('hotel_images')
      .select('id, image_url, display_order, source')
      .eq('hotel_id', hotel.id)
      .order('display_order');

    console.log(`   hotel_images table: ${hotelImages?.length || 0} records`);

    if (hotelImages && hotelImages.length > 0) {
      hotelImages.slice(0, 3).forEach((img, i) => {
        console.log(`     ${i + 1}. [${img.source}] ${img.image_url.substring(0, 80)}...`);
      });
    }

    console.log('');
  }
}

checkHotelImages().catch(console.error);
