import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking table schemas...\n');

  // Sample a single row from each table to see the structure
  const tables = ['restaurants', 'hotels', 'malls', 'attractions', 'schools', 'fitness_places'];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ Error querying ${table}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`\n✅ ${table.toUpperCase()} columns:`);
      console.log(Object.keys(data[0]).sort().join(', '));
    } else {
      console.log(`\n⚠️  ${table.toUpperCase()}: No data found`);
    }
  }
}

checkSchema();
