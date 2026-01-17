#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tables = [
  'restaurant_images',
  'hotel_images',
  'mall_images',
  'fitness_images',
  'school_images',
  'attraction_images'
];

async function checkTables() {
  console.log('Checking which image tables exist...\n');

  const results = await Promise.all(
    tables.map(async (table) => {
      const { error } = await supabase.from(table).select('id').limit(0);
      return {
        table,
        exists: !error || error.code === 'PGRST204', // Table exists but column might not
        errorCode: error?.code
      };
    })
  );

  console.log('Table Status:');
  results.forEach(r => {
    const status = r.exists ? '✓ EXISTS' : '✗ DOES NOT EXIST';
    console.log(`${r.table.padEnd(25)} ${status}`);
  });

  console.log('\nTables to add quality_score to:');
  const existingTables = results.filter(r => r.exists).map(r => r.table);
  existingTables.forEach(t => console.log(`  - ${t}`));
}

checkTables();
