require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('Checking fitness tables...\n');

  // Test if fitness_places table exists
  const { data, error } = await supabase
    .from('fitness_places')
    .select('count')
    .limit(0);

  if (error) {
    console.log('❌ fitness_places table does not exist yet');
    console.log('\n📋 To apply migration:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents from: supabase/migrations/20251118_fitness_system.sql');
    console.log('   3. Run the SQL\n');
    process.exit(1);
  }

  console.log('✅ fitness_places table exists!');

  // Check categories
  const { data: cats } = await supabase
    .from('fitness_categories')
    .select('*');

  console.log(`✅ ${cats?.length || 0} fitness categories found`);

  // Check amenities
  const { data: amenities } = await supabase
    .from('fitness_amenities')
    .select('*');

  console.log(`✅ ${amenities?.length || 0} fitness amenities found`);

  // Check features
  const { data: features } = await supabase
    .from('fitness_features')
    .select('*');

  console.log(`✅ ${features?.length || 0} fitness features found\n`);
}

checkTables();
