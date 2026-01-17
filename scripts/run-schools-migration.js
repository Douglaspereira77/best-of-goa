/**
 * Schools Migration Runner
 * Applies the schools system migration to Supabase
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🏫 Starting Schools Migration...\n');

  // Read migration file
  const migrationPath = 'supabase/migrations/20251119_schools_system.sql';
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split into individual statements (rough split by semicolons)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  // Connect to Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let successCount = 0;
  let errorCount = 0;

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments and empty statements
    if (statement.trim().startsWith('--') || statement.trim().length < 5) {
      continue;
    }

    // Get a short preview of the statement
    const preview = statement.substring(0, 80).replace(/\n/g, ' ') + '...';

    try {
      process.stdout.write(`[${i + 1}/${statements.length}] ${preview} `);

      const { error } = await supabase.rpc('query', { sql: statement });

      if (error) {
        // Try direct query if RPC doesn't work
        console.log('❌');
        console.log(`   Error: ${error.message}\n`);
        errorCount++;
      } else {
        console.log('✅');
        successCount++;
      }
    } catch (err) {
      console.log('❌');
      console.log(`   Error: ${err.message}\n`);
      errorCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 Schools migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify tables created: school_categories, school_features, schools');
    console.log('2. Check seed data loaded (15 categories, 30+ features)');
    console.log('3. Continue to Phase 2: Backend Services');
  } else {
    console.log('\n⚠️  Some statements failed. Please check errors above.');
    console.log('You may need to run the migration manually through Supabase Dashboard.');
  }
}

runMigration().catch(console.error);
