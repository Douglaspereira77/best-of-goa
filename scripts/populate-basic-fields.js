// Populate Basic Fields Migration Script
// Updates ALL restaurants with phone, website, and other basic fields from apify_output
// This fixes the issue where price_level=0 constraint violation prevented field updates

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

// Map price level - NOW RETURNS NULL INSTEAD OF 0
function mapPriceLevel(price) {
  if (!price) return null;
  const priceMap = {
    '$': 1,
    '$$': 2,
    '$$$': 3,
    '$$$$': 4
  };
  return priceMap[price] || null;
}

// Map Apify fields to database structure
function mapApifyFieldsToDatabase(apifyData) {
  return {
    // Contact - THE PREVIOUSLY BROKEN FIELDS
    phone: apifyData?.phone || apifyData?.phoneUnformatted,
    website: apifyData?.website || apifyData?.url,
    email: apifyData?.email,

    // Basic info
    address: apifyData?.address || apifyData?.fullAddress,
    area: apifyData?.neighborhood || apifyData?.city || apifyData?.area,

    // Location
    latitude: apifyData?.location?.lat || apifyData?.latitude,
    longitude: apifyData?.location?.lng || apifyData?.longitude,

    // Ratings
    google_rating: apifyData?.totalScore || apifyData?.rating,
    google_review_count: apifyData?.reviewsCount || 0,

    // Pricing - BUG FIX: NOW RETURNS NULL INSTEAD OF 0
    price_level: mapPriceLevel(apifyData?.price),

    // Update timestamp
    updated_at: new Date().toISOString()
  };
}

async function populateBasicFields() {
  console.log('🚀 Basic Fields Population - Processing ALL Restaurants\n');
  console.log('This script fixes restaurants affected by the price_level=0 bug\n');
  console.log('='.repeat(80));

  // Get all active restaurants with apify_output
  console.log('\n📊 Step 1: Fetching restaurants...');
  const { data: restaurants, error: fetchError } = await supabase
    .from('restaurants')
    .select('id, name, phone, website, email, address, apify_output')
    .eq('status', 'active')
    .not('apify_output', 'is', null);

  if (fetchError) {
    console.error('❌ Error fetching restaurants:', fetchError);
    return;
  }

  console.log(`✅ Found ${restaurants.length} restaurants with Apify data\n`);

  // Process each restaurant
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
      const apifyData = restaurant.apify_output;

      // Check current state
      console.log('\n📊 Current Database State:');
      console.log('   phone:', restaurant.phone || '(empty)');
      console.log('   website:', restaurant.website || '(empty)');
      console.log('   email:', restaurant.email || '(empty)');
      console.log('   address:', restaurant.address ? restaurant.address.substring(0, 50) + '...' : '(empty)');

      // Check what Apify has
      console.log('\n📊 Apify Data Available:');
      const hasPhone = apifyData?.phone || apifyData?.phoneUnformatted;
      const hasWebsite = apifyData?.website || apifyData?.url;
      const hasEmail = apifyData?.email;
      const hasAddress = apifyData?.address || apifyData?.fullAddress;

      console.log('   phone:', hasPhone || '(none)');
      console.log('   website:', hasWebsite || '(none)');
      console.log('   email:', hasEmail || '(none)');
      console.log('   address:', hasAddress ? hasAddress.substring(0, 50) + '...' : '(none)');

      // Determine if updates needed
      const needsPhoneUpdate = hasPhone && !restaurant.phone;
      const needsWebsiteUpdate = hasWebsite && !restaurant.website;
      const needsEmailUpdate = hasEmail && !restaurant.email;
      const needsAddressUpdate = hasAddress && !restaurant.address;

      console.log('\n🔍 Updates Needed:');
      console.log('   phone:', needsPhoneUpdate ? '✅ YES' : '❌ NO');
      console.log('   website:', needsWebsiteUpdate ? '✅ YES' : '❌ NO');
      console.log('   email:', needsEmailUpdate ? '✅ YES' : '❌ NO');
      console.log('   address:', needsAddressUpdate ? '✅ YES' : '❌ NO');

      const hasUpdates = needsPhoneUpdate || needsWebsiteUpdate || needsEmailUpdate || needsAddressUpdate;

      if (!hasUpdates) {
        console.log('\n   ⏭️  SKIPPED - All basic fields already populated');
        results.skipped++;
        results.details.push({
          name: restaurant.name,
          status: 'skipped',
          reason: 'All fields already populated'
        });
        continue;
      }

      // Map all fields
      const mappedData = mapApifyFieldsToDatabase(apifyData);

      console.log('\n🔧 Mapped Data:');
      console.log('   phone:', mappedData.phone || '(none)');
      console.log('   website:', mappedData.website || '(none)');
      console.log('   email:', mappedData.email || '(none)');
      console.log('   price_level:', mappedData.price_level === null ? 'null (no constraint violation)' : mappedData.price_level);

      // Update restaurant
      console.log('\n🚀 Updating...');
      const { data: updateResult, error: updateError } = await supabase
        .from('restaurants')
        .update(mappedData)
        .eq('id', restaurant.id)
        .select();

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
        console.log('\n📊 New Values:');
        console.log('   phone:', updateResult[0].phone || '(empty)');
        console.log('   website:', updateResult[0].website || '(empty)');
        console.log('   email:', updateResult[0].email || '(empty)');
        console.log('   address:', updateResult[0].address ? updateResult[0].address.substring(0, 50) + '...' : '(empty)');

        results.updated++;
        results.details.push({
          name: restaurant.name,
          status: 'updated',
          phone_updated: needsPhoneUpdate && updateResult[0].phone,
          website_updated: needsWebsiteUpdate && updateResult[0].website,
          email_updated: needsEmailUpdate && updateResult[0].email,
          address_updated: needsAddressUpdate && updateResult[0].address
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
  console.log('\n📊 MIGRATION SUMMARY:\n');
  console.log(`Total restaurants: ${results.total}`);
  console.log(`✅ Updated: ${results.updated}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);

  console.log('\n📋 Detailed Breakdown:\n');

  const updated = results.details.filter(d => d.status === 'updated');
  if (updated.length > 0) {
    console.log(`✅ Successfully Updated (${updated.length}):`);
    updated.forEach(d => {
      console.log(`   - ${d.name}`);
      console.log(`     phone: ${d.phone_updated ? 'POPULATED' : 'unchanged'}`);
      console.log(`     website: ${d.website_updated ? 'POPULATED' : 'unchanged'}`);
      console.log(`     email: ${d.email_updated ? 'POPULATED' : 'unchanged'}`);
      console.log(`     address: ${d.address_updated ? 'POPULATED' : 'unchanged'}`);
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
  console.log('\n✅ BASIC FIELDS MIGRATION COMPLETE!\n');
  console.log('Summary:');
  console.log(`- Fixed ${results.updated} restaurants affected by the price_level bug`);
  console.log('- Phone and website fields now properly populated from Apify data');
  console.log('- price_level now returns null instead of 0, preventing constraint violations');
  console.log('\n' + '='.repeat(80));
}

populateBasicFields().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
