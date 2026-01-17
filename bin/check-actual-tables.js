#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('Checking actual table existence...\n');

  // Try to select a specific column that would only exist if migration ran
  const { data, error } = await supabase
    .from('attractions')
    .select('attraction_type')
    .limit(1);

  if (error) {
    console.log('❌ attractions table does NOT exist or is missing columns');
    console.log('Error:', error.message);
    console.log('\n📋 NEXT STEP:');
    console.log('Run the migration SQL in Supabase Dashboard:');
    console.log('1. Go to: Supabase Dashboard → SQL Editor');
    console.log('2. Open: supabase/migrations/20251116_attractions_system.sql');
    console.log('3. Copy & paste the entire SQL');
    console.log('4. Click "Run"');
  } else {
    console.log('✅ attractions table EXISTS with correct schema');
    console.log('Data:', data);
  }
}

check();
