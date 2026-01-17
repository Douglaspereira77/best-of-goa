require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDuplicates() {
  console.log('\n🔍 CHECKING FOR DUPLICATE HILTON HOTELS:\n');

  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('id, name, slug, extraction_status, created_at')
    .ilike('name', '%hilton%garden%')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`Found ${hotels.length} hotel(s) matching "Hilton Garden Inn":\n`);

  hotels.forEach((hotel, idx) => {
    console.log(`${idx + 1}. ${hotel.name}`);
    console.log(`   ID: ${hotel.id}`);
    console.log(`   Slug: ${hotel.slug}`);
    console.log(`   Status: ${hotel.extraction_status}`);
    console.log(`   Created: ${new Date(hotel.created_at).toLocaleString()}`);
    console.log('');
  });

  if (hotels.length > 1) {
    console.log('⚠️  DUPLICATES DETECTED!\n');
    console.log('💡 The system is creating new hotels instead of checking for existing ones.\n');
    console.log('Solution: Add duplicate check in the "Add Hotel" flow before extraction.\n');
  } else if (hotels.length === 1) {
    console.log('✅ No duplicates - only one Hilton Garden Inn found.\n');
  } else {
    console.log('❌ No Hilton Garden Inn hotels found in database.\n');
  }
}

checkDuplicates().catch(console.error);
