#!/usr/bin/env node
/**
 * Apply Malls Migration
 *
 * Executes the malls system SQL migration directly via Supabase REST API
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

async function applyMigration() {
  console.log('Applying malls system migration...');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251116_malls_system.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log(`Migration file: ${migrationPath}`);
  console.log(`SQL length: ${sql.length} characters`);

  // Execute via Supabase REST API (using postgrest-js pattern)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ sql_query: sql })
  });

  if (!response.ok) {
    // If exec_sql doesn't exist, we'll need to use the SQL editor approach
    console.log('Direct SQL execution not available via REST API.');
    console.log('');
    console.log('Please apply the migration manually:');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qcqxcffgfdsqfrwwvabh');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of:');
    console.log(`   ${migrationPath}`);
    console.log('4. Click "Run" to execute');
    console.log('');
    console.log('Or authenticate the CLI:');
    console.log('   npx supabase login');
    console.log('   npx supabase link --project-ref qcqxcffgfdsqfrwwvabh');
    console.log('   npx supabase db push');
    return false;
  }

  console.log('Migration applied successfully!');
  return true;
}

// Alternative: Split and execute statements individually
async function applyMigrationChunked() {
  console.log('Applying malls system migration (chunked)...');

  const migrationPath = path.join(__dirname, '../supabase/migrations/20251116_malls_system.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Split by major sections (CREATE TABLE, INSERT INTO, etc.)
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute`);

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');

    try {
      // Use raw SQL execution
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });

      if (error) {
        console.log(`[${i + 1}/${statements.length}] ERROR: ${preview}...`);
        console.log(`   ${error.message}`);
        errorCount++;
      } else {
        console.log(`[${i + 1}/${statements.length}] OK: ${preview}...`);
        successCount++;
      }
    } catch (err) {
      console.log(`[${i + 1}/${statements.length}] FAILED: ${preview}...`);
      console.log(`   ${err.message}`);
      errorCount++;
    }
  }

  console.log('');
  console.log(`Migration complete: ${successCount} succeeded, ${errorCount} failed`);
}

// Run
applyMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
