require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('\n🗃️  CHECKING HOTEL_IMAGES TABLE SCHEMA:\n');

  // Try inserting a test record to see what fails
  const { data, error } = await supabase
    .from('hotel_images')
    .insert({
      hotel_id: '00000000-0000-0000-0000-000000000000', // Fake ID
      url: 'https://example.com/test.jpg',
      alt_text: 'Test',
      title: 'Test',
      description: 'Test',
      type: 'gallery',
      source: 'test',
      display_order: 1,
      approved: true,
      is_hero: false
    })
    .select();

  if (error) {
    console.log('❌ INSERT ERROR:', error.message);
    console.log('Error code:', error.code);
    console.log('Error details:', error.details);
    console.log('Error hint:', error.hint);
    console.log('\n💡 This tells us which fields are missing or incorrect in the schema.');
  } else {
    console.log('✅ Test insert succeeded (unexpected!)');
    // Clean up
    if (data && data[0]) {
      await supabase.from('hotel_images').delete().eq('id', data[0].id);
    }
  }

  console.log('\n📋 Checking actual table structure via query...');

  // Query the table to see what columns exist (this will fail if table doesn't exist)
  const { error: queryError } = await supabase
    .from('hotel_images')
    .select('*')
    .limit(1);

  if (queryError) {
    console.log('❌ TABLE QUERY ERROR:', queryError.message);
    console.log('\n⚠️  The hotel_images table may not exist!');
  } else {
    console.log('✅ hotel_images table exists and is queryable');
  }
}

checkSchema().catch(console.error);
