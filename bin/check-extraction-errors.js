require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkErrors() {
  const { data: hotel } = await supabase
    .from('hotels')
    .select('extraction_progress, apify_output, firecrawl_output')
    .ilike('name', '%hilton%garden%')
    .single();

  console.log('\n🔍 EXTRACTION PROGRESS DETAILS:\n');

  if (hotel.extraction_progress?.steps) {
    hotel.extraction_progress.steps.forEach(step => {
      const icon = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⏳';
      console.log(`${icon} Step ${step.step}: ${step.name}`);
      console.log(`   Status: ${step.status}`);
      if (step.error) {
        console.log(`   ❌ ERROR: ${step.error}`);
      }
      if (step.timestamp) {
        console.log(`   Time: ${step.timestamp}`);
      }
      console.log('');
    });
  }

  console.log('\n📊 RAW DATA CHECK:');
  console.log('   Apify Output:', hotel.apify_output ? '✅ Present' : '❌ Missing');
  console.log('   Firecrawl Output:', hotel.firecrawl_output ? '✅ Present' : '❌ Missing');

  if (hotel.firecrawl_output?.rooms) {
    console.log('\n🛏️  FIRECRAWL ROOMS DATA:');
    console.log(JSON.stringify(hotel.firecrawl_output.rooms, null, 2).substring(0, 500));
  } else {
    console.log('\n⚠️  No rooms data in firecrawl_output');
  }

  if (hotel.apify_output?.photos) {
    console.log(`\n📸 APIFY PHOTOS: ${hotel.apify_output.photos.length} photos found`);
  } else if (hotel.apify_output?.imageUrls) {
    console.log(`\n📸 APIFY IMAGES: ${hotel.apify_output.imageUrls.length} images found`);
  } else {
    console.log('\n⚠️  No image data in apify_output');
  }
}

checkErrors().catch(console.error);
