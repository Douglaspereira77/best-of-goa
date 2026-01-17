require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function quickFixLandmarks() {
  console.log('ðŸ”§ Starting quick fixes for landmarks...\n');

  // Step 1: Get landmark category ID
  const { data: landmarkCat, error: catError } = await supabase
    .from('attraction_categories')
    .select('id, name, slug')
    .eq('slug', 'landmark')
    .single();

  if (catError) {
    console.error('Error getting landmark category:', catError);
    return;
  }

  const landmarkCategoryId = landmarkCat.id;
  console.log(`âœ“ Landmark category ID: ${landmarkCategoryId}\n`);

  // Step 2: Fix Grand Mosque - Add landmark category
  console.log('ðŸ“ Fix 1: Adding landmark category to Grand Mosque...');

  const { data: grandMosque, error: mosqueGetError } = await supabase
    .from('attractions')
    .select('id, name, attraction_category_ids')
    .eq('slug', 'grand-mosque-of-goa-sharq')
    .single();

  if (mosqueGetError) {
    console.error('Error getting Grand Mosque:', mosqueGetError);
  } else {
    const currentCategories = grandMosque.attraction_category_ids || [];

    if (currentCategories.includes(landmarkCategoryId)) {
      console.log('  â„¹ï¸  Grand Mosque already has landmark category');
    } else {
      const newCategories = [...currentCategories, landmarkCategoryId];

      const { error: mosqueUpdateError } = await supabase
        .from('attractions')
        .update({ attraction_category_ids: newCategories })
        .eq('id', grandMosque.id);

      if (mosqueUpdateError) {
        console.error('  âœ— Error updating Grand Mosque:', mosqueUpdateError);
      } else {
        console.log(`  âœ“ Added landmark category to Grand Mosque`);
        console.log(`    Old categories: [${currentCategories.join(', ')}]`);
        console.log(`    New categories: [${newCategories.join(', ')}]`);
      }
    }
  }

  console.log('');

  // Step 3: Activate Sheikh Jaber Cultural Centre
  console.log('ðŸ“ Fix 2: Activating Sheikh Jaber Cultural Centre...');

  const { data: jacc, error: jaccGetError } = await supabase
    .from('attractions')
    .select('id, name, active, published, attraction_type, attraction_category_ids')
    .eq('slug', 'sheikh-jaber-al-ahmad-cultural-centre-shuwaikh-residential')
    .single();

  if (jaccGetError) {
    console.error('Error getting Sheikh Jaber Cultural Centre:', jaccGetError);
  } else {
    console.log(`  Current status: active=${jacc.active}, published=${jacc.published}`);
    console.log(`  Current type: ${jacc.attraction_type || 'null'}`);
    console.log(`  Current categories: [${(jacc.attraction_category_ids || []).join(', ')}]`);

    // Prepare updates
    const updates = {
      active: true,
      published: true,
      published_at: new Date().toISOString()
    };

    // Add attraction_type if null
    if (!jacc.attraction_type) {
      updates.attraction_type = 'cultural';
    }

    // Add landmark category if not present
    const currentCategories = jacc.attraction_category_ids || [];
    if (!currentCategories.includes(landmarkCategoryId)) {
      updates.attraction_category_ids = [...currentCategories, landmarkCategoryId];
    }

    const { error: jaccUpdateError } = await supabase
      .from('attractions')
      .update(updates)
      .eq('id', jacc.id);

    if (jaccUpdateError) {
      console.error('  âœ— Error updating Sheikh Jaber Cultural Centre:', jaccUpdateError);
    } else {
      console.log('  âœ“ Successfully activated Sheikh Jaber Cultural Centre');
      console.log('  âœ“ Set active=true, published=true');
      if (updates.attraction_type) {
        console.log(`  âœ“ Set type: ${updates.attraction_type}`);
      }
      if (updates.attraction_category_ids) {
        console.log(`  âœ“ Added landmark category`);
      }
    }
  }

  console.log('\nâœ… Quick fixes complete!');
  console.log('\nðŸ“Š Summary:');
  console.log('  1. Grand Mosque: Now has landmark category');
  console.log('  2. Sheikh Jaber Cultural Centre: Now active and published');
}

quickFixLandmarks();
