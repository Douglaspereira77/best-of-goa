#!/usr/bin/env node

/**
 * Backfill Restaurant Cuisine IDs
 *
 * Maps ai_enhancement_output.cuisine_suggestions (text array)
 * to restaurant_cuisine_ids (UUID array) for all active restaurants
 *
 * This fixes the issue where cuisine pages show fewer restaurants
 * because they query restaurant_cuisine_ids but we only populate
 * ai_enhancement_output.cuisine_suggestions during extraction
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cuisine name to UUID mapping
const CUISINE_MAP = {
  'American': '551b69d5-ae4a-4166-89ed-27fadeebf9cb',
  'Asian Fusion': '359e3281-8323-4cfa-9115-dc03dc308f1a',
  'Chinese': '9e35991c-4275-407f-8cf7-120c638a5bb9',
  'French': '826087e1-88ea-4513-9a28-cda3913a4cb6',
  'Health Food': 'efb39695-1282-481d-9a51-ddff40a69380',
  'Indian': '22a886bd-aba6-4c6c-885b-4308c4681423',
  'Italian': 'c1b6d00d-f272-4065-9b2b-3dbe62d8fe5d',
  'Japanese': '6245f0e7-24df-4e25-bf06-b774901c97ab',
  'Goai': '8b5bbbdd-f5de-4c89-a8d1-6cced4c53e85',
  'Goai-American Fusion': '165eb0c6-ec9b-45eb-a80e-21cbc5b59a70',
  'Lebanese': 'fe16bae6-a3bd-41a5-b60c-6abadf6b7582',
  'Mexican': '77d95757-ab6d-4d78-b334-577922de20d7',
  'Middle Eastern': 'e4d9c7f6-b45c-4d82-a0ba-4be9605b7a23',
  'Seafood': 'fb9c5e12-3a48-4d91-8f2e-1c9d7e6b4a3f',
  'Steakhouse': '7f8e9d6c-5b4a-3c2d-1e0f-9a8b7c6d5e4f',
  'Thai': 'b58e060d-0bbe-4fd1-aee5-71449dac3359',
  'Turkish': 'b7278429-7205-4df9-bc6b-18f9139bf7a1',

  // Common variations/aliases
  'Asian': '359e3281-8323-4cfa-9115-dc03dc308f1a', // Map to Asian Fusion
  'Mediterranean': 'e4d9c7f6-b45c-4d82-a0ba-4be9605b7a23', // Map to Middle Eastern
  'Arabic': 'e4d9c7f6-b45c-4d82-a0ba-4be9605b7a23', // Map to Middle Eastern
  'Steak': '7f8e9d6c-5b4a-3c2d-1e0f-9a8b7c6d5e4f', // Map to Steakhouse
};

async function backfillCuisineIds() {
  console.log('ðŸ”§ BACKFILLING RESTAURANT CUISINE IDS');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

  // Get all active restaurants
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, ai_enhancement_output, restaurant_cuisine_ids')
    .eq('status', 'active');

  if (error) {
    console.error('âŒ Error fetching restaurants:', error);
    return;
  }

  console.log(`Found ${restaurants.length} active restaurants\n`);

  let updated = 0;
  let skipped = 0;
  let noCuisines = 0;

  for (const restaurant of restaurants) {
    const cuisineSuggestions = restaurant.ai_enhancement_output?.cuisine_suggestions || [];

    // Skip if no cuisine suggestions
    if (cuisineSuggestions.length === 0) {
      noCuisines++;
      continue;
    }

    // Skip if already has cuisine IDs
    if (restaurant.restaurant_cuisine_ids && restaurant.restaurant_cuisine_ids.length > 0) {
      skipped++;
      continue;
    }

    // Map text cuisines to UUIDs
    const cuisineIds = cuisineSuggestions
      .map(cuisine => CUISINE_MAP[cuisine])
      .filter(Boolean); // Remove undefined values

    // Skip if no valid mappings
    if (cuisineIds.length === 0) {
      console.log(`âš ï¸  ${restaurant.name}: No valid cuisine mappings for [${cuisineSuggestions.join(', ')}]`);
      noCuisines++;
      continue;
    }

    // Update restaurant
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ restaurant_cuisine_ids: cuisineIds })
      .eq('id', restaurant.id);

    if (updateError) {
      console.error(`âŒ Failed to update ${restaurant.name}:`, updateError.message);
    } else {
      console.log(`âœ… ${restaurant.name}: ${cuisineSuggestions.join(', ')} â†’ ${cuisineIds.length} IDs`);
      updated++;
    }
  }

  console.log('\nâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log('ðŸ“Š BACKFILL SUMMARY');
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
  console.log(`Total Restaurants: ${restaurants.length}`);
  console.log(`Updated: ${updated} âœ…`);
  console.log(`Already Had IDs: ${skipped} â­ï¸`);
  console.log(`No Cuisines: ${noCuisines}`);
  console.log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

  if (updated > 0) {
    console.log('âœ… SUCCESS! Cuisine IDs backfilled.');
    console.log('\nðŸ’¡ Next steps:');
    console.log('   1. Refresh http://localhost:3000/places-to-eat/japanese');
    console.log('   2. Refresh http://localhost:3000/places-to-eat/italian');
    console.log('   3. You should now see ALL extracted restaurants!\n');
  }
}

backfillCuisineIds().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
