/**
 * Diagnostic script to check hotel star_rating field values
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  console.log('=== HOTEL STAR_RATING DIAGNOSTIC ===\n');

  // Check total published hotels
  const { count: totalPublished } = await supabase
    .from('hotels')
    .select('*', { count: 'exact', head: true })
    .eq('published', true);

  console.log('Total published hotels:', totalPublished);

  // Get sample hotels with star_rating
  const { data: allHotels } = await supabase
    .from('hotels')
    .select('id, name, star_rating, published, status')
    .eq('published', true)
    .limit(20);

  console.log('\nSample hotel star_rating values:');
  if (allHotels && allHotels.length > 0) {
    allHotels.slice(0, 10).forEach(h => {
      console.log(`  - ${h.name}: star_rating=${h.star_rating} (type: ${typeof h.star_rating})`);
    });
  } else {
    console.log('  No published hotels found!');
  }

  // Check for NULL vs non-NULL star_ratings
  const { count: withStarRating } = await supabase
    .from('hotels')
    .select('*', { count: 'exact', head: true })
    .eq('published', true)
    .not('star_rating', 'is', null);

  const { count: withoutStarRating } = await supabase
    .from('hotels')
    .select('*', { count: 'exact', head: true })
    .eq('published', true)
    .is('star_rating', null);

  console.log('\nStar rating population:');
  console.log('  - Hotels WITH star_rating:', withStarRating);
  console.log('  - Hotels WITHOUT star_rating (NULL):', withoutStarRating);

  // Check for hotels with star_rating >= 4
  const { data: luxuryHotels, error: luxuryError } = await supabase
    .from('hotels')
    .select('id, name, star_rating, google_rating')
    .eq('published', true)
    .gte('star_rating', 4)
    .limit(10);

  console.log('\nHotels with star_rating >= 4:');
  if (luxuryError) {
    console.log('  ERROR:', luxuryError.message);
  } else if (luxuryHotels && luxuryHotels.length > 0) {
    luxuryHotels.forEach(h => {
      console.log(`  - ${h.name}: star_rating=${h.star_rating}, google_rating=${h.google_rating}`);
    });
  } else {
    console.log('  NONE FOUND - This is why the blog query returns 0 results!');
  }

  // Check unique star_rating values
  const { data: uniqueRatings } = await supabase
    .from('hotels')
    .select('star_rating')
    .eq('published', true);

  if (uniqueRatings) {
    const uniqueValues = [...new Set(uniqueRatings.map(h => h.star_rating))].sort();
    console.log('\nUnique star_rating values in database:', uniqueValues);
  }

  // Check if star_rating field exists in schema
  const { data: sampleHotel } = await supabase
    .from('hotels')
    .select('*')
    .eq('published', true)
    .limit(1)
    .single();

  if (sampleHotel) {
    console.log('\nSample hotel record fields:');
    console.log('  Has star_rating field?', 'star_rating' in sampleHotel);
    console.log('  Star rating value:', sampleHotel.star_rating);
  }
}

diagnose().catch(console.error);
