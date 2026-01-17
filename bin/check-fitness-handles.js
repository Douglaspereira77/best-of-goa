#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Instagram handles from 404 report
  const handles = [
    'gorillas_kw',
    'thechampion.men',
    'omega.gym.ku',
    'omega.gym.kw',
    'mpd_gym',
    'titanium.shark',
    'stretch_fc',
    'ufcgymgoa',
    'keepfit.kw'
  ];

  console.log('Checking fitness places for Instagram handles from 404 report:\n');

  for (const handle of handles) {
    const { data, error } = await supabase
      .from('fitness_places')
      .select('id, name, slug, instagram')
      .or(`instagram.ilike.%${handle}%,slug.ilike.%${handle}%`)
      .limit(1);

    if (data && data.length > 0) {
      console.log(`Handle @${handle}:`);
      console.log(`  Found: ${data[0].name}`);
      console.log(`  Slug: ${data[0].slug}`);
      console.log(`  Instagram: ${data[0].instagram}`);
      console.log();
    } else {
      console.log(`Handle @${handle}: NOT FOUND in database`);
      console.log();
    }
  }
}

main().catch(console.error);
