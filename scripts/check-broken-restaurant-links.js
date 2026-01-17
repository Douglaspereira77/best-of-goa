/**
 * Check for restaurants with broken slugs or Instagram handles as slugs
 *
 * This script diagnoses the Ahrefs 404 errors related to:
 * - Instagram handles used as slugs
 * - Malformed slug data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBrokenLinks() {
  console.log('ðŸ” Checking for restaurants with broken slugs or malformed data...\n');

  // List of Instagram handles from the Ahrefs audit
  const instagramHandles = [
    'Misk.kwt',
    'BenihanaGoa',
    'ovokwt',
    'sabaideegroup',
    'chinagreatwallrest',
    'hardeesarabia',
    'BurgerFi',
    '925509257558176',
    'sharer',
    'intent',
  ];

  // Check if any slugs match Instagram handles
  console.log('1ï¸âƒ£  Checking if slugs match Instagram handles...');
  const { data: slugMatches, error: slugError } = await supabase
    .from('restaurants')
    .select('id, name, slug, instagram, facebook')
    .in('slug', instagramHandles);

  if (slugError) {
    console.error('Error querying by slug:', slugError);
  } else {
    console.log(`Found ${slugMatches.length} restaurants with Instagram handles as slugs:`);
    slugMatches.forEach(r => {
      console.log(`  - ${r.name} | slug: ${r.slug} | instagram: ${r.instagram}`);
    });
  }

  // Check if any Instagram fields contain these handles (to find correct slugs)
  console.log('\n2ï¸âƒ£  Finding restaurants with these Instagram handles...');
  const { data: instagramMatches, error: instagramError } = await supabase
    .from('restaurants')
    .select('id, name, slug, instagram, facebook, published')
    .or(instagramHandles.map(h => `instagram.ilike.%${h}%`).join(','));

  if (instagramError) {
    console.error('Error querying by Instagram:', instagramError);
  } else if (instagramMatches) {
    console.log(`Found ${instagramMatches.length} restaurants:`);
    instagramMatches.forEach(r => {
      console.log(`  - ${r.name}`);
      console.log(`    Slug: ${r.slug}`);
      console.log(`    Instagram: ${r.instagram}`);
      console.log(`    Published: ${r.published}`);
      console.log(`    Correct URL: /places-to-eat/restaurants/${r.slug}`);
      console.log('');
    });
  }

  // Check for specific problematic restaurants
  console.log('\n3ï¸âƒ£  Checking specific restaurant names...');
  const restaurantNames = [
    'Misk',
    'Benihana',
    'Ovo',
    'Sabaidee',
    'China Great Wall',
    "Hardee's",
    'BurgerFi',
    'Calicut Live',
  ];

  const { data: nameMatches, error: nameError } = await supabase
    .from('restaurants')
    .select('id, name, slug, instagram, facebook, published')
    .or(restaurantNames.map(n => `name.ilike.%${n}%`).join(','));

  if (nameError) {
    console.error('Error querying by name:', nameError);
  } else if (nameMatches) {
    console.log(`Found ${nameMatches.length} restaurants by name:`);
    nameMatches.forEach(r => {
      console.log(`  - ${r.name}`);
      console.log(`    Slug: ${r.slug}`);
      console.log(`    Instagram: ${r.instagram}`);
      console.log(`    Published: ${r.published}`);
      console.log('');
    });
  }

  // Check for restaurants with malformed slugs (containing special characters)
  console.log('\n4ï¸âƒ£  Checking for restaurants with malformed slugs...');
  const { data: allRestaurants, error: allError } = await supabase
    .from('restaurants')
    .select('id, name, slug, instagram')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(500);

  if (allError) {
    console.error('Error querying all restaurants:', allError);
  } else if (allRestaurants) {
    const malformed = allRestaurants.filter(r => {
      // Check for slugs containing parentheses, uppercase, or numeric IDs
      return /[A-Z().]/.test(r.slug) || /^\d+$/.test(r.slug);
    });

    console.log(`Found ${malformed.length} restaurants with malformed slugs:`);
    malformed.forEach(r => {
      console.log(`  - ${r.name} | slug: ${r.slug}`);
    });
  }

  console.log('\nâœ… Analysis complete!');
  console.log('\nðŸ“‹ SUMMARY:');
  console.log(`- Slugs matching Instagram handles: ${slugMatches?.length || 0}`);
  console.log(`- Restaurants found by Instagram: ${instagramMatches?.length || 0}`);
  console.log(`- Restaurants found by name: ${nameMatches?.length || 0}`);
  console.log(`- Malformed slugs detected: ${allRestaurants ? allRestaurants.filter(r => /[A-Z().]/.test(r.slug) || /^\d+$/.test(r.slug)).length : 0}`);
}

checkBrokenLinks().catch(console.error);
