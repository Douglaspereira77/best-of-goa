#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseMallExtraction() {
  console.log('🔍 Mall Extraction Diagnostic Report');
  console.log('='.repeat(60));

  // Get recent malls
  const { data: malls, error } = await supabase
    .from('malls')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching malls:', error);
    return;
  }

  for (const mall of malls) {
    console.log(`\n📍 ${mall.name}`);
    console.log('-'.repeat(60));
    console.log('Status:', mall.extraction_status);
    console.log('Slug:', mall.slug);

    // Check core content
    console.log('\n📝 Content Fields:');
    console.log('  description:', mall.description ? `✅ ${mall.description.substring(0, 100)}...` : '❌ Missing');
    console.log('  short_description:', mall.short_description ? `✅ ${mall.short_description.substring(0, 80)}...` : '❌ Missing');
    console.log('  meta_title:', mall.meta_title ? '✅' : '❌');
    console.log('  meta_description:', mall.meta_description ? '✅' : '❌');

    // Check location
    console.log('\n📍 Location Fields:');
    console.log('  address:', mall.address || '❌ Missing');
    console.log('  area:', mall.area || '❌ Missing');
    console.log('  coordinates:', mall.latitude && mall.longitude ? `✅ (${mall.latitude}, ${mall.longitude})` : '❌ Missing');

    // Check contact
    console.log('\n📞 Contact Fields:');
    console.log('  phone:', mall.phone || '❌ Missing');
    console.log('  website:', mall.website || '❌ Missing');
    console.log('  email:', mall.email || '❌ Missing');

    // Check features
    console.log('\n🏪 Features:');
    console.log('  opening_hours:', mall.opening_hours ? '✅' : '❌ Missing');
    console.log('  amenities:', Array.isArray(mall.amenities) && mall.amenities.length > 0 ? `✅ (${mall.amenities.length} items)` : '❌ Missing');
    console.log('  stores:', Array.isArray(mall.stores) && mall.stores.length > 0 ? `✅ (${mall.stores.length} stores)` : '❌ Missing');
    console.log('  total_stores:', mall.total_stores || '❌ Missing');

    // Check raw data
    console.log('\n📦 Raw Data:');
    const hasApify = mall.raw_apify_data && Object.keys(mall.raw_apify_data).length > 0;
    const hasFirecrawl = mall.raw_firecrawl_data && Object.keys(mall.raw_firecrawl_data).length > 0;
    console.log('  raw_apify_data:', hasApify ? `✅ (${Object.keys(mall.raw_apify_data).length} fields)` : '❌ Missing');
    console.log('  raw_firecrawl_data:', hasFirecrawl ? `✅ (${Object.keys(mall.raw_firecrawl_data).length} fields)` : '❌ Missing');

    if (hasApify) {
      const apifyKeys = Object.keys(mall.raw_apify_data);
      console.log('  Apify fields:', apifyKeys.slice(0, 15).join(', '));

      // Check what data is available but not mapped
      const apify = mall.raw_apify_data;
      console.log('\n  📊 Apify Data Available:');
      if (apify.address) console.log('    address:', apify.address);
      if (apify.phone) console.log('    phone:', apify.phone);
      if (apify.website) console.log('    website:', apify.website);
      if (apify.openingHours) console.log('    openingHours:', JSON.stringify(apify.openingHours).substring(0, 100));
      if (apify.imageUrls) console.log('    imageUrls:', `${apify.imageUrls.length} URLs`);
    }

    // Check images
    const { data: images } = await supabase
      .from('mall_images')
      .select('id, url, is_hero, approved')
      .eq('mall_id', mall.id);

    console.log('\n🖼️ Images:');
    console.log('  Total in database:', images?.length || 0);
    const heroImage = images?.find(img => img.is_hero);
    console.log('  Hero image:', heroImage ? '✅' : '❌ Missing');
    console.log('  Approved images:', images?.filter(img => img.approved).length || 0);

    if (images && images.length > 0) {
      console.log('  Sample URLs:');
      images.slice(0, 3).forEach((img, i) => {
        console.log(`    ${i+1}. ${img.url.substring(0, 80)}...`);
      });
    }
  }
}

diagnoseMallExtraction().catch(console.error);
