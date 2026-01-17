require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkApifyImageData() {
  const { data } = await supabase
    .from('hotels')
    .select('name, apify_output')
    .eq('slug', 'the-regency-hotel-salmiya')
    .single();

  if (data?.apify_output) {
    const output = data.apify_output;

    console.log('\n📊 Apify Output Analysis for:', data.name);
    console.log('   Has imageUrls field:', !!output.imageUrls);
    console.log('   Has photos field:', !!output.photos);
    console.log('   Has images field:', !!output.images);

    if (output.imageUrls) {
      console.log('   imageUrls count:', output.imageUrls.length);
      if (output.imageUrls.length > 0) {
        console.log('   First imageUrl:', output.imageUrls[0].substring(0, 100) + '...');
      }
    }

    if (output.photos) {
      console.log('   photos count:', output.photos.length);
      if (output.photos.length > 0) {
        console.log('   First photo:', JSON.stringify(output.photos[0]).substring(0, 150) + '...');
      }
    }

    if (output.images) {
      console.log('   images count:', output.images.length);
      if (output.images.length > 0) {
        console.log('   First image:', JSON.stringify(output.images[0]).substring(0, 150) + '...');
      }
    }

    // Show all top-level keys in apify_output
    console.log('\n   All top-level keys in apify_output:', Object.keys(output).join(', '));
  } else {
    console.log('No apify_output found');
  }
}

checkApifyImageData().catch(console.error);
