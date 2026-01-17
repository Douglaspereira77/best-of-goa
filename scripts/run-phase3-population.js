// Phase 3 Population Script - Firecrawl Social Media & External Data
// Populates: instagram, facebook, twitter, opentable_rating, opentable_review_count
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function populatePhase3Fields() {
  console.log('🚀 Phase 3 Field Population - Firecrawl Social Media & External Data\n');
  console.log('Fields: instagram, facebook, twitter, opentable_rating, opentable_review_count, tripadvisor_rating, tripadvisor_review_count\n');
  console.log('='.repeat(80));

  // Get all active restaurants
  console.log('\n📊 Step 1: Fetching restaurants...');
  const { data: restaurants, error: fetchError } = await supabase
    .from('restaurants')
    .select('id, name, firecrawl_output, instagram, facebook, twitter, opentable_rating, opentable_review_count, tripadvisor_rating, tripadvisor_review_count')
    .eq('status', 'active')
    .not('firecrawl_output', 'is', null);

  if (fetchError) {
    console.error('❌ Error fetching restaurants:', fetchError);
    return;
  }

  console.log(`✅ Found ${restaurants.length} restaurants\n`);

  const results = {
    total: restaurants.length,
    updated: 0,
    skipped: 0,
    failed: 0,
    details: []
  };

  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    console.log(`\n[${i + 1}/${restaurants.length}] Processing: ${restaurant.name}`);
    console.log('─'.repeat(80));

    try {
      const firecrawlData = restaurant.firecrawl_output;
      const updateData = {};
      let hasUpdates = false;

      // Parse through results to find social media URLs
      const results = firecrawlData?.results;
      let instagramUrl = null;
      let facebookUrl = null;
      let twitterUrl = null;
      let tripadvisorUrl = null;

      if (Array.isArray(results)) {
        results.forEach(result => {
          const url = result.url || '';

          if (!instagramUrl && url.includes('instagram.com')) {
            instagramUrl = url;
          } else if (!facebookUrl && (url.includes('facebook.com') || url.includes('fb.com'))) {
            facebookUrl = url;
          } else if (!twitterUrl && (url.includes('twitter.com') || url.includes('x.com'))) {
            twitterUrl = url;
          } else if (!tripadvisorUrl && url.includes('tripadvisor.com')) {
            tripadvisorUrl = url;
          }
        });
      }

      // 1. Instagram
      if (!restaurant.instagram && instagramUrl) {
        updateData.instagram = instagramUrl;
        hasUpdates = true;
        console.log(`   ✅ instagram: ${instagramUrl}`);
      } else {
        console.log(`   ⏭️  instagram: ${restaurant.instagram ? 'Already set' : 'Not available'}`);
      }

      // 2. Facebook
      if (!restaurant.facebook && facebookUrl) {
        updateData.facebook = facebookUrl;
        hasUpdates = true;
        console.log(`   ✅ facebook: ${facebookUrl}`);
      } else {
        console.log(`   ⏭️  facebook: ${restaurant.facebook ? 'Already set' : 'Not available'}`);
      }

      // 3. Twitter
      if (!restaurant.twitter && twitterUrl) {
        updateData.twitter = twitterUrl;
        hasUpdates = true;
        console.log(`   ✅ twitter: ${twitterUrl}`);
      } else {
        console.log(`   ⏭️  twitter: ${restaurant.twitter ? 'Already set' : 'Not available'}`);
      }

      // 4. OpenTable rating
      if (!restaurant.opentable_rating && firecrawlData?.opentable?.rating) {
        updateData.opentable_rating = firecrawlData.opentable.rating;
        hasUpdates = true;
        console.log(`   ✅ opentable_rating: ${firecrawlData.opentable.rating}`);
      } else {
        console.log(`   ⏭️  opentable_rating: ${restaurant.opentable_rating ? 'Already set' : 'Not available'}`);
      }

      // 5. OpenTable review count
      if (!restaurant.opentable_review_count && firecrawlData?.opentable?.review_count) {
        updateData.opentable_review_count = firecrawlData.opentable.review_count;
        hasUpdates = true;
        console.log(`   ✅ opentable_review_count: ${firecrawlData.opentable.review_count}`);
      } else {
        console.log(`   ⏭️  opentable_review_count: ${restaurant.opentable_review_count ? 'Already set' : 'Not available'}`);
      }

      // 6. TripAdvisor rating
      if (!restaurant.tripadvisor_rating && firecrawlData?.tripadvisor?.rating) {
        updateData.tripadvisor_rating = firecrawlData.tripadvisor.rating;
        hasUpdates = true;
        console.log(`   ✅ tripadvisor_rating: ${firecrawlData.tripadvisor.rating}`);
      } else {
        console.log(`   ⏭️  tripadvisor_rating: ${restaurant.tripadvisor_rating ? 'Already set' : 'Not available'}`);
      }

      // 7. TripAdvisor review count
      if (!restaurant.tripadvisor_review_count && firecrawlData?.tripadvisor?.review_count) {
        updateData.tripadvisor_review_count = firecrawlData.tripadvisor.review_count;
        hasUpdates = true;
        console.log(`   ✅ tripadvisor_review_count: ${firecrawlData.tripadvisor.review_count}`);
      } else {
        console.log(`   ⏭️  tripadvisor_review_count: ${restaurant.tripadvisor_review_count ? 'Already set' : 'Not available'}`);
      }

      if (!hasUpdates) {
        console.log('\n   ⏭️  SKIPPED - All Phase 3 fields already populated or unavailable');
        results.skipped++;
        results.details.push({
          name: restaurant.name,
          status: 'skipped',
          reason: 'All fields already populated or unavailable'
        });
        continue;
      }

      // Add timestamp
      updateData.updated_at = new Date().toISOString();

      // Update restaurant
      console.log('\n   🚀 Updating database...');
      const { error: updateError } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', restaurant.id);

      if (updateError) {
        console.error('   ❌ UPDATE FAILED:', updateError.message);
        results.failed++;
        results.details.push({
          name: restaurant.name,
          status: 'failed',
          error: updateError.message
        });
      } else {
        console.log('   ✅ UPDATED SUCCESSFULLY');
        results.updated++;
        results.details.push({
          name: restaurant.name,
          status: 'updated',
          fields_updated: Object.keys(updateData).filter(k => k !== 'updated_at')
        });
      }

    } catch (error) {
      console.error('   ❌ ERROR:', error.message);
      results.failed++;
      results.details.push({
        name: restaurant.name,
        status: 'failed',
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 PHASE 3 MIGRATION SUMMARY:\n');
  console.log(`Total restaurants: ${results.total}`);
  console.log(`✅ Updated: ${results.updated}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);

  console.log('\n📋 Detailed Results:\n');

  const updated = results.details.filter(d => d.status === 'updated');
  if (updated.length > 0) {
    console.log(`✅ Successfully Updated (${updated.length}):`);
    updated.forEach(d => {
      console.log(`   - ${d.name}`);
      console.log(`     Fields: ${d.fields_updated.join(', ')}`);
    });
  }

  const skipped = results.details.filter(d => d.status === 'skipped');
  if (skipped.length > 0) {
    console.log(`\n⏭️  Skipped (${skipped.length}):`);
    skipped.forEach(d => {
      console.log(`   - ${d.name} (${d.reason})`);
    });
  }

  const failed = results.details.filter(d => d.status === 'failed');
  if (failed.length > 0) {
    console.log(`\n❌ Failed (${failed.length}):`);
    failed.forEach(d => {
      console.log(`   - ${d.name}: ${d.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ PHASE 3 MIGRATION COMPLETE!\n');
}

populatePhase3Fields().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
