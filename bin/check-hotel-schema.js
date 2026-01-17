require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHotelSchema() {
  console.log('\n🔍 HOTEL DATABASE SCHEMA CHECK\n');

  const tables = [
    'hotels',
    'hotel_images',
    'hotel_categories',
    'hotel_amenities',
    'hotel_facilities',
    'hotel_room_types',
    'hotel_rooms',
    'hotel_faqs',
    'hotel_policies',
    'hotel_nearby_attractions'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ ${table}: TABLE DOES NOT EXIST`);
        } else {
          console.log(`⚠️  ${table}: ERROR - ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: EXISTS (${count || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: EXCEPTION - ${err.message}`);
    }
  }

  // Check hotels table columns
  console.log('\n📊 HOTELS TABLE COLUMNS:');
  const { data: hotelSample } = await supabase
    .from('hotels')
    .select('*')
    .limit(1);

  if (hotelSample && hotelSample[0]) {
    const columns = Object.keys(hotelSample[0]);
    console.log(`   Total columns: ${columns.length}`);
    console.log('\n   Hotel-specific columns:');
    const hotelSpecific = columns.filter(c =>
      c.includes('hotel') ||
      c.includes('star') ||
      c.includes('check') ||
      c.includes('room') ||
      c === 'bok_score'
    );
    hotelSpecific.forEach(col => console.log(`   - ${col}`));
  } else {
    console.log('   No hotel records to sample');
  }
}

checkHotelSchema().catch(console.error);
