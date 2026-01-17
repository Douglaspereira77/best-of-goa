#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function reset() {
  console.log('Resetting Goa Towers for retry...\n');

  // Get the attraction
  const { data: attraction, error } = await supabase
    .from('attractions')
    .select('id, google_place_id, name, apify_output')
    .ilike('name', '%goa towers%')
    .single();

  if (error || !attraction) {
    console.log('âŒ Could not find Goa Towers');
    return;
  }

  console.log('Found:', attraction.name);
  console.log('ID:', attraction.id);
  console.log('Place ID:', attraction.google_place_id);

  // Reset extraction status but keep apify_output (so we don't re-fetch)
  console.log('\nResetting extraction status...');
  const { error: updateError } = await supabase
    .from('attractions')
    .update({
      extraction_status: 'pending',
      extraction_progress: {}
    })
    .eq('id', attraction.id);

  if (updateError) {
    console.log('âŒ Reset failed:', updateError.message);
    return;
  }

  console.log('âœ… Extraction status reset to "pending"');
  console.log('\nTo retry extraction:');
  console.log('1. Go to Admin Panel â†’ Attractions â†’ Queue');
  console.log('2. The attraction should appear in the queue');
  console.log('3. Or restart your dev server to trigger the extraction');

  // Alternatively, trigger via curl if dev server is running
  console.log('\nOr run this command if dev server is running:');
  console.log(`curl -X POST http://localhost:3000/api/admin/attractions/retry-extraction -H "Content-Type: application/json" -d '{"attractionId":"${attraction.id}"}'`);
}

reset();
