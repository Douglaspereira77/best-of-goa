require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function publishAllRestaurants() {
  console.log('🍽️  Publishing All Restaurants\n');
  console.log('='.repeat(50));

  // First check current status
  const { data: unpublished, error: countError } = await supabase
    .from('restaurants')
    .select('id, name, status')
    .neq('status', 'published');

  if (countError) {
    console.error('Error checking restaurants:', countError);
    return;
  }

  console.log(`\nUnpublished restaurants found: ${unpublished?.length || 0}`);

  if (!unpublished || unpublished.length === 0) {
    console.log('\n✅ All restaurants are already published!');
    return;
  }

  // Show sample of what we're publishing
  console.log('\nSample of restaurants to publish:');
  unpublished.slice(0, 10).forEach(r => {
    console.log(`  - ${r.name} (current status: ${r.status})`);
  });
  if (unpublished.length > 10) {
    console.log(`  ... and ${unpublished.length - 10} more`);
  }

  // Publish all unpublished restaurants
  console.log('\n📤 Publishing...');

  const { data, error } = await supabase
    .from('restaurants')
    .update({ status: 'published' })
    .neq('status', 'published')
    .select('id');

  if (error) {
    console.error('\n❌ Error publishing:', error);
    return;
  }

  console.log(`\n✅ Successfully published ${data?.length || 0} restaurants!`);

  // Verify final count
  const { count } = await supabase
    .from('restaurants')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  console.log(`\n📊 Total published restaurants now: ${count}`);
  console.log('\n' + '='.repeat(50));
  console.log('Done!');
}

publishAllRestaurants().catch(console.error);
