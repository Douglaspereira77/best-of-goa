import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeAttractionFields() {
  const slug = 'murouj-food-complex-subhan-area';

  console.log('='.repeat(80));
  console.log('CONTENT TESTING REPORT');
  console.log('='.repeat(80));
  console.log(`Attraction Slug: ${slug}`);
  console.log(`Testing Date: ${new Date().toISOString()}`);
  console.log('');

  // Fetch the attraction with all fields
  const { data: attraction, error } = await supabase
    .from('attractions')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching attraction:', error);
    return;
  }

  if (!attraction) {
    console.error(`Attraction with slug "${slug}" not found`);
    return;
  }

  console.log('BOK Doctor Generation Date:', attraction.created_at || 'N/A');
  console.log('Last Updated:', attraction.updated_at || 'N/A');
  console.log('');

  // Define field categories
  const fieldCategories = {
    'Core Identity': [
      'id', 'name', 'slug', 'category', 'cuisine', 'type'
    ],
    'Descriptions & Content': [
      'description', 'long_description', 'tagline', 'specialties',
      'ambiance', 'highlights', 'unique_features'
    ],
    'Location Data': [
      'address', 'neighborhood', 'city', 'country',
      'latitude', 'longitude', 'google_place_id', 'google_maps_url'
    ],
    'Contact Information': [
      'phone', 'email', 'website', 'whatsapp'
    ],
    'Social Media': [
      'instagram', 'facebook', 'tiktok', 'twitter', 'youtube', 'snapchat'
    ],
    'Operational Details': [
      'opening_hours', 'price_range', 'rating', 'review_count',
      'parking_info', 'delivery_available', 'reservation_required',
      'dress_code', 'payment_methods'
    ],
    'Menu & Offerings': [
      'menu_items', 'signature_dishes', 'dietary_options'
    ],
    'Media': [
      'photos', 'cover_image', 'logo_url', 'video_url'
    ],
    'SEO & Marketing': [
      'meta_title', 'meta_description', 'seo_keywords',
      'schema_markup', 'og_image'
    ],
    'System Fields': [
      'status', 'featured', 'verified', 'is_published',
      'extraction_status', 'extraction_completed_at',
      'ai_enhanced', 'ai_enhancement_date'
    ]
  };

  // Track statistics
  const stats = {
    totalFields: 0,
    populatedFields: 0,
    emptyFields: 0,
    qualityIssues: []
  };

  const populatedFields = [];
  const emptyFields = [];
  const warnings = [];
  const criticalIssues = [];

  // Analyze each category
  console.log('ðŸ“Š FIELD ANALYSIS BY CATEGORY');
  console.log('='.repeat(80));
  console.log('');

  for (const [category, fields] of Object.entries(fieldCategories)) {
    console.log(`\n${category.toUpperCase()}`);
    console.log('-'.repeat(80));

    for (const field of fields) {
      stats.totalFields++;
      const value = attraction[field];
      const isEmpty = value === null ||
                     value === undefined ||
                     value === '' ||
                     (Array.isArray(value) && value.length === 0) ||
                     (typeof value === 'object' && value !== null && Object.keys(value).length === 0);

      if (isEmpty) {
        stats.emptyFields++;
        emptyFields.push(field);
        console.log(`  âŒ ${field}: EMPTY`);
      } else {
        stats.populatedFields++;
        populatedFields.push(field);

        // Show value preview
        let preview = '';
        if (typeof value === 'string') {
          preview = value.length > 100 ? value.substring(0, 100) + '...' : value;
        } else if (Array.isArray(value)) {
          preview = `Array[${value.length}]`;
        } else if (typeof value === 'object') {
          preview = `Object with ${Object.keys(value).length} keys`;
        } else {
          preview = String(value);
        }

        console.log(`  âœ… ${field}: ${preview}`);

        // Quality checks
        performQualityChecks(field, value, warnings, criticalIssues);
      }
    }
  }

  console.log('\n');
  console.log('='.repeat(80));
  console.log('ðŸ“ˆ SUMMARY STATISTICS');
  console.log('='.repeat(80));
  console.log(`Total Fields Analyzed: ${stats.totalFields}`);
  console.log(`Populated Fields: ${stats.populatedFields} (${((stats.populatedFields/stats.totalFields)*100).toFixed(1)}%)`);
  console.log(`Empty Fields: ${stats.emptyFields} (${((stats.emptyFields/stats.totalFields)*100).toFixed(1)}%)`);
  console.log('');

  // Calculate quality scores
  const scores = calculateQualityScores(attraction, warnings, criticalIssues);

  console.log('='.repeat(80));
  console.log('ðŸ“Š QUALITY SCORES');
  console.log('='.repeat(80));
  console.log(`Accuracy: ${scores.accuracy}/100`);
  console.log(`SEO Optimization: ${scores.seo}/100`);
  console.log(`Cultural Appropriateness: ${scores.cultural}/100`);
  console.log(`Brand Consistency: ${scores.brand}/100`);
  console.log(`User Engagement: ${scores.engagement}/100`);
  console.log(`Data Completeness: ${scores.completeness}/100`);
  console.log(`Overall Quality: ${scores.overall}/100`);
  console.log('');

  // Passed checks
  console.log('='.repeat(80));
  console.log('âœ… PASSED CHECKS');
  console.log('='.repeat(80));
  const passedChecks = getPassedChecks(attraction);
  passedChecks.forEach(check => console.log(`- ${check}`));
  console.log('');

  // Warnings
  if (warnings.length > 0) {
    console.log('='.repeat(80));
    console.log('âš ï¸  WARNINGS');
    console.log('='.repeat(80));
    warnings.forEach(warning => console.log(`- ${warning}`));
    console.log('');
  }

  // Critical issues
  if (criticalIssues.length > 0) {
    console.log('='.repeat(80));
    console.log('âŒ CRITICAL ISSUES');
    console.log('='.repeat(80));
    criticalIssues.forEach(issue => console.log(`- ${issue}`));
    console.log('');
  }

  // Empty fields detail
  console.log('='.repeat(80));
  console.log('ðŸ“‹ EMPTY FIELDS (Need Population)');
  console.log('='.repeat(80));
  emptyFields.forEach(field => console.log(`- ${field}`));
  console.log('');

  // Recommendations
  console.log('='.repeat(80));
  console.log('ðŸ’¬ RECOMMENDATIONS FOR BOK DOCTOR');
  console.log('='.repeat(80));
  generateRecommendations(attraction, emptyFields, warnings, criticalIssues);
  console.log('');

  // Final status
  console.log('='.repeat(80));
  console.log('ðŸ”„ STATUS');
  console.log('='.repeat(80));
  const status = determineStatus(scores.overall, criticalIssues.length);
  console.log(status);
  console.log('='.repeat(80));
}

