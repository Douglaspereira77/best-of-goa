require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditAttractionCategories() {
  console.log('🔍 Auditing all attraction categories...\n');

  // Step 1: Get all categories
  const { data: categories, error: catError } = await supabase
    .from('attraction_categories')
    .select('id, name, slug')
    .order('name');

  if (catError) {
    console.error('Error getting categories:', catError);
    return;
  }

  console.log(`Found ${categories.length} categories\n`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const categoryCounts = [];

  // Step 2: Count attractions per category
  for (const category of categories) {
    const { data: attractions, error } = await supabase
      .from('attractions')
      .select('id, name, area, attraction_type, active, published')
      .contains('attraction_category_ids', [category.id])
      .eq('active', true)
      .eq('published', true);

    if (error) {
      console.error(`Error getting attractions for ${category.name}:`, error);
      continue;
    }

    const count = attractions?.length || 0;
    categoryCounts.push({
      category: category.name,
      slug: category.slug,
      id: category.id,
      count: count,
      attractions: attractions || []
    });

    const status = count >= 10 ? '✅' : count >= 5 ? '⚠️' : '❌';
    console.log(`${status} ${category.name} (${category.slug}): ${count} attractions`);

    if (count > 0 && count < 10) {
      console.log(`   Attractions:`);
      attractions.forEach(a => {
        console.log(`   - ${a.name} (${a.area}) [Type: ${a.attraction_type}]`);
      });
    }
    console.log('');
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY\n');

  const needAttention = categoryCounts.filter(c => c.count < 10);
  const wellPopulated = categoryCounts.filter(c => c.count >= 10);

  console.log(`✅ Well-populated (≥10): ${wellPopulated.length} categories`);
  wellPopulated.forEach(c => {
    console.log(`   - ${c.category}: ${c.count}`);
  });

  console.log(`\n⚠️  Need more content (<10): ${needAttention.length} categories`);
  needAttention.forEach(c => {
    console.log(`   - ${c.category}: ${c.count} (need ${10 - c.count} more)`);
  });

  // Step 3: Get all attractions and their types for recategorization suggestions
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('💡 RECATEGORIZATION SUGGESTIONS\n');

  const { data: allAttractions, error: allError } = await supabase
    .from('attractions')
    .select('id, name, area, attraction_type, attraction_category_ids, active, published')
    .eq('active', true)
    .eq('published', true)
    .order('name');

  if (allError) {
    console.error('Error getting all attractions:', allError);
    return;
  }

  // Analyze attractions that might fit in under-populated categories
  const suggestions = [];

  allAttractions.forEach(attraction => {
    const type = attraction.attraction_type?.toLowerCase() || '';
    const name = attraction.name.toLowerCase();
    const currentCats = attraction.attraction_category_ids || [];

    // Suggest landmark category
    const landmarkCat = categoryCounts.find(c => c.slug === 'landmark');
    if (landmarkCat && !currentCats.includes(landmarkCat.id)) {
      if (type === 'historical' || name.includes('tower') || name.includes('palace') || name.includes('monument')) {
        suggestions.push({
          attraction: attraction.name,
          suggestedCategory: 'landmark',
          reason: `Type: ${attraction.attraction_type}, fits landmark criteria`
        });
      }
    }

    // Suggest museum category
    const museumCat = categoryCounts.find(c => c.slug === 'museum');
    if (museumCat && !currentCats.includes(museumCat.id)) {
      if (type === 'museum' || name.includes('museum') || name.includes('gallery')) {
        suggestions.push({
          attraction: attraction.name,
          suggestedCategory: 'museum',
          reason: `Type: ${attraction.attraction_type}`
        });
      }
    }

    // Suggest cultural category
    const culturalCat = categoryCounts.find(c => c.slug === 'cultural');
    if (culturalCat && !currentCats.includes(culturalCat.id)) {
      if (type === 'cultural' || name.includes('cultural') || name.includes('heritage') || name.includes('traditional')) {
        suggestions.push({
          attraction: attraction.name,
          suggestedCategory: 'cultural',
          reason: `Type: ${attraction.attraction_type}`
        });
      }
    }

    // Suggest entertainment category
    const entertainmentCat = categoryCounts.find(c => c.slug === 'entertainment');
    if (entertainmentCat && !currentCats.includes(entertainmentCat.id)) {
      if (type === 'entertainment' || name.includes('park') || name.includes('mall') || name.includes('cinema')) {
        suggestions.push({
          attraction: attraction.name,
          suggestedCategory: 'entertainment',
          reason: `Type: ${attraction.attraction_type}`
        });
      }
    }
  });

  if (suggestions.length > 0) {
    console.log(`Found ${suggestions.length} recategorization suggestions:\n`);
    suggestions.slice(0, 20).forEach((s, i) => {
      console.log(`${i + 1}. ${s.attraction} → Add "${s.suggestedCategory}" category`);
      console.log(`   Reason: ${s.reason}\n`);
    });
  } else {
    console.log('No automatic suggestions found.');
  }

  console.log('\n═══════════════════════════════════════════════════════════');
}

auditAttractionCategories();
