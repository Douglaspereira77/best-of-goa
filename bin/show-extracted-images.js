const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function showExtractedImages(restaurantId) {
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('photos, name, slug')
    .eq('id', restaurantId)
    .single();

  if (error || !restaurant) {
    console.error('❌ Restaurant not found:', error?.message);
    return;
  }

  const photos = restaurant.photos || [];

  console.log('📸 IMAGES SELECTED AND STORED IN DATABASE\n');
  console.log(`Restaurant: ${restaurant.name}`);
  console.log(`Slug: ${restaurant.slug}`);
  console.log('─'.repeat(70));
  console.log(`\nTotal Images: ${photos.length}\n`);

  if (photos.length === 0) {
    console.log('⚠️  No images stored in database');
    return;
  }

  photos.forEach((photo, i) => {
    console.log(`${i + 1}. ${photo.filename || 'Image ' + (i + 1)}`);
    console.log(`   Resolution: ${photo.resolution || 'N/A'}`);
    console.log(`   Quality Score: ${photo.quality_score || 'N/A'}`);
    console.log(`   Source: ${photo.source_authority || 'N/A'}`);
    console.log(`   Primary: ${photo.primary ? 'Yes ⭐' : 'No'}`);
    if (photo.alt) {
      console.log(`   Alt: ${photo.alt.substring(0, 70)}...`);
    }
    if (photo.title) {
      console.log(`   Title: ${photo.title}`);
    }
    console.log(`   URL: ${photo.url}`);
    console.log('');
  });

  // Also print just the URLs for easy copying
  console.log('─'.repeat(70));
  console.log('🔗 DIRECT IMAGE LINKS (for easy copying):');
  console.log('─'.repeat(70));
  photos.forEach((photo, i) => {
    console.log(`${photo.url}`);
  });

  // Summary
  console.log('─'.repeat(70));
  console.log('📊 SUMMARY:');
  console.log(`   Primary photo: ${photos.find(p => p.primary) ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Average quality score: ${Math.round(photos.reduce((sum, p) => sum + (p.quality_score || 0), 0) / photos.length)}`);
  console.log(`   High-res photos (≥1200×900): ${photos.filter(p => {
    const res = p.resolution || '';
    const match = res.match(/(\d+)×(\d+)/);
    if (!match) return false;
    return parseInt(match[1]) >= 1200 && parseInt(match[2]) >= 900;
  }).length}/${photos.length}`);
}

const restaurantId = process.argv[2] || '57bd4c3b-6d21-4c1b-89a2-d73c3f7abfa9';

showExtractedImages(restaurantId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