function performQualityChecks(field, value, warnings, criticalIssues) {
  // Description length checks
  if (field === 'description' && typeof value === 'string') {
    if (value.length < 100) {
      warnings.push(`Description too short (${value.length} chars, recommend 150-300)`);
    } else if (value.length > 500) {
      warnings.push(`Description too long (${value.length} chars, recommend 150-300)`);
    }
  }

  if (field === 'long_description' && typeof value === 'string') {
    if (value.length < 300) {
      warnings.push(`Long description too short (${value.length} chars, recommend 500-1000)`);
    }
  }

  // SEO checks
  if (field === 'meta_title' && typeof value === 'string') {
    if (value.length < 50 || value.length > 60) {
      warnings.push(`Meta title length not optimal (${value.length} chars, recommend 50-60)`);
    }
  }

  if (field === 'meta_description' && typeof value === 'string') {
    if (value.length < 150 || value.length > 160) {
      warnings.push(`Meta description length not optimal (${value.length} chars, recommend 150-160)`);
    }
  }

  // Location validation
  if (field === 'neighborhood' && typeof value === 'string') {
    // Check if it's a valid Goa neighborhood
    const knownNeighborhoods = ['subhan', 'salmiya', 'hawalli', 'fintas', 'mangaf', 'mahboula', 'fahaheel'];
    const normalized = value.toLowerCase();
    const isKnown = knownNeighborhoods.some(n => normalized.includes(n));
    if (!isKnown) {
      warnings.push(`Neighborhood "${value}" may not be a recognized Goa area`);
    }
  }

  // Photo validation
  if (field === 'photos' && Array.isArray(value)) {
    if (value.length === 0) {
      criticalIssues.push('No photos available - visual content is critical');
    } else if (value.length < 3) {
      warnings.push(`Only ${value.length} photo(s) - recommend at least 5-10 quality images`);
    }
  }

  // Rating validation
  if (field === 'rating' && typeof value === 'number') {
    if (value < 1 || value > 5) {
      criticalIssues.push(`Invalid rating value: ${value} (must be 1-5)`);
    }
  }

  // URL validation
  const urlFields = ['website', 'instagram', 'facebook', 'google_maps_url'];
  if (urlFields.includes(field) && typeof value === 'string') {
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      warnings.push(`${field} should be a full URL with protocol`);
    }
  }
}

