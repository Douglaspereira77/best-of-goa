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

async function checkColumns() {
  console.log('Checking image tables for quality_score column...\n');

  const results = await Promise.all(
    tables.map(async (table) => {
      const { error } = await supabase.from(table).select('quality_score').limit(0);
      return { table, hasColumn: !error };
    })
  );

  results.forEach(r => {
    const status = r.hasColumn ? '✓ HAS quality_score' : '✗ MISSING quality_score';
    console.log(`${r.table.padEnd(25)} ${status}`);
  });
}

checkColumns();
