require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingLandmarks() {
  console.log('🔍 Checking existing landmarks in database...\n');

  // First, get the landmark category ID
  const { data: categories, error: catError } = await supabase
    .from('attraction_categories')
    .select('id, name, slug')
    .eq('slug', 'landmark')
    .single();

  if (catError) {
    console.error('Error getting landmark category:', catError);
    return;
  }

  const landmarkCategoryId = categories?.id;
  console.log(`Landmark Category ID: ${landmarkCategoryId}\n`);

  // Get all attractions with 'landmark' category
  const { data: landmarks, error } = await supabase
    .from('attractions')
    .select('id, name, slug, area, attraction_type, attraction_category_ids, google_place_id, active, published')
    .contains('attraction_category_ids', [landmarkCategoryId])
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${landmarks.length} existing landmarks:\n`);

  landmarks.forEach((landmark, index) => {
    console.log(`${index + 1}. ${landmark.name}`);
    console.log(`   Area: ${landmark.area || 'N/A'}`);
    console.log(`   Slug: ${landmark.slug}`);
    console.log(`   Type: ${landmark.attraction_type || 'N/A'}`);
    console.log(`   Place ID: ${landmark.google_place_id || 'N/A'}`);
    console.log(`   Active: ${landmark.active}, Published: ${landmark.published}`);
    console.log('');
  });

  // Check if our planned landmarks already exist
  const plannedLandmarks = [
    'Grand Mosque',
    'Sheikh Jaber Al-Ahmad Cultural Centre',
    'Seif Palace',
    'Mirror House',
    'Sadu House',
    'Tareq Rajab Museum',
    'Al Shaheed Park',
    'Bait Al Othman Museum',
    'Dickson House',
    'Failaka Island'
  ];

  console.log('\n📋 Status of planned landmarks:\n');

  plannedLandmarks.forEach(name => {
    const exists = landmarks.find(l =>
      l.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(l.name.toLowerCase())
    );

    if (exists) {
      console.log(`✓ ${name} - ALREADY EXISTS as "${exists.name}" (${exists.slug})`);
    } else {
      console.log(`✗ ${name} - NEEDS EXTRACTION`);
    }
  });

  // Also check the extraction queue
  console.log('\n\n🔄 Checking extraction queue...\n');

  const { data: queueItems, error: queueError } = await supabase
    .from('attraction_extraction_queue')
    .select('id, name, status, priority, created_at')
    .order('priority', { ascending: true });

  if (queueError) {
    console.error('Queue Error:', queueError);
  } else {
    if (queueItems.length === 0) {
      console.log('Queue is empty.');
    } else {
      console.log(`Found ${queueItems.length} items in queue:\n`);
      queueItems.forEach(item => {
        console.log(`- ${item.name} (Status: ${item.status}, Priority: ${item.priority})`);
      });
    }
  }
}

checkExistingLandmarks();