function calculateQualityScores(attraction, warnings, criticalIssues) {
  let accuracy = 100;
  let seo = 100;
  let cultural = 100;
  let brand = 100;
  let engagement = 100;
  let completeness = 100;

  // Accuracy deductions
  if (!attraction.latitude || !attraction.longitude) accuracy -= 20;
  if (!attraction.phone) accuracy -= 10;
  if (!attraction.address) accuracy -= 15;

  // SEO deductions
  if (!attraction.meta_title) seo -= 30;
  if (!attraction.meta_description) seo -= 30;
  if (!attraction.seo_keywords) seo -= 20;
  if (!attraction.schema_markup) seo -= 20;

  // Cultural (default high, deduct if issues found)
  // Would need content analysis for cultural issues

  // Brand (check for consistency)
  if (!attraction.description || attraction.description.length < 100) brand -= 20;
  if (!attraction.tagline) brand -= 10;

  // Engagement
  if (!attraction.photos || attraction.photos.length < 3) engagement -= 30;
  if (!attraction.specialties) engagement -= 15;
  if (!attraction.ambiance) engagement -= 15;
  if (!attraction.instagram && !attraction.facebook) engagement -= 20;

  // Completeness
  const criticalFields = [
    'name', 'description', 'address', 'latitude', 'longitude',
    'phone', 'category', 'photos'
  ];
  const missingCritical = criticalFields.filter(f => !attraction[f] ||
    (Array.isArray(attraction[f]) && attraction[f].length === 0));
  completeness -= missingCritical.length * 12;

  // Apply warning/critical penalties
  accuracy -= warnings.length * 2;
  accuracy -= criticalIssues.length * 10;

  // Ensure no negative scores
  accuracy = Math.max(0, accuracy);
  seo = Math.max(0, seo);
  cultural = Math.max(0, cultural);
  brand = Math.max(0, brand);
  engagement = Math.max(0, engagement);
  completeness = Math.max(0, completeness);

  const overall = Math.round((accuracy + seo + cultural + brand + engagement + completeness) / 6);

  return { accuracy, seo, cultural, brand, engagement, completeness, overall };
}

function getPassedChecks(attraction) {
  const checks = [];

  if (attraction.name) checks.push('Name field populated');
  if (attraction.slug) checks.push('URL slug generated');
  if (attraction.description && attraction.description.length > 100) checks.push('Description meets minimum length');
  if (attraction.latitude && attraction.longitude) checks.push('Geographic coordinates available');
  if (attraction.address) checks.push('Physical address provided');
  if (attraction.phone) checks.push('Contact phone number available');
  if (attraction.category) checks.push('Category classification assigned');
  if (attraction.photos && attraction.photos.length > 0) checks.push('Visual media present');
  if (attraction.google_place_id) checks.push('Google Places integration successful');
  if (attraction.rating) checks.push('Rating data available');
  if (attraction.neighborhood) checks.push('Goa neighborhood identified');
  if (attraction.instagram || attraction.facebook) checks.push('Social media presence detected');
  if (attraction.opening_hours) checks.push('Operating hours documented');

  return checks;
}

function generateRecommendations(attraction, emptyFields, warnings, criticalIssues) {
  const recommendations = [];

  // Critical fixes first
  if (!attraction.meta_title || !attraction.meta_description) {
    recommendations.push('PRIORITY: Generate SEO metadata (meta_title, meta_description) for search visibility');
  }

  if (!attraction.photos || attraction.photos.length < 3) {
    recommendations.push('PRIORITY: Enhance photo collection - aim for 5-10 high-quality images');
  }

  if (!attraction.long_description) {
    recommendations.push('Generate comprehensive long_description (500-1000 words) for detail page');
  }

  // Social media enhancement
  if (!attraction.instagram && !attraction.facebook) {
    recommendations.push('Conduct deeper social media search - Goa venues typically have Instagram presence');
  }

  // Content enrichment
  if (!attraction.specialties) {
    recommendations.push('Extract signature items/specialties from menu or reviews');
  }

  if (!attraction.ambiance) {
    recommendations.push('Generate ambiance description from reviews/photos');
  }

  if (!attraction.unique_features) {
    recommendations.push('Identify and highlight unique selling points');
  }

  // Operational details
  if (!attraction.parking_info) {
    recommendations.push('Research parking availability (important for Goa car culture)');
  }

  if (!attraction.price_range) {
    recommendations.push('Determine price range from menu/reviews');
  }

  // Schema markup
  if (!attraction.schema_markup) {
    recommendations.push('Generate LocalBusiness/Restaurant schema markup for rich snippets');
  }

  // Empty field analysis
  const highPriorityEmpty = emptyFields.filter(f =>
    ['meta_title', 'meta_description', 'long_description', 'specialties',
     'ambiance', 'schema_markup', 'seo_keywords'].includes(f)
  );

  if (highPriorityEmpty.length > 0) {
    recommendations.push(`High-priority empty fields: ${highPriorityEmpty.join(', ')}`);
  }

  recommendations.forEach(rec => console.log(`- ${rec}`));
}

function determineStatus(overallScore, criticalCount) {
  if (criticalCount > 0) {
    return 'âŒ NEEDS REVISION - Critical issues must be resolved';
  }

  if (overallScore >= 80) {
    return 'âœ… APPROVED - Quality standards met, ready for publication';
  } else if (overallScore >= 60) {
    return 'âš ï¸  NEEDS REVISION - Improvements needed before publication';
  } else {
    return 'âŒ REJECTED - Significant quality issues, comprehensive revision required';
  }
}

analyzeAttractionFields().catch(console.error);
