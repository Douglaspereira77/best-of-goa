const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkImagesSetup() {
  console.log('🔍 Checking Images Setup\n');

  // Check sample restaurants
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, hero_image, images, apify_output')
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('📊 Sample Restaurant Image Data:\n');
  for (const r of restaurants) {
    console.log(`\n${r.name}:`);
    console.log(`  hero_image: ${r.hero_image ? '✅ ' + r.hero_image.substring(0, 60) + '...' : '❌ NULL'}`);
    console.log(`  images array: ${r.images ? '✅ ' + JSON.stringify(r.images) : '❌ NULL or empty'}`);

    if (r.apify_output?.imageUrl) {
      console.log(`  apify_output.imageUrl: ✅ ${r.apify_output.imageUrl.substring(0, 60)}...`);
    }
    if (r.apify_output?.imagesCount) {
      console.log(`  apify_output.imagesCount: ${r.apify_output.imagesCount}`);
    }
  }

  console.log('\n\n💡 RECOMMENDATION:\n');
  console.log('Since restaurant_images table does NOT exist:');
  console.log('1. images[] array should store multiple image URLs directly');
  console.log('2. Can populate from apify_output image data');
  console.log('3. Structure: images = [url1, url2, url3, ...]');
  console.log('\nThis keeps it simple - no separate table needed unless you need');
  console.log('detailed metadata per image (captions, alt text, categories, etc.)');
}

checkImagesSetup().then(() => process.exit(0));
