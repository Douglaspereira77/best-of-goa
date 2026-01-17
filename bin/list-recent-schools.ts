import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listRecentSchools() {
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name, created_at, import_completed_at, google_review_count, status')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\n📋 10 Most Recently Added Schools:\n');
  console.log('─'.repeat(100));

  schools?.forEach((s, i) => {
    const completed = s.import_completed_at ? '✅' : '⏳';
    const reviews = s.google_review_count || 0;
    console.log(`${i + 1}. ${completed} ${s.name}`);
    console.log(`   ID: ${s.id}`);
    console.log(`   Created: ${new Date(s.created_at).toLocaleString()}`);
    console.log(`   Status: ${s.status || 'unknown'}`);
    console.log(`   Reviews: ${reviews}`);
    console.log(`   Completed: ${s.import_completed_at ? new Date(s.import_completed_at).toLocaleString() : 'Not yet'}\n`);
  });
}

listRecentSchools()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
