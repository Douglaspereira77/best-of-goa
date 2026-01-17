// Inspect actual Firecrawl output structure
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

async function inspectFirecrawlStructure() {
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, firecrawl_output')
    .eq('status', 'active')
    .limit(2);

  if (error) {
    console.error('Error:', error);
    return;
  }

  restaurants.forEach(restaurant => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Restaurant: ${restaurant.name}`);
    console.log('='.repeat(80));

    const firecrawl = restaurant.firecrawl_output;

    console.log('\nTop-level keys:');
    Object.keys(firecrawl).forEach(key => {
      console.log(`  - ${key}: ${typeof firecrawl[key]}`);
    });

    if (firecrawl.results && Array.isArray(firecrawl.results)) {
      console.log(`\n${firecrawl.results.length} results found`);

      firecrawl.results.forEach((result, idx) => {
        console.log(`\nResult ${idx + 1}:`);
        console.log(JSON.stringify(result, null, 2));
      });
    }

    if (firecrawl.opentable) {
      console.log('\nOpenTable data:');
      console.log(JSON.stringify(firecrawl.opentable, null, 2));
    }

    console.log('\n' + '='.repeat(80));
  });
}

inspectFirecrawlStructure();
