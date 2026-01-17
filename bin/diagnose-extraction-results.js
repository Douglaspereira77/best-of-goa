require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseExtraction() {
  const { data: hotel } = await supabase
    .from('hotels')
    .select('*')
    .eq('slug', 'the-regency-hotel-salmiya')
    .single();

  console.log('\n🔍 EXTRACTION DIAGNOSIS\n');

  // Check description
  console.log('✅ Description:', hotel.description ? hotel.description.substring(0, 80) + '...' : '❌ NONE');

  // Check category/amenity IDs
  console.log('Category IDs:', hotel.hotel_category_ids?.length || 0, 'IDs');
  console.log('Amenity IDs:', hotel.hotel_amenity_ids?.length || 0, 'IDs');
  console.log('Facility IDs:', hotel.hotel_facility_ids?.length || 0, 'IDs');

  // Check images
  console.log('\nHero Image:', hotel.hero_image || '❌ NONE');

  const { data: images, count: imageCount } = await supabase
    .from('hotel_images')
    .select('*', { count: 'exact' })
    .eq('hotel_id', hotel.id);

  console.log('hotel_images table:', imageCount, 'records');

  // Check FAQs
  const { count: faqCount } = await supabase
    .from('hotel_faqs')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', hotel.id);

  console.log('hotel_faqs table:', faqCount, 'records');

  // Check rooms
  const { count: roomCount } = await supabase
    .from('hotel_rooms')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', hotel.id);

  console.log('hotel_rooms table:', roomCount, 'records');

  // Check policies
  const { count: policyCount } = await supabase
    .from('hotel_policies')
    .select('*', { count: 'exact', head: true })
    .eq('hotel_id', hotel.id);

  console.log('hotel_policies table:', policyCount, 'records');

  // Check extraction progress
  console.log('\n📋 EXTRACTION STEPS:');
  const progress = hotel.extraction_progress;
  if (progress && typeof progress === 'object') {
    const steps = progress.steps || [];
    if (Array.isArray(steps)) {
      steps.forEach(step => {
        const status = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⏳';
        console.log(`  ${status} ${step.name} (${step.status})`);
        if (step.error) {
          console.log(`     Error: ${step.error}`);
        }
      });
    }
  }
}

diagnoseExtraction().catch(console.error);
