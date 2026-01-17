import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPhotosTable() {
  console.log('Checking for attraction photos table...\n');

  // Try different possible table names
  const possibleTables = [
    'attraction_photos',
    'attraction_images',
    'attractions_photos',
    'photos'
  ];

  for (const tableName of possibleTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
    } else {
      console.log(`✅ ${tableName}: EXISTS!`);
      if (data && data.length > 0) {
        console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
        console.log(`   Sample data:`, JSON.stringify(data[0], null, 2));
      }
      console.log('');
    }
  }

  // Check if sample attraction has photos
  console.log('\nChecking photo fields in sample attraction:');
  const { data: sample } = await supabase
    .from('attractions')
    .select('id, name, hero_image')
    .not('hero_image', 'is', null)
    .limit(1)
    .single();

  if (sample) {
    console.log(`\nSample with hero_image: ${sample.name}`);
    console.log(`Hero Image URL: ${sample.hero_image}`);
  }
}

checkPhotosTable().catch(console.error);
