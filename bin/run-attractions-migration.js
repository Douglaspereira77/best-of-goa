#!/usr/bin/env node
/**
 * Run Attractions Migration
 * Executes the attractions system SQL migration directly against Supabase
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running Attractions System Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251116_attractions_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split into individual statements (simple split on semicolons outside of strings)
    // For complex SQL, we'll execute it in chunks
    const statements = migrationSQL
      .split(/;(?=\s*(?:CREATE|INSERT|ALTER|DROP|COMMENT|--|\n\n))/gi)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement || statement.startsWith('--')) continue;

      // Get first line for logging
      const firstLine = statement.split('\n')[0].substring(0, 80);
      console.log(`[${i + 1}/${statements.length}] ${firstLine}...`);

      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // Try direct query if RPC not available
        const { error: queryError } = await supabase.from('_exec').select().limit(0);

        if (queryError) {
          console.error(`  ❌ Error: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`  ✅ Success`);
        successCount++;
      }
    }

    console.log(`\n========================================`);
    console.log(`Migration Complete!`);
    console.log(`Success: ${successCount}, Errors: ${errorCount}`);
    console.log(`========================================\n`);

    // Verify tables were created
    console.log('Verifying tables...');

    const tables = [
      'attractions',
      'attraction_categories',
      'attraction_amenities',
      'attraction_features',
      'attraction_images',
      'attraction_reviews',
      'attraction_faqs',
      'attraction_special_hours'
    ];

    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`  ❌ ${table}: Not found or error`);
      } else {
        console.log(`  ✅ ${table}: Created (${count || 0} rows)`);
      }
    }

  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
