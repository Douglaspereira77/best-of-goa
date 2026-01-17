/**
 * Test Script: New Slug Generation Logic
 * 
 * This script tests the new area-based slug generation without requiring TypeScript imports.
 * 
 * Usage: node scripts/test-slug-generation.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Replicate the slug generation logic in JavaScript
function cleanAreaForSlug(area) {
  if (!area) return 'goa';
  
  // Goa-specific area mappings for better slug generation
  const areaMappings = {
    'goa city': 'goa-city',
    'goa-city': 'goa-city',
    'shuwaikh residenti': 'shuwaikh',
    'shuwaikh residential': 'shuwaikh',
    'bnied al-gar': 'bnied-al-gar',
    'omar ben al khatta': 'omar-ben-al-khatta',
    'mubarak al-kabeer': 'mubarak-al-kabeer',
    'al-ahmadi': 'ahmadi',
    'al-jahra': 'jahra',
    'goa city': 'goa-city'
  };
  
  let cleanArea = area.toLowerCase().trim();
  
  // Apply area mappings
  if (areaMappings[cleanArea]) {
    cleanArea = areaMappings[cleanArea];
  }
  
  return cleanArea
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .trim() || 'goa';
}

function generateSlug(name, location) {
  // Clean restaurant name
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  // Add location to make slug unique for different outlets
  if (location && location !== 'goa') {
    const locationSlug = location
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    baseSlug = `${baseSlug}-${locationSlug}`;
  }
  
  return baseSlug;
}

function generateRestaurantSlugWithArea(name, area, address) {
  // Use area if it's more specific than generic 'Goa'
  if (area && area.toLowerCase() !== 'goa' && area.toLowerCase() !== 'goa city') {
    const cleanArea = cleanAreaForSlug(area);
    return generateSlug(name, cleanArea);
  }
  
  // Fallback to address-based extraction (simplified)
  return generateSlug(name, 'goa-city');
}

async function testSlugGeneration() {
  console.log('ðŸ§ª Testing new slug generation logic:\n');

  // Test cases based on the database screenshot
  const testCases = [
    { name: "Pepper", area: "Messila", address: "Some address" },
    { name: "White Robata", area: "Shuwaikh Residenti", address: "Some address" },
    { name: "Dai Forni", area: "Omar Ben Al Khatta", address: "Some address" },
    { name: "Tatami Japanese Restaurant", area: "Mirqab", address: "Some address" },
    { name: "Dar Hamad", area: "Salmiya", address: "Some address" },
    { name: "OVO Restaurant", area: "Bnied Al-Gar", address: "Some address" },
    { name: "Sakura Restaurant", area: "Salwa", address: "Some address" },
    { name: "Generic Restaurant", area: "Goa", address: "Goa City, Goa" },
    { name: "Another Restaurant", area: "Goa City", address: "Some address" }
  ];

  console.log('Test Results:');
  console.log('=============');
  
  testCases.forEach((testCase, index) => {
    const oldSlug = generateSlug(testCase.name, 'goa-city'); // Old logic
    const newSlug = generateRestaurantSlugWithArea(
      testCase.name, 
      testCase.area, 
      testCase.address
    );
    
    console.log(`${index + 1}. ${testCase.name}`);
    console.log(`   Area: ${testCase.area}`);
    console.log(`   Old slug: ${oldSlug}`);
    console.log(`   New slug: ${newSlug}`);
    console.log(`   Improvement: ${oldSlug !== newSlug ? 'âœ… Better' : 'âž– Same'}`);
    console.log('');
  });
}

async function checkCurrentRestaurants() {
  console.log('\nðŸ“Š Checking current restaurants with goa-city slugs:\n');

  try {
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('id, name, slug, area, address')
      .like('slug', '%-goa-city')
      .limit(10);

    if (error) {
      console.error('âŒ Error fetching restaurants:', error);
      return;
    }

    if (!restaurants || restaurants.length === 0) {
      console.log('âœ… No restaurants found with goa-city slugs.');
      return;
    }

    console.log(`Found ${restaurants.length} restaurants with goa-city slugs:\n`);

    restaurants.forEach((restaurant, index) => {
      const newSlug = generateRestaurantSlugWithArea(
        restaurant.name, 
        restaurant.area, 
        restaurant.address || ''
      );
      
      console.log(`${index + 1}. ${restaurant.name}`);
      console.log(`   Current slug: ${restaurant.slug}`);
      console.log(`   Area: ${restaurant.area || 'N/A'}`);
      console.log(`   New slug: ${newSlug}`);
      console.log(`   Would change: ${restaurant.slug !== newSlug ? 'âœ… Yes' : 'âž– No'}`);
      console.log('');
    });

  } catch (error) {
    console.error('âŒ Error:', error);
  }
}

// Run the tests
if (require.main === module) {
  (async () => {
    await testSlugGeneration();
    await checkCurrentRestaurants();
  })();
}

module.exports = { testSlugGeneration, checkCurrentRestaurants };






























