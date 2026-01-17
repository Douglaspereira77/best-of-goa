require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  const { data: hotel } = await supabase
    .from('hotels')
    .select('name, extraction_status, extraction_progress')
    .ilike('name', '%hilton%garden%')
    .single();

  if (!hotel) {
    console.log('\n❌ Hotel not found - extraction may not have started\n');
    return;
  }

  console.log('\n📊 EXTRACTION STATUS:\n');
  console.log(`Hotel: ${hotel.name}`);
  console.log(`Status: ${hotel.extraction_status}\n`);

  if (hotel.extraction_status === 'completed') {
    console.log('✅ EXTRACTION COMPLETE!\n');
    console.log('Run this to verify results:');
    console.log('node bin/verify-hilton-extraction.js\n');
  } else if (hotel.extraction_status === 'in_progress') {
    console.log('⏳ EXTRACTION IN PROGRESS...\n');

    if (hotel.extraction_progress?.currentStep) {
      const current = hotel.extraction_progress.currentStep;
      const total = hotel.extraction_progress.totalSteps || 12;
      const percent = Math.round((current / total) * 100);
      console.log(`Progress: Step ${current}/${total} (${percent}%)`);
      console.log(`Current: ${hotel.extraction_progress.currentStepName || 'Unknown'}\n`);
    }
  } else if (hotel.extraction_status === 'failed') {
    console.log('❌ EXTRACTION FAILED!\n');
    if (hotel.extraction_progress?.error) {
      console.log(`Error: ${hotel.extraction_progress.error}\n`);
    }
  } else {
    console.log(`Status: ${hotel.extraction_status || 'pending'}\n`);
  }
}

checkStatus().catch(console.error);
