#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectRawData() {
  console.log('Fetching The Avenues raw data...\n');

  const { data: mall, error } = await supabase
    .from('malls')
    .select('id, name, apify_output, firecrawl_output, address, area, phone, website, instagram, facebook, twitter, google_review_count, hero_image, total_stores, total_parking_spaces, gross_leasable_area_sqm')
    .eq('slug', 'the-avenues-mall')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== APIFY OUTPUT RAW DATA ===');
  const apify = mall.apify_output || {};
  console.log('\n--- KEY FIELDS FROM APIFY ---');
  console.log('address:', apify.address);
  console.log('street:', apify.street);
  console.log('city:', apify.city);
  console.log('neighborhood:', apify.neighborhood);
  console.log('title:', apify.title);
  console.log('phone:', apify.phone);
  console.log('website:', apify.website);
  console.log('imageUrl:', apify.imageUrl);
  console.log('imagesCount:', apify.imagesCount);
  console.log('reviewsCount:', apify.reviewsCount);
  console.log('rating:', apify.rating);
  console.log('totalScore:', apify.totalScore);
  console.log('location:', apify.location);
  console.log('openingHours:', apify.openingHours);
  console.log('categories:', apify.categories);
  console.log('url:', apify.url);

  console.log('\n--- COMPARISON ---');
  console.log('TABLE address:', mall.address, '| APIFY address:', apify.address);
  console.log('TABLE area:', mall.area, '| APIFY neighborhood:', apify.neighborhood, 'city:', apify.city);
  console.log('TABLE phone:', mall.phone, '| APIFY phone:', apify.phone);
  console.log('TABLE website:', mall.website, '| APIFY url:', apify.url);
  console.log('TABLE hero_image:', mall.hero_image, '| APIFY imageUrl:', apify.imageUrl);
  console.log('TABLE google_review_count:', mall.google_review_count, '| APIFY reviewsCount:', apify.reviewsCount);

  console.log('\n=== FIRECRAWL OUTPUT RAW DATA ===');
  const firecrawl = mall.firecrawl_output || {};
  console.log('Keys:', Object.keys(firecrawl));

  // Check general results
  if (firecrawl.general) {
    console.log('\n--- GENERAL SEARCH RESULTS ---');
    console.log('Count:', firecrawl.general.length);
    if (firecrawl.general.length > 0) {
      console.log('First result:', JSON.stringify(firecrawl.general[0], null, 2).substring(0, 500));
    }
  }

  // Check stores results
  if (firecrawl.stores) {
    console.log('\n--- STORES SEARCH RESULTS ---');
    console.log('Count:', firecrawl.stores.length);
  }

  // Check social media results
  if (firecrawl.social_media_search) {
    console.log('\n--- SOCIAL MEDIA SEARCH ---');
    console.log(JSON.stringify(firecrawl.social_media_search, null, 2));
  }

  console.log('\n=== UNMAPPED DATA ANALYSIS ===');

  const unmapped = [];

  // Check for data in apify that should be mapped
  if (apify.address && !mall.address) {
    unmapped.push(`ADDRESS: "${apify.address}" available but table has NULL`);
  }
  if (apify.neighborhood && mall.area === 'Goa') {
    unmapped.push(`AREA: "${apify.neighborhood}" available but table shows generic "Goa"`);
  }
  if (apify.reviewsCount && mall.google_review_count === 0) {
    unmapped.push(`REVIEW COUNT: ${apify.reviewsCount} reviews but table shows 0`);
  }
  if (apify.imageUrl && !mall.hero_image?.includes(apify.imageUrl)) {
    unmapped.push(`HERO IMAGE: Google Places image available but not mapped`);
  }
  if (!apify.phone && mall.phone) {
    unmapped.push(`PHONE: Table has "${mall.phone}" but Apify has no phone (where did it come from?)`);
  }

  if (unmapped.length > 0) {
    console.log('UNMAPPED DATA FOUND:');
    unmapped.forEach(item => console.log('  -', item));
  } else {
    console.log('All data appears to be mapped correctly.');
  }

  console.log('\n=== FULL APIFY OUTPUT ===');
  console.log(JSON.stringify(apify, null, 2));
}

inspectRawData().catch(console.error);
