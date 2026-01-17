/**
 * Check if resort-hotels category exists
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkResortCategory() {
  console.log('🔍 Checking for resort hotel category...\n');

  const { data, error } = await supabase
    .from('hotel_categories')
    .select('*')
    .or('slug.eq.resorts,slug.eq.resort-hotels,slug.ilike.%resort%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} resort categories:`);
  data.forEach(cat => {
    console.log(`  - ${cat.name} (slug: ${cat.slug})`);
  });

  console.log('\n✅ Done!');
}

checkResortCategory().catch(console.error);
