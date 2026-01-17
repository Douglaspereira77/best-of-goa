require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function researchCategoryGaps() {
  console.log('🔍 CATEGORY RESEARCH REPORT\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // PART 1: ATTRACTION CATEGORIES
  console.log('📍 ATTRACTION CATEGORIES\n');

  const attractionCategories = ['beach', 'nature', 'park', 'religious'];

  for (const catSlug of attractionCategories) {
    const { data: category } = await supabase
      .from('attraction_categories')
      .select('id, name')
      .eq('slug', catSlug)
      .single();

    if (!category) {
      console.log(`❌ ${catSlug}: Category not found in database\n`);
      continue;
    }

    const { data: attractions } = await supabase
      .from('attractions')
      .select('name, area, attraction_type, google_place_id, active, published')
      .contains('attraction_category_ids', [category.id])
      .eq('active', true)
      .eq('published', true)
      .order('name');

    console.log(`${catSlug.toUpperCase()} (${attractions?.length || 0} properties)`);
    console.log(`Category: ${category.name} (ID: ${category.id})`);

    if (attractions && attractions.length > 0) {
      console.log('Current properties:');
      attractions.forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.name} (${a.area}) - Type: ${a.attraction_type}`);
      });
    } else {
      console.log('  (Empty)');
    }
    console.log('');
  }

  console.log('───────────────────────────────────────────────────────────\n');

  // PART 2: DISH CATEGORIES (RESTAURANTS)
  console.log('🍽️  DISH CATEGORIES (Restaurants)\n');

  const dishKeywords = {
    'fried-chicken': ['fried chicken', 'crispy chicken', 'chicken wings'],
    'ramen': ['ramen', 'noodle soup'],
    'taco': ['taco', 'tacos', 'burrito', 'quesadilla'],
    'pasta': ['pasta', 'spaghetti', 'penne', 'linguine', 'fettuccine', 'carbonara', 'bolognese'],
    'breakfast': ['breakfast', 'eggs', 'pancake', 'waffle', 'omelette'],
    'kebab': ['kebab', 'kabab', 'kebob', 'shish']
  };

  for (const [dishSlug, keywords] of Object.entries(dishKeywords)) {
    // Search for dishes matching keywords in restaurants_dishes table
    const orConditions = keywords.map(keyword => `name.ilike.%${keyword}%`).join(',');

    const { data: matchingDishes, error } = await supabase
      .from('restaurants_dishes')
      .select('restaurant_id, name, description')
      .or(orConditions);

    const dishName = dishSlug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

    if (error) {
      console.log(`${dishName.toUpperCase()} - Error: ${error.message}\n`);
      continue;
    }

    // Get unique restaurant IDs
    const restaurantIds = matchingDishes ? [...new Set(matchingDishes.map(d => d.restaurant_id))] : [];

    console.log(`${dishName.toUpperCase()} (${restaurantIds.length} restaurants)`);

    if (restaurantIds.length > 0) {
      // Get restaurant names
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('name, area')
        .in('id', restaurantIds)
        .eq('active', true)
        .order('name')
        .limit(10);

      if (restaurants) {
        console.log('Restaurants serving this:');
        restaurants.forEach((r, i) => {
          console.log(`  ${i + 1}. ${r.name} (${r.area})`);
        });
        if (restaurantIds.length > 10) {
          console.log(`  ... and ${restaurantIds.length - 10} more`);
        }
      }
    } else {
      console.log('  (No restaurants found - May need menu extraction)');
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  // SUMMARY
  console.log('📊 SUMMARY & DISCUSSION POINTS\n');

  // Re-fetch for summary
  const summaries = [];

  for (const catSlug of attractionCategories) {
    const { data: category } = await supabase
      .from('attraction_categories')
      .select('id')
      .eq('slug', catSlug)
      .single();

    if (category) {
      const { data: attractions } = await supabase
        .from('attractions')
        .select('id')
        .contains('attraction_category_ids', [category.id])
        .eq('active', true)
        .eq('published', true);

      summaries.push({
        type: 'Attraction',
        category: catSlug,
        count: attractions?.length || 0
      });
    }
  }

  for (const [dishSlug, keywords] of Object.entries(dishKeywords)) {
    const orConditions = keywords.map(keyword => `name.ilike.%${keyword}%`).join(',');

    const { data: matchingDishes } = await supabase
      .from('restaurants_dishes')
      .select('restaurant_id')
      .or(orConditions);

    const restaurantIds = matchingDishes ? [...new Set(matchingDishes.map(d => d.restaurant_id))] : [];

    summaries.push({
      type: 'Dish',
      category: dishSlug,
      count: restaurantIds.length
    });
  }

  console.log('Attraction Categories:');
  summaries
    .filter(s => s.type === 'Attraction')
    .forEach(s => {
      const status = s.count >= 10 ? '✅' : s.count >= 5 ? '⚠️' : '❌';
      console.log(`  ${status} ${s.category}: ${s.count} properties`);
    });

  console.log('\nDish Categories:');
  summaries
    .filter(s => s.type === 'Dish')
    .forEach(s => {
      const status = s.count >= 10 ? '✅' : s.count >= 5 ? '⚠️' : '❌';
      console.log(`  ${status} ${s.category}: ${s.count} restaurants`);
    });

  console.log('\n═══════════════════════════════════════════════════════════');
}

researchCategoryGaps();
