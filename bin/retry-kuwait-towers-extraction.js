#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { attractionExtractionOrchestrator } = require('../src/lib/services/attraction-extraction-orchestrator');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function retry() {
  console.log('Retrying Goa Towers extraction...\n');

  // Get the attraction
  const { data: attraction, error } = await supabase
    .from('attractions')
    .select('id, google_place_id, name')
    .ilike('name', '%goa towers%')
    .single();

  if (error || !attraction) {
    console.log('âŒ Could not find Goa Towers');
    return;
  }

  console.log('Found:', attraction.name);
  console.log('ID:', attraction.id);
  console.log('Place ID:', attraction.google_place_id);

  // Reset extraction status
  console.log('\nResetting extraction status...');
  await supabase
    .from('attractions')
    .update({
      extraction_status: 'pending',
      extraction_progress: {}
    })
    .eq('id', attraction.id);

  // Start extraction
  console.log('Starting extraction...\n');

  try {
    await attractionExtractionOrchestrator.executeExtraction({
      attractionId: attraction.id,
      placeId: attraction.google_place_id,
      searchQuery: attraction.name
    });

    console.log('\nâœ… Extraction completed successfully!');
  } catch (err) {
    console.error('\nâŒ Extraction failed:', err.message);
  }
}

retry();
