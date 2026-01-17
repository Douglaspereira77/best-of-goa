require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findBrunchSpots() {
  console.log('=== SEARCHING FOR POTENTIAL BRUNCH RESTAURANTS ===\n');

  // 1. Check restaurants with brunch/breakfast in name
  const { data: byName } = await supabase
    .from('restaurants')
    .select('name, slug, overall_rating')
    .or('name.ilike.%brunch%,name.ilike.%breakfast%')
    .eq('active', true)
    .order('overall_rating', { ascending: false });

  console.log('1. Restaurants with "brunch" or "breakfast" in name:');
  byName?.forEach(r => console.log(`   - ${r.name} (${r.overall_rating || 'N/A'})`));

  // 2. Check for restaurants with breakfast-style dishes
  const breakfastKeywords = ['pancake', 'waffle', 'omelette', 'eggs benedict', 'scrambled eggs', 'bacon', 'hash brown', 'croissant'];
  const orCond = breakfastKeywords.map(k => `name.ilike.%${k}%`).join(',');

  const { data: breakfastDishes } = await supabase
    .from('restaurants_dishes')
    .select('restaurant_id, name')
    .or(orCond);

  const uniqueIds = [...new Set(breakfastDishes?.map(d => d.restaurant_id) || [])];

  // Exclude already on brunch page
  const currentBrunchKeywords = ['brunch', 'eggs benedict', 'french toast', 'avocado toast', 'mimosa'];
  const currentOrCond = currentBrunchKeywords.map(k => `name.ilike.%${k}%`).join(',');
  const { data: currentDishes } = await supabase
    .from('restaurants_dishes')
    .select('restaurant_id')
    .or(currentOrCond);
  const currentIds = new Set(currentDishes?.map(d => d.restaurant_id) || []);

  const newIds = uniqueIds.filter(id => !currentIds.has(id));

  if (newIds.length > 0) {
    const { data: breakfastRestaurants } = await supabase
      .from('restaurants')
      .select('name, slug, overall_rating')
      .in('id', newIds)
      .eq('active', true)
      .order('overall_rating', { ascending: false })
      .limit(25);

    console.log('\n2. Restaurants with breakfast dishes (NOT already on brunch page):');
    breakfastRestaurants?.forEach(r => console.log(`   - ${r.name} (${r.overall_rating || 'N/A'})`));
  }

  // 3. High-rated restaurants with Brunch meal type
  const { data: brunchMeal } = await supabase
    .from('restaurants_meals')
    .select('id')
    .eq('slug', 'brunch-restaurants')
    .single();

  if (brunchMeal) {
    const { data: topBrunch } = await supabase
      .from('restaurants')
      .select('name, slug, overall_rating')
      .contains('restaurant_meal_ids', [brunchMeal.id])
      .eq('active', true)
      .gte('overall_rating', 8.5)
      .order('overall_rating', { ascending: false })
      .limit(25);

    console.log('\n3. Top-rated (8.5+) with Brunch meal type:');
    topBrunch?.forEach(r => console.log(`   - ${r.name} (${r.overall_rating})`));
  }

  // 4. Search descriptions for brunch mentions
  const { data: byDesc } = await supabase
    .from('restaurants')
    .select('name, slug, overall_rating, short_description')
    .or('description.ilike.%brunch%,short_description.ilike.%brunch%')
    .eq('active', true)
    .order('overall_rating', { ascending: false })
    .limit(15);

  console.log('\n4. Restaurants mentioning "brunch" in description:');
  byDesc?.forEach(r => console.log(`   - ${r.name} (${r.overall_rating || 'N/A'})`));

  // 5. Known brunch chains/spots to check
  const knownBrunchSpots = ['Eggs & Toast', 'Ladurée', 'Paul', 'Dean & Deluca', 'More', 'Cocoa Room', 'Chez Sonia', 'Casper & Gambini', 'Le Pain Quotidien'];

  console.log('\n5. Checking known brunch spots:');
  for (const spot of knownBrunchSpots) {
    const { data } = await supabase
      .from('restaurants')
      .select('name, slug, overall_rating')
      .ilike('name', `%${spot}%`)
      .eq('active', true);

    if (data && data.length > 0) {
      data.forEach(r => console.log(`   - ${r.name} (${r.overall_rating || 'N/A'}) ✓ In database`));
    }
  }
}

findBrunchSpots();
