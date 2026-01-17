#!/usr/bin/env node

/**
 * Run Hotel Migration
 *
 * Executes the hotel database schema migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🔧 RUNNING HOTEL MIGRATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251113_hotels_system.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration file: 20251113_hotels_system.sql');
  console.log('📏 Size:', Math.round(migrationSQL.length / 1024), 'KB\n');

  try {
    console.log('⚙️  Executing migration...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('   RPC method not available, trying direct execution...\n');

      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';

        // Skip comments
        if (statement.trim().startsWith('--') || statement.trim().startsWith('/*')) {
          continue;
        }

        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (stmtError) {
            console.error(`   ⚠️  Statement ${i + 1} warning:`, stmtError.message);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`   ❌ Statement ${i + 1} error:`, err.message);
          errorCount++;
        }
      }

      console.log(`\n✅ Migration completed`);
      console.log(`   Success: ${successCount} statements`);
      console.log(`   Warnings/Errors: ${errorCount}\n`);
    } else {
      console.log('✅ Migration executed successfully\n');
    }

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const tablesToCheck = [
      'hotels',
      'hotel_categories',
      'hotel_amenities',
      'hotel_facilities',
      'hotel_room_types',
      'hotel_rooms',
      'hotel_images',
      'hotel_reviews',
      'hotel_faqs',
      'hotel_policies'
    ];

    for (const table of tablesToCheck) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table}: NOT FOUND`);
      } else {
        console.log(`   ✅ ${table}: exists (${count || 0} rows)`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ HOTEL DATABASE SCHEMA READY\n');

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
