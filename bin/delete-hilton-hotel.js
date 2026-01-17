require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteHilton() {
  console.log('\n🗑️  DELETING HILTON GARDEN INN DATA\n');

  // Find the hotel
  const { data: hotel, error: findError } = await supabase
    .from('hotels')
    .select('id, name, slug')
    .ilike('name', '%hilton%garden%')
    .single();

  if (findError || !hotel) {
    console.log('❌ Hotel not found or error:', findError?.message || 'Not found');
    return;
  }

  console.log(`Found hotel: ${hotel.name} (ID: ${hotel.id})`);
  console.log(`Slug: ${hotel.slug}\n`);

  const hotelId = hotel.id;

  // Delete from related tables first
  console.log('Deleting related records...');

  const { error: imagesError, count: imagesCount } = await supabase
    .from('hotel_images')
    .delete({ count: 'exact' })
    .eq('hotel_id', hotelId);
  console.log(`  ✅ hotel_images: ${imagesCount || 0} records deleted`);

  const { error: faqsError, count: faqsCount } = await supabase
    .from('hotel_faqs')
    .delete({ count: 'exact' })
    .eq('hotel_id', hotelId);
  console.log(`  ✅ hotel_faqs: ${faqsCount || 0} records deleted`);

  const { error: roomsError, count: roomsCount } = await supabase
    .from('hotel_rooms')
    .delete({ count: 'exact' })
    .eq('hotel_id', hotelId);
  console.log(`  ✅ hotel_rooms: ${roomsCount || 0} records deleted`);

  const { error: policiesError, count: policiesCount } = await supabase
    .from('hotel_policies')
    .delete({ count: 'exact' })
    .eq('hotel_id', hotelId);
  console.log(`  ✅ hotel_policies: ${policiesCount || 0} records deleted`);

  const { error: reviewsError, count: reviewsCount } = await supabase
    .from('hotel_reviews')
    .delete({ count: 'exact' })
    .eq('hotel_id', hotelId);
  console.log(`  ✅ hotel_reviews: ${reviewsCount || 0} records deleted`);

  // Delete the hotel itself
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

deleteHilton().catch(console.error);
