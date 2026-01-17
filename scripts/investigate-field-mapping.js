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
  console.log('🔍 INVESTIGATING FIELD MAPPING ISSUES\n');
  console.log('='.repeat(80));

  // Get Tatami (the gold standard)
  const { data: tatami, error } = await supabase
    .from('restaurants')
    .select('*')
    .ilike('name', '%tatami%')
    .single();

  if (error) {
    console.error('Error fetching Tatami:', error);
    return;
  }

  console.log(`📍 GOLD STANDARD: ${tatami.name}\n`);

  // PART 1: What Apify Returns (Source Data)
  console.log('=' .repeat(80));
  console.log('PART 1: WHAT APIFY RETURNS (SOURCE DATA)');
  console.log('='.repeat(80));

  const apifyFields = Object.keys(tatami.apify_output || {});
  console.log(`\nTotal Apify fields: ${apifyFields.length}\n`);

  console.log('📦 All Apify Fields:');
  apifyFields.sort().forEach(field => {
    const value = tatami.apify_output[field];
    let preview = '';

    if (value === null || value === undefined) {
      preview = '= null';
    } else if (Array.isArray(value)) {
      preview = `= [${value.length} items]`;
    } else if (typeof value === 'object') {
      preview = `= {${Object.keys(value).length} keys}`;
    } else if (typeof value === 'string') {
      preview = `= "${value.substring(0, 60)}${value.length > 60 ? '...' : ''}"`;
    } else if (typeof value === 'number') {
      preview = `= ${value}`;
    } else if (typeof value === 'boolean') {
      preview = `= ${value}`;
    }

    console.log(`  - ${field} ${preview}`);
  });

  // PART 2: What We Store in Database (Destination Schema)
  console.log('\n\n' + '='.repeat(80));
  console.log('PART 2: DATABASE SCHEMA (DESTINATION)');
  console.log('='.repeat(80));

  const dbFields = Object.keys(tatami).filter(f =>
    !['apify_output', 'firecrawl_output', 'firecrawl_menu_output', 'menu_data', 'job_progress', 'error_logs'].includes(f)
  );

  console.log(`\nTotal Database columns: ${dbFields.length}\n`);

  console.log('📊 Database Columns (excluding JSON blobs):');
  dbFields.sort().forEach(field => {
    const value = tatami[field];
    let status = '❌ EMPTY';
    let preview = '';

    if (value !== null && value !== undefined && value !== '' && value !== '[]') {
      status = '✅ HAS DATA';

      if (Array.isArray(value)) {
        preview = `[${value.length} items]`;
      } else if (typeof value === 'object') {
        preview = `{object}`;
      } else if (typeof value === 'string') {
        preview = value.length > 40 ? `"${value.substring(0, 40)}..."` : `"${value}"`;
      } else {
        preview = String(value);
      }
    }

    console.log(`  ${status} ${field}${preview ? ' = ' + preview : ''}`);
  });

  // PART 3: Mapping Analysis
  console.log('\n\n' + '='.repeat(80));
  console.log('PART 3: MAPPING ANALYSIS');
  console.log('='.repeat(80));

  console.log('\n🔍 CRITICAL MAPPING GAPS:\n');

  // Check what's in Apify but NOT in database columns
  const apifyOnlyFields = [
    { apify: 'website', db: 'website', populated: !!tatami.website },
    { apify: 'phone', db: 'phone', populated: !!tatami.phone },
    { apify: 'phoneUnformatted', db: 'phone', populated: !!tatami.phone },
    { apify: 'menu', db: 'menu_url', populated: !!tatami.menu_url },
    { apify: 'openingHours', db: 'hours', populated: !!tatami.hours },
    { apify: 'price', db: 'price_level', populated: !!tatami.price_level },
    { apify: 'totalScore', db: 'google_rating', populated: !!tatami.google_rating },
    { apify: 'reviewsCount', db: 'google_review_count', populated: !!tatami.google_review_count },
    { apify: 'location', db: 'latitude/longitude', populated: !!(tatami.latitude && tatami.longitude) },
    { apify: 'address', db: 'address', populated: !!tatami.address },
    { apify: 'street', db: 'address', populated: !!tatami.address },
    { apify: 'city', db: 'area', populated: !!tatami.area },
    { apify: 'neighborhood', db: 'area', populated: !!tatami.area },
    { apify: 'postalCode', db: null, populated: false },
    { apify: 'additionalInfo', db: 'multiple', populated: false },
    { apify: 'popularTimesHistogram', db: 'busy_times/quiet_times', populated: !!(tatami.busy_times || tatami.quiet_times) },
    { apify: 'questionsAndAnswers', db: null, populated: false },
    { apify: 'reviewsDistribution', db: 'rating_breakdown', populated: !!tatami.rating_breakdown },
    { apify: 'peopleAlsoSearch', db: null, populated: false },
    { apify: 'imageCategories', db: null, populated: false },
    { apify: 'subTitle', db: 'name_ar', populated: !!tatami.name_ar },
  ];

  console.log('Key Apify → Database Mappings:\n');
  apifyOnlyFields.forEach(mapping => {
    const apifyHasData = tatami.apify_output[mapping.apify] !== null &&
                        tatami.apify_output[mapping.apify] !== undefined;

    const emoji = mapping.populated ? '✅' : (apifyHasData ? '⚠️' : '❌');
    const status = mapping.populated ? 'MAPPED' : (apifyHasData ? 'NOT MAPPED' : 'NO DATA');

    console.log(`${emoji} ${mapping.apify} → ${mapping.db || 'NOT USED'} (${status})`);
  });

  // PART 4: AdditionalInfo Deep Dive
  console.log('\n\n' + '='.repeat(80));
  console.log('PART 4: ADDITIONAL INFO BREAKDOWN');
  console.log('='.repeat(80));

  if (tatami.apify_output?.additionalInfo) {
    const additionalInfo = tatami.apify_output.additionalInfo;
    const categories = Object.keys(additionalInfo);

    console.log(`\n📋 ${categories.length} Categories in additionalInfo:\n`);

    categories.forEach(category => {
      const items = additionalInfo[category];
      const itemCount = Array.isArray(items) ? items.length : 0;

      console.log(`\n${category} (${itemCount} items):`);

      if (Array.isArray(items)) {
        items.slice(0, 5).forEach(item => {
          const key = Object.keys(item)[0];
          const value = item[key];
          console.log(`  - ${key}: ${value}`);
        });

        if (itemCount > 5) {
          console.log(`  ... and ${itemCount - 5} more`);
        }
      }
    });

    // Map to database fields
    console.log('\n\n📊 How additionalInfo COULD map to database:\n');

    const additionalInfoMapping = [
      { category: 'Service options', db: 'payment_methods/delivery_options', status: 'COULD MAP' },
      { category: 'Accessibility', db: 'MISSING COLUMN', status: 'NEEDS NEW FIELD' },
      { category: 'Offerings', db: 'MISSING COLUMN', status: 'NEEDS NEW FIELD' },
      { category: 'Dining options', db: 'MISSING COLUMN', status: 'NEEDS NEW FIELD' },
      { category: 'Amenities', db: 'MISSING COLUMN', status: 'NEEDS NEW FIELD' },
      { category: 'Atmosphere', db: 'description/keywords', status: 'COULD ADD TO TEXT' },
      { category: 'Crowd', db: 'good_for relationships', status: 'COULD MAP' },
      { category: 'Planning', db: 'reservations_policy', status: 'PARTIALLY MAPPED' },
      { category: 'Parking', db: 'parking_info', status: 'PARTIALLY MAPPED' },
      { category: 'Payments', db: 'payment_methods', status: 'PARTIALLY MAPPED' },
      { category: 'Children', db: 'good_for relationships', status: 'COULD MAP' },
      { category: 'Popular for', db: 'meal type relationships', status: 'COULD MAP' },
      { category: 'Highlights', db: 'keywords/description', status: 'COULD ADD TO TEXT' },
    ];

    additionalInfoMapping.forEach(mapping => {
      const hasCategory = categories.includes(mapping.category);
      const emoji = hasCategory ? '✅' : '❌';
      console.log(`${emoji} ${mapping.category} → ${mapping.db} (${mapping.status})`);
    });
  }

  // PART 5: Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('PART 5: SUMMARY & RECOMMENDATIONS');
  console.log('='.repeat(80));

  const emptyFields = dbFields.filter(field => {
    const value = tatami[field];
    return value === null || value === undefined || value === '' || value === '[]';
  }).filter(f => !['apify_output', 'firecrawl_output'].includes(f));

  console.log(`\n📊 Statistics:`);
  console.log(`  - Database has ${dbFields.length} columns`);
  console.log(`  - ${dbFields.length - emptyFields.length} fields populated`);
  console.log(`  - ${emptyFields.length} fields EMPTY`);
  console.log(`  - Apify provides ${apifyFields.length} fields`);

  console.log(`\n⚠️  EMPTY Database Fields (${emptyFields.length}):`);
  emptyFields.forEach(field => {
    console.log(`  - ${field}`);
  });

  // Save full analysis
  const analysis = {
    restaurant: tatami.name,
    apifyFields: apifyFields.length,
    databaseFields: dbFields.length,
    populatedFields: dbFields.length - emptyFields.length,
    emptyFields: emptyFields,
    apifyFieldsList: apifyFields,
    mappingGaps: apifyOnlyFields.filter(m => !m.populated && tatami.apify_output[m.apify])
  };

  fs.writeFileSync('field-mapping-analysis.json', JSON.stringify(analysis, null, 2));
  console.log('\n💾 Full analysis saved to: field-mapping-analysis.json');

  console.log('\n' + '='.repeat(80));
})();
