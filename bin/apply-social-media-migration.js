/**
 * Apply Social Media Columns Migration
 * Adds tiktok, youtube, linkedin, snapchat, whatsapp columns to restaurants table
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🔄 Applying Social Media Columns Migration...\n');

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251113_add_additional_social_media_columns.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Migration SQL:');
  console.log('='.repeat(80));
  console.log(sql);
  console.log('='.repeat(80));

  try {
    // Execute migration via SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // Try alternative method: split into individual statements
      console.log('\n⚠️  exec_sql not available, using direct query...\n');

      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));

      for (const statement of statements) {
        if (statement) {
          console.log(`Executing: ${statement.substring(0, 80)}...`);
          const { error: stmtError } = await supabase.from('_sql').select('*').limit(0);

          // Since we can't execute raw SQL directly, let's use a workaround
          // We'll construct the migration manually
          console.log('Cannot execute raw SQL via API. Please run migration manually.');
          console.log('\nOption 1: Use Supabase Dashboard SQL Editor');
          console.log('Option 2: Use Supabase CLI: npx supabase db push');
          console.log('Option 3: Use psql directly with connection string');
          return;
        }
      }
    } else {
      console.log('\n✅ Migration applied successfully!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n📝 Please apply this migration manually using one of these methods:');
    console.log('\n1. Supabase Dashboard:');
    console.log('   - Go to SQL Editor');
    console.log('   - Paste the migration SQL above');
    console.log('   - Click "Run"');
    console.log('\n2. Supabase CLI:');
    console.log('   - Run: npx supabase db push');
    console.log('\n3. Direct SQL (if you have connection string):');
    console.log('   - psql "your-connection-string" -f supabase/migrations/20251113_add_additional_social_media_columns.sql');
  }
}

applyMigration().then(() => {
  console.log('\n');
  process.exit(0);
});
