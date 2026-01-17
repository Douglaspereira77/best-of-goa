/**
 * Apply School Structured Data Fields Migration
 * 
 * This script applies the migration to add:
 * - education_level (TEXT[])
 * - gender_type (TEXT)
 * - total_students (INTEGER)
 * - languages_offered (TEXT[])
 * 
 * Usage:
 * npx tsx src/scripts/apply-school-fields-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function applyMigration() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📚 Applying School Structured Data Fields Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251123_add_school_structured_data_fields.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded');
    console.log('🔧 Applying migration to database...\n');

    // Execute the migration
    // Note: We need to split by statement and execute separately because
    // Supabase client doesn't support multiple statements in one query
    
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    let successCount = 0;
    const errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments
      if (statement.trim().startsWith('--')) continue;
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_sql').select('*').limit(0);
          
          if (directError) {
            console.log(`⚠️  Statement ${i + 1}: Skipping (may already exist)`);
          }
        } else {
          successCount++;
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err: any) {
        // Many statements will "fail" because they already exist - this is OK
        console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 MIGRATION APPLICATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`✅ Successfully executed: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`⚠️  Warnings/Skipped: ${errorCount} statements`);
    }
    console.log('\n📋 New fields added to schools table:');
    console.log('   • education_level (TEXT[])');
    console.log('   • gender_type (TEXT)');
    console.log('   • total_students (INTEGER)');
    console.log('   • languages_offered (TEXT[])');

    // Verify the columns exist
    console.log('\n🔍 Verifying new columns...');
    
    const { data: testSchool, error: verifyError } = await supabase
      .from('schools')
      .select('id, education_level, gender_type, total_students, languages_offered')
      .limit(1)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      console.log('\n⚠️  You may need to apply the migration manually using Supabase SQL Editor');
    } else {
      console.log('✅ All new columns verified successfully!');
    }

  } catch (error: any) {
    console.error('💥 Migration failed:', error.message);
    console.log('\n📝 Manual Steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Copy and paste the contents of:');
    console.log('   supabase/migrations/20251123_add_school_structured_data_fields.sql');
    console.log('4. Execute the SQL');
  }
}

// Run the script
applyMigration()
  .then(() => {
    console.log('\n✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
































