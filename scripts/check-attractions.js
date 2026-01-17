const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAttractions() {
  console.log('Checking attractions in database...\n');

  // Check total count
  const { data: allAttractions, error: countError, count } = await supabase
    .from('attractions')
    .select('id, name, active, google_rating, area', { count: 'exact' })
    .eq('active', true);

  if (countError) {
    console.log('Error:', countError.message);
    return;
  }

  console.log(`Total active attractions: ${count}`);
  console.log('\nSample attractions:');

  if (allAttractions && allAttractions.length > 0) {
    allAttractions.slice(0, 5).forEach(a => {
      console.log(`- ${a.name} (${a.area}) - Rating: ${a.google_rating || 'N/A'}`);
    });
  } else {
    console.log('No attractions found.');
  }

  // Check categories
  const { data: categories, error: catError } = await supabase
    .from('attraction_categories')
    .select('id, name');

  if (!catError && categories) {
    console.log(`\nTotal attraction categories: ${categories.length}`);
    categories.slice(0, 5).forEach(c => {
      console.log(`- ${c.name}`);
    });
  }
}

checkAttractions();