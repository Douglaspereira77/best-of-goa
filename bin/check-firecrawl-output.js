#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFirecrawlOutput() {
  const { data } = await supabase
    .from('hotels')
    .select('firecrawl_output, name')
    .eq('id', 'fa338533-2ad8-453d-9d38-7000c58d7baa')
    .single();

  console.log('Hotel:', data.name);
  console.log('\nFirecrawl stages found:');

  const stages = Object.keys(data.firecrawl_output || {});
  console.log(stages.join(', '));

  // Check if general search has Instagram results
  if (data.firecrawl_output.general) {
    console.log('\n\n=== GENERAL SEARCH RESULTS ===');
    const general = data.firecrawl_output.general;
    if (general.data) {
      console.log(`Found ${general.data.length} results`);
      const instagramResults = general.data.filter(item =>
        item.url && item.url.includes('instagram.com')
      );
      if (instagramResults.length > 0) {
        console.log('\n✅ Instagram found in general search:');
        console.log(JSON.stringify(instagramResults[0], null, 2));
      } else {
        console.log('\n❌ No Instagram in general search');
      }
    }
  }

  // Check social media search results
  console.log('\n\n=== SOCIAL MEDIA SEARCH RESULTS ===');
  console.log(JSON.stringify(data.firecrawl_output.social_media_search, null, 2));
}

checkFirecrawlOutput();
