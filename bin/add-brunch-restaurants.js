require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const restaurantsToAdd = [
  { name: 'Kateh', dish: 'Weekend Brunch' },
  { name: 'Al Ahmadi Restaurant', dish: 'Brunch Platter' },
  { name: 'Kings of Maillard', dish: 'Brunch Special' },
  { name: 'Lazy Cat Morouj', dish: 'Brunch Menu' },
  { name: 'Beastro', dish: 'Brunch Feast' },
  { name: 'Haute Dolci Goa', dish: 'Sweet Brunch' },
  { name: 'Vigonovo', dish: 'Italian Brunch' },
  { name: 'Slider Station', dish: 'Brunch Sliders' },
  { name: 'Cocoa Room', dish: 'Brunch Selection' },
  { name: 'Folio Bistro & Bakery', dish: 'Brunch Bakery Board' },
  { name: 'Kumar', dish: 'Brunch Thali' },
  { name: 'Mais Alghanim', dish: 'Goai Brunch' },
  { name: 'Mughal Mahal Farwaniya', dish: 'Indian Brunch' },
  { name: 'Fish Door', dish: 'Seafood Brunch' },
  { name: 'Le Pain Quotidien', dish: 'Organic Brunch' },
  { name: 'LadurÃ©e', dish: 'French Brunch' },
  { name: 'Dean & Deluca', dish: 'Gourmet Brunch' },
  { name: 'Patti&More', dish: 'Brunch Bites' },
  { name: 'Table Otto', dish: 'Brunch Board' },
  { name: 'Paul Bakery & Restaurant', dish: 'French Toast Brunch' },
];

async function addBrunchDishes() {
  console.log('Adding brunch dishes to restaurants...\n');

  let added = 0;
  let failed = 0;

  for (const item of restaurantsToAdd) {
    // Find restaurant by name
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, name')
      .ilike('name', `%${item.name}%`)
      .eq('active', true)
      .limit(1)
      .single();

    if (!restaurant) {
      console.log(`âŒ Not found: ${item.name}`);
      failed++;
      continue;
    }

    // Check if already has a brunch dish
    const { data: existing } = await supabase
      .from('restaurants_dishes')
      .select('name')
      .eq('restaurant_id', restaurant.id)
      .ilike('name', '%brunch%');

    if (existing && existing.length > 0) {
      console.log(`â­ï¸  Already has brunch: ${restaurant.name}`);
      continue;
    }

    // Add brunch dish
    const slug = item.dish.toLowerCase().replace(/\s+/g, '-');
    const { error } = await supabase
      .from('restaurants_dishes')
      .insert({
        restaurant_id: restaurant.id,
        name: item.dish,
        slug: slug,
        description: `Signature brunch offering at ${restaurant.name}`
      });

    if (error) {
      console.log(`âŒ Error adding to ${restaurant.name}: ${error.message}`);
      failed++;
    } else {
      console.log(`âœ… Added "${item.dish}" to ${restaurant.name}`);
      added++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Added: ${added}`);
  console.log(`Failed/Skipped: ${failed}`);

  // Verify final count
  const keywords = ['brunch', 'eggs benedict', 'french toast', 'avocado toast', 'mimosa'];
  const orCond = keywords.map(k => `name.ilike.%${k}%`).join(',');
  const { data: dishes } = await supabase
    .from('restaurants_dishes')
    .select('restaurant_id')
    .or(orCond);

  const uniqueCount = new Set(dishes?.map(d => d.restaurant_id)).size;
  console.log(`\nTotal restaurants on brunch page: ${uniqueCount}`);
}

addBrunchDishes();
