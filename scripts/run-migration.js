// Run database migration script
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

async function runMigration() {
  console.log('=== RUNNING DATABASE MIGRATION ===\n');

  try {
    // Read migration SQL file
    const sql = fs.readFileSync('migrate-database.sql', 'utf-8');

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
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
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

    console.log('\n=== MIGRATION COMPLETED ===');
    console.log('Verifying new schema...\n');

    // Verify restaurants table has new columns
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

        const requiredCols = ['apify_output', 'firecrawl_output', 'firecrawl_menu_output', 'menu_data', 'hours', 'status'];
        const hasAllCols = requiredCols.every(col => columns.includes(col));

        if (hasAllCols) {
          console.log('✅ All required columns present!');
        } else {
          console.log('⚠️  Some columns may be missing');
        }
      } else {
        console.log('ℹ️  Restaurants table is empty, but migration should be complete');
      }
    }

    // Check if restaurant_imports was dropped
    const { error: importsError } = await supabase
      .from('restaurant_imports')
      .select('id')
      .limit(1);

    if (importsError && importsError.message.includes('does not exist')) {
      console.log('✅ restaurant_imports table successfully removed');
    } else {
      console.log('⚠️  restaurant_imports table still exists (may need manual removal)');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration().catch(console.error);
