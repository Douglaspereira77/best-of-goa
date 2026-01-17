#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: attractions } = await supabase.from('attractions').select('*').limit(1);

  if (!attractions || attractions.length === 0) {
    console.log('No attractions found');
    return;
  }

  const attraction = attractions[0];
  console.log('Attraction:', attraction.name);
  console.log('\n=== MATCHED IDs ===');
  console.log('Categories:', attraction.attraction_category_ids);
  console.log('Amenities:', attraction.attraction_amenity_ids);
  console.log('Features:', attraction.attraction_feature_ids);

  // Look up actual names
  if (attraction.attraction_category_ids && attraction.attraction_category_ids.length > 0) {
    const { data: cats } = await supabase
      .from('attraction_categories')
      .select('id, name')
      .in('id', attraction.attraction_category_ids);
    console.log('\nCategory Names:', cats.map(c => `${c.id}: ${c.name}`));
  }

  if (attraction.attraction_amenity_ids && attraction.attraction_amenity_ids.length > 0) {
    const { data: amens } = await supabase
      .from('attraction_amenities')
      .select('id, name')
      .in('id', attraction.attraction_amenity_ids);
    console.log('Amenity Names:', amens.map(a => `${a.id}: ${a.name}`));
  }

  if (attraction.attraction_feature_ids && attraction.attraction_feature_ids.length > 0) {
    const { data: feats } = await supabase
      .from('attraction_features')
      .select('id, name')
      .in('id', attraction.attraction_feature_ids);
    console.log('Feature Names:', feats.map(f => `${f.id}: ${f.name}`));
  }

  console.log('\n=== IMAGE FIELDS ===');
  console.log('hero_image:', attraction.hero_image || 'NOT SET');
  console.log('primary_image_url:', attraction.primary_image_url || 'NOT SET');

  // Check for 'primary_image_url' column existence
  console.log('\nAll image-related columns:');
  Object.keys(attraction).filter(k => k.includes('image')).forEach(k => {
    console.log(`  ${k}: ${attraction[k] || 'null'}`);
  });
}

check().catch(console.error);
