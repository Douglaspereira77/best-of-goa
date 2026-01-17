/**
 * Test the governorate query for attractions
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getGovernoratesWithStats() {
  console.log('\nðŸ” Testing getGovernoratesWithStats()...\n');

  // Hardcoded governorates based on Goa's administrative divisions
  const governorates = [
    { id: 'goa-city', name: 'Goa City', slug: 'goa-city', areas: ['Goa City', 'Sharq', 'Dasma', 'Dasman', 'Murouj', 'Salmiya'] },
    { id: 'hawalli', name: 'Hawalli', slug: 'hawalli', areas: ['Hawalli', 'Salmiya', 'Rumaithiya', 'Jabriya', 'Mishref', 'Bayan', 'Salwa'] },
    { id: 'farwaniya', name: 'Al Farwaniyah', slug: 'farwaniya', areas: ['Farwaniya', 'Khaitan', 'Andalous', 'Rai'] },
    { id: 'ahmadi', name: 'Al Ahmadi', slug: 'ahmadi', areas: ['Ahmadi', 'Fintas', 'Fahaheel', 'Mahboula', 'Mangaf'] },
    { id: 'jahra', name: 'Al Jahra', slug: 'jahra', areas: ['Jahra', 'Sulaibiya', 'Saad Al Abdullah', 'Qasr', 'Jibla'] },
    { id: 'mubarak-al-kabeer', name: 'Mubarak Al-Kabeer', slug: 'mubarak-al-kabeer', areas: ['Abu Halifa', 'Abu Fatira', 'Sabah Al Salem', 'Adan', 'Qurain', 'Qusour', 'Messila'] }
  ];

  console.log('Testing each governorate:\n');

  // Get stats for each governorate
  const governoratesWithStats = await Promise.all(
    governorates.map(async (gov) => {
      console.log(`ðŸ“ ${gov.name} (${gov.slug}):`);
      console.log(`   Areas: ${gov.areas.join(', ')}`);

      // Get attractions in areas that belong to this governorate
      const { data: attractions, error: attrError } = await supabase
        .from('attractions')
        .select('id, google_rating, area')
        .eq('active', true)
        .in('area', gov.areas);

      if (attrError) {
        console.error(`   âŒ Error: ${attrError.message}`);
        return {
          ...gov,
          attraction_count: 0,
          avg_rating: 0
        };
      }

      // Calculate stats
      const count = attractions?.length || 0;
      console.log(`   âœ… Found ${count} attractions`);

      if (attractions && attractions.length > 0) {
        console.log('   Attractions:');
        attractions.forEach(a => {
          console.log(`      - ${a.area}: Rating ${a.google_rating || 'N/A'}`);
        });
      }

      const ratingsArray = attractions
        ?.map(r => r.google_rating)
        .filter(r => r !== null && r !== undefined) || [];

      const avgRating = ratingsArray.length > 0
        ? ratingsArray.reduce((sum, r) => sum + r, 0) / ratingsArray.length
        : 0;

      console.log(`   ðŸ“Š Average Rating: ${avgRating.toFixed(1)}\n`);

      return {
        id: gov.id,
        name: gov.name,
        slug: gov.slug,
        attraction_count: count,
        avg_rating: avgRating
      };
    })
  );

  console.log('\nðŸ“‹ Final Results:\n');
  governoratesWithStats.forEach(gov => {
    console.log(`${gov.name}: ${gov.attraction_count} attractions, ${gov.avg_rating.toFixed(1)} avg rating`);
  });

  // Also check what areas we have in the database
  console.log('\n\nðŸ” Checking all unique areas in database:\n');
  const { data: allAttractions, error } = await supabase
    .from('attractions')
    .select('area, id')
    .eq('active', true);

  if (!error && allAttractions) {
    const uniqueAreas = [...new Set(allAttractions.map(a => a.area))].sort();
    console.log(`Found ${uniqueAreas.length} unique areas:`);
    uniqueAreas.forEach(area => {
      const count = allAttractions.filter(a => a.area === area).length;
      console.log(`  - ${area}: ${count} attractions`);
    });
  }

  return governoratesWithStats;
}

async function testQueries() {
  try {
    await getGovernoratesWithStats();
  } catch (error) {
    console.error('âŒ Test failed:', error);
  }
}

testQueries();
