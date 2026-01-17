#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSlug() {
  const { data: mall } = await supabase
    .from('malls')
    .select('name, slug, area')
    .ilike('name', '%avenues%')
    .single();

  if (mall) {
    console.log('Mall Name:', mall.name);
    console.log('Current Slug:', mall.slug);
    console.log('Area:', mall.area);
    console.log('\nCorrect URL:');
    console.log(`http://localhost:3000/places-to-shop/malls/${mall.slug}`);
  } else {
    console.log('Mall not found');
  }
}

checkSlug().catch(console.error);
