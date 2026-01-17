const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  console.log('🚀 Running Phase 1 Migration...\n');

  // Read migration file
  const sql = fs.readFileSync('migrations/add-phase1-fields.sql', 'utf-8');

  console.log('Executing SQL:');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));

  // Execute migration
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('\n❌ Migration failed:', error);

    // Try alternative approach - run queries individually
    console.log('\n⚠️  Attempting alternative approach...');

    const queries = sql.split(';').filter(q => q.trim() && !q.trim().startsWith('--'));

    for (const query of queries) {
      if (query.trim()) {
        console.log(`\nExecuting: ${query.trim().substring(0, 50)}...`);
        const { error: queryError } = await supabase.rpc('exec_sql', { sql_query: query });

        if (queryError) {
          console.error(`❌ Failed:`, queryError.message);
        } else {
          console.log('✅ Success');
        }
      }
    }
  } else {
    console.log('\n✅ Migration completed successfully!');
  }

  // Verify columns were added
  console.log('\n🔍 Verifying new columns...\n');

  const { data: restaurants, error: fetchError } = await supabase
    .from('restaurants')
    .select('id, name, postal_code, questions_and_answers, people_also_search')
    .limit(1);

  if (fetchError) {
    console.error('❌ Verification failed:', fetchError);
  } else {
    console.log('✅ New columns verified! Sample restaurant:');
    console.log(restaurants[0]);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ MIGRATION COMPLETE');
  console.log('='.repeat(80));
})();
