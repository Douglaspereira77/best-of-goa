// Run Omar Pattern Migration Script
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
  console.log('=== RUNNING OMAR PATTERN MIGRATION ===\n');

  try {
    // Read migration SQL file
    const sql = fs.readFileSync('migrate-to-omar-pattern.sql', 'utf-8');

    // Split into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and DO blocks (they need special handling)
      if (statement.startsWith('DO $$') || statement.includes('RAISE NOTICE')) {
        console.log(`[${i + 1}/${statements.length}] Skipping DO block\n`);
        continue;
      }

      console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 60)}...`);

      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Some errors are expected (like "column already exists")
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('relation') && error.message.includes('already exists')) {
          console.log(`  ⚠️  Warning: ${error.message}`);
        } else {
          console.error(`  ❌ Error: ${error.message}`);
          // Continue anyway for non-critical errors
        }
      } else {
        console.log(`  ✅ Success`);
      }
      console.log('');
    }

    console.log('\n=== OMAR PATTERN MIGRATION COMPLETED ===');
    console.log('Verifying new schema...\n');

    // Verify restaurants table has new array columns
    const { data: testRestaurant, error: testError } = await supabase
      .from('restaurants')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (testError && !testError.message.includes('no rows')) {
      console.error('Error verifying schema:', testError);
    } else {
      if (testRestaurant) {
        const columns = Object.keys(testRestaurant);
        console.log('✅ Restaurants table columns:', columns.join(', '));

        const requiredArrayCols = [
          'restaurant_cuisine_ids', 
          'restaurant_category_ids', 
          'restaurant_feature_ids', 
          'restaurant_meal_ids', 
          'restaurant_good_for_ids'
        ];
        const hasArrayCols = requiredArrayCols.every(col => columns.includes(col));

        if (hasArrayCols) {
          console.log('✅ All array columns present!');
        } else {
          console.log('⚠️  Some array columns may be missing');
        }

        const requiredFKCols = ['neighborhood_id', 'michelin_guide_award_id'];
        const hasFKCols = requiredFKCols.every(col => columns.includes(col));

        if (hasFKCols) {
          console.log('✅ All foreign key columns present!');
        } else {
          console.log('⚠️  Some foreign key columns may be missing');
        }
      } else {
        console.log('ℹ️  Restaurants table is empty, but migration should be complete');
      }
    }

    // Check if new tables exist
    const { data: neighborhoods, error: neighborhoodsError } = await supabase
      .from('restaurant_neighborhoods')
      .select('*')
      .limit(1);

    if (neighborhoodsError) {
      console.log('❌ restaurant_neighborhoods table missing:', neighborhoodsError.message);
    } else {
      console.log('✅ restaurant_neighborhoods table created');
    }

    const { data: awards, error: awardsError } = await supabase
      .from('michelin_guide_awards')
      .select('*')
      .limit(1);

    if (awardsError) {
      console.log('❌ michelin_guide_awards table missing:', awardsError.message);
    } else {
      console.log('✅ michelin_guide_awards table created');
    }

    // Check if junction tables are gone
    const junctionTables = [
      'restaurants_cuisines_junction',
      'restaurants_categories_junction',
      'restaurants_good_for_junction',
      'restaurants_features_junction',
      'restaurants_meals_junction',
      'restaurants_dish_types_junction'
    ];

    let allJunctionTablesGone = true;
    for (const tableName of junctionTables) {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error) {
        console.log(`❌ Junction table ${tableName} still exists`);
        allJunctionTablesGone = false;
      }
    }

    if (allJunctionTablesGone) {
      console.log('✅ All junction tables successfully removed');
    }

    console.log('\n=== MIGRATION VERIFICATION COMPLETE ===');
    console.log('Run "node verify-omar-pattern.js" for detailed verification');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runOmarMigration().catch(console.error);




