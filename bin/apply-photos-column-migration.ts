#!/usr/bin/env ts-node
/**
 * Apply photos column migration to schools table
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📝 APPLYING PHOTOS COLUMN MIGRATION');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Read migration file
    const migrationSQL = fs.readFileSync(
      'supabase/migrations/20251122_add_photos_column_to_schools.sql',
      'utf-8'
    );

    console.log('Migration SQL:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('');

    // Execute migration
    console.log('Executing migration...\n');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('exec_sql not available, trying direct ALTER TABLE...\n');

      const { error: alterError } = await supabase
        .from('schools')
        .select('photos')
        .limit(1);

      if (alterError && alterError.message.includes("does not exist")) {
        console.log('⚠️  Cannot apply migration through Supabase client');
        console.log('Please run this SQL manually in Supabase SQL Editor:\n');
        console.log(migrationSQL);
        console.log('');
        console.log('Or use Supabase CLI: npx supabase db push');
        return;
      }

      console.log('✅ Column may already exist, verifying...\n');
    } else {
      console.log('✅ Migration executed successfully\n');
    }

    // Verify column exists
    console.log('Verifying photos column...\n');

    const { data: schools, error: selectError } = await supabase
      .from('schools')
      .select('id, name, photos')
      .limit(1);

    if (selectError) {
      console.error('❌ Verification failed:', selectError);
      console.log('\nPlease apply migration manually in Supabase SQL Editor:');
      console.log(migrationSQL);
    } else {
      console.log('✅ Photos column verified and accessible\n');
      console.log('Sample query result:', schools);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\nPlease apply migration manually in Supabase SQL Editor');
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

applyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
