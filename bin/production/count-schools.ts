import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function countSchools() {
  console.log('Checking schools table...\n');

  // Try to count all schools
  const { data, error, count } = await supabase
    .from('schools')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error querying schools:', error);
    return;
  }

  console.log(`Total schools in database: ${count || 0}`);

  if (count && count > 0) {
    // Get the first few schools
    const { data: schools } = await supabase
      .from('schools')
      .select('name, created_at')
      .limit(5);

    console.log('\nFirst 5 schools:');
    schools?.forEach(s => console.log(`- ${s.name} (${s.created_at})`));
  }
}

countSchools()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
