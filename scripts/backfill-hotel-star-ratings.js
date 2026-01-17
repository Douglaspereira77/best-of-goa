const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backfillStarRatings() {
  console.log('=== Backfilling Hotel Star Ratings from Apify Data ===\n');

  // Get all hotels with apify_output
  const { data: hotels, error } = await supabase
    .from('hotels')
    .select('id, name, star_rating, apify_output')
    .not('apify_output', 'is', null);

  if (error) {
    console.error('Error fetching hotels:', error);
    return;
  }

  console.log(`Found ${hotels.length} hotels with Apify data\n`);

  let updated = 0;
  let skipped = 0;
  let noData = 0;

  for (const hotel of hotels) {
    const hotelStars = hotel.apify_output?.hotelStars;

    if (!hotelStars) {
      console.log(`⚪ ${hotel.name} - no hotelStars in Apify data`);
      noData++;
      continue;
    }

    // Parse "5-star hotel" or "3-star hotel" etc.
    const match = hotelStars.match(/(\d+)-star/i);

    if (!match) {
      console.log(`⚪ ${hotel.name} - couldn't parse: "${hotelStars}"`);
      noData++;
      continue;
    }

    const starRating = parseInt(match[1], 10);

    // Skip if already set to same value
    if (hotel.star_rating === starRating) {
      skipped++;
      continue;
    }

    // Update the hotel
    const { error: updateError } = await supabase
      .from('hotels')
      .update({ star_rating: starRating })
      .eq('id', hotel.id);

    if (updateError) {
      console.error(`❌ ${hotel.name} - update failed:`, updateError.message);
    } else {
      console.log(`✅ ${hotel.name} - set to ${starRating} stars`);
      updated++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already set): ${skipped}`);
  console.log(`No star data: ${noData}`);
}

backfillStarRatings();
