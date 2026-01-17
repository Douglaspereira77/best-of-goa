require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteTestHotel() {
  console.log('\n🗑️  DELETING TEST HOTEL DATA\n');

  // Find The Regency Hotel
  const { data: hotel, error: findError } = await supabase
    .from('hotels')
    .select('id, name, slug')
    .eq('slug', 'the-regency-hotel-salmiya')
    .single();

  if (findError || !hotel) {
    console.log('❌ Hotel not found or error:', findError?.message || 'Not found');
    return;
  }

  console.log(`Found hotel: ${hotel.name} (ID: ${hotel.id})`);
  console.log(`Slug: ${hotel.slug}\n`);

  const hotelId = hotel.id;

  // Delete from related tables first (foreign key constraints)
  console.log('Deleting related records...');

  // 1. hotel_images
  const { error: imagesError, count: imagesCount } = await supabase
    .from('hotel_images')
    .delete({ count: 'exact' })
    .eq('hotel_id', hotelId);
  console.log(`  ✅ hotel_images: ${imagesCount || 0} records deleted`);

  // 2. hotel_faqs
  const { error: faqsError, count: faqsCount } = await supabase
    .from('hotel_faqs')
    .delete({ count: 'exact' })
    .eq('hotel_id', hotelId);
  console.log(`  ✅ hotel_faqs: ${faqsCount || 0} records deleted`);

  // 3. hotel_rooms
  const { error: roomsError, count: roomsCount } = await supabase
    .from('hotel_rooms')
    .delete({ count: 'exact' })
    .eq('hotel_id', hotelId);
  console.log(`  ✅ hotel_rooms: ${roomsCount || 0} records deleted`);

  // 4. hotel_policies
  const { error: policiesError, count: policiesCount } = await supabase
    .from('hotel_policies')
    .delete({ count: 'exact' })
    .eq('hotel_id', hotelId);
  console.log(`  ✅ hotel_policies: ${policiesCount || 0} records deleted`);

  // 5. hotel_reviews (if exists)
  const { error: reviewsError, count: reviewsCount } = await supabase
    .from('hotel_reviews')
    .delete({ count: 'exact' })
    .eq('hotel_id', hotelId);
  console.log(`  ✅ hotel_reviews: ${reviewsCount || 0} records deleted`);

  // Finally delete the hotel itself
  console.log('\nDeleting main hotel record...');
  const { error: deleteError } = await supabase
    .from('hotels')
    .delete()
    .eq('id', hotelId);

  if (deleteError) {
    console.log(`❌ Error deleting hotel: ${deleteError.message}`);
  } else {
    console.log(`✅ Hotel deleted successfully\n`);
  }

  console.log('🎉 Cleanup complete! Ready for fresh extraction.\n');
}

deleteTestHotel().catch(console.error);
