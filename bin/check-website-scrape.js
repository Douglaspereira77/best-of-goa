#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWebsiteScrape() {
  const { data } = await supabase
    .from('hotels')
    .select('firecrawl_output')
    .eq('id', '2bfe8042-457a-4f29-bb86-2bed501616c8')
    .single();

  const websiteScrape = data.firecrawl_output.website_scrape;

  console.log('Website scrape exists?:', !!websiteScrape);

  if (websiteScrape) {
    const md = websiteScrape.data?.markdown || websiteScrape.markdown || '';
    console.log('Markdown length:', md.length);
    console.log('\nContains "instagram"?:', md.toLowerCase().includes('instagram'));
    console.log('Contains "facebook"?:', md.toLowerCase().includes('facebook'));
    console.log('Contains "twitter"?:', md.toLowerCase().includes('twitter'));
    console.log('Contains "tiktok"?:', md.toLowerCase().includes('tiktok'));

    if (md.toLowerCase().includes('instagram')) {
      // Extract Instagram URLs
      const instagramMatches = md.match(/instagram\.com\/[^\s"'<>)]+/gi);
      console.log('\nInstagram URLs found:', instagramMatches);
    }
  } else {
    console.log('NO WEBSITE SCRAPE DATA');
  }
}

checkWebsiteScrape();
