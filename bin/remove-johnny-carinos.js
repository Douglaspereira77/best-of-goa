#!/usr/bin/env node

/**
 * Remove Johnny Carino's Chain Restaurants
 *
 * Removes the 2 Johnny Carino's locations extracted in Batch 7
 * (American-Italian chain restaurant)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeChain() {
  console.log('ðŸ—‘ï¸  REMOVING JOHNNY CARINO\'S CHAIN RESTAURANTS');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

  // Johnny Carino's Place IDs from Batch 7
  const placeIds = [
    'ChIJw19tv8Kczz8Rhr5UrbvbCHU',  // Location 1
    'ChIJ9Y_b2pudzz8RQc0t8l7cWlw'   // Location 2
  ];

  console.log('ðŸ” Finding Johnny Carino\'s restaurants...\n');

  // Find restaurants
  const { data: restaurants, error: findError } = await supabase
    .from('restaurants')
    .select('id, name, address, google_place_id')
    .in('google_place_id', placeIds);

  if (findError) {
    console.error('âŒ Error finding restaurants:', findError);
    return;
  }

  if (!restaurants || restaurants.length === 0) {
    console.log('â„¹ï¸  No Johnny Carino\'s restaurants found in database.');
    return;
  }

  console.log(`Found ${restaurants.length} Johnny Carino's location(s):\n`);
  restaurants.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}`);
    console.log(`   Address: ${r.address}`);
    console.log(`   Place ID: ${r.google_place_id}`);
    console.log('');
  });

  // Delete restaurants
  console.log('ðŸ—‘ï¸  Deleting...\n');

  const { error: deleteError } = await supabase
    .from('restaurants')
    .delete()
    .in('google_place_id', placeIds);

  if (deleteError) {
    console.error('âŒ Error deleting:', deleteError);
    return;
  }

  console.log('âœ… Successfully removed all Johnny Carino\'s restaurants!\n');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('ðŸ“Š SUMMARY');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log(`Removed: ${restaurants.length} chain restaurant location(s)`);
  console.log('Reason: American-Italian chain (not local Goa restaurant)');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

  // Verify MELENZANÃ‰ is still there
  console.log('âœ… Verifying MELENZANÃ‰ (local chain) is still present...\n');

  const { data: melenzane, error: melError } = await supabase
    .from('restaurants')
    .select('name, address')
    .ilike('name', '%melenz%');

  if (!melError && melenzane && melenzane.length > 0) {
    console.log(`Found ${melenzane.length} MELENZANÃ‰ location(s) (kept as requested):`);
    melenzane.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.name} - ${m.address}`);
    });
  }

  console.log('\nâœ… Cleanup complete!\n');
}

removeChain().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
