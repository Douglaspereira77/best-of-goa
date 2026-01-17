#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWebsiteField() {
  const { data } = await supabase
    .from('hotels')
    .select('name, website, apify_output')
    .eq('id', '2bfe8042-457a-4f29-bb86-2bed501616c8')
    .single();

  console.log('Hotel:', data.name);
  console.log('\nWebsite field in database:', data.website);
  console.log('\nApify output has website?:', !!data.apify_output?.website);
  console.log('Apify website value:', data.apify_output?.website || 'NOT IN APIFY DATA');
  console.log('\nApify output has url?:', !!data.apify_output?.url);
  console.log('Apify url value:', data.apify_output?.url || 'NOT IN APIFY DATA');
}

checkWebsiteField();
