require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStep12Data() {
  const { data: hotel } = await supabase
    .from('hotels')
    .select('*')
    .eq('name', 'The Regency Hotel')
    .single();

  console.log('\n📊 AI ENHANCEMENT OUTPUT:');
  console.log('   Description:', hotel.description ? hotel.description.substring(0, 100) + '...' : 'NONE');
  console.log('   Check-in Time:', hotel.check_in_time || 'NONE');
  console.log('   Check-out Time:', hotel.check_out_time || 'NONE');
  console.log('   Pets Allowed:', hotel.pets_allowed);
  console.log('   Smoking Policy:', hotel.smoking_policy || 'NONE');
  console.log('   Suggested Categories:', hotel.suggested_categories || 'NONE');
  console.log('   Suggested Amenities:', hotel.suggested_amenities || 'NONE');

  console.log('\n📊 FIRECRAWL ROOMS DATA:');
  const hasRoomsData = hotel.firecrawl_output && hotel.firecrawl_output.rooms;
  console.log('   Has rooms data:', hasRoomsData);

  if (hasRoomsData) {
    console.log('   Rooms:', JSON.stringify(hotel.firecrawl_output.rooms).substring(0, 300));
  }

  console.log('\n📊 APIFY OUTPUT:');
  console.log('   Has apify_output:', !!hotel.apify_output);
  console.log('   Reviews count:', hotel.apify_output?.reviews?.length || 0);
}

checkStep12Data().catch(console.error);
