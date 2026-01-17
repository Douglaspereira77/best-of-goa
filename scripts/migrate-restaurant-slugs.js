/**
 * Migration Script: Update Restaurant Slugs to Use Area Field
 * 
 * This script updates existing restaurants that have slugs ending with "goa-city"
 * to use their actual area field instead, creating more specific and meaningful slugs.
 * 
 * Usage: node scripts/migrate-restaurant-slugs.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Replicate the slug generation logic in JavaScript (since we can't import TypeScript directly)
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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateRestaurantSlugs() {
  console.log('ðŸ”„ Starting restaurant slug migration...\n');

  try {
    // Find restaurants with goa-city slugs
    const { data: restaurants, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, name, slug, area, address')
      .like('slug', '%-goa-city')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('âŒ Error fetching restaurants:', fetchError);
      return;
    }

    if (!restaurants || restaurants.length === 0) {
      console.log('âœ… No restaurants found with goa-city slugs. Migration not needed.');
      return;
    }

    console.log(`ðŸ“Š Found ${restaurants.length} restaurants with goa-city slugs:\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const restaurant of restaurants) {
      try {
        console.log(`Processing: ${restaurant.name} (${restaurant.slug})`);
        console.log(`  Current area: ${restaurant.area || 'N/A'}`);
        console.log(`  Current address: ${restaurant.address || 'N/A'}`);

        // Skip if area is generic or missing
        if (!restaurant.area || 
            restaurant.area.toLowerCase() === 'goa' || 
            restaurant.area.toLowerCase() === 'goa city') {
          console.log(`  â­ï¸  Skipping - area is generic: ${restaurant.area}`);
          skippedCount++;
          continue;
        }

        // Generate new slug using area
        const newSlug = generateRestaurantSlugWithArea(
          restaurant.name, 
          restaurant.area, 
          restaurant.address || ''
        );

        console.log(`  New slug: ${newSlug}`);

        // Check if new slug already exists
        const { data: existingSlug } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', newSlug)
          .neq('id', restaurant.id)
          .maybeSingle();

        if (existingSlug) {
          console.log(`  âš ï¸  New slug already exists, skipping to avoid conflict`);
          skippedCount++;
          continue;
        }

        // Update the restaurant with new slug
        const { error: updateError } = await supabase
          .from('restaurants')
          .update({ 
            slug: newSlug,
            updated_at: new Date().toISOString()
          })
          .eq('id', restaurant.id);

        if (updateError) {
          console.log(`  âŒ Update failed: ${updateError.message}`);
          errors.push({
            restaurant: restaurant.name,
            error: updateError.message
          });
        } else {
          console.log(`  âœ… Updated successfully`);
          updatedCount++;
        }

        console.log(''); // Empty line for readability

      } catch (error) {
        console.log(`  âŒ Error processing ${restaurant.name}: ${error.message}`);
        errors.push({
          restaurant: restaurant.name,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\nðŸ“ˆ Migration Summary:');
    console.log('===================');
    console.log(`Total restaurants processed: ${restaurants.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\nâŒ Errors encountered:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.restaurant}: ${error.error}`);
      });
    }

    console.log('\nâœ… Migration completed!');

  } catch (error) {
    console.error('âŒ Migration failed:', error);
  }
}

// Test the slug generation with sample data
async function testSlugGeneration() {
  console.log('\nðŸ§ª Testing slug generation with sample data:\n');

  const testCases = [
    { name: "Pepper", area: "Messila", address: "Some address" },
    { name: "OVO Restaurant", area: "Bnied Al-Gar", address: "Some address" },
    { name: "Dar Hamad", area: "Salmiya", address: "Some address" },
    { name: "Sakura Restaurant", area: "Salwa", address: "Some address" },
    { name: "White Robata", area: "Shuwaikh Residenti", address: "Some address" },
    { name: "Tatami Japanese Restaurant", area: "Mirqab", address: "Some address" },
    { name: "Dai Forni", area: "Omar Ben Al Khatta", address: "Some address" },
    { name: "Generic Restaurant", area: "Goa", address: "Goa City, Goa" }
  ];

  testCases.forEach((testCase, index) => {
    const newSlug = generateRestaurantSlugWithArea(
      testCase.name, 
      testCase.area, 
      testCase.address
    );
    console.log(`${index + 1}. ${testCase.name} (${testCase.area}) â†’ ${newSlug}`);
  });
}

// Run the migration
if (require.main === module) {
  (async () => {
    await testSlugGeneration();
    await migrateRestaurantSlugs();
  })();
}

module.exports = { migrateRestaurantSlugs, testSlugGeneration };
