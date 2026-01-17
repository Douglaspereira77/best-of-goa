require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function recategorizeAttractions() {
  console.log('🔧 Starting quick recategorizations...\n');

  // Get category IDs
  const { data: categories, error: catError } = await supabase
    .from('attraction_categories')
    .select('id, name, slug')
    .in('slug', ['landmark', 'cultural']);

  if (catError) {
    console.error('Error getting categories:', catError);
    return;
  }

  const landmarkCat = categories.find(c => c.slug === 'landmark');
  const culturalCat = categories.find(c => c.slug === 'cultural');

  console.log(`✓ Landmark category ID: ${landmarkCat.id}`);
  console.log(`✓ Cultural category ID: ${culturalCat.id}\n`);

  const updates = [
    {
      slug: 'al-salam-palace-museum-shuwaikh-port',
      name: 'Al-Salam Palace Museum',
      addCategory: landmarkCat.id,
      categoryName: 'landmark',
      reason: 'Historical palace, fits landmark criteria'
    },
    {
      slug: 'dickson-house-museum-sharq',
      name: 'Dickson House Museum',
      addCategory: landmarkCat.id,
      categoryName: 'landmark',
      reason: 'Historical building, cultural landmark'
    },
    {
      slug: 'sheikh-jaber-al-ahmad-cultural-centre-shuwaikh-residential',
      name: 'Sheikh Jaber Cultural Centre',
      addCategory: culturalCat.id,
      categoryName: 'cultural',
      reason: 'Major cultural center, should have cultural category'
    }
  ];

  for (const update of updates) {
    console.log(`📍 Processing: ${update.name}`);
    console.log(`   Adding category: ${update.categoryName}`);
    console.log(`   Reason: ${update.reason}`);

    // Get current attraction
    const { data: attraction, error: getError } = await supabase
      .from('attractions')
      .select('id, name, attraction_category_ids')
      .eq('slug', update.slug)
      .single();

    if (getError) {
      console.error(`   ✗ Error getting ${update.name}:`, getError.message);
      console.log('');
      continue;
    }

    const currentCategories = attraction.attraction_category_ids || [];

    if (currentCategories.includes(update.addCategory)) {
      console.log(`   ℹ️  Already has ${update.categoryName} category`);
      console.log('');
      continue;
    }

    const newCategories = [...currentCategories, update.addCategory];

    const { error: updateError } = await supabase
      .from('attractions')
      .update({ attraction_category_ids: newCategories })
      .eq('id', attraction.id);

    if (updateError) {
      console.error(`   ✗ Error updating:`, updateError.message);
    } else {
      console.log(`   ✓ Successfully added ${update.categoryName} category`);
      console.log(`   Categories: [${currentCategories.join(', ')}] → [${newCategories.join(', ')}]`);
    }
    console.log('');
  }

  console.log('✅ Recategorization complete!\n');

  // Check new landmark count
  const { data: landmarks, error: countError } = await supabase
    .from('attractions')
    .select('id, name')
    .contains('attraction_category_ids', [landmarkCat.id])
    .eq('active', true)
    .eq('published', true);

  if (!countError) {
    console.log(`📊 Landmark category now has ${landmarks.length} attractions:`);
    landmarks.forEach((l, i) => {
      console.log(`   ${i + 1}. ${l.name}`);
    });
  }
}

recategorizeAttractions();
