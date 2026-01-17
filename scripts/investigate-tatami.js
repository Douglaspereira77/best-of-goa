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

(async () => {
  console.log('🔍 INVESTIGATING TATAMI JAPANESE RESTAURANT\n');
  console.log('='.repeat(80));

  // Find Tatami Japanese Restaurant
  const { data: tatami, error } = await supabase
    .from('restaurants')
    .select('*')
    .ilike('name', '%tatami%')
    .single();

  if (error) {
    console.error('❌ Error finding Tatami:', error);

    // Try to list all restaurants to see what we have
    console.log('\nLet me search for all restaurants with "japanese" in the name:');
    const { data: allJapanese } = await supabase
      .from('restaurants')
      .select('id, name, status, updated_at')
      .ilike('name', '%japanese%');

    if (allJapanese && allJapanese.length > 0) {
      console.log('\nFound Japanese restaurants:');
      allJapanese.forEach(r => {
        console.log(`- ${r.name} (${r.status}) - ${r.id}`);
      });
    }
    return;
  }

  console.log(`\n📊 RESTAURANT FOUND: ${tatami.name}`);
  console.log(`ID: ${tatami.id}`);
  console.log(`Status: ${tatami.status}`);
  console.log(`Updated: ${tatami.updated_at}`);
  console.log('='.repeat(80));

  // Check what fields have data
  console.log('\n📋 DATA PRESENCE CHECK:');
  console.log('─'.repeat(80));

  const fieldsToCheck = [
    'apify_output',
    'firecrawl_output',
    'firecrawl_menu_output',
    'menu_data',
    'description',
    'short_description',
    'meta_title',
    'meta_description',
    'review_sentiment',
    'job_progress',
    'error_logs'
  ];

  fieldsToCheck.forEach(field => {
    const hasData = tatami[field] !== null && tatami[field] !== undefined;
    const emoji = hasData ? '✅' : '❌';
    let dataInfo = '';

    if (hasData) {
      if (typeof tatami[field] === 'object') {
        const keys = Object.keys(tatami[field]);
        dataInfo = ` (${keys.length} keys)`;
      } else if (typeof tatami[field] === 'string') {
        dataInfo = ` (${tatami[field].length} chars)`;
      }
    }

    console.log(`${emoji} ${field}${dataInfo}`);
  });

  // Deep dive into apify_output structure
  if (tatami.apify_output) {
    console.log('\n🔍 APIFY_OUTPUT STRUCTURE:');
    console.log('─'.repeat(80));

    const apifyKeys = Object.keys(tatami.apify_output);
    console.log(`Top-level keys: ${apifyKeys.join(', ')}`);

    // Check for reviews
    if (tatami.apify_output.reviews) {
      console.log(`\n📝 Reviews: ${tatami.apify_output.reviews.length} found`);
      if (tatami.apify_output.reviews.length > 0) {
        const firstReview = tatami.apify_output.reviews[0];
        console.log('\nFirst review structure:');
        console.log(`  - Reviewer: ${firstReview.name}`);
        console.log(`  - Stars: ${firstReview.stars}`);
        console.log(`  - Text length: ${firstReview.text?.length || 0} chars`);
        console.log(`  - Has context: ${firstReview.reviewContext ? 'Yes' : 'No'}`);
        console.log(`  - Has detailed rating: ${firstReview.reviewDetailedRating ? 'Yes' : 'No'}`);
        console.log(`  - Has images: ${firstReview.reviewImageUrls?.length || 0} images`);
      }
    } else {
      console.log('\n❌ No reviews array found');
    }

    // Check for images
    if (tatami.apify_output.images) {
      console.log(`\n🖼️ Images: ${tatami.apify_output.images.length} found`);
    } else {
      console.log('\n❌ No images array found');
    }

    // Basic restaurant info
    console.log('\n🏪 Restaurant Info from Apify:');
    console.log(`  - Title: ${tatami.apify_output.title || 'N/A'}`);
    console.log(`  - Address: ${tatami.apify_output.address || 'N/A'}`);
    console.log(`  - Phone: ${tatami.apify_output.phone || 'N/A'}`);
    console.log(`  - Price: ${tatami.apify_output.price || 'N/A'}`);
    console.log(`  - Total Score: ${tatami.apify_output.totalScore || 'N/A'}`);
    console.log(`  - Reviews Count: ${tatami.apify_output.reviewsCount || 'N/A'}`);
    console.log(`  - Category: ${tatami.apify_output.categoryName || 'N/A'}`);
  }

  // Check job_progress
  if (tatami.job_progress) {
    console.log('\n⏱️ JOB PROGRESS:');
    console.log('─'.repeat(80));

    const steps = [
      'apify_fetch',
      'firecrawl_general',
      'firecrawl_menu',
      'firecrawl_website',
      'apify_reviews',
      'firecrawl_tripadvisor',
      'firecrawl_opentable',
      'ai_sentiment',
      'ai_enhancement',
      'data_mapping'
    ];

    steps.forEach(step => {
      const stepData = tatami.job_progress[step];
      if (stepData) {
        const status = stepData.status || 'unknown';
        const emoji = status === 'completed' ? '✅' :
                     status === 'failed' ? '❌' :
                     status === 'running' ? '🔄' : '⏳';
        console.log(`${emoji} ${step}: ${status}`);
        if (stepData.error) {
          console.log(`   └─ Error: ${stepData.error}`);
        }
      } else {
        console.log(`⏳ ${step}: pending`);
      }
    });
  }

  // Save full data to file
  fs.writeFileSync('tatami-full-data.json', JSON.stringify(tatami, null, 2), 'utf-8');
  console.log('\n\n💾 Full data saved to: tatami-full-data.json');

  // Save just apify_output for easier comparison
  if (tatami.apify_output) {
    fs.writeFileSync('tatami-apify-output.json', JSON.stringify(tatami.apify_output, null, 2), 'utf-8');
    console.log('💾 Apify output saved to: tatami-apify-output.json');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ INVESTIGATION COMPLETE');
  console.log('='.repeat(80));
})();
