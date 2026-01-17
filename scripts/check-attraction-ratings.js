import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRatings() {
  // Check attractions with ratings
  const { data: withRatings, count: ratedCount } = await supabase
    .from('attractions')
    .select('name, google_rating, google_review_count', { count: 'exact' })
    .eq('active', true)
    .not('google_rating', 'is', null);

  console.log(`Attractions with ratings: ${ratedCount}\n`);

  // Check attractions with ratings >= 4.0
  const { data: topRated, count: topRatedCount } = await supabase
    .from('attractions')
    .select('name, google_rating, google_review_count', { count: 'exact' })
    .eq('active', true)
    .not('google_rating', 'is', null)
    .gte('google_rating', 4.0);

  console.log(`Attractions with rating >= 4.0: ${topRatedCount}\n`);

  if (topRated && topRated.length > 0) {
    console.log('Sample top rated attractions:');
    topRated.slice(0, 5).forEach(a => {
      console.log(`- ${a.name}: ${a.google_rating} (${a.google_review_count || 0} reviews)`);
    });
  }

  // Check attractions without ratings
  const { count: noRatingCount } = await supabase
    .from('attractions')
    .select('id', { count: 'exact', head: true })
    .eq('active', true)
    .is('google_rating', null);

  console.log(`\nAttractions without ratings: ${noRatingCount}`);
}

checkRatings().catch(console.error);
