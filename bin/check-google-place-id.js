require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkField() {
  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name, google_place_id, apify_output')
    .ilike('name', '%hilton%garden%')
    .single();

  console.log('\n📍 GOOGLE PLACE ID CHECK:\n');
  console.log(`Hotel: ${hotel.name}`);
  console.log(`google_place_id field: ${hotel.google_place_id || '❌ NULL/MISSING'}`);

  if (hotel.apify_output?.placeId) {
    console.log(`\n✅ Found in apify_output.placeId: ${hotel.apify_output.placeId}`);
    console.log('\n💡 SOLUTION: google_place_id field needs to be populated from apify_output.placeId');
  } else if (hotel.apify_output?.place_id) {
    console.log(`\n✅ Found in apify_output.place_id: ${hotel.apify_output.place_id}`);
    console.log('\n💡 SOLUTION: google_place_id field needs to be populated from apify_output.place_id');
  } else {
    console.log('\n❌ No Place ID found in apify_output either');
    console.log('\nApify output keys:', Object.keys(hotel.apify_output || {}));
  }
}

checkField().catch(console.error);
