const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHotels() {
  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('id, name, star_rating, published, active')
    .order('star_rating', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== HOTEL STAR RATINGS & PUBLICATION STATUS ===\n');
  console.log('Total hotels:', hotels.length);

  const byRating = {};
  const published = hotels.filter(h => h.published);
  const unpublished = hotels.filter(h => !h.published);
  const luxuryHotels = hotels.filter(h => h.star_rating >= 4);
  const publishedLuxury = luxuryHotels.filter(h => h.published);

  hotels.forEach(h => {
    const rating = h.star_rating ?? 'null';
    byRating[rating] = (byRating[rating] || 0) + 1;
  });

  console.log('Published:', published.length);
  console.log('Unpublished:', unpublished.length);
  console.log('\n--- Star Rating Distribution ---');
  Object.keys(byRating).sort((a, b) => b - a).forEach(rating => {
    console.log(`  ${rating} stars: ${byRating[rating]}`);
  });

  console.log('\n--- Luxury Hotels (4+ stars) ---');
  console.log('Total luxury hotels:', luxuryHotels.length);
  console.log('Published luxury:', publishedLuxury.length);

  if (luxuryHotels.length > 0) {
    console.log('\nLuxury hotels list:');
    luxuryHotels.forEach(h => {
      const status = h.published ? '✅ Published' : '❌ Unpublished';
      console.log(`  - ${h.name} (${h.star_rating}⭐) ${status}`);
    });
  }
}

checkHotels();
