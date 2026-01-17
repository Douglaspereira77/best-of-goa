#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  console.log('Diagnosing Goa Towers extraction failure...\n');

  // Get the attraction
  const { data: attraction, error } = await supabase
    .from('attractions')
    .select('*')
    .ilike('name', '%goa towers%')
    .single();

  if (error || !attraction) {
    console.log('âŒ Could not find Goa Towers attraction');
    console.log('Error:', error?.message);
    return;
  }

  console.log('Attraction ID:', attraction.id);
  console.log('Name:', attraction.name);
  console.log('Status:', attraction.extraction_status);
  console.log('Google Place ID:', attraction.google_place_id);
  console.log('\n--- Extraction Progress ---');

  const progress = attraction.extraction_progress || {};
  const steps = [
    'apify_fetch',
    'firecrawl_website',
    'social_media_search',
    'apify_reviews',
    'process_images',
    'ai_enhancement',
    'category_matching'
  ];

  for (const step of steps) {
    const stepData = progress[step];
    if (stepData) {
      const icon = stepData.status === 'completed' ? 'âœ…' : stepData.status === 'failed' ? 'âŒ' : 'â³';
      console.log(`${icon} ${step}: ${stepData.status}`);
      if (stepData.error) {
        console.log(`   Error: ${stepData.error}`);
      }
      if (stepData.timestamp) {
        console.log(`   Time: ${new Date(stepData.timestamp).toLocaleString()}`);
      }
    } else {
      console.log(`â¬œ ${step}: not started`);
    }
  }

  console.log('\n--- Raw Data ---');
  console.log('Apify Output:', attraction.apify_output ? 'Present' : 'Empty');
  console.log('Firecrawl Output:', attraction.firecrawl_output ? 'Present' : 'Empty');

  if (attraction.apify_output) {
    console.log('\nApify Output Keys:', Object.keys(attraction.apify_output));
  }
}

diagnose();
