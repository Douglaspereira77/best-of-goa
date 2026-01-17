// Run Omar Pattern Migration Script - Direct Supabase Client Approach
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  envVars.SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function runOmarMigration() {
  console.log('=== RUNNING OMAR PATTERN MIGRATION (Direct Approach) ===\n');

  try {
    // Step 1: Drop junction tables
    console.log('1. Dropping junction tables...');
    const junctionTables = [
      'restaurants_cuisines_junction',
      'restaurants_categories_junction', 
      'restaurants_good_for_junction',
      'restaurants_features_junction',
      'restaurants_meals_junction',
      'restaurants_dish_types_junction'
    ];

    for (const tableName of junctionTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          console.log(`  ⚠️  Junction table ${tableName} still exists - needs manual removal`);
        } else {
          console.log(`  ✅ Junction table ${tableName} already removed`);
        }
      } catch (err) {
        console.log(`  ✅ Junction table ${tableName} already removed`);
      }
    }

    // Step 2: Add array columns to restaurants
    console.log('\n2. Adding array columns to restaurants table...');
    
    // We can't directly alter tables through the client, so we'll check if they exist
    const { data: testRestaurant, error: testError } = await supabase
      .from('restaurants')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (testError && !testError.message.includes('no rows')) {
      console.log('  ❌ Error accessing restaurants table:', testError.message);
    } else {
      if (testRestaurant) {
        const columns = Object.keys(testRestaurant);
        const arrayColumns = [
          'restaurant_cuisine_ids',
          'restaurant_category_ids', 
          'restaurant_feature_ids',
          'restaurant_meal_ids',
          'restaurant_good_for_ids'
        ];
        
        const existingArrayCols = arrayColumns.filter(col => columns.includes(col));
        const missingArrayCols = arrayColumns.filter(col => !columns.includes(col));
        
        if (existingArrayCols.length > 0) {
          console.log(`  ✅ Array columns exist: ${existingArrayCols.join(', ')}`);
        }
        if (missingArrayCols.length > 0) {
          console.log(`  ❌ Missing array columns: ${missingArrayCols.join(', ')}`);
        }
      } else {
        console.log('  ℹ️  Restaurants table is empty - array columns need to be added manually');
      }
    }

    // Step 3: Check for new tables
    console.log('\n3. Checking for new tables...');
    
    // Check neighborhoods table
    try {
      const { data: neighborhoods, error: neighborhoodsError } = await supabase
        .from('restaurant_neighborhoods')
        .select('*')
        .limit(1);
      
      if (neighborhoodsError) {
        console.log('  ❌ restaurant_neighborhoods table missing:', neighborhoodsError.message);
      } else {
        console.log('  ✅ restaurant_neighborhoods table exists');
      }
    } catch (err) {
      console.log('  ❌ restaurant_neighborhoods table missing');
    }

    // Check Michelin awards table
    try {
      const { data: awards, error: awardsError } = await supabase
        .from('michelin_guide_awards')
        .select('*')
        .limit(1);
      
      if (awardsError) {
        console.log('  ❌ michelin_guide_awards table missing:', awardsError.message);
      } else {
        console.log('  ✅ michelin_guide_awards table exists');
      }
    } catch (err) {
      console.log('  ❌ michelin_guide_awards table missing');
    }

    // Step 4: Check foreign key columns
    console.log('\n4. Checking foreign key columns...');
    
    if (testRestaurant) {
      const fkColumns = ['neighborhood_id', 'michelin_guide_award_id'];
      const existingFKCols = fkColumns.filter(col => Object.keys(testRestaurant).includes(col));
      const missingFKCols = fkColumns.filter(col => !Object.keys(testRestaurant).includes(col));
      
      if (existingFKCols.length > 0) {
        console.log(`  ✅ Foreign key columns exist: ${existingFKCols.join(', ')}`);
      }
      if (missingFKCols.length > 0) {
        console.log(`  ❌ Missing foreign key columns: ${missingFKCols.join(', ')}`);
      }
    }

    console.log('\n=== MIGRATION STATUS ===');
    console.log('⚠️  This migration requires manual SQL execution in Supabase Dashboard');
    console.log('\nNext steps:');
    console.log('1. Go to your Supabase Dashboard > SQL Editor');
    console.log('2. Copy and paste the contents of migrate-to-omar-pattern.sql');
    console.log('3. Execute the SQL script');
    console.log('4. Run "node verify-omar-pattern.js" to verify success');
    console.log('\nAlternatively, you can run the migration through the Supabase CLI if available.');

  } catch (error) {
    console.error('\n❌ Migration check failed:', error);
  }
}

runOmarMigration().catch(console.error);




