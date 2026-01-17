#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: attraction } = await supabase
    .from('attractions')
    .select('apify_output')
    .ilike('name', '%goa towers%')
    .single();

  if (attraction?.apify_output?.openingHours) {
    console.log('Opening Hours Format:');
    console.log(JSON.stringify(attraction.apify_output.openingHours, null, 2));
    console.log('\nType:', typeof attraction.apify_output.openingHours);
    console.log('Is Array:', Array.isArray(attraction.apify_output.openingHours));
  }
}

check();
