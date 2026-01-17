/**
 * Test the actual attractions query functions
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTopRatedAttractions(limit = 8) {
  console.log(`\n🔍 Testing getTopRatedAttractions(${limit})...\n`);

  const { data: attractions, error } = await supabase
    .from('attractions')
    .select(`
      id,
      slug,
      name,
      short_description,
      area,
      hero_image,
      google_rating,
      google_review_count,
      total_reviews_aggregated,
      attraction_category_ids,
      age_suitability
    `)
    .eq('active', true)
    .not('google_rating', 'is', null)
    .gte('google_rating', 4.0)
    .order('google_rating', { ascending: false })
    .order('total_reviews_aggregated', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ Error fetching top rated attractions:', error);
    return [];
  }

  console.log(`✅ Found ${attractions?.length || 0} attractions\n`);

  if (attractions && attractions.length > 0) {
    console.log('Results:');
    for (const attraction of attractions) {
      console.log(`  - ${attraction.name}`);
      console.log(`    Slug: ${attraction.slug}`);
      console.log(`    Area: ${attraction.area}`);
      console.log(`    Rating: ${attraction.google_rating}/5`);
      console.log(`    Reviews: ${attraction.google_review_count || attraction.total_reviews_aggregated || 0}`);
      console.log(`    Categories: ${attraction.attraction_category_ids || 'None'}`);
      console.log(`    Hero Image: ${attraction.hero_image ? 'Yes' : 'No'}`);
      console.log('');

      // Fetch categories
      if (attraction.attraction_category_ids && attraction.attraction_category_ids.length > 0) {
        const { data: categories, error: catError } = await supabase
          .from('attraction_categories')
          .select('id, name, slug')
          .in('id', attraction.attraction_category_ids);

        if (!catError && categories && categories.length > 0) {
          console.log(`    Categories: ${categories.map(c => c.name).join(', ')}`);
        }
      }
    }
  } else {
    console.log('⚠️  No attractions found!');
    console.log('\nLet me check the raw query without filters:');

    const { data: rawAttractions, error: rawError } = await supabase
      .from('attractions')
      .select('id, name, google_rating, active')
      .limit(5);

    if (!rawError && rawAttractions) {
      console.log('\nFirst 5 attractions (no filters):');
      rawAttractions.forEach(a => {
        console.log(`  - ${a.name}: rating=${a.google_rating}, active=${a.active}`);
      });
    }
  }

  return attractions || [];
}

async function testQueries() {
  try {
    await getTopRatedAttractions(8);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testQueries();