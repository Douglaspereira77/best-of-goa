// Analyze what data is available in Apify and Firecrawl outputs
// and can be mapped to empty database fields
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

async function analyzeDataSources() {
  console.log('🔍 DATA SOURCE ANALYSIS - What can we populate?\n');
  console.log('='.repeat(80));

  // Get all restaurants
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, apify_output, firecrawl_output, firecrawl_menu_output')
    .eq('status', 'active')
    .limit(3); // Just analyze 3 restaurants as samples

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n📊 Analyzing ${restaurants.length} sample restaurants\n`);

  restaurants.forEach((restaurant, idx) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`\n[${idx + 1}/${restaurants.length}] ${restaurant.name}`);
    console.log(`\n${'='.repeat(80)}`);

    const apify = restaurant.apify_output || {};
    const firecrawl = restaurant.firecrawl_output || {};
    const firecrawlMenu = restaurant.firecrawl_menu_output || {};

    // Analyze Apify data
    console.log('\n📊 APIFY OUTPUT - Available Fields:');
    console.log('─'.repeat(80));

    const apifyFields = {
      'Hours': {
        field: 'openingHours',
        sample: apify.openingHours ? JSON.stringify(apify.openingHours).substring(0, 100) : null
      },
      'Email': {
        field: 'email',
        sample: apify.email
      },
      'Price Range': {
        field: 'price',
        sample: apify.price
      },
      'Menu URL': {
        field: 'menu',
        sample: apify.menu
      },
      'Description': {
        field: 'description',
        sample: apify.description ? apify.description.substring(0, 100) : null
      },
      'Categories': {
        field: 'categoryName',
        sample: apify.categoryName
      },
      'Popular Times': {
        field: 'popularTimesHistogram',
        sample: apify.popularTimesHistogram ? '[Has data]' : null
      },
      'Reviews': {
        field: 'reviews',
        sample: apify.reviews ? `${apify.reviews.length} reviews` : null
      },
      'Images': {
        field: 'imageUrls',
        sample: apify.imageUrls ? `${apify.imageUrls.length} images` : null
      },
      'Permanently Closed': {
        field: 'permanentlyClosed',
        sample: apify.permanentlyClosed
      },
      'Temporarily Closed': {
        field: 'temporarilyClosed',
        sample: apify.temporarilyClosed
      }
    };

    Object.entries(apifyFields).forEach(([label, { field, sample }]) => {
      const status = sample ? '✅' : '❌';
      console.log(`   ${status} ${label.padEnd(25)} ${sample || '(none)'}`);
    });

    // Analyze Firecrawl data
    console.log('\n📊 FIRECRAWL OUTPUT - Available Fields:');
    console.log('─'.repeat(80));

    if (firecrawl.results && firecrawl.results.length > 0) {
      const result = firecrawl.results[0];
      console.log(`   ✅ Has ${firecrawl.results.length} result(s)`);

      console.log('\n   Social Media:');
      if (result.instagram_url) console.log(`      ✅ Instagram: ${result.instagram_url}`);
      if (result.facebook_url) console.log(`      ✅ Facebook: ${result.facebook_url}`);
      if (result.twitter_url) console.log(`      ✅ Twitter: ${result.twitter_url}`);

      console.log('\n   Other Data:');
      if (result.email) console.log(`      ✅ Email: ${result.email}`);
      if (result.website) console.log(`      ✅ Website: ${result.website}`);
      if (result.description) console.log(`      ✅ Description: ${result.description.substring(0, 80)}...`);
    } else {
      console.log('   ❌ No results');
    }

    // Analyze OpenTable data (from Firecrawl)
    console.log('\n📊 OPENTABLE DATA (from Firecrawl):');
    console.log('─'.repeat(80));

    if (firecrawl.opentable) {
      console.log('   ✅ Has OpenTable data');
      if (firecrawl.opentable.rating) console.log(`      Rating: ${firecrawl.opentable.rating}`);
      if (firecrawl.opentable.review_count) console.log(`      Reviews: ${firecrawl.opentable.review_count}`);
      if (firecrawl.opentable.url) console.log(`      URL: ${firecrawl.opentable.url}`);
    } else {
      console.log('   ❌ No OpenTable data');
    }

    // Analyze Menu data
    console.log('\n📊 MENU DATA (from Firecrawl):');
    console.log('─'.repeat(80));

    if (firecrawlMenu && firecrawlMenu.menu) {
      console.log('   ✅ Has menu data');
      if (firecrawlMenu.menu.sections) {
        console.log(`      Sections: ${firecrawlMenu.menu.sections.length}`);
      }
      if (firecrawlMenu.url) console.log(`      Menu URL: ${firecrawlMenu.url}`);
    } else {
      console.log('   ❌ No menu data');
    }
  });

  // Summary and recommendations
  console.log('\n' + '='.repeat(80));
  console.log('\n📋 MAPPING OPPORTUNITIES:\n');
  console.log('='.repeat(80));

  console.log('\n✅ Can populate from APIFY:');
  console.log('   • hours → openingHours');
  console.log('   • email → email');
  console.log('   • menu_url → menu');
  console.log('   • visit_time_mins → calculate from price/category');
  console.log('   • busy_times → popularTimesHistogram');
  console.log('   • hero_image → imageUrls[0]');
  console.log('   • total_reviews → reviews.length');

  console.log('\n✅ Can populate from FIRECRAWL:');
  console.log('   • instagram → results[0].instagram_url');
  console.log('   • facebook → results[0].facebook_url');
  console.log('   • twitter → results[0].twitter_url');
  console.log('   • email → results[0].email (backup)');
  console.log('   • description → results[0].description (backup)');

  console.log('\n✅ Can populate from FIRECRAWL OPENTABLE:');
  console.log('   • opentable_rating → opentable.rating');
  console.log('   • opentable_review_count → opentable.review_count');
  console.log('   • reservation_url → opentable.url');

  console.log('\n✅ Can populate from FIRECRAWL MENU:');
  console.log('   • menu_url → firecrawl_menu_output.url');

  console.log('\n⚠️  CANNOT populate (no data source):');
  console.log('   • dress_code (need manual entry or AI extraction)');
  console.log('   • kids_menu (need AI analysis of menu)');
  console.log('   • promotions (need manual entry)');
  console.log('   • tripadvisor_url (need separate API)');
  console.log('   • michelin_guide_award_id (need manual entry)');

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 RECOMMENDED ACTION PLAN:\n');

  console.log('Phase 2 Migration - Apify Advanced Fields:');
  console.log('   1. hours, visit_time_mins, busy_times');
  console.log('   2. email (if not in Apify, use Firecrawl)');
  console.log('   3. menu_url, hero_image, total_reviews');

  console.log('\nPhase 3 Migration - Firecrawl Social Media:');
  console.log('   1. instagram, facebook, twitter');
  console.log('   2. opentable_rating, opentable_review_count, reservation_url');

  console.log('\nPhase 4 - AI Enhancement (later):');
  console.log('   1. Analyze menu for kids_menu, dietary options');
  console.log('   2. Extract dress_code from descriptions/reviews');
  console.log('   3. Generate better descriptions if needed');

  console.log('\n' + '='.repeat(80));
}

analyzeDataSources().catch(error => {
  console.error('❌ Error:', error);
});
