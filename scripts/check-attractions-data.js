/**
 * Check what attractions data exists in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAttractionsData() {
  console.log('🔍 Checking attractions data...\n');

  try {
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('attractions')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    console.log(`📊 Total attractions in database: ${totalCount}\n`);

    // Get active attractions
    const { count: activeCount, error: activeError } = await supabase
      .from('attractions')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    if (activeError) throw activeError;

    console.log(`✅ Active attractions: ${activeCount}\n`);

    // Get attractions with ratings
    const { data: ratedAttractions, error: ratedError } = await supabase
      .from('attractions')
      .select('id, name, google_rating, area, active')
      .eq('active', true)
      .not('google_rating', 'is', null)
      .order('google_rating', { ascending: false });

    if (ratedError) throw ratedError;

    console.log(`⭐ Attractions with ratings: ${ratedAttractions?.length || 0}\n`);

    if (ratedAttractions && ratedAttractions.length > 0) {
      console.log('Top rated attractions:');
      ratedAttractions.slice(0, 5).forEach((attr, i) => {
        console.log(`  ${i + 1}. ${attr.name} - ${attr.google_rating}/5 (${attr.area}) [Active: ${attr.active}]`);
      });
      console.log('');
    }

    // Get attractions with rating >= 4.0
    const { data: topRatedAttractions, error: topRatedError } = await supabase
      .from('attractions')
      .select('id, name, google_rating, area, active')
      .eq('active', true)
      .gte('google_rating', 4.0)
      .order('google_rating', { ascending: false });

    if (topRatedError) throw topRatedError;

    console.log(`🌟 Attractions with rating >= 4.0: ${topRatedAttractions?.length || 0}\n`);

    if (topRatedAttractions && topRatedAttractions.length > 0) {
      console.log('All attractions with rating >= 4.0:');
      topRatedAttractions.forEach((attr, i) => {
        console.log(`  ${i + 1}. ${attr.name} - ${attr.google_rating}/5 (${attr.area})`);
      });
      console.log('');
    }

    // Get all attractions (to see what's there)
    const { data: allAttractions, error: allError } = await supabase
      .from('attractions')
      .select('id, name, google_rating, area, active')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) throw allError;

    console.log('📋 Recent attractions (last 10):');
    if (allAttractions && allAttractions.length > 0) {
      allAttractions.forEach((attr, i) => {
        console.log(`  ${i + 1}. ${attr.name} - Rating: ${attr.google_rating || 'N/A'} (${attr.area}) [Active: ${attr.active}]`);
      });
    } else {
      console.log('  No attractions found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkAttractionsData();