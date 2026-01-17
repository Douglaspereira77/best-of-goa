/**
 * Publish Top 50 Fitness Places
 * 
 * Sets active = true for all top 50 fitness places to make them live
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function publishTop50() {
  console.log('🚀 Publishing Top 50 Fitness Places');
  console.log('='.repeat(60) + '\n');

  // Get top 50 fitness places by review count
  const { data: fitnessPlaces, error: fetchError } = await supabase
    .from('fitness_places')
    .select('id, name, slug, area, active, verified')
    .not('google_rating', 'is', null)
    .not('google_place_id', 'is', null)
    .order('google_review_count', { ascending: false })
    .limit(50);

  if (fetchError) {
    console.error('❌ Error fetching fitness places:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${fitnessPlaces.length} fitness places\n`);

  // Check current status
  const currentlyActive = fitnessPlaces.filter(fp => fp.active).length;
  const currentlyInactive = fitnessPlaces.filter(fp => !fp.active).length;
  const currentlyVerified = fitnessPlaces.filter(fp => fp.verified).length;

  console.log('📊 CURRENT STATUS');
  console.log('='.repeat(60));
  console.log(`✅ Active:    ${currentlyActive}/${fitnessPlaces.length}`);
  console.log(`❌ Inactive:  ${currentlyInactive}/${fitnessPlaces.length}`);
  console.log(`✓ Verified:  ${currentlyVerified}/${fitnessPlaces.length}`);
  console.log('');

  // Get IDs of places to update
  const idsToUpdate = fitnessPlaces.map(fp => fp.id);

  // Update all to active = true and verified = true
  const { data: updated, error: updateError } = await supabase
    .from('fitness_places')
    .update({
      active: true,
      verified: true,
      updated_at: new Date().toISOString()
    })
    .in('id', idsToUpdate)
    .select('id, name, slug, active, verified');

  if (updateError) {
    console.error('❌ Error updating fitness places:', updateError);
    process.exit(1);
  }

  console.log('✅ PUBLICATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Published: ${updated.length} fitness places`);
  console.log('');

  // Show sample of published places
  console.log('📋 SAMPLE OF PUBLISHED PLACES');
  console.log('='.repeat(60));
  updated.slice(0, 10).forEach((fp, i) => {
    console.log(`${i + 1}. ${fp.name}`);
    console.log(`   Slug: ${fp.slug}`);
    console.log(`   Active: ${fp.active ? '✅' : '❌'} | Verified: ${fp.verified ? '✓' : '✗'}`);
  });
  if (updated.length > 10) {
    console.log(`   ... and ${updated.length - 10} more`);
  }
  console.log('');

  // Verify the update
  const { data: verifyData, error: verifyError } = await supabase
    .from('fitness_places')
    .select('id, active, verified')
    .in('id', idsToUpdate);

  if (verifyError) {
    console.error('⚠️  Warning: Could not verify update:', verifyError);
  } else {
    const allActive = verifyData.every(fp => fp.active === true);
    const allVerified = verifyData.every(fp => fp.verified === true);
    
    console.log('🔍 VERIFICATION');
    console.log('='.repeat(60));
    console.log(`All Active:   ${allActive ? '✅' : '❌'}`);
    console.log(`All Verified: ${allVerified ? '✅' : '❌'}`);
    console.log('');

    if (allActive && allVerified) {
      console.log('🎉 SUCCESS! All 50 fitness places are now live and published!');
      console.log('');
      console.log('💡 Next Steps:');
      console.log('   - Visit: http://localhost:3000/things-to-do/fitness');
      console.log('   - Check individual pages: http://localhost:3000/things-to-do/fitness/[slug]');
      console.log('   - All places are now visible on the site');
    }
  }
  console.log('');
}

publishTop50()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });































