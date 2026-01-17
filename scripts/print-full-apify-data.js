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
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, apify_output')
    .not('apify_output', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    const restaurant = data[0];
    console.log('='.repeat(80));
    console.log(`RESTAURANT: ${restaurant.name}`);
    console.log(`ID: ${restaurant.id}`);
    console.log('='.repeat(80));
    console.log('\n');

    // Pretty print the entire apify_output
    const fullJson = JSON.stringify(restaurant.apify_output, null, 2);
    console.log(fullJson);

    // Also save to file for easier viewing
    fs.writeFileSync('apify-output-full.json', fullJson, 'utf-8');
    console.log('\n');
    console.log('='.repeat(80));
    console.log('Full data also saved to: apify-output-full.json');
    console.log('='.repeat(80));
  } else {
    console.log('No restaurants with apify_output found');
  }
})();
