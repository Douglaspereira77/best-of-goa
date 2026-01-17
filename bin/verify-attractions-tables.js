#!/usr/bin/env node
/**
 * Verify Attractions Tables Exist
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTables() {
  console.log('Verifying Attractions Tables...\n');

  const tables = [
    { name: 'attractions', type: 'main' },
    { name: 'attraction_categories', type: 'reference' },
    { name: 'attraction_amenities', type: 'reference' },
    { name: 'attraction_features', type: 'reference' },
    { name: 'attraction_images', type: 'content' },
    { name: 'attraction_reviews', type: 'content' },
    { name: 'attraction_faqs', type: 'content' },
    { name: 'attraction_special_hours', type: 'content' }
  ];

  let allExist = true;

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table.name} (${table.type}): NOT FOUND`);
        allExist = false;
      } else {
        console.log(`✅ ${table.name} (${table.type}): ${count || 0} rows`);
      }
    } catch (err) {
      console.log(`❌ ${table.name} (${table.type}): ERROR - ${err.message}`);
      allExist = false;
    }
  }

  console.log('\n' + '='.repeat(50));

  if (allExist) {
    console.log('✅ All attraction tables exist!');
    console.log('You can now add attractions via the admin panel.');
  } else {
    console.log('❌ Some tables are missing.');
    console.log('\nTo create the tables:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Open: supabase/migrations/20251116_attractions_system.sql');
    console.log('3. Copy the entire SQL and run it');
  }

  console.log('='.repeat(50));
}

verifyTables();
