require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Generate comprehensive extraction report for a restaurant
 */
async function generateExtractionReport(restaurantIdOrName) {
  console.log('📊 GENERATING EXTRACTION REPORT\n');
  console.log('='.repeat(80));

  // Step 1: Get restaurant
  let restaurant;
  if (restaurantIdOrName.includes('-') && restaurantIdOrName.length === 36) {
    // Assume it's an ID (UUID format)
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantIdOrName)
      .single();
    
    if (error || !data) {
      console.error('❌ Restaurant not found by ID:', restaurantIdOrName);
      return;
    }
    restaurant = data;
  } else {
    // Assume it's a name search
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .ilike('name', `%${restaurantIdOrName}%`);

    if (error || !restaurants || restaurants.length === 0) {
      console.error('❌ Restaurant not found:', restaurantIdOrName);
      return;
    }

    if (restaurants.length > 1) {
      console.log(`⚠️  Found ${restaurants.length} restaurants. Using first match.\n`);
    }
    restaurant = restaurants[0];
  }

  console.log(`\n📍 RESTAURANT: ${restaurant.name}`);
  console.log(`   ID: ${restaurant.id}`);
  console.log(`   Slug: ${restaurant.slug}`);
  console.log(`   Status: ${restaurant.status}`);
  console.log('='.repeat(80));

  // Step 2: Get related data
  const [dishes, faqs, images, cuisines, categories, features, meals, goodFor, neighborhood] = await Promise.all([
    supabase.from('restaurants_dishes').select('id, name').eq('restaurant_id', restaurant.id),
    supabase.from('restaurants_faqs').select('id, question').eq('restaurant_id', restaurant.id),
    supabase.from('restaurants_images').select('id, url, type').eq('restaurant_id', restaurant.id),
    restaurant.restaurant_cuisine_ids?.length > 0 
      ? supabase.from('restaurants_cuisines').select('id, name').in('id', restaurant.restaurant_cuisine_ids)
      : Promise.resolve({ data: [] }),
    restaurant.restaurant_category_ids?.length > 0
      ? supabase.from('restaurants_categories').select('id, name').in('id', restaurant.restaurant_category_ids)
      : Promise.resolve({ data: [] }),
    restaurant.restaurant_feature_ids?.length > 0
      ? supabase.from('restaurants_features').select('id, name').in('id', restaurant.restaurant_feature_ids)
      : Promise.resolve({ data: [] }),
    restaurant.restaurant_meal_ids?.length > 0
      ? supabase.from('restaurants_meals').select('id, name').in('id', restaurant.restaurant_meal_ids)
      : Promise.resolve({ data: [] }),
    restaurant.restaurant_good_for_ids?.length > 0
      ? supabase.from('restaurants_good_for').select('id, name').in('id', restaurant.restaurant_good_for_ids)
      : Promise.resolve({ data: [] }),
    restaurant.neighborhood_id
      ? supabase.from('restaurant_neighborhoods').select('id, name').eq('id', restaurant.neighborhood_id).single()
      : Promise.resolve({ data: null })
  ]);

  // Step 3: Define field categories
  const fieldCategories = {
    'CORE IDENTITY': {
      name: { label: 'Name', value: restaurant.name, source: 'manual' },
      slug: { label: 'Slug', value: restaurant.slug, source: 'generated' },
      name_ar: { label: 'Arabic Name', value: restaurant.name_ar, source: 'apify' },
      status: { label: 'Status', value: restaurant.status, source: 'system' }
    },
    'LOCATION': {
      address: { label: 'Address', value: restaurant.address, source: 'apify' },
      area: { label: 'Area', value: restaurant.area, source: 'apify' },
      latitude: { label: 'Latitude', value: restaurant.latitude, source: 'apify' },
      longitude: { label: 'Longitude', value: restaurant.longitude, source: 'apify' },
      google_place_id: { label: 'Google Place ID', value: restaurant.google_place_id, source: 'apify' },
      postal_code: { label: 'Postal Code', value: restaurant.postal_code, source: 'apify' },
      neighborhood_id: { 
        label: 'Neighborhood', 
        value: neighborhood.data ? neighborhood.data.name : null,
        ids: restaurant.neighborhood_id,
        source: 'data_mapping' 
      },
      mall_name: { label: 'Mall Name', value: restaurant.mall_name, source: 'apify' },
      mall_floor: { label: 'Mall Floor', value: restaurant.mall_floor, source: 'apify' },
      nearby_landmarks: { label: 'Nearby Landmarks', value: restaurant.nearby_landmarks, source: 'apify' }
    },
    'CONTACT': {
      phone: { label: 'Phone', value: restaurant.phone, source: 'apify' },
      email: { label: 'Email', value: restaurant.email, source: 'firecrawl' },
      website: { label: 'Website', value: restaurant.website, source: 'apify/firecrawl' },
      instagram: { label: 'Instagram', value: restaurant.instagram, source: 'firecrawl' },
      facebook: { label: 'Facebook', value: restaurant.facebook, source: 'firecrawl' },
      twitter: { label: 'Twitter', value: restaurant.twitter, source: 'firecrawl' },
      whatsapp: { label: 'WhatsApp', value: restaurant.whatsapp, source: 'firecrawl' }
    },
    'PRICING': {
      price_level: { label: 'Price Level', value: restaurant.price_level ? `$${'$'.repeat(restaurant.price_level - 1)}` : null, source: 'apify' },
      currency: { label: 'Currency', value: restaurant.currency, source: 'system' },
      average_meal_price: { label: 'Average Meal Price', value: restaurant.average_meal_price, source: 'apify' }
    },
    'DESCRIPTIONS': {
      description: { label: 'Description', value: restaurant.description ? restaurant.description.substring(0, 100) + '...' : null, full: restaurant.description, source: 'ai_enhancement' },
      description_ar: { label: 'Arabic Description', value: restaurant.description_ar ? restaurant.description_ar.substring(0, 100) + '...' : null, full: restaurant.description_ar, source: 'ai_enhancement' },
      short_description: { label: 'Short Description', value: restaurant.short_description, source: 'ai_enhancement' }
    },
    'IMAGES': {
      hero_image: { label: 'Hero Image', value: restaurant.hero_image ? '✓ Set' : null, source: 'image_extraction' },
      logo_image: { label: 'Logo Image', value: restaurant.logo_image ? '✓ Set' : null, source: 'image_extraction' },
      total_images: { label: 'Total Images', value: images.data?.length || 0, source: 'image_extraction' }
    },
    'RATINGS': {
      overall_rating: { label: 'Overall Rating', value: restaurant.overall_rating, source: 'calculated' },
      total_reviews_aggregated: { label: 'Total Reviews', value: restaurant.total_reviews_aggregated, source: 'apify' },
      google_rating: { label: 'Google Rating', value: restaurant.google_rating, source: 'apify' },
      google_review_count: { label: 'Google Review Count', value: restaurant.google_review_count, source: 'apify' },
      tripadvisor_rating: { label: 'TripAdvisor Rating', value: restaurant.tripadvisor_rating, source: 'firecrawl' },
      tripadvisor_review_count: { label: 'TripAdvisor Review Count', value: restaurant.tripadvisor_review_count, source: 'firecrawl' },
      rating_breakdown: { label: 'Rating Breakdown', value: restaurant.rating_breakdown ? '✓ Set' : null, source: 'apify' }
    },
    'SENTIMENT': {
      review_sentiment: { label: 'Review Sentiment', value: restaurant.review_sentiment ? restaurant.review_sentiment.substring(0, 100) + '...' : null, full: restaurant.review_sentiment, source: 'ai_sentiment' },
      review_sentiment_updated_at: { label: 'Sentiment Updated', value: restaurant.review_sentiment_updated_at, source: 'ai_sentiment' }
    },
    'OPERATIONAL': {
      hours: { label: 'Hours', value: restaurant.hours ? '✓ Set' : null, full: restaurant.hours, source: 'apify' },
      menu_url: { label: 'Menu URL', value: restaurant.menu_url, source: 'apify' },
      dress_code: { label: 'Dress Code', value: restaurant.dress_code, source: 'ai_enhancement' },
      reservations_policy: { label: 'Reservations Policy', value: restaurant.reservations_policy, source: 'ai_enhancement' },
      reservation_url: { label: 'Reservation URL', value: restaurant.reservation_url, source: 'firecrawl' },
      parking_info: { label: 'Parking Info', value: restaurant.parking_info, source: 'ai_enhancement' },
      public_transport: { label: 'Public Transport', value: restaurant.public_transport, source: 'ai_enhancement' },
      payment_methods: { label: 'Payment Methods', value: restaurant.payment_methods, source: 'ai_enhancement' },
      average_visit_time_mins: { label: 'Average Visit Time (mins)', value: restaurant.average_visit_time_mins, source: 'apify' },
      busy_times: { label: 'Busy Times', value: restaurant.busy_times ? '✓ Set' : null, source: 'apify' }
    },
    'RELATIONSHIPS': {
      cuisines: { 
        label: 'Cuisines', 
        value: cuisines.data?.map(c => c.name).join(', ') || 'None',
        count: restaurant.restaurant_cuisine_ids?.length || 0,
        source: 'data_mapping' 
      },
      categories: { 
        label: 'Categories', 
        value: categories.data?.map(c => c.name).join(', ') || 'None',
        count: restaurant.restaurant_category_ids?.length || 0,
        source: 'data_mapping' 
      },
      features: { 
        label: 'Features', 
        value: features.data?.map(f => f.name).join(', ') || 'None',
        count: restaurant.restaurant_feature_ids?.length || 0,
        source: 'data_mapping' 
      },
      meals: { 
        label: 'Meals', 
        value: meals.data?.map(m => m.name).join(', ') || 'None',
        count: restaurant.restaurant_meal_ids?.length || 0,
        source: 'data_mapping' 
      },
      good_for: { 
        label: 'Good For', 
        value: goodFor.data?.map(g => g.name).join(', ') || 'None',
        count: restaurant.restaurant_good_for_ids?.length || 0,
        source: 'data_mapping' 
      },
      michelin_award: { 
        label: 'Michelin Award', 
        value: restaurant.michelin_guide_award_id ? `ID: ${restaurant.michelin_guide_award_id}` : 'None',
        source: 'data_mapping' 
      }
    },
    'CONTENT': {
      dishes: { 
        label: 'Dishes', 
        value: dishes.data?.length || 0,
        source: 'ai_enhancement' 
      },
      faqs: { 
        label: 'FAQs', 
        value: faqs.data?.length || 0,
        source: 'ai_enhancement' 
      }
    }
  };

  // Step 4: Calculate statistics
  const stats = {
    totalFields: 0,
    populatedFields: 0,
    emptyFields: 0,
    bySource: {},
    completeness: 0
  };

  // Step 5: Generate report
  console.log('\n📋 EXTRACTION REPORT\n');
  console.log('='.repeat(80));

  for (const [categoryName, fields] of Object.entries(fieldCategories)) {
    console.log(`\n${categoryName}:`);
    console.log('-'.repeat(80));

    for (const [fieldKey, field] of Object.entries(fields)) {
      stats.totalFields++;
      const hasValue = field.value !== null && field.value !== undefined && field.value !== '';
      
      if (hasValue) {
        stats.populatedFields++;
      } else {
        stats.emptyFields++;
      }

      // Track by source
      if (!stats.bySource[field.source]) {
        stats.bySource[field.source] = { total: 0, populated: 0 };
      }
      stats.bySource[field.source].total++;
      if (hasValue) {
        stats.bySource[field.source].populated++;
      }

      const status = hasValue ? '✅' : '❌';
      const displayValue = hasValue ? (typeof field.value === 'object' ? JSON.stringify(field.value).substring(0, 50) : String(field.value).substring(0, 80)) : 'EMPTY';
      
      console.log(`  ${status} ${field.label.padEnd(30)} ${displayValue.padEnd(50)} [${field.source}]`);
      
      if (field.count !== undefined) {
        console.log(`     └─ Count: ${field.count}`);
      }
    }
  }

  // Step 6: Show extraction step status
  const jobProgress = restaurant.job_progress || {};
  const steps = [
    'apify_fetch',
    'firecrawl_general',
    'firecrawl_menu',
    'firecrawl_website',
    'apify_reviews',
    'firecrawl_tripadvisor',
    'firecrawl_opentable',
    'process_images',
    'ai_sentiment',
    'ai_enhancement',
    'data_mapping'
  ];

  console.log('\n\n🔧 EXTRACTION STEP STATUS:');
  console.log('='.repeat(80));

  for (const step of steps) {
    const stepData = jobProgress[step];
    if (stepData) {
      const statusIcon = stepData.status === 'completed' ? '✅' : stepData.status === 'failed' ? '❌' : stepData.status === 'running' ? '🔄' : '⏳';
      console.log(`  ${statusIcon} ${step.padEnd(25)} ${stepData.status || 'pending'}`);
      if (stepData.error) {
        console.log(`     └─ Error: ${stepData.error}`);
      }
      if (stepData.completed_at) {
        console.log(`     └─ Completed: ${new Date(stepData.completed_at).toLocaleString()}`);
      }
    } else {
      console.log(`  ⏳ ${step.padEnd(25)} pending (not started)`);
    }
  }

  // Step 7: Show statistics
  stats.completeness = Math.round((stats.populatedFields / stats.totalFields) * 100);

  console.log('\n\n📊 STATISTICS:');
  console.log('='.repeat(80));
  console.log(`  Total Fields: ${stats.totalFields}`);
  console.log(`  Populated: ${stats.populatedFields} (${stats.completeness}%)`);
  console.log(`  Empty: ${stats.emptyFields} (${100 - stats.completeness}%)`);

  console.log('\n📈 BY SOURCE:');
  for (const [source, sourceStats] of Object.entries(stats.bySource)) {
    const sourceCompleteness = Math.round((sourceStats.populated / sourceStats.total) * 100);
    console.log(`  ${source.padEnd(20)} ${sourceStats.populated}/${sourceStats.total} (${sourceCompleteness}%)`);
  }

  // Step 8: Show raw data availability
  console.log('\n\n💾 RAW DATA AVAILABILITY:');
  console.log('='.repeat(80));
  console.log(`  Apify Output: ${restaurant.apify_output ? '✅ Available' : '❌ Missing'}`);
  console.log(`  Firecrawl Output: ${restaurant.firecrawl_output ? '✅ Available' : '❌ Missing'}`);
  console.log(`  Firecrawl Menu Output: ${restaurant.firecrawl_menu_output ? '✅ Available' : '❌ Missing'}`);
  console.log(`  AI Enhancement Output: ${restaurant.ai_enhancement_output ? '✅ Available' : '❌ Missing'}`);

  console.log('\n\n' + '='.repeat(80));
  console.log('✅ Report Complete');
  console.log('='.repeat(80));
}

// Get restaurant name/ID from command line
const restaurantIdOrName = process.argv[2];

if (!restaurantIdOrName) {
  console.error('Usage: node bin/generate-extraction-report.js <restaurant-name-or-id>');
  console.error('Example: node bin/generate-extraction-report.js rooftop');
  console.error('Example: node bin/generate-extraction-report.js ae5d833b-3431-4b34-8f36-0d998ed46581');
  process.exit(1);
}

generateExtractionReport(restaurantIdOrName).catch(console.error);

